import { createReducer, on } from '@ngrx/store';
import { TournamentState, TournamentStatus } from '../models/tournament.model';
import * as TournamentActions from './tournament.actions';

export const initialState: TournamentState = {
  mode: 'singles',
  tournament: null,
  allTournaments: [],
  players: [],
  teams: [],
  matches: [],
  bracket: { winners: [], losers: [] },
  status: 'registration' as TournamentStatus,
  loading: false,
  error: null
};

export const tournamentReducer = createReducer(
  initialState,

  // Mode selection
  on(TournamentActions.setTournamentMode, (state, { mode }) => ({
    ...state,
    mode,
    tournament: null,
    players: [],
    teams: [],
    matches: [],
    bracket: { winners: [], losers: [] },
    status: 'registration' as TournamentStatus,
    error: null
  })),

  // Tournament creation
  on(TournamentActions.createTournament, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.createTournamentSuccess, (state, { tournament }) => ({
    ...state,
    tournament,
    loading: false,
    error: null
  })),

  on(TournamentActions.createTournamentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Tournament loading
  on(TournamentActions.loadTournament, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.loadTournamentSuccess, (state, { tournament }) => ({
    ...state,
    tournament,
    mode: tournament.mode,
    status: tournament.status,
    loading: false,
    error: null
  })),

  on(TournamentActions.loadTournamentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Player registration
  on(TournamentActions.registerPlayer, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.registerPlayerSuccess, (state, { player }) => ({
    ...state,
    players: [...state.players, player],
    tournament: state.tournament ? {
      ...state.tournament,
      currentParticipants: state.tournament.currentParticipants + 1
    } : null,
    loading: false,
    error: null
  })),

  on(TournamentActions.registerPlayerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Team registration
  on(TournamentActions.registerTeam, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.registerTeamSuccess, (state, { team }) => ({
    ...state,
    teams: [...state.teams, team],
    tournament: state.tournament ? {
      ...state.tournament,
      currentParticipants: state.tournament.currentParticipants + 2
    } : null,
    loading: false,
    error: null
  })),

  on(TournamentActions.registerTeamFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Match generation
  on(TournamentActions.generateMatches, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.generateMatchesSuccess, (state, { matches }) => ({
    ...state,
    matches,
    status: 'in-progress' as TournamentStatus,
    tournament: state.tournament ? {
      ...state.tournament,
      status: 'in-progress' as TournamentStatus
    } : null,
    loading: false,
    error: null
  })),

  on(TournamentActions.generateMatchesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Match result submission
  on(TournamentActions.submitMatchResult, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.submitMatchResultSuccess, (state, { match }) => {
    const updatedMatches = state.matches.map(m =>
      m.id === match.id ? match : m
    );
    
    const winnersMatches = updatedMatches.filter(m => m.bracketType === 'winners');
    const losersMatches = updatedMatches.filter(m => m.bracketType === 'losers');

    return {
      ...state,
      matches: updatedMatches,
      bracket: {
        winners: winnersMatches,
        losers: losersMatches
      },
      loading: false,
      error: null
    };
  }),

  on(TournamentActions.submitMatchResultFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Bracket loading
  on(TournamentActions.loadBracket, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.loadBracketSuccess, (state, { tournament, winners, losers }) => ({
    ...state,
    tournament,
    bracket: { winners, losers },
    matches: [...winners, ...losers],
    loading: false,
    error: null
  })),

  on(TournamentActions.loadBracketFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Participants loading
  on(TournamentActions.loadParticipants, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.loadParticipantsSuccess, (state, { participants }) => {
    if (state.mode === 'singles') {
      return {
        ...state,
        players: participants as any[],
        loading: false,
        error: null
      };
    } else {
      return {
        ...state,
        teams: participants as any[],
        loading: false,
        error: null
      };
    }
  }),

  on(TournamentActions.loadParticipantsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Reset tournament
  on(TournamentActions.resetTournament, () => ({
    ...initialState
  })),

  // Loading and error management
  on(TournamentActions.setLoading, (state, { loading }) => ({
    ...state,
    loading
  })),

  on(TournamentActions.clearError, (state) => ({
    ...state,
    error: null
  })),

  // Dashboard actions
  on(TournamentActions.loadAllTournaments, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.loadAllTournamentsSuccess, (state, { tournaments }) => ({
    ...state,
    allTournaments: tournaments,
    loading: false,
    error: null
  })),

  on(TournamentActions.loadAllTournamentsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(TournamentActions.deleteTournament, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.deleteTournamentSuccess, (state, { tournamentId }) => ({
    ...state,
    allTournaments: state.allTournaments.filter(t => t.id !== tournamentId),
    loading: false,
    error: null
  })),

  on(TournamentActions.deleteTournamentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(TournamentActions.archiveTournament, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TournamentActions.archiveTournamentSuccess, (state, { tournamentId }) => ({
    ...state,
    allTournaments: state.allTournaments.map(t =>
      t.id === tournamentId
        ? { ...t, status: 'completed' as TournamentStatus }
        : t
    ),
    loading: false,
    error: null
  })),

  on(TournamentActions.archiveTournamentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);