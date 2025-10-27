import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { RegisterInput } from '../../../graphql/types';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/form/input/input.component';
import { CardComponent } from '../../ui/card/card.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    InputComponent,
    CardComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Or 
            <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </a>
          </p>
        </div>

        <app-card>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <app-input
                  label="First Name"
                  type="text"
                  formControlName="firstName"
                  placeholder="Enter your first name"
                  [error]="getFieldError('firstName')"
                  [required]="true">
                </app-input>

                <app-input
                  label="Last Name"
                  type="text"
                  formControlName="lastName"
                  placeholder="Enter your last name"
                  [error]="getFieldError('lastName')"
                  [required]="true">
                </app-input>
              </div>

              <div>
                <label for="gender" class="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span class="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  formControlName="gender"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  [class.border-red-500]="getFieldError('gender')">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                @if (getFieldError('gender')) {
                  <p class="mt-1 text-sm text-red-600">{{ getFieldError('gender') }}</p>
                }
              </div>

              <app-input
                label="Email address"
                type="email"
                formControlName="email"
                placeholder="Enter your email"
                [error]="getFieldError('email')"
                [required]="true">
              </app-input>

              <app-input
                label="Password"
                type="password"
                formControlName="password"
                placeholder="Enter your password"
                [error]="getFieldError('password')"
                [required]="true">
              </app-input>

              <app-input
                label="Confirm Password"
                type="password"
                formControlName="confirmPassword"
                placeholder="Confirm your password"
                [error]="getFieldError('confirmPassword')"
                [required]="true">
              </app-input>
            </div>

            @if (errorMessage()) {
              <div class="rounded-md bg-red-50 p-4">
                <div class="text-sm text-red-800">
                  {{ errorMessage() }}
                </div>
              </div>
            }

            <app-button
              type="submit"
              [disabled]="registerForm.invalid || loading()"
              [loading]="loading()"
              class="w-full">
              Create account
            </app-button>
          </form>
        </app-card>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { confirmPassword, ...userData } = this.registerForm.value;
    const registerData: RegisterInput = userData;

    this.authService.register(registerData).subscribe({
      next: (authPayload) => {
        this.loading.set(false);
        // Redirect to dashboard (members start as regular members)
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.graphQLErrors?.[0]?.message || 
          'Registration failed. Please try again.'
        );
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      gender: 'Gender',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }
}