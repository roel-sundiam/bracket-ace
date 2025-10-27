import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tournament-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="tournament-nav">
      <div class="nav-steps">
        <a
          [routerLink]="['/tournament', tournamentId, 'player-management']"
          class="nav-step"
          [class.active]="currentStep === 'player-management'"
          [class.completed]="isStepCompleted('player-management')">
          <div class="step-icon">
            <mat-icon>{{ isStepCompleted('player-management') ? 'check_circle' : 'people' }}</mat-icon>
          </div>
          <div class="step-content">
            <div class="step-number">Step 1</div>
            <div class="step-title">Players</div>
          </div>
        </a>

        <div class="step-connector" [class.completed]="isStepCompleted('player-management')"></div>

        <a
          [routerLink]="['/tournament', tournamentId, 'team-pairing']"
          class="nav-step"
          [class.active]="currentStep === 'team-pairing'"
          [class.completed]="isStepCompleted('team-pairing')">
          <div class="step-icon">
            <mat-icon>{{ isStepCompleted('team-pairing') ? 'check_circle' : 'groups' }}</mat-icon>
          </div>
          <div class="step-content">
            <div class="step-number">Step 2</div>
            <div class="step-title">Teams</div>
          </div>
        </a>

        <div class="step-connector" [class.completed]="isStepCompleted('team-pairing')"></div>

        <a
          [routerLink]="['/tournament', tournamentId, 'group-assignment']"
          class="nav-step"
          [class.active]="currentStep === 'group-assignment'"
          [class.completed]="isStepCompleted('group-assignment')">
          <div class="step-icon">
            <mat-icon>{{ isStepCompleted('group-assignment') ? 'check_circle' : 'group_work' }}</mat-icon>
          </div>
          <div class="step-content">
            <div class="step-number">Step 3</div>
            <div class="step-title">Groups</div>
          </div>
        </a>

        <div class="step-connector" [class.completed]="isStepCompleted('group-assignment')"></div>

        <a
          [routerLink]="['/tournament', tournamentId, 'match-setup']"
          class="nav-step"
          [class.active]="currentStep === 'match-setup'"
          [class.completed]="isStepCompleted('match-setup')">
          <div class="step-icon">
            <mat-icon>{{ isStepCompleted('match-setup') ? 'check_circle' : 'sports_tennis' }}</mat-icon>
          </div>
          <div class="step-content">
            <div class="step-number">Step 4</div>
            <div class="step-title">Matches</div>
          </div>
        </a>

        <div class="step-connector" [class.completed]="isStepCompleted('match-setup')"></div>

        <a
          [routerLink]="['/tournament', tournamentId, 'live-scoring']"
          class="nav-step"
          [class.active]="currentStep === 'live-scoring'"
          [class.completed]="isStepCompleted('live-scoring')">
          <div class="step-icon">
            <mat-icon>{{ isStepCompleted('live-scoring') ? 'check_circle' : 'scoreboard' }}</mat-icon>
          </div>
          <div class="step-content">
            <div class="step-number">Step 5</div>
            <div class="step-title">Live Scoring</div>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .tournament-nav {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      text-decoration: none;
      color: rgba(0, 0, 0, 0.6);
      transition: all 0.3s;
      cursor: pointer;
      flex: 0 0 auto;
    }

    .nav-step:hover {
      background: #f5f5f5;
      color: rgba(0, 0, 0, 0.87);
    }

    .nav-step.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .nav-step.completed:not(.active) {
      color: #4caf50;
    }

    .step-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
      transition: all 0.3s;
    }

    .nav-step.active .step-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .nav-step.completed:not(.active) .step-icon {
      background: rgba(76, 175, 80, 0.1);
    }

    .step-icon mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .step-number {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }

    .step-title {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .step-connector {
      flex: 1;
      height: 2px;
      background: #e0e0e0;
      margin: 0 0.5rem;
      transition: all 0.3s;
    }

    .step-connector.completed {
      background: #4caf50;
    }

    @media (max-width: 768px) {
      .nav-steps {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .step-connector {
        display: none;
      }

      .nav-step {
        flex: 1 1 calc(50% - 0.25rem);
        min-width: 150px;
      }
    }
  `]
})
export class TournamentNavigationComponent {
  @Input() tournamentId: string = '';
  @Input() currentStep: string = '';
  @Input() completedSteps: string[] = [];

  isStepCompleted(step: string): boolean {
    return this.completedSteps.includes(step);
  }
}
