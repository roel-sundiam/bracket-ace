import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Apollo } from 'apollo-angular';
import { GET_TOURNAMENT, GET_MATCHES, UPDATE_MATCH_SCHEDULE } from '../../../graphql/tournament.graphql';

interface Match {
  id: string;
  round: number;
  bracketType: string;
  participant1Name: string;
  participant2Name: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  completed: boolean;
}

@Component({
  selector: 'app-quick-tournament-scheduling',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  template: `
    <div class="scheduling-container">
      <div class="header">
        <button mat-icon-button routerLink="/tournaments" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>
            <mat-icon>schedule</mat-icon>
            Schedule Matches
          </h1>
          <p class="subtitle" *ngIf="tournamentName">{{ tournamentName }}</p>
        </div>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading matches...</p>
      </div>

      <mat-card *ngIf="!loading">
        <mat-card-header>
          <mat-card-title>Match Schedule</mat-card-title>
          <mat-card-subtitle>Set date and time for each match</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="matches-table-container">
            <table mat-table [dataSource]="groupedMatches" class="matches-table">
              <!-- Stage Column -->
              <ng-container matColumnDef="stage">
                <th mat-header-cell *matHeaderCellDef>Stage</th>
                <td mat-cell *matCellDef="let match">{{ getStageLabel(match) }}</td>
              </ng-container>

              <!-- Participants Column -->
              <ng-container matColumnDef="participants">
                <th mat-header-cell *matHeaderCellDef>Participants</th>
                <td mat-cell *matCellDef="let match">
                  {{ match.participant1Name }} vs {{ match.participant2Name }}
                </td>
              </ng-container>

              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let match">
                  <mat-form-field class="date-field">
                    <input matInput
                           [matDatepicker]="picker"
                           [(ngModel)]="match.scheduledDate"
                           placeholder="Select date">
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                  </mat-form-field>
                </td>
              </ng-container>

              <!-- Time Column -->
              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef>Time</th>
                <td mat-cell *matCellDef="let match">
                  <mat-form-field class="time-field">
                    <input matInput
                           type="time"
                           [(ngModel)]="match.scheduledTime"
                           placeholder="HH:MM">
                  </mat-form-field>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let match">
                  <button mat-raised-button
                          color="primary"
                          (click)="saveSchedule(match)"
                          [disabled]="saving">
                    <mat-icon>save</mat-icon>
                    Save
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <div *ngIf="groupedMatches.length === 0 && !loading" class="empty-state">
            <mat-icon>event_busy</mat-icon>
            <p>No matches to schedule yet. Generate matches first.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .scheduling-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 8px 0 0 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }

    .back-button {
      margin-right: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .matches-table-container {
      overflow-x: auto;
    }

    .matches-table {
      width: 100%;
      margin-top: 16px;
    }

    .date-field, .time-field {
      width: 100%;
      min-width: 150px;
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

    mat-card-header {
      margin-bottom: 16px;
    }
  `]
})
export class QuickTournamentSchedulingComponent implements OnInit {
  tournamentId: string = '';
  tournamentName: string = '';
  matches: Match[] = [];
  groupedMatches: Match[] = [];
  loading: boolean = true;
  saving: boolean = false;
  displayedColumns: string[] = ['stage', 'participants', 'date', 'time', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.params['id'];
    this.loadTournament();
    this.loadMatches();
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
        this.snackBar.open('Failed to load tournament', 'Close', { duration: 3000 });
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
          scheduledDate: match.scheduledDate ? new Date(match.scheduledDate) : null,
          scheduledTime: match.scheduledTime || ''
        }));
        this.groupMatches();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.snackBar.open('Failed to load matches', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  groupMatches(): void {
    // Sort matches by stage (Group A, Group B, then knockout)
    const groupA = this.matches.filter(m => m.round === 1 && m.bracketType === 'winners');
    const groupB = this.matches.filter(m => m.round === 1 && m.bracketType === 'losers');
    const semis = this.matches.filter(m => m.round === 2);
    const finals = this.matches.filter(m => m.round === 3);

    this.groupedMatches = [...groupA, ...groupB, ...semis, ...finals];
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

  saveSchedule(match: Match): void {
    this.saving = true;

    const variables: any = {
      matchId: match.id,
      scheduledDate: match.scheduledDate || null,
      scheduledTime: match.scheduledTime || null
    };

    this.apollo.mutate({
      mutation: UPDATE_MATCH_SCHEDULE,
      variables
    }).subscribe({
      next: () => {
        this.snackBar.open('Schedule updated successfully', 'Close', { duration: 3000 });
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating schedule:', error);
        this.snackBar.open('Failed to update schedule', 'Close', { duration: 3000 });
        this.saving = false;
      }
    });
  }
}
