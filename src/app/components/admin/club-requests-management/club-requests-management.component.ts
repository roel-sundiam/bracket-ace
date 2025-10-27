import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from '../../../services/club.service';
import { ClubRequest } from '../../../graphql/types';
import { ConfirmationModalComponent } from '../../ui/modal/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-club-requests-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './club-requests-management.component.html',
  styleUrl: './club-requests-management.component.css'
})
export class ClubRequestsManagementComponent implements OnInit {
  clubRequests: ClubRequest[] = [];
  filteredRequests: ClubRequest[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

  // Approve confirmation modal state
  showApproveModal = false;
  pendingApprovalRequestId = '';
  pendingApprovalRequestName = '';
  isApproving = false;

  // Reject modal state
  showRejectModal = false;
  selectedRequestId = '';
  rejectionReason = '';

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.loadClubRequests();
  }

  loadClubRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clubService.getClubRequests().subscribe({
      next: (requests) => {
        this.clubRequests = requests;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load club requests';
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.filteredRequests = this.clubRequests;
    } else {
      this.filteredRequests = this.clubRequests.filter(
        req => req.status === this.filterStatus
      );
    }
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  openApproveModal(requestId: string, requestName: string): void {
    this.pendingApprovalRequestId = requestId;
    this.pendingApprovalRequestName = requestName;
    this.showApproveModal = true;
  }

  closeApproveModal(): void {
    this.showApproveModal = false;
    this.pendingApprovalRequestId = '';
    this.pendingApprovalRequestName = '';
    this.isApproving = false;
  }

  confirmApprove(): void {
    if (!this.pendingApprovalRequestId) return;

    this.isApproving = true;

    this.clubService.approveClubRequest(this.pendingApprovalRequestId).subscribe({
      next: (club) => {
        this.successMessage = `Club "${club.name}" has been created successfully!`;
        this.closeApproveModal();
        this.loadClubRequests();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to approve request';
        this.isApproving = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  openRejectModal(requestId: string): void {
    this.selectedRequestId = requestId;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedRequestId = '';
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.selectedRequestId) return;

    this.clubService.rejectClubRequest(this.selectedRequestId, this.rejectionReason).subscribe({
      next: (request) => {
        this.successMessage = `Club request "${request.name}" has been rejected`;
        this.closeRejectModal();
        this.loadClubRequests();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to reject request';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getApproveMessage(): string {
    return `Are you sure you want to approve the club "${this.pendingApprovalRequestName}"? The requesting user will become the club admin.`;
  }
}
