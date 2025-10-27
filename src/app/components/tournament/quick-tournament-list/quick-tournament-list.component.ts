import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Apollo } from 'apollo-angular';
import { GET_TOURNAMENTS, DELETE_TOURNAMENT, SYNC_TOURNAMENT_PARTICIPANTS } from '../../../graphql/tournament.graphql';
import { Tournament } from '../../../models/tournament.model';

@Component({
  selector: 'app-quick-tournament-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="quick-tournament-list-container">
      <div class="header">
        <div class="title-section">
          <h1>
            <mat-icon>sports_tennis</mat-icon>
            Quick Tournaments
          </h1>
          <p class="subtitle">Manage your quick doubles tournaments with manual setup</p>
        </div>
        <button
          mat-raised-button
          color="primary"
          routerLink="/tournaments/quick"
          class="create-button">
          <mat-icon>add</mat-icon>
          Create Quick Tournament
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading tournaments...</p>
      </div>

      <div *ngIf="!loading && quickTournaments.length === 0" class="empty-state">
        <mat-icon>emoji_events</mat-icon>
        <h2>No Quick Tournaments Yet</h2>
        <p>Create your first quick tournament to get started with manual doubles tournament management.</p>
        <button
          mat-raised-button
          color="primary"
          routerLink="/tournaments/quick">
          <mat-icon>add</mat-icon>
          Create Your First Quick Tournament
        </button>
      </div>

      <div *ngIf="!loading && quickTournaments.length > 0" class="tournaments-grid">
        <mat-card *ngFor="let tournament of quickTournaments" class="tournament-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="tournament-icon">sports_tennis</mat-icon>
            <mat-card-title>{{ tournament.name }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip class="status-chip" [class.status-registration]="tournament.status === 'registration'"
                [class.status-in-progress]="tournament.status === 'in-progress'"
                [class.status-completed]="tournament.status === 'completed'">
                {{ getStatusLabel(tournament.status) }}
              </mat-chip>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="tournament-info">
              <div class="info-item">
                <mat-icon>people</mat-icon>
                <span>{{ tournament.currentParticipants || 0 }} / {{ tournament.maxParticipants }} Players</span>
              </div>

              <div class="info-item" *ngIf="hasGroups(tournament)">
                <mat-icon>group_work</mat-icon>
                <span>Groups Assigned</span>
              </div>

              <div class="info-item">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ tournament.createdAt | date:'short' }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-label">Setup Progress</div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getProgress(tournament)"></div>
              </div>
              <div class="progress-text">{{ getProgressLabel(tournament) }}</div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button
              mat-button
              color="primary"
              (click)="continueTournament(tournament)">
              <mat-icon>play_arrow</mat-icon>
              {{ getActionLabel(tournament) }}
            </button>
            <button
              mat-icon-button
              [matMenuTriggerFor]="menu"
              class="menu-button">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="viewDetails(tournament)">
                <mat-icon>visibility</mat-icon>
                <span>View Details</span>
              </button>
              <button mat-menu-item [routerLink]="['/tournament', tournament.id, 'schedule']">
                <mat-icon>schedule</mat-icon>
                <span>Schedule Matches</span>
              </button>
              <button mat-menu-item [routerLink]="['/schedule', tournament.id]">
                <mat-icon>calendar_today</mat-icon>
                <span>View Public Schedule</span>
              </button>
              <button mat-menu-item [routerLink]="['/players/tournament', tournament.id]">
                <mat-icon>people</mat-icon>
                <span>View Tournament Players</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="deleteTournament(tournament)">
                <mat-icon>delete</mat-icon>
                <span>Delete</span>
              </button>
            </mat-menu>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .quick-tournament-list-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .title-section h1 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .title-section h1 mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #667eea;
    }

    .subtitle {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 1rem;
    }

    .create-button {
      white-space: nowrap;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 0;
      gap: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: rgba(0, 0, 0, 0.3);
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      margin: 0 0 0.5rem 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .empty-state p {
      margin: 0 0 2rem 0;
      color: rgba(0, 0, 0, 0.6);
    }

    .tournaments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .tournament-card {
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .tournament-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .tournament-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      font-size: 2rem;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    mat-card-header {
      align-items: flex-start;
    }

    mat-card-title {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .status-chip {
      font-size: 0.75rem;
      min-height: 24px;
      padding: 0 8px;
    }

    .status-registration {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-in-progress {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-completed {
      background: #e8f5e9;
      color: #388e3c;
    }

    .tournament-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(0, 0, 0, 0.7);
      font-size: 0.875rem;
    }

    .info-item mat-icon {
      font-size: 1.125rem;
      width: 1.125rem;
      height: 1.125rem;
      color: rgba(0, 0, 0, 0.5);
    }

    .progress-section {
      margin-top: 1rem;
    }

    .progress-label {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
    }

    mat-card-actions {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      margin-top: auto;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: stretch;
      }

      .create-button {
        width: 100%;
      }

      .tournaments-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QuickTournamentListComponent implements OnInit {
  quickTournaments: Tournament[] = [];
  loading = true;

  constructor(
    private apollo: Apollo,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadQuickTournaments();
  }

  loadQuickTournaments(): void {
    this.loading = true;
    this.apollo
      .watchQuery<{ tournaments: Tournament[] }>({
        query: GET_TOURNAMENTS,
        fetchPolicy: 'network-only'
      })
      .valueChanges.subscribe({
        next: async (result) => {
          // Check if data exists
          if (!result.data || !result.data.tournaments) {
            console.error('No tournament data received');
            this.loading = false;
            return;
          }

          // Filter for quick tournaments (manual bracketing method)
          const quickTournaments = result.data.tournaments.filter(
            t => t.bracketingMethod === 'manual' && t.mode === 'doubles'
          );

          // Sync participant counts for tournaments that might be out of sync
          const syncPromises = quickTournaments
            .filter(t => t.currentParticipants === 0) // Only sync if count is 0
            .map(t =>
              this.apollo.mutate({
                mutation: SYNC_TOURNAMENT_PARTICIPANTS,
                variables: { id: t.id }
              }).toPromise()
            );

          // Wait for all syncs to complete
          if (syncPromises.length > 0) {
            try {
              await Promise.all(syncPromises);
              // Refetch tournaments after syncing
              const refetchResult = await this.apollo.query<{ tournaments: Tournament[] }>({
                query: GET_TOURNAMENTS,
                fetchPolicy: 'network-only'
              }).toPromise();

              if (refetchResult?.data?.tournaments) {
                this.quickTournaments = refetchResult.data.tournaments.filter(
                  t => t.bracketingMethod === 'manual' && t.mode === 'doubles'
                );
              } else {
                this.quickTournaments = quickTournaments;
              }
            } catch (error) {
              console.error('Error syncing participant counts:', error);
              // Still show the tournaments even if sync fails
              this.quickTournaments = quickTournaments;
            }
          } else {
            this.quickTournaments = quickTournaments;
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tournaments:', error);
          this.snackBar.open('Failed to load quick tournaments', 'Close', { duration: 5000 });
          this.loading = false;
        }
      });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'registration': 'Setup',
      'in-progress': 'In Progress',
      'completed': 'Completed'
    };
    return labels[status] || status;
  }

  hasGroups(tournament: Tournament): boolean {
    return !!(tournament.groupA?.length || tournament.groupB?.length);
  }

  getProgress(tournament: Tournament): number {
    let progress = 0;

    // Step 1: Players added (40%)
    if (tournament.currentParticipants > 0) {
      progress += 40 * (tournament.currentParticipants / tournament.maxParticipants);
    }

    // Step 2: Groups assigned (30%)
    if (this.hasGroups(tournament)) {
      progress += 30;
    }

    // Step 3: Tournament started (30%)
    if (tournament.status === 'in-progress') {
      progress += 30;
    } else if (tournament.status === 'completed') {
      progress = 100;
    }

    return Math.min(progress, 100);
  }

  getProgressLabel(tournament: Tournament): string {
    const progress = this.getProgress(tournament);

    if (progress === 100) return 'Tournament completed';
    if (tournament.status === 'in-progress') return 'Matches in progress';
    if (this.hasGroups(tournament)) return 'Groups assigned - ready for matches';
    if (tournament.currentParticipants >= 8) return 'Players added - create teams';
    if (tournament.currentParticipants > 0) return `Add ${tournament.maxParticipants - tournament.currentParticipants} more players`;
    return 'No players added yet';
  }

  getActionLabel(tournament: Tournament): string {
    if (tournament.status === 'completed') return 'View Results';
    if (tournament.status === 'in-progress') return 'Continue Tournament';
    if (this.hasGroups(tournament)) return 'Setup Matches';
    if (tournament.currentParticipants >= 8) return 'Create Teams';
    return 'Add Players';
  }

  continueTournament(tournament: Tournament): void {
    // Navigate to the appropriate step based on tournament state
    if (tournament.status === 'completed' || tournament.status === 'in-progress') {
      this.router.navigate(['/tournament', tournament.id, 'bracket']);
    } else if (this.hasGroups(tournament)) {
      this.router.navigate(['/tournament', tournament.id, 'match-setup']);
    } else if (tournament.currentParticipants >= 8) {
      // Has players, needs team creation
      this.router.navigate(['/tournament', tournament.id, 'team-pairing']);
    } else {
      // Needs players
      this.router.navigate(['/tournament', tournament.id, 'player-management']);
    }
  }

  viewDetails(tournament: Tournament): void {
    this.router.navigate(['/tournament', tournament.id]);
  }

  deleteTournament(tournament: Tournament): void {
    if (!confirm(`Are you sure you want to delete "${tournament.name}"? This action cannot be undone.`)) {
      return;
    }

    this.apollo
      .mutate({
        mutation: DELETE_TOURNAMENT,
        variables: { id: tournament.id }
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Tournament deleted successfully', 'Close', { duration: 3000 });
          this.loadQuickTournaments();
        },
        error: (error) => {
          console.error('Error deleting tournament:', error);
          this.snackBar.open('Failed to delete tournament', 'Close', { duration: 5000 });
        }
      });
  }
}
