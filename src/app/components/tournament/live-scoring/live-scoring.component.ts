import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Apollo } from 'apollo-angular';
import { Team, Match } from '../../../models/tournament.model';
import { TournamentNavigationComponent } from '../tournament-navigation/tournament-navigation.component';
import { GET_MATCHES, GET_TEAMS, UPDATE_LIVE_SCORE, SUBMIT_MATCH_RESULT } from '../../../graphql/tournament.graphql';

interface LiveMatch extends Match {
  team1?: Team;
  team2?: Team;
  team1Games: number; // Games won
  team2Games: number; // Games won
  team1Points: number; // Points in current game (0, 15, 30, 40)
  team2Points: number; // Points in current game (0, 15, 30, 40)
  isLive: boolean;
}

@Component({
  selector: 'app-live-scoring',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatSnackBarModule,
    TournamentNavigationComponent
  ],
  template: `
    <div class="live-scoring-container">
      <!-- Tournament Navigation -->
      <app-tournament-navigation
        [tournamentId]="tournamentId"
        [currentStep]="'live-scoring'"
        [completedSteps]="['player-management', 'team-pairing', 'group-assignment', 'match-setup']">
      </app-tournament-navigation>

      <div class="header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Live Scoring</h1>
            <p class="subtitle">Track scores in real-time</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="sharePublicLink()" class="share-btn">
            <mat-icon>share</mat-icon>
            Share Live Scoring
          </button>
          <div class="live-indicator" *ngIf="liveMatches().length > 0">
            <span class="pulse"></span>
            <span>{{ liveMatches().length }} Match{{ liveMatches().length > 1 ? 'es' : '' }} Live</span>
          </div>
        </div>
      </div>

      <mat-tab-group class="scoring-tabs">
        <!-- Live Matches -->
        <mat-tab>
          <ng-template mat-tab-label>
            <span [matBadge]="liveMatches().length" [matBadgeHidden]="liveMatches().length === 0" matBadgeColor="warn" class="tab-label">
              <mat-icon>live_tv</mat-icon>
              Live Matches
            </span>
          </ng-template>
          <div class="tab-content">
            <div class="matches-grid">
              <div *ngFor="let match of liveMatches()" class="match-scoreboard live">
                <div class="scoreboard-header">
                  <div class="match-info">
                    <mat-icon>sports_tennis</mat-icon>
                    <span>{{ getRoundName(match.round) }}</span>
                    <span class="bracket-badge" [class.winners]="match.bracketType === 'winners'" [class.losers]="match.bracketType === 'losers'">
                      {{ getMatchLabel(match) }}
                    </span>
                  </div>
                  <div class="live-badge">
                    <span class="pulse"></span>
                    LIVE
                  </div>
                </div>

                <div class="scoreboard-content">
                  <div class="team-score" [class.leading]="match.team1Games > match.team2Games">
                    <div class="team-details">
                      <div class="team-name">{{ match.team1?.name || 'Team 1' }}</div>
                      <div class="team-players" *ngIf="match.team1?.player1 && match.team1?.player2">
                        {{ match.team1!.player1!.firstName }} {{ match.team1!.player1!.lastName }} & {{ match.team1!.player2!.firstName }} {{ match.team1!.player2!.lastName }}
                      </div>
                    </div>
                    <div class="score-displays">
                      <div class="games-display">{{ match.team1Games }}</div>
                      <div class="points-display">{{ getPointsDisplay(match.team1Points) }}</div>
                    </div>
                  </div>

                  <div class="score-divider">
                    <mat-icon>close</mat-icon>
                  </div>

                  <div class="team-score" [class.leading]="match.team2Games > match.team1Games">
                    <div class="score-displays">
                      <div class="games-display">{{ match.team2Games }}</div>
                      <div class="points-display">{{ getPointsDisplay(match.team2Points) }}</div>
                    </div>
                    <div class="team-details right">
                      <div class="team-name">{{ match.team2?.name || 'Team 2' }}</div>
                      <div class="team-players" *ngIf="match.team2?.player1 && match.team2?.player2">
                        {{ match.team2!.player1!.firstName }} {{ match.team2!.player1!.lastName }} & {{ match.team2!.player2!.firstName }} {{ match.team2!.player2!.lastName }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="scoreboard-controls">
                  <div class="team-controls">
                    <button mat-raised-button color="primary" (click)="scorePoint(match, 'team1')" class="point-btn">
                      <mat-icon>add</mat-icon>
                      Point
                    </button>
                  </div>

                  <div class="center-controls">
                    <button mat-stroked-button (click)="resetScore(match)">
                      <mat-icon>refresh</mat-icon>
                      Reset
                    </button>
                    <button mat-raised-button color="accent" (click)="endMatch(match)">
                      <mat-icon>check_circle</mat-icon>
                      End Match
                    </button>
                  </div>

                  <div class="team-controls">
                    <button mat-raised-button color="primary" (click)="scorePoint(match, 'team2')" class="point-btn">
                      <mat-icon>add</mat-icon>
                      Point
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="liveMatches().length === 0" class="empty-state">
                <mat-icon>live_tv</mat-icon>
                <p>No live matches</p>
                <p class="hint">Start a match from the upcoming matches list</p>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Upcoming Matches -->
        <mat-tab>
          <ng-template mat-tab-label>
            <span [matBadge]="upcomingMatches().length" [matBadgeHidden]="upcomingMatches().length === 0" class="tab-label">
              <mat-icon>schedule</mat-icon>
              Upcoming
            </span>
          </ng-template>
          <div class="tab-content">
            <div class="matches-list">
              <div *ngFor="let match of upcomingMatches()" class="match-card upcoming">
                <div class="match-card-header">
                  <div class="match-info">
                    <mat-icon>sports_tennis</mat-icon>
                    <span>{{ getRoundName(match.round) }}</span>
                    <span class="bracket-badge" [class.winners]="match.bracketType === 'winners'" [class.losers]="match.bracketType === 'losers'">
                      {{ getMatchLabel(match) }}
                    </span>
                  </div>
                  <button mat-raised-button color="primary" (click)="startMatch(match)">
                    <mat-icon>play_arrow</mat-icon>
                    Start Match
                  </button>
                </div>

                <div class="match-teams">
                  <div class="match-team">
                    <div class="team-name">{{ match.team1?.name || 'Team 1' }}</div>
                    <div class="team-players" *ngIf="match.team1?.player1 && match.team1?.player2">
                      {{ match.team1!.player1!.firstName }} {{ match.team1!.player1!.lastName }} & {{ match.team1!.player2!.firstName }} {{ match.team1!.player2!.lastName }}
                    </div>
                  </div>
                  <div class="vs">VS</div>
                  <div class="match-team">
                    <div class="team-name">{{ match.team2?.name || 'Team 2' }}</div>
                    <div class="team-players" *ngIf="match.team2?.player1 && match.team2?.player2">
                      {{ match.team2!.player1!.firstName }} {{ match.team2!.player1!.lastName }} & {{ match.team2!.player2!.firstName }} {{ match.team2!.player2!.lastName }}
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="upcomingMatches().length === 0" class="empty-state">
                <mat-icon>schedule</mat-icon>
                <p>No upcoming matches</p>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Completed Matches -->
        <mat-tab>
          <ng-template mat-tab-label>
            <span [matBadge]="completedMatches().length" [matBadgeHidden]="completedMatches().length === 0" matBadgeColor="accent" class="tab-label">
              <mat-icon>check_circle</mat-icon>
              Completed
            </span>
          </ng-template>
          <div class="tab-content">
            <div class="matches-list">
              <div *ngFor="let match of completedMatches()" class="match-card completed">
                <div class="match-card-header">
                  <div class="match-info">
                    <mat-icon>check_circle</mat-icon>
                    <span>{{ getRoundName(match.round) }}</span>
                    <span class="bracket-badge" [class.winners]="match.bracketType === 'winners'" [class.losers]="match.bracketType === 'losers'">
                      {{ getMatchLabel(match) }}
                    </span>
                  </div>
                  <div class="winner-badge">
                    <mat-icon>emoji_events</mat-icon>
                    {{ getWinnerName(match) }}
                  </div>
                </div>

                <div class="match-result">
                  <div class="result-team" [class.winner]="match.team1Games > match.team2Games">
                    <div class="team-info">
                      <div class="team-name">{{ match.team1?.name || 'Team 1' }}</div>
                      <div class="team-players" *ngIf="match.team1?.player1 && match.team1?.player2">
                        {{ match.team1!.player1!.firstName }} {{ match.team1!.player1!.lastName }} & {{ match.team1!.player2!.firstName }} {{ match.team1!.player2!.lastName }}
                      </div>
                    </div>
                    <div class="final-score">{{ match.team1Games }}</div>
                  </div>

                  <div class="result-divider">-</div>

                  <div class="result-team" [class.winner]="match.team2Games > match.team1Games">
                    <div class="final-score">{{ match.team2Games }}</div>
                    <div class="team-info right">
                      <div class="team-name">{{ match.team2?.name || 'Team 2' }}</div>
                      <div class="team-players" *ngIf="match.team2?.player1 && match.team2?.player2">
                        {{ match.team2!.player1!.firstName }} {{ match.team2!.player1!.lastName }} & {{ match.team2!.player2!.firstName }} {{ match.team2!.player2!.lastName }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="completedMatches().length === 0" class="empty-state">
                <mat-icon>check_circle</mat-icon>
                <p>No completed matches</p>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .live-scoring-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .header-actions {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .share-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
    }

    .subtitle {
      margin: 0.25rem 0 0 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #ffebee;
      color: #c62828;
      border-radius: 20px;
      font-weight: 500;
    }

    .pulse {
      width: 8px;
      height: 8px;
      background: #c62828;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.2);
      }
    }

    .scoring-tabs {
      margin-top: 2rem;
    }

    .tab-content {
      padding: 2rem 0;
    }

    .matches-grid {
      display: grid;
      gap: 2rem;
    }

    .match-scoreboard {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .match-scoreboard.live {
      border: 2px solid #c62828;
    }

    .scoreboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .match-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bracket-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .bracket-badge.winners {
      background: rgba(255, 255, 255, 0.2);
    }

    .bracket-badge.losers {
      background: rgba(255, 255, 255, 0.15);
    }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .scoreboard-content {
      display: flex;
      align-items: center;
      padding: 2rem 1.5rem;
      background: #fafafa;
    }

    .team-score {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      transition: all 0.3s;
    }

    .team-score.leading {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .team-details {
      flex: 1;
    }

    .team-details.right {
      text-align: right;
    }

    .team-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .team-players {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .score-displays {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .games-display {
      font-size: 4rem;
      font-weight: 700;
      line-height: 1;
      min-width: 100px;
      text-align: center;
    }

    .points-display {
      font-size: 2rem;
      font-weight: 600;
      opacity: 0.9;
      min-width: 80px;
      text-align: center;
    }

    .point-btn {
      min-width: 120px;
    }

    .score-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 1rem;
    }

    .score-divider mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: rgba(0, 0, 0, 0.3);
    }

    .scoreboard-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      gap: 2rem;
      background: white;
    }

    .team-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .center-controls {
      display: flex;
      gap: 1rem;
    }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .match-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .match-card.upcoming {
      border-left: 4px solid #2196f3;
    }

    .match-card.completed {
      border-left: 4px solid #4caf50;
    }

    .match-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .match-teams {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .match-team {
      flex: 1;
    }

    .vs {
      font-weight: 700;
      font-size: 1.25rem;
      color: rgba(0, 0, 0, 0.5);
    }

    .match-result {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .result-team {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      background: #f5f5f5;
    }

    .result-team.winner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .team-info {
      flex: 1;
    }

    .team-info.right {
      text-align: right;
    }

    .final-score {
      font-size: 2rem;
      font-weight: 700;
      min-width: 60px;
      text-align: center;
    }

    .result-divider {
      font-weight: 700;
      font-size: 1.5rem;
      color: rgba(0, 0, 0, 0.3);
    }

    .winner-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #ffd700;
      color: #000;
      border-radius: 20px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: rgba(0, 0, 0, 0.4);
    }

    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state .hint {
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
  `]
})
export class LiveScoringComponent implements OnInit {
  tournamentId: string = '';
  allMatches = signal<LiveMatch[]>([]);

