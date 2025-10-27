import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Apollo, gql } from 'apollo-angular';
import { ConfirmationModalComponent } from '../../ui/modal/confirmation-modal/confirmation-modal.component';

const GET_CLUB_PLAYERS = gql`
  query GetClubPlayers($clubId: ID!) {
    clubPlayers(clubId: $clubId) {
      id
      firstName
      lastName
      gender
      user {
        id
        email
        firstName
        lastName
      }
      club {
        id
        name
      }
      createdAt
    }
  }
`;

const ADD_CLUB_PLAYER = gql`
  mutation AddClubPlayer($input: AddClubPlayerInput!) {
    addClubPlayer(input: $input) {
      id
      firstName
      lastName
      gender
      user {
        id
        firstName
        lastName
      }
      createdAt
    }
  }
`;

const REMOVE_CLUB_PLAYER = gql`
  mutation RemoveClubPlayer($playerId: ID!) {
    removeClubPlayer(playerId: $playerId)
  }
`;

interface ClubPlayer {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  club?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-club-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ConfirmationModalComponent
  ],
  template: `
    <div class="club-players-container">
      <div class="page-header">
        <h1 class="page-title">
          <mat-icon>groups</mat-icon>
          Club Players
        </h1>
        <p class="page-subtitle">Manage players for your club tournaments</p>
      </div>

      <!-- Add Player Form -->
      <mat-card class="add-player-card">
        <mat-card-header>
          <mat-card-title>Add New Player</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="addPlayer()" class="add-player-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>First Name</mat-label>
              <input
                matInput
                [(ngModel)]="firstName"
                name="firstName"
                placeholder="Enter first name"
                required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Last Name</mat-label>
              <input
                matInput
                [(ngModel)]="lastName"
                name="lastName"
                placeholder="Enter last name"
                required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Gender</mat-label>
              <select matNativeControl [(ngModel)]="gender" name="gender" required>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="!firstName || !lastName || !gender || loading()">
              <mat-icon>add</mat-icon>
              Add Player
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Players List -->
      <mat-card class="players-list-card">
        <mat-card-header>
          <mat-card-title>Club Players ({{ players().length }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading()" class="loading-spinner">
            <mat-spinner></mat-spinner>
          </div>

          <mat-list *ngIf="!loading()">
            <mat-list-item *ngFor="let player of players()" class="player-item">
              <mat-icon matListItemIcon>
                {{ player.user ? 'account_circle' : 'person' }}
              </mat-icon>
              <div matListItemTitle class="player-info">
                <span class="player-name">{{ player.firstName }} {{ player.lastName }}</span>
                <mat-chip class="gender-chip">
                  {{ player.gender === 'male' ? '♂' : '♀' }} {{ player.gender }}
                </mat-chip>
                <mat-chip *ngIf="player.user" class="user-chip">
                  <mat-icon>link</mat-icon>
                  Linked User
                </mat-chip>
                <mat-chip *ngIf="!player.user" class="manual-chip">
                  Manual
                </mat-chip>
              </div>
              <div matListItemLine *ngIf="player.user" class="player-email">
                {{ player.user.email }}
              </div>
              <button
                mat-icon-button
                matListItemMeta
                *ngIf="!player.user"
                (click)="openDeleteModal(player)"
                color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-list-item>

            <div *ngIf="players().length === 0" class="empty-state">
              <mat-icon>info</mat-icon>
              <p>No players yet. Add your first player above!</p>
            </div>
          </mat-list>
        </mat-card-content>
      </mat-card>

      <!-- Delete Confirmation Modal -->
      <app-confirmation-modal
        [isOpen]="showDeleteModal"
        [title]="'Remove Player'"
        [message]="getDeleteMessage()"
        [confirmText]="'Remove'"
        [cancelText]="'Cancel'"
        [variant]="'danger'"
        [isProcessing]="isDeleting"
        (confirm)="confirmDelete()"
        (cancel)="closeDeleteModal()">
      </app-confirmation-modal>
    </div>
  `,
  styles: [`
    .club-players-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .page-header {
      margin-bottom: var(--space-6);
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--neutral-900);
      margin: 0 0 var(--space-2) 0;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--primary-600);
      }
    }

    .page-subtitle {
      font-size: var(--text-lg);
      color: var(--neutral-600);
      margin: 0;
    }

    .add-player-card {
      margin-bottom: var(--space-6);
    }

    .add-player-form {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
      margin-top: var(--space-4);
    }

    .player-name-field {
      flex: 1;
    }

    .players-list-card {
      mat-card-header {
        margin-bottom: var(--space-4);
      }
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: var(--space-8);
    }

    .player-item {
      border-bottom: 1px solid var(--neutral-200);
      padding: var(--space-4) 0;

      &:last-child {
        border-bottom: none;
      }
    }

    .player-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .player-name {
      font-weight: var(--font-semibold);
      color: var(--neutral-900);
    }

    .player-email {
      font-size: var(--text-sm);
      color: var(--neutral-600);
    }

    .user-chip {
      background-color: var(--primary-100);
      color: var(--primary-700);
      font-size: var(--text-xs);
      height: 24px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .manual-chip {
      background-color: var(--neutral-200);
      color: var(--neutral-700);
      font-size: var(--text-xs);
      height: 24px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      color: var(--neutral-500);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: var(--space-4);
      }

      p {
        margin: 0;
        font-size: var(--text-lg);
      }
    }

    @media (max-width: 768px) {
      .add-player-form {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class ClubPlayersComponent implements OnInit {
  clubId: string = '';
  firstName: string = '';
  lastName: string = '';
  gender: string = '';
  players = signal<ClubPlayer[]>([]);
  loading = signal(false);
  showDeleteModal = false;
  isDeleting = false;
  selectedPlayer: ClubPlayer | null = null;

  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.clubId = params['id'];
      this.loadPlayers();
    });
  }

  loadPlayers(): void {
    this.loading.set(true);
    this.apollo.query<{ clubPlayers: ClubPlayer[] }>({
      query: GET_CLUB_PLAYERS,
      variables: { clubId: this.clubId },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        this.players.set(result.data.clubPlayers);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.loading.set(false);
      }
    });
  }

  addPlayer(): void {
    console.log('addPlayer called', {
      firstName: this.firstName,
      lastName: this.lastName,
      gender: this.gender,
      clubId: this.clubId
    });

    if (!this.firstName.trim() || !this.lastName.trim() || !this.gender) {
      console.log('Validation failed');
      return;
    }

    this.loading.set(true);
    this.apollo.mutate({
      mutation: ADD_CLUB_PLAYER,
      variables: {
        input: {
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          gender: this.gender,
          clubId: this.clubId
        }
      }
    }).subscribe({
      next: () => {
        console.log('Player added successfully');
        this.firstName = '';
        this.lastName = '';
        this.gender = '';
        this.loadPlayers();
      },
      error: (error) => {
        console.error('Error adding player:', error);
        this.loading.set(false);
        alert(error.message || 'Failed to add player');
      }
    });
  }

  openDeleteModal(player: ClubPlayer): void {
    this.selectedPlayer = player;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedPlayer = null;
  }

  getDeleteMessage(): string {
    return this.selectedPlayer
      ? `Are you sure you want to remove "${this.selectedPlayer.firstName} ${this.selectedPlayer.lastName}" from the club players?`
      : '';
  }

  confirmDelete(): void {
    if (!this.selectedPlayer) return;

    this.isDeleting = true;
    this.apollo.mutate({
      mutation: REMOVE_CLUB_PLAYER,
      variables: { playerId: this.selectedPlayer.id }
    }).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.loadPlayers();
      },
      error: (error) => {
        console.error('Error removing player:', error);
        this.isDeleting = false;
        alert(error.message || 'Failed to remove player');
      }
    });
  }
}
