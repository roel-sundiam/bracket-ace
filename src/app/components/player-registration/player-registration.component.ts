import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { Store } from '@ngrx/store';
import { Apollo, gql } from 'apollo-angular';
import { Player, Team, Tournament } from '../../models/tournament.model';
import {
  registerPlayer,
  registerTeam,
  loadParticipants,
  generateMatches,
  loadTournament
} from '../../store/tournament.actions';
import {
  selectTournament,
  selectMode,
  selectPlayers,
  selectTeams,
  selectLoading,
  selectError
} from '../../store/tournament.selectors';

const GET_CLUB_PLAYERS = gql`
  query GetClubPlayers($clubId: ID!) {
    clubPlayers(clubId: $clubId) {
      id
      firstName
      lastName
      gender
      user {
        id
      }
    }
  }
`;

const SELECT_PLAYER_FOR_TOURNAMENT = gql`
  mutation SelectPlayerForTournament($tournamentId: ID!, $playerId: ID!) {
    selectPlayerForTournament(tournamentId: $tournamentId, playerId: $playerId) {
      id
      participantId
    }
  }
`;

const REMOVE_PLAYER_FROM_TOURNAMENT = gql`
  mutation RemovePlayerFromTournament($tournamentId: ID!, $playerId: ID!) {
    removePlayerFromTournament(tournamentId: $tournamentId, playerId: $playerId)
  }
`;

interface ClubPlayer {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  user?: {
    id: string;
  };
}

