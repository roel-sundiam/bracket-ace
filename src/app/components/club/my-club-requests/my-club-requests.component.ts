import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClubService } from '../../../services/club.service';
import { ClubRequest } from '../../../graphql/types';

@Component({
  selector: 'app-my-club-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-club-requests.component.html',
  styleUrl: './my-club-requests.component.css'
})
export class MyClubRequestsComponent implements OnInit {
  clubRequests: ClubRequest[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.loadMyClubRequests();
  }

  loadMyClubRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clubService.getMyClubRequests().subscribe({
      next: (requests) => {
        console.log('Club requests loaded:', requests);
        this.clubRequests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading club requests:', error);
        this.errorMessage = error.message || 'Failed to load your club requests';
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
