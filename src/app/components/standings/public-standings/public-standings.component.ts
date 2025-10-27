import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GET_TOURNAMENT_MATCHES } from '../../../graphql/tournament.graphql';
import { PublicTournamentHeaderComponent, ActionButton } from '../../ui/public-tournament-header/public-tournament-header.component';

interface TeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  gamesDifferential: number;
  winPercentage: number;
  points: number;
}

interface Match {
  _id: string;
  participant1: string;
  participant2: string;
  participant1Name?: string;
  participant2Name?: string;
  winner?: string;
  loser?: string;
  score?: {
    participant1Score: number;
    participant2Score: number;
  };
  completed: boolean;
  bracketType: string;
  round: number;
}

interface Tournament {
  _id: string;
  name: string;
  mode: string;
  groupA?: string[];
  groupB?: string[];
}

@Component({
  selector: 'app-public-standings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    PublicTournamentHeaderComponent
  ],
  templateUrl: './public-standings.component.html',
  styleUrl: './public-standings.component.css'
})
export class PublicStandingsComponent implements OnInit {
  tournamentId: string = '';
  tournament: Tournament | null = null;
  groupAStandings: TeamStanding[] = [];
  groupBStandings: TeamStanding[] = [];
  loading = true;
  error: string | null = null;
  actionButtons: ActionButton[] = [];

