import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// Tournament Components
import { ModeSelectorComponent } from './components/mode-selector/mode-selector.component';
import { PlayerRegistrationComponent } from './components/player-registration/player-registration.component';
import { TournamentBracketComponent } from './components/tournament-bracket/tournament-bracket.component';
import { TournamentDashboardComponent } from './components/tournament-dashboard/tournament-dashboard.component';

// Authentication Components
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';

// Club Components
import { ClubDashboardComponent } from './components/club/club-dashboard/club-dashboard.component';
import { ClubMembersComponent } from './components/club/club-members/club-members.component';
import { ClubDirectoryComponent } from './components/club/club-directory/club-directory.component';
import { ClubRequestFormComponent } from './components/club/club-request-form/club-request-form.component';
import { MyClubRequestsComponent } from './components/club/my-club-requests/my-club-requests.component';

// User Components
import { UserProfileComponent } from './components/user/user-profile/user-profile.component';

// Admin Components
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './components/admin/user-management/user-management.component';
import { ClubRequestsManagementComponent } from './components/admin/club-requests-management/club-requests-management.component';

// Tournament Club Components
import { TournamentPlayerSelectionComponent } from './components/tournament/tournament-player-selection/tournament-player-selection.component';

// Tournament Management Components
import { PlayerManagementComponent } from './components/tournament/player-management/player-management.component';
import { TeamPairingComponent } from './components/tournament/team-pairing/team-pairing.component';
import { GroupAssignmentComponent } from './components/tournament/group-assignment/group-assignment.component';
import { MatchSetupComponent } from './components/tournament/match-setup/match-setup.component';
import { LiveScoringComponent } from './components/tournament/live-scoring/live-scoring.component';
import { QuickTournamentComponent } from './components/tournament/quick-tournament/quick-tournament.component';
import { QuickTournamentListComponent } from './components/tournament/quick-tournament-list/quick-tournament-list.component';
import { PublicLiveScoringComponent } from './components/tournament/public-live-scoring/public-live-scoring.component';
import { QuickTournamentSchedulingComponent } from './components/tournament/quick-tournament-scheduling/quick-tournament-scheduling.component';
import { PublicScheduleComponent } from './components/tournament/public-schedule/public-schedule.component';
import { PublicPlayersListComponent } from './components/players/public-players-list/public-players-list.component';
import { PublicStandingsComponent } from './components/standings/public-standings/public-standings.component';
import { PublicTeamsListComponent } from './components/teams/public-teams-list/public-teams-list.component';
import { PublicRulesComponent } from './components/tournament/public-rules/public-rules.component';

