import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { Player, Team } from '../../../models/tournament.model';
import { TournamentNavigationComponent } from '../tournament-navigation/tournament-navigation.component';
import { QuickTournamentService } from '../../../services/quick-tournament.service';

@Component({
  selector: 'app-team-pairing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatSnackBarModule,
    DragDropModule,
    TournamentNavigationComponent
  ],
  template: `
    <div class="team-pairing-container">
      <!-- Tournament Navigation -->
      <app-tournament-navigation
        [tournamentId]="tournamentId"
        [currentStep]="'team-pairing'"
        [completedSteps]="['player-management']">
      </app-tournament-navigation>

      <div class="header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Team Pairing</h1>
            <p class="subtitle">Drag and drop players to create doubles teams</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            mat-stroked-button
            (click)="autoGenerateTeams()"
            [disabled]="unpairedPlayers().length < 2">
            <mat-icon>shuffle</mat-icon>
            Auto-Generate Teams
          </button>
        </div>
      </div>

      <div class="pairing-layout">
        <!-- Unpaired Players -->
        <mat-card class="players-pool">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>people_outline</mat-icon>
              Available Players ({{ unpairedPlayers().length }})
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div
              cdkDropList
              #unpairedList="cdkDropList"
              [cdkDropListData]="unpairedPlayers()"
              [cdkDropListConnectedTo]="[newTeamList]"
              class="players-list"
              (cdkDropListDropped)="drop($event)">

              <div
                *ngFor="let player of unpairedPlayers()"
                cdkDrag
                class="player-item">
                <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                <div class="player-info">
                  <span class="player-name">{{ player.firstName }} {{ player.lastName }}</span>
                  <span class="player-gender" [class.male]="player.gender === 'male'" [class.female]="player.gender === 'female'">
                    {{ player.gender }}
                  </span>
                </div>
              </div>

              <div *ngIf="unpairedPlayers().length === 0" class="empty-message">
                <p>All players have been paired!</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Team Builder -->
        <mat-card class="team-builder">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>group_add</mat-icon>
              Create New Team
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div
              cdkDropList
              #newTeamList="cdkDropList"
              [cdkDropListData]="currentTeamPlayers()"
              [cdkDropListConnectedTo]="[unpairedList]"
              class="team-dropzone"
              [class.has-players]="currentTeamPlayers().length > 0"
              (cdkDropListDropped)="drop($event)">

              <div
                *ngFor="let player of currentTeamPlayers()"
                cdkDrag
                class="team-player-item">
                <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                <div class="player-info">
                  <span class="player-name">{{ player.firstName }} {{ player.lastName }}</span>
                  <span class="player-gender" [class.male]="player.gender === 'male'" [class.female]="player.gender === 'female'">
                    {{ player.gender }}
                  </span>
                </div>
                <button mat-icon-button (click)="removeFromCurrentTeam(player)" class="remove-btn">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div *ngIf="currentTeamPlayers().length === 0" class="dropzone-placeholder">
                <mat-icon>group_add</mat-icon>
                <p>Drag 2 players here to create a team</p>
              </div>
            </div>

            <div class="team-actions" *ngIf="currentTeamPlayers().length > 0">
              <button
                mat-raised-button
                color="primary"
                (click)="createTeam()"
                [disabled]="currentTeamPlayers().length !== 2">
                <mat-icon>check</mat-icon>
                Create Team ({{ currentTeamPlayers().length }}/2)
              </button>
              <button
                mat-button
                (click)="clearCurrentTeam()">
                Clear
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Created Teams -->
        <mat-card class="teams-list">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>groups</mat-icon>
              Created Teams ({{ teams().length }})
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="teams-container">
              <div *ngFor="let team of teams(); let i = index" class="team-card">
                <div class="team-header">
                  <div class="team-number">Team {{ i + 1 }}</div>
                  <button mat-icon-button color="warn" (click)="deleteTeam(team)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <div class="team-members">
                  <div class="team-member">
                    <mat-icon>person</mat-icon>
                    <span>{{ getPlayerName(team.player1Id) }}</span>
                  </div>
                  <div class="team-member">
                    <mat-icon>person</mat-icon>
                    <span>{{ getPlayerName(team.player2Id) }}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="teams().length === 0" class="empty-message">
                <mat-icon>groups</mat-icon>
                <p>No teams created yet</p>
                <p class="hint">Create teams from available players or use auto-generate</p>
              </div>
            </div>

            <!-- Team Count Validation -->
            <div class="team-validation" *ngIf="teams().length > 0">
              <div class="team-count-info" [class.valid]="isValidTeamCount()" [class.invalid]="!isValidTeamCount()">
                <mat-icon>{{ isValidTeamCount() ? 'check_circle' : 'info' }}</mat-icon>
                <span>{{ getTeamCountMessage() }}</span>
              </div>
              <button
                mat-raised-button
                color="primary"
                (click)="proceedToMatchSetup()"
                [disabled]="!isValidTeamCount()">
                <mat-icon>sports_tennis</mat-icon>
                Continue to Group Assignment
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .team-pairing-container {
      padding: 2rem;
      max-width: 1400px;
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

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .pairing-layout {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
    }

    .players-list {
      min-height: 400px;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .player-item, .team-player-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: move;
      transition: all 0.2s;
    }

    .player-item:hover, .team-player-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .player-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .player-name {
      font-weight: 500;
    }

    .player-gender {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 8px;
      display: inline-block;
      width: fit-content;
    }

    .player-gender.male {
      background: #e3f2fd;
      color: #1976d2;
    }

    .player-gender.female {
      background: #fce4ec;
      color: #c2185b;
    }

    .team-dropzone {
      min-height: 300px;
      padding: 1rem;
      background: #f5f5f5;
      border: 2px dashed #ccc;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .team-dropzone.has-players {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .dropzone-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(0, 0, 0, 0.4);
      text-align: center;
    }

    .dropzone-placeholder mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    .team-player-item {
      position: relative;
    }

    .remove-btn {
      margin-left: auto;
    }

    .team-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      justify-content: center;
    }

    .teams-container {
      min-height: 400px;
    }

    .team-card {
      padding: 1rem;
      margin-bottom: 1rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .team-number {
      font-weight: 600;
      color: #1976d2;
    }

    .team-members {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .team-member {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(0, 0, 0, 0.7);
    }

    .team-member mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .empty-message {
      text-align: center;
      padding: 3rem 1rem;
      color: rgba(0, 0, 0, 0.4);
    }

    .empty-message mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-message .hint {
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .cdk-drag-preview {
      opacity: 0.8;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .players-list.cdk-drop-list-dragging .player-item:not(.cdk-drag-placeholder),
    .team-dropzone.cdk-drop-list-dragging .team-player-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .team-validation {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .team-count-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .team-count-info.valid {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .team-count-info.invalid {
      background: #fff3e0;
      color: #f57c00;
    }

    .team-validation button {
      align-self: flex-end;
    }
  `]
})
export class TeamPairingComponent implements OnInit {
  tournamentId: string = '';
  allPlayers = signal<Player[]>([]);
  unpairedPlayers = signal<Player[]>([]);
  currentTeamPlayers = signal<Player[]>([]);
  teams = signal<Team[]>([]);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private snackBar: MatSnackBar,
    private quickTournamentService: QuickTournamentService
  ) {}

  async ngOnInit(): Promise<void> {
    this.tournamentId = this.route.snapshot.paramMap.get('id') || '';

    // Load players and teams from service
    const players = await this.quickTournamentService.getPlayers(this.tournamentId);
    const existingTeams = await this.quickTournamentService.getTeams(this.tournamentId);

    // Set all players
    this.allPlayers.set(players);

    // Set unpaired players (those not in any team)
    const unpairedPlayersList = players.filter(p => !p.teamId);
    this.unpairedPlayers.set(unpairedPlayersList);

    // Set existing teams
    this.teams.set(existingTeams);
  }

  drop(event: CdkDragDrop<Player[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Check if adding to current team and it already has 2 players
      if (event.container.data === this.currentTeamPlayers() && this.currentTeamPlayers().length >= 2) {
        this.snackBar.open('A team can only have 2 players', 'Close', { duration: 3000 });
        return;
      }

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update signals
      this.unpairedPlayers.set([...this.unpairedPlayers()]);
      this.currentTeamPlayers.set([...this.currentTeamPlayers()]);
    }
  }

  removeFromCurrentTeam(player: Player): void {
    const updatedCurrent = this.currentTeamPlayers().filter(p => p.id !== player.id);
    const updatedUnpaired = [...this.unpairedPlayers(), player];

    this.currentTeamPlayers.set(updatedCurrent);
    this.unpairedPlayers.set(updatedUnpaired);
  }

  clearCurrentTeam(): void {
    const playersToReturn = [...this.currentTeamPlayers()];
    this.currentTeamPlayers.set([]);
    this.unpairedPlayers.set([...this.unpairedPlayers(), ...playersToReturn]);
  }

  async createTeam(): Promise<void> {
    if (this.currentTeamPlayers().length !== 2) {
      this.snackBar.open('A team must have exactly 2 players', 'Close', { duration: 3000 });
      return;
    }

    const [player1, player2] = this.currentTeamPlayers();

    // Save to service
    await this.quickTournamentService.addTeam(this.tournamentId, {
      name: `${player1.firstName} & ${player2.firstName}`,
      player1Id: player1.id,
      player2Id: player2.id,
      tournamentId: this.tournamentId,
      player1,
      player2
    });

    // Reload teams and players from service
    const teams = await this.quickTournamentService.getTeams(this.tournamentId);
    this.teams.set(teams);

    const players = await this.quickTournamentService.getPlayers(this.tournamentId);
    this.allPlayers.set(players);

    // Update unpaired players list
    const unpairedPlayersList = players.filter(p => !p.teamId);
    this.unpairedPlayers.set(unpairedPlayersList);

    this.currentTeamPlayers.set([]);
    this.snackBar.open('Team created successfully', 'Close', { duration: 3000 });
  }

  async deleteTeam(team: Team): Promise<void> {
    // Delete from service
    await this.quickTournamentService.deleteTeam(this.tournamentId, team.id);

    // Reload teams from service
    const teams = await this.quickTournamentService.getTeams(this.tournamentId);
    this.teams.set(teams);

    // Reload players to update unpaired status
    const players = await this.quickTournamentService.getPlayers(this.tournamentId);
    this.allPlayers.set(players);

    // Update unpaired players list
    const unpairedPlayersList = players.filter(p => !p.teamId);
    this.unpairedPlayers.set(unpairedPlayersList);

    this.snackBar.open('Team deleted successfully', 'Close', { duration: 3000 });
  }

  async autoGenerateTeams(): Promise<void> {
    const available = [...this.unpairedPlayers()];

    while (available.length >= 2) {
      const player1 = available.shift()!;
      const player2 = available.shift()!;

      // Save each team to service
      await this.quickTournamentService.addTeam(this.tournamentId, {
        name: `${player1.firstName} & ${player2.firstName}`,
        player1Id: player1.id,
        player2Id: player2.id,
        tournamentId: this.tournamentId,
        player1,
        player2
      });
    }

    // Reload teams from service
    const teams = await this.quickTournamentService.getTeams(this.tournamentId);
    this.teams.set(teams);

    // Reload players to update unpaired status
    const players = await this.quickTournamentService.getPlayers(this.tournamentId);
    this.allPlayers.set(players);

    // Update unpaired players list
    const unpairedPlayersList = players.filter(p => !p.teamId);
    this.unpairedPlayers.set(unpairedPlayersList);

    this.snackBar.open('Teams generated automatically', 'Close', { duration: 3000 });
  }

  getPlayerName(playerId: string): string {
    const player = this.allPlayers().find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Unknown';
  }

  isValidTeamCount(): boolean {
    const count = this.teams().length;
    return count === 4 || count === 6 || count === 8;
  }

  getTeamCountMessage(): string {
    const count = this.teams().length;
    if (count === 4) {
      return '4 teams - Ready for 2 groups of 2 teams';
    } else if (count === 6) {
      return '6 teams - Ready for 2 groups of 3 teams';
    } else if (count === 8) {
      return '8 teams - Ready for 2 groups of 4 teams';
    } else if (count < 4) {
      return `Need ${4 - count} more team${4 - count > 1 ? 's' : ''} (minimum 4 teams required)`;
    } else if (count > 4 && count < 6) {
      return `Need ${6 - count} more team${6 - count > 1 ? 's' : ''} to reach 6 teams`;
    } else if (count > 6 && count < 8) {
      return `Need ${8 - count} more team${8 - count > 1 ? 's' : ''} to reach 8 teams`;
    } else {
      return `Maximum 8 teams allowed. Please remove ${count - 8} team${count - 8 > 1 ? 's' : ''}`;
    }
  }

  proceedToMatchSetup(): void {
    if (!this.isValidTeamCount()) {
      this.snackBar.open('You must have exactly 4, 6, or 8 teams', 'Close', { duration: 3000 });
      return;
    }
    // TODO: Store teams in NgRx store before navigating
    this.router.navigate(['/tournament', this.tournamentId, 'group-assignment']);
  }

  goBack(): void {
    this.router.navigate(['/tournament', this.tournamentId, 'player-management']);
  }
}
