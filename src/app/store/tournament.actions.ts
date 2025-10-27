import { createAction, props } from '@ngrx/store';
import { Tournament, Player, Team, Match, TournamentState } from '../models/tournament.model';

// Tournament mode & setup
export const setTournamentMode = createAction(
  '[Tournament] Set Mode',
  props<{ mode: 'singles' | 'doubles' }>()
);

export const createTournament = createAction(
  '[Tournament] Create Tournament',
  props<{ name: string; mode: 'singles' | 'doubles'; clubId?: string }>()
);

export const createTournamentSuccess = createAction(
  '[Tournament] Create Tournament Success',
  props<{ tournament: Tournament }>()
);

export const createTournamentFailure = createAction(
  '[Tournament] Create Tournament Failure',
  props<{ error: string }>()
);

export const loadTournament = createAction(
  '[Tournament] Load Tournament',
  props<{ tournamentId: string }>()
);

export const loadTournamentSuccess = createAction(
  '[Tournament] Load Tournament Success',
  props<{ tournament: Tournament }>()
);

export const loadTournamentFailure = createAction(
  '[Tournament] Load Tournament Failure',
  props<{ error: string }>()
);

// Player registration
export const registerPlayer = createAction(
  '[Tournament] Register Player',
  props<{ name: string; tournamentId: string }>()
);

export const registerPlayerSuccess = createAction(
  '[Tournament] Register Player Success',
  props<{ player: Player }>()
);

export const registerPlayerFailure = createAction(
  '[Tournament] Register Player Failure',
  props<{ error: string }>()
);

// Team registration (for doubles)
export const registerTeam = createAction(
  '[Tournament] Register Team',
  props<{ teamName: string; player1Name: string; player2Name: string; tournamentId: string }>()
);

export const registerTeamSuccess = createAction(
  '[Tournament] Register Team Success',
  props<{ team: Team }>()
);

export const registerTeamFailure = createAction(
  '[Tournament] Register Team Failure',
  props<{ error: string }>()
);

// Match & bracket management
export const generateMatches = createAction(
  '[Tournament] Generate Matches',
  props<{ tournamentId: string }>()
);

export const generateMatchesSuccess = createAction(
  '[Tournament] Generate Matches Success',
  props<{ matches: Match[] }>()
);

export const generateMatchesFailure = createAction(
  '[Tournament] Generate Matches Failure',
  props<{ error: string }>()
);

export const submitMatchResult = createAction(
  '[Tournament] Submit Match Result',
  props<{ matchId: string; winnerId: string; loserId: string; score?: { participant1Score: number; participant2Score: number } }>()
);

export const submitMatchResultSuccess = createAction(
  '[Tournament] Submit Match Result Success',
  props<{ match: Match }>()
);

export const submitMatchResultFailure = createAction(
  '[Tournament] Submit Match Result Failure',
  props<{ error: string }>()
);

export const loadBracket = createAction(
  '[Tournament] Load Bracket',
  props<{ tournamentId: string }>()
);

export const loadBracketSuccess = createAction(
  '[Tournament] Load Bracket Success',
  props<{ tournament: Tournament; winners: Match[]; losers: Match[] }>()
);

export const loadBracketFailure = createAction(
  '[Tournament] Load Bracket Failure',
  props<{ error: string }>()
);

// Participants loading
export const loadParticipants = createAction(
  '[Tournament] Load Participants',
  props<{ tournamentId: string }>()
);

export const loadParticipantsSuccess = createAction(
  '[Tournament] Load Participants Success',
  props<{ participants: (Player | Team)[] }>()
);

export const loadParticipantsFailure = createAction(
  '[Tournament] Load Participants Failure',
  props<{ error: string }>()
);

// Reset tournament
export const resetTournament = createAction('[Tournament] Reset Tournament');

// Loading states
export const setLoading = createAction(
  '[Tournament] Set Loading',
  props<{ loading: boolean }>()
);

export const clearError = createAction('[Tournament] Clear Error');

// Dashboard-specific actions
export const loadAllTournaments = createAction('[Dashboard] Load All Tournaments');

export const loadAllTournamentsSuccess = createAction(
  '[Dashboard] Load All Tournaments Success',
  props<{ tournaments: Tournament[] }>()
);

export const loadAllTournamentsFailure = createAction(
  '[Dashboard] Load All Tournaments Failure',
  props<{ error: string }>()
);

export const deleteTournament = createAction(
  '[Dashboard] Delete Tournament',
  props<{ tournamentId: string }>()
);

export const deleteTournamentSuccess = createAction(
  '[Dashboard] Delete Tournament Success',
  props<{ tournamentId: string }>()
);

export const deleteTournamentFailure = createAction(
  '[Dashboard] Delete Tournament Failure',
  props<{ error: string }>()
);

export const archiveTournament = createAction(
  '[Dashboard] Archive Tournament',
  props<{ tournamentId: string }>()
);

export const archiveTournamentSuccess = createAction(
  '[Dashboard] Archive Tournament Success',
  props<{ tournamentId: string }>()
);

export const archiveTournamentFailure = createAction(
  '[Dashboard] Archive Tournament Failure',
  props<{ error: string }>()
);