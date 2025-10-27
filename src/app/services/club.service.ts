import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FetchPolicy } from '@apollo/client/core';
import {
  CLUBS_QUERY,
  CLUB_QUERY,
  MY_CLUBS_QUERY,
  CLUB_MEMBERS_QUERY,
  CLUB_MEMBERSHIP_REQUESTS_QUERY,
  CREATE_CLUB_MUTATION,
  REQUEST_CLUB_MEMBERSHIP_MUTATION,
  APPROVE_CLUB_MEMBERSHIP_MUTATION,
  REJECT_CLUB_MEMBERSHIP_MUTATION,
  SELECT_PLAYER_FOR_TOURNAMENT_MUTATION,
  REMOVE_PLAYER_FROM_TOURNAMENT_MUTATION,
  TOURNAMENT_REGISTRATIONS_QUERY,
  CLUB_REQUESTS_QUERY,
  MY_CLUB_REQUESTS_QUERY,
  REQUEST_CLUB_CREATION_MUTATION,
  APPROVE_CLUB_REQUEST_MUTATION,
  REJECT_CLUB_REQUEST_MUTATION
} from '../graphql/club.graphql';
import {
  Club,
  ClubMembership,
  ClubRequest,
  TournamentRegistration,
  CreateClubInput,
  RequestClubInput,
  ClubsResponse,
  ClubResponse,
  MyClubsResponse,
  ClubMembersResponse,
  ClubMembershipRequestsResponse,
  CreateClubResponse,
  RequestClubMembershipResponse,
  ApproveClubMembershipResponse,
  RejectClubMembershipResponse,
  SelectPlayerForTournamentResponse,
  RemovePlayerFromTournamentResponse,
  TournamentRegistrationsResponse,
  ClubRequestsResponse,
  MyClubRequestsResponse,
  RequestClubCreationResponse,
  ApproveClubRequestResponse,
  RejectClubRequestResponse
} from '../graphql/types';

@Injectable({
  providedIn: 'root'
})
export class ClubService {

  constructor(private apollo: Apollo) {}

  // Query methods
  getClubs(): Observable<Club[]> {
    return this.apollo.query<ClubsResponse>({
      query: CLUBS_QUERY,
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => result.data?.clubs || [])
    );
  }

  getClub(id: string): Observable<Club> {
    return this.apollo.query<ClubResponse>({
      query: CLUB_QUERY,
      variables: { id },
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => {
        if (!result.data?.club) {
          throw new Error('Club not found');
        }
        return result.data.club;
      })
    );
  }

  getMyClubs(): Observable<Club[]> {
    return this.apollo.query<MyClubsResponse>({
      query: MY_CLUBS_QUERY,
      fetchPolicy: 'network-only' as FetchPolicy
    }).pipe(
      map(result => {
        console.log('getMyClubs response:', result);
        return result.data?.myClubs || [];
      })
    );
  }

  getClubMembers(clubId: string): Observable<ClubMembership[]> {
    return this.apollo.query<ClubMembersResponse>({
      query: CLUB_MEMBERS_QUERY,
      variables: { clubId },
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => result.data?.clubMembers || [])
    );
  }

  getClubMembershipRequests(clubId: string): Observable<ClubMembership[]> {
    return this.apollo.query<ClubMembershipRequestsResponse>({
      query: CLUB_MEMBERSHIP_REQUESTS_QUERY,
      variables: { clubId },
      fetchPolicy: 'network-only' as FetchPolicy
    }).pipe(
      map(result => result.data?.clubMembershipRequests || [])
    );
  }

  getTournamentRegistrations(tournamentId: string): Observable<TournamentRegistration[]> {
    return this.apollo.query<TournamentRegistrationsResponse>({
      query: TOURNAMENT_REGISTRATIONS_QUERY,
      variables: { tournamentId },
      fetchPolicy: 'cache-and-network' as FetchPolicy
    }).pipe(
      map(result => result.data?.tournamentRegistrations || [])
    );
  }

  // Mutation methods
  createClub(input: CreateClubInput): Observable<Club> {
    return this.apollo.mutate<CreateClubResponse>({
      mutation: CREATE_CLUB_MUTATION,
      variables: { input },
      refetchQueries: ['Clubs', 'MyClubs']
    }).pipe(
      map(result => {
        if (!result.data?.createClub) {
          throw new Error('Failed to create club');
        }
        return result.data.createClub;
      })
    );
  }

  requestClubMembership(clubId: string): Observable<ClubMembership> {
    return this.apollo.mutate<RequestClubMembershipResponse>({
      mutation: REQUEST_CLUB_MEMBERSHIP_MUTATION,
      variables: { clubId },
      refetchQueries: ['MyClubs', 'ClubMembershipRequests']
    }).pipe(
      map(result => {
        if (!result.data?.requestClubMembership) {
          throw new Error('Failed to request club membership');
        }
        return result.data.requestClubMembership;
      })
    );
  }