@Component({
  selector: 'app-player-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule
  ],
  template: `
    <div class="registration-container">
      <!-- Loading State -->
      @if (loading() && !tournament()) {
        <div class="loading-state">
          <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-text">Loading tournament...</p>
          </div>
        </div>
      }

      <!-- Tournament Content -->
      @if (tournament()) {
      <!-- Registration Form -->
      <div class="registration-form-card">
        <div class="card-header">
          <h2 class="registration-title">
            🏆 {{ tournament()?.name }} - Registration
          </h2>
          <p class="registration-subtitle">
            {{ mode() === 'singles' ? 'Register Players' : 'Register Teams' }} 
            ({{ currentCount() }}/{{ tournament()?.maxParticipants }})
          </p>
        </div>

        <!-- Singles Registration -->
        <form *ngIf="mode() === 'singles'" (ngSubmit)="registerSinglePlayer()" #singlesForm="ngForm" class="registration-form">
          <!-- For Club Tournaments: Dropdown of club players -->
          <mat-form-field appearance="outline" class="w-full" *ngIf="isClubTournament()">
            <mat-label>Select Player</mat-label>
            <mat-select
              [(ngModel)]="selectedPlayerId"
              name="selectedPlayer"
              required
              #playerSelect="ngModel">
              <mat-option *ngFor="let player of availablePlayers()" [value]="player.id">
                {{ player.firstName }} {{ player.lastName }} ({{ player.gender }})
              </mat-option>
            </mat-select>
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="playerSelect.invalid && playerSelect.touched">
              Please select a player
            </mat-error>
          </mat-form-field>

          <!-- For Open Tournaments: Free text input -->
          <mat-form-field appearance="outline" class="w-full" *ngIf="!isClubTournament()">
            <mat-label>Player Name</mat-label>
            <input
              matInput
              [(ngModel)]="playerName"
              name="playerName"
              placeholder="Enter player name"
              required
              #playerNameInput="ngModel">
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="playerNameInput.invalid && playerNameInput.touched">
              Player name is required
            </mat-error>
          </mat-form-field>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="singlesForm.invalid || loading() || isRegistrationFull()"
            class="register-button">
            <mat-icon>add</mat-icon>
            {{ isClubTournament() ? 'Add Player' : 'Register Player' }}
          </button>
        </form>

        <!-- Doubles Registration -->
        <form *ngIf="mode() === 'doubles'" (ngSubmit)="registerDoubleTeam()" #doublesForm="ngForm" class="registration-form">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Team Name</mat-label>
            <input 
              matInput 
              [(ngModel)]="teamName" 
              name="teamName"
              placeholder="Enter team name"
              required
              #teamNameInput="ngModel">
            <mat-icon matSuffix>groups</mat-icon>
            <mat-error *ngIf="teamNameInput.invalid && teamNameInput.touched">
              Team name is required
            </mat-error>
          </mat-form-field>

          <div class="player-inputs">
            <mat-form-field appearance="outline" class="player-field">
              <mat-label>Player 1 Name</mat-label>
              <input 
                matInput 
                [(ngModel)]="player1Name" 
                name="player1Name"
                placeholder="Enter player 1 name"
                required
                #player1Input="ngModel">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="player1Input.invalid && player1Input.touched">
                Player 1 name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="player-field">
              <mat-label>Player 2 Name</mat-label>
              <input 
                matInput 
                [(ngModel)]="player2Name" 
                name="player2Name"
                placeholder="Enter player 2 name"
                required
                #player2Input="ngModel">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="player2Input.invalid && player2Input.touched">
                Player 2 name is required
              </mat-error>
            </mat-form-field>
          </div>
          
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="doublesForm.invalid || loading() || isRegistrationFull()"
            class="register-button">
            <mat-icon>add</mat-icon>
            Register Team
          </button>
        </form>

        <!-- Error Message -->
        <div class="error-message" *ngIf="error()">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>

        <!-- Registration Status -->
        <div class="registration-status">
          <div class="status-item" [class.status-complete]="isRegistrationFull()">
            <mat-icon>{{ isRegistrationFull() ? 'check_circle' : 'schedule' }}</mat-icon>
            <span>{{ isRegistrationFull() ? 'Registration Complete' : 'Registration Open' }}</span>
          </div>
          
          <button 
            *ngIf="isRegistrationFull() && !hasMatches()"
            mat-raised-button 
            color="accent" 
            (click)="startTournament()"
            [disabled]="loading()"
            class="start-tournament-button">
            <mat-icon>emoji_events</mat-icon>
            Generate Bracket & Start Tournament
          </button>
        </div>
      </div>

      <!-- Participants List -->
      <div class="participants-list-card">
        <div class="card-header">
          <h3 class="participants-title">
            {{ mode() === 'singles' ? 'Registered Players' : 'Registered Teams' }}
          </h3>
          <span class="participants-count">{{ currentCount() }} participants</span>
        </div>

        <!-- Singles List -->
        <div *ngIf="mode() === 'singles'" class="participants-list">
          <div *ngIf="players().length === 0" class="empty-state">
            <mat-icon>person_add</mat-icon>
            <p>No players registered yet</p>
          </div>
          
          <mat-list *ngIf="players().length > 0">
            <mat-list-item
              *ngFor="let player of players(); let i = index"
              class="participant-item">
              <mat-icon matListItemIcon>person</mat-icon>
              <div matListItemTitle>{{ player.firstName }} {{ player.lastName }}</div>
              <div matListItemLine>{{ player.gender }} • Player #{{ i + 1 }}</div>
              <button
                mat-icon-button
                color="warn"
                (click)="removePlayer(player.id)"
                [disabled]="loading()"
                matListItemMeta
                title="Remove player">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-list-item>
          </mat-list>
        </div>

        <!-- Doubles List -->
        <div *ngIf="mode() === 'doubles'" class="participants-list">
          <div *ngIf="teams().length === 0" class="empty-state">
            <mat-icon>group_add</mat-icon>
            <p>No teams registered yet</p>
          </div>
          
          <mat-list *ngIf="teams().length > 0">
            <mat-list-item 
              *ngFor="let team of teams(); let i = index" 
              class="participant-item team-item">
              <mat-icon matListItemIcon>groups</mat-icon>
              <div matListItemTitle>{{ team.name }}</div>
              <div matListItemLine>
                {{ team.player1?.name || 'Player 1' }} & {{ team.player2?.name || 'Player 2' }}
              </div>
            </mat-list-item>
          </mat-list>
        </div>
      </div>
      }
    </div>
  `,
  styleUrls: ['./player-registration.component.scss']
})
export class PlayerRegistrationComponent implements OnInit {
  // Form data
  playerName = '';
  selectedPlayerId = '';
  teamName = '';
  player1Name = '';
  player2Name = '';

