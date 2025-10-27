import { gql } from 'apollo-angular';

// Fragments
export const TOURNAMENT_FRAGMENT = gql`
  fragment TournamentFragment on Tournament {
    id
    name
    mode
    status
    registrationType
    club {
      id
      name
      clubAdmin {
        id
        firstName
        lastName
      }
    }
    maxParticipants
    currentParticipants
    bracketState {
      winners
      losers
    }
    bracketingMethod
    seedingCompleted
    winnersChampion
    consolationChampion
    groupA
    groupB
    createdAt
    updatedAt
  }
`;

export const PLAYER_FRAGMENT = gql`
  fragment PlayerFragment on Player {
    id
    firstName
    lastName
    gender
    user {
      id
      firstName
      lastName
      email
    }
    club {
      id
      name
    }
    teamId
    mode
    createdAt
    updatedAt
  }
`;

export const TEAM_FRAGMENT = gql`
  fragment TeamFragment on Team {
    id
    name
    player1Id
    player2Id
    tournamentId
    player1 {
      ...PlayerFragment
    }
    player2 {
      ...PlayerFragment
    }
    createdAt
    updatedAt
  }
  ${PLAYER_FRAGMENT}
`;

export const MATCH_FRAGMENT = gql`
  fragment MatchFragment on Match {
    id
    tournamentId
    round
    bracketType
    participant1
    participant2
    winner
    loser
    score {
      participant1Score
      participant2Score
      participant1Points
      participant2Points
    }
    completed
    participant1Name
    participant2Name
    scheduledDate
    scheduledTime
    createdAt
    updatedAt
  }
`;

// Queries
export const GET_TOURNAMENTS = gql`
  query GetTournaments {
    tournaments {
      ...TournamentFragment
    }
  }
  ${TOURNAMENT_FRAGMENT}
`;

export const GET_TOURNAMENT = gql`
  query GetTournament($id: ID!) {
    tournament(id: $id) {
      ...TournamentFragment
    }
  }
  ${TOURNAMENT_FRAGMENT}
`;

export const GET_PARTICIPANTS = gql`
  query GetParticipants($tournamentId: String!) {
    participants(tournamentId: $tournamentId) {
      participants {
        ... on Player {
          ...PlayerFragment
        }
        ... on Team {
          ...TeamFragment
        }
      }
    }
  }
  ${PLAYER_FRAGMENT}
  ${TEAM_FRAGMENT}
`;

export const GET_PLAYERS = gql`
  query GetPlayers($mode: TournamentMode) {
    players(mode: $mode) {
      ...PlayerFragment
    }
  }
  ${PLAYER_FRAGMENT}
`;

export const GET_TEAMS = gql`
  query GetTeams($tournamentId: String) {
    teams(tournamentId: $tournamentId) {
      ...TeamFragment
    }
  }
  ${TEAM_FRAGMENT}
`;

export const GET_MATCHES = gql`
  query GetMatches($tournamentId: String!) {
    matches(tournamentId: $tournamentId) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

export const GET_BRACKET = gql`
  query GetBracket($tournamentId: String!) {
    bracket(tournamentId: $tournamentId) {
      tournament {
        ...TournamentFragment
      }
      winners {
        ...MatchFragment
      }
      losers {
        ...MatchFragment
      }
    }
  }
  ${TOURNAMENT_FRAGMENT}
  ${MATCH_FRAGMENT}
`;

// Mutations
export const CREATE_TOURNAMENT = gql`
  mutation CreateTournament($input: CreateTournamentInput!) {
    createTournament(input: $input) {
      ...TournamentFragment
    }
  }
  ${TOURNAMENT_FRAGMENT}
`;

export const UPDATE_TOURNAMENT_STATUS = gql`
  mutation UpdateTournamentStatus($id: ID!, $status: TournamentStatus!) {
    updateTournamentStatus(id: $id, status: $status) {
      ...TournamentFragment
    }
  }
  ${TOURNAMENT_FRAGMENT}
`;

export const DELETE_TOURNAMENT = gql`
  mutation DeleteTournament($id: ID!) {
    deleteTournament(id: $id)
  }
`;

export const ARCHIVE_TOURNAMENT = gql`
  mutation ArchiveTournament($id: ID!) {
    archiveTournament(id: $id) {
      ...TournamentFragment
    }
  }
  ${TOURNAMENT_FRAGMENT}
`;

export const REGISTER_PLAYER = gql`
  mutation RegisterPlayer($input: RegisterPlayerInput!) {
    registerPlayer(input: $input) {
      ...PlayerFragment
    }
  }
  ${PLAYER_FRAGMENT}
`;

export const REGISTER_TEAM = gql`
  mutation RegisterTeam($input: RegisterTeamInput!) {
    registerTeam(input: $input) {
      ...TeamFragment
    }
  }
  ${TEAM_FRAGMENT}
