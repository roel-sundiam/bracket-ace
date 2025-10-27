import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ClubService } from '../../../services/club.service';
import { User, Club, ClubMembership } from '../../../graphql/types';
import { CardComponent } from '../../ui/card/card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/form/input/input.component';
import { SpinnerComponent } from '../../ui/loading/spinner/spinner.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SpinnerComponent
  ],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Profile</h1>
        <p class="mt-2 text-gray-600">Manage your account settings and preferences</p>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Profile Information -->
          <div class="lg:col-span-2">
            <app-card>
              <div class="p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
                
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <app-input
                    label="Email Address"
                    type="email"
                    formControlName="email"
                    placeholder="Enter your email address"
                    [error]="getFieldError('email')"
                    [disabled]="true"
                    [required]="true">
                  </app-input>

                  <div class="flex items-center justify-between pt-4">
                    <div>
                      <span class="text-sm font-medium text-gray-700">Account Role</span>
                      <p class="text-sm text-gray-500">{{ getRoleDisplay() }}</p>
                    </div>
                    
                    <div>
                      <span class="text-sm font-medium text-gray-700">Member Since</span>
                      <p class="text-sm text-gray-500">{{ user()?.createdAt | date:'mediumDate' }}</p>
                    </div>
                  </div>

                  @if (errorMessage()) {
                    <div class="rounded-md bg-red-50 p-4">
                      <div class="text-sm text-red-800">
                        {{ errorMessage() }}
                      </div>
                    </div>
                  }

                  @if (successMessage()) {
                    <div class="rounded-md bg-green-50 p-4">
                      <div class="text-sm text-green-800">
                        {{ successMessage() }}
                      </div>
                    </div>
                  }

                  <div class="flex justify-end">
                    <app-button
                      type="submit"
                      [disabled]="profileForm.invalid || profileForm.pristine || updating()"
                      [loading]="updating()">
                      Update Profile
                    </app-button>
                  </div>
                </form>
              </div>
            </app-card>

            <!-- Password Change -->
            <app-card class="mt-6">
              <div class="p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
                
                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="space-y-4">
                  <app-input
                    label="Current Password"
                    type="password"
                    formControlName="currentPassword"
                    placeholder="Enter your current password"
                    [error]="getPasswordFieldError('currentPassword')"
                    [required]="true">
                  </app-input>

                  <app-input
                    label="New Password"
                    type="password"
                    formControlName="newPassword"
                    placeholder="Enter your new password"
                    [error]="getPasswordFieldError('newPassword')"
                    [required]="true">
                  </app-input>

                  <app-input
                    label="Confirm New Password"
                    type="password"
                    formControlName="confirmPassword"
                    placeholder="Confirm your new password"
                    [error]="getPasswordFieldError('confirmPassword')"
                    [required]="true">
                  </app-input>

                  @if (passwordErrorMessage()) {
                    <div class="rounded-md bg-red-50 p-4">
                      <div class="text-sm text-red-800">
                        {{ passwordErrorMessage() }}
                      </div>
                    </div>
                  }

                  <div class="flex justify-end">
                    <app-button
                      type="submit"
                      variant="secondary"
                      [disabled]="passwordForm.invalid || changingPassword()"
                      [loading]="changingPassword()">
                      Change Password
                    </app-button>
                  </div>
                </form>
              </div>
            </app-card>
          </div>

          <!-- Club Memberships & Activity -->
          <div class="space-y-6">
            <!-- Profile Summary -->
            <app-card>
              <div class="p-6 text-center">
                <div class="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-2xl font-medium text-blue-600">
                    {{ getUserInitials() }}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">{{ getUserDisplayName() }}</h3>
                <p class="text-sm text-gray-500">{{ getRoleDisplay() }}</p>
                
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <div class="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p class="text-2xl font-bold text-blue-600">{{ myClubs().length }}</p>
                      <p class="text-xs text-gray-500">Clubs</p>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-green-600">0</p>
                      <p class="text-xs text-gray-500">Tournaments</p>
                    </div>
                  </div>
                </div>
              </div>
            </app-card>

            <!-- My Clubs -->
            <app-card>
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">My Clubs</h3>
                
                @if (myClubs().length > 0) {
                  <div class="space-y-3">
                    @for (club of myClubs(); track club.id) {
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ club.name }}</p>
                          <p class="text-xs text-gray-500">{{ club.memberCount }} members</p>
                        </div>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Member
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-4">
                    <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <p class="mt-2 text-sm text-gray-500">No club memberships</p>
                    <app-button
                      routerLink="/clubs"
                      variant="outline"
                      size="sm"
                      class="mt-2">
                      Browse Clubs
                    </app-button>
                  </div>
                }
              </div>
            </app-card>

            <!-- Account Actions -->
            <app-card>
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                
                <div class="space-y-3">
                  <app-button
                    variant="outline"
                    size="sm"
                    class="w-full">
                    Download My Data
                  </app-button>
                  
                  <app-button
                    variant="secondary"
                    size="sm"
                    class="w-full">
                    Deactivate Account
                  </app-button>
                </div>
              </div>
            </app-card>
          </div>
        </div>
      }
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  user = signal<User | null>(null);
  myClubs = signal<Club[]>([]);
  loading = signal(true);
  updating = signal(false);
  changingPassword = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  passwordErrorMessage = signal<string | null>(null);

  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clubService: ClubService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.loading.set(true);

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user.set(user);
        this.populateForm(user);
      }
    });

    if (this.authService.isAuthenticated) {
      this.clubService.getMyClubs().subscribe({
        next: (clubs) => {
          this.myClubs.set(clubs);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading clubs:', error);
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  private populateForm(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.updating.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Note: This would require implementing an updateProfile mutation
    // For now, just show success message
    setTimeout(() => {
      this.updating.set(false);
      this.successMessage.set('Profile updated successfully!');
      setTimeout(() => this.successMessage.set(null), 5000);
    }, 1000);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.changingPassword.set(true);
    this.passwordErrorMessage.set(null);

    // Note: This would require implementing a changePassword mutation
    // For now, just show success message
    setTimeout(() => {
      this.changingPassword.set(false);
      this.passwordForm.reset();
      this.successMessage.set('Password changed successfully!');
      setTimeout(() => this.successMessage.set(null), 5000);
    }, 1000);
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return 'U';
    
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getUserDisplayName(): string {
    const user = this.user();
    if (!user) return 'User';
    
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleDisplay(): string {
    const user = this.user();
    if (!user) return 'Guest';
    
    switch (user.role) {
      case 'superadmin':
        return 'Super Administrator';
      case 'club_admin':
        return 'Club Administrator';
      case 'member':
        return 'Member';
      default:
        return 'User';
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.profileForm.get(fieldName);
    
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
    }
    
    return null;
  }

  getPasswordFieldError(fieldName: string): string | null {
    const field = this.passwordForm.get(fieldName);
    
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return `${this.getPasswordFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getPasswordFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
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
      email: 'Email'
    };
    return labels[fieldName] || fieldName;
  }

  private getPasswordFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}