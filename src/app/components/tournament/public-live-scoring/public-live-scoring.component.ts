import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Apollo } from 'apollo-angular';
import { Subscription } from 'rxjs';
import { GET_TOURNAMENT, GET_MATCHES, GET_TEAMS, GET_VIEWER_COUNT, TRACK_VIEWER, REMOVE_VIEWER } from '../../../graphql/tournament.graphql';
import { Tournament, Match, Team } from '../../../models/tournament.model';
import { PublicTournamentHeaderComponent, ActionButton } from '../../ui/public-tournament-header/public-tournament-header.component';

interface LiveMatch extends Match {
  team1?: Team;
  team2?: Team;
  team1Games: number;
  team2Games: number;
  team1Points: number;
  team2Points: number;
  isLive: boolean;
}

interface ResultsMatrix {
  teams: Team[];
  scores: Map<string, Map<string, { team1Score: number; team2Score: number; winner?: string }>>;
}

interface GroupMatrix {
  groupName: string;
  matrix: ResultsMatrix;
}

@Component({
  selector: 'app-public-live-scoring',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    PublicTournamentHeaderComponent
  ],
  template: `
    <div class="public-live-scoring">
      <!-- Header -->
      <app-public-tournament-header
        *ngIf="tournament"
        [tournamentName]="tournament.name"
        subtitle="Live Tournament Scoring"
        [actionButtons]="actionButtons"
        [themeImageUrl]="themeImageUrl">
      </app-public-tournament-header>
      <button mat-icon-button class="share-btn" (click)="shareLink()">
        <mat-icon>share</mat-icon>
      </button>

      <!-- Live Indicator -->
      <div class="live-banner" *ngIf="liveMatches.length > 0">
        <span class="pulse"></span>
        <span class="live-text">{{ liveMatches.length }} Match{{ liveMatches.length !== 1 ? 'es' : '' }} Live</span>
        <span class="viewer-count">
          <mat-icon class="viewer-icon">visibility</mat-icon>
          {{ viewerCount }} watching
        </span>
        <span class="last-update">Updated {{ lastUpdateTime }}</span>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <mat-icon class="spin">refresh</mat-icon>
        <p>Loading tournament data...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error }}</p>
      </div>

      <!-- Matches -->
      <div *ngIf="!loading && !error" class="content">
        <mat-tab-group class="scoring-tabs" [(selectedIndex)]="selectedTabIndex">
          <!-- Live Matches -->
          <mat-tab label="Live Matches">
            <div class="tab-content">
              <!-- Viewer Count Display -->
              <div class="viewer-count-banner">
                <mat-icon class="viewer-icon">visibility</mat-icon>
                <span class="viewer-text">{{ viewerCount }} {{ viewerCount === 1 ? 'person' : 'people' }} watching</span>
              </div>

              <div *ngIf="liveMatches.length === 0" class="empty-state">
                <mat-icon>live_tv</mat-icon>
                <h3>No Live Matches</h3>
                <p>Check back soon for live scoring updates!</p>
              </div>

              <div class="matches-grid" *ngIf="liveMatches.length > 0">
                <mat-card *ngFor="let match of liveMatches" class="match-card live-match">
                  <mat-card-header>
                    <div class="match-header">
                      <div class="match-meta">
                        <mat-icon>sports_tennis</mat-icon>
                        <span>{{ getRoundName(match.round, match.bracketType) }}</span>
                      </div>
                      <div class="live-indicator">
                        <span class="pulse"></span>
                        LIVE
                      </div>
                    </div>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="scoreboard">
                      <div class="team-row" [class.winning]="match.team1Games > match.team2Games">
                        <div class="team-info">
                          <div class="team-name">{{ match.team1?.name || match.participant1Name || 'Team 1' }}</div>
                          <div class="players">
                            <span *ngIf="match.team1">
                              {{ match.team1.player1?.firstName }} {{ match.team1.player1?.lastName }} &
                              {{ match.team1.player2?.firstName }} {{ match.team1.player2?.lastName }}
                            </span>
                          </div>
                        </div>
                        <div class="score-info">
                          <div class="games">{{ match.team1Games }}</div>
                          <div class="points">{{ getPointsDisplay(match.team1Points) }}</div>
                        </div>
                      </div>

                      <div class="divider"></div>

                      <div class="team-row" [class.winning]="match.team2Games > match.team1Games">
                        <div class="team-info">
                          <div class="team-name">{{ match.team2?.name || match.participant2Name || 'Team 2' }}</div>
                          <div class="players">
                            <span *ngIf="match.team2">
                              {{ match.team2.player1?.firstName }} {{ match.team2.player1?.lastName }} &
                              {{ match.team2.player2?.firstName }} {{ match.team2.player2?.lastName }}
                            </span>
                          </div>
                        </div>
                        <div class="score-info">
                          <div class="games">{{ match.team2Games }}</div>
                          <div class="points">{{ getPointsDisplay(match.team2Points) }}</div>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Upcoming Matches -->
          <mat-tab label="Upcoming">
            <div class="tab-content">
              <div *ngIf="upcomingMatches.length === 0" class="empty-state">
                <mat-icon>event</mat-icon>
                <h3>No Upcoming Matches</h3>
              </div>

              <div class="matches-list" *ngIf="upcomingMatches.length > 0">
                <div *ngFor="let match of upcomingMatches" class="match-item">
                  <div class="match-badge">{{ getRoundName(match.round, match.bracketType) }}</div>
                  <div class="teams">
                    <span class="team-players" *ngIf="match.team1">
                      {{ match.team1.player1?.firstName }} & {{ match.team1.player2?.firstName }}
                    </span>
                    <span *ngIf="!match.team1">{{ match.participant1Name || 'TBD' }}</span>
                    <span class="vs-text">VS</span>
                    <span class="team-players" *ngIf="match.team2">
                      {{ match.team2.player1?.firstName }} & {{ match.team2.player2?.firstName }}
                    </span>
                    <span *ngIf="!match.team2">{{ match.participant2Name || 'TBD' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Completed Matches -->
          <mat-tab label="Results">
            <div class="tab-content">
              <div *ngIf="completedMatches.length === 0" class="empty-state">
                <mat-icon>emoji_events</mat-icon>
                <h3>No Completed Matches Yet</h3>
              </div>

              <!-- Round-Robin Matrix View with Groups -->
              <div *ngIf="isRoundRobin && groupMatrices.length > 0 && completedMatches.length > 0" class="results-container">
                <div *ngFor="let groupMatrix of groupMatrices" class="group-section">
                  <h2 class="group-title">{{ groupMatrix.groupName }}</h2>
                  <div class="results-matrix-container">
                    <div class="matrix-table-wrapper">
                      <table class="results-matrix">
                        <thead>
                          <tr>
                            <th class="team-header sticky-col">Team</th>
                            <th *ngFor="let team of groupMatrix.matrix.teams" class="team-header">{{ team.name }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let rowTeam of groupMatrix.matrix.teams">
                            <td class="team-name-cell sticky-col">{{ rowTeam.name }}</td>
                            <td *ngFor="let colTeam of groupMatrix.matrix.teams"
                                class="score-cell"
                                [class.diagonal]="rowTeam.id === colTeam.id"
                                [class.winner]="isWinnerInMatrix(groupMatrix.matrix, rowTeam.id, colTeam.id)"
                                [class.loser]="!isWinnerInMatrix(groupMatrix.matrix, rowTeam.id, colTeam.id) && getMatrixScoreFromMatrix(groupMatrix.matrix, rowTeam.id, colTeam.id) !== '' && getMatrixScoreFromMatrix(groupMatrix.matrix, rowTeam.id, colTeam.id) !== '-'">
                              {{ getMatrixScoreFromMatrix(groupMatrix.matrix, rowTeam.id, colTeam.id) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div class="matrix-legend">
                  <div class="legend-title">How to read: Find the row team (left), then column team (top). Green = row team won, Red = row team lost.</div>
                  <div class="legend-items">
                    <div class="legend-item">
                      <div class="legend-box winner-box">✓</div>
                      <span>Row Team Won</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-box loser-box"></div>
                      <span>Row Team Lost</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-box pending-box"></div>
                      <span>Not Played Yet</span>
                    </div>
                  </div>
                </div>

                <!-- Knockout Stage Matches (Finals & 3rd Place) -->
                <div class="knockout-stage-section" *ngIf="getKnockoutMatches().length > 0">
                  <div class="knockout-header">
                    <div class="knockout-header-content">
                      <mat-icon class="knockout-icon">emoji_events</mat-icon>
                      <h2 class="knockout-title">Knockout Stage</h2>
                    </div>
                    <div class="knockout-divider"></div>
                  </div>

                  <div class="knockout-matches-grid">
                    <div *ngFor="let match of getKnockoutMatches()" class="knockout-match-card"
                         [class.finals-match]="match.bracketType === 'winners'"
                         [class.third-place-match]="match.bracketType === 'losers'">

                      <!-- Match Badge -->
                      <div class="match-badge">
                        <mat-icon class="badge-icon">
                          {{ match.bracketType === 'winners' ? 'emoji_events' : 'military_tech' }}
                        </mat-icon>
                        <span class="badge-text">{{ getRoundName(match.round, match.bracketType) }}</span>
                      </div>

                      <!-- Match Content -->
                      <div class="match-content">
                        <!-- Team 1 -->
                        <div class="team-container" [class.winner-team]="match.winner === match.participant1">
                          <div class="team-details">
                            <div class="team-position">
                              <mat-icon *ngIf="match.winner === match.participant1" class="winner-crown">
                                workspace_premium
                              </mat-icon>
                              <span *ngIf="match.winner !== match.participant1" class="runner-up-badge">2nd</span>
                            </div>
                            <div class="team-info-modern">
                              <div class="team-name-modern">
                                {{ match.team1?.name || match.participant1Name || 'Team 1' }}
                              </div>
                            </div>
                          </div>
                          <div class="team-score-modern">
                            {{ match.score?.participant1Score || 0 }}
                          </div>
                        </div>

                        <!-- VS Divider -->
                        <div class="vs-divider">
                          <span class="vs-text">VS</span>
                        </div>

                        <!-- Team 2 -->
                        <div class="team-container" [class.winner-team]="match.winner === match.participant2">
                          <div class="team-details">
                            <div class="team-position">
                              <mat-icon *ngIf="match.winner === match.participant2" class="winner-crown">
                                workspace_premium
                              </mat-icon>
                              <span *ngIf="match.winner !== match.participant2" class="runner-up-badge">2nd</span>
                            </div>
                            <div class="team-info-modern">
                              <div class="team-name-modern">
                                {{ match.team2?.name || match.participant2Name || 'Team 2' }}
                              </div>
                            </div>
                          </div>
                          <div class="team-score-modern">
                            {{ match.score?.participant2Score || 0 }}
                          </div>
                        </div>
                      </div>

                      <!-- Match Footer -->
                      <div class="match-footer">
                        <mat-icon class="check-icon">check_circle</mat-icon>
                        <span class="match-status">Final Result</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Round-Robin Matrix View (Single Matrix - No Groups) -->
              <div *ngIf="isRoundRobin && resultsMatrix && groupMatrices.length === 0 && completedMatches.length > 0" class="results-matrix-container">
                <div class="matrix-table-wrapper">
                  <table class="results-matrix">
                    <thead>
                      <tr>
                        <th class="team-header sticky-col">Team</th>
                        <th *ngFor="let team of resultsMatrix.teams" class="team-header">{{ team.name }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let rowTeam of resultsMatrix.teams">
                        <td class="team-name-cell sticky-col">{{ rowTeam.name }}</td>
                        <td *ngFor="let colTeam of resultsMatrix.teams"
                            class="score-cell"
                            [class.diagonal]="rowTeam.id === colTeam.id"
                            [class.winner]="isWinner(rowTeam.id, colTeam.id)"
                            [class.loser]="!isWinner(rowTeam.id, colTeam.id) && getMatrixScore(rowTeam.id, colTeam.id) !== '' && getMatrixScore(rowTeam.id, colTeam.id) !== '-'">
                          {{ getMatrixScore(rowTeam.id, colTeam.id) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="matrix-legend">
                  <div class="legend-title">How to read: Find the row team (left), then column team (top). Green = row team won, Red = row team lost.</div>
                  <div class="legend-items">
                    <div class="legend-item">
                      <div class="legend-box winner-box">✓</div>
                      <span>Row Team Won</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-box loser-box"></div>
                      <span>Row Team Lost</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-box pending-box"></div>
                      <span>Not Played Yet</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Elimination Bracket Card View -->
              <div class="matches-list" *ngIf="!isRoundRobin && completedMatches.length > 0">
                <mat-card *ngFor="let match of completedMatches" class="match-card completed">
                  <mat-card-content>
                    <div class="scoreboard">
                      <div class="team-row" [class.winner]="match.winner === match.participant1">
                        <div class="team-info">
                          <div class="team-name">
                            {{ match.team1?.name || match.participant1Name || 'Team 1' }}
                            <mat-icon *ngIf="match.winner === match.participant1" class="trophy">emoji_events</mat-icon>
                          </div>
                        </div>
                        <div class="score">{{ match.score?.participant1Score || 0 }}</div>
                      </div>

                      <div class="divider"></div>

                      <div class="team-row" [class.winner]="match.winner === match.participant2">
                        <div class="team-info">
                          <div class="team-name">
                            {{ match.team2?.name || match.participant2Name || 'Team 2' }}
                            <mat-icon *ngIf="match.winner === match.participant2" class="trophy">emoji_events</mat-icon>
                          </div>
                        </div>
                        <div class="score">{{ match.score?.participant2Score || 0 }}</div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Head-to-Head Comparison -->
          <mat-tab label="Head-to-Head">
            <div class="tab-content">
              <!-- Instructions -->
              <div class="h2h-instructions">
                <mat-icon>info</mat-icon>
                <p>Select teams from each group to compare their head-to-head statistics from games played between them</p>
              </div>

              <!-- GROUP A SECTION -->
              <div class="group-comparison-section">
                <h2 class="group-comparison-title">Group A</h2>

                <!-- Group A Team Selection -->
                <div class="team-selection-section">
                  <div class="section-header">
                    <h3>Select Teams ({{ selectedGroupATeams.length }} selected)</h3>
                    <button mat-raised-button color="warn" *ngIf="selectedGroupATeams.length > 0" (click)="clearGroupASelection()">
                      <mat-icon>clear</mat-icon>
                      Clear Selection
                    </button>
                  </div>
                  <div class="team-chips">
                    <div *ngFor="let team of getGroupATeams()"
                         class="team-chip"
                         [class.selected]="isGroupATeamSelected(team.id)"
                         (click)="toggleGroupATeamSelection(team)">
                      <div class="team-chip-content">
                        <mat-icon *ngIf="isGroupATeamSelected(team.id)" class="check-icon">check_circle</mat-icon>
                        <div class="team-chip-info">
                          <div class="team-chip-name">{{ team.name }}</div>
                          <div class="team-chip-players" *ngIf="team.player1 && team.player2">
                            {{ team.player1.firstName }} {{ team.player1.lastName }} &
                            {{ team.player2.firstName }} {{ team.player2.lastName }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State for Group A -->
                <div *ngIf="selectedGroupATeams.length < 2" class="empty-state">
                  <mat-icon>compare_arrows</mat-icon>
                  <h3>Select at least 2 teams from Group A to compare</h3>
                  <p>Click on teams above to add them to the comparison</p>
                </div>

                <!-- Group A Head-to-Head Statistics -->
                <div *ngIf="selectedGroupATeams.length >= 2 && groupAMatrix" class="h2h-stats-section">
                  <h3>Group A Head-to-Head Statistics</h3>

                  <!-- Statistics Summary Table -->
                  <div class="stats-table-wrapper">
                    <table class="h2h-stats-table">
                      <thead>
                        <tr>
                          <th class="team-header sticky-col">Team</th>
                          <th>Wins</th>
                          <th>Losses</th>
                          <th>Games Won (GW)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let team of selectedGroupATeams">
                          <td class="team-name-cell sticky-col">{{ team.name }}</td>
                          <td class="stat-cell wins">{{ getHeadToHeadStatsFromMatrix(team, groupAMatrix).wins }}</td>
                          <td class="stat-cell losses">{{ getHeadToHeadStatsFromMatrix(team, groupAMatrix).losses }}</td>
                          <td class="stat-cell gw">{{ getHeadToHeadStatsFromMatrix(team, groupAMatrix).gamesWon }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Detailed Results Matrix -->
                  <h3 class="matrix-title">Detailed Match Results</h3>
                  <div class="results-matrix-container">
                    <div class="matrix-table-wrapper">
                      <table class="results-matrix">
                        <thead>
                          <tr>
                            <th class="team-header sticky-col">Team</th>
                            <th *ngFor="let team of groupAMatrix.teams" class="team-header">{{ team.name }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let rowTeam of groupAMatrix.teams">
                            <td class="team-name-cell sticky-col">{{ rowTeam.name }}</td>
                            <td *ngFor="let colTeam of groupAMatrix.teams"
                                class="score-cell"
                                [class.diagonal]="rowTeam.id === colTeam.id"
                                [class.winner]="isWinnerInMatrix(groupAMatrix, rowTeam.id, colTeam.id)"
                                [class.loser]="!isWinnerInMatrix(groupAMatrix, rowTeam.id, colTeam.id) && getMatrixScoreFromMatrix(groupAMatrix, rowTeam.id, colTeam.id) !== '' && getMatrixScoreFromMatrix(groupAMatrix, rowTeam.id, colTeam.id) !== '-'">
                              {{ getMatrixScoreFromMatrix(groupAMatrix, rowTeam.id, colTeam.id) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="matrix-legend">
                    <div class="legend-title">How to read: Find the row team (left), then column team (top). Green = row team won, Red = row team lost.</div>
                  </div>
                </div>
              </div>

              <!-- GROUP B SECTION -->
              <div class="group-comparison-section">
                <h2 class="group-comparison-title">Group B</h2>

                <!-- Group B Team Selection -->
                <div class="team-selection-section">
                  <div class="section-header">
                    <h3>Select Teams ({{ selectedGroupBTeams.length }} selected)</h3>
                    <button mat-raised-button color="warn" *ngIf="selectedGroupBTeams.length > 0" (click)="clearGroupBSelection()">
                      <mat-icon>clear</mat-icon>
                      Clear Selection
                    </button>
                  </div>
                  <div class="team-chips">
                    <div *ngFor="let team of getGroupBTeams()"
                         class="team-chip"
                         [class.selected]="isGroupBTeamSelected(team.id)"
                         (click)="toggleGroupBTeamSelection(team)">
                      <div class="team-chip-content">
                        <mat-icon *ngIf="isGroupBTeamSelected(team.id)" class="check-icon">check_circle</mat-icon>
                        <div class="team-chip-info">
                          <div class="team-chip-name">{{ team.name }}</div>
                          <div class="team-chip-players" *ngIf="team.player1 && team.player2">
                            {{ team.player1.firstName }} {{ team.player1.lastName }} &
                            {{ team.player2.firstName }} {{ team.player2.lastName }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State for Group B -->
                <div *ngIf="selectedGroupBTeams.length < 2" class="empty-state">
                  <mat-icon>compare_arrows</mat-icon>
                  <h3>Select at least 2 teams from Group B to compare</h3>
                  <p>Click on teams above to add them to the comparison</p>
                </div>

                <!-- Group B Head-to-Head Statistics -->
                <div *ngIf="selectedGroupBTeams.length >= 2 && groupBMatrix" class="h2h-stats-section">
                  <h3>Group B Head-to-Head Statistics</h3>

                  <!-- Statistics Summary Table -->
                  <div class="stats-table-wrapper">
                    <table class="h2h-stats-table">
                      <thead>
                        <tr>
                          <th class="team-header sticky-col">Team</th>
                          <th>Wins</th>
                          <th>Losses</th>
                          <th>Games Won (GW)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let team of selectedGroupBTeams">
                          <td class="team-name-cell sticky-col">{{ team.name }}</td>
                          <td class="stat-cell wins">{{ getHeadToHeadStatsFromMatrix(team, groupBMatrix).wins }}</td>
                          <td class="stat-cell losses">{{ getHeadToHeadStatsFromMatrix(team, groupBMatrix).losses }}</td>
                          <td class="stat-cell gw">{{ getHeadToHeadStatsFromMatrix(team, groupBMatrix).gamesWon }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Detailed Results Matrix -->
                  <h3 class="matrix-title">Detailed Match Results</h3>
                  <div class="results-matrix-container">
                    <div class="matrix-table-wrapper">
                      <table class="results-matrix">
                        <thead>
                          <tr>
                            <th class="team-header sticky-col">Team</th>
                            <th *ngFor="let team of groupBMatrix.teams" class="team-header">{{ team.name }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let rowTeam of groupBMatrix.teams">
                            <td class="team-name-cell sticky-col">{{ rowTeam.name }}</td>
                            <td *ngFor="let colTeam of groupBMatrix.teams"
                                class="score-cell"
                                [class.diagonal]="rowTeam.id === colTeam.id"
                                [class.winner]="isWinnerInMatrix(groupBMatrix, rowTeam.id, colTeam.id)"
                                [class.loser]="!isWinnerInMatrix(groupBMatrix, rowTeam.id, colTeam.id) && getMatrixScoreFromMatrix(groupBMatrix, rowTeam.id, colTeam.id) !== '' && getMatrixScoreFromMatrix(groupBMatrix, rowTeam.id, colTeam.id) !== '-'">
                              {{ getMatrixScoreFromMatrix(groupBMatrix, rowTeam.id, colTeam.id) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="matrix-legend">
                    <div class="legend-title">How to read: Find the row team (left), then column team (top). Green = row team won, Red = row team lost.</div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Powered by BracketAce Tournament Manager</p>
        <p class="auto-refresh">Auto-refreshing every 10 seconds</p>
      </div>
    </div>
  `,
  styles: [`
    .public-live-scoring {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding-bottom: 4rem;
    }

    .share-btn {
      color: #667eea;
    }

    .live-banner {
      background: #ff5252;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      font-weight: 600;
    }

    .pulse {
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
    }

    .live-text {
      font-size: 1rem;
    }

    .viewer-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
    }

    .viewer-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .last-update {
      opacity: 0.9;
      font-size: 0.875rem;
      font-weight: 400;
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 4rem 2rem;
      color: white;
    }

    .loading-state mat-icon,
    .error-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .content {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .scoring-tabs {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .tab-content {
      padding: 2rem;
      min-height: 400px;
    }

    .viewer-count-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      font-size: 1rem;
      font-weight: 600;
    }

    .viewer-count-banner .viewer-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .viewer-text {
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: rgba(0, 0, 0, 0.3);
      margin-bottom: 1rem;
    }

    .matches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .match-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .live-match {
      border: 2px solid #ff5252;
      box-shadow: 0 0 20px rgba(255, 82, 82, 0.3);
    }

    .match-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .match-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .bracket-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .bracket-badge.winners {
      background: #e3f2fd;
      color: #1976d2;
    }

    .bracket-badge:not(.winners) {
      background: #fff3e0;
      color: #f57c00;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #ff5252;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .scoreboard {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .team-row.winning {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
    }

    .team-row.winner {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
    }

    .team-info {
      flex: 1;
    }

    .team-name {
      font-weight: 600;
      font-size: 1.125rem;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .trophy {
      color: #ff9800;
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .players {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .score-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .games {
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
      min-width: 3rem;
      text-align: right;
      line-height: 1;
    }

    .points {
      font-size: 1.25rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.7);
      text-align: right;
    }

    .score {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
      min-width: 3rem;
      text-align: right;
    }

    .divider {
      height: 1px;
      background: #e0e0e0;
      margin: 0.5rem 0;
    }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .match-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .match-badge {
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .teams {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-weight: 600;
      flex-wrap: wrap;
    }

    .team-players {
      font-weight: 600;
    }

    .vs-text {
      font-weight: 700;
      color: #667eea;
      padding: 0 0.5rem;
    }

    .bracket-label {
      padding: 0.25rem 0.75rem;
      background: #e0e0e0;
      border-radius: 4px;
      font-size: 0.75rem;
      text-transform: capitalize;
    }

    .footer {
      text-align: center;
      padding: 2rem;
      color: white;
      opacity: 0.9;
    }

    .footer p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
    }

    .auto-refresh {
      opacity: 0.7;
    }

    /* Results Matrix Styles */
    .results-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .group-section {
      width: 100%;
    }

    .group-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #667eea;
    }

    .results-matrix-container {
      width: 100%;
      overflow-x: auto;
    }

    .matrix-table-wrapper {
      overflow-x: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .results-matrix {
      width: 100%;
      border-collapse: collapse;
      background: white;
      font-size: 0.875rem;
    }

    .results-matrix th,
    .results-matrix td {
      border: 1px solid #e0e0e0;
      padding: 0.75rem;
      text-align: center;
      min-width: 80px;
    }

    .results-matrix th.team-header {
      background: #667eea;
      color: white;
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .results-matrix th.sticky-col {
      left: 0;
      z-index: 3;
    }

    .team-name-cell {
      font-weight: 600;
      text-align: left;
      background: #f5f5f5;
      position: sticky;
      left: 0;
      z-index: 1;
      white-space: nowrap;
      min-width: 120px;
    }

    .score-cell {
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .score-cell.diagonal {
      background: #e0e0e0;
      color: #9e9e9e;
      cursor: not-allowed;
    }

    .score-cell.winner {
      background: #c8e6c9;
      color: #2e7d32;
      border: 2px solid #4caf50;
      font-weight: 700;
      position: relative;
    }

    .score-cell.winner::before {
      content: '✓ ';
      font-size: 0.875rem;
      margin-right: 0.25rem;
    }

    .score-cell.loser {
      background: #ffcdd2;
      color: #c62828;
      border: 2px solid #f44336;
      opacity: 0.85;
    }

    .score-cell:not(.diagonal):not(.winner):not(.loser) {
      background: #fff9c4;
      color: #f57f17;
    }

    .matrix-legend {
      padding: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 1.5rem;
    }

    .legend-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #424242;
      margin-bottom: 1rem;
      text-align: center;
    }

    .legend-items {
      display: flex;
      gap: 2rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .legend-box {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .winner-box {
      background: #c8e6c9;
      border-color: #4caf50;
      color: #2e7d32;
    }

    .loser-box {
      background: #ffcdd2;
      border-color: #f44336;
    }

    .pending-box {
      background: #fff9c4;
      border-color: #f57f17;
    }

    /* Head-to-Head Styles */
    .h2h-instructions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border-left: 4px solid #667eea;
    }

    .h2h-instructions mat-icon {
      color: #667eea;
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .h2h-instructions p {
      margin: 0;
      color: rgba(0, 0, 0, 0.8);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .team-selection-section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h3 {
      margin: 0;
      color: #424242;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .section-header button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .team-chips {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .team-chip {
      padding: 1rem;
      background: #f5f5f5;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .team-chip:hover {
      border-color: #667eea;
      background: #fafafa;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
    }

    .team-chip.selected {
      background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%);
      border-color: #667eea;
      border-width: 3px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .team-chip-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .check-icon {
      color: #4caf50;
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
    }

    .team-chip-info {
      flex: 1;
    }

    .team-chip-name {
      font-weight: 600;
      font-size: 1rem;
      color: #212121;
      margin-bottom: 0.25rem;
    }

    .team-chip-players {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .h2h-stats-section {
      margin-top: 2rem;
    }

    .h2h-stats-section h3 {
      color: #667eea;
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }

    .matrix-title {
      color: #667eea;
      font-size: 1.25rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }

    .stats-table-wrapper {
      overflow-x: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .h2h-stats-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    .h2h-stats-table th,
    .h2h-stats-table td {
      border: 1px solid #e0e0e0;
      padding: 1rem;
      text-align: center;
    }

    .h2h-stats-table th {
      background: #667eea;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .h2h-stats-table th.sticky-col {
      position: sticky;
      left: 0;
      z-index: 2;
    }

    .h2h-stats-table .team-name-cell {
      text-align: left;
      font-weight: 600;
      background: #f5f5f5;
      position: sticky;
      left: 0;
      z-index: 1;
    }

    .h2h-stats-table .stat-cell {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .h2h-stats-table .stat-cell.wins {
      color: #4caf50;
      background: #e8f5e9;
    }

    .h2h-stats-table .stat-cell.losses {
      color: #f44336;
      background: #ffebee;
    }

    .h2h-stats-table .stat-cell.gw {
      color: #667eea;
      background: #e8eaf6;
    }

    .group-comparison-section {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .group-comparison-section:last-child {
      border-bottom: none;
    }

    .group-comparison-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 1.5rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%);
      border-radius: 8px;
      border-left: 6px solid #667eea;
    }

    @media (max-width: 768px) {
      .matches-grid {
        grid-template-columns: 1fr;
      }

      .results-matrix th,
      .results-matrix td {
        padding: 0.5rem;
        min-width: 60px;
        font-size: 0.75rem;
      }

      .team-name-cell {
        min-width: 100px;
        font-size: 0.75rem;
      }

      .matrix-legend {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .team-chips {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .h2h-stats-table th,
      .h2h-stats-table td {
        padding: 0.5rem;
        font-size: 0.75rem;
      }

      .h2h-stats-table .stat-cell {
        font-size: 1rem;
      }
    }

    /* ===== KNOCKOUT STAGE MODERN DESIGN ===== */
    .knockout-stage-section {
      margin-top: 3rem;
      padding-top: 2rem;
    }

    .knockout-header {
      margin-bottom: 2rem;
    }

    .knockout-header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .knockout-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #ffd700;
      filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
    }

    .knockout-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .knockout-divider {
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, transparent 100%);
      border-radius: 2px;
    }

    .knockout-matches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 2rem;
      margin-top: 1.5rem;
    }

    .knockout-match-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
    }

    .knockout-match-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .knockout-match-card.finals-match {
      border-color: #ffd700;
      background: linear-gradient(145deg, #fffef7 0%, white 100%);
    }

    .knockout-match-card.finals-match:hover {
      box-shadow: 0 12px 40px rgba(255, 215, 0, 0.25);
    }

    .knockout-match-card.third-place-match {
      border-color: #cd7f32;
      background: linear-gradient(145deg, #fff9f5 0%, white 100%);
    }

    .knockout-match-card.third-place-match:hover {
      box-shadow: 0 12px 40px rgba(205, 127, 50, 0.25);
    }

    .match-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .finals-match .match-badge {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      color: #1a1a1a;
    }

    .third-place-match .match-badge {
      background: linear-gradient(135deg, #cd7f32 0%, #e8a75c 100%);
      color: white;
    }

    .badge-icon {
      font-size: 1.75rem;
      width: 1.75rem;
      height: 1.75rem;
    }

    .badge-text {
      font-size: 1.125rem;
    }

    .match-content {
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .team-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .team-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: transparent;
      transition: all 0.3s ease;
    }

    .team-container.winner-team {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-color: #0ea5e9;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
    }

    .team-container.winner-team::before {
      background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%);
    }

    .team-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .team-position {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
    }

    .winner-crown {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #ffd700;
      filter: drop-shadow(0 2px 6px rgba(255, 215, 0, 0.4));
      animation: crownPulse 2s ease-in-out infinite;
    }

    @keyframes crownPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .runner-up-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #64748b;
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .team-info-modern {
      flex: 1;
    }

    .team-name-modern {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.4;
    }

    .winner-team .team-name-modern {
      color: #0c4a6e;
      font-weight: 700;
    }

    .team-score-modern {
      font-size: 2.5rem;
      font-weight: 800;
      color: #64748b;
      min-width: 60px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .winner-team .team-score-modern {
      color: #0284c7;
      text-shadow: 0 2px 4px rgba(2, 132, 199, 0.1);
    }

    .vs-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0;
      position: relative;
    }

    .vs-divider::before,
    .vs-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%);
    }

    .vs-text {
      padding: 0 1rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 1px;
    }

    .match-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-top: 1px solid #e2e8f0;
    }

    .check-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      color: #10b981;
    }

    .match-status {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Responsive adjustments for knockout stage */
    @media (max-width: 768px) {
      .knockout-matches-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .knockout-title {
        font-size: 1.5rem;
      }

      .knockout-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }

      .match-badge {
        padding: 1rem;
        font-size: 1rem;
      }

      .badge-text {
        font-size: 1rem;
      }

      .team-container {
        padding: 1rem;
      }

      .team-name-modern {
        font-size: 1rem;
      }

      .team-score-modern {
        font-size: 2rem;
      }

      .match-content {
        padding: 1.5rem 1rem;
      }
    }
  `]
})
export class PublicLiveScoringComponent implements OnInit, OnDestroy {
  tournamentId: string = '';
  tournament: Tournament | null = null;
  matches: Match[] = [];
  teams: Team[] = [];
  loading = true;
  error = '';
  lastUpdateTime = '';
  selectedTabIndex = 0;
  actionButtons: ActionButton[] = [];
  themeImageUrl?: string;

