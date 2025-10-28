// Import Club interface
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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  role: 'superadmin' | 'club_admin' | 'member';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  name?: string; // For backward compatibility
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female';
  user?: User;
  tournamentId?: string;
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
  round: number; // 1 = QF, 2 = SF, 3 = Final
  bracketType: 'winners' | 'losers';
  participant1: string; // playerId or teamId
  participant2: string; // playerId or teamId
  winner?: string;
  loser?: string;
  score?: {
    participant1Score: number; // Games won
    participant2Score: number; // Games won
    participant1Points?: number; // Points in current game (0, 15, 30, 40)
    participant2Points?: number; // Points in current game (0, 15, 30, 40)
  };
  completed: boolean;
  participant1Name?: string;
  participant2Name?: string;
  scheduledDate?: Date | number; // Date object or Unix timestamp
  scheduledTime?: string; // HH:MM format
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
  status: TournamentStatus;
  registrationType: 'open' | 'club_only';
  club?: Club;
  maxParticipants: number;
  currentParticipants: number;
  bracketState: BracketState;
  bracketingMethod: 'random' | 'manual';
  seedingCompleted: boolean;
  winnersChampion?: string;
  consolationChampion?: string;
  groupA?: string[];
  groupB?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BracketAssignment {
  id: string;
  tournamentId: string;
  participantId: string;
  bracketType: 'winners' | 'losers';
  seed: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TournamentStatus = 'registration' | 'in-progress' | 'completed';

export interface TournamentState {
  mode: 'singles' | 'doubles';
  tournament: Tournament | null;
  allTournaments: Tournament[];
  players: Player[];
  teams: Team[];
  matches: Match[];
  bracket: { winners: Match[]; losers: Match[] }; // Keep this as Match[] for frontend use
  status: TournamentStatus;
  loading: boolean;
  error: string | null;
}