  displayedColumns: string[] = [
    'rank',
    'teamName',
    'matchesPlayed',
    'wins',
    'losses',
    'gamesWon'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apollo: Apollo
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tournamentId = params.get('tournamentId') || '';
      if (this.tournamentId) {
        this.setupActionButtons();
        this.loadStandings();
      }
    });
  }

  loadStandings(): void {
    this.loading = true;
    this.error = null;

    this.apollo
      .watchQuery<any>({
        query: GET_TOURNAMENT_MATCHES,
        variables: {
          tournamentId: this.tournamentId,
          tournamentIdAsId: this.tournamentId
        }
      })
      .valueChanges.subscribe({
        next: (result) => {
          this.tournament = result.data.tournament;
          const matches: Match[] = result.data.matches || [];
          const teams = result.data.teams || [];

          // Create team name map from teams data
          const teamNameMap = new Map<string, string>();
          teams.forEach((team: any) => {
            // GraphQL returns 'id' not '_id'
            const teamId = team.id || team._id;
            teamNameMap.set(teamId, team.name);
          });

          // Also extract team names from matches (as fallback)
          matches.forEach((match: Match) => {
            if (match.participant1Name && match.participant1) {
              teamNameMap.set(match.participant1, match.participant1Name);
            }
            if (match.participant2Name && match.participant2) {
              teamNameMap.set(match.participant2, match.participant2Name);
            }
          });

          console.log('=== STANDINGS DEBUG ===');
          console.log('Teams from backend:', teams);
          console.log('Team name map:', Array.from(teamNameMap.entries()));
          console.log('Group A team IDs:', this.tournament?.groupA);
          console.log('Group B team IDs:', this.tournament?.groupB);
          console.log('Sample match:', matches[0]);

          // Calculate standings for each group
          this.groupAStandings = this.calculateGroupStandings(
            matches.filter(m => m.bracketType === 'winners' && m.round === 1),
            teamNameMap,
            this.tournament?.groupA || []
          );

          this.groupBStandings = this.calculateGroupStandings(
            matches.filter(m => m.bracketType === 'losers' && m.round === 1),
            teamNameMap,
            this.tournament?.groupB || []
          );

          console.log('Group A standings:', this.groupAStandings);
          console.log('Group B standings:', this.groupBStandings);

          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading standings:', error);
          this.error = 'Failed to load standings. Please try again.';
          this.loading = false;
        }
      });
  }

  /**
   * Helper function to determine head-to-head winner between two teams
   * Returns the teamId of the winner, or null if no match found or tied
   */
  private getHeadToHeadWinner(matches: Match[], teamId1: string, teamId2: string): string | null {
    const headToHeadMatch = matches.find(match =>
      match.completed &&
      ((match.participant1 === teamId1 && match.participant2 === teamId2) ||
       (match.participant1 === teamId2 && match.participant2 === teamId1))
    );

    if (!headToHeadMatch || !headToHeadMatch.winner) {
      return null;
    }

    return headToHeadMatch.winner;
  }

  calculateGroupStandings(
    matches: Match[],
    teamNameMap: Map<string, string>,
    groupTeams: string[]
  ): TeamStanding[] {
    const standingsMap = new Map<string, TeamStanding>();

    console.log('calculateGroupStandings called with:');
    console.log('- groupTeams:', groupTeams);
    console.log('- matches count:', matches.length);
    console.log('- teamNameMap size:', teamNameMap.size);

    // Initialize standings for all teams in the group
    groupTeams.forEach(teamId => {
      const teamName = teamNameMap.get(teamId);
      console.log(`Initializing team ${teamId}: ${teamName || 'NOT FOUND'}`);

      standingsMap.set(teamId, {
        rank: 0,
        teamId: teamId,
        teamName: teamName || `Team ${teamId.substring(0, 8)}...`,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDifferential: 0,
        winPercentage: 0,
        points: 0
      });
    });

    // Process completed matches
    matches.forEach(match => {
      if (!match.completed || !match.score) return;

      const p1Id = match.participant1;
      const p2Id = match.participant2;
      const p1Score = match.score.participant1Score || 0;
      const p2Score = match.score.participant2Score || 0;

      // Update participant 1 stats
      if (standingsMap.has(p1Id)) {
        const standing = standingsMap.get(p1Id)!;
        standing.matchesPlayed++;
        standing.gamesWon += p1Score;
        standing.gamesLost += p2Score;

        if (match.winner === p1Id) {
          standing.wins++;
          standing.points += 2;
        } else {
          standing.losses++;
          standing.points += 1;
        }
      }

      // Update participant 2 stats
      if (standingsMap.has(p2Id)) {
        const standing = standingsMap.get(p2Id)!;
        standing.matchesPlayed++;
        standing.gamesWon += p2Score;
        standing.gamesLost += p1Score;

        if (match.winner === p2Id) {
          standing.wins++;
          standing.points += 2;
        } else {
          standing.losses++;
          standing.points += 1;
        }
      }
    });

    // Calculate derived stats and convert to array
    const standings = Array.from(standingsMap.values()).map(standing => {
      standing.gamesDifferential = standing.gamesWon - standing.gamesLost;
      standing.winPercentage = standing.matchesPlayed > 0
        ? standing.wins / standing.matchesPlayed
        : 0;
      return standing;
    });

    // Sort standings with comprehensive tie-breaking (see TIE_BREAKING_RULES.md)
    standings.sort((a, b) => {
      // 1. Primary: Most games won
      if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;

      // 2. Secondary: Most match wins
      if (b.wins !== a.wins) return b.wins - a.wins;

      // 3. Tertiary: Head-to-head record (only for 2-team ties)
      // Check if only these 2 teams are tied by seeing if any other team has same stats
      const teamsWithSameStats = standings.filter(s =>
        s.gamesWon === a.gamesWon && s.wins === a.wins
      );

      if (teamsWithSameStats.length === 2) {
        // Exactly 2 teams tied - use head-to-head
        const h2hWinner = this.getHeadToHeadWinner(matches, a.teamId, b.teamId);
        if (h2hWinner === a.teamId) return -1; // a ranks higher
        if (h2hWinner === b.teamId) return 1;  // b ranks higher
        // If no head-to-head result, continue to next criterion
      }
      // If 3+ teams tied, skip head-to-head and use games differential

      // 4. Quaternary: Games differential (higher is better)
      if (b.gamesDifferential !== a.gamesDifferential) {
        return b.gamesDifferential - a.gamesDifferential;
      }

      // 5. Quinary: Fewer matches played (better efficiency)
      if (a.matchesPlayed !== b.matchesPlayed) {
        return a.matchesPlayed - b.matchesPlayed;
      }

      // 6. Ultimate: Alphabetical by team ID (deterministic)
      return a.teamId.localeCompare(b.teamId);
    });

    // Assign ranks
    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    return standings;
  }

  formatWinPercentage(pct: number): string {
    return pct.toFixed(3);
  }

  formatGamesDifferential(diff: number): string {
    return diff >= 0 ? `+${diff}` : `${diff}`;
  }

  goBack(): void {
    this.router.navigate(['/players/tournament', this.tournamentId]);
  }

  isQualifyingTeam(rank: number): boolean {
    // Top 2 teams typically advance to playoffs
    return rank <= 2;
  }

  setupActionButtons(): void {
    this.actionButtons = [
      { label: 'View Players', icon: 'people', route: ['/players/tournament', this.tournamentId], class: 'players-button' },
      { label: 'Teams', icon: 'groups', route: ['/teams/tournament', this.tournamentId], class: 'teams-button' },
      { label: 'View Match Schedule', icon: 'calendar_today', route: ['/schedule', this.tournamentId], class: 'schedule-button' },
      { label: 'Live Scoring', icon: 'sports_score', route: ['/live', this.tournamentId], class: 'live-button' },
      { label: 'Rules', icon: 'gavel', route: ['/rules', this.tournamentId], class: 'rules-button' }
    ];
  }
}
