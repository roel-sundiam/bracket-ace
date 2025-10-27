import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { Team } from '../../../models/tournament.model';
import { TournamentNavigationComponent } from '../tournament-navigation/tournament-navigation.component';
import { QuickTournamentService } from '../../../services/quick-tournament.service';

@Component({
  selector: 'app-group-assignment',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DragDropModule,
    TournamentNavigationComponent
  ],
  template: `
    <div class="group-assignment-container">
      <!-- Tournament Navigation -->
      <app-tournament-navigation
        [tournamentId]="tournamentId"
        [currentStep]="'group-assignment'"
        [completedSteps]="['player-management', 'team-pairing']">
      </app-tournament-navigation>

      <div class="header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Group Assignment</h1>
            <p class="subtitle">Assign teams to Group A and Group B for round robin</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            mat-stroked-button
            (click)="autoAssignGroups()">
            <mat-icon>shuffle</mat-icon>
            Auto-Assign
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="proceedToMatchSetup()"
            [disabled]="!isValidAssignment()">
            <mat-icon>sports_tennis</mat-icon>
            Generate Matches
          </button>
        </div>
      </div>

      <div class="assignment-layout">
        <!-- Unassigned Teams -->
        <mat-card class="teams-pool">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>group_work</mat-icon>
              Unassigned Teams ({{ unassignedTeams().length }})
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div
              cdkDropList
              #unassignedList="cdkDropList"
              [cdkDropListData]="unassignedTeams()"
              [cdkDropListConnectedTo]="[groupAList, groupBList]"
              class="teams-dropzone"
              (cdkDropListDropped)="drop($event)">

              <div
                *ngFor="let team of unassignedTeams(); let i = index"
                cdkDrag
                class="team-item">
                <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                <div class="team-details">
                  <div class="team-name">{{ team.name }}</div>
                  <div class="team-players">
                    {{ team.player1?.firstName }} & {{ team.player2?.firstName }}
                  </div>
                </div>
              </div>

              <div *ngIf="unassignedTeams().length === 0" class="empty-message">
                <mat-icon>check_circle</mat-icon>
                <p>All teams assigned!</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Group A -->
        <mat-card class="group-card group-a">
          <mat-card-header>
            <mat-card-title>
              <div class="group-header">
                <mat-icon>groups</mat-icon>
                <span>Group A</span>
                <span class="team-count">{{ groupA().length }}/{{ requiredPerGroup }}</span>
              </div>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div
              cdkDropList
              #groupAList="cdkDropList"
              [cdkDropListData]="groupA()"
              [cdkDropListConnectedTo]="[unassignedList, groupBList]"
              class="group-dropzone"
              [class.complete]="groupA().length === requiredPerGroup"
              (cdkDropListDropped)="drop($event)">

              <div
                *ngFor="let team of groupA(); let i = index"
                cdkDrag
                class="group-team-item">
                <div class="team-number">{{ i + 1 }}</div>
                <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                <div class="team-details">
                  <div class="team-name">{{ team.name }}</div>
                  <div class="team-players">
                    {{ team.player1?.firstName }} & {{ team.player2?.firstName }}
                  </div>
                </div>
              </div>

              <div *ngIf="groupA().length === 0" class="dropzone-placeholder">
                <mat-icon>group_add</mat-icon>
                <p>Drag teams here</p>
                <p class="hint">{{ requiredPerGroup }} teams needed</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Group B -->
        <mat-card class="group-card group-b">
          <mat-card-header>
            <mat-card-title>
              <div class="group-header">
                <mat-icon>groups</mat-icon>
                <span>Group B</span>
                <span class="team-count">{{ groupB().length }}/{{ requiredPerGroup }}</span>
              </div>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div
              cdkDropList
              #groupBList="cdkDropList"
              [cdkDropListData]="groupB()"
              [cdkDropListConnectedTo]="[unassignedList, groupAList]"
              class="group-dropzone"
              [class.complete]="groupB().length === requiredPerGroup"
              (cdkDropListDropped)="drop($event)">

              <div
                *ngFor="let team of groupB(); let i = index"
                cdkDrag
                class="group-team-item">
                <div class="team-number">{{ i + 1 }}</div>
                <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                <div class="team-details">
                  <div class="team-name">{{ team.name }}</div>
                  <div class="team-players">
                    {{ team.player1?.firstName }} & {{ team.player2?.firstName }}
                  </div>
                </div>
              </div>

              <div *ngIf="groupB().length === 0" class="dropzone-placeholder">
                <mat-icon>group_add</mat-icon>
                <p>Drag teams here</p>
                <p class="hint">{{ requiredPerGroup }} teams needed</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Status Message -->
      <div class="status-message" *ngIf="unassignedTeams().length === 0">
        <div class="status-info" [class.valid]="isValidAssignment()" [class.invalid]="!isValidAssignment()">
          <mat-icon>{{ isValidAssignment() ? 'check_circle' : 'info' }}</mat-icon>
          <span>{{ getStatusMessage() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .group-assignment-container {
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

    .assignment-layout {
      display: grid;
      grid-template-columns: 300px 1fr 1fr;
      gap: 1.5rem;
    }

    .teams-pool {
      height: fit-content;
    }

    .teams-dropzone, .group-dropzone {
      min-height: 400px;
      padding: 1rem;
      border-radius: 8px;
    }

    .teams-dropzone {
      background: #f5f5f5;
    }

    .group-dropzone {
      background: #fafafa;
      border: 2px dashed #ccc;
      transition: all 0.3s;
    }

    .group-dropzone.complete {
      border-color: #4caf50;
      background: #e8f5e9;
    }

    .team-item, .group-team-item {
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

    .team-item:hover, .group-team-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .team-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .team-name {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .team-players {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .team-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .group-card {
      height: fit-content;
    }

    .group-card.group-a {
      border-top: 4px solid #2196f3;
    }

    .group-card.group-b {
      border-top: 4px solid #ff9800;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }

    .team-count {
      margin-left: auto;
      padding: 0.25rem 0.75rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .dropzone-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(0, 0, 0, 0.4);
      text-align: center;
      padding: 3rem 1rem;
    }

    .dropzone-placeholder mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    .dropzone-placeholder .hint {
      font-size: 0.875rem;
      margin-top: 0.5rem;
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
      color: #4caf50;
    }

    .status-message {
      margin-top: 2rem;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-info.valid {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-info.invalid {
      background: #fff3e0;
      color: #f57c00;
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
  `]
})
export class GroupAssignmentComponent implements OnInit {
  tournamentId: string = '';
  allTeams = signal<Team[]>([]);
  unassignedTeams = signal<Team[]>([]);
  groupA = signal<Team[]>([]);
  groupB = signal<Team[]>([]);
  requiredPerGroup = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private snackBar: MatSnackBar,
    private quickTournamentService: QuickTournamentService
  ) {}

  async ngOnInit(): Promise<void> {
    this.tournamentId = this.route.snapshot.paramMap.get('id') || '';

    // Load teams and groups from service
    const teams = await this.quickTournamentService.getTeams(this.tournamentId);
    const existingGroupA = await this.quickTournamentService.getGroupA(this.tournamentId);
    const existingGroupB = await this.quickTournamentService.getGroupB(this.tournamentId);

    this.allTeams.set(teams);
    this.requiredPerGroup = teams.length / 2;

    // If groups already exist, load them
    if (existingGroupA.length > 0 || existingGroupB.length > 0) {
      this.groupA.set(existingGroupA);
      this.groupB.set(existingGroupB);

      // Find unassigned teams
      const assignedTeamIds = new Set([
        ...existingGroupA.map(t => t.id),
        ...existingGroupB.map(t => t.id)
      ]);
      const unassigned = teams.filter(t => !assignedTeamIds.has(t.id));
      this.unassignedTeams.set(unassigned);
    } else {
      // All teams are unassigned
      this.unassignedTeams.set([...teams]);
    }
  }

  drop(event: CdkDragDrop<Team[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update signals
      this.unassignedTeams.set([...this.unassignedTeams()]);
      this.groupA.set([...this.groupA()]);
      this.groupB.set([...this.groupB()]);
    }
  }

  async autoAssignGroups(): Promise<void> {
    const teams = [...this.allTeams()];
    const halfCount = teams.length / 2;

    // Shuffle teams for randomness
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const newGroupA = teams.slice(0, halfCount);
    const newGroupB = teams.slice(halfCount);

    // Save to service
    await this.quickTournamentService.setGroups(this.tournamentId, newGroupA, newGroupB);

    this.groupA.set(newGroupA);
    this.groupB.set(newGroupB);
    this.unassignedTeams.set([]);

    this.snackBar.open('Groups assigned automatically', 'Close', { duration: 3000 });
  }

  isValidAssignment(): boolean {
    return this.groupA().length === this.requiredPerGroup &&
           this.groupB().length === this.requiredPerGroup &&
           this.unassignedTeams().length === 0;
  }

  getStatusMessage(): string {
    if (this.isValidAssignment()) {
      return `Perfect! ${this.requiredPerGroup} teams in each group. Ready to generate round robin matches.`;
    }

    const groupANeeded = this.requiredPerGroup - this.groupA().length;
    const groupBNeeded = this.requiredPerGroup - this.groupB().length;

    if (groupANeeded > 0 && groupBNeeded > 0) {
      return `Group A needs ${groupANeeded} more, Group B needs ${groupBNeeded} more`;
    } else if (groupANeeded > 0) {
      return `Group A needs ${groupANeeded} more team${groupANeeded > 1 ? 's' : ''}`;
    } else if (groupBNeeded > 0) {
      return `Group B needs ${groupBNeeded} more team${groupBNeeded > 1 ? 's' : ''}`;
    }

    return 'All teams assigned!';
  }

  async proceedToMatchSetup(): Promise<void> {
    if (!this.isValidAssignment()) {
      this.snackBar.open('Please assign all teams evenly to both groups', 'Close', { duration: 3000 });
      return;
    }

    // Save groups to service before navigating
    await this.quickTournamentService.setGroups(this.tournamentId, this.groupA(), this.groupB());

    this.router.navigate(['/tournament', this.tournamentId, 'match-setup']);
  }

  goBack(): void {
    this.router.navigate(['/tournament', this.tournamentId, 'team-pairing']);
  }
}
