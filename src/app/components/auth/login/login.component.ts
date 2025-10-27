import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { LoginInput } from '../../../graphql/types';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/form/input/input.component';
import { CardComponent } from '../../ui/card/card.component';

@Component({
  selector: 'app-login',
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
    <!-- Modern Login Page -->
    <div class="login-page">
      <!-- Left Panel - Brand & Welcome -->
      <div class="brand-panel">
        <div class="brand-content">
          <!-- Logo Section -->
          <div class="brand-logo">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 class="brand-name">BracketAce</h1>
          </div>

          <!-- Welcome Text -->
          <div class="welcome-text">
            <h2 class="welcome-title">Tournament Management Made Simple</h2>
            <p class="welcome-description">
              Streamline your tennis tournaments with powerful tools for organizing,
              managing brackets, and tracking player performance.
            </p>
          </div>

          <!-- Features List -->
          <div class="features-list">
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span>Automated bracket generation</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span>Real-time score tracking</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span>Player performance analytics</span>
            </div>
          </div>

          <!-- Decorative Elements -->
          <div class="decorative-circles">
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="form-panel">
        <div class="form-container">
          <!-- Login Header -->
          <div class="form-header">
            <h2 class="form-title">Welcome Back</h2>
            <p class="form-subtitle">Sign in to continue to your account</p>
          </div>

          <!-- Login Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Email Input -->
            <div class="form-group">
              <app-input
                label="Email Address"
                type="email"
                formControlName="email"
                placeholder="you@example.com"
                [error]="getFieldError('email')"
                [required]="true">
              </app-input>
            </div>

            <!-- Password Input -->
            <div class="form-group">
              <app-input
                label="Password"
                type="password"
                formControlName="password"
                placeholder="Enter your password"
                [error]="getFieldError('password')"
                [required]="true">
              </app-input>
            </div>

            <!-- Remember & Forgot -->
            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="remember-me" name="remember-me" class="checkbox-input">
                <span class="checkbox-text">Remember me</span>
              </label>
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="error-alert">
                <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <span class="error-text">{{ errorMessage() }}</span>
              </div>
            }

            <!-- Submit Button -->
            <app-button
              type="submit"
              variant="primary"
              size="lg"
              [disabled]="loginForm.invalid || loading()"
              [loading]="loading()"
              class="submit-button">
              Sign In
            </app-button>
          </form>

          <!-- Register Link -->
          <div class="register-link">
            <span class="register-text">Don't have an account?</span>
            <a routerLink="/register" class="register-button">Create Account</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modern Login Page Styles */
    .login-page {
      display: flex;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Left Panel - Brand Section */
    .brand-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .brand-content {
      max-width: 500px;
      z-index: 10;
      position: relative;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 3rem;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      color: white;
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;
    }

    .brand-name {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      color: white;
    }

    .welcome-text {
      margin-bottom: 3rem;
    }

    .welcome-title {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 1.5rem 0;
      color: white;
    }

    .welcome-description {
      font-size: 1.125rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.95);
      font-size: 1rem;
    }

    .feature-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    /* Decorative Circles */
    .decorative-circles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .circle-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      right: -50px;
      animation: float 6s ease-in-out infinite;
    }

    .circle-2 {
      width: 200px;
      height: 200px;
      bottom: 50px;
      left: -50px;
      animation: float 8s ease-in-out infinite;
      animation-delay: 1s;
    }

    .circle-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 10%;
      animation: float 7s ease-in-out infinite;
      animation-delay: 2s;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      50% {
        transform: translateY(-20px) translateX(10px);
      }
    }

    /* Right Panel - Form Section */
    .form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: #ffffff;
    }

    .form-container {
      width: 100%;
      max-width: 440px;
    }

    .form-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .form-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .form-subtitle {
      font-size: 1rem;
      color: #718096;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      width: 100%;
    }

    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: -0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-input {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 2px solid #cbd5e0;
      cursor: pointer;
      transition: all 0.2s;
    }

    .checkbox-input:checked {
      background-color: #667eea;
      border-color: #667eea;
    }

    .checkbox-text {
      font-size: 0.875rem;
      color: #4a5568;
    }

    .forgot-link {
      font-size: 0.875rem;
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .forgot-link:hover {
      color: #5a67d8;
    }

    .error-alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #fff5f5;
      border: 1px solid #feb2b2;
      border-radius: 8px;
    }

    .error-icon {
      width: 20px;
      height: 20px;
      color: #f56565;
      flex-shrink: 0;
    }

    .error-text {
      font-size: 0.875rem;
      color: #c53030;
      line-height: 1.5;
    }

    .submit-button {
      width: 100%;
      margin-top: 0.5rem;
    }

    .register-link {
      margin-top: 2rem;
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid #e2e8f0;
    }

    .register-text {
      font-size: 0.875rem;
      color: #718096;
      margin-right: 0.5rem;
    }

    .register-button {
      font-size: 0.875rem;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .register-button:hover {
      color: #5a67d8;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .brand-panel {
        display: none;
      }

      .form-panel {
        flex: 1;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .form-container {
        background: white;
        padding: 2.5rem;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }
    }

    @media (max-width: 640px) {
      .form-panel {
        padding: 1.5rem;
      }

      .form-container {
        padding: 2rem 1.5rem;
      }

      .form-title {
        font-size: 1.75rem;
      }

      .social-buttons {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginInput = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (authPayload) => {
        this.loading.set(false);
        // Redirect based on user role
        this.redirectToDashboard(authPayload.user.role);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.graphQLErrors?.[0]?.message || 
          'Login failed. Please check your credentials and try again.'
        );
      }
    });
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'superadmin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'club_admin':
        this.router.navigate(['/club/dashboard']);
        break;
      case 'member':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    
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

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}