  // Signals from store
  tournament = signal<Tournament | null>(null);
  mode = signal<'singles' | 'doubles'>('singles');
  players = signal<Player[]>([]);
  teams = signal<Team[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Club players for dropdown
  clubPlayers = signal<ClubPlayer[]>([]);

  // Computed values
  currentCount = computed(() => {
    return this.mode() === 'singles'
      ? this.players().length
      : this.teams().length;
  });

  // Filter out already registered players from the dropdown
  availablePlayers = computed(() => {
    const registeredIds = this.players().map(p => p.id);
    return this.clubPlayers().filter(p => !registeredIds.includes(p.id));
  });

  constructor(
    private store: Store,
    private apollo: Apollo,
    private route: ActivatedRoute
  ) {
    // Subscribe to store values
    this.store.select(selectTournament).subscribe(tournament => {
      this.tournament.set(tournament);

      // Load club players when tournament is loaded and it's a club tournament
      if (tournament && this.isClubTournament()) {
        this.loadClubPlayers();
      }
    });

    this.store.select(selectMode).subscribe(mode => {
      this.mode.set(mode);
    });

    this.store.select(selectPlayers).subscribe(players => {
      this.players.set(players);
    });

    this.store.select(selectTeams).subscribe(teams => {
      this.teams.set(teams);
    });

    this.store.select(selectLoading).subscribe(loading => {
      this.loading.set(loading);
    });

    this.store.select(selectError).subscribe(error => {
      this.error.set(error);
    });
  }

  ngOnInit(): void {
    // Load tournament from route params
    this.route.params.subscribe(params => {
      const tournamentId = params['id'];
      if (tournamentId) {
        this.store.dispatch(loadTournament({ tournamentId }));
        this.store.dispatch(loadParticipants({ tournamentId }));
      }
    });
  }

  isClubTournament(): boolean {
    const t = this.tournament();
    return t?.registrationType === 'club_only' && !!t?.club?.id;
  }

  loadClubPlayers(): void {
    const t = this.tournament();
    if (!t?.club?.id) return;

    this.apollo.query<{ clubPlayers: ClubPlayer[] }>({
      query: GET_CLUB_PLAYERS,
      variables: { clubId: t.club.id },
      fetchPolicy: 'network-only'
    }).subscribe({
      next: (result) => {
        this.clubPlayers.set(result.data.clubPlayers);
      },
      error: (error) => {
        console.error('Error loading club players:', error);
        this.error.set('Failed to load club players');
      }
    });
  }

  registerSinglePlayer(): void {
    const t = this.tournament();
    if (!t?.id) return;

    if (this.isClubTournament()) {
      // For club tournaments, use the selectPlayerForTournament mutation
      if (!this.selectedPlayerId) return;

      this.loading.set(true);
      this.apollo.mutate({
        mutation: SELECT_PLAYER_FOR_TOURNAMENT,
        variables: {
          tournamentId: t.id,
          playerId: this.selectedPlayerId
        }
      }).subscribe({
        next: () => {
          this.selectedPlayerId = '';
          this.loading.set(false);
          // Reload participants
          this.store.dispatch(loadParticipants({ tournamentId: t.id }));
        },
        error: (error) => {
          console.error('Error selecting player:', error);
          this.error.set(error.message || 'Failed to add player');
          this.loading.set(false);
        }
      });
    } else {
      // For open tournaments, use the traditional registration
      if (this.playerName.trim()) {
        this.store.dispatch(registerPlayer({
          name: this.playerName.trim(),
          tournamentId: t.id
        }));
        this.playerName = '';
      }
    }
  }

  registerDoubleTeam(): void {
    if (this.teamName.trim() && this.player1Name.trim() && this.player2Name.trim() && this.tournament()?.id) {
      this.store.dispatch(registerTeam({ 
        teamName: this.teamName.trim(),
        player1Name: this.player1Name.trim(),
        player2Name: this.player2Name.trim(),
        tournamentId: this.tournament()!.id 
      }));
      this.teamName = '';
      this.player1Name = '';
      this.player2Name = '';
    }
  }

  isRegistrationFull(): boolean {
    return this.currentCount() >= (this.tournament()?.maxParticipants || 8);
  }

  hasMatches(): boolean {
    // This would check if matches have been generated
    // For now, we'll return false
    return false;
  }

  startTournament(): void {
    if (this.tournament()?.id && this.isRegistrationFull()) {
      this.store.dispatch(generateMatches({ tournamentId: this.tournament()!.id }));
    }
  }

  removePlayer(playerId: string): void {
    const t = this.tournament();
    if (!t?.id) return;

    this.loading.set(true);
    this.apollo.mutate({
      mutation: REMOVE_PLAYER_FROM_TOURNAMENT,
      variables: {
        tournamentId: t.id,
        playerId: playerId
      }
    }).subscribe({
      next: () => {
        this.loading.set(false);
        // Reload participants to refresh the list
        this.store.dispatch(loadParticipants({ tournamentId: t.id }));
      },
      error: (error) => {
        console.error('Error removing player:', error);
        this.error.set(error.message || 'Failed to remove player');
        this.loading.set(false);
      }
    });
  }
}