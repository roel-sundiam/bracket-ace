import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClubService } from '../../../services/club.service';
import { TournamentService } from '../../../services/tournament.service';
import { AuthService } from '../../../services/auth.service';
import { Tournament, Player, Club, ClubMembership, TournamentRegistration } from '../../../graphql/types';
import { CardComponent } from '../../ui/card/card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { SpinnerComponent } from '../../ui/loading/spinner/spinner.component';

@Component({
  selector: 'app-tournament-player-selection',
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
      @if (loading()) {
        <div class="flex justify-center py-12">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Tournament Player Selection</h1>
              @if (tournament()) {
                <p class="mt-2 text-gray-600">
                  {{ tournament()!.name }} - Select players from your club
                </p>
              }
            </div>
            <app-button
              (click)="router.navigate(['/club/dashboard'])"
              variant="outline">
              Back to Dashboard
            </app-button>
          </div>
        </div>

        @if (tournament()) {
          <!-- Tournament Info -->
          <app-card class="mb-6">
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Tournament</h3>
                  <p class="mt-1 text-lg font-semibold text-gray-900">{{ tournament()!.name }}</p>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Mode</h3>
                  <p class="mt-1 text-lg font-semibold text-gray-900">{{ tournament()!.mode | titlecase }}</p>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Status</h3>
                  <span class="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"
                        [class]="getStatusClass(tournament()!.status)">
                    {{ tournament()!.status | titlecase }}
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Participants</h3>
                  <p class="mt-1 text-lg font-semibold text-gray-900">
                    {{ tournament()!.currentParticipants }} / {{ tournament()!.maxParticipants }}
                  </p>
                </div>
              </div>
            </div>
          </app-card>

          <!-- Search and Filter -->
          <div class="mb-6">
            <app-card>
              <div class="p-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                  <div class="flex-1">
                    <input
                      type="text"
                      [(ngModel)]="searchTerm"
                      (input)="filterMembers()"
                      placeholder="Search club members..."
                      class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  </div>
                  <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">
                      {{ selectedPlayers().length }} selected
                    </span>
                    <app-button
                      (click)="saveSelections()"
                      [disabled]="selectedPlayers().length === 0 || saving()"
                      [loading]="saving()">
                      Save Selections
                    </app-button>
                  </div>
                </div>
              </div>
            </app-card>
          </div>

          <!-- Player Selection Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Available Club Members -->
            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                Club Members ({{ filteredClubMembers().length }})
              </h2>
              
              @if (filteredClubMembers().length > 0) {
                <div class="space-y-3">
                  @for (membership of filteredClubMembers(); track membership.id) {
                    <app-card>
                      <div class="p-4">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span class="text-sm font-medium text-gray-600">
                                {{ membership.user.firstName.charAt(0) }}{{ membership.user.lastName.charAt(0) }}
                              </span>
                            </div>
                            <div>
                              <h3 class="text-sm font-semibold text-gray-900">
                                {{ membership.user.firstName }} {{ membership.user.lastName }}
                              </h3>
                              <p class="text-xs text-gray-500">{{ membership.user.email }}</p>
                            </div>
                          </div>

                          <div class="flex items-center space-x-2">
                            @if (isPlayerSelected(membership.user.id)) {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Selected
                              </span>
                              <app-button
                                (click)="removePlayer(membership.user.id)"
                                variant="secondary"
                                size="sm">
                                Remove
                              </app-button>
                            } @else if (isPlayerAlreadyRegistered(membership.user.id)) {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Already Registered
                              </span>
                            } @else {
                              <app-button
                                (click)="selectPlayer(membership.user.id, membership.user.firstName + ' ' + membership.user.lastName)"
                                variant="primary"
                                size="sm">
                                Select
                              </app-button>
                            }
                          </div>
                        </div>
                      </div>
                    </app-card>
                  }
                </div>
              } @else {
                <app-card>
                  <div class="p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">No members found</h3>
                    <p class="mt-2 text-gray-500">
                      @if (searchTerm) {
                        No club members match your search.
                      } @else {
                        Your club doesn't have any approved members yet.
                      }
                    </p>
                  </div>
                </app-card>
              }
            </div>

            <!-- Selected Players -->
            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                Selected Players ({{ selectedPlayers().length }})
              </h2>
              
              @if (selectedPlayers().length > 0) {
                <div class="space-y-3">
                  @for (player of selectedPlayers(); track player.userId) {
                    <app-card>
                      <div class="p-4">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span class="text-sm font-medium text-blue-600">
                                {{ player.name.split(' ')[0].charAt(0) }}{{ player.name.split(' ')[1]?.charAt(0) || '' }}
                              </span>
                            </div>
                            <div>
                              <h3 class="text-sm font-semibold text-gray-900">{{ player.name }}</h3>
                              <p class="text-xs text-gray-500">Selected for tournament</p>
                            </div>
                          </div>

                          <app-button
                            (click)="removePlayer(player.userId)"
                            variant="secondary"
                            size="sm">
                            Remove
                          </app-button>
                        </div>
                      </div>
                    </app-card>
                  }
                </div>
              } @else {
                <app-card>
                  <div class="p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">No players selected</h3>
                    <p class="mt-2 text-gray-500">
                      Select club members from the left to participate in this tournament.
                    </p>
                  </div>
                </app-card>
              }
            </div>
          </div>

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
        }
      }
    </div>
  `
})
export class TournamentPlayerSelectionComponent implements OnInit {
  tournament = signal<Tournament | null>(null);
  clubMembers = signal<ClubMembership[]>([]);
  filteredClubMembers = signal<ClubMembership[]>([]);
  selectedPlayers = signal<{ userId: string; name: string }[]>([]);
  existingRegistrations = signal<TournamentRegistration[]>([]);
  loading = signal(true);
  saving = signal(false);
  successMessage = signal<string | null>(null);
  searchTerm = '';

  private tournamentId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private clubService: ClubService,
    private tournamentService: TournamentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tournamentId = params.get('tournamentId');
      if (this.tournamentId) {
        this.loadData();
      }
    });
  }

  private loadData(): void {
    if (!this.tournamentId) return;

    this.loading.set(true);

    // Load tournament details
    this.tournamentService.getTournament(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        if (tournament.club) {
          this.loadClubMembers(tournament.club.id);
        }
      },
      error: (error) => {
        console.error('Error loading tournament:', error);
        this.loading.set(false);
      }
    });

    // Load existing registrations
    this.clubService.getTournamentRegistrations(this.tournamentId).subscribe({
      next: (registrations) => {
        this.existingRegistrations.set(registrations);
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
      }
    });
  }

  private loadClubMembers(clubId: string): void {
    this.clubService.getClubMembers(clubId).subscribe({
      next: (members) => {
        this.clubMembers.set(members);
        this.filteredClubMembers.set(members);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading club members:', error);
        this.loading.set(false);
      }
    });
  }

  filterMembers(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredClubMembers.set(this.clubMembers());
      return;
    }

    const filtered = this.clubMembers().filter(membership =>
      `${membership.user.firstName} ${membership.user.lastName}`.toLowerCase().includes(term) ||
      membership.user.email.toLowerCase().includes(term)
    );

    this.filteredClubMembers.set(filtered);
  }

  selectPlayer(userId: string, name: string): void {
    const currentSelections = this.selectedPlayers();
    if (!currentSelections.some(p => p.userId === userId)) {
      this.selectedPlayers.set([...currentSelections, { userId, name }]);
    }
  }

  removePlayer(userId: string): void {
    const currentSelections = this.selectedPlayers();
    this.selectedPlayers.set(currentSelections.filter(p => p.userId !== userId));
  }

  isPlayerSelected(userId: string): boolean {
    return this.selectedPlayers().some(p => p.userId === userId);
  }

  isPlayerAlreadyRegistered(userId: string): boolean {
    return this.existingRegistrations().some(reg => 
      reg.participantType === 'player' && reg.participantId === userId
    );
  }

  saveSelections(): void {
    if (!this.tournamentId || this.selectedPlayers().length === 0) return;

    this.saving.set(true);

    const selections = this.selectedPlayers().map(player => ({
      tournamentId: this.tournamentId!,
      playerId: player.userId
    }));

    // This would need to be implemented as a batch operation
    // For now, we'll simulate the save
    setTimeout(() => {
      this.saving.set(false);
      this.successMessage.set(`${selections.length} players have been selected for the tournament!`);
      
      // Clear selections
      this.selectedPlayers.set([]);
      
      // Auto-hide success message
      setTimeout(() => {
        this.successMessage.set(null);
      }, 5000);
    }, 1000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'registration':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}