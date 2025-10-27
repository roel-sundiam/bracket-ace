import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Player, Team } from '../models/tournament.model';
import {
  CREATE_QUICK_PLAYER,
  UPDATE_QUICK_PLAYER,
  DELETE_QUICK_PLAYER,
  CREATE_QUICK_TEAM,
  DELETE_QUICK_TEAM,
  SET_TOURNAMENT_GROUPS,
  GET_TOURNAMENT_GROUPS,
  GET_TOURNAMENT_PLAYERS,
  GET_TEAMS
} from '../graphql/tournament.graphql';

@Injectable({
  providedIn: 'root'
})
export class QuickTournamentService {
  constructor(private apollo: Apollo) {}

  // Initialize a new tournament (tournament creation is handled separately)
  initTournament(tournamentId: string, tournamentName: string): void {
    // Tournament should already exist in the database
    // This is now a no-op, but kept for compatibility
  }

  // Players
  async getPlayers(tournamentId: string): Promise<Player[]> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ tournamentPlayers: Player[] }>({
          query: GET_TOURNAMENT_PLAYERS,
          variables: { tournamentId },
          fetchPolicy: 'network-only'
        })
      );
      return result.data.tournamentPlayers;
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  }

  async addPlayer(tournamentId: string, player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ createQuickPlayer: Player }>({
          mutation: CREATE_QUICK_PLAYER,
          variables: {
            input: {
              firstName: player.firstName,
              lastName: player.lastName,
              gender: player.gender,
              tournamentId
            }
          }
        })
      );
      return result.data?.createQuickPlayer || null;
    } catch (error) {
      console.error('Error adding player:', error);
      return null;
    }
  }

  async updatePlayer(tournamentId: string, playerId: string, updatedPlayer: Partial<Player>): Promise<Player | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ updateQuickPlayer: Player }>({
          mutation: UPDATE_QUICK_PLAYER,
          variables: {
            id: playerId,
            input: {
              firstName: updatedPlayer.firstName,
              lastName: updatedPlayer.lastName,
              gender: updatedPlayer.gender
            }
          }
        })
      );
      return result.data?.updateQuickPlayer || null;
    } catch (error) {
      console.error('Error updating player:', error);
      return null;
    }
  }

  async deletePlayer(tournamentId: string, playerId: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ deleteQuickPlayer: boolean }>({
          mutation: DELETE_QUICK_PLAYER,
          variables: { id: playerId }
        })
      );
      return result.data?.deleteQuickPlayer || false;
    } catch (error) {
      console.error('Error deleting player:', error);
      return false;
    }
  }

  // Teams
  async getTeams(tournamentId: string): Promise<Team[]> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ teams: Team[] }>({
          query: GET_TEAMS,
          variables: { tournamentId },
          fetchPolicy: 'network-only'
        })
      );
      return result.data.teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  async addTeam(tournamentId: string, team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ createQuickTeam: Team }>({
          mutation: CREATE_QUICK_TEAM,
          variables: {
            input: {
              name: team.name,
              player1Id: team.player1Id,
              player2Id: team.player2Id,
              tournamentId
            }
          }
        })
      );
      return result.data?.createQuickTeam || null;
    } catch (error) {
      console.error('Error adding team:', error);
      return null;
    }
  }

  async deleteTeam(tournamentId: string, teamId: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ deleteQuickTeam: boolean }>({
          mutation: DELETE_QUICK_TEAM,
          variables: { id: teamId }
        })
      );
      return result.data?.deleteQuickTeam || false;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }

  // Groups
  async getGroupA(tournamentId: string): Promise<Team[]> {
    try {
      const groups = await this.getTournamentGroups(tournamentId);
      if (!groups || !groups.groupA) return [];

      // Get all teams for this tournament
      const allTeams = await this.getTeams(tournamentId);

      // Filter teams by IDs in groupA
      return allTeams.filter(team => groups.groupA.includes(team.id));
    } catch (error) {
      console.error('Error fetching Group A:', error);
      return [];
    }
  }

  async getGroupB(tournamentId: string): Promise<Team[]> {
    try {
      const groups = await this.getTournamentGroups(tournamentId);
      if (!groups || !groups.groupB) return [];

      // Get all teams for this tournament
      const allTeams = await this.getTeams(tournamentId);

      // Filter teams by IDs in groupB
      return allTeams.filter(team => groups.groupB.includes(team.id));
    } catch (error) {
      console.error('Error fetching Group B:', error);
      return [];
    }
  }

  async setGroups(tournamentId: string, groupA: Team[], groupB: Team[]): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ setTournamentGroups: { tournamentId: string; groupA: string[]; groupB: string[] } }>({
          mutation: SET_TOURNAMENT_GROUPS,
          variables: {
            input: {
              tournamentId,
              groupA: groupA.map(t => t.id),
              groupB: groupB.map(t => t.id)
            }
          }
        })
      );
      return !!result.data?.setTournamentGroups;
    } catch (error) {
      console.error('Error setting groups:', error);
      return false;
    }
  }

  private async getTournamentGroups(tournamentId: string): Promise<{ tournamentId: string; groupA: string[]; groupB: string[] } | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ tournamentGroups: { tournamentId: string; groupA: string[]; groupB: string[] } }>({
          query: GET_TOURNAMENT_GROUPS,
          variables: { tournamentId },
          fetchPolicy: 'network-only'
        })
      );
      return result.data.tournamentGroups;
    } catch (error) {
      console.error('Error fetching tournament groups:', error);
      return null;
    }
  }
}
