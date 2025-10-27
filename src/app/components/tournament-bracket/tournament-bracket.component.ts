import { Component, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Store } from '@ngrx/store';
import { Tournament, Match, Player, Team, BracketState } from '../../models/tournament.model';
import { MatchScoringService } from '../../services/match-scoring.service';
import { MatchScoringComponent } from '../match-scoring/match-scoring.component';
import { 
  loadBracket,
  submitMatchResult
} from '../../store/tournament.actions';
import { 
  selectTournament, 
  selectMode, 
  selectPlayers, 
  selectTeams, 
  selectMatches,
  selectLoading 
} from '../../store/tournament.selectors';

interface BracketMatch extends Match {
  participant1Name?: string;
  participant2Name?: string;
  canEnterResult?: boolean;
}

@Component({
  selector: 'app-tournament-bracket',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatExpansionModule,
    MatchScoringComponent
  ],
  template: `
    <div class="bracket-container" *ngIf="tournament()">
      <div class="bracket-header">
        <h2 class="bracket-title">🏆 {{ tournament()?.name }} - Tournament Bracket</h2>
        <p class="bracket-subtitle">
          {{ mode() === 'singles' ? 'Singles' : 'Doubles' }} Tournament - 
          {{ tournament()?.status | titlecase }}
        </p>
      </div>

      <!-- Live Scoring Section -->
      <div class="live-scoring-section" *ngIf="activeMatches().length > 0">
        <h3 class="section-title">
          <mat-icon>sports_score</mat-icon>
          Live Scoring ({{ activeMatches().length }} active matches)
        </h3>
        <div class="live-matches-grid">
          <app-match-scoring 
            *ngFor="let match of activeMatches()" 
            [match]="match">
          </app-match-scoring>
        </div>
      </div>

      <!-- Completed Matches Summary -->
      <div class="completed-matches-section" *ngIf="completedMatches().length > 0">
        <mat-expansion-panel class="completed-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>check_circle</mat-icon>
              Completed Matches ({{ completedMatches().length }})
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="completed-matches-list">
            <div *ngFor="let match of completedMatches()" class="completed-match-summary">
              <span class="match-label">{{ getMatchLabel(match) }}</span>
              <span class="match-result">
                {{ getWinnerName(match) }} def. {{ getLoserName(match) }}
                <span class="score">({{ match.score?.participant1Score || 0 }} - {{ match.score?.participant2Score || 0 }})</span>
              </span>
            </div>
          </div>
        </mat-expansion-panel>
      </div>

      <mat-tab-group class="bracket-tabs" [selectedIndex]="0">
        <!-- Winners Bracket Tab -->
        <mat-tab label="Winners Bracket">
          <div class="bracket-content">
            <div class="bracket-section">
              <h3 class="section-title">
                <mat-icon>emoji_events</mat-icon>
                Winners Bracket
              </h3>
              
              <div class="bracket-rounds">
                <!-- Quarter Finals -->
                <div class="bracket-round">
                  <h4 class="round-title">Quarter Finals</h4>
                  <div class="matches-column">
                    <div 
                      *ngFor="let match of getWinnersRound(1)" 
                      class="match-card"
                      [class.match-completed]="match.completed"
                      [class.match-pending]="!match.completed && canPlayMatch(match)">
                      
                      <div class="match-header">
                        <span class="match-id">QF{{ getMatchNumber(match, 1) }}</span>
                        <mat-icon *ngIf="match.completed" class="match-status">check_circle</mat-icon>
                        <mat-icon *ngIf="!match.completed && canPlayMatch(match)" class="match-status pending">schedule</mat-icon>
                      </div>
                      
                      <div class="match-participants">
                        <div class="participant" [class.winner]="match.winner === match.participant1">
                          <span class="participant-name">{{ getParticipantName(match.participant1) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant1Score }}
                          </span>
                        </div>
                        
                        <div class="vs-divider">VS</div>
                        
                        <div class="participant" [class.winner]="match.winner === match.participant2">
                          <span class="participant-name">{{ getParticipantName(match.participant2) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant2Score }}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        *ngIf="!match.completed && canPlayMatch(match)"
                        mat-stroked-button 
                        color="primary"
                        (click)="openMatchResult(match)"
                        class="enter-result-btn">
                        Enter Result
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Semi Finals -->
                <div class="bracket-round">
                  <h4 class="round-title">Semi Finals</h4>
                  <div class="matches-column">
                    <div 
                      *ngFor="let match of getWinnersRound(2)" 
                      class="match-card"
                      [class.match-completed]="match.completed"
                      [class.match-pending]="!match.completed && canPlayMatch(match)">
                      
                      <div class="match-header">
                        <span class="match-id">SF{{ getMatchNumber(match, 2) }}</span>
                        <mat-icon *ngIf="match.completed" class="match-status">check_circle</mat-icon>
                        <mat-icon *ngIf="!match.completed && canPlayMatch(match)" class="match-status pending">schedule</mat-icon>
                      </div>
                      
                      <div class="match-participants">
                        <div class="participant" [class.winner]="match.winner === match.participant1">
                          <span class="participant-name">{{ getParticipantName(match.participant1) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant1Score }}
                          </span>
                        </div>
                        
                        <div class="vs-divider">VS</div>
                        
                        <div class="participant" [class.winner]="match.winner === match.participant2">
                          <span class="participant-name">{{ getParticipantName(match.participant2) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant2Score }}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        *ngIf="!match.completed && canPlayMatch(match)"
                        mat-stroked-button 
                        color="primary"
                        (click)="openMatchResult(match)"
                        class="enter-result-btn">
                        Enter Result
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Finals -->
                <div class="bracket-round">
                  <h4 class="round-title">Final</h4>
                  <div class="matches-column">
                    <div 
                      *ngFor="let match of getWinnersRound(3)" 
                      class="match-card final-match"
                      [class.match-completed]="match.completed"
                      [class.match-pending]="!match.completed && canPlayMatch(match)">
                      
                      <div class="match-header">
                        <span class="match-id">FINAL</span>
                        <mat-icon *ngIf="match.completed" class="match-status">emoji_events</mat-icon>
                        <mat-icon *ngIf="!match.completed && canPlayMatch(match)" class="match-status pending">schedule</mat-icon>
                      </div>
                      
                      <div class="match-participants">
                        <div class="participant" [class.winner]="match.winner === match.participant1" [class.champion]="match.winner === match.participant1 && match.completed">
                          <span class="participant-name">{{ getParticipantName(match.participant1) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant1Score }}
                          </span>
                        </div>
                        
                        <div class="vs-divider">VS</div>
                        
                        <div class="participant" [class.winner]="match.winner === match.participant2" [class.champion]="match.winner === match.participant2 && match.completed">
                          <span class="participant-name">{{ getParticipantName(match.participant2) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant2Score }}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        *ngIf="!match.completed && canPlayMatch(match)"
                        mat-raised-button 
                        color="primary"
                        (click)="openMatchResult(match)"
                        class="enter-result-btn">
                        Enter Result
                      </button>
                      
                      <div *ngIf="match.completed && match.winner" class="champion-banner">
                        <mat-icon>emoji_events</mat-icon>
                        <span>🏆 {{ getParticipantName(match.winner) }} - CHAMPION!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Consolation Bracket Tab -->
        <mat-tab label="Consolation Bracket">
          <div class="bracket-content">
            <div class="bracket-section consolation">
              <h3 class="section-title">
                <mat-icon>military_tech</mat-icon>
                Consolation Bracket
              </h3>
              
              <div class="bracket-rounds">
                <!-- Consolation matches for eliminated players -->
                <div class="bracket-round">
                  <h4 class="round-title">Consolation Semi Finals</h4>
                  <div class="matches-column">
                    <div 
                      *ngFor="let match of getLosersRound(1)" 
                      class="match-card consolation-match"
                      [class.match-completed]="match.completed"
                      [class.match-pending]="!match.completed && canPlayMatch(match)">
                      
                      <div class="match-header">
                        <span class="match-id">CSF{{ getMatchNumber(match, 1) }}</span>
                        <mat-icon *ngIf="match.completed" class="match-status">check_circle</mat-icon>
                      </div>
                      
                      <div class="match-participants">
                        <div class="participant" [class.winner]="match.winner === match.participant1">
                          <span class="participant-name">{{ getParticipantName(match.participant1) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant1Score }}
                          </span>
                        </div>
                        
                        <div class="vs-divider">VS</div>
                        
                        <div class="participant" [class.winner]="match.winner === match.participant2">
                          <span class="participant-name">{{ getParticipantName(match.participant2) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant2Score }}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        *ngIf="!match.completed && canPlayMatch(match)"
                        mat-stroked-button 
                        color="accent"
                        (click)="openMatchResult(match)"
                        class="enter-result-btn">
                        Enter Result
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Consolation Final -->
                <div class="bracket-round">
                  <h4 class="round-title">Consolation Final</h4>
                  <div class="matches-column">
                    <div 
                      *ngFor="let match of getLosersRound(2)" 
                      class="match-card consolation-final"
                      [class.match-completed]="match.completed"
                      [class.match-pending]="!match.completed && canPlayMatch(match)">
                      
                      <div class="match-header">
                        <span class="match-id">3rd Place</span>
                        <mat-icon *ngIf="match.completed" class="match-status">military_tech</mat-icon>
                      </div>
                      
                      <div class="match-participants">
                        <div class="participant" [class.winner]="match.winner === match.participant1">
                          <span class="participant-name">{{ getParticipantName(match.participant1) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant1Score }}
                          </span>
                        </div>
                        
                        <div class="vs-divider">VS</div>
                        
                        <div class="participant" [class.winner]="match.winner === match.participant2">
                          <span class="participant-name">{{ getParticipantName(match.participant2) }}</span>
                          <span class="participant-score" *ngIf="match.score">
                            {{ match.score.participant2Score }}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        *ngIf="!match.completed && canPlayMatch(match)"
                        mat-raised-button 
                        color="accent"
                        (click)="openMatchResult(match)"
                        class="enter-result-btn">
                        Enter Result
                      </button>
                      
                      <div *ngIf="match.completed && match.winner" class="third-place-banner">
                        <mat-icon>military_tech</mat-icon>
                        <span>🥉 {{ getParticipantName(match.winner) }} - 3rd Place!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./tournament-bracket.component.scss']
})
export class TournamentBracketComponent implements OnInit {
  // Signals from store
  tournament = signal<Tournament | null>(null);
  mode = signal<'singles' | 'doubles'>('singles');
  players = signal<Player[]>([]);
  teams = signal<Team[]>([]);
  matches = signal<Match[]>([]);
  loading = signal(false);

  // Computed signals for live scoring
  activeMatches = computed(() => {
    return this.matches().filter(match => 
      !match.completed && 
      match.participant1 !== 'TBD' && 
      match.participant2 !== 'TBD'
    );
  });

  completedMatches = computed(() => {
    return this.matches().filter(match => match.completed);
  });

  // Get all live scores from scoring service
  liveScores = computed(() => this.matchScoringService.getAllScores());

  constructor(
    private store: Store,
    private matchScoringService: MatchScoringService
  ) {
    // Subscribe to store values
    this.store.select(selectTournament).subscribe(tournament => {
      this.tournament.set(tournament);
    });
    
    this.store.select(selectMode).subscribe(mode => {
      this.mode.set(mode);
    });
    
    this.store.select(selectPlayers).subscribe(players => {
      this.players.set(players);
    });
    
    this.store.select(selectTeams).subscribe(teams => {
      this.teams.set(teams);
    });
    
    this.store.select(selectMatches).subscribe(matches => {
      this.matches.set(matches);
    });
    
    this.store.select(selectLoading).subscribe(loading => {
      this.loading.set(loading);
    });

    // Effect to initialize matches in scoring service when matches change
    effect(() => {
      const matches = this.matches();
      if (matches.length > 0) {
        this.matchScoringService.initializeMatches(matches);
      }
    });
  }

  ngOnInit(): void {
    // Load bracket data if tournament exists
    if (this.tournament()?.id) {
      this.store.dispatch(loadBracket({ tournamentId: this.tournament()!.id }));
    }
  }

  getWinnersRound(round: number): Match[] {
    return this.matches().filter(match => 
      match.bracketType === 'winners' && match.round === round
    );
  }

  getLosersRound(round: number): Match[] {
    return this.matches().filter(match => 
      match.bracketType === 'losers' && match.round === round
    );
  }

  getParticipantName(participantId: string): string {
    if (this.mode() === 'singles') {
      const player = this.players().find(p => p.id === participantId);
      return player?.name || 'TBD';
    } else {
      const team = this.teams().find(t => t.id === participantId);
      return team?.name || 'TBD';
    }
  }

  getMatchNumber(match: Match, round: number): number {
    const roundMatches = this.matches().filter(m => 
      m.bracketType === match.bracketType && m.round === round
    );
    return roundMatches.findIndex(m => m.id === match.id) + 1;
  }

  canPlayMatch(match: Match): boolean {
    // A match can be played if both participants are determined and no winner yet
    return match.participant1 !== 'TBD' && 
           match.participant2 !== 'TBD' && 
           !match.completed;
  }

  openMatchResult(match: Match): void {
    // This would open a modal/dialog for entering match results
    // For now, we'll emit an event or navigate to a result entry component
    console.log('Opening match result entry for:', match);
  }

  // Helper methods for template
  getMatchLabel(match: Match): string {
    const roundNames = ['Quarter Final', 'Semi Final', 'Final'];
    const roundName = roundNames[match.round - 1] || 'Match';
    const bracketType = match.bracketType === 'winners' ? '' : ' (Consolation)';
    return roundName + bracketType;
  }

  getWinnerName(match: Match): string {
    if (!match.winner) return 'TBD';
    
    if (match.winner === match.participant1) {
      return match.participant1Name || this.getParticipantName(match.participant1);
    } else {
      return match.participant2Name || this.getParticipantName(match.participant2);
    }
  }

  getLoserName(match: Match): string {
    if (!match.loser) return 'TBD';
    
    if (match.loser === match.participant1) {
      return match.participant1Name || this.getParticipantName(match.participant1);
    } else {
      return match.participant2Name || this.getParticipantName(match.participant2);
    }
  }
}