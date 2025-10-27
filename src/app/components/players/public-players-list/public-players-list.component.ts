import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { GET_TOURNAMENT_PLAYERS, GET_TOURNAMENT } from '../../../graphql/tournament.graphql';
import { PublicTournamentHeaderComponent, ActionButton } from '../../ui/public-tournament-header/public-tournament-header.component';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  mode: string;
  club?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-public-players-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    PublicTournamentHeaderComponent
  ],
  template: `
    <div class="public-players-page">
      <!-- Header Section -->
      <app-public-tournament-header
        [tournamentName]="tournamentName || 'Tournament Players'"
        subtitle="Registered Players"
        [count]="!loading && players.length > 0 ? players.length : undefined"
        [countLabel]="players.length === 1 ? 'Player' : 'Players'"
        [actionButtons]="actionButtons"
        [themeImageUrl]="themeImageUrl">
      </app-public-tournament-header>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Loading players...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && players.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <mat-icon class="empty-icon">people_outline</mat-icon>
        </div>
        <h2>No Players Yet</h2>
        <p>There are currently no players registered for this tournament.</p>
      </div>

      <!-- Players Grid -->
      <div *ngIf="!loading && players.length > 0" class="players-container">
        <div class="players-grid">
          <div *ngFor="let player of players; let i = index" class="player-card">
            <div class="player-number">{{ i + 1 }}</div>
            <div class="player-info">
              <div class="player-name">{{ player.firstName }} {{ player.lastName }}</div>
              <div class="player-meta" *ngIf="player.club">
                <mat-icon class="meta-icon">business</mat-icon>
                <span>{{ player.club.name }}</span>
              </div>
            </div>
            <div class="gender-badge" [class.male]="player.gender === 'male'" [class.female]="player.gender === 'female'">
              <mat-icon>{{ player.gender === 'male' ? 'man' : 'woman' }}</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Branding -->
      <div class="footer-branding" *ngIf="!loading">
        <div class="branding-content">
          <img src="/tournament-logo.png" alt="BracketAce Logo" class="branding-icon" />
          <span class="branding-text">Powered by BracketAce</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Root Container */
    .public-players-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1.5rem;
      gap: 1.5rem;
      flex: 1;
    }

    .loading-text {
      color: white;
      font-size: 1.125rem;
      font-weight: 500;
      margin: 0;
    }

    ::ng-deep .loading-container .mat-mdc-progress-spinner circle {
      stroke: white !important;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1.5rem;
      text-align: center;
      color: white;
      flex: 1;
    }

    .empty-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: white;
      opacity: 0.9;
    }

    .empty-state h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.75rem 0;
      color: white;
    }

    .empty-state p {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      max-width: 400px;
    }

    /* Players Container */
    .players-container {
      flex: 1;
      padding: 2rem 1rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .players-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
      width: 100%;
    }

    /* Player Card */
    .player-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      cursor: default;
    }

    .player-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .player-number {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .player-info {
      flex: 1;
      min-width: 0;
    }

    .player-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .player-meta {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #718096;
      font-size: 0.875rem;
    }

    .meta-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #a0aec0;
    }

    .gender-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .gender-badge mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .gender-badge.male {
      background: linear-gradient(135deg, #667eea 0%, #4299e1 100%);
      color: white;
    }

    .gender-badge.female {
      background: linear-gradient(135deg, #f687b3 0%, #ed64a6 100%);
      color: white;
    }

    /* Footer Branding */
    .footer-branding {
      padding: 2rem 1.5rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .branding-content {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .branding-icon {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .players-container {
        padding: 1.5rem 1rem;
      }

      .players-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .player-card {
        padding: 1rem 1.25rem;
      }

      .player-number {
        min-width: 40px;
        height: 40px;
        font-size: 1rem;
      }

      .player-name {
        font-size: 1rem;
      }

      .empty-icon-wrapper {
        width: 100px;
        height: 100px;
      }

      .empty-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .empty-state h2 {
        font-size: 1.5rem;
      }

      .empty-state p {
        font-size: 1rem;
      }
    }

    /* Tablet */
    @media (min-width: 769px) and (max-width: 1024px) {
      .players-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Large Desktop */
    @media (min-width: 1400px) {
      .players-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class PublicPlayersListComponent implements OnInit {
  players: Player[] = [];
  tournamentId: string = '';
  tournamentName: string = '';
  loading = true;
  actionButtons: ActionButton[] = [];
  themeImageUrl?: string;

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.params['tournamentId'];

    // Set theme image for specific tournament
    if (this.tournamentId === '68fa2733e6dbb8ba02ecbca5') {
      this.themeImageUrl = '/tournament-themes/68fa2733e6dbb8ba02ecbca5.png';
    }

    this.setupActionButtons();
    this.loadTournament();
    this.loadPlayers();
  }

  setupActionButtons(): void {
    this.actionButtons = [
      { label: 'Teams', icon: 'groups', route: ['/teams/tournament', this.tournamentId], class: 'teams-button' },
      { label: 'View Standings', icon: 'leaderboard', route: ['/standings/tournament', this.tournamentId], class: 'standings-button' },
      { label: 'View Match Schedule', icon: 'calendar_today', route: ['/schedule', this.tournamentId], class: 'schedule-button' },
      { label: 'Live Scoring', icon: 'sports_score', route: ['/live', this.tournamentId], class: 'live-button' },
      { label: 'Rules', icon: 'gavel', route: ['/rules', this.tournamentId], class: 'rules-button' }
    ];
  }

  loadTournament(): void {
    this.apollo.query<{ tournament: { name: string } }>({
      query: GET_TOURNAMENT,
      variables: { id: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        this.tournamentName = result.data.tournament.name;
      },
      error: (error) => {
        console.error('Error loading tournament:', error);
      }
    });
  }

  loadPlayers(): void {
    this.loading = true;
    this.apollo.query<{ tournamentPlayers: Player[] }>({
      query: GET_TOURNAMENT_PLAYERS,
      variables: { tournamentId: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        this.players = result.data.tournamentPlayers || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.loading = false;
      }
    });
  }
}
