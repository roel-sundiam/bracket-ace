import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { Apollo } from 'apollo-angular';
import { GET_TOURNAMENT, GET_MATCHES } from '../../../graphql/tournament.graphql';
import { PublicTournamentHeaderComponent, ActionButton } from '../../ui/public-tournament-header/public-tournament-header.component';

interface Match {
  id: string;
  round: number;
  bracketType: string;
  participant1Name: string;
  participant2Name: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  completed: boolean;
  score?: {
    participant1Score: number;
    participant2Score: number;
  };
}

type MatchStatus = 'live' | 'completed' | 'upcoming';

interface GroupedMatch {
  date: string;
  matches: Match[];
}

@Component({
  selector: 'app-public-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    PublicTournamentHeaderComponent
  ],
  template: `
    <div class="public-schedule-container">
      <app-public-tournament-header
        [tournamentName]="tournamentName || 'Loading...'"
        subtitle="Match Schedule"
        [actionButtons]="actionButtons"
        [themeImageUrl]="themeImageUrl">
      </app-public-tournament-header>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading schedule...</p>
      </div>

      <div *ngIf="!loading" class="schedule-content">
        <mat-tab-group [(selectedIndex)]="selectedTab">
          <mat-tab label="All Matches">
            <div class="tab-content">
              <div *ngIf="getAllMatches().length === 0" class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <p>No matches yet</p>
              </div>

              <div *ngFor="let group of groupMatchesByDate(getScheduledMatches())" class="date-section">
                <div class="date-badge">
                  <mat-icon>calendar_month</mat-icon>
                  <span>{{ group.date }}</span>
                </div>

                <div class="matches-grid">
                  <div *ngFor="let match of group.matches" class="match-card-modern">
                    <div class="match-header">
                      <div class="match-time-badge">
                        <mat-icon>schedule</mat-icon>
                        <span>{{ match.scheduledTime || 'TBD' }}</span>
                      </div>
                      <div class="match-stage-badge" [class.finals]="match.round === 3">
                        {{ getStageLabel(match) }}
                      </div>
                    </div>

                    <div class="match-body">
                      <div class="team team-1">
                        <div class="team-name">{{ match.participant1Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant1Score }}
                        </div>
                      </div>

                      <div class="match-vs">
                        <span>VS</span>
                      </div>

                      <div class="team team-2">
                        <div class="team-name">{{ match.participant2Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant2Score }}
                        </div>
                      </div>
                    </div>

                    <div class="match-footer" *ngIf="match.completed || isMatchLive(match)">
                      <div class="status-badge" [ngClass]="{'completed': match.completed, 'live': isMatchLive(match)}">
                        <mat-icon>{{ match.completed ? 'check_circle' : 'play_circle' }}</mat-icon>
                        <span>{{ match.completed ? 'Completed' : 'Live' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="getUnscheduledMatches().length > 0" class="date-group">
                <h2 class="date-header">
                  <mat-icon>event_busy</mat-icon>
                  To Be Scheduled
                </h2>
                <div class="matches-list">
                  <mat-card *ngFor="let match of getUnscheduledMatches()" class="match-card unscheduled">
                    <mat-card-content>
                      <div class="match-info">
                        <div class="match-stage">
                          <mat-chip>{{ getStageLabel(match) }}</mat-chip>
                        </div>
                        <div class="match-participants">
                          <span class="participant">{{ match.participant1Name }}</span>
                          <span class="vs">vs</span>
                          <span class="participant">{{ match.participant2Name }}</span>
                        </div>
                        <div class="tbd-label">
                          <mat-chip>TBD</mat-chip>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Group A">
            <div class="tab-content">
              <div *ngIf="getGroupAMatches().length === 0" class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <p>No Group A matches yet</p>
              </div>

              <div *ngFor="let group of groupMatchesByDate(getScheduledGroupAMatches())" class="date-section">
                <div class="date-badge">
                  <mat-icon>calendar_month</mat-icon>
                  <span>{{ group.date }}</span>
                </div>

                <div class="matches-grid">
                  <div *ngFor="let match of group.matches" class="match-card-modern">
                    <div class="match-header">
                      <div class="match-time-badge">
                        <mat-icon>schedule</mat-icon>
                        <span>{{ match.scheduledTime || 'TBD' }}</span>
                      </div>
                      <div class="match-stage-badge">
                        Group A
                      </div>
                    </div>

                    <div class="match-body">
                      <div class="team team-1">
                        <div class="team-name">{{ match.participant1Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant1Score }}
                        </div>
                      </div>

                      <div class="match-vs">
                        <span>VS</span>
                      </div>

                      <div class="team team-2">
                        <div class="team-name">{{ match.participant2Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant2Score }}
                        </div>
                      </div>
                    </div>

                    <div class="match-footer" *ngIf="match.completed || isMatchLive(match)">
                      <div class="status-badge" [ngClass]="{'completed': match.completed, 'live': isMatchLive(match)}">
                        <mat-icon>{{ match.completed ? 'check_circle' : 'play_circle' }}</mat-icon>
                        <span>{{ match.completed ? 'Completed' : 'Live' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Unscheduled Group A Matches -->
              <div *ngIf="getUnscheduledGroupAMatches().length > 0" class="date-section">
                <div class="date-badge unscheduled-badge">
                  <mat-icon>event_busy</mat-icon>
                  <span>To Be Scheduled</span>
                </div>

                <div class="matches-grid">
                  <div *ngFor="let match of getUnscheduledGroupAMatches()" class="match-card-modern unscheduled">
                    <div class="match-header">
                      <div class="match-time-badge unscheduled">
                        <mat-icon>schedule</mat-icon>
                        <span>TBD</span>
                      </div>
                      <div class="match-stage-badge">
                        Group A
                      </div>
                    </div>

                    <div class="match-body">
                      <div class="team team-1">
                        <div class="team-name">{{ match.participant1Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant1Score }}
                        </div>
                      </div>

                      <div class="match-vs">
                        <span>VS</span>
                      </div>

                      <div class="team team-2">
                        <div class="team-name">{{ match.participant2Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant2Score }}
                        </div>
                      </div>
                    </div>

                    <div class="match-footer" *ngIf="match.completed || isMatchLive(match)">
                      <div class="status-badge" [ngClass]="{'completed': match.completed, 'live': isMatchLive(match)}">
                        <mat-icon>{{ match.completed ? 'check_circle' : 'play_circle' }}</mat-icon>
                        <span>{{ match.completed ? 'Completed' : 'Live' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Group B">
            <div class="tab-content">
              <div *ngIf="getGroupBMatches().length === 0" class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <p>No Group B matches yet</p>
              </div>

              <div *ngFor="let group of groupMatchesByDate(getScheduledGroupBMatches())" class="date-section">
                <div class="date-badge">
                  <mat-icon>calendar_month</mat-icon>
                  <span>{{ group.date }}</span>
                </div>

                <div class="matches-grid">
                  <div *ngFor="let match of group.matches" class="match-card-modern">
                    <div class="match-header">
                      <div class="match-time-badge">
                        <mat-icon>schedule</mat-icon>
                        <span>{{ match.scheduledTime || 'TBD' }}</span>
                      </div>
                      <div class="match-stage-badge">
                        Group B
                      </div>
                    </div>

                    <div class="match-body">
                      <div class="team team-1">
                        <div class="team-name">{{ match.participant1Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant1Score }}
                        </div>
                      </div>

                      <div class="match-vs">
                        <span>VS</span>
                      </div>

                      <div class="team team-2">
                        <div class="team-name">{{ match.participant2Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant2Score }}
                        </div>
                      </div>
                    </div>

                    <div class="match-footer" *ngIf="match.completed || isMatchLive(match)">
                      <div class="status-badge" [ngClass]="{'completed': match.completed, 'live': isMatchLive(match)}">
                        <mat-icon>{{ match.completed ? 'check_circle' : 'play_circle' }}</mat-icon>
                        <span>{{ match.completed ? 'Completed' : 'Live' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Unscheduled Group B Matches -->
              <div *ngIf="getUnscheduledGroupBMatches().length > 0" class="date-section">
                <div class="date-badge unscheduled-badge">
                  <mat-icon>event_busy</mat-icon>
                  <span>To Be Scheduled</span>
                </div>

                <div class="matches-grid">
                  <div *ngFor="let match of getUnscheduledGroupBMatches()" class="match-card-modern unscheduled">
                    <div class="match-header">
                      <div class="match-time-badge unscheduled">
                        <mat-icon>schedule</mat-icon>
                        <span>TBD</span>
                      </div>
                      <div class="match-stage-badge">
                        Group B
                      </div>
                    </div>

                    <div class="match-body">
                      <div class="team team-1">
                        <div class="team-name">{{ match.participant1Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant1Score }}
                        </div>
                      </div>

                      <div class="match-vs">
                        <span>VS</span>
                      </div>

                      <div class="team team-2">
                        <div class="team-name">{{ match.participant2Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant2Score }}
                        </div>
                      </div>
                    </div>

                    <div class="match-footer" *ngIf="match.completed || isMatchLive(match)">
                      <div class="status-badge" [ngClass]="{'completed': match.completed, 'live': isMatchLive(match)}">
                        <mat-icon>{{ match.completed ? 'check_circle' : 'play_circle' }}</mat-icon>
                        <span>{{ match.completed ? 'Completed' : 'Live' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Finals">
            <div class="tab-content">
              <div *ngIf="getFinalsMatches().length === 0" class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <p>No Finals matches yet</p>
              </div>

              <div *ngFor="let group of groupMatchesByDate(getScheduledFinalsMatches())" class="date-section">
                <div class="date-badge">
                  <mat-icon>calendar_month</mat-icon>
                  <span>{{ group.date }}</span>
                </div>

                <div class="matches-grid">
                  <div *ngFor="let match of group.matches" class="match-card-modern">
                    <div class="match-header">
                      <div class="match-time-badge">
                        <mat-icon>schedule</mat-icon>
                        <span>{{ match.scheduledTime || 'TBD' }}</span>
                      </div>
                      <div class="match-stage-badge finals">
                        {{ getStageLabel(match) }}
                      </div>
                    </div>

                    <div class="match-body">
                      <div class="team team-1">
                        <div class="team-name">{{ match.participant1Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant1Score }}
                        </div>
                      </div>

                      <div class="match-vs">
                        <span>VS</span>
                      </div>

                      <div class="team team-2">
                        <div class="team-name">{{ match.participant2Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant2Score }}
                        </div>
                      </div>
                    </div>

                    <div class="match-footer" *ngIf="match.completed || isMatchLive(match)">
                      <div class="status-badge" [ngClass]="{'completed': match.completed, 'live': isMatchLive(match)}">
                        <mat-icon>{{ match.completed ? 'check_circle' : 'play_circle' }}</mat-icon>
                        <span>{{ match.completed ? 'Completed' : 'Live' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Unscheduled Finals Matches -->
              <div *ngIf="getUnscheduledFinalsMatches().length > 0" class="date-section">
                <div class="date-badge unscheduled-badge">
                  <mat-icon>event_busy</mat-icon>
                  <span>To Be Scheduled</span>
                </div>

                <div class="matches-grid">
                  <div *ngFor="let match of getUnscheduledFinalsMatches()" class="match-card-modern unscheduled">
                    <div class="match-header">
                      <div class="match-time-badge unscheduled">
                        <mat-icon>schedule</mat-icon>
                        <span>TBD</span>
                      </div>
                      <div class="match-stage-badge finals">
                        {{ getStageLabel(match) }}
                      </div>
                    </div>

                    <div class="match-body">
                      <div class="team team-1">
                        <div class="team-name">{{ match.participant1Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant1Score }}
                        </div>
                      </div>

                      <div class="match-vs">
                        <span>VS</span>
                      </div>

                      <div class="team team-2">
                        <div class="team-name">{{ match.participant2Name }}</div>
                        <div class="team-score" *ngIf="match.completed">
                          {{ match.score?.participant2Score }}
                        </div>
                      </div>
                    </div>

                    <div class="match-footer" *ngIf="match.completed || isMatchLive(match)">
                      <div class="status-badge" [ngClass]="{'completed': match.completed, 'live': isMatchLive(match)}">
                        <mat-icon>{{ match.completed ? 'check_circle' : 'play_circle' }}</mat-icon>
                        <span>{{ match.completed ? 'Completed' : 'Live' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .public-schedule-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1.5rem;
    }

    .loading-container p {
      color: #667eea;
      font-size: 1.125rem;
      font-weight: 500;
    }

    /* Schedule Content */
    .schedule-content {
      max-width: 1200px;
      margin: -2rem auto 0;
      padding: 0 1rem 2rem;
      position: relative;
      z-index: 2;
    }

    /* Tabs */
    ::ng-deep .mat-mdc-tab-group {
      background: white;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    ::ng-deep .mat-mdc-tab-labels {
      background: white;
      border-bottom: 1px solid #e9ecef;
    }

    ::ng-deep .mat-mdc-tab {
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .tab-content {
      padding: 2rem 1.5rem;
      background: white;
      border-radius: 0 0 16px 16px;
      min-height: 400px;
    }

    /* Date Section */
    .date-section {
      margin-bottom: 3rem;
    }

    .date-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .date-badge mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .date-badge.unscheduled-badge {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }

    /* Matches Grid */
    .matches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    /* Modern Match Card */
    .match-card-modern {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
    }

    .match-card-modern:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: #667eea;
    }

    .match-card-modern.unscheduled {
      border-color: #ffecb3;
      background: #fffef7;
    }

    .match-card-modern.unscheduled:hover {
      border-color: #ff9800;
    }

    /* Match Header */
    .match-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #dee2e6;
    }

    .match-time-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #495057;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .match-time-badge mat-icon {
      font-size: 1.125rem;
      width: 1.125rem;
      height: 1.125rem;
      color: #667eea;
    }

    .match-time-badge.unscheduled {
      color: #ff9800;
    }

    .match-time-badge.unscheduled mat-icon {
      color: #ff9800;
    }

    .match-stage-badge {
      background: #667eea;
      color: white;
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .match-stage-badge.finals {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
    }

    /* Match Body */
    .match-body {
      padding: 1.5rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .team {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .team-name {
      font-size: 1rem;
      font-weight: 600;
      color: #212529;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .team-score {
      background: #667eea;
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .match-vs {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.875rem;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    /* Match Footer */
    .match-footer {
      padding: 1rem 1.25rem;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .status-badge.completed {
      color: #28a745;
    }

    .status-badge.live {
      color: #dc3545;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    .status-badge mat-icon {
      font-size: 1.125rem;
      width: 1.125rem;
      height: 1.125rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6c757d;
    }

    .empty-state mat-icon {
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      opacity: 0.3;
      margin-bottom: 1rem;
    }

    .empty-state p {
      font-size: 1.125rem;
      margin: 0;
    }

    /* Unscheduled Matches */
    .date-group {
      margin-bottom: 3rem;
    }

    .date-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #6c757d;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px dashed #dee2e6;
    }

    .date-header mat-icon {
      color: #adb5bd;
    }

    .matches-list {
      display: grid;
      gap: 1rem;
    }

    .match-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;
    }

    .match-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .match-card.unscheduled {
      opacity: 0.7;
      border: 2px dashed #dee2e6;
    }

    .match-info {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .match-stage {
      flex-shrink: 0;
    }

    .match-participants {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.95rem;
    }

    .participant {
      font-weight: 600;
      color: #212529;
    }

    .vs {
      color: #6c757d;
      font-weight: 500;
    }

    .tbd-label {
      flex-shrink: 0;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .schedule-content {
        margin-top: -1rem;
        padding: 0 0.75rem 1.5rem;
      }

      .tab-content {
        padding: 1.5rem 1rem;
      }

      .matches-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .match-body {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .team {
        justify-content: space-between;
      }

      .match-vs {
        align-self: center;
      }

      .date-badge {
        font-size: 0.875rem;
        padding: 0.625rem 1.25rem;
      }
    }

    @media (max-width: 480px) {
      .match-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .match-info {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .match-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      flex-shrink: 0;
    }

    .match-time mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .match-participants {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      font-size: 16px;
    }

    .participant {
      font-weight: 500;
    }

    .vs {
      color: rgba(0, 0, 0, 0.6);
      font-weight: 400;
    }

    .match-status {
      flex-shrink: 0;
    }

    .tbd-label {
      flex-shrink: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  `]
})
export class PublicScheduleComponent implements OnInit {
  tournamentId: string = '';
  tournamentName: string = '';
  matches: Match[] = [];
  loading: boolean = true;
  selectedTab: number = 0;
  actionButtons: ActionButton[] = [];
  themeImageUrl?: string;

  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo
  ) {}

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.params['id'];

    // Set theme image for specific tournament
    if (this.tournamentId === '68fa2733e6dbb8ba02ecbca5') {
      this.themeImageUrl = '/tournament-themes/68fa2733e6dbb8ba02ecbca5.png';
    }

    this.setupActionButtons();
    this.loadTournament();
    this.loadMatches();
  }

  setupActionButtons(): void {
    this.actionButtons = [
      { label: 'View Players', icon: 'people', route: ['/players/tournament', this.tournamentId], class: 'players-button' },
      { label: 'Teams', icon: 'groups', route: ['/teams/tournament', this.tournamentId], class: 'teams-button' },
      { label: 'View Standings', icon: 'leaderboard', route: ['/standings/tournament', this.tournamentId], class: 'standings-button' },
      { label: 'Live Scoring', icon: 'sports_score', route: ['/live', this.tournamentId], class: 'live-button' },
      { label: 'Rules', icon: 'gavel', route: ['/rules', this.tournamentId], class: 'rules-button' }
    ];
  }

  loadTournament(): void {
    this.apollo.query({
      query: GET_TOURNAMENT,
      variables: { id: this.tournamentId }
    }).subscribe({
      next: (result: any) => {
        this.tournamentName = result.data.tournament.name;
      },
      error: (error) => {
        console.error('Error loading tournament:', error);
      }
    });
  }

  loadMatches(): void {
    this.loading = true;
    this.apollo.query({
      query: GET_MATCHES,
      variables: { tournamentId: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result: any) => {
        this.matches = result.data.matches.map((match: any) => ({
          ...match,
          scheduledDate: match.scheduledDate ? new Date(match.scheduledDate) : null
        }));
        console.log('All matches:', this.matches);
        console.log('Group A matches:', this.getGroupAMatches());
        console.log('Group B matches:', this.getGroupBMatches());
        console.log('Finals matches:', this.getFinalsMatches());
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.loading = false;
      }
    });
  }

  getAllMatches(): Match[] {
    return this.matches;
  }

  getScheduledMatches(): Match[] {
    return this.matches.filter(m => m.scheduledDate);
  }

  getUnscheduledMatches(): Match[] {
    return this.matches.filter(m => !m.scheduledDate);
  }

  getGroupAMatches(): Match[] {
    return this.matches.filter(m => m.round === 1 && m.bracketType === 'winners');
  }

  getScheduledGroupAMatches(): Match[] {
    return this.getGroupAMatches().filter(m => m.scheduledDate);
  }

  getUnscheduledGroupAMatches(): Match[] {
    return this.getGroupAMatches().filter(m => !m.scheduledDate);
  }

  getGroupBMatches(): Match[] {
    return this.matches.filter(m => m.round === 1 && m.bracketType === 'losers');
  }

  getScheduledGroupBMatches(): Match[] {
    return this.getGroupBMatches().filter(m => m.scheduledDate);
  }

  getUnscheduledGroupBMatches(): Match[] {
    return this.getGroupBMatches().filter(m => !m.scheduledDate);
  }

  getFinalsMatches(): Match[] {
    return this.matches.filter(m => (m.round === 2 || m.round === 3));
  }

  getScheduledFinalsMatches(): Match[] {
    return this.getFinalsMatches().filter(m => m.scheduledDate);
  }

  getUnscheduledFinalsMatches(): Match[] {
    return this.getFinalsMatches().filter(m => !m.scheduledDate);
  }

  groupMatchesByDate(matches: Match[]): GroupedMatch[] {
    const grouped = matches.reduce((acc: { [key: string]: Match[] }, match) => {
      if (match.scheduledDate) {
        const dateKey = new Date(match.scheduledDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(match);
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, matches]) => ({
        date,
        matches: matches.sort((a, b) => {
          if (!a.scheduledTime || !b.scheduledTime) return 0;
          return a.scheduledTime.localeCompare(b.scheduledTime);
        })
      }))
      .sort((a, b) => new Date(a.matches[0].scheduledDate!).getTime() - new Date(b.matches[0].scheduledDate!).getTime());
  }

  getStageLabel(match: Match): string {
    if (match.round === 1) {
      return match.bracketType === 'winners' ? 'Group A' : 'Group B';
    } else if (match.round === 2) {
      // For round-robin tournaments, round 2 contains Finals and 3rd Place
      return match.bracketType === 'winners' ? 'Final' : '3rd Place';
    } else if (match.round === 3) {
      return match.bracketType === 'winners' ? 'Final' : '3rd Place';
    }
    return 'Unknown';
  }

  getMatchStatus(match: Match): MatchStatus {
    if (match.completed) {
      return 'completed';
    }

    // If the match has a score (any non-zero values), it means scoring has started
    // This is the most accurate indicator that a match is live
    const hasScore = match.score && (
      match.score.participant1Score > 0 ||
      match.score.participant2Score > 0
    );

    if (hasScore) {
      return 'live';
    }

    // Fallback: Check if match is within the scheduled time window
    if (!match.scheduledDate || !match.scheduledTime) {
      return 'upcoming';
    }

    const now = new Date();
    const matchDate = new Date(match.scheduledDate);
    const [hours, minutes] = match.scheduledTime.split(':').map(Number);
    matchDate.setHours(hours, minutes, 0, 0);

    // Consider a match "live" if it's within a 3-hour window from scheduled time
    // (e.g., started up to 2 hours ago and not completed yet)
    const timeDifference = now.getTime() - matchDate.getTime();
    const threeHoursInMs = 3 * 60 * 60 * 1000;

    if (timeDifference >= 0 && timeDifference <= threeHoursInMs) {
      return 'live';
    }

    return 'upcoming';
  }

  isMatchLive(match: Match): boolean {
    return this.getMatchStatus(match) === 'live';
  }
}
