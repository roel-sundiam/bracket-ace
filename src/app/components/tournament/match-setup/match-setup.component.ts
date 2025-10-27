import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { Apollo } from 'apollo-angular';
import { Team, Match } from '../../../models/tournament.model';
import { TournamentNavigationComponent } from '../tournament-navigation/tournament-navigation.component';
import { QuickTournamentService } from '../../../services/quick-tournament.service';
import { GENERATE_ROUND_ROBIN_MATCHES, GET_MATCHES } from '../../../graphql/tournament.graphql';

interface GroupMatch extends Match {
  team1?: Team;
  team2?: Team;
  group: 'A' | 'B';
  matchNumber: number;
}

@Component({
  selector: 'app-match-setup',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TournamentNavigationComponent
  ],
  template: `
    <div class="match-setup-container">
      <!-- Tournament Navigation -->
      <app-tournament-navigation
        [tournamentId]="tournamentId"
        [currentStep]="'match-setup'"
        [completedSteps]="['player-management', 'team-pairing', 'group-assignment']">
      </app-tournament-navigation>

      <div class="header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Round Robin Matches</h1>
            <p class="subtitle">Review and generate matches for group stage</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            mat-stroked-button
            (click)="regenerateMatches()"
            *ngIf="groupMatches().length > 0">
            <mat-icon>refresh</mat-icon>
            Regenerate
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="proceedToScoring()"
            [disabled]="groupMatches().length === 0">
            <mat-icon>scoreboard</mat-icon>
            Start Tournament
          </button>
        </div>
      </div>

      <!-- Tournament Overview -->
      <mat-card class="overview-card">
        <mat-card-content>
          <div class="tournament-overview">
            <div class="overview-item">
              <mat-icon>groups</mat-icon>
              <div class="overview-details">
                <span class="overview-label">Total Teams</span>
                <span class="overview-value">{{ totalTeams }}</span>
              </div>
            </div>
            <mat-divider [vertical]="true"></mat-divider>
            <div class="overview-item">
              <mat-icon>sports_tennis</mat-icon>
              <div class="overview-details">
                <span class="overview-label">Group Matches</span>
                <span class="overview-value">{{ groupMatches().length }}</span>
              </div>
            </div>
            <mat-divider [vertical]="true"></mat-divider>
            <div class="overview-item">
              <mat-icon>emoji_events</mat-icon>
              <div class="overview-details">
                <span class="overview-label">Finals Matches</span>
                <span class="overview-value">2</span>
              </div>
            </div>
            <mat-divider [vertical]="true"></mat-divider>
            <div class="overview-item">
              <mat-icon>calculate</mat-icon>
              <div class="overview-details">
                <span class="overview-label">Total Matches</span>
                <span class="overview-value">{{ groupMatches().length + 2 }}</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Generate Matches Button -->
      <div class="generate-section" *ngIf="groupMatches().length === 0">
        <mat-card class="generate-card">
          <mat-card-content>
            <div class="generate-content">
              <mat-icon>auto_awesome</mat-icon>
              <h2>Ready to Generate Matches</h2>
              <p>Click below to automatically generate round robin matches for both groups</p>
              <button
                mat-raised-button
                color="primary"
                (click)="generateRoundRobinMatches()">
                <mat-icon>play_arrow</mat-icon>
                Generate Round Robin Matches
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Group Matches Display -->
      <div class="matches-layout" *ngIf="groupMatches().length > 0">
        <!-- Group A Matches -->
        <mat-card class="group-matches-card group-a-card">
          <mat-card-header>
            <mat-card-title>
              <div class="group-title">
                <mat-icon>groups</mat-icon>
                <span>Group A - Round Robin</span>
                <mat-chip class="match-count-chip">{{ getGroupAMatches().length }} matches</mat-chip>
              </div>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="group-teams">
              <div class="teams-header">Teams in Group A:</div>
              <div class="teams-list">
                <div *ngFor="let team of groupATeams; let i = index" class="team-chip">
                  <span class="team-number">{{ i + 1 }}</span>
                  {{ team.name }}
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="matches-list">
              <div *ngFor="let match of getGroupAMatches()" class="match-item">
                <div class="match-label">Match {{ match.matchNumber }}</div>
                <div class="match-teams">
                  <div class="match-team">
                    <span class="team-name">{{ match.team1?.name }}</span>
                    <span class="team-players">{{ match.team1?.player1?.firstName }} & {{ match.team1?.player2?.firstName }}</span>
                  </div>
                  <div class="vs">VS</div>
                  <div class="match-team">
                    <span class="team-name">{{ match.team2?.name }}</span>
                    <span class="team-players">{{ match.team2?.player1?.firstName }} & {{ match.team2?.player2?.firstName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Group B Matches -->
        <mat-card class="group-matches-card group-b-card">
          <mat-card-header>
            <mat-card-title>
              <div class="group-title">
                <mat-icon>groups</mat-icon>
                <span>Group B - Round Robin</span>
                <mat-chip class="match-count-chip">{{ getGroupBMatches().length }} matches</mat-chip>
              </div>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="group-teams">
              <div class="teams-header">Teams in Group B:</div>
              <div class="teams-list">
                <div *ngFor="let team of groupBTeams; let i = index" class="team-chip">
                  <span class="team-number">{{ i + 1 }}</span>
                  {{ team.name }}
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="matches-list">
              <div *ngFor="let match of getGroupBMatches()" class="match-item">
                <div class="match-label">Match {{ match.matchNumber }}</div>
                <div class="match-teams">
                  <div class="match-team">
                    <span class="team-name">{{ match.team1?.name }}</span>
                    <span class="team-players">{{ match.team1?.player1?.firstName }} & {{ match.team1?.player2?.firstName }}</span>
                  </div>
                  <div class="vs">VS</div>
                  <div class="match-team">
                    <span class="team-name">{{ match.team2?.name }}</span>
                    <span class="team-players">{{ match.team2?.player1?.firstName }} & {{ match.team2?.player2?.firstName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Finals Preview -->
      <mat-card class="finals-preview-card" *ngIf="groupMatches().length > 0">
        <mat-card-header>
          <mat-card-title>
            <div class="finals-title">
              <mat-icon>emoji_events</mat-icon>
              <span>Finals Stage</span>
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="finals-structure">
            <div class="finals-match">
              <div class="finals-match-header">
                <mat-icon class="gold">emoji_events</mat-icon>
                <span>Finals (1st & 2nd Place)</span>
              </div>
              <div class="finals-matchup">
                <div class="finals-team">1st Place Group A</div>
                <div class="finals-vs">VS</div>
                <div class="finals-team">1st Place Group B</div>
              </div>
            </div>

            <div class="finals-match">
              <div class="finals-match-header">
                <mat-icon class="bronze">military_tech</mat-icon>
                <span>3rd & 4th Place Match</span>
              </div>
              <div class="finals-matchup">
                <div class="finals-team">2nd Place Group A</div>
                <div class="finals-vs">VS</div>
                <div class="finals-team">2nd Place Group B</div>
              </div>
            </div>
          </div>
          <div class="finals-note">
            <mat-icon>info</mat-icon>
            <span>Finals matches will be available after group stage is completed</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .match-setup-container {
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

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .overview-card {
      margin-bottom: 2rem;
    }

    .tournament-overview {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 1rem 0;
    }

    .overview-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .overview-item mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #667eea;
    }

    .overview-details {
      display: flex;
      flex-direction: column;
    }

    .overview-label {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .overview-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.87);
    }

    .generate-section {
      margin: 2rem 0;
    }

    .generate-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .generate-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 2rem;
      text-align: center;
    }

    .generate-content mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
    }

    .generate-content h2 {
      margin: 0 0 0.5rem 0;
    }

    .generate-content p {
      margin: 0 0 2rem 0;
      opacity: 0.9;
    }

    .generate-content button {
      background: white;
      color: #667eea;
    }

    .matches-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .group-matches-card {
      height: fit-content;
    }

    .group-a-card {
      border-top: 4px solid #2196f3;
    }

    .group-b-card {
      border-top: 4px solid #ff9800;
    }

    .group-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }

    .match-count-chip {
      margin-left: auto;
    }

    .group-teams {
      padding: 1rem 0;
    }

    .teams-header {
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .teams-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .team-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f5f5f5;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .team-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
    }

    mat-divider {
      margin: 1rem 0;
    }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .match-item {
      padding: 1rem;
      background: #fafafa;
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }

    .match-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .match-teams {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .match-team {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .team-name {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .team-players {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .vs {
      font-weight: 700;
      color: rgba(0, 0, 0, 0.5);
      padding: 0 0.5rem;
    }

    .finals-preview-card {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    }

    .finals-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .finals-structure {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .finals-match {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .finals-match-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .finals-match-header mat-icon.gold {
      color: #ffd700;
    }

    .finals-match-header mat-icon.bronze {
      color: #cd7f32;
    }

    .finals-matchup {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .finals-team {
      padding: 0.75rem 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      font-weight: 500;
      text-align: center;
    }

    .finals-vs {
      text-align: center;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.5);
    }

    .finals-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      font-size: 0.875rem;
    }
  `]
})
export class MatchSetupComponent implements OnInit {
  tournamentId: string = '';
  groupATeams: Team[] = [];
  groupBTeams: Team[] = [];
  groupMatches = signal<GroupMatch[]>([]);
  totalTeams = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private snackBar: MatSnackBar,
    private quickTournamentService: QuickTournamentService,
    private apollo: Apollo
  ) {}

  async ngOnInit(): Promise<void> {
    this.tournamentId = this.route.snapshot.paramMap.get('id') || '';

    // Load groups from service
    this.groupATeams = await this.quickTournamentService.getGroupA(this.tournamentId);
    this.groupBTeams = await this.quickTournamentService.getGroupB(this.tournamentId);

    this.totalTeams = this.groupATeams.length + this.groupBTeams.length;

    // Check if matches already exist in the database
    this.apollo.query<{ matches: Match[] }>({
      query: GET_MATCHES,
      variables: { tournamentId: this.tournamentId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        console.log('Loaded matches from database:', result);
        if (result && result.data && result.data.matches && result.data.matches.length > 0) {
          // Matches already exist - load them and display
          console.log('Found existing matches, loading them...');
          this.loadExistingMatches(result.data.matches);
        } else {
          console.log('No matches found in database - user needs to generate or start tournament');
        }
      },
      error: (error) => {
        console.error('Error loading matches:', error);
      }
    });
  }

  loadExistingMatches(matches: Match[]): void {
    const groupMatches: GroupMatch[] = [];
    let matchCounterA = 1;
    let matchCounterB = 1;

    // Process matches and enrich with team data
    matches.forEach((match) => {
      // Only load round 1 matches (group stage), not the knockout matches
      if (match.round === 1) {
        const isGroupA = match.bracketType === 'winners';
        const group = isGroupA ? 'A' : 'B';
        const matchNumber = isGroupA ? matchCounterA++ : matchCounterB++;

        // Find team data for this match
        const team1 = isGroupA
          ? this.groupATeams.find(t => t.id === match.participant1)
          : this.groupBTeams.find(t => t.id === match.participant1);

        const team2 = isGroupA
          ? this.groupATeams.find(t => t.id === match.participant2)
          : this.groupBTeams.find(t => t.id === match.participant2);

        groupMatches.push({
          ...match,
          team1,
          team2,
          group,
          matchNumber
        });
      }
    });

    // Sort matches by group and match number
    groupMatches.sort((a, b) => {
      if (a.group !== b.group) {
        return a.group === 'A' ? -1 : 1;
      }
      return a.matchNumber - b.matchNumber;
    });

    this.groupMatches.set(groupMatches);
  }

  generateRoundRobinMatches(): void {
    const matches: GroupMatch[] = [];
    let matchCounter = 1;

    // Generate Group A matches (round robin)
    for (let i = 0; i < this.groupATeams.length; i++) {
      for (let j = i + 1; j < this.groupATeams.length; j++) {
        matches.push({
          id: `match_a_${matchCounter}`,
          tournamentId: this.tournamentId,
          round: 0, // 0 = group stage
          bracketType: 'winners',
          participant1: this.groupATeams[i].id,
          participant2: this.groupATeams[j].id,
          team1: this.groupATeams[i],
          team2: this.groupATeams[j],
          group: 'A',
          matchNumber: matchCounter,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        matchCounter++;
      }
    }

    // Reset counter for Group B
    matchCounter = 1;

    // Generate Group B matches (round robin)
    for (let i = 0; i < this.groupBTeams.length; i++) {
      for (let j = i + 1; j < this.groupBTeams.length; j++) {
        matches.push({
          id: `match_b_${matchCounter}`,
          tournamentId: this.tournamentId,
          round: 0,
          bracketType: 'winners',
          participant1: this.groupBTeams[i].id,
          participant2: this.groupBTeams[j].id,
          team1: this.groupBTeams[i],
          team2: this.groupBTeams[j],
          group: 'B',
          matchNumber: matchCounter,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        matchCounter++;
      }
    }

    this.groupMatches.set(matches);
    this.snackBar.open('Round robin matches generated successfully', 'Close', { duration: 3000 });
  }

  regenerateMatches(): void {
    this.groupMatches.set([]);
    setTimeout(() => this.generateRoundRobinMatches(), 100);
  }

  getGroupAMatches(): GroupMatch[] {
    return this.groupMatches().filter(m => m.group === 'A');
  }

  getGroupBMatches(): GroupMatch[] {
    return this.groupMatches().filter(m => m.group === 'B');
  }

  proceedToScoring(): void {
    if (this.groupMatches().length === 0) {
      this.snackBar.open('Please generate matches first', 'Close', { duration: 3000 });
      return;
    }

    console.log('Saving matches to database...');
    console.log('Group A teams:', this.groupATeams.length);
    console.log('Group B teams:', this.groupBTeams.length);

    // Save matches to database before proceeding
    this.apollo.mutate({
      mutation: GENERATE_ROUND_ROBIN_MATCHES,
      variables: { tournamentId: this.tournamentId }
    }).subscribe({
      next: (result) => {
        this.snackBar.open('Matches saved successfully! Starting tournament...', 'Close', { duration: 3000 });
        this.router.navigate(['/tournament', this.tournamentId, 'live-scoring']);
      },
      error: (error) => {
        console.error('Error saving matches:', error);
        this.snackBar.open('Failed to save matches: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tournament', this.tournamentId, 'group-assignment']);
  }
}
