import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Match, Player, Team } from '../../models/tournament.model';
import { submitMatchResult } from '../../store/tournament.actions';
import { selectPlayers, selectTeams, selectMode } from '../../store/tournament.selectors';

interface MatchResultData {
  match: Match;
  participant1Name: string;
  participant2Name: string;
}

@Component({
  selector: 'app-match-result',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule
  ],
  template: `
    <div class="match-result-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">
          <mat-icon>sports_tennis</mat-icon>
          Enter Match Result
        </h2>
        <p class="dialog-subtitle">{{ getMatchTitle() }}</p>
      </div>

      <div class="dialog-content">
        <!-- Match Info -->
        <div class="match-info">
          <div class="participant-info">
            <div class="participant-card" [class.selected]="selectedWinner() === data.match.participant1">
              <mat-icon>{{ mode() === 'singles' ? 'person' : 'groups' }}</mat-icon>
              <span class="participant-name">{{ data.participant1Name }}</span>
            </div>
            
            <div class="vs-section">
              <span class="vs-text">VS</span>
            </div>
            
            <div class="participant-card" [class.selected]="selectedWinner() === data.match.participant2">
              <mat-icon>{{ mode() === 'singles' ? 'person' : 'groups' }}</mat-icon>
              <span class="participant-name">{{ data.participant2Name }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Winner Selection -->
        <div class="winner-selection">
          <h3 class="section-title">Select Winner</h3>
          <mat-radio-group 
            [(ngModel)]="selectedWinner" 
            name="winner"
            class="winner-radio-group">
            <mat-radio-button 
              [value]="data.match.participant1"
              class="winner-radio-button">
              <div class="radio-content">
                <mat-icon>{{ mode() === 'singles' ? 'person' : 'groups' }}</mat-icon>
                <span>{{ data.participant1Name }}</span>
              </div>
            </mat-radio-button>
            
            <mat-radio-button 
              [value]="data.match.participant2"
              class="winner-radio-button">
              <div class="radio-content">
                <mat-icon>{{ mode() === 'singles' ? 'person' : 'groups' }}</mat-icon>
                <span>{{ data.participant2Name }}</span>
              </div>
            </mat-radio-button>
          </mat-radio-group>
        </div>

        <mat-divider></mat-divider>

        <!-- Score Entry -->
        <div class="score-entry">
          <h3 class="section-title">
            <mat-icon>scoreboard</mat-icon>
            Match Score (Optional)
          </h3>
          
          <div class="score-inputs">
            <div class="score-field">
              <mat-form-field appearance="outline">
                <mat-label>{{ data.participant1Name }} Score</mat-label>
                <input 
                  matInput 
                  type="number" 
                  min="0" 
                  max="99"
                  [(ngModel)]="participant1Score"
                  placeholder="0">
                <mat-icon matSuffix>sports_score</mat-icon>
              </mat-form-field>
            </div>
            
            <div class="score-divider">-</div>
            
            <div class="score-field">
              <mat-form-field appearance="outline">
                <mat-label>{{ data.participant2Name }} Score</mat-label>
                <input 
                  matInput 
                  type="number" 
                  min="0" 
                  max="99"
                  [(ngModel)]="participant2Score"
                  placeholder="0">
                <mat-icon matSuffix>sports_score</mat-icon>
              </mat-form-field>
            </div>
          </div>
          
          <p class="score-note">
            <mat-icon>info</mat-icon>
            Enter the final score for this match. Leave blank if you only want to record the winner.
          </p>
        </div>

        <!-- Match Summary -->
        <div class="match-summary" *ngIf="selectedWinner()">
          <h3 class="section-title">Match Summary</h3>
          <div class="summary-content">
            <div class="summary-item">
              <mat-icon class="winner-icon">emoji_events</mat-icon>
              <span class="summary-label">Winner:</span>
              <span class="summary-value">{{ getWinnerName() }}</span>
            </div>
            
            <div class="summary-item" *ngIf="hasScore()">
              <mat-icon>scoreboard</mat-icon>
              <span class="summary-label">Final Score:</span>
              <span class="summary-value">{{ participant1Score() }} - {{ participant2Score() }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button 
          mat-button 
          (click)="onCancel()"
          class="cancel-button">
          Cancel
        </button>
        
        <button 
          mat-raised-button 
          color="primary"
          [disabled]="!selectedWinner()"
          (click)="onSubmit()"
          class="submit-button">
          <mat-icon>check</mat-icon>
          Submit Result
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./match-result.component.scss']
})
export class MatchResultComponent implements OnInit {
  // Form data
  selectedWinner = signal<string>('');
  participant1Score = signal<number | null>(null);
  participant2Score = signal<number | null>(null);
  
  // Store data
  mode = signal<'singles' | 'doubles'>('singles');
  players = signal<Player[]>([]);
  teams = signal<Team[]>([]);

  // Computed values
  hasScore = computed(() => 
    this.participant1Score() !== null && this.participant2Score() !== null
  );

  constructor(
    private store: Store,
    private dialogRef: MatDialogRef<MatchResultComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchResultData
  ) {
    // Subscribe to store values
    this.store.select(selectMode).subscribe(mode => {
      this.mode.set(mode);
    });
    
    this.store.select(selectPlayers).subscribe(players => {
      this.players.set(players);
    });
    
    this.store.select(selectTeams).subscribe(teams => {
      this.teams.set(teams);
    });
  }

  ngOnInit(): void {
    // Initialize form if match already has results
    if (this.data.match.winner) {
      this.selectedWinner.set(this.data.match.winner);
    }
    
    if (this.data.match.score) {
      this.participant1Score.set(this.data.match.score.participant1Score);
      this.participant2Score.set(this.data.match.score.participant2Score);
    }
  }

  getMatchTitle(): string {
    const roundNames = {
      1: 'Quarter Final',
      2: 'Semi Final', 
      3: 'Final'
    };
    
    const roundName = roundNames[this.data.match.round as keyof typeof roundNames] || `Round ${this.data.match.round}`;
    const bracketType = this.data.match.bracketType === 'winners' ? 'Winners' : 'Consolation';
    
    return `${bracketType} ${roundName}`;
  }

  getWinnerName(): string {
    const winnerId = this.selectedWinner();
    if (winnerId === this.data.match.participant1) {
      return this.data.participant1Name;
    } else if (winnerId === this.data.match.participant2) {
      return this.data.participant2Name;
    }
    return '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    const winnerId = this.selectedWinner();
    const loserId = winnerId === this.data.match.participant1 
      ? this.data.match.participant2 
      : this.data.match.participant1;

    const result = {
      matchId: this.data.match.id,
      winnerId,
      loserId,
      score: this.hasScore() ? {
        participant1Score: this.participant1Score()!,
        participant2Score: this.participant2Score()!
      } : undefined
    };

    // Dispatch the result to the store
    this.store.dispatch(submitMatchResult(result));
    
    // Close the dialog with the result
    this.dialogRef.close(result);
  }
}

// Service component for opening the match result dialog
@Component({
  selector: 'app-match-result-dialog',
  template: '',
  standalone: true
})
export class MatchResultDialogService {
  constructor(private dialog: MatDialog) {}
  
  openMatchResultDialog(match: Match, participant1Name: string, participant2Name: string) {
    return this.dialog.open(MatchResultComponent, {
      data: { match, participant1Name, participant2Name },
      width: '600px',
      maxWidth: '90vw'
    });
  }
}