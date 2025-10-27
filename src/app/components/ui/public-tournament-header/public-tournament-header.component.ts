import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ActionButton {
  label: string;
  icon: string;
  route: string[];
  class: string;
}

@Component({
  selector: 'app-public-tournament-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="header-section">
      <div class="header-content">
        <h1 class="tournament-title">{{ tournamentName }}</h1>
        <p class="subtitle">{{ subtitle }}</p>

        <!-- Optional Count Badge -->
        <div class="count-badge" *ngIf="count !== undefined && count !== null">
          <span class="count-number">{{ count }}</span>
          <span class="count-label">{{ countLabel }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <a mat-raised-button
             *ngFor="let button of actionButtons"
             [routerLink]="button.route"
             [class]="'action-button ' + button.class">
            <mat-icon>{{ button.icon }}</mat-icon>
            {{ button.label }}
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Header Section */
    .header-section {
      background: rgba(26, 32, 44, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 3rem 1.5rem 2.5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header-content {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
    }

    .tournament-title {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin: 0;
      line-height: 1.2;
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(102, 126, 234, 0.5);
    }

    .subtitle {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0 0 1.5rem 0;
      font-weight: 500;
    }

    /* Count Badge */
    .count-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 50px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      margin-bottom: 1.5rem;
    }

    .count-number {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .count-label {
      font-size: 1rem;
      opacity: 0.95;
    }

    /* Action Buttons */
    .action-buttons {
      margin-top: 1.5rem;
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .action-button {
      font-weight: 600 !important;
      padding: 0 1.5rem !important;
      height: 44px !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
      letter-spacing: 0.02em !important;
      font-size: 0.9375rem !important;
    }

    .action-button mat-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    /* Button Styles */
    .players-button {
      background: white !important;
      color: #667eea !important;
      border: 2px solid #667eea !important;
    }

    .players-button:hover {
      background: #667eea !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25) !important;
      transform: translateY(-1px);
    }

    .teams-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      border: none !important;
    }

    .teams-button:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35) !important;
      transform: translateY(-1px);
      filter: brightness(1.05);
    }

    .standings-button {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
      color: white !important;
      border: none !important;
    }

    .standings-button:hover {
      box-shadow: 0 4px 12px rgba(17, 153, 142, 0.35) !important;
      transform: translateY(-1px);
      filter: brightness(1.05);
    }

    .schedule-button {
      background: white !important;
      color: #667eea !important;
      border: 1.5px solid #667eea !important;
    }

    .schedule-button:hover {
      background: #667eea !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25) !important;
      transform: translateY(-1px);
    }

    .live-button {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
      color: white !important;
      border: none !important;
    }

    .live-button:hover {
      box-shadow: 0 4px 12px rgba(245, 87, 108, 0.35) !important;
      transform: translateY(-1px);
      filter: brightness(1.05);
    }

    .rules-button {
      background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%) !important;
      color: white !important;
      border: none !important;
    }

    .rules-button:hover {
      box-shadow: 0 4px 12px rgba(251, 140, 0, 0.35) !important;
      transform: translateY(-1px);
      filter: brightness(1.05);
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .header-section {
        padding: 2rem 1rem 1.5rem;
      }

      .tournament-title {
        font-size: 1.5rem;
        text-align: center;
      }

      .subtitle {
        font-size: 1rem;
      }

      .count-badge {
        padding: 0.625rem 1.5rem;
      }

      .count-number {
        font-size: 1.25rem;
      }

      .count-label {
        font-size: 0.875rem;
      }

      .action-buttons {
        margin-top: 1.25rem;
        flex-direction: column;
        align-items: center;
      }

      .action-button {
        width: 100%;
        max-width: 280px;
        justify-content: center !important;
      }
    }
  `]
})
export class PublicTournamentHeaderComponent {
  @Input() tournamentName: string = '';
  @Input() subtitle: string = '';
  @Input() count?: number;
  @Input() countLabel: string = '';
  @Input() actionButtons: ActionButton[] = [];
}
