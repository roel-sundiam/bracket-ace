import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Player } from '../../../models/tournament.model';
import { TournamentNavigationComponent } from '../tournament-navigation/tournament-navigation.component';
import { QuickTournamentService } from '../../../services/quick-tournament.service';

@Component({
  selector: 'app-player-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    TournamentNavigationComponent
  ],
  template: `
    <div class="player-management-container">
      <!-- Tournament Navigation -->
      <app-tournament-navigation
        [tournamentId]="tournamentId"
        [currentStep]="'player-management'"
        [completedSteps]="[]">
      </app-tournament-navigation>

      <div class="header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Player Management</h1>
            <p class="subtitle">Add and manage players for your tournament</p>
          </div>
        </div>
        <button
          mat-raised-button
          color="primary"
          (click)="toggleAddPlayer()"
          *ngIf="!showAddForm">
          <mat-icon>person_add</mat-icon>
          Add Player
        </button>
      </div>

      <!-- Add Player Form -->
      <mat-card *ngIf="showAddForm" class="add-player-card">
        <mat-card-header>
          <mat-card-title>{{ editingPlayer ? 'Edit Player' : 'Add New Player' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="playerForm" (ngSubmit)="savePlayer()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" placeholder="Enter first name">
                <mat-error *ngIf="playerForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" placeholder="Enter last name">
                <mat-error *ngIf="playerForm.get('lastName')?.hasError('required')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender">
                  <mat-option value="male">Male</mat-option>
                  <mat-option value="female">Female</mat-option>
                </mat-select>
                <mat-error *ngIf="playerForm.get('gender')?.hasError('required')">
                  Gender is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button
                mat-button
                type="button"
                (click)="cancelEdit()">
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="!playerForm.valid">
                <mat-icon>{{ editingPlayer ? 'save' : 'person_add' }}</mat-icon>
                {{ editingPlayer ? 'Update Player' : 'Add Player' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Players List -->
      <mat-card class="players-list-card">
        <mat-card-header>
          <mat-card-title>
            <div class="list-header">
              <span>Players ({{ players().length }})</span>
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search</mat-label>
                <input matInput [(ngModel)]="searchQuery" placeholder="Search players...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="filteredPlayers().length === 0" class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>{{ searchQuery ? 'No players found' : 'No players added yet' }}</p>
            <button
              mat-raised-button
              color="primary"
              (click)="toggleAddPlayer()"
              *ngIf="!searchQuery">
              <mat-icon>person_add</mat-icon>
              Add First Player
            </button>
          </div>

          <table mat-table [dataSource]="filteredPlayers()" *ngIf="filteredPlayers().length > 0" class="players-table">
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let player">
                <div class="player-name">
                  <mat-icon class="player-icon">person</mat-icon>
                  <span>{{ player.firstName }} {{ player.lastName }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Gender Column -->
            <ng-container matColumnDef="gender">
              <th mat-header-cell *matHeaderCellDef>Gender</th>
              <td mat-cell *matCellDef="let player">
                <span class="gender-badge" [class.male]="player.gender === 'male'" [class.female]="player.gender === 'female'">
                  {{ player.gender | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Team Status Column -->
            <ng-container matColumnDef="teamStatus">
              <th mat-header-cell *matHeaderCellDef>Team Status</th>
              <td mat-cell *matCellDef="let player">
                <span class="status-badge" [class.paired]="player.teamId" [class.unpaired]="!player.teamId">
                  {{ player.teamId ? 'Paired' : 'Unpaired' }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let player">
                <button mat-icon-button (click)="editPlayer(player)" [disabled]="editingPlayer?.id === player.id">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deletePlayer(player)" [disabled]="player.teamId">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
        <mat-card-actions *ngIf="players().length > 0">
          <div class="actions-info">
            <div class="player-count-info" [class.valid]="isValidPlayerCount()" [class.invalid]="!isValidPlayerCount()">
              <mat-icon>{{ isValidPlayerCount() ? 'check_circle' : 'info' }}</mat-icon>
              <span>{{ getPlayerCountMessage() }}</span>
            </div>
            <button
              mat-raised-button
              color="accent"
              (click)="proceedToTeamPairing()"
              [disabled]="!isValidPlayerCount()">
              <mat-icon>group</mat-icon>
              Continue to Team Pairing
            </button>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .player-management-container {
      padding: 2rem;
      max-width: 1200px;
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

    .add-player-card {
      margin-bottom: 2rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .full-width {
      flex: 1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .search-field {
      max-width: 300px;
      margin-left: auto;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: rgba(0, 0, 0, 0.3);
    }

    .players-table {
      width: 100%;
    }

    .player-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .player-icon {
      color: rgba(0, 0, 0, 0.5);
    }

    .gender-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .gender-badge.male {
      background: #e3f2fd;
      color: #1976d2;
    }

    .gender-badge.female {
      background: #fce4ec;
      color: #c2185b;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.paired {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.unpaired {
      background: #fff3e0;
      color: #f57c00;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 1rem;
    }

    .actions-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
    }

    .player-count-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .player-count-info.valid {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .player-count-info.invalid {
      background: #fff3e0;
      color: #f57c00;
    }

    .actions-info button {
      align-self: flex-end;
    }
  `]
})
export class PlayerManagementComponent implements OnInit {
  tournamentId: string = '';
  players = signal<Player[]>([]);
  searchQuery = '';
  showAddForm = false;
  editingPlayer: Player | null = null;
  playerForm: FormGroup;
  displayedColumns = ['name', 'gender', 'teamStatus', 'actions'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private snackBar: MatSnackBar,
    private quickTournamentService: QuickTournamentService
  ) {
    this.playerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.tournamentId = this.route.snapshot.paramMap.get('id') || '';

    // Initialize tournament (no-op now, tournament should exist in DB)
    this.quickTournamentService.initTournament(this.tournamentId, 'Quick Tournament');

    // Load players from service
    const players = await this.quickTournamentService.getPlayers(this.tournamentId);
    this.players.set(players);
  }