`;

export const GENERATE_MATCHES = gql`
  mutation GenerateMatches($tournamentId: String!) {
    generateMatches(tournamentId: $tournamentId) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

export const SUBMIT_MATCH_RESULT = gql`
  mutation SubmitMatchResult($input: SubmitMatchResultInput!) {
    submitMatchResult(input: $input) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

export const UPDATE_LIVE_SCORE = gql`
  mutation UpdateLiveScore($input: UpdateLiveScoreInput!) {
    updateLiveScore(input: $input) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

// Subscriptions for real-time updates
export const MATCH_SCORE_UPDATED = gql`
  subscription MatchScoreUpdated($matchId: String!) {
    matchScoreUpdated(matchId: $matchId) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

export const TOURNAMENT_UPDATED = gql`
  subscription TournamentUpdated($tournamentId: String!) {
    tournamentUpdated(tournamentId: $tournamentId) {
      ...TournamentFragment
    }
  }
  ${TOURNAMENT_FRAGMENT}
`;

// Bracket seeding mutations
export const ASSIGN_PARTICIPANT_TO_BRACKET = gql`
  mutation AssignParticipantToBracket($input: AssignParticipantInput!) {
    assignParticipantToBracket(input: $input) {
      id
      tournamentId
      participantId
      bracketType
      seed
      createdAt
      updatedAt
    }
  }
`;

export const GENERATE_MATCHES_FROM_MANUAL_SEEDING = gql`
  mutation GenerateMatchesFromManualSeeding($tournamentId: String!) {
    generateMatchesFromManualSeeding(tournamentId: $tournamentId) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

export const GENERATE_ROUND_ROBIN_MATCHES = gql`
  mutation GenerateRoundRobinMatches($tournamentId: String!) {
    generateRoundRobinMatches(tournamentId: $tournamentId) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

// Quick Tournament Mutations
export const CREATE_QUICK_PLAYER = gql`
  mutation CreateQuickPlayer($input: CreateQuickPlayerInput!) {
    createQuickPlayer(input: $input) {
      ...PlayerFragment
    }
  }
  ${PLAYER_FRAGMENT}
`;

export const UPDATE_QUICK_PLAYER = gql`
  mutation UpdateQuickPlayer($id: ID!, $input: UpdateQuickPlayerInput!) {
    updateQuickPlayer(id: $id, input: $input) {
      ...PlayerFragment
    }
  }
  ${PLAYER_FRAGMENT}
`;

export const DELETE_QUICK_PLAYER = gql`
  mutation DeleteQuickPlayer($id: ID!) {
    deleteQuickPlayer(id: $id)
  }
`;

export const CREATE_QUICK_TEAM = gql`
  mutation CreateQuickTeam($input: CreateQuickTeamInput!) {
    createQuickTeam(input: $input) {
      ...TeamFragment
    }
  }
  ${TEAM_FRAGMENT}
`;

export const DELETE_QUICK_TEAM = gql`
  mutation DeleteQuickTeam($id: ID!) {
    deleteQuickTeam(id: $id)
  }
`;

export const SET_TOURNAMENT_GROUPS = gql`
  mutation SetTournamentGroups($input: SetTournamentGroupsInput!) {
    setTournamentGroups(input: $input) {
      tournamentId
      groupA
      groupB
    }
  }
`;

export const GET_TOURNAMENT_GROUPS = gql`
  query GetTournamentGroups($tournamentId: String!) {
    tournamentGroups(tournamentId: $tournamentId) {
      tournamentId
      groupA
      groupB
    }
  }
`;

export const GET_TOURNAMENT_PLAYERS = gql`
  query GetTournamentPlayers($tournamentId: String!) {
    tournamentPlayers(tournamentId: $tournamentId) {
      ...PlayerFragment
    }
  }
  ${PLAYER_FRAGMENT}
`;

export const SYNC_TOURNAMENT_PARTICIPANTS = gql`
  mutation SyncTournamentParticipants($id: ID!) {
    syncTournamentParticipants(id: $id) {
      ...TournamentFragment
    }
  }
  ${TOURNAMENT_FRAGMENT}
`;

export const UPDATE_MATCH_SCHEDULE = gql`
  mutation UpdateMatchSchedule($matchId: ID!, $scheduledDate: Date, $scheduledTime: String) {
    updateMatchSchedule(matchId: $matchId, scheduledDate: $scheduledDate, scheduledTime: $scheduledTime) {
      ...MatchFragment
    }
  }
  ${MATCH_FRAGMENT}
`;

export const GET_TOURNAMENT_MATCHES = gql`
  query GetTournamentMatches($tournamentId: String!, $tournamentIdAsId: ID!) {
    tournament(id: $tournamentIdAsId) {
      id
      name
      mode
      groupA
      groupB
    }
    matches(tournamentId: $tournamentId) {
      ...MatchFragment
    }
    teams(tournamentId: $tournamentId) {
      id
      name
    }
  }
  ${MATCH_FRAGMENT}
`;

// Viewer Tracking
export const GET_VIEWER_COUNT = gql`
  query GetViewerCount($tournamentId: ID!) {
    viewerCount(tournamentId: $tournamentId)
  }
`;

export const TRACK_VIEWER = gql`
  mutation TrackViewer($tournamentId: ID!, $sessionId: ID!) {
    trackViewer(tournamentId: $tournamentId, sessionId: $sessionId)
  }
`;

export const REMOVE_VIEWER = gql`
  mutation RemoveViewer($tournamentId: ID!, $sessionId: ID!) {
    removeViewer(tournamentId: $tournamentId, sessionId: $sessionId)
  }
`;