  liveMatches: LiveMatch[] = [];
  upcomingMatches: LiveMatch[] = [];
  completedMatches: LiveMatch[] = [];
  resultsMatrix: ResultsMatrix | null = null;
  groupMatrices: GroupMatrix[] = [];
  isRoundRobin = false;
  viewerCount = 0;
  private sessionId: string;

  // Head-to-Head comparison properties
  selectedTeamsForComparison: Team[] = [];
  headToHeadMatrix: ResultsMatrix | null = null;
  selectedGroupATeams: Team[] = [];
  selectedGroupBTeams: Team[] = [];
  groupAMatrix: ResultsMatrix | null = null;
  groupBMatrix: ResultsMatrix | null = null;

  private refreshInterval: any;
  private viewerTrackingInterval: any;
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo,
    private snackBar: MatSnackBar
  ) {
    // Generate unique session ID
    this.sessionId = this.generateSessionId();
  }

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id') || '';

    // Set theme image for specific tournament
    if (this.tournamentId === '68fa2733e6dbb8ba02ecbca5') {
      this.themeImageUrl = '/tournament-themes/68fa2733e6dbb8ba02ecbca5.png';
    }

    this.setupActionButtons();
    this.loadTournamentData();

    // Start viewer tracking
    this.startViewerTracking();

    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.loadTournamentData(true);
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.viewerTrackingInterval) {
      clearInterval(this.viewerTrackingInterval);
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    // Remove viewer session on component destroy
    this.removeViewerSession();
  }

  setupActionButtons(): void {
    this.actionButtons = [
      { label: 'View Players', icon: 'people', route: ['/players/tournament', this.tournamentId], class: 'players-button' },
      { label: 'Teams', icon: 'groups', route: ['/teams/tournament', this.tournamentId], class: 'teams-button' },
      { label: 'View Standings', icon: 'leaderboard', route: ['/standings/tournament', this.tournamentId], class: 'standings-button' },
      { label: 'View Match Schedule', icon: 'calendar_today', route: ['/schedule', this.tournamentId], class: 'schedule-button' },
      { label: 'Rules', icon: 'gavel', route: ['/rules', this.tournamentId], class: 'rules-button' }
    ];
  }

  loadTournamentData(silent = false): void {
    if (!silent) {
      this.loading = true;
    }

    // Load tournament
    this.apollo.query<{ tournament: Tournament }>({
      query: GET_TOURNAMENT,
      variables: { id: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        this.tournament = result.data.tournament;
        this.loadMatches();
      },
      error: (error) => {
        console.error('Error loading tournament:', error);
        this.error = 'Failed to load tournament data';
        this.loading = false;
      }
    });
  }

  loadMatches(): void {
    Promise.all([
      this.apollo.query<{ matches: Match[] }>({
        query: GET_MATCHES,
        variables: { tournamentId: this.tournamentId },
        fetchPolicy: 'network-only'
      }).toPromise(),
      this.apollo.query<{ teams: Team[] }>({
        query: GET_TEAMS,
        variables: { tournamentId: this.tournamentId },
        fetchPolicy: 'network-only'
      }).toPromise()
    ]).then(([matchesResult, teamsResult]) => {
      if (matchesResult?.data && teamsResult?.data) {
        this.matches = matchesResult.data.matches;
        this.teams = teamsResult.data.teams;
        this.processMatches();
        this.lastUpdateTime = new Date().toLocaleTimeString();
        this.loading = false;
      }
    }).catch(error => {
      console.error('Error loading matches:', error);
      this.error = 'Failed to load match data';
      this.loading = false;
    });
  }

  processMatches(): void {
    const enrichedMatches: LiveMatch[] = this.matches.map(match => {
      const team1 = this.teams.find(t => t.id === match.participant1);
      const team2 = this.teams.find(t => t.id === match.participant2);

      return {
        ...match,
        team1,
        team2,
        team1Games: match.score?.participant1Score || 0,
        team2Games: match.score?.participant2Score || 0,
        team1Points: match.score?.participant1Points || 0,
        team2Points: match.score?.participant2Points || 0,
        isLive: !match.completed && ((match.score?.participant1Score ?? 0) > 0 || (match.score?.participant2Score ?? 0) > 0 || (match.score?.participant1Points ?? 0) > 0 || (match.score?.participant2Points ?? 0) > 0)
      };
    });

    this.liveMatches = enrichedMatches.filter(m => m.isLive);
    // Filter out TBD matches (placeholder matches for knockout stage)
    // Only show matches where both teams are found OR where participant IDs are actual teams (not 'TBD')
    this.upcomingMatches = enrichedMatches.filter(m =>
      !m.completed &&
      !m.isLive &&
      m.participant1 !== 'TBD' &&
      m.participant2 !== 'TBD' &&
      (m.team1 || m.participant1Name) &&
      (m.team2 || m.participant2Name)
    );
    this.completedMatches = enrichedMatches.filter(m => m.completed);

    // Detect tournament type and build results matrix if round-robin
    this.isRoundRobin = this.detectRoundRobin();

    // TEMPORARY: Force matrix view for testing
    // Remove this after confirming it works
    if (this.completedMatches.length > 0) {
      this.isRoundRobin = true;
    }

    console.log('Is Round Robin:', this.isRoundRobin, 'Completed matches:', this.completedMatches.length);
    if (this.isRoundRobin) {
      // Check if tournament has groups
      if (this.tournament?.groupA && this.tournament?.groupB) {
        this.groupMatrices = this.buildGroupMatrices();
        console.log('Group Matrices built:', this.groupMatrices);
      } else {
        // Single matrix for all teams
        this.resultsMatrix = this.buildResultsMatrix();
        console.log('Results Matrix built:', this.resultsMatrix);
      }
    }

  }

  /**
   * Generate a unique session ID for this viewer
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start tracking this viewer and fetching viewer count
   */
  private startViewerTracking(): void {
    // Initial track
    this.trackViewerSession();
    this.fetchViewerCount();

    // Send heartbeat every 15 seconds
    this.viewerTrackingInterval = setInterval(() => {
      this.trackViewerSession();
      this.fetchViewerCount();
    }, 15000);
  }

  /**
   * Track this viewer session
   */
  private trackViewerSession(): void {
    this.apollo.mutate({
      mutation: TRACK_VIEWER,
      variables: {
        tournamentId: this.tournamentId,
        sessionId: this.sessionId
      }
    }).subscribe({
      error: (error) => console.error('Error tracking viewer:', error)
    });
  }

  /**
   * Fetch the current viewer count
   */
  private fetchViewerCount(): void {
    this.apollo.query({
      query: GET_VIEWER_COUNT,
      variables: { tournamentId: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result: any) => {
        this.viewerCount = result.data.viewerCount;
      },
      error: (error) => console.error('Error fetching viewer count:', error)
    });
  }

  /**
   * Remove this viewer session
   */
  private removeViewerSession(): void {
    this.apollo.mutate({
      mutation: REMOVE_VIEWER,
      variables: {
        tournamentId: this.tournamentId,
        sessionId: this.sessionId
      }
    }).subscribe({
      error: (error) => console.error('Error removing viewer:', error)
    });
  }

  getPointsDisplay(points: number): string {
    if (points === 0) return '0';
    if (points === 15) return '15';
    if (points === 30) return '30';
    if (points === 40) return '40';
    return String(points);
  }

  getRoundName(round: number, bracketType?: 'winners' | 'losers'): string {
    // For round-robin tournaments with groups
    if (this.isRoundRobin && this.tournament?.groupA && this.tournament?.groupB) {
      // In round-robin with groups, the knockout stage typically has:
      // - Round 2: Finals (winners bracket) and 3rd Place (losers/consolation bracket)
      if (round === 2) {
        return bracketType === 'losers' ? '3rd Place' : 'Finals';
      }

      const roundNames: { [key: number]: string } = {
        0: 'Group Stage',
        1: 'Group Stage',
        3: 'Finals'
      };
      return roundNames[round] || `Knockout Round ${round}`;
    }

    // For elimination brackets
    const roundNames: { [key: number]: string } = {
      1: 'Quarter Finals',
      2: 'Semi Finals',
      3: 'Finals'
    };
    return roundNames[round] || `Round ${round}`;
  }

  /**
   * Get knockout stage matches (Finals and 3rd Place) for tournaments with groups
   * These are matches from round 2 onwards that happen after the group stage
   */
  getKnockoutMatches(): LiveMatch[] {
    if (!this.isRoundRobin || !this.tournament?.groupA || !this.tournament?.groupB) {
      return [];
    }

    // Filter completed matches that are from the knockout stage (round >= 2)
    // Round 0 and 1 are group stage matches
    return this.completedMatches
      .filter(match => match.round >= 2)
      .sort((a, b) => {
        // Sort by round first, then by bracket type (finals before 3rd place)
        if (a.round !== b.round) {
          return b.round - a.round; // Higher rounds first (Finals)
        }
        // Within the same round, show finals (winners) before 3rd place (losers)
        if (a.bracketType === 'winners' && b.bracketType === 'losers') return -1;
        if (a.bracketType === 'losers' && b.bracketType === 'winners') return 1;
        return 0;
      });
  }

  shareLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    });
  }

  /**
   * Detects if the tournament is round-robin by checking match structure
   * Round-robin: All teams play each other, matches don't follow strict bracket rounds
   */
  detectRoundRobin(): boolean {
    if (this.matches.length === 0 || this.teams.length === 0) {
      return false;
    }

    // Count unique matchups (team pairs)
    const matchups = new Set<string>();
    this.matches.forEach(match => {
      // Create a consistent key for the matchup (sorted team IDs)
      const teams = [match.participant1, match.participant2].sort();
      matchups.add(`${teams[0]}-${teams[1]}`);
    });

    // In round-robin, number of matches should equal n*(n-1)/2 where n is number of teams
    const expectedMatches = (this.teams.length * (this.teams.length - 1)) / 2;

    // Check if match count is close to round-robin pattern (within 30% to account for ongoing tournaments)
    const hasRoundRobinMatchCount = matchups.size >= expectedMatches * 0.3;

    // In elimination brackets, rounds are 1, 2, 3 (QF, SF, F). In round-robin, rounds may not be used or be uniform
    const rounds = new Set(this.matches.map(m => m.round));
    const hasNonBracketStructure = rounds.size === 1 || rounds.has(0) || this.matches.every(m => m.round === 1);

    // Additional check: In elimination, we typically have 4, 8, 16, 32 teams
    // and match count follows power of 2 pattern. In round-robin, match count follows n*(n-1)/2
    const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
    const likelyNotElimination = !isPowerOfTwo(this.teams.length) || hasRoundRobinMatchCount;

    console.log('Round-robin detection:', {
      teams: this.teams.length,
      matches: this.matches.length,
      uniqueMatchups: matchups.size,
      expectedRoundRobin: expectedMatches,
      hasRoundRobinMatchCount,
      hasNonBracketStructure,
      likelyNotElimination,
      rounds: Array.from(rounds),
      isRoundRobin: hasRoundRobinMatchCount && hasNonBracketStructure
    });

    return hasRoundRobinMatchCount && hasNonBracketStructure;
  }

  /**
   * Builds separate matrices for Group A and Group B
   */
  buildGroupMatrices(): GroupMatrix[] {
    const groupMatrices: GroupMatrix[] = [];

    if (this.tournament?.groupA && this.tournament.groupA.length > 0) {
      const groupATeams = this.teams.filter(t => this.tournament!.groupA!.includes(t.id));
      groupMatrices.push({
        groupName: 'Group A',
        matrix: this.buildResultsMatrixForTeams(groupATeams)
      });
    }

    if (this.tournament?.groupB && this.tournament.groupB.length > 0) {
      const groupBTeams = this.teams.filter(t => this.tournament!.groupB!.includes(t.id));
      groupMatrices.push({
        groupName: 'Group B',
        matrix: this.buildResultsMatrixForTeams(groupBTeams)
      });
    }

    return groupMatrices;
  }

  /**
   * Builds a matrix of results for round-robin tournaments
   */
  buildResultsMatrix(): ResultsMatrix {
    return this.buildResultsMatrixForTeams(this.teams);
  }

  /**
   * Builds a matrix for a specific set of teams
   */
  buildResultsMatrixForTeams(teams: Team[]): ResultsMatrix {
    const scores = new Map<string, Map<string, { team1Score: number; team2Score: number; winner?: string }>>();

    // Initialize the scores map for all teams
    teams.forEach(team1 => {
      const teamScores = new Map<string, { team1Score: number; team2Score: number; winner?: string }>();
      teams.forEach(team2 => {
        if (team1.id !== team2.id) {
          teamScores.set(team2.id, { team1Score: 0, team2Score: 0 });
        }
      });
      scores.set(team1.id, teamScores);
    });

    // Fill in actual scores from completed matches
    this.completedMatches.forEach(match => {
      if (match.team1 && match.team2 && match.score) {
        const team1Scores = scores.get(match.team1.id);
        const team2Scores = scores.get(match.team2.id);

        if (team1Scores) {
          team1Scores.set(match.team2.id, {
            team1Score: match.score.participant1Score || 0,
            team2Score: match.score.participant2Score || 0,
            winner: match.winner
          });
        }

        if (team2Scores) {
          team2Scores.set(match.team1.id, {
            team1Score: match.score.participant2Score || 0,
            team2Score: match.score.participant1Score || 0,
            winner: match.winner
          });
        }
      }
    });

    return {
      teams: teams,
      scores
    };
  }

  /**
   * Gets the score display for a specific matchup in the matrix
   */
  getMatrixScore(rowTeamId: string, colTeamId: string): string {
    if (!this.resultsMatrix || rowTeamId === colTeamId) {
      return '';
    }

    const rowScores = this.resultsMatrix.scores.get(rowTeamId);
    if (!rowScores) {
      return '';
    }

    const matchup = rowScores.get(colTeamId);
    if (!matchup || (matchup.team1Score === 0 && matchup.team2Score === 0)) {
      return '-';
    }

    return `${matchup.team1Score}-${matchup.team2Score}`;
  }

  /**
   * Checks if the row team won against the column team
   */
  isWinner(rowTeamId: string, colTeamId: string): boolean {
    if (!this.resultsMatrix || rowTeamId === colTeamId) {
      return false;
    }

    const rowScores = this.resultsMatrix.scores.get(rowTeamId);
    if (!rowScores) {
      return false;
    }

    const matchup = rowScores.get(colTeamId);
    return matchup?.winner === rowTeamId;
  }

  /**
   * Gets score from a specific matrix (for group matrices)
   */
  getMatrixScoreFromMatrix(matrix: ResultsMatrix, rowTeamId: string, colTeamId: string): string {
    if (!matrix || rowTeamId === colTeamId) {
      return '';
    }

    const rowScores = matrix.scores.get(rowTeamId);
    if (!rowScores) {
      return '';
    }

    const matchup = rowScores.get(colTeamId);
    if (!matchup || (matchup.team1Score === 0 && matchup.team2Score === 0)) {
      return '-';
    }

    return `${matchup.team1Score}-${matchup.team2Score}`;
  }

  /**
   * Checks if row team won in a specific matrix (for group matrices)
   */
  isWinnerInMatrix(matrix: ResultsMatrix, rowTeamId: string, colTeamId: string): boolean {
    if (!matrix || rowTeamId === colTeamId) {
      return false;
    }

    const rowScores = matrix.scores.get(rowTeamId);
    if (!rowScores) {
      return false;
    }

    const matchup = rowScores.get(colTeamId);
    return matchup?.winner === rowTeamId;
  }

  /**
   * Toggle team selection for head-to-head comparison
   */
  toggleTeamSelection(team: Team): void {
    const index = this.selectedTeamsForComparison.findIndex(t => t.id === team.id);
    if (index > -1) {
      this.selectedTeamsForComparison.splice(index, 1);
    } else {
      this.selectedTeamsForComparison.push(team);
    }
    this.buildHeadToHeadMatrix();
  }

  /**
   * Check if a team is selected for comparison
   */
  isTeamSelected(teamId: string): boolean {
    return this.selectedTeamsForComparison.some(t => t.id === teamId);
  }

  /**
   * Clear all selected teams
   */
  clearSelection(): void {
    this.selectedTeamsForComparison = [];
    this.headToHeadMatrix = null;
  }

  /**
   * Build head-to-head matrix for selected teams only
   */
  buildHeadToHeadMatrix(): void {
    if (this.selectedTeamsForComparison.length < 2) {
      this.headToHeadMatrix = null;
      return;
    }
    this.headToHeadMatrix = this.buildResultsMatrixForTeams(this.selectedTeamsForComparison);
  }

  /**
   * Get head-to-head statistics for selected teams
   */
  getHeadToHeadStats(team: Team): { wins: number; losses: number; gamesWon: number; gamesLost: number } {
    if (!this.headToHeadMatrix) {
      return { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 };
    }

    const teamScores = this.headToHeadMatrix.scores.get(team.id);
    if (!teamScores) {
      return { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 };
    }

    let wins = 0;
    let losses = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    teamScores.forEach((matchup, opponentId) => {
      if (matchup.team1Score > 0 || matchup.team2Score > 0) {
        if (matchup.winner === team.id) {
          wins++;
        } else if (matchup.winner) {
          losses++;
        }
        gamesWon += matchup.team1Score;
        gamesLost += matchup.team2Score;
      }
    });

    return { wins, losses, gamesWon, gamesLost };
  }

  /**
   * Get teams that belong to Group A
   */
  getGroupATeams(): Team[] {
    if (!this.tournament?.groupA) {
      return [];
    }
    return this.teams.filter(t => this.tournament!.groupA!.includes(t.id));
  }

  /**
   * Get teams that belong to Group B
   */
  getGroupBTeams(): Team[] {
    if (!this.tournament?.groupB) {
      return [];
    }
    return this.teams.filter(t => this.tournament!.groupB!.includes(t.id));
  }

  /**
   * Check if tournament has groups defined
   */
  hasGroups(): boolean {
    return !!(this.tournament?.groupA && this.tournament?.groupB);
  }

  /**
   * Toggle team selection for Group A
   */
  toggleGroupATeamSelection(team: Team): void {
    const index = this.selectedGroupATeams.findIndex(t => t.id === team.id);
    if (index > -1) {
      this.selectedGroupATeams.splice(index, 1);
    } else {
      this.selectedGroupATeams.push(team);
    }
    this.buildGroupAMatrix();
  }

  /**
   * Toggle team selection for Group B
   */
  toggleGroupBTeamSelection(team: Team): void {
    const index = this.selectedGroupBTeams.findIndex(t => t.id === team.id);
    if (index > -1) {
      this.selectedGroupBTeams.splice(index, 1);
    } else {
      this.selectedGroupBTeams.push(team);
    }
    this.buildGroupBMatrix();
  }

  /**
   * Check if a team is selected in Group A
   */
  isGroupATeamSelected(teamId: string): boolean {
    return this.selectedGroupATeams.some(t => t.id === teamId);
  }

  /**
   * Check if a team is selected in Group B
   */
  isGroupBTeamSelected(teamId: string): boolean {
    return this.selectedGroupBTeams.some(t => t.id === teamId);
  }

  /**
   * Clear Group A selection
   */
  clearGroupASelection(): void {
    this.selectedGroupATeams = [];
    this.groupAMatrix = null;
  }

  /**
   * Clear Group B selection
   */
  clearGroupBSelection(): void {
    this.selectedGroupBTeams = [];
    this.groupBMatrix = null;
  }

  /**
   * Build head-to-head matrix for Group A selected teams
   */
  buildGroupAMatrix(): void {
    if (this.selectedGroupATeams.length < 2) {
      this.groupAMatrix = null;
      return;
    }
    this.groupAMatrix = this.buildResultsMatrixForTeams(this.selectedGroupATeams);
  }

  /**
   * Build head-to-head matrix for Group B selected teams
   */
  buildGroupBMatrix(): void {
    if (this.selectedGroupBTeams.length < 2) {
      this.groupBMatrix = null;
      return;
    }
    this.groupBMatrix = this.buildResultsMatrixForTeams(this.selectedGroupBTeams);
  }

  /**
   * Get head-to-head statistics for a team from a specific matrix
   * IMPORTANT: Only counts games between the teams in the matrix (selected teams)
   */
  getHeadToHeadStatsFromMatrix(team: Team, matrix: ResultsMatrix | null): { wins: number; losses: number; gamesWon: number; gamesLost: number } {
    if (!matrix) {
      return { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 };
    }

    const teamScores = matrix.scores.get(team.id);
    if (!teamScores) {
      return { wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 };
    }

    // Get the IDs of all teams in the matrix (selected teams only)
    const selectedTeamIds = new Set(matrix.teams.map(t => t.id));

    let wins = 0;
    let losses = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    // Only count matches against other selected teams
    teamScores.forEach((matchup, opponentId) => {
      // Skip if opponent is not in the selected teams
      if (!selectedTeamIds.has(opponentId)) {
        return;
      }

      // Only count games that were actually played (not pending matches)
      if (matchup.team1Score > 0 || matchup.team2Score > 0) {
        if (matchup.winner === team.id) {
          wins++;
        } else if (matchup.winner) {
          losses++;
        }
        gamesWon += matchup.team1Score;
        gamesLost += matchup.team2Score;
      }
    });

    return { wins, losses, gamesWon, gamesLost };
  }
}
