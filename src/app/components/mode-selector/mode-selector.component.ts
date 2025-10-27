import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { setTournamentMode, createTournament, createTournamentSuccess } from '../../store/tournament.actions';
import { selectMode, selectLoading } from '../../store/tournament.selectors';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-mode-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="mode-selector-container">
      <div class="section-header">
        <h2 class="section-title">Tournament Mode</h2>
        <p class="section-subtitle">Choose your tournament format</p>
      </div>
      
      <div class="mode-options">
        <div 
          class="mode-card" 
          [class.active]="selectedMode() === 'singles'"
          (click)="onModeChange('singles')">
          <div class="mode-icon">
            <mat-icon>person</mat-icon>
          </div>
          <div class="mode-content">
            <h3 class="mode-title">Singles Tournament</h3>
            <p class="mode-description">Individual player competition</p>
            <div class="mode-stats">
              <div class="stat">
                <span class="stat-number">8</span>
                <span class="stat-label">Players</span>
              </div>
              <div class="stat">
                <span class="stat-number">3</span>
                <span class="stat-label">Rounds</span>
              </div>
            </div>
          </div>
          <div class="mode-check" *ngIf="selectedMode() === 'singles'">
            <mat-icon>check_circle</mat-icon>
          </div>
        </div>
        
        <div 
          class="mode-card" 
          [class.active]="selectedMode() === 'doubles'"
          (click)="onModeChange('doubles')">
          <div class="mode-icon">
            <mat-icon>groups</mat-icon>
          </div>
          <div class="mode-content">
            <h3 class="mode-title">Doubles Tournament</h3>
            <p class="mode-description">Team-based competition</p>
            <div class="mode-stats">
              <div class="stat">
                <span class="stat-number">8</span>
                <span class="stat-label">Teams</span>
              </div>
              <div class="stat">
                <span class="stat-number">16</span>
                <span class="stat-label">Players</span>
              </div>
            </div>
          </div>
          <div class="mode-check" *ngIf="selectedMode() === 'doubles'">
            <mat-icon>check_circle</mat-icon>
          </div>
        </div>
      </div>
      
      <!-- Tournament Creation Form -->
      <div class="tournament-form" *ngIf="selectedMode()">
        <div class="form-header">
          <h3 class="form-title">Create Tournament</h3>
          <p class="form-subtitle">Enter tournament details to get started</p>
        </div>
        
        <div class="form-content">
          <mat-form-field appearance="outline" class="tournament-name-field">
            <mat-label>Tournament Name</mat-label>
            <input 
              matInput 
              [(ngModel)]="tournamentName"
              placeholder="Enter tournament name"
              [disabled]="loading()">
            <mat-icon matSuffix>sports_tennis</mat-icon>
          </mat-form-field>
          
          <div class="action-buttons">
            <button 
              mat-button 
              (click)="goBack()"
              [disabled]="loading()">
              <mat-icon>arrow_back</mat-icon>
              Back to Dashboard
            </button>
            
            <button 
              mat-raised-button 
              color="primary"
              [disabled]="!tournamentName.trim() || loading()"
              (click)="createTournament()"
              class="create-btn">
              <mat-icon>add</mat-icon>
              {{ loading() ? 'Creating...' : 'Create Tournament' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mode-selector-container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .section-title {
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: white;
      margin: 0 0 var(--space-2) 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-subtitle {
      font-size: var(--text-lg);
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      font-weight: var(--font-medium);
    }

    .mode-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
    }

    .mode-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      border: 2px solid rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
        transform: scaleX(0);
        transition: transform var(--transition-normal);
      }

      &:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.35);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
        border-color: rgba(255, 255, 255, 0.6);
        
        &::before {
          transform: scaleX(1);
        }
      }

      &.active {
        border-color: var(--secondary-400);
        background: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(255, 152, 0, 0.15);

        &::before {
          transform: scaleX(1);
        }

        .mode-icon mat-icon {
          color: var(--primary-500);
        }
      }
    }

    .mode-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, var(--neutral-100), var(--neutral-200));
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-4);
      transition: all var(--transition-normal);

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--neutral-600);
        transition: color var(--transition-normal);
      }
    }

    .mode-content {
      flex: 1;
    }

    .mode-title {
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      color: var(--neutral-900);
      margin: 0 0 var(--space-2) 0;
      line-height: 1.3;
    }

    .mode-description {
      font-size: var(--text-base);
      color: var(--neutral-600);
      margin: 0 0 var(--space-4) 0;
      line-height: 1.5;
    }

    .mode-stats {
      display: flex;
      gap: var(--space-6);
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--primary-600);
      line-height: 1;
    }

    .stat-label {
      display: block;
      font-size: var(--text-sm);
      color: var(--neutral-600);
      font-weight: var(--font-medium);
      margin-top: var(--space-1);
    }

    .mode-check {
      position: absolute;
      top: var(--space-4);
      right: var(--space-4);
      color: var(--primary-500);
      animation: scaleIn 200ms ease;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    // === Responsive Design ===
    @media (max-width: 768px) {
      .mode-options {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .mode-card {
        padding: var(--space-6);
      }

      .section-title {
        font-size: var(--text-2xl);
      }

      .section-subtitle {
        font-size: var(--text-base);
      }

      .mode-icon {
        width: 56px;
        height: 56px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .mode-title {
        font-size: var(--text-lg);
      }

      .mode-stats {
        gap: var(--space-4);
      }
    }

    @media (max-width: 480px) {
      .mode-card {
        padding: var(--space-4);
      }

      .mode-stats {
        gap: var(--space-3);
      }

      .stat-number {
        font-size: var(--text-xl);
      }
    }

    /* Tournament Form Styles */
    .tournament-form {
      margin-top: var(--space-12);
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px);
      border-radius: var(--radius-xl);
      border: 2px solid rgba(255, 255, 255, 0.3);
      padding: var(--space-8);
      animation: slideUp 400ms ease-out;
    }

    .form-header {
      text-align: center;
      margin-bottom: var(--space-6);
    }

    .form-title {
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--neutral-900);
      margin: 0 0 var(--space-2) 0;
      text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
    }

    .form-subtitle {
      font-size: var(--text-base);
      color: var(--neutral-700);
      margin: 0;
      font-weight: var(--font-medium);
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .tournament-name-field {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      gap: var(--space-4);
      justify-content: space-between;
      align-items: center;
    }

    .create-btn {
      min-height: 48px;
      font-weight: var(--font-semibold);
      padding: 0 var(--space-6);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .tournament-form {
        margin-top: var(--space-8);
        padding: var(--space-6);
      }

      .action-buttons {
        flex-direction: column-reverse;
        gap: var(--space-3);
      }

      .action-buttons button {
        width: 100%;
      }
    }
  `]
})
export class ModeSelectorComponent implements OnInit, OnDestroy {
  selectedMode = signal<'singles' | 'doubles'>('singles');
  tournamentName = '';
  loading = signal(false);
  clubId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private actions$: Actions
  ) {
    // Subscribe to current mode from store
    this.store.select(selectMode).subscribe(mode => {
      this.selectedMode.set(mode);
    });

    // Subscribe to loading state
    this.store.select(selectLoading).subscribe(loading => {
      this.loading.set(loading);
    });

    // Listen for tournament creation success
    this.actions$.pipe(
      ofType(createTournamentSuccess),
      takeUntil(this.destroy$)
    ).subscribe(({ tournament }) => {
      console.log('Tournament created successfully:', tournament);
      // Navigate to the player registration page with the actual tournament ID
      this.router.navigate(['/tournament', tournament.id, 'register']);
    });
  }

  ngOnInit(): void {
    // Get clubId from query params if present
    this.route.queryParams.subscribe(params => {
      this.clubId = params['clubId'] || null;
      console.log('Creating tournament for club:', this.clubId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onModeChange(mode: 'singles' | 'doubles') {
    this.selectedMode.set(mode);
    this.store.dispatch(setTournamentMode({ mode }));
  }

  createTournament(): void {
    if (this.tournamentName.trim() && this.selectedMode()) {
      const tournamentData: any = {
        name: this.tournamentName.trim(),
        mode: this.selectedMode()
      };

      // Include clubId if we're creating for a specific club
      if (this.clubId) {
        tournamentData.clubId = this.clubId;
      }

      console.log('Creating tournament with data:', tournamentData);
      this.store.dispatch(createTournament(tournamentData));
    }
  }

  goBack(): void {
    // If we came from a club page, go back there
    if (this.clubId) {
      this.router.navigate(['/club', this.clubId, 'tournaments']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}