  approveClubMembership(membershipId: string): Observable<ClubMembership> {
    return this.apollo.mutate<ApproveClubMembershipResponse>({
      mutation: APPROVE_CLUB_MEMBERSHIP_MUTATION,
      variables: { membershipId },
      refetchQueries: ['ClubMembers', 'ClubMembershipRequests']
    }).pipe(
      map(result => {
        if (!result.data?.approveClubMembership) {
          throw new Error('Failed to approve membership');
        }
        return result.data.approveClubMembership;
      })
    );
  }

  rejectClubMembership(membershipId: string): Observable<ClubMembership> {
    return this.apollo.mutate<RejectClubMembershipResponse>({
      mutation: REJECT_CLUB_MEMBERSHIP_MUTATION,
      variables: { membershipId },
      refetchQueries: ['ClubMembershipRequests']
    }).pipe(
      map(result => {
        if (!result.data?.rejectClubMembership) {
          throw new Error('Failed to reject membership');
        }
        return result.data.rejectClubMembership;
      })
    );
  }

  selectPlayerForTournament(tournamentId: string, playerId: string): Observable<TournamentRegistration> {
    return this.apollo.mutate<SelectPlayerForTournamentResponse>({
      mutation: SELECT_PLAYER_FOR_TOURNAMENT_MUTATION,
      variables: { tournamentId, playerId },
      refetchQueries: ['TournamentRegistrations']
    }).pipe(
      map(result => {
        if (!result.data?.selectPlayerForTournament) {
          throw new Error('Failed to select player for tournament');
        }
        return result.data.selectPlayerForTournament;
      })
    );
  }

  removePlayerFromTournament(tournamentId: string, playerId: string): Observable<boolean> {
    return this.apollo.mutate<RemovePlayerFromTournamentResponse>({
      mutation: REMOVE_PLAYER_FROM_TOURNAMENT_MUTATION,
      variables: { tournamentId, playerId },
      refetchQueries: ['TournamentRegistrations']
    }).pipe(
      map(result => result.data?.removePlayerFromTournament || false)
    );
  }

  // Club Request Query methods
  getClubRequests(): Observable<ClubRequest[]> {
    return this.apollo.query<ClubRequestsResponse>({
      query: CLUB_REQUESTS_QUERY,
      fetchPolicy: 'network-only' as FetchPolicy,
      errorPolicy: 'all'
    }).pipe(
      map(result => {
        console.log('getClubRequests result:', result);
        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
        }
        return result.data?.clubRequests || [];
      })
    );
  }

  getMyClubRequests(): Observable<ClubRequest[]> {
    return this.apollo.query<MyClubRequestsResponse>({
      query: MY_CLUB_REQUESTS_QUERY,
      fetchPolicy: 'network-only' as FetchPolicy,
      errorPolicy: 'all'
    }).pipe(
      map(result => {
        console.log('getMyClubRequests result:', result);
        return result.data?.myClubRequests || [];
      })
    );
  }

  // Club Request Mutation methods
  requestClubCreation(input: RequestClubInput): Observable<ClubRequest> {
    return this.apollo.mutate<RequestClubCreationResponse>({
      mutation: REQUEST_CLUB_CREATION_MUTATION,
      variables: { input },
      refetchQueries: ['MyClubRequests', 'ClubRequests']
    }).pipe(
      map(result => {
        if (!result.data?.requestClubCreation) {
          throw new Error('Failed to request club creation');
        }
        return result.data.requestClubCreation;
      })
    );
  }

  approveClubRequest(requestId: string): Observable<Club> {
    return this.apollo.mutate<ApproveClubRequestResponse>({
      mutation: APPROVE_CLUB_REQUEST_MUTATION,
      variables: { requestId },
      refetchQueries: ['ClubRequests', 'Clubs', 'MyClubs']
    }).pipe(
      map(result => {
        if (!result.data?.approveClubRequest) {
          throw new Error('Failed to approve club request');
        }
        return result.data.approveClubRequest;
      })
    );
  }

  rejectClubRequest(requestId: string, reason?: string): Observable<ClubRequest> {
    return this.apollo.mutate<RejectClubRequestResponse>({
      mutation: REJECT_CLUB_REQUEST_MUTATION,
      variables: { requestId, reason },
      refetchQueries: ['ClubRequests']
    }).pipe(
      map(result => {
        if (!result.data?.rejectClubRequest) {
          throw new Error('Failed to reject club request');
        }
        return result.data.rejectClubRequest;
      })
    );
  }

  // Utility methods
  refreshClubData(clubId?: string): void {
    const queries = ['Clubs', 'MyClubs', 'ClubRequests', 'MyClubRequests'];
    if (clubId) {
      queries.push('ClubMembers', 'ClubMembershipRequests');
    }

    this.apollo.client.refetchQueries({
      include: queries
    });
  }

  invalidateClubCache(): void {
    this.apollo.client.cache.evict({ fieldName: 'clubs' });
    this.apollo.client.cache.evict({ fieldName: 'myClubs' });
    this.apollo.client.cache.evict({ fieldName: 'clubRequests' });
    this.apollo.client.cache.evict({ fieldName: 'myClubRequests' });
    this.apollo.client.cache.gc();
  }
}