// Test Component
import { TestComponent } from './components/test/test.component';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Sign In - BracketAce',
    data: { requireAuth: false }
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Sign Up - BracketAce',
    data: { requireAuth: false }
  },
  {
    path: 'live/:id',
    component: PublicLiveScoringComponent,
    title: 'Live Scoring - BracketAce',
    data: { requireAuth: false }
  },
  {
    path: 'schedule/:id',
    component: PublicScheduleComponent,
    title: 'Match Schedule - BracketAce',
    data: { requireAuth: false }
  },
  {
    path: 'players/tournament/:tournamentId',
    component: PublicPlayersListComponent,
    title: 'Tournament Players - BracketAce',
    data: { requireAuth: false }
  },
  {
    path: 'standings/tournament/:tournamentId',
    component: PublicStandingsComponent,
    title: 'Tournament Standings - BracketAce',
    data: { requireAuth: false }
  },
  {
    path: 'teams/tournament/:tournamentId',
    component: PublicTeamsListComponent,
    title: 'Tournament Teams - BracketAce',
    data: { requireAuth: false }
  },
  {
    path: 'rules/:id',
    component: PublicRulesComponent,
    title: 'Tournament Rules - BracketAce',
    data: { requireAuth: false }
  },

  // Protected routes - require authentication
  {
    path: 'dashboard',
    component: TournamentDashboardComponent,
    title: 'Dashboard - BracketAce',
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    title: 'Profile - BracketAce',
    canActivate: [AuthGuard]
  },

  // Tournament routes
  {
    path: 'tournaments',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: TournamentDashboardComponent,
        title: 'Tournaments - BracketAce'
      },
      {
        path: 'create',
        component: ModeSelectorComponent,
        title: 'Create Tournament - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: 'quick',
        component: QuickTournamentComponent,
        title: 'Quick Tournament - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: 'quick-list',
        component: QuickTournamentListComponent,
        title: 'Quick Tournaments - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: 'my',
        component: TournamentDashboardComponent,
        title: 'My Tournaments - BracketAce'
      }
    ]
  },
  {
    path: 'tournament',
    canActivate: [AuthGuard],
    children: [
      {
        path: ':id/register',
        component: PlayerRegistrationComponent,
        title: 'Register Players - BracketAce'
      },
      {
        path: ':id/bracket',
        component: TournamentBracketComponent,
        title: 'Tournament Bracket - BracketAce'
      },
      {
        path: ':tournamentId/select-players',
        component: TournamentPlayerSelectionComponent,
        title: 'Select Players - BracketAce',
        data: { roles: ['club_admin'] }
      },
      {
        path: ':id/player-management',
        component: PlayerManagementComponent,
        title: 'Player Management - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: ':id/team-pairing',
        component: TeamPairingComponent,
        title: 'Team Pairing - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: ':id/group-assignment',
        component: GroupAssignmentComponent,
        title: 'Group Assignment - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: ':id/match-setup',
        component: MatchSetupComponent,
        title: 'Match Setup - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: ':id/live-scoring',
        component: LiveScoringComponent,
        title: 'Live Scoring - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      },
      {
        path: ':id/schedule',
        component: QuickTournamentSchedulingComponent,
        title: 'Schedule Matches - BracketAce',
        data: { roles: ['superadmin', 'club_admin'] }
      }
    ]
  },

  // Club routes
  {
    path: 'clubs',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ClubDirectoryComponent,
        title: 'Club Directory - BracketAce'
      },
      {
        path: 'my',
        component: ClubDirectoryComponent,
        title: 'My Clubs - BracketAce'
      },
      {
        path: 'request',
        component: ClubRequestFormComponent,
        title: 'Request Club Creation - BracketAce'
      },
      {
        path: 'my-requests',
        component: MyClubRequestsComponent,
        title: 'My Club Requests - BracketAce'
      },
      {
        path: 'create',
        component: ClubDirectoryComponent, // Replace with actual create component (for superadmin direct create)
        title: 'Create Club - BracketAce',
        data: { roles: ['superadmin'] }
      }
    ]
  },
  {
    path: 'club',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        component: ClubDashboardComponent,
        title: 'Club Dashboard - BracketAce',
        data: { roles: ['club_admin'] }
      },
      {
        path: ':id/members',
        component: ClubMembersComponent,
        title: 'Club Members - BracketAce',
        data: { roles: ['club_admin'] }
      },
      {
        path: ':id/tournaments',
        component: TournamentDashboardComponent,
        title: 'Club Tournaments - BracketAce',
        data: { roles: ['club_admin'] }
      },
      {
        path: ':id/players',
        loadComponent: () => import('./components/club/club-players/club-players.component').then(m => m.ClubPlayersComponent),
        title: 'Club Players - BracketAce',
        data: { roles: ['club_admin'] }
      }
    ]
  },

  // Player routes - redirect to club players management
  {
    path: 'players',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/club/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'register',
        redirectTo: '/club/dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { roles: ['superadmin'] },
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        title: 'Admin Dashboard - BracketAce'
      },
      {
        path: 'users',
        component: UserManagementComponent,
        title: 'User Management - BracketAce'
      },
      {
        path: 'clubs',
        component: ClubDirectoryComponent, // Replace with admin club management
        title: 'Club Management - BracketAce'
      },
      {
        path: 'club-requests',
        component: ClubRequestsManagementComponent,
        title: 'Club Requests - BracketAce'
      },
      {
        path: 'settings',
        component: UserProfileComponent, // Replace with system settings component
        title: 'System Settings - BracketAce'
      }
    ]
  },

  // Fallback routes
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
