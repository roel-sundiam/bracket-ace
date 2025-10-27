import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClubService } from '../../../services/club.service';

@Component({
  selector: 'app-club-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './club-request-form.component.html',
  styleUrl: './club-request-form.component.css'
})
export class ClubRequestFormComponent {
  requestForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private clubService: ClubService,
    private router: Router
  ) {
    this.requestForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.clubService.requestClubCreation(this.requestForm.value).subscribe({
      next: (clubRequest) => {
        this.isSubmitting = false;
        this.successMessage = 'Club creation request submitted successfully! You will be notified once it is reviewed.';
        this.requestForm.reset();

        // Redirect to user's club requests page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/clubs/my-requests']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Failed to submit club request. Please try again.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/clubs']);
  }
}
