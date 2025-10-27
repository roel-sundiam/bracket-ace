import { Injectable, signal, computed } from '@angular/core';
import { TournamentService } from './tournament.service';
import { Match } from '../models/tournament.model';

export interface LiveScore {
  matchId: string;
  scoreA: number;
  scoreB: number;
  participant1Id: string;
  participant2Id: string;
  participant1Name: string;
  participant2Name: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MatchScoringService {
  // Map of match ID to live scores
  private _liveScores = signal<Map<string, LiveScore>>(new Map());

  constructor(private tournamentService: TournamentService) {}

  // Get all live scores
  liveScores = computed(() => this._liveScores());

  // Get score for a specific match
  getMatchScore(matchId: string) {
    return computed(() => this._liveScores().get(matchId));
  }

  // Get all live scores as array
  getAllScores = computed(() => {
    return Array.from(this._liveScores().values());
  });

  // Initialize a match for live scoring
  initializeMatch(match: Match): void {
    const currentScores = this._liveScores();
    const newScores = new Map(currentScores);
    
    if (!newScores.has(match.id)) {
      newScores.set(match.id, {
        matchId: match.id,
        scoreA: match.score?.participant1Score || 0,
        scoreB: match.score?.participant2Score || 0,
        participant1Id: match.participant1,
        participant2Id: match.participant2,
        participant1Name: match.participant1Name || 'TBD',
        participant2Name: match.participant2Name || 'TBD',
        completed: match.completed
      });
      
      this._liveScores.set(newScores);
    }
  }

  // Update live score for a match
  updateScore(matchId: string, scoreA: number, scoreB: number): void {
    const currentScores = this._liveScores();
    const newScores = new Map(currentScores);
    const existingScore = newScores.get(matchId);
    
    if (existingScore) {
      const updatedScore: LiveScore = {
        ...existingScore,
        scoreA,
        scoreB,
        completed: this.isMatchCompleted(scoreA, scoreB)
      };
      
      newScores.set(matchId, updatedScore);
      this._liveScores.set(newScores);
      
      // Send to backend for persistence and auto-advancement
      this.tournamentService.updateLiveScore(matchId, scoreA, scoreB).subscribe({
        next: (updatedMatch) => {
          // Update the score with the server response
          const finalScores = new Map(this._liveScores());
          const serverScore = finalScores.get(matchId);
          if (serverScore) {
            finalScores.set(matchId, {
              ...serverScore,
              completed: updatedMatch.completed,
              scoreA: updatedMatch.score?.participant1Score || scoreA,
              scoreB: updatedMatch.score?.participant2Score || scoreB
            });
            this._liveScores.set(finalScores);
          }
        },
        error: (error) => {
          console.error('Failed to update live score:', error);
          // Revert the optimistic update
          this._liveScores.set(currentScores);
        }
      });
    }
  }

  // Computed signal for auto-determining winners
  getMatchWinner(matchId: string) {
    return computed(() => {
      const score = this._liveScores().get(matchId);
      if (!score || !this.isMatchCompleted(score.scoreA, score.scoreB)) {
        return null;
      }
      
      return score.scoreA > score.scoreB ? 
        { winnerId: score.participant1Id, winnerName: score.participant1Name } :
        { winnerId: score.participant2Id, winnerName: score.participant2Name };
    });
  }

  // Computed signal for auto-determining losers
  getMatchLoser(matchId: string) {
    return computed(() => {
      const score = this._liveScores().get(matchId);
      if (!score || !this.isMatchCompleted(score.scoreA, score.scoreB)) {
        return null;
      }
      
      return score.scoreA < score.scoreB ? 
        { loserId: score.participant1Id, loserName: score.participant1Name } :
        { loserId: score.participant2Id, loserName: score.participant2Name };
    });
  }

  // Get all completed matches
  getCompletedMatches = computed(() => {
    return Array.from(this._liveScores().values()).filter(score => score.completed);
  });

  // Get all active (non-completed) matches
  getActiveMatches = computed(() => {
    return Array.from(this._liveScores().values()).filter(score => !score.completed);
  });

  // Check if a match meets completion criteria
  private isMatchCompleted(scoreA: number, scoreB: number): boolean {
    // Tennis scoring: First to 6 games with at least 2-game lead
    // Or first to 7 games (if tied 6-6, need to win 7-5 or go to tiebreak)
    const minGames = 6;
    const minLead = 2;
    
    if (scoreA >= minGames && scoreA >= scoreB + minLead) {
      return true;
    }
    if (scoreB >= minGames && scoreB >= scoreA + minLead) {
      return true;
    }
    
    // Handle 7-5 scenario
    if (scoreA === 7 && scoreB === 5) return true;
    if (scoreB === 7 && scoreA === 5) return true;
    
    return false;
  }

  // Reset all scores (for new tournament)
  resetAllScores(): void {
    this._liveScores.set(new Map());
  }

  // Remove a specific match from live scoring
  removeMatch(matchId: string): void {
    const currentScores = this._liveScores();
    const newScores = new Map(currentScores);
    newScores.delete(matchId);
    this._liveScores.set(newScores);
  }

  // Bulk initialize matches
  initializeMatches(matches: Match[]): void {
    const currentScores = this._liveScores();
    const newScores = new Map(currentScores);
    
    matches.forEach(match => {
      if (!newScores.has(match.id)) {
        newScores.set(match.id, {
          matchId: match.id,
          scoreA: match.score?.participant1Score || 0,
          scoreB: match.score?.participant2Score || 0,
          participant1Id: match.participant1,
          participant2Id: match.participant2,
          participant1Name: match.participant1Name || 'TBD',
          participant2Name: match.participant2Name || 'TBD',
          completed: match.completed
        });
      }
    });
    
    this._liveScores.set(newScores);
  }

  // Get match progress indicator
  getMatchProgress(matchId: string) {
    return computed(() => {
      const score = this._liveScores().get(matchId);
      if (!score) return 0;
      
      const totalPossibleScore = 12; // Rough estimate for match completion
      const currentScore = score.scoreA + score.scoreB;
      return Math.min(100, (currentScore / totalPossibleScore) * 100);
    });
  }
}