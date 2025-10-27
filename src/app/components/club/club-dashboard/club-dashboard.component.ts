import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClubService } from '../../../services/club.service';
import { AuthService } from '../../../services/auth.service';
import { Club, ClubMembership } from '../../../graphql/types';
import { CardComponent } from '../../ui/card/card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { SpinnerComponent } from '../../ui/loading/spinner/spinner.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-club-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    SpinnerComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Club Dashboard</h1>
        <p class="mt-2 text-gray-600">Manage your club members and tournaments</p>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- Debug info -->
        @if (clubs().length === 0) {
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p class="text-yellow-800">
              <strong>Debug:</strong> No clubs found. This could mean:
            </p>
            <ul class="list-disc list-inside text-yellow-700 mt-2">
              <li>You haven't been assigned as a club admin yet</li>
              <li>You need to log out and log back in to refresh your session</li>
              <li>The clubs exist but aren't being returned by the API</li>
            </ul>
            <p class="text-yellow-700 mt-2">Check the browser console for "Loaded clubs:" message.</p>
          </div>
        }

        <!-- My Clubs Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          @for (club of clubs(); track club.id) {
            <app-card>
              <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-900">{{ club.name }}</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                
                @if (club.description) {
                  <p class="text-gray-600 text-sm mb-4">{{ club.description }}</p>
                }
                
                <div class="space-y-2 mb-4">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Members:</span>
                    <span class="font-medium">{{ club.memberCount }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Pending Requests:</span>
                    <span class="font-medium text-yellow-600">{{ getPendingRequestsCount(club.id) }}</span>
                  </div>
                </div>

                <div class="flex flex-col space-y-2">
                  <div class="flex space-x-2">
                    <app-button
                      [routerLink]="['/club', club.id, 'members']"
                      variant="outline"
                      size="sm"
                      class="flex-1">
                      Manage Members
                    </app-button>
                    <app-button
                      [routerLink]="['/club', club.id, 'players']"
                      variant="outline"
                      size="sm"
                      class="flex-1">
                      Club Players
                    </app-button>
                  </div>
                  <app-button
                    [routerLink]="['/club', club.id, 'tournaments']"
                    variant="outline"
                    size="sm"
                    class="w-full">
                    Tournaments
                  </app-button>
                </div>
              </div>
            </app-card>
          }
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Membership Requests Card -->
          <app-card>
            <div class="p-6 text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Pending Requests</h3>
              <p class="text-3xl font-bold text-yellow-600 mb-2">{{ getTotalPendingRequests() }}</p>
              <p class="text-sm text-gray-500">Membership requests awaiting approval</p>
            </div>
          </app-card>

          <!-- Total Members Card -->
          <app-card>
            <div class="p-6 text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Members</h3>
              <p class="text-3xl font-bold text-blue-600 mb-2">{{ getTotalMembers() }}</p>
              <p class="text-sm text-gray-500">Active club members</p>
            </div>
          </app-card>

          <!-- Active Clubs Card -->
          <app-card>
            <div class="p-6 text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">My Clubs</h3>
              <p class="text-3xl font-bold text-green-600 mb-2">{{ clubs().length }}</p>
              <p class="text-sm text-gray-500">Clubs you manage</p>
            </div>
          </app-card>

          <!-- Quick Actions Card -->
          <app-card>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div class="space-y-2">
                <app-button
                  routerLink="/tournaments/create"
                  variant="outline"
                  size="sm"
                  class="w-full">
                  Create Tournament
                </app-button>
                <app-button
                  routerLink="/club/members"
                  variant="outline"
                  size="sm"
                  class="w-full">
                  View All Members
                </app-button>
              </div>
            </div>
          </app-card>
        </div>

        <!-- Recent Activity -->
        <app-card>
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            @if (recentMembershipRequests().length > 0) {
              <div class="space-y-3">
                @for (request of recentMembershipRequests(); track request.id) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-600">
                          {{ request.user.firstName.charAt(0) }}{{ request.user.lastName.charAt(0) }}
                        </span>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {{ request.user.firstName }} {{ request.user.lastName }}
                        </p>
                        <p class="text-xs text-gray-500">
                          Requested to join {{ request.club.name }}
                        </p>
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      <app-button
                        (click)="approveMembership(request.id)"
                        variant="primary"
                        size="sm">
                        Approve
                      </app-button>
                      <app-button
                        (click)="rejectMembership(request.id)"
                        variant="secondary"
                        size="sm">
                        Reject
                      </app-button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500 text-center py-4">No recent membership requests</p>
            }
          </div>
        </app-card>
      }
    </div>
  `
})
export class ClubDashboardComponent implements OnInit {
  clubs = signal<Club[]>([]);
  membershipRequests = signal<ClubMembership[]>([]);
  loading = signal(true);

  constructor(
    private clubService: ClubService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    // Load clubs managed by this admin
    this.clubService.getMyClubs().subscribe({
      next: (clubs) => {
        console.log('Loaded clubs:', clubs);
        this.clubs.set(clubs);
        this.loadMembershipRequests(clubs);
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.loading.set(false);
      }
    });
  }

  private loadMembershipRequests(clubs: Club[]): void {
    if (clubs.length === 0) {
      this.loading.set(false);
      return;
    }

    // For now, just set loading to false and skip membership requests
    // This prevents the Apollo client error
    this.loading.set(false);
    this.membershipRequests.set([]);

    // TODO: Fix membership requests loading
    // The issue is related to Apollo Client cache/query management
    console.log('Membership requests loading temporarily disabled');
  }

  approveMembership(membershipId: string): void {
    this.clubService.approveClubMembership(membershipId).subscribe({
      next: () => {
        // Remove from pending requests
        const currentRequests = this.membershipRequests();
        this.membershipRequests.set(
          currentRequests.filter(req => req.id !== membershipId)
        );
      },
      error: (error) => {
        console.error('Error approving membership:', error);
      }
    });
  }

  rejectMembership(membershipId: string): void {
    this.clubService.rejectClubMembership(membershipId).subscribe({
      next: () => {
        // Remove from pending requests
        const currentRequests = this.membershipRequests();
        this.membershipRequests.set(
          currentRequests.filter(req => req.id !== membershipId)
        );
      },
      error: (error) => {
        console.error('Error rejecting membership:', error);
      }
    });
  }

  getPendingRequestsCount(clubId: string): number {
    return this.membershipRequests().filter(req => 
      req.club.id === clubId && req.status === 'pending'
    ).length;
  }

  getTotalPendingRequests(): number {
    return this.membershipRequests().filter(req => req.status === 'pending').length;
  }

  getTotalMembers(): number {
    return this.clubs().reduce((total, club) => total + club.memberCount, 0);
  }

  recentMembershipRequests(): ClubMembership[] {
    return this.membershipRequests()
      .filter(req => req.status === 'pending')
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      .slice(0, 5);
  }
}