  filteredPlayers(): Player[] {
    if (!this.searchQuery) {
      return this.players();
    }
    const query = this.searchQuery.toLowerCase();
    return this.players().filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query)
    );
  }

  toggleAddPlayer(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.cancelEdit();
    }
  }

  async savePlayer(): Promise<void> {
    if (!this.playerForm.valid) return;

    const formValue = this.playerForm.value;

    if (this.editingPlayer) {
      // Update existing player
      await this.quickTournamentService.updatePlayer(this.tournamentId, this.editingPlayer.id, formValue);
      this.snackBar.open('Player updated successfully', 'Close', { duration: 3000 });
    } else {
      // Add new player
      await this.quickTournamentService.addPlayer(this.tournamentId, {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        gender: formValue.gender,
        mode: 'doubles',
        tournamentId: this.tournamentId
      });
      this.snackBar.open('Player added successfully', 'Close', { duration: 3000 });
    }

    // Reload players from service
    const players = await this.quickTournamentService.getPlayers(this.tournamentId);
    this.players.set(players);

    this.cancelEdit();
  }

  editPlayer(player: Player): void {
    this.editingPlayer = player;
    this.playerForm.patchValue({
      firstName: player.firstName,
      lastName: player.lastName,
      gender: player.gender
    });
    this.showAddForm = true;
  }

  async deletePlayer(player: Player): Promise<void> {
    if (player.teamId) {
      this.snackBar.open('Cannot delete a player that is already paired in a team', 'Close', { duration: 3000 });
      return;
    }

    await this.quickTournamentService.deletePlayer(this.tournamentId, player.id);

    // Reload players from service
    const players = await this.quickTournamentService.getPlayers(this.tournamentId);
    this.players.set(players);

    this.snackBar.open('Player deleted successfully', 'Close', { duration: 3000 });
  }

  cancelEdit(): void {
    this.showAddForm = false;
    this.editingPlayer = null;
    this.playerForm.reset();
  }

  isValidPlayerCount(): boolean {
    const count = this.players().length;
    return count === 8 || count === 12 || count === 16;
  }

  getPlayerCountMessage(): string {
    const count = this.players().length;
    if (count === 8) {
      return '8 players - Ready for 4 teams (2 groups of 2)';
    } else if (count === 12) {
      return '12 players - Ready for 6 teams (2 groups of 3)';
    } else if (count === 16) {
      return '16 players - Ready for 8 teams (2 groups of 4)';
    } else if (count < 8) {
      return `Need ${8 - count} more player${8 - count > 1 ? 's' : ''} (minimum 8 players for 4 teams)`;
    } else if (count > 8 && count < 12) {
      return `Need ${12 - count} more player${12 - count > 1 ? 's' : ''} to reach 12 players (6 teams)`;
    } else if (count > 12 && count < 16) {
      return `Need ${16 - count} more player${16 - count > 1 ? 's' : ''} to reach 16 players (8 teams)`;
    } else {
      return `Maximum 16 players allowed. Please remove ${count - 16} player${count - 16 > 1 ? 's' : ''}`;
    }
  }

  proceedToTeamPairing(): void {
    if (!this.isValidPlayerCount()) {
      this.snackBar.open('You must have exactly 8, 12, or 16 players', 'Close', { duration: 3000 });
      return;
    }
    // TODO: Store players in NgRx store before navigating
    this.router.navigate(['/tournament', this.tournamentId, 'team-pairing']);
  }

  goBack(): void {
    this.router.navigate(['/tournaments']);
  }
}
