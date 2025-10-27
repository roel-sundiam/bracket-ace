import { gql } from '@apollo/client';

export const CLUBS_QUERY = gql`
  query Clubs {
    clubs {
      id
      name
      description
      clubAdmin {
        id
        email
        firstName
        lastName
      }
      isActive
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const CLUB_QUERY = gql`
  query Club($id: ID!) {
    club(id: $id) {
      id
      name
      description
      clubAdmin {
        id
        email
        firstName
        lastName
      }
      isActive
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const MY_CLUBS_QUERY = gql`
  query MyClubs {
    myClubs {
      id
      name
      description
      clubAdmin {
        id
        email
        firstName
        lastName
      }
      isActive
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const CLUB_MEMBERS_QUERY = gql`
  query ClubMembers($clubId: ID!) {
    clubMembers(clubId: $clubId) {
      id
      user {
        id
        email
        firstName
        lastName
      }
      status
      requestedAt
      approvedAt
      createdAt
      updatedAt
    }
  }
`;

export const CLUB_MEMBERSHIP_REQUESTS_QUERY = gql`
  query ClubMembershipRequests($clubId: ID!) {
    clubMembershipRequests(clubId: $clubId) {
      id
      club {
        id
        name
      }
      user {
        id
        email
        firstName
        lastName
      }
      status
      requestedAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_CLUB_MUTATION = gql`
  mutation CreateClub($input: CreateClubInput!) {
    createClub(input: $input) {
      id
      name
      description
      clubAdmin {
        id
        email
        firstName
        lastName
      }
      isActive
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const REQUEST_CLUB_MEMBERSHIP_MUTATION = gql`
  mutation RequestClubMembership($clubId: ID!) {
    requestClubMembership(clubId: $clubId) {
      id
      club {
        id
        name
      }
      user {
        id
        email
        firstName
        lastName
      }
      status
      requestedAt
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_CLUB_MEMBERSHIP_MUTATION = gql`
  mutation ApproveClubMembership($membershipId: ID!) {
    approveClubMembership(membershipId: $membershipId) {
      id
      user {
        id
        email
        firstName
        lastName
      }
      status
      approvedAt
      approvedBy {
        id
        firstName
        lastName
      }
      createdAt
      updatedAt
    }
  }
`;

export const REJECT_CLUB_MEMBERSHIP_MUTATION = gql`
  mutation RejectClubMembership($membershipId: ID!) {
    rejectClubMembership(membershipId: $membershipId) {
      id
      user {
        id
        email
        firstName
        lastName
      }
      status
      rejectedAt
      approvedBy {
        id
        firstName
        lastName
      }
      createdAt
      updatedAt
    }
  }
`;

export const SELECT_PLAYER_FOR_TOURNAMENT_MUTATION = gql`
  mutation SelectPlayerForTournament($tournamentId: ID!, $playerId: ID!) {
    selectPlayerForTournament(tournamentId: $tournamentId, playerId: $playerId) {
      id
      tournament {
        id
        name
      }
      club {
        id
        name
      }
      participantId
      participantType
      selectedByClubAdmin
      selectedAt
      registeredAt
      createdAt
      updatedAt
    }
  }
`;

export const REMOVE_PLAYER_FROM_TOURNAMENT_MUTATION = gql`
  mutation RemovePlayerFromTournament($tournamentId: ID!, $playerId: ID!) {
    removePlayerFromTournament(tournamentId: $tournamentId, playerId: $playerId)
  }
`;

export const TOURNAMENT_REGISTRATIONS_QUERY = gql`
  query TournamentRegistrations($tournamentId: ID!) {
    tournamentRegistrations(tournamentId: $tournamentId) {
      id
      tournament {
        id
        name
      }
      club {
        id
        name
      }
      participantId
      participantType
      selectedByClubAdmin
      selectedAt
      registeredAt
      createdAt
      updatedAt
    }
  }
`;

export const CLUB_REQUESTS_QUERY = gql`
  query ClubRequests {
    clubRequests {
      id
      name
      description
      requestedBy {
        id
        email
        firstName
        lastName
      }
      status
      reviewedBy {
        id
        email
        firstName
        lastName
      }
      reviewedAt
      rejectionReason
      createdAt
      updatedAt
    }
  }
`;

export const MY_CLUB_REQUESTS_QUERY = gql`
  query MyClubRequests {
    myClubRequests {
      id
      name
      description
      status
      rejectionReason
      createdAt
      updatedAt
      reviewedAt
      requestedBy {
        id
        email
        firstName
        lastName
      }
      reviewedBy {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

export const REQUEST_CLUB_CREATION_MUTATION = gql`
  mutation RequestClubCreation($input: RequestClubInput!) {
    requestClubCreation(input: $input) {
      id
      name
      description
      requestedBy {
        id
        email
        firstName
        lastName
      }
      status
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_CLUB_REQUEST_MUTATION = gql`
  mutation ApproveClubRequest($requestId: ID!) {
    approveClubRequest(requestId: $requestId) {
      id
      name
      description
      clubAdmin {
        id
        email
        firstName
        lastName
      }
      isActive
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const REJECT_CLUB_REQUEST_MUTATION = gql`
  mutation RejectClubRequest($requestId: ID!, $reason: String) {
    rejectClubRequest(requestId: $requestId, reason: $reason) {
      id
      name
      description
      status
      reviewedBy {
        id
        email
        firstName
        lastName
      }
      reviewedAt
      rejectionReason
      createdAt
      updatedAt
    }
  }
`;