import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TournamentState } from '../models/tournament.model';

export const selectTournamentState = createFeatureSelector<TournamentState>('tournament');

// Basic selectors
export const selectMode = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.mode
);

export const selectTournament = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.tournament
);

export const selectPlayers = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.players
);

export const selectTeams = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.teams
);

export const selectMatches = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.matches
);

export const selectBracket = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.bracket
);

export const selectStatus = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.status
);

export const selectLoading = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.loading
);

export const selectError = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.error
);

// Computed selectors
export const selectCurrentParticipants = createSelector(
  selectMode,
  selectPlayers,
  selectTeams,
  (mode, players, teams) => {
    return mode === 'singles' ? players : teams;
  }
);

export const selectParticipantCount = createSelector(
  selectCurrentParticipants,
  (participants) => participants.length
);

export const selectMaxParticipants = createSelector(
  selectMode,
  (mode) => mode === 'singles' ? 8 : 8 // 8 teams for doubles
);

export const selectRegistrationFull = createSelector(
  selectParticipantCount,
  selectMaxParticipants,
  (current, max) => current >= max
);

export const selectCanStartTournament = createSelector(
  selectRegistrationFull,
  selectStatus,
  (isFull, status) => isFull && status === 'registration'
);

// Bracket selectors
export const selectWinnersMatches = createSelector(
  selectBracket,
  (bracket) => bracket.winners
);

export const selectLosersMatches = createSelector(
  selectBracket,
  (bracket) => bracket.losers
);

export const selectMatchesByRound = createSelector(
  selectMatches,
  (matches) => {
    const grouped: { [key: string]: any[] } = {};
    matches.forEach(match => {
      const key = `${match.bracketType}-${match.round}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(match);
    });
    return grouped;
  }
);

export const selectCompletedMatches = createSelector(
  selectMatches,
  (matches) => matches.filter(match => match.completed)
);

export const selectPendingMatches = createSelector(
  selectMatches,
  (matches) => matches.filter(match => !match.completed)
);

// Tournament progress
export const selectTournamentProgress = createSelector(
  selectMatches,
  selectCompletedMatches,
  (allMatches, completedMatches) => {
    if (allMatches.length === 0) return 0;
    return (completedMatches.length / allMatches.length) * 100;
  }
);

export const selectIsRegistrationPhase = createSelector(
  selectStatus,
  (status) => status === 'registration'
);

export const selectIsInProgress = createSelector(
  selectStatus,
  (status) => status === 'in-progress'
);

export const selectIsCompleted = createSelector(
  selectStatus,
  (status) => status === 'completed'
);

// Champions
export const selectWinnersChampion = createSelector(
  selectTournament,
  (tournament) => tournament?.winnersChampion
);

export const selectConsolationChampion = createSelector(
  selectTournament,
  (tournament) => tournament?.consolationChampion
);

// Dashboard selectors
export const selectAllTournaments = createSelector(
  selectTournamentState,
  (state: TournamentState) => state.allTournaments || []
);

export const selectActiveTournaments = createSelector(
  selectAllTournaments,
  (tournaments) => tournaments.filter(t => t.status !== 'completed')
);

export const selectCompletedTournaments = createSelector(
  selectAllTournaments,
  (tournaments) => tournaments.filter(t => t.status === 'completed')
);

export const selectTotalTournaments = createSelector(
  selectAllTournaments,
  (tournaments) => tournaments.length
);

export const selectTotalParticipants = createSelector(
  selectAllTournaments,
  (tournaments) => tournaments.reduce((sum, t) => sum + t.currentParticipants, 0)
);