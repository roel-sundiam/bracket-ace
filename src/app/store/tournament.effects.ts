import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { TournamentService } from '../services/tournament.service';
import * as TournamentActions from './tournament.actions';

@Injectable()
export class TournamentEffects {
  private actions$ = inject(Actions);
  private tournamentService = inject(TournamentService);

  createTournament$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.createTournament),
      mergeMap(action => {
        console.log('[Effect] Creating tournament:', action);
        return this.tournamentService.createTournament(action.name, action.mode, 'open', action.clubId).pipe(
          map(tournament => {
            console.log('[Effect] Tournament created successfully:', tournament);
            return TournamentActions.createTournamentSuccess({ tournament });
          }),
          catchError(error => {
            console.error('[Effect] Tournament creation failed:', error);
            return of(TournamentActions.createTournamentFailure({
              error: error.error?.error || 'Failed to create tournament'
            }));
          })
        );
      })
    )
  );

  loadTournament$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.loadTournament),
      mergeMap(action =>
        this.tournamentService.getTournament(action.tournamentId).pipe(
          map(tournament => TournamentActions.loadTournamentSuccess({ tournament })),
          catchError(error => of(TournamentActions.loadTournamentFailure({
            error: error.message || error.error?.error || 'Failed to load tournament'
          })))
        )
      )
    )
  );

  registerPlayer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.registerPlayer),
      mergeMap(action =>
        this.tournamentService.registerPlayer(action.name, 'singles', action.tournamentId).pipe(
          map(player => TournamentActions.registerPlayerSuccess({ player })),
          catchError(error => of(TournamentActions.registerPlayerFailure({ 
            error: error.error?.error || 'Failed to register player' 
          })))
        )
      )
    )
  );

  registerTeam$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.registerTeam),
      mergeMap(action =>
        this.tournamentService.registerTeam(
          action.teamName, 
          action.player1Name, 
          action.player2Name, 
          action.tournamentId
        ).pipe(
          map(team => TournamentActions.registerTeamSuccess({ team })),
          catchError(error => of(TournamentActions.registerTeamFailure({ 
            error: error.error?.error || 'Failed to register team' 
          })))
        )
      )
    )
  );

  generateMatches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.generateMatches),
      mergeMap(action =>
        this.tournamentService.generateMatches(action.tournamentId).pipe(
          switchMap(() => 
            this.tournamentService.getTournamentMatches(action.tournamentId).pipe(
              map(matches => TournamentActions.generateMatchesSuccess({ matches }))
            )
          ),
          catchError(error => of(TournamentActions.generateMatchesFailure({ 
            error: error.error?.error || 'Failed to generate matches' 
          })))
        )
      )
    )
  );

  submitMatchResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.submitMatchResult),
      mergeMap(action =>
        this.tournamentService.submitMatchResult(
          action.matchId, 
          action.winnerId, 
          action.loserId, 
          action.score
        ).pipe(
          map(match => TournamentActions.submitMatchResultSuccess({ match })),
          catchError(error => of(TournamentActions.submitMatchResultFailure({ 
            error: error.error?.error || 'Failed to submit match result' 
          })))
        )
      )
    )
  );

  loadBracket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.loadBracket),
      mergeMap(action =>
        this.tournamentService.getBracket(action.tournamentId).pipe(
          map(({ tournament, bracket }) => 
            TournamentActions.loadBracketSuccess({ 
              tournament, 
              winners: bracket.winners, 
              losers: bracket.losers 
            })
          ),
          catchError(error => of(TournamentActions.loadBracketFailure({ 
            error: error.error?.error || 'Failed to load bracket' 
          })))
        )
      )
    )
  );

  loadParticipants$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.loadParticipants),
      mergeMap(action =>
        this.tournamentService.getParticipants(action.tournamentId).pipe(
          map((participants) => TournamentActions.loadParticipantsSuccess({ participants })),
          catchError(error => of(TournamentActions.loadParticipantsFailure({
            error: error.error?.error || 'Failed to load participants'
          })))
        )
      )
    )
  );

  loadAllTournaments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.loadAllTournaments),
      mergeMap(() => {
        console.log('[Effect] Loading all tournaments');
        return this.tournamentService.getTournaments().pipe(
          map(tournaments => {
            console.log('[Effect] Tournaments loaded:', tournaments);
            return TournamentActions.loadAllTournamentsSuccess({ tournaments });
          }),
          catchError(error => {
            console.error('[Effect] Failed to load tournaments:', error);
            return of(TournamentActions.loadAllTournamentsFailure({
              error: error.error?.error || 'Failed to load tournaments'
            }));
          })
        );
      })
    )
  );
}