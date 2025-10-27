import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tournament, Player, Team, Match } from '../models/tournament.model';
import { FetchPolicy } from '@apollo/client/core';
import {
  GET_TOURNAMENTS,
  GET_TOURNAMENT,
  GET_PARTICIPANTS,
  GET_PLAYERS,
  GET_TEAMS,
  GET_MATCHES,
  GET_BRACKET,
  CREATE_TOURNAMENT,
  UPDATE_TOURNAMENT_STATUS,
  DELETE_TOURNAMENT,
  ARCHIVE_TOURNAMENT,
  REGISTER_PLAYER,
  REGISTER_TEAM,
  GENERATE_MATCHES,
  SUBMIT_MATCH_RESULT,
  UPDATE_LIVE_SCORE,
} from '../graphql/tournament.graphql';
import {
  TournamentResponse,
  SingleTournamentResponse,
  ParticipantsResponse,
  PlayersResponse,
  TeamsResponse,
  MatchesResponse,
  BracketResponse,
  CreateTournamentInput,
  RegisterPlayerInput,
  RegisterTeamInput,
  SubmitMatchResultInput,
  UpdateLiveScoreInput,
  CreateTournamentResponse,
  UpdateTournamentStatusResponse,
  DeleteTournamentResponse,
  ArchiveTournamentResponse,
  RegisterPlayerResponse,
  RegisterTeamResponse,
  GenerateMatchesResponse,
  SubmitMatchResultResponse,
  UpdateLiveScoreResponse,
} from '../graphql/types';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  constructor(private apollo: Apollo) {}

  // Tournament operations
  createTournament(name: string, mode: 'singles' | 'doubles', registrationType: 'open' | 'club_only' = 'open', clubId?: string): Observable<Tournament> {
    const input: CreateTournamentInput = { name, mode, registrationType, clubId };
    return this.apollo.mutate<CreateTournamentResponse>({
      mutation: CREATE_TOURNAMENT,
      variables: { input },
      refetchQueries: [{ query: GET_TOURNAMENTS }]
    }).pipe(
      map(result => result.data!.createTournament as Tournament)
    );
  }

  getTournament(id: string): Observable<Tournament> {
    // Use Apollo Client directly instead of the apollo.query() wrapper
    // to avoid apollo-angular compatibility issues
    return new Observable((observer) => {
      this.apollo.client.query<SingleTournamentResponse>({
        query: GET_TOURNAMENT,
        variables: { id },
        fetchPolicy: 'cache-first' as FetchPolicy
      }).then(result => {
        observer.next(result.data!.tournament as Tournament);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  getTournaments(): Observable<Tournament[]> {
    return this.apollo.query<TournamentResponse>({
      query: GET_TOURNAMENTS,
      fetchPolicy: 'network-only' as FetchPolicy
    }).pipe(
      map(result => result.data.tournaments as Tournament[])
    );
  }


  updateTournamentStatus(id: string, status: 'registration' | 'in-progress' | 'completed'): Observable<Tournament> {
    return this.apollo.mutate<UpdateTournamentStatusResponse>({
      mutation: UPDATE_TOURNAMENT_STATUS,
      variables: { id, status }
    }).pipe(
      map(result => result.data!.updateTournamentStatus as Tournament)
    );
  }

  deleteTournament(id: string): Observable<boolean> {
    return this.apollo.mutate<DeleteTournamentResponse>({
      mutation: DELETE_TOURNAMENT,
      variables: { id },
      refetchQueries: [{ query: GET_TOURNAMENTS }]
    }).pipe(
      map(result => result.data!.deleteTournament)
    );
  }

  archiveTournament(id: string): Observable<Tournament> {
    return this.apollo.mutate<ArchiveTournamentResponse>({
      mutation: ARCHIVE_TOURNAMENT,
      variables: { id }
    }).pipe(
      map(result => result.data!.archiveTournament as Tournament)
    );
  }

  getParticipants(tournamentId: string): Observable<(Player | Team)[]> {
    return new Observable((observer) => {
      this.apollo.client.query<ParticipantsResponse>({
        query: GET_PARTICIPANTS,
        variables: { tournamentId },
        fetchPolicy: 'network-only' as FetchPolicy
      }).then(result => {
        console.log('[getParticipants] Response:', result);
        const participants = result.data.participants.participants as (Player | Team)[];
        console.log('[getParticipants] Parsed participants:', participants);
        observer.next(participants);
        observer.complete();
      }).catch(error => {
        console.error('[getParticipants] Error:', error);
        observer.error(error);
      });
    });
  }

  // Player operations
  registerPlayer(name: string, mode: 'singles' | 'doubles', tournamentId: string): Observable<Player> {
    const input: RegisterPlayerInput = { name, mode, tournamentId };
    return this.apollo.mutate<RegisterPlayerResponse>({
      mutation: REGISTER_PLAYER,
      variables: { input },
      refetchQueries: [
        { query: GET_TOURNAMENT, variables: { id: tournamentId } },
        { query: GET_PARTICIPANTS, variables: { tournamentId } }
      ]
    }).pipe(
      map(result => result.data!.registerPlayer as Player)
    );
  }

  registerTeam(teamName: string, player1Name: string, player2Name: string, tournamentId: string): Observable<Team> {
    const input: RegisterTeamInput = {
      name: teamName,
      player1Name,
      player2Name,
      tournamentId
    };
    return this.apollo.mutate<RegisterTeamResponse>({
      mutation: REGISTER_TEAM,
      variables: { input },
      refetchQueries: [
        { query: GET_TOURNAMENT, variables: { id: tournamentId } },
        { query: GET_PARTICIPANTS, variables: { tournamentId } }
      ]
    }).pipe(
      map(result => result.data!.registerTeam as Team)
    );
  }

  getPlayers(mode?: 'singles' | 'doubles'): Observable<Player[]> {
    return this.apollo.query<PlayersResponse>({
      query: GET_PLAYERS,
      variables: mode ? { mode } : {},
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => result.data.players as Player[])
    );
  }

  getTeams(tournamentId?: string): Observable<Team[]> {
    return this.apollo.query<TeamsResponse>({
      query: GET_TEAMS,
      variables: tournamentId ? { tournamentId } : {},
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => result.data.teams as Team[])
    );
  }

  // Match operations
  generateMatches(tournamentId: string): Observable<Match[]> {
    return this.apollo.mutate<GenerateMatchesResponse>({
      mutation: GENERATE_MATCHES,
      variables: { tournamentId },
      refetchQueries: [
        { query: GET_TOURNAMENT, variables: { id: tournamentId } },
        { query: GET_MATCHES, variables: { tournamentId } },
        { query: GET_BRACKET, variables: { tournamentId } }
      ]
    }).pipe(
      map(result => result.data!.generateMatches as Match[])
    );
  }

  getTournamentMatches(tournamentId: string): Observable<Match[]> {
    return this.apollo.query<MatchesResponse>({
      query: GET_MATCHES,
      variables: { tournamentId },
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => result.data.matches as Match[])
    );
  }

  submitMatchResult(
    matchId: string, 
    winnerId: string, 
    loserId: string, 
    score?: { participant1Score: number; participant2Score: number }
  ): Observable<Match> {
    const input: SubmitMatchResultInput = {
      matchId,
      winnerId,
      loserId,
      score
    };
    return this.apollo.mutate<SubmitMatchResultResponse>({
      mutation: SUBMIT_MATCH_RESULT,
      variables: { input },
      refetchQueries: [
        { query: GET_MATCHES, variables: { tournamentId: 'TOURNAMENT_ID' } },
        { query: GET_BRACKET, variables: { tournamentId: 'TOURNAMENT_ID' } }
      ]
    }).pipe(
      map(result => result.data!.submitMatchResult as Match)
    );
  }

  // New method for live score updates with auto-scoring
  updateLiveScore(matchId: string, scoreA: number, scoreB: number): Observable<Match> {
    const input: UpdateLiveScoreInput = { matchId, scoreA, scoreB };
    return this.apollo.mutate<UpdateLiveScoreResponse>({
      mutation: UPDATE_LIVE_SCORE,
      variables: { input },
      refetchQueries: [
        { query: GET_MATCHES, variables: { tournamentId: 'TOURNAMENT_ID' } },
        { query: GET_BRACKET, variables: { tournamentId: 'TOURNAMENT_ID' } }
      ]
    }).pipe(
      map(result => result.data!.updateLiveScore as Match)
    );
  }

  getBracket(tournamentId: string): Observable<{
    tournament: Tournament;
    bracket: { winners: Match[]; losers: Match[] };
  }> {
    return this.apollo.query<BracketResponse>({
      query: GET_BRACKET,
      variables: { tournamentId },
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => ({ tournament: result.data.bracket.tournament as Tournament, bracket: { winners: result.data.bracket.winners as Match[], losers: result.data.bracket.losers as Match[] } }))
    );
  }
}