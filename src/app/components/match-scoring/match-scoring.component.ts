import { Component, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatchScoringService } from '../../services/match-scoring.service';
import { Match } from '../../models/tournament.model';

@Component({
  selector: 'app-match-scoring',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="match-scoring-card" [class.completed]="isCompleted()">
      <mat-card-header>
        <mat-card-title class="match-title">
          <mat-icon class="match-icon">sports_tennis</mat-icon>
          {{ matchInfo().round === 1 ? 'Quarter Final' : 
             matchInfo().round === 2 ? 'Semi Final' : 'Final' }}
          {{ matchInfo().bracketType === 'losers' ? '(Consolation)' : '' }}
        </mat-card-title>
        <mat-card-subtitle *ngIf="isCompleted()" class="completed-badge">
          <mat-chip color="primary">Completed</mat-chip>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Match Progress -->
        <div class="match-progress" *ngIf="!isCompleted()">
          <span class="progress-label">Match Progress</span>
          <mat-progress-bar 
            mode="determinate" 
            [value]="matchProgress()"
            color="accent">
          </mat-progress-bar>
          <span class="progress-text">{{ matchProgress() | number:'1.0-0' }}%</span>
        </div>

        <!-- Participants and Scores -->
        <div class="participants-container">
          <!-- Participant 1 -->
          <div class="participant-row" [class.winner]="isWinner(matchInfo().participant1)">
            <div class="participant-info">
              <mat-icon *ngIf="isWinner(matchInfo().participant1)" class="winner-icon">emoji_events</mat-icon>
              <span class="participant-name">{{ liveScore()?.participant1Name || 'TBD' }}</span>
            </div>
            <div class="score-controls">
              <button 
                mat-icon-button 
                (click)="decrementScore('A')" 
                [disabled]="isCompleted() || scoreA() <= 0"
                class="score-btn">
                <mat-icon>remove</mat-icon>
              </button>
              <div class="score-display">
                <mat-form-field appearance="outline" class="score-input">
                  <input 
                    matInput 
                    type="number" 
                    [(ngModel)]="scoreAInput"
                    (ngModelChange)="onScoreAChange($event)"
                    [disabled]="isCompleted()"
                    min="0"
                    max="20">
                </mat-form-field>
              </div>
              <button 
                mat-icon-button 
                (click)="incrementScore('A')" 
                [disabled]="isCompleted()"
                class="score-btn">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <!-- VS Divider -->
          <div class="vs-divider">
            <span class="vs-text">VS</span>
          </div>

          <!-- Participant 2 -->
          <div class="participant-row" [class.winner]="isWinner(matchInfo().participant2)">
            <div class="participant-info">
              <mat-icon *ngIf="isWinner(matchInfo().participant2)" class="winner-icon">emoji_events</mat-icon>
              <span class="participant-name">{{ liveScore()?.participant2Name || 'TBD' }}</span>
            </div>
            <div class="score-controls">
              <button 
                mat-icon-button 
                (click)="decrementScore('B')" 
                [disabled]="isCompleted() || scoreB() <= 0"
                class="score-btn">
                <mat-icon>remove</mat-icon>
              </button>
              <div class="score-display">
                <mat-form-field appearance="outline" class="score-input">
                  <input 
                    matInput 
                    type="number" 
                    [(ngModel)]="scoreBInput"
                    (ngModelChange)="onScoreBChange($event)"
                    [disabled]="isCompleted()"
                    min="0"
                    max="20">
                </mat-form-field>
              </div>
              <button 
                mat-icon-button 
                (click)="incrementScore('B')" 
                [disabled]="isCompleted()"
                class="score-btn">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Winner Announcement -->
        <div *ngIf="isCompleted() && winner()" class="winner-announcement">
          <mat-icon class="trophy-icon">emoji_events</mat-icon>
          <span class="winner-text">{{ winner()?.winnerName }} Wins!</span>
          <span class="final-score">{{ scoreA() }} - {{ scoreB() }}</span>
        </div>

        <!-- Match Actions -->
        <div class="match-actions" *ngIf="!isCompleted()">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="resetScores()"
            [disabled]="scoreA() === 0 && scoreB() === 0">
            <mat-icon>refresh</mat-icon>
            Reset Scores
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['./match-scoring.component.scss']
})
export class MatchScoringComponent {
  // Input signal for the match
  match = input.required<Match>();
  
