import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from '../../../services/club.service';
import { AuthService } from '../../../services/auth.service';
import { Club } from '../../../graphql/types';
import { CardComponent } from '../../ui/card/card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { SpinnerComponent } from '../../ui/loading/spinner/spinner.component';

@Component({
  selector: 'app-club-directory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    SpinnerComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Club Directory</h1>
        <p class="mt-2 text-gray-600">Discover and join tennis clubs</p>
      </div>

      <!-- Search and Filter -->
      <div class="mb-6">
        <app-card>
          <div class="p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div class="flex-1">
                <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
                  Search clubs
                </label>
                <input
                  type="text"
                  id="search"
                  [(ngModel)]="searchTerm"
                  (input)="filterClubs()"
                  placeholder="Search by club name or description..."
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">{{ filteredClubs().length }} clubs found</span>
              </div>
            </div>
          </div>
        </app-card>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- My Clubs Section -->
        @if (myClubs().length > 0) {
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">My Clubs</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (club of myClubs(); track club.id) {
                <app-card>
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-lg font-semibold text-gray-900">{{ club.name }}</h3>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Member
                      </span>
                    </div>
                    
                    @if (club.description) {
                      <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ club.description }}</p>
                    }
                    
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{{ club.memberCount }} members</span>
                      <span>Admin: {{ club.clubAdmin.firstName }} {{ club.clubAdmin.lastName }}</span>
                    </div>

                    <app-button
                      variant="outline"
                      size="sm"
                      class="w-full">
                      View Club Details
                    </app-button>
                  </div>
                </app-card>
              }
            </div>
          </div>
        }

        <!-- All Clubs Section -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">All Clubs</h2>
          @if (filteredClubs().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (club of filteredClubs(); track club.id) {
                <app-card>
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-lg font-semibold text-gray-900">{{ club.name }}</h3>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    
                    @if (club.description) {
                      <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ club.description }}</p>
                    }
                    
                    <div class="space-y-2 mb-4">
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-500">Members:</span>
                        <span class="font-medium">{{ club.memberCount }}</span>
                      </div>
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-500">Admin:</span>
                        <span class="font-medium">{{ club.clubAdmin.firstName }} {{ club.clubAdmin.lastName }}</span>
                      </div>
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-500">Created:</span>
                        <span class="font-medium">{{ club.createdAt | date:'mediumDate' }}</span>
                      </div>
                    </div>

                    @if (isMemberOfClub(club.id)) {
                      <app-button
                        variant="secondary"
                        size="sm"
                        class="w-full"
                        [disabled]="true">
                        Already a Member
                      </app-button>
                    } @else if (hasRequestedMembership(club.id)) {
                      <app-button
                        variant="secondary"
                        size="sm"
                        class="w-full"
                        [disabled]="true">
                        Request Pending
                      </app-button>
                    } @else {
                      <app-button
                        variant="primary"
                        size="sm"
                        class="w-full"
                        (click)="requestMembership(club.id)"
                        [disabled]="requestingMembership() === club.id">
                        @if (requestingMembership() === club.id) {
                          Requesting...
                        } @else {
                          Request to Join
                        }
                      </app-button>
                    }
                  </div>
                </app-card>
              }
            </div>
          } @else {
            <app-card>
              <div class="p-8 text-center">
                @if (searchTerm) {
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <h3 class="mt-4 text-lg font-medium text-gray-900">No clubs found</h3>
                  <p class="mt-2 text-gray-500">
                    No clubs match your search for "{{ searchTerm }}". Try a different search term.
                  </p>
                } @else {
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  <h3 class="mt-4 text-lg font-medium text-gray-900">No clubs available</h3>
                  <p class="mt-2 text-gray-500">
                    There are no tennis clubs available at the moment.
                  </p>
                }
              </div>
            </app-card>
          }
        </div>
      }

      <!-- Success Message -->
      @if (successMessage()) {
        <div class="fixed bottom-4 right-4 max-w-sm">
          <div class="bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800">
                  {{ successMessage() }}
                </p>
              </div>
              <div class="ml-auto pl-3">
                <button
                  (click)="successMessage.set(null)"
                  class="text-green-400 hover:text-green-600">
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ClubDirectoryComponent implements OnInit {
  allClubs = signal<Club[]>([]);
  filteredClubs = signal<Club[]>([]);
  myClubs = signal<Club[]>([]);
  loading = signal(true);
  requestingMembership = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchTerm = '';

  constructor(
    private clubService: ClubService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClubs();
  }

  private loadClubs(): void {
    this.loading.set(true);

    // Load all clubs
    this.clubService.getClubs().subscribe({
      next: (clubs) => {
        this.allClubs.set(clubs);
        this.filteredClubs.set(clubs);
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });

    // Load my clubs if authenticated
    if (this.authService.isAuthenticated) {
      this.clubService.getMyClubs().subscribe({
        next: (clubs) => {
          this.myClubs.set(clubs);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading my clubs:', error);
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  filterClubs(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredClubs.set(this.allClubs());
      return;
    }

    const filtered = this.allClubs().filter(club =>
      club.name.toLowerCase().includes(term) ||
      (club.description && club.description.toLowerCase().includes(term)) ||
      `${club.clubAdmin.firstName} ${club.clubAdmin.lastName}`.toLowerCase().includes(term)
    );

    this.filteredClubs.set(filtered);
  }

  requestMembership(clubId: string): void {
    if (!this.authService.isAuthenticated) {
      // Redirect to login
      return;
    }

    this.requestingMembership.set(clubId);

    this.clubService.requestClubMembership(clubId).subscribe({
      next: () => {
        this.requestingMembership.set(null);
        this.successMessage.set('Membership request sent successfully!');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          this.successMessage.set(null);
        }, 5000);
      },
      error: (error) => {
        console.error('Error requesting membership:', error);
        this.requestingMembership.set(null);
      }
    });
  }

  isMemberOfClub(clubId: string): boolean {
    return this.myClubs().some(club => club.id === clubId);
  }

  hasRequestedMembership(clubId: string): boolean {
    // This would need to be implemented by tracking pending requests
    // For now, return false
    return false;
  }
}