  liveMatches = computed(() =>
    this.allMatches().filter(m => m.isLive && !m.completed)
  );

  upcomingMatches = computed(() =>
    this.allMatches().filter(m =>
      !m.isLive &&
      !m.completed &&
      m.participant1 !== 'TBD' &&
      m.participant2 !== 'TBD'
    )
  );

  completedMatches = computed(() =>
    this.allMatches().filter(m => m.completed)
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private snackBar: MatSnackBar,
    private apollo: Apollo
  ) {}

  async ngOnInit(): Promise<void> {
    this.tournamentId = this.route.snapshot.paramMap.get('id') || '';
    await this.loadMatches();
  }

  async loadMatches(): Promise<void> {
    try {
      // Load teams first
      const teamsResult = await this.apollo.query<{ teams: Team[] }>({
        query: GET_TEAMS,
        variables: { tournamentId: this.tournamentId },
        fetchPolicy: 'network-only'
      }).toPromise();

      const teams = teamsResult?.data?.teams || [];
      const teamsMap = new Map(teams.map(t => [t.id, t]));

      // Load matches
      const matchesResult = await this.apollo.query<{ matches: Match[] }>({
        query: GET_MATCHES,
        variables: { tournamentId: this.tournamentId },
        fetchPolicy: 'network-only'
      }).toPromise();

      const matches = matchesResult?.data?.matches || [];

      // Map matches to LiveMatch format with team data
      const liveMatches: LiveMatch[] = matches.map(match => ({
        ...match,
        team1: teamsMap.get(match.participant1),
        team2: teamsMap.get(match.participant2),
        team1Games: match.score?.participant1Score || 0,
        team2Games: match.score?.participant2Score || 0,
        team1Points: match.score?.participant1Points || 0,
        team2Points: match.score?.participant2Points || 0,
        isLive: false, // Initially no matches are live
      }));

      this.allMatches.set(liveMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      this.snackBar.open('Failed to load matches', 'Close', { duration: 5000 });
    }
  }

  getRoundName(round: number): string {
    // For round-robin tournaments, round 1 is group stage, round 2 is finals
    switch (round) {
      case 1: return 'Group Stage';
      case 2: return 'Playoff';
      case 3: return 'Final';
      default: return `Round ${round}`;
    }
  }

  getMatchLabel(match: LiveMatch): string {
    // For round 2 (playoffs), show Final or 3rd Place
    if (match.round === 2) {
      return match.bracketType === 'winners' ? 'Final' : '3rd Place';
    }
    // For other rounds, show Winners/Consolation
    return match.bracketType === 'winners' ? 'Winners' : 'Consolation';
  }

  startMatch(match: LiveMatch): void {
    const updatedMatches = this.allMatches().map(m =>
      m.id === match.id ? { ...m, isLive: true } : m
    );
    this.allMatches.set(updatedMatches);
    this.snackBar.open('Match started', 'Close', { duration: 3000 });
  }

  scorePoint(match: LiveMatch, team: 'team1' | 'team2'): void {
    const updatedMatch = this.calculateTennisScore(match, team);

    const updatedMatches = this.allMatches().map(m =>
      m.id === match.id ? updatedMatch : m
    );
    this.allMatches.set(updatedMatches);

    // Save to database
    this.updateScoreInDatabase(
      updatedMatch,
      updatedMatch.team1Games,
      updatedMatch.team2Games,
      updatedMatch.team1Points,
      updatedMatch.team2Points
    );

    // Announce the score
    this.announceScore(updatedMatch, team);

    // Check if match is won
    if (updatedMatch.team1Games === 4 || updatedMatch.team2Games === 4) {
      this.snackBar.open(`Game! ${updatedMatch.team1Games}-${updatedMatch.team2Games}`, 'Close', { duration: 2000 });
    }
  }

  announceScore(match: LiveMatch, scoringTeam: 'team1' | 'team2'): void {
    const teamName = scoringTeam === 'team1'
      ? (match.team1?.name || 'Team 1')
      : (match.team2?.name || 'Team 2');

    const team1Points = this.getPointsDisplay(match.team1Points);
    const team2Points = this.getPointsDisplay(match.team2Points);
    const team1Games = match.team1Games;
    const team2Games = match.team2Games;

    let announcement = '';

    // Check if a game was just won
    if (match.team1Points === 0 && match.team2Points === 0 &&
        (match.team1Games > 0 || match.team2Games > 0)) {
      // Game was just won
      announcement = `Game, ${teamName}. ${team1Games}, ${team2Games}`;
    } else {
      // Regular point
      announcement = `${team1Points}, ${team2Points}. ${teamName}`;
    }

    // Use Web Speech API to announce
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  calculateTennisScore(match: LiveMatch, scoringTeam: 'team1' | 'team2'): LiveMatch {
    let team1Points = match.team1Points;
    let team2Points = match.team2Points;
    let team1Games = match.team1Games;
    let team2Games = match.team2Games;

    // Increment the scoring team's points
    if (scoringTeam === 'team1') {
      // Advance points: 0 -> 15 -> 30 -> 40 -> win game
      if (team1Points === 0) team1Points = 15;
      else if (team1Points === 15) team1Points = 30;
      else if (team1Points === 30) team1Points = 40;
      else if (team1Points === 40) {
        // Check for deuce (No-ad scoring: 40-40, next point wins)
        if (team2Points === 40) {
          // No-ad: team1 wins the game
          team1Games++;
          team1Points = 0;
          team2Points = 0;
        } else {
          // Team1 wins the game
          team1Games++;
          team1Points = 0;
          team2Points = 0;
        }
      }
    } else {
      // Same logic for team2
      if (team2Points === 0) team2Points = 15;
      else if (team2Points === 15) team2Points = 30;
      else if (team2Points === 30) team2Points = 40;
      else if (team2Points === 40) {
        if (team1Points === 40) {
          // No-ad: team2 wins the game
          team2Games++;
          team1Points = 0;
          team2Points = 0;
        } else {
          // Team2 wins the game
          team2Games++;
          team1Points = 0;
          team2Points = 0;
        }
      }
    }

    return {
      ...match,
      team1Points,
      team2Points,
      team1Games,
      team2Games
    };
  }

  getPointsDisplay(points: number): string {
    if (points === 0) return '0';
    if (points === 15) return '15';
    if (points === 30) return '30';
    if (points === 40) return '40';
    return String(points);
  }

  resetScore(match: LiveMatch): void {
    const updatedMatches = this.allMatches().map(m =>
      m.id === match.id ? { ...m, team1Games: 0, team2Games: 0, team1Points: 0, team2Points: 0 } : m
    );
    this.allMatches.set(updatedMatches);
    this.updateScoreInDatabase(match, 0, 0, 0, 0);
    this.snackBar.open('Score reset', 'Close', { duration: 2000 });
  }

  updateScoreInDatabase(match: LiveMatch, gamesA: number, gamesB: number, pointsA: number, pointsB: number): void {
    this.apollo.mutate({
      mutation: UPDATE_LIVE_SCORE,
      variables: {
        input: {
          matchId: match.id,
          scoreA: gamesA,
          scoreB: gamesB,
          pointsA,
          pointsB
        }
      }
    }).subscribe({
      error: (error) => {
        console.error('Error updating score:', error);
        this.snackBar.open('Failed to save score', 'Close', { duration: 3000 });
      }
    });
  }

  endMatch(match: LiveMatch): void {
    // Check if match is already completed
    if (match.completed) {
      this.snackBar.open('This match has already been completed.', 'Close', { duration: 3000 });
      return;
    }

    // Check if someone has won (first to 4 games)
    if (match.team1Games < 4 && match.team2Games < 4) {
      this.snackBar.open('Match not yet complete. First to 4 games wins.', 'Close', { duration: 3000 });
      return;
    }

    const winner = match.team1Games > match.team2Games ? match.participant1 : match.participant2;
    const loser = match.team1Games > match.team2Games ? match.participant2 : match.participant1;

    // Submit match result to database
    this.apollo.mutate({
      mutation: SUBMIT_MATCH_RESULT,
      variables: {
        input: {
          matchId: match.id,
          winnerId: winner,
          loserId: loser,
          score: {
            participant1Score: match.team1Games,
            participant2Score: match.team2Games,
            participant1Points: match.team1Points,
            participant2Points: match.team2Points
          }
        }
      }
    }).subscribe({
      next: () => {
        const updatedMatches = this.allMatches().map(m =>
          m.id === match.id
            ? {
                ...m,
                isLive: false,
                completed: true,
                winner,
                loser,
                score: {
                  participant1Score: match.team1Games,
                  participant2Score: match.team2Games,
                  participant1Points: match.team1Points,
                  participant2Points: match.team2Points
                }
              }
            : m
        );

        this.allMatches.set(updatedMatches);
        this.snackBar.open(`Match ended - Winner: ${this.getWinnerName(match)}`, 'Close', { duration: 5000 });
      },
      error: (error) => {
        console.error('Error ending match:', error);
        const errorMessage = error?.message || error?.graphQLErrors?.[0]?.message || 'Failed to end match';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  getWinnerName(match: LiveMatch): string {
    if (match.team1Games > match.team2Games) {
      return match.team1?.name || 'Team 1';
    } else if (match.team2Games > match.team1Games) {
      return match.team2?.name || 'Team 2';
    }
    return 'Tie';
  }

  goBack(): void {
    this.router.navigate(['/tournament', this.tournamentId, 'match-setup']);
  }

  sharePublicLink(): void {
    const publicUrl = `${window.location.origin}/live/${this.tournamentId}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      this.snackBar.open('Public live scoring link copied to clipboard!', 'Close', { duration: 5000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy link. URL: ' + publicUrl, 'Close', { duration: 8000 });
    });
  }
}
