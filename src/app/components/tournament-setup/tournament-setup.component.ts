import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { createTournament } from '../../store/tournament.actions';
import { selectMode, selectLoading, selectError, selectTournament } from '../../store/tournament.selectors';

@Component({
  selector: 'app-tournament-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card class="tournament-setup-card" *ngIf="!tournament()">
      <mat-card-header>
        <mat-card-title>🎾 Create Tournament</mat-card-title>
        <mat-card-subtitle>
          {{ mode() === 'singles' ? 'Singles Tournament (8 players)' : 'Doubles Tournament (8 teams)' }}
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content class="p-6">
        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Tournament Name</mat-label>
            <input 
              matInput 
              [(ngModel)]="tournamentName" 
              name="tournamentName"
              placeholder="Enter tournament name"
              required
              #nameInput="ngModel">
            <mat-icon matSuffix>event</mat-icon>
            <mat-error *ngIf="nameInput.invalid && nameInput.touched">
              Tournament name is required
            </mat-error>
          </mat-form-field>
          
          <div class="tournament-info">
            <div class="info-item">
              <mat-icon>people</mat-icon>
              <span>{{ mode() === 'singles' ? '8 players' : '8 teams (16 players)' }}</span>
            </div>
            <div class="info-item">
              <mat-icon>schedule</mat-icon>
              <span>3 rounds per {{ mode() === 'singles' ? 'player' : 'team' }}</span>
            </div>
            <div class="info-item">
              <mat-icon>emoji_events</mat-icon>
              <span>Winners & Consolation brackets</span>
            </div>
          </div>
          
          <div class="error-message" *ngIf="error()">
            <mat-icon>error</mat-icon>
            {{ error() }}
          </div>
          
          <div class="action-buttons">
            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              [disabled]="form.invalid || loading()"
              class="create-button">
              <mat-icon *ngIf="loading()">refresh</mat-icon>
              <mat-icon *ngIf="!loading()">add</mat-icon>
              {{ loading() ? 'Creating...' : 'Create Tournament' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
    
    <mat-card class="tournament-created-card" *ngIf="tournament()">
      <mat-card-header>
        <mat-card-title>✅ Tournament Created</mat-card-title>
        <mat-card-subtitle>{{ tournament()?.name }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content class="p-6">
        <div class="success-info">
          <div class="info-item">
            <mat-icon>event</mat-icon>
            <span>{{ tournament()?.name }}</span>
          </div>
          <div class="info-item">
            <mat-icon>category</mat-icon>
            <span>{{ tournament()?.mode | titlecase }} Mode</span>
          </div>
          <div class="info-item">
            <mat-icon>people</mat-icon>
            <span>{{ tournament()?.currentParticipants }}/{{ tournament()?.maxParticipants }} registered</span>
          </div>
        </div>
        
        <p class="next-step">
          🎯 Next step: Start registering {{ mode() === 'singles' ? 'players' : 'teams' }} for your tournament!
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .tournament-setup-card, 
    .tournament-created-card {
      max-width: 600px;
      margin: var(--space-8) auto;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .w-full {
      width: 100%;
    }

    .tournament-info {
      margin: var(--space-6) 0;
      padding: var(--space-4);
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(15px);
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-3) 0;
      color: var(--neutral-700);
      font-size: var(--text-base);
      min-height: 44px; /* Accessibility touch target */
    }

    .info-item mat-icon {
      color: var(--primary-500);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--error);
      margin: var(--space-4) 0;
      padding: var(--space-3);
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: var(--radius-md);
      font-weight: var(--font-medium);
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      margin-top: var(--space-8);
    }

    .create-button {
      padding: var(--space-3) var(--space-8);
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      min-height: 44px; /* Accessibility touch target */
      border-radius: var(--radius-md);
    }

    .create-button mat-icon {
      margin-right: var(--space-2);
    }

    .create-button[disabled] {
      opacity: 0.6;
    }

    .success-info {
      background: rgba(76, 175, 80, 0.1);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(76, 175, 80, 0.3);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      margin: var(--space-4) 0;
    }

    .next-step {
      text-align: center;
      font-style: italic;
      color: var(--neutral-600);
      margin-top: var(--space-6);
      font-size: var(--text-lg);
      line-height: var(--leading-relaxed);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .create-button[disabled] mat-icon {
      animation: spin 1s linear infinite;
    }

    /* === RESPONSIVE DESIGN === */
    @media (max-width: 768px) {
      .tournament-setup-card, 
      .tournament-created-card {
        margin: var(--space-4);
        max-width: none;
      }
      
      .tournament-info {
        margin: var(--space-4) 0;
        padding: var(--space-3);
      }
      
      .info-item {
        margin: var(--space-2) 0;
        font-size: var(--text-sm);
      }
      
      .create-button {
        width: 100%;
        max-width: 300px;
      }
      
      .next-step {
        font-size: var(--text-base);
      }
    }

    @media (max-width: 480px) {
      .tournament-setup-card, 
      .tournament-created-card {
        margin: var(--space-3);
      }
      
      .action-buttons {
        margin-top: var(--space-6);
      }
    }

    /* === HIGH CONTRAST MODE === */
    @media (prefers-contrast: high) {
      .tournament-info {
        border: 2px solid var(--neutral-600);
      }
      
      .error-message {
        border: 2px solid var(--error);
      }
      
      .success-info {
        border: 2px solid var(--primary-500);
      }
    }

    /* === REDUCED MOTION === */
    @media (prefers-reduced-motion: reduce) {
      .create-button[disabled] mat-icon {
        animation: none;
      }
    }
  `]
})
export class TournamentSetupComponent {
  tournamentName = '';
  mode = signal<'singles' | 'doubles'>('singles');
  loading = signal(false);
  error = signal<string | null>(null);
  tournament = signal<any>(null);

  constructor(private store: Store) {
    this.store.select(selectMode).subscribe(mode => {
      this.mode.set(mode);
    });
    
    this.store.select(selectLoading).subscribe(loading => {
      this.loading.set(loading);
    });
    
    this.store.select(selectError).subscribe(error => {
      this.error.set(error);
    });
    
    this.store.select(selectTournament).subscribe(tournament => {
      this.tournament.set(tournament);
    });
  }

  onSubmit() {
    if (this.tournamentName.trim()) {
      this.store.dispatch(createTournament({ 
        name: this.tournamentName.trim(), 
        mode: this.mode() 
      }));
    }
  }
}