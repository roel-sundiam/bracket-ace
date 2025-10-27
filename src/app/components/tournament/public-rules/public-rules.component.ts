import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { GET_TOURNAMENT } from '../../../graphql/tournament.graphql';
import { PublicTournamentHeaderComponent, ActionButton } from '../../ui/public-tournament-header/public-tournament-header.component';

@Component({
  selector: 'app-public-rules',
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
    <div class="public-rules-page">
      <!-- Header Section -->
      <app-public-tournament-header
        [tournamentName]="tournamentName || 'Tournament Rules'"
        subtitle="Tournament Rules & Guidelines"
        [actionButtons]="actionButtons">
      </app-public-tournament-header>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Loading rules...</p>
      </div>

      <!-- Rules Content -->
      <div *ngIf="!loading" class="rules-container">
        <!-- Tournament Format Section -->
        <div class="rule-section">
          <div class="section-icon-wrapper">
            <mat-icon class="section-icon">emoji_events</mat-icon>
          </div>
          <h2 class="section-title">Tournament Format</h2>
          <div class="rule-content">
            <p>This is a quick tournament organized using the BracketAce platform.</p>
            <ul>
              <li>Teams are formed by pairing registered players</li>
              <li>Teams are assigned to groups for round-robin play</li>
              <li>All matches within groups must be completed</li>
              <li>Standings are calculated based on match results</li>
            </ul>
          </div>
        </div>

        <!-- Scoring Rules Section -->
        <div class="rule-section">
          <div class="section-icon-wrapper">
            <mat-icon class="section-icon">calculate</mat-icon>
          </div>
          <h2 class="section-title">Scoring System</h2>
          <div class="rule-content">
            <h3>Game Scoring</h3>
            <ul>
              <li><strong>Regular Tennis Scoring:</strong> Each game uses standard tennis scoring: 15, 30, 40. The first team to win 4 points wins the game.</li>
              <li><strong>No Deuce - Receiver's Choice:</strong> When the score reaches 40-40, there is no advantage play. Instead, it's sudden death - the next point wins the game, and the receiving team has the choice of which side to receive the serve from.</li>
              <li><strong>Match Format:</strong> Matches are played up to 4 games. The first team to win 4 games wins the match.</li>
              <li><strong>Tiebreak at 3-3:</strong> If the match score is tied at 3 games all, a tiebreak game is played up to 5 points to determine the winner.</li>
            </ul>
            <p>Team standings in the tournament are determined by match wins and losses, with tiebreaking rules applied when necessary.</p>
          </div>
        </div>

        <!-- Tiebreaking Rules Section -->
        <div class="rule-section">
          <div class="section-icon-wrapper">
            <mat-icon class="section-icon">balance</mat-icon>
          </div>
          <h2 class="section-title">Tiebreaking Rules</h2>
          <div class="rule-content">
            <p>When teams need to be ranked after group stage matches are completed, the following criteria are applied in order. Each criterion is only used if the previous criteria result in a tie:</p>
            <ol>
              <li><strong>Total Games Won:</strong> The team with the most total games won across all matches ranks higher. This rewards consistent performance.</li>
              <li><strong>Match Wins:</strong> If teams have the same total games won, the team with the most match wins ranks higher.</li>
              <li><strong>Head-to-Head Record:</strong> If exactly 2 teams are tied on games won AND match wins, the winner of their direct match ranks higher. (Skipped if 3 or more teams are tied)</li>
              <li><strong>Games Differential:</strong> The team with the highest games differential (games won - games lost) ranks higher. Used for 3+ team ties.</li>
            </ol>
          </div>
        </div>

        <!-- Match Rules Section -->
        <div class="rule-section">
          <div class="section-icon-wrapper">
            <mat-icon class="section-icon">sports_soccer</mat-icon>
          </div>
          <h2 class="section-title">Match Rules</h2>
          <div class="rule-content">
            <ul>
              <li>All matches are played according to standard tournament rules</li>
              <li>Match schedules are available on the Schedule page</li>
              <li>Live scores are updated in real-time during matches</li>
              <li>Results are final once submitted by tournament administrators</li>
            </ul>
          </div>
        </div>

        <!-- Fair Play Section -->
        <div class="rule-section">
          <div class="section-icon-wrapper">
            <mat-icon class="section-icon">handshake</mat-icon>
          </div>
          <h2 class="section-title">Fair Play & Conduct</h2>
          <div class="rule-content">
            <ul>
              <li>All participants must conduct themselves in a sportsmanlike manner</li>
              <li>Respect opponents, officials, and spectators</li>
              <li>Follow tournament administrator instructions</li>
              <li>Violations may result in penalties or disqualification</li>
            </ul>
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
    .public-rules-page {
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

    /* Rules Container */
    .rules-container {
      flex: 1;
      padding: 2rem 1rem 2rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    /* Rule Section */
    .rule-section {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .rule-section:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .section-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 14px;
      margin-bottom: 1rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .section-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 1rem 0;
    }

    .rule-content {
      color: #4a5568;
      line-height: 1.7;
    }

    .rule-content p {
      margin: 0 0 1rem 0;
    }

    .rule-content p:last-child {
      margin-bottom: 0;
    }

    .rule-content ul,
    .rule-content ol {
      margin: 0 0 1rem 0;
      padding-left: 1.5rem;
    }

    .rule-content ul:last-child,
    .rule-content ol:last-child {
      margin-bottom: 0;
    }

    .rule-content li {
      margin-bottom: 0.5rem;
    }

    .rule-content li:last-child {
      margin-bottom: 0;
    }

    .rule-content strong {
      color: #2d3748;
      font-weight: 600;
    }

    .rule-content h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #2d3748;
      margin: 0 0 0.75rem 0;
    }

    .rule-content h3:not(:first-child) {
      margin-top: 1.5rem;
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
      .rules-container {
        padding: 1.5rem 1rem;
      }

      .rule-section {
        padding: 1.5rem;
        margin-bottom: 1rem;
      }

      .section-title {
        font-size: 1.25rem;
      }

      .rule-content {
        font-size: 0.9375rem;
      }
    }

  `]
})
export class PublicRulesComponent implements OnInit {
  tournamentId: string = '';
  tournamentName: string = '';
  loading = true;
  actionButtons: ActionButton[] = [];

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.params['id'];
    this.setupActionButtons();
    this.loadTournament();
  }

  setupActionButtons(): void {
    this.actionButtons = [
      { label: 'View Players', icon: 'people', route: ['/players/tournament', this.tournamentId], class: 'players-button' },
      { label: 'Teams', icon: 'groups', route: ['/teams/tournament', this.tournamentId], class: 'teams-button' },
      { label: 'View Standings', icon: 'leaderboard', route: ['/standings/tournament', this.tournamentId], class: 'standings-button' },
      { label: 'View Match Schedule', icon: 'calendar_today', route: ['/schedule', this.tournamentId], class: 'schedule-button' },
      { label: 'Live Scoring', icon: 'sports_score', route: ['/live', this.tournamentId], class: 'live-button' }
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
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tournament:', error);
        this.loading = false;
      }
    });
  }
}
