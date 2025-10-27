// GraphQL Input Types
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateClubInput {
  name: string;
  description?: string;
  clubAdminEmail: string;
}

export interface RequestClubInput {
  name: string;
  description?: string;
}

export interface CreateTournamentInput {
  name: string;
  mode: 'singles' | 'doubles';
  registrationType: 'open' | 'club_only';
  clubId?: string;
}

export interface RegisterPlayerInput {
  name: string;
  mode: 'singles' | 'doubles';
  tournamentId: string;
}

export interface RegisterTeamInput {
  name: string;
  player1Name: string;
  player2Name: string;
  tournamentId: string;
}

export interface SubmitMatchResultInput {
  matchId: string;
  winnerId: string;
  loserId: string;
  score?: ScoreInput;
}

export interface UpdateLiveScoreInput {
  matchId: string;
  scoreA: number;
  scoreB: number;
}

export interface ScoreInput {
  participant1Score: number;
  participant2Score: number;
}

// GraphQL Response Types
export interface AuthPayload {
  token: string;
  user: User;
}

export interface LoginResponse {
  login: AuthPayload;
}

export interface RegisterResponse {
  register: AuthPayload;
}

export interface MeResponse {
  me: User | null;
}

export interface UsersResponse {
  users: User[];
}

export interface ClubsResponse {
  clubs: Club[];
}

export interface ClubResponse {
  club: Club;
}

export interface MyClubsResponse {
  myClubs: Club[];
}

export interface ClubMembersResponse {
  clubMembers: ClubMembership[];
}

export interface ClubMembershipRequestsResponse {
  clubMembershipRequests: ClubMembership[];
}

export interface CreateClubResponse {
  createClub: Club;
}

export interface RequestClubMembershipResponse {
  requestClubMembership: ClubMembership;
}

export interface ApproveClubMembershipResponse {
  approveClubMembership: ClubMembership;
}

export interface RejectClubMembershipResponse {
  rejectClubMembership: ClubMembership;
}

export interface ClubRequestsResponse {
  clubRequests: ClubRequest[];
}

export interface MyClubRequestsResponse {
  myClubRequests: ClubRequest[];
}

export interface RequestClubCreationResponse {
  requestClubCreation: ClubRequest;
}

export interface ApproveClubRequestResponse {
  approveClubRequest: Club;
}

export interface RejectClubRequestResponse {
  rejectClubRequest: ClubRequest;
}

export interface TournamentRegistrationsResponse {
  tournamentRegistrations: TournamentRegistration[];
}

export interface SelectPlayerForTournamentResponse {
  selectPlayerForTournament: TournamentRegistration;
}

export interface RemovePlayerFromTournamentResponse {
  removePlayerFromTournament: boolean;
}

export interface TournamentResponse {
  tournaments: Tournament[];
}

export interface SingleTournamentResponse {
  tournament: Tournament;
}

export interface ParticipantsResponse {
  participants: {
    participants: (Player | Team)[];
  };
}

export interface PlayersResponse {
  players: Player[];
}

export interface TeamsResponse {
  teams: Team[];
}

export interface MatchesResponse {
  matches: Match[];
}

export interface BracketResponse {
  bracket: {
    tournament: Tournament;
    winners: Match[];
    losers: Match[];
  };
}

export interface CreateTournamentResponse {
  createTournament: Tournament;
}

export interface UpdateTournamentStatusResponse {
  updateTournamentStatus: Tournament;
}

export interface DeleteTournamentResponse {
  deleteTournament: boolean;
}

export interface ArchiveTournamentResponse {
  archiveTournament: Tournament;
}

export interface RegisterPlayerResponse {
  registerPlayer: Player;
}

export interface RegisterTeamResponse {
  registerTeam: Team;
}

export interface GenerateMatchesResponse {
  generateMatches: Match[];
}

export interface SubmitMatchResultResponse {
  submitMatchResult: Match;
}

export interface UpdateLiveScoreResponse {
  updateLiveScore: Match;
}

// Subscription Response Types
export interface MatchScoreUpdatedResponse {
  matchScoreUpdated: Match;
}

export interface TournamentUpdatedResponse {
  tournamentUpdated: Tournament;
}

// Re-export types from models for convenience
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'club_admin' | 'member';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  clubAdmin: User;
  isActive: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubMembership {
  id: string;
  club: Club;
  user: User;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  approvedBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubRequest {
  id: string;
  name: string;
  description?: string;
  requestedBy: User;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: User;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentRegistration {
  id: string;
  tournament: Tournament;
  club: Club;
  participantId: string;
  participantType: string;
  selectedByClubAdmin: boolean;
  selectedAt?: Date;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  name: string;
  user?: User;
  teamId?: string;
  mode: 'singles' | 'doubles';
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  player1Id: string;
  player2Id: string;
  tournamentId: string;
  player1?: Player;
  player2?: Player;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  bracketType: 'winners' | 'losers';
  participant1: string;
  participant2: string;
  winner?: string;
  loser?: string;
  score?: {
    participant1Score: number;
    participant2Score: number;
  };
  completed: boolean;
  participant1Name?: string;
  participant2Name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BracketState {
  winners: string[];
  losers: string[];
}

export interface Tournament {
  id: string;
  name: string;
  mode: 'singles' | 'doubles';
  status: 'registration' | 'in-progress' | 'completed';
  registrationType: 'open' | 'club_only';
  club?: Club;
  maxParticipants: number;
  currentParticipants: number;
  bracketState: BracketState;
  winnersChampion?: string;
  consolationChampion?: string;
  createdAt: Date;
  updatedAt: Date;
}