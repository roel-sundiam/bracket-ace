import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClubService } from '../../../services/club.service';
import { Club, ClubMembership } from '../../../graphql/types';
import { CardComponent } from '../../ui/card/card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { SpinnerComponent } from '../../ui/loading/spinner/spinner.component';

@Component({
  selector: 'app-club-members',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    SpinnerComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      @if (loading()) {
        <div class="flex justify-center py-12">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Club Members</h1>
              @if (club()) {
                <p class="mt-2 text-gray-600">{{ club()!.name }} - {{ club()!.memberCount }} members</p>
              }
            </div>
            <app-button
              (click)="router.navigate(['/club/dashboard'])"
              variant="outline">
              Back to Dashboard
            </app-button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <button
              (click)="activeTab.set('members')"
              [class]="activeTab() === 'members' 
                ? 'border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'">
              Active Members ({{ members().length }})
            </button>
            <button
              (click)="activeTab.set('requests')"
              [class]="activeTab() === 'requests' 
                ? 'border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'">
              Pending Requests ({{ membershipRequests().length }})
            </button>
          </nav>
        </div>

        <!-- Active Members Tab -->
        @if (activeTab() === 'members') {
          <div class="space-y-4">
            @if (members().length > 0) {
              @for (membership of members(); track membership.id) {
                <app-card>
                  <div class="p-6">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span class="text-lg font-medium text-blue-600">
                            {{ membership.user.firstName.charAt(0) }}{{ membership.user.lastName.charAt(0) }}
                          </span>
                        </div>
                        <div>
                          <h3 class="text-lg font-semibold text-gray-900">
                            {{ membership.user.firstName }} {{ membership.user.lastName }}
                          </h3>
                          <p class="text-gray-600">{{ membership.user.email }}</p>
                          <div class="flex items-center space-x-4 mt-1">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {{ membership.status | titlecase }}
                            </span>
                            <span class="text-sm text-gray-500">
                              Joined {{ membership.approvedAt | date:'mediumDate' }}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center space-x-2">
                        <app-button
                          variant="outline"
                          size="sm"
                          (click)="viewMemberDetails(membership.user.id)">
                          View Details
                        </app-button>
                        <!-- Add more actions here if needed -->
                      </div>
                    </div>
                  </div>
                </app-card>
              }
            } @else {
              <app-card>
                <div class="p-8 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <h3 class="mt-4 text-lg font-medium text-gray-900">No members yet</h3>
                  <p class="mt-2 text-gray-500">This club doesn't have any approved members yet.</p>
                </div>
              </app-card>
            }
          </div>
        }

        <!-- Pending Requests Tab -->
        @if (activeTab() === 'requests') {
          <div class="space-y-4">
            @if (membershipRequests().length > 0) {
              @for (request of membershipRequests(); track request.id) {
                <app-card>
                  <div class="p-6">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span class="text-lg font-medium text-yellow-600">
                            {{ request.user.firstName.charAt(0) }}{{ request.user.lastName.charAt(0) }}
                          </span>
                        </div>
                        <div>
                          <h3 class="text-lg font-semibold text-gray-900">
                            {{ request.user.firstName }} {{ request.user.lastName }}
                          </h3>
                          <p class="text-gray-600">{{ request.user.email }}</p>
                          <div class="flex items-center space-x-4 mt-1">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {{ request.status | titlecase }}
                            </span>
                            <span class="text-sm text-gray-500">
                              Requested {{ request.requestedAt | date:'mediumDate' }}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center space-x-2">
                        <app-button
                          variant="primary"
                          size="sm"
                          (click)="approveMembership(request.id)"
                          [disabled]="processingRequest() === request.id">
                          @if (processingRequest() === request.id) {
                            Approving...
                          } @else {
                            Approve
                          }
                        </app-button>
                        <app-button
                          variant="secondary"
                          size="sm"
                          (click)="rejectMembership(request.id)"
                          [disabled]="processingRequest() === request.id">
                          @if (processingRequest() === request.id) {
                            Rejecting...
                          } @else {
                            Reject
                          }
                        </app-button>
                      </div>
                    </div>
                  </div>
                </app-card>
              }
            } @else {
              <app-card>
                <div class="p-8 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 class="mt-4 text-lg font-medium text-gray-900">No pending requests</h3>
                  <p class="mt-2 text-gray-500">There are no membership requests waiting for approval.</p>
                </div>
              </app-card>
            }
          </div>
        }
      }
    </div>
  `
})
export class ClubMembersComponent implements OnInit {
  club = signal<Club | null>(null);
  members = signal<ClubMembership[]>([]);
  membershipRequests = signal<ClubMembership[]>([]);
  loading = signal(true);
  activeTab = signal<'members' | 'requests'>('members');
  processingRequest = signal<string | null>(null);

  private clubId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private clubService: ClubService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.clubId = params.get('id');
      if (this.clubId) {
        this.loadClubData();
      }
    });
  }

  private loadClubData(): void {
    if (!this.clubId) return;

    this.loading.set(true);

    // Load club details
    this.clubService.getClub(this.clubId).subscribe({
      next: (club) => {
        this.club.set(club);
      },
      error: (error) => {
        console.error('Error loading club:', error);
      }
    });

    // Load club members
    this.clubService.getClubMembers(this.clubId).subscribe({
      next: (members) => {
        this.members.set(members);
      },
      error: (error) => {
        console.error('Error loading club members:', error);
      }
    });

    // Load membership requests
    this.clubService.getClubMembershipRequests(this.clubId).subscribe({
      next: (requests) => {
        this.membershipRequests.set(requests);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading membership requests:', error);
        this.loading.set(false);
      }
    });
  }

  approveMembership(membershipId: string): void {
    this.processingRequest.set(membershipId);

    this.clubService.approveClubMembership(membershipId).subscribe({
      next: (approvedMembership) => {
        // Remove from requests and add to members
        const currentRequests = this.membershipRequests();
        const currentMembers = this.members();
        
        this.membershipRequests.set(
          currentRequests.filter(req => req.id !== membershipId)
        );
        this.members.set([...currentMembers, approvedMembership]);
        
        this.processingRequest.set(null);
      },
      error: (error) => {
        console.error('Error approving membership:', error);
        this.processingRequest.set(null);
      }
    });
  }

  rejectMembership(membershipId: string): void {
    this.processingRequest.set(membershipId);

    this.clubService.rejectClubMembership(membershipId).subscribe({
      next: () => {
        // Remove from requests
        const currentRequests = this.membershipRequests();
        this.membershipRequests.set(
          currentRequests.filter(req => req.id !== membershipId)
        );
        
        this.processingRequest.set(null);
      },
      error: (error) => {
        console.error('Error rejecting membership:', error);
        this.processingRequest.set(null);
      }
    });
  }

  viewMemberDetails(userId: string): void {
    // Navigate to member details page or open modal
    // Implementation depends on your requirements
    console.log('View member details:', userId);
  }
}