  // Local score input tracking
  scoreAInput = 0;
  scoreBInput = 0;

  // Signals
  private _scoreA = signal(0);
  private _scoreB = signal(0);
  
  // Computed signals
  matchInfo = computed(() => this.match());
  liveScore = computed(() => this.matchScoringService.getMatchScore(this.match().id)());
  scoreA = computed(() => this._scoreA());
  scoreB = computed(() => this._scoreB());
  
  isCompleted = computed(() => {
    const score = this.liveScore();
    return score?.completed || false;
  });
  
  winner = computed(() => {
    if (this.isCompleted()) {
      return this.matchScoringService.getMatchWinner(this.match().id)();
    }
    return null;
  });
  
  loser = computed(() => {
    if (this.isCompleted()) {
      return this.matchScoringService.getMatchLoser(this.match().id)();
    }
    return null;
  });
  
  matchProgress = computed(() => {
    return this.matchScoringService.getMatchProgress(this.match().id)();
  });

  constructor(private matchScoringService: MatchScoringService) {
    // Effect to sync with live scores
    effect(() => {
      const liveScore = this.liveScore();
      if (liveScore) {
        this._scoreA.set(liveScore.scoreA);
        this._scoreB.set(liveScore.scoreB);
        this.scoreAInput = liveScore.scoreA;
        this.scoreBInput = liveScore.scoreB;
      }
    });

    // Effect to initialize match in scoring service
    effect(() => {
      const match = this.match();
      if (match) {
        this.matchScoringService.initializeMatch(match);
      }
    });
  }


  incrementScore(participant: 'A' | 'B'): void {
    if (this.isCompleted()) return;
    
    if (participant === 'A') {
      const newScore = this.scoreA() + 1;
      this._scoreA.set(newScore);
      this.scoreAInput = newScore;
      this.updateLiveScore();
    } else {
      const newScore = this.scoreB() + 1;
      this._scoreB.set(newScore);
      this.scoreBInput = newScore;
      this.updateLiveScore();
    }
  }

  decrementScore(participant: 'A' | 'B'): void {
    if (this.isCompleted()) return;
    
    if (participant === 'A' && this.scoreA() > 0) {
      const newScore = this.scoreA() - 1;
      this._scoreA.set(newScore);
      this.scoreAInput = newScore;
      this.updateLiveScore();
    } else if (participant === 'B' && this.scoreB() > 0) {
      const newScore = this.scoreB() - 1;
      this._scoreB.set(newScore);
      this.scoreBInput = newScore;
      this.updateLiveScore();
    }
  }

  onScoreAChange(value: number): void {
    if (this.isCompleted()) return;
    const clampedValue = Math.max(0, Math.min(20, value || 0));
    this._scoreA.set(clampedValue);
    this.scoreAInput = clampedValue;
    this.updateLiveScore();
  }

  onScoreBChange(value: number): void {
    if (this.isCompleted()) return;
    const clampedValue = Math.max(0, Math.min(20, value || 0));
    this._scoreB.set(clampedValue);
    this.scoreBInput = clampedValue;
    this.updateLiveScore();
  }

  resetScores(): void {
    if (this.isCompleted()) return;
    
    this._scoreA.set(0);
    this._scoreB.set(0);
    this.scoreAInput = 0;
    this.scoreBInput = 0;
    this.updateLiveScore();
  }

  isWinner(participantId: string): boolean {
    const winner = this.winner();
    return winner?.winnerId === participantId;
  }

  private updateLiveScore(): void {
    this.matchScoringService.updateScore(
      this.match().id,
      this.scoreA(),
      this.scoreB()
    );
  }
}