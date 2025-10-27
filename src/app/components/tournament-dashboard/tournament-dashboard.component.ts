import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { Tournament, TournamentStatus, Player, Team } from '../../models/tournament.model';
import { AuthService } from '../../services/auth.service';
import { ConfirmationModalComponent } from '../ui/modal/confirmation-modal/confirmation-modal.component';
import {
  loadTournament,
  resetTournament,
  setTournamentMode,
  loadAllTournaments,
  deleteTournament,
  archiveTournament
} from '../../store/tournament.actions';
import {
  selectTournament,
  selectLoading,
  selectAllTournaments,
  selectActiveTournaments,
  selectCompletedTournaments,
  selectTotalTournaments,
  selectTotalParticipants
} from '../../store/tournament.selectors';

interface TournamentSummary extends Tournament {
  progressPercentage: number;
  completedMatches: number;
  totalMatches: number;
  participantNames: string[];
  lastActivity: Date;
}

@Component({
  selector: 'app-tournament-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    ConfirmationModalComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="dashboard-title">
            <mat-icon>dashboard</mat-icon>
            Tournament Dashboard
          </h1>
          <p class="dashboard-subtitle">{{ getDashboardSubtitle() }}</p>
        </div>

        <div class="header-actions" *ngIf="canCreateTournament()">
          <button
            mat-raised-button
            color="primary"
            (click)="createNewTournament()"
            class="create-tournament-btn">
            <mat-icon>add</mat-icon>
            New Tournament
          </button>
        </div>
      </div>

      <!-- Dashboard Stats -->
      <div class="dashboard-stats">
        <div class="stat-card">
          <mat-icon class="stat-icon">emoji_events</mat-icon>
          <div class="stat-content">
            <span class="stat-number">{{ totalTournaments() }}</span>
            <span class="stat-label">Total Tournaments</span>
          </div>
        </div>
        
        <div class="stat-card">
          <mat-icon class="stat-icon active">schedule</mat-icon>
          <div class="stat-content">
            <span class="stat-number">{{ activeTournaments() }}</span>
            <span class="stat-label">Active Tournaments</span>
          </div>
        </div>
        
        <div class="stat-card">
          <mat-icon class="stat-icon completed">check_circle</mat-icon>
          <div class="stat-content">
            <span class="stat-number">{{ completedTournaments() }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
        
        <div class="stat-card">
          <mat-icon class="stat-icon">people</mat-icon>
          <div class="stat-content">
            <span class="stat-number">{{ totalParticipants() }}</span>
            <span class="stat-label">Total Players</span>
          </div>
        </div>
      </div>

      <!-- Tournament Tabs -->
      <mat-tab-group class="tournament-tabs" [selectedIndex]="0">
        <!-- Active Tournaments -->
        <mat-tab label="Active Tournaments" [disabled]="loading()">
          <div class="tab-content">
            <div class="tournaments-grid">
              <div 
                *ngFor="let tournament of getActiveTournaments()"
                class="tournament-card active-tournament"
                (click)="openTournament(tournament)">
                
                <!-- Tournament Header -->
                <div class="tournament-header">
                  <div class="tournament-info">
                    <h3 class="tournament-name">{{ tournament.name }}</h3>
                    <div class="tournament-meta">
                      <span class="tournament-mode">
                        <mat-icon>{{ tournament.mode === 'singles' ? 'person' : 'groups' }}</mat-icon>
                        {{ tournament.mode | titlecase }}
                      </span>
                      <span class="tournament-status active">
                        <mat-icon>schedule</mat-icon>
                        {{ tournament.status | titlecase }}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    mat-icon-button 
                    [matMenuTriggerFor]="tournamentMenu"
                    (click)="$event.stopPropagation()"
                    class="tournament-menu-btn">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  
                  <mat-menu #tournamentMenu="matMenu">
                    <button mat-menu-item (click)="viewBracket(tournament)">
                      <mat-icon>account_tree</mat-icon>
                      View Bracket
                    </button>
                    <button mat-menu-item (click)="manageParticipants(tournament)">
                      <mat-icon>people</mat-icon>
                      Manage Players
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="openDeleteModal(tournament)" class="danger-menu-item">
                      <mat-icon>delete</mat-icon>
                      Delete Tournament
                    </button>
                  </mat-menu>
                </div>

                <!-- Tournament Progress -->
                <div class="tournament-progress">
                  <div class="progress-info">
                    <span class="progress-text">Tournament Progress</span>
                    <span class="progress-percentage">{{ tournament.progressPercentage }}%</span>
                  </div>
                  <mat-progress-bar 
                    [value]="tournament.progressPercentage" 
                    class="progress-bar">
                  </mat-progress-bar>
                </div>

                <!-- Participants Info -->
                <div class="participants-info">
                  <div class="participants-count">
                    <mat-icon>people</mat-icon>
                    <span>{{ tournament.currentParticipants }}/{{ tournament.maxParticipants }} Registered</span>
                  </div>
                  
                  <div class="participants-preview" *ngIf="tournament.participantNames.length > 0">
                    <div class="participant-avatars">
                      <div 
                        *ngFor="let name of tournament.participantNames.slice(0, 3)" 
                        class="participant-avatar"
                        [title]="name">
                        {{ getInitials(name) }}
                      </div>
                      <div 
                        *ngIf="tournament.participantNames.length > 3"
                        class="participant-avatar more-participants"
                        [title]="'And ' + (tournament.participantNames.length - 3) + ' more'">
                        +{{ tournament.participantNames.length - 3 }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Match Stats -->
                <div class="match-stats">
                  <div class="stat-item">
                    <mat-icon>sports_tennis</mat-icon>
                    <span>{{ tournament.completedMatches }}/{{ tournament.totalMatches }} Matches</span>
                  </div>
                  <div class="stat-item">
                    <mat-icon>access_time</mat-icon>
                    <span>{{ getRelativeTime(tournament.lastActivity) }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="tournament-actions">
                  <button 
                    mat-stroked-button 
                    color="primary"
                    (click)="continueTournament(tournament); $event.stopPropagation()">
                    <mat-icon>play_arrow</mat-icon>
                    Continue
                  </button>
                  
                  <button 
                    *ngIf="tournament.status === 'registration'"
                    mat-raised-button 
                    color="primary"
                    (click)="addParticipants(tournament); $event.stopPropagation()">
                    <mat-icon>person_add</mat-icon>
                    Add Players
                  </button>
                  
                  <button 
                    *ngIf="tournament.status === 'in-progress'"
                    mat-raised-button 
                    color="accent"
                    (click)="viewBracket(tournament); $event.stopPropagation()">
                    <mat-icon>account_tree</mat-icon>
                    View Bracket
                  </button>
                </div>
              </div>

              <!-- Empty State for Active Tournaments -->
              <div *ngIf="getActiveTournaments().length === 0" class="empty-state">
                <mat-icon>sports_tennis</mat-icon>
                <h3>No Active Tournaments</h3>
                <p *ngIf="canCreateTournament()">Create your first tournament to get started!</p>
                <p *ngIf="!canCreateTournament()">No tournaments available. Check back later or join a club to participate!</p>
                <button
                  *ngIf="canCreateTournament()"
                  mat-raised-button
                  color="primary"
                  (click)="createNewTournament()">
                  <mat-icon>add</mat-icon>
                  Create Tournament
                </button>
                <button
                  *ngIf="!canCreateTournament()"
                  mat-raised-button
                  color="primary"
                  routerLink="/clubs/request">
                  <mat-icon>add</mat-icon>
                  Request a Club
                </button>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Completed Tournaments -->
        <mat-tab label="Completed Tournaments" [disabled]="loading()">
          <div class="tab-content">
            <div class="tournaments-grid">
              <div 
                *ngFor="let tournament of getCompletedTournaments()"
                class="tournament-card completed-tournament"
                (click)="viewTournamentResults(tournament)">
                
                <!-- Tournament Header -->
                <div class="tournament-header">
                  <div class="tournament-info">
                    <h3 class="tournament-name">{{ tournament.name }}</h3>
                    <div class="tournament-meta">
                      <span class="tournament-mode">
                        <mat-icon>{{ tournament.mode === 'singles' ? 'person' : 'groups' }}</mat-icon>
                        {{ tournament.mode | titlecase }}
                      </span>
                      <span class="tournament-status completed">
                        <mat-icon>check_circle</mat-icon>
                        Completed
                      </span>
                    </div>
                  </div>
                  
                  <div class="completion-badge">
                    <mat-icon>emoji_events</mat-icon>
                  </div>
                </div>

                <!-- Champions -->
                <div class="champions-section" *ngIf="tournament.winnersChampion">
                  <div class="champion-item main-champion">
                    <mat-icon class="champion-icon">emoji_events</mat-icon>
                    <div class="champion-info">
                      <span class="champion-label">Champion</span>
                      <span class="champion-name">{{ tournament.winnersChampion }}</span>
                    </div>
                  </div>
                  
                  <div class="champion-item runner-up" *ngIf="tournament.consolationChampion">
                    <mat-icon class="champion-icon">military_tech</mat-icon>
                    <div class="champion-info">
                      <span class="champion-label">3rd Place</span>
                      <span class="champion-name">{{ tournament.consolationChampion }}</span>
                    </div>
                  </div>
                </div>

                <!-- Tournament Summary -->
                <div class="tournament-summary">
                  <div class="summary-stat">
                    <mat-icon>people</mat-icon>
                    <span>{{ tournament.currentParticipants }} Participants</span>
                  </div>
                  <div class="summary-stat">
                    <mat-icon>sports_tennis</mat-icon>
                    <span>{{ tournament.totalMatches }} Matches Played</span>
                  </div>
                  <div class="summary-stat">
                    <mat-icon>calendar_today</mat-icon>
                    <span>{{ formatDate(tournament.lastActivity) }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="tournament-actions">
                  <button 
                    mat-stroked-button 
                    color="primary"
                    (click)="viewTournamentResults(tournament); $event.stopPropagation()">
                    <mat-icon>visibility</mat-icon>
                    View Results
                  </button>
                  
                  <button 
                    mat-button
                    (click)="archiveTournament(tournament); $event.stopPropagation()">
                    <mat-icon>archive</mat-icon>
                    Archive
                  </button>
                </div>
              </div>

              <!-- Empty State for Completed Tournaments -->
              <div *ngIf="getCompletedTournaments().length === 0" class="empty-state">
                <mat-icon>emoji_events</mat-icon>
                <h3>No Completed Tournaments</h3>
                <p>Complete some tournaments to see them here!</p>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- All Tournaments -->
        <mat-tab label="All Tournaments" [disabled]="loading()">
          <div class="tab-content">
            <div class="tournaments-list">
              <!-- Tournament search and filters would go here -->
              <div class="list-controls">
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>Search tournaments...</mat-label>
                  <input matInput [(ngModel)]="searchQuery" placeholder="Tournament name">
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
              </div>

              <!-- Tournaments List -->
              <div class="tournaments-table">
                <div class="table-header">
                  <span class="col-name">Tournament</span>
                  <span class="col-mode">Mode</span>
                  <span class="col-status">Status</span>
                  <span class="col-participants">Participants</span>
                  <span class="col-progress">Progress</span>
                  <span class="col-actions">Actions</span>
                </div>
                
                <div 
                  *ngFor="let tournament of getAllTournaments()"
                  class="table-row"
                  (click)="openTournament(tournament)">
                  
                  <span class="col-name">
                    <div class="tournament-cell">
                      <strong>{{ tournament.name }}</strong>
                      <small>{{ formatDate(tournament.lastActivity) }}</small>
                    </div>
                  </span>
                  
                  <span class="col-mode">
                    <mat-icon>{{ tournament.mode === 'singles' ? 'person' : 'groups' }}</mat-icon>
                    {{ tournament.mode | titlecase }}
                  </span>
                  
                  <span class="col-status">
                    <div class="status-badge" [class]="'status-' + tournament.status">
                      {{ tournament.status | titlecase }}
                    </div>
                  </span>
                  
                  <span class="col-participants">
                    {{ tournament.currentParticipants }}/{{ tournament.maxParticipants }}
                  </span>
                  
                  <span class="col-progress">
                    <div class="mini-progress">
                      <mat-progress-bar [value]="tournament.progressPercentage"></mat-progress-bar>
                      <small>{{ tournament.progressPercentage }}%</small>
                    </div>
                  </span>
                  
                  <span class="col-actions" (click)="$event.stopPropagation()">
                    <button mat-icon-button [matMenuTriggerFor]="rowMenu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    
                    <mat-menu #rowMenu="matMenu">
                      <button mat-menu-item (click)="openTournament(tournament)">
                        <mat-icon>open_in_new</mat-icon>
                        Open
                      </button>
                      <button mat-menu-item (click)="viewBracket(tournament)">
                        <mat-icon>account_tree</mat-icon>
                        View Bracket
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="openDeleteModal(tournament)" class="danger-menu-item">
                        <mat-icon>delete</mat-icon>
                        Delete
                      </button>
                    </mat-menu>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Delete Confirmation Modal -->
      <app-confirmation-modal
        [isOpen]="showDeleteModal"
        [title]="'Delete Tournament'"
        [message]="getDeleteMessage()"
        [confirmText]="'Delete'"
        [cancelText]="'Cancel'"
        [variant]="'danger'"
        [isProcessing]="isDeleting"
        (confirm)="confirmDelete()"
        (cancel)="closeDeleteModal()">
      </app-confirmation-modal>
    </div>
  `,
  styleUrls: ['./tournament-dashboard.component.scss']
})
export class TournamentDashboardComponent implements OnInit {
  // Form data
  searchQuery = '';

  // Club filter
  clubId: string | null = null;

  // Store data
  tournaments = signal<TournamentSummary[]>([]);
  loading = signal(false);

  // Store selectors - computed values from store
  totalTournaments = signal(0);
  activeTournaments = signal(0);
  completedTournaments = signal(0);
  totalParticipants = signal(0);

  // Delete confirmation modal state
  showDeleteModal = false;
  pendingDeleteTournament: TournamentSummary | null = null;
  isDeleting = false;

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    // Subscribe to store values
    this.store.select(selectLoading).subscribe(loading => {
      this.loading.set(loading);
    });
    
    this.store.select(selectTotalTournaments).subscribe(total => {
      this.totalTournaments.set(total);
    });
    
    this.store.select(selectActiveTournaments).subscribe(active => {
      this.activeTournaments.set(active.length);
    });
    
    this.store.select(selectCompletedTournaments).subscribe(completed => {
      this.completedTournaments.set(completed.length);
    });
    
    this.store.select(selectTotalParticipants).subscribe(participants => {
      this.totalParticipants.set(participants);
    });
    
    this.store.select(selectAllTournaments).subscribe(tournaments => {
      console.log('Tournaments loaded from store:', tournaments);
      // Transform tournaments to TournamentSummary format
      const summaries: TournamentSummary[] = tournaments.map(tournament => ({
        ...tournament,
        progressPercentage: this.calculateProgress(tournament),
        completedMatches: this.calculateCompletedMatches(tournament),
        totalMatches: this.calculateTotalMatches(tournament),
        participantNames: this.getParticipantNames(tournament),
        lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Mock recent activity
      }));
      console.log('Tournament summaries created:', summaries);
      this.tournaments.set(summaries);
    });
  }

  ngOnInit(): void {
    // Check if we're viewing tournaments for a specific club
    this.route.params.subscribe(params => {
      this.clubId = params['id'] || null;
      console.log('Club ID from route:', this.clubId);
    });

    // Load all tournaments when component initializes
    this.store.dispatch(loadAllTournaments());
  }

  getActiveTournaments(): TournamentSummary[] {
    console.log('All tournaments:', this.tournaments());
    let filtered = this.tournaments().filter(t => t.status !== 'completed');
    console.log('Active tournaments before club filter:', filtered);
    console.log('Club ID for filtering:', this.clubId);
    if (this.clubId) {
      filtered = filtered.filter(t => {
        console.log('Tournament:', t.name, 'club:', t.club, 'club.id:', t.club?.id, 'comparing with clubId:', this.clubId, 'match:', t.club?.id === this.clubId);
        return t.club?.id === this.clubId;
      });
      console.log('Active tournaments after club filter:', filtered);
    }
    return filtered;
  }

  getCompletedTournaments(): TournamentSummary[] {
    let filtered = this.tournaments().filter(t => t.status === 'completed');
    if (this.clubId) {
      filtered = filtered.filter(t => t.club?.id === this.clubId);
    }
    return filtered;
  }

  getAllTournaments(): TournamentSummary[] {
    let filtered = this.tournaments().filter(t =>
      t.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    if (this.clubId) {
      filtered = filtered.filter(t => t.club?.id === this.clubId);
    }
    return filtered;
  }

  createNewTournament(): void {
    this.store.dispatch(resetTournament());

    // If we're viewing tournaments for a specific club, pass the club ID
    if (this.clubId) {
      this.router.navigate(['/tournaments/create'], {
        queryParams: { clubId: this.clubId }
      });
    } else {
      this.router.navigate(['/tournaments/create']);
    }
  }

  openTournament(tournament: TournamentSummary): void {
    this.store.dispatch(loadTournament({ tournamentId: tournament.id }));
    if (tournament.status === 'registration') {
      this.router.navigate(['/tournament', tournament.id, 'register']);
    } else {
      this.router.navigate(['/tournament', tournament.id, 'bracket']);
    }
  }

  continueTournament(tournament: TournamentSummary): void {
    this.openTournament(tournament);
  }

  addParticipants(tournament: TournamentSummary): void {
    this.store.dispatch(loadTournament({ tournamentId: tournament.id }));
    this.router.navigate(['/tournament', tournament.id, 'register']);
  }

  viewBracket(tournament: TournamentSummary): void {
    this.store.dispatch(loadTournament({ tournamentId: tournament.id }));
    this.router.navigate(['/tournament', tournament.id, 'bracket']);
  }

  viewTournamentResults(tournament: TournamentSummary): void {
    this.store.dispatch(loadTournament({ tournamentId: tournament.id }));
    this.router.navigate(['/tournament', tournament.id, 'bracket']);
  }

  manageParticipants(tournament: TournamentSummary): void {
    this.store.dispatch(loadTournament({ tournamentId: tournament.id }));
    this.router.navigate(['/tournament', tournament.id, 'register']);
  }

  openDeleteModal(tournament: TournamentSummary): void {
    this.pendingDeleteTournament = tournament;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteTournament = null;
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.pendingDeleteTournament) return;

    this.isDeleting = true;
    this.store.dispatch(deleteTournament({ tournamentId: this.pendingDeleteTournament.id }));

    // Close modal after dispatch
    setTimeout(() => {
      this.closeDeleteModal();
    }, 500);
  }

  getDeleteMessage(): string {
    return `Are you sure you want to delete "${this.pendingDeleteTournament?.name || ''}"? This action cannot be undone.`;
  }

  archiveTournament(tournament: TournamentSummary): void {
    this.store.dispatch(archiveTournament({ tournamentId: tournament.id }));
  }

  // Helper methods for tournament summary calculations
  private calculateProgress(tournament: Tournament): number {
    // Mock calculation - in real app would be based on actual match completion
    if (tournament.status === 'registration') return 0;
    if (tournament.status === 'completed') return 100;
    return Math.floor(Math.random() * 80) + 10; // 10-90% for in-progress
  }

  private calculateCompletedMatches(tournament: Tournament): number {
    // Mock calculation - in real app would count actual completed matches
    const totalMatches = this.calculateTotalMatches(tournament);
    const progress = this.calculateProgress(tournament);
    return Math.floor((progress / 100) * totalMatches);
  }

  private calculateTotalMatches(tournament: Tournament): number {
    // Calculate total matches based on participants (single elimination)
    const participants = tournament.currentParticipants;
    if (participants <= 1) return 0;
    return participants - 1; // Single elimination: n-1 matches for n participants
  }

  private getParticipantNames(tournament: Tournament): string[] {
    // For now, return empty array for new tournaments with 0 participants
    // This prevents the "Failed to load participants" error for tournaments without participants
    if (tournament.currentParticipants === 0) {
      return [];
    }
    
    // Mock participant names for existing tournaments - in real app would come from actual participants
    const mockNames = tournament.mode === 'singles' 
      ? ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Alex Chen', 'Emma Davis', 'Ryan Brown', 'Lisa Garcia']
      : ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Echo', 'Team Foxtrot', 'Team Golf', 'Team Hotel'];
    
    return mockNames.slice(0, tournament.currentParticipants);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  canCreateTournament(): boolean {
    const user = this.authService.currentUser;
    return user?.role === 'superadmin' || user?.role === 'club_admin';
  }

  getDashboardSubtitle(): string {
    if (this.canCreateTournament()) {
      return 'Manage all your tennis tournaments in one place';
    }
    return 'View and participate in tennis tournaments';
  }
}