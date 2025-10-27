import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { GET_TEAMS, GET_TOURNAMENT } from '../../../graphql/tournament.graphql';
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
}

interface Team {
  id: string;
  name: string;
  player1Id: string;
  player2Id: string;
  tournamentId: string;
  player1: Player;
  player2: Player;
  createdAt: string;
  updatedAt: string;
}

interface Tournament {
  id: string;
  name: string;
  groupA: string[];
  groupB: string[];
}

@Component({
  selector: 'app-public-teams-list',
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
    <div class="public-teams-page">
      <!-- Header Section -->
      <app-public-tournament-header
        [tournamentName]="tournamentName || 'Tournament Teams'"
        subtitle="Team Pairings"
        [count]="!loading && teams.length > 0 ? teams.length : undefined"
        [countLabel]="teams.length === 1 ? 'Team' : 'Teams'"
        [actionButtons]="actionButtons">
      </app-public-tournament-header>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Loading teams...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && teams.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <mat-icon class="empty-icon">groups</mat-icon>
        </div>
        <h2>No Teams Yet</h2>
        <p>There are currently no teams created for this tournament.</p>
      </div>

      <!-- Teams Grid -->
      <div *ngIf="!loading && teams.length > 0" class="teams-container">
        <!-- Group A -->
        <div *ngIf="groupATeams.length > 0" class="group-section">
          <h2 class="group-title">Group A</h2>
          <div class="teams-grid">
            <div *ngFor="let team of groupATeams; let i = index" class="team-card">
              <div class="team-number">{{ i + 1 }}</div>
              <div class="team-info">
                <div class="team-name">{{ team.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Group B -->
        <div *ngIf="groupBTeams.length > 0" class="group-section">
          <h2 class="group-title">Group B</h2>
          <div class="teams-grid">
            <div *ngFor="let team of groupBTeams; let i = index" class="team-card">
              <div class="team-number">{{ i + 1 }}</div>
              <div class="team-info">
                <div class="team-name">{{ team.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ungrouped Teams -->
        <div *ngIf="ungroupedTeams.length > 0" class="group-section">
          <h2 class="group-title">Ungrouped Teams</h2>
          <div class="teams-grid">
            <div *ngFor="let team of ungroupedTeams; let i = index" class="team-card">
              <div class="team-number">{{ i + 1 }}</div>
              <div class="team-info">
                <div class="team-name">{{ team.name }}</div>
              </div>
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
    .public-teams-page {
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

    /* Teams Container */
    .teams-container {
      flex: 1;
      padding: 2rem 1rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .group-section {
      margin-bottom: 3rem;
    }

    .group-section:last-child {
      margin-bottom: 0;
    }

    .group-title {
      color: white;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 1.5rem 0;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.25rem;
      width: 100%;
    }

    /* Team Card */
    .team-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      cursor: default;
    }

    .team-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .team-number {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      font-size: 1.25rem;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      flex-shrink: 0;
    }

    .team-info {
      flex: 1;
      min-width: 0;
    }

    .team-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .players-text {
      font-size: 1rem;
      font-weight: 500;
      color: #4a5568;
      line-height: 1.5;
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
      .teams-container {
        padding: 1.5rem 1rem;
      }

      .teams-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .team-card {
        padding: 1.25rem;
      }

      .team-number {
        min-width: 44px;
        height: 44px;
        font-size: 1.125rem;
      }

      .team-name {
        font-size: 1.125rem;
      }

      .players-text {
        font-size: 0.9375rem;
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
      .teams-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Large Desktop */
    @media (min-width: 1400px) {
      .teams-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class PublicTeamsListComponent implements OnInit {
  teams: Team[] = [];
  groupATeams: Team[] = [];
  groupBTeams: Team[] = [];
  ungroupedTeams: Team[] = [];
  tournamentId: string = '';
  tournamentName: string = '';
  tournament: Tournament | null = null;
  loading = true;
  actionButtons: ActionButton[] = [];

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.params['tournamentId'];
    this.setupActionButtons();
    this.loadTournament();
    this.loadTeams();
  }

  setupActionButtons(): void {
    this.actionButtons = [
      { label: 'View Players', icon: 'people', route: ['/players/tournament', this.tournamentId], class: 'players-button' },
      { label: 'View Standings', icon: 'leaderboard', route: ['/standings/tournament', this.tournamentId], class: 'standings-button' },
      { label: 'View Match Schedule', icon: 'calendar_today', route: ['/schedule', this.tournamentId], class: 'schedule-button' },
      { label: 'Live Scoring', icon: 'sports_score', route: ['/live', this.tournamentId], class: 'live-button' },
      { label: 'Rules', icon: 'gavel', route: ['/rules', this.tournamentId], class: 'rules-button' }
    ];
  }

  loadTournament(): void {
    this.apollo.query<{ tournament: Tournament }>({
      query: GET_TOURNAMENT,
      variables: { id: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        this.tournament = result.data.tournament;
        this.tournamentName = result.data.tournament.name;
        this.groupTeams();
      },
      error: (error) => {
        console.error('Error loading tournament:', error);
      }
    });
  }

  loadTeams(): void {
    this.loading = true;
    this.apollo.query<{ teams: Team[] }>({
      query: GET_TEAMS,
      variables: { tournamentId: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        this.teams = result.data.teams || [];
        this.groupTeams();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        this.loading = false;
      }
    });
  }

  groupTeams(): void {
    if (!this.tournament || this.teams.length === 0) {
      return;
    }

    const groupAIds = this.tournament.groupA || [];
    const groupBIds = this.tournament.groupB || [];

    this.groupATeams = this.teams.filter(team => groupAIds.includes(team.id));
    this.groupBTeams = this.teams.filter(team => groupBIds.includes(team.id));
    this.ungroupedTeams = this.teams.filter(team =>
      !groupAIds.includes(team.id) && !groupBIds.includes(team.id)
    );
  }
}
