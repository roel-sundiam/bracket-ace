import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Apollo } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { QuickTournamentService } from '../../../services/quick-tournament.service';
import { CREATE_TOURNAMENT } from '../../../graphql/tournament.graphql';
import { Tournament } from '../../../models/tournament.model';

@Component({
  selector: 'app-quick-tournament',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <div class="quick-tournament-container">
      <div class="hero-section">
        <mat-card class="hero-card">
          <mat-card-content>
            <div class="hero-content">
              <mat-icon class="hero-icon">sports_tennis</mat-icon>
              <h1>Quick Doubles Tournament</h1>
              <p class="hero-subtitle">Create a doubles tournament with manual setup - perfect for small events!</p>

              <div class="tournament-info">
                <mat-form-field appearance="outline" class="tournament-name-field">
                  <mat-label>Tournament Name</mat-label>
                  <input matInput [(ngModel)]="tournamentName" placeholder="e.g., Saturday Doubles">
                </mat-form-field>
              </div>

              <button
                mat-raised-button
                color="primary"
                class="start-button"
                (click)="startTournament()"
                [disabled]="!tournamentName || isCreating">
                <mat-icon>{{ isCreating ? 'hourglass_empty' : 'play_arrow' }}</mat-icon>
                {{ isCreating ? 'Creating...' : 'Start Tournament Setup' }}
              </button>

              <!-- Debug Error Display -->
              <div *ngIf="debugError" class="debug-error">
                <div class="debug-header">
                  <h3>🐛 Debug Information</h3>
                  <button mat-icon-button (click)="clearError()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <div class="debug-content">
                  <div class="debug-section">
                    <strong>Error Message:</strong>
                    <pre>{{ debugError.message }}</pre>
                  </div>

                  <div class="debug-section" *ngIf="debugError.graphQLErrors && debugError.graphQLErrors.length > 0">
                    <strong>GraphQL Errors:</strong>
                    <pre>{{ debugError.graphQLErrors | json }}</pre>
                  </div>

                  <div class="debug-section" *ngIf="debugError.networkError">
                    <strong>Network Error:</strong>
                    <pre>{{ debugError.networkError | json }}</pre>
                  </div>

                  <div class="debug-section">
                    <strong>Request Variables:</strong>
                    <pre>{{ debugError.variables | json }}</pre>
                  </div>

                  <div class="debug-section">
                    <strong>Authentication:</strong>
                    <pre>Token exists: {{ hasAuthToken() }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="workflow-section">
        <h2>Tournament Workflow</h2>
        <div class="workflow-steps">
          <div class="workflow-step">
            <div class="step-number">1</div>
            <mat-icon>people</mat-icon>
            <h3>Add Players</h3>
            <p>Manually enter 8, 12, or 16 players</p>
          </div>

          <div class="workflow-arrow">
            <mat-icon>arrow_forward</mat-icon>
          </div>

          <div class="workflow-step">
            <div class="step-number">2</div>
            <mat-icon>groups</mat-icon>
            <h3>Create Teams</h3>
            <p>Pair players into doubles teams</p>
          </div>

          <div class="workflow-arrow">
            <mat-icon>arrow_forward</mat-icon>
          </div>

          <div class="workflow-step">
            <div class="step-number">3</div>
            <mat-icon>group_work</mat-icon>
            <h3>Assign Groups</h3>
            <p>Divide teams into Group A & B</p>
          </div>

          <div class="workflow-arrow">
            <mat-icon>arrow_forward</mat-icon>
          </div>

          <div class="workflow-step">
            <div class="step-number">4</div>
            <mat-icon>sports_tennis</mat-icon>
            <h3>Setup Matches</h3>
            <p>Generate round robin matches</p>
          </div>

          <div class="workflow-arrow">
            <mat-icon>arrow_forward</mat-icon>
          </div>

          <div class="workflow-step">
            <div class="step-number">5</div>
            <mat-icon>scoreboard</mat-icon>
            <h3>Live Scoring</h3>
            <p>Track scores in real-time</p>
          </div>
        </div>
      </div>

      <div class="features-section">
        <h2>Features</h2>
        <div class="features-grid">
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <h3>Manual Control</h3>
            <p>Full control over player pairing and match creation</p>
          </div>

          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <h3>Round Robin Groups</h3>
            <p>2 groups with round robin format + finals</p>
          </div>

          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <h3>Flexible Team Size</h3>
            <p>Support for 4, 6, or 8 teams (8-16 players)</p>
          </div>

          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <h3>Live Scoring</h3>
            <p>Real-time score tracking with standings</p>
          </div>

          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <h3>Finals Stage</h3>
            <p>Automatic finals: 1st vs 1st, 2nd vs 2nd</p>
          </div>

          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <h3>Easy Navigation</h3>
            <p>Step-by-step workflow with visual progress</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-tournament-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-section {
      margin-bottom: 3rem;
    }

    .hero-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .hero-content {
      text-align: center;
      padding: 3rem 2rem;
    }

    .hero-icon {
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2.5rem;
      margin: 0 0 1rem 0;
      font-weight: 700;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      margin-bottom: 2rem;
      opacity: 0.95;
    }

    .tournament-info {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .tournament-name-field {
      width: 100%;
      max-width: 400px;
    }

    .tournament-name-field ::ng-deep .mat-mdc-form-field {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .tournament-name-field ::ng-deep .mat-mdc-text-field-wrapper {
      background: rgba(255, 255, 255, 0.1);
    }

    .tournament-name-field ::ng-deep input {
      color: white;
    }

    .tournament-name-field ::ng-deep .mat-mdc-form-field-label {
      color: rgba(255, 255, 255, 0.8);
    }

    .start-button {
      font-size: 1.125rem;
      padding: 1rem 3rem;
      background: white !important;
      color: #667eea !important;
    }

    .workflow-section {
      margin-bottom: 3rem;
    }

    .workflow-section h2 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 2rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .workflow-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .workflow-step {
      flex: 0 0 140px;
      text-align: center;
      padding: 1.5rem 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .step-number {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .workflow-step mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #667eea;
      margin: 0.5rem 0;
    }

    .workflow-step h3 {
      margin: 0.5rem 0 0.25rem 0;
      font-size: 1rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .workflow-step p {
      margin: 0;
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .workflow-arrow {
      color: rgba(0, 0, 0, 0.3);
    }

    .workflow-arrow mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .features-section h2 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 2rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .feature-item {
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .feature-item mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #4caf50;
      margin-bottom: 1rem;
    }

    .feature-item h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .feature-item p {
      margin: 0;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    @media (max-width: 768px) {
      .workflow-steps {
        flex-direction: column;
      }

      .workflow-arrow {
        transform: rotate(90deg);
      }

      .workflow-step {
        width: 100%;
        max-width: 300px;
      }
    }

    .debug-error {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 12px;
      color: #000;
    }

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #ffc107;
    }

    .debug-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .debug-header button {
      color: #000;
    }

    .debug-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .debug-section {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .debug-section strong {
      display: block;
      margin-bottom: 0.5rem;
      color: #d32f2f;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .debug-section pre {
      margin: 0;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-x: auto;
      color: #000;
    }
  `]
})
export class QuickTournamentComponent {
  tournamentName: string = '';
  isCreating: boolean = false;
  debugError: any = null;

  constructor(
    private router: Router,
    private quickTournamentService: QuickTournamentService,
    private apollo: Apollo,
    private snackBar: MatSnackBar
  ) {}

  async startTournament(): Promise<void> {
    if (!this.tournamentName || this.isCreating) return;

    this.isCreating = true;
    this.debugError = null; // Clear previous errors

    try {
      // Create tournament in database
      const result = await firstValueFrom(
        this.apollo.mutate<{ createTournament: Tournament }>({
          mutation: CREATE_TOURNAMENT,
          variables: {
            input: {
              name: this.tournamentName,
              mode: 'doubles',
              registrationType: 'open',
              bracketingMethod: 'manual'
            }
          }
        })
      );

      const tournament = result.data?.createTournament;

      if (!tournament) {
        throw new Error('Failed to create tournament');
      }

      this.snackBar.open('Tournament created successfully! Redirecting to player management...', 'Close', { duration: 3000 });

      // Navigate to player management to start the workflow
      this.router.navigate(['/tournament', tournament.id, 'player-management']);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.graphQLErrors) {
        console.error('GraphQL Errors:', error.graphQLErrors);
      }
      if (error.networkError) {
        console.error('Network Error:', error.networkError);
        console.error('Network Error Body:', error.networkError.error);
      }

      // Capture debug information
      this.debugError = {
        message: error.message || 'Unknown error',
        graphQLErrors: error.graphQLErrors?.map((e: any) => ({
          message: e.message,
          extensions: e.extensions
        })),
        networkError: error.networkError ? {
          status: error.networkError.status,
          statusText: error.networkError.statusText,
          url: error.networkError.url,
          error: error.networkError.error
        } : null,
        variables: {
          name: this.tournamentName,
          mode: 'doubles',
          registrationType: 'open',
          bracketingMethod: 'manual'
        }
      };

      const errorMessage = error.graphQLErrors?.[0]?.message || error.message || 'Failed to create tournament';
      this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      this.isCreating = false;
    }
  }

  clearError(): void {
    this.debugError = null;
  }

  hasAuthToken(): boolean {
    return !!localStorage.getItem('bracketace_token');
  }
}
