describe('Match Progression Flow', () => {
  beforeEach(() => {
    // Mock tournament with generated matches
    const mockTournament = {
      id: '1',
      name: 'Test Tournament',
      mode: 'singles',
      status: 'in-progress',
      maxParticipants: 8,
      currentParticipants: 8,
      bracketState: { winners: ['qf1', 'qf2', 'qf3', 'qf4'], losers: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockMatches = [
      // Quarter Finals - Winners Bracket
      {
        id: 'qf1',
        tournamentId: '1',
        round: 1,
        bracketType: 'winners',
        participant1: 'player1',
        participant2: 'player2',
        participant1Name: 'John Doe',
        participant2Name: 'Jane Smith',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'qf2',
        tournamentId: '1',
        round: 1,
        bracketType: 'winners',
        participant1: 'player3',
        participant2: 'player4',
        participant1Name: 'Mike Johnson',
        participant2Name: 'Sarah Wilson',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'qf3',
        tournamentId: '1',
        round: 1,
        bracketType: 'winners',
        participant1: 'player5',
        participant2: 'player6',
        participant1Name: 'Tom Brown',
        participant2Name: 'Lisa Davis',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'qf4',
        tournamentId: '1',
        round: 1,
        bracketType: 'winners',
        participant1: 'player7',
        participant2: 'player8',
        participant1Name: 'Chris Anderson',
        participant2Name: 'Amy Taylor',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Semi Finals - Winners Bracket (initially with TBD participants)
      {
        id: 'sf1',
        tournamentId: '1',
        round: 2,
        bracketType: 'winners',
        participant1: 'TBD',
        participant2: 'TBD',
        participant1Name: 'TBD',
        participant2Name: 'TBD',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sf2',
        tournamentId: '1',
        round: 2,
        bracketType: 'winners',
        participant1: 'TBD',
        participant2: 'TBD',
        participant1Name: 'TBD',
        participant2Name: 'TBD',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Final - Winners Bracket
      {
        id: 'final',
        tournamentId: '1',
        round: 3,
        bracketType: 'winners',
        participant1: 'TBD',
        participant2: 'TBD',
        participant1Name: 'TBD',
        participant2Name: 'TBD',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock GraphQL responses
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('GetBracket')) {
        req.reply({
          data: {
            bracket: {
              tournament: mockTournament,
              winners: mockMatches.filter(m => m.bracketType === 'winners'),
              losers: mockMatches.filter(m => m.bracketType === 'losers')
            }
          }
        });
      } else if (req.body.query.includes('updateLiveScore')) {
        const matchId = req.body.variables.input.matchId;
        const scoreA = req.body.variables.input.scoreA;
        const scoreB = req.body.variables.input.scoreB;
        
        // Simulate match completion when score reaches 6
        const completed = scoreA >= 6 || scoreB >= 6;
        const winner = scoreA > scoreB ? 
          mockMatches.find(m => m.id === matchId)?.participant1 :
          mockMatches.find(m => m.id === matchId)?.participant2;
        
        req.reply({
          data: {
            updateLiveScore: {
              ...mockMatches.find(m => m.id === matchId),
              score: {
                participant1Score: scoreA,
                participant2Score: scoreB
              },
              completed,
              winner: completed ? winner : null
            }
          }
        });
      }
    }).as('graphqlRequest');

    cy.visit('/tournament/1');
  });

  it('should display all quarter final matches ready for play', () => {
    cy.wait('@graphqlRequest');

    // Check that live scoring section is visible
    cy.get('[data-cy=live-scoring-section]').should('be.visible');
    cy.contains('Live Scoring (4 active matches)').should('be.visible');

    // Verify all quarter final matches are displayed
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
    cy.contains('Mike Johnson').should('be.visible');
    cy.contains('Sarah Wilson').should('be.visible');
    cy.contains('Tom Brown').should('be.visible');
    cy.contains('Lisa Davis').should('be.visible');
    cy.contains('Chris Anderson').should('be.visible');
    cy.contains('Amy Taylor').should('be.visible');

    // Check that bracket displays show TBD for future rounds
    cy.get('[data-cy=bracket-tabs]').within(() => {
      cy.contains('Semi Final').click();
      cy.contains('TBD').should('be.visible');
    });
  });

  it('should allow live scoring and auto-determine winners', () => {
    cy.wait('@graphqlRequest');

    // Start scoring the first quarter final match
    cy.get('[data-cy=match-scoring-qf1]').within(() => {
      // Verify initial state
      cy.contains('John Doe').should('be.visible');
      cy.contains('Jane Smith').should('be.visible');
      cy.get('[data-cy=score-input-a]').should('have.value', '0');
      cy.get('[data-cy=score-input-b]').should('have.value', '0');

      // Score some points for John Doe (participant A)
      cy.get('[data-cy=increment-score-a]').click().click().click().click().click().click();
      
      cy.wait('@graphqlRequest');

      // Verify score updated
      cy.get('[data-cy=score-input-a]').should('have.value', '6');
      
      // Match should be completed and John Doe should be the winner
      cy.contains('John Doe Wins!').should('be.visible');
      cy.get('[data-cy=winner-icon]').should('be.visible');
      cy.contains('Completed').should('be.visible');
    });

    // Check that completed matches appear in completed section
    cy.get('[data-cy=completed-matches-section]').should('be.visible');
    cy.contains('Completed Matches (1)').should('be.visible');
  });

  it('should progress winners through the bracket automatically', () => {
    cy.wait('@graphqlRequest');

    // Complete all quarter final matches
    const quarterFinalResults = [
      { matchId: 'qf1', winnerScore: 6, loserScore: 3 },
      { matchId: 'qf2', winnerScore: 6, loserScore: 4 },
      { matchId: 'qf3', winnerScore: 6, loserScore: 2 },
      { matchId: 'qf4', winnerScore: 6, loserScore: 1 }
    ];

    quarterFinalResults.forEach((result) => {
      cy.get(`[data-cy=match-scoring-${result.matchId}]`).within(() => {
        // Set winner score
        cy.get('[data-cy=score-input-a]').clear().type(result.winnerScore.toString());
        cy.get('[data-cy=score-input-b]').clear().type(result.loserScore.toString());
      });
      
      cy.wait('@graphqlRequest');
    });

    // Verify all quarter finals are completed
    cy.contains('Completed Matches (4)').should('be.visible');
    cy.get('[data-cy=live-scoring-section]').should('contain', '0 active matches');

    // Check that semi-finals are now ready with the winners
    cy.get('[data-cy=bracket-tabs]').within(() => {
      cy.contains('Winners Bracket').click();
      cy.contains('Semi Final').should('be.visible');
      
      // Semi-finals should now have participants (no longer TBD)
      cy.get('[data-cy=semifinal-matches]').should('not.contain', 'TBD');
    });
  });

  it('should handle the complete tournament flow from QF to Final', () => {
    cy.wait('@graphqlRequest');

    // Mock advancing through rounds
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('updateLiveScore')) {
        // Always complete matches with 6-0 scores for quick progression
        req.reply({
          data: {
            updateLiveScore: {
              id: req.body.variables.input.matchId,
              score: {
                participant1Score: 6,
                participant2Score: 0
              },
              completed: true,
              winner: 'player1' // Always make participant 1 win for consistency
            }
          }
        });
      }
    }).as('fastMatch');

    // Simulate completing all matches rapidly
    const allMatches = ['qf1', 'qf2', 'qf3', 'qf4', 'sf1', 'sf2', 'final'];
    
    allMatches.forEach((matchId) => {
      cy.get(`[data-cy=match-scoring-${matchId}]`, { timeout: 10000 }).then(($match) => {
        if ($match.length > 0) {
          cy.wrap($match).within(() => {
            cy.get('[data-cy=score-input-a]').clear().type('6');
            cy.get('[data-cy=score-input-b]').clear().type('0');
          });
          cy.wait('@fastMatch');
        }
      });
    });

    // Verify tournament completion
    cy.contains('CHAMPION!', { timeout: 15000 }).should('be.visible');
    cy.contains('3rd Place!').should('be.visible');
    cy.get('[data-cy=trophy-icon]').should('be.visible');
  });

  it('should show match progress indicators', () => {
    cy.wait('@graphqlRequest');

    cy.get('[data-cy=match-scoring-qf1]').within(() => {
      // Initial progress should be 0%
      cy.get('[data-cy=match-progress]').should('contain', '0%');

      // Score some points
      cy.get('[data-cy=increment-score-a]').click().click();
      cy.get('[data-cy=increment-score-b]').click();
      
      cy.wait('@graphqlRequest');

      // Progress should increase
      cy.get('[data-cy=match-progress]').should('not.contain', '0%');
      
      // Complete the match
      cy.get('[data-cy=score-input-a]').clear().type('6');
      
      cy.wait('@graphqlRequest');

      // Progress should be 100% when completed
      cy.get('[data-cy=match-progress]').should('contain', '100%');
    });
  });

  it('should prevent score manipulation after match completion', () => {
    cy.wait('@graphqlRequest');

    // Complete a match first
    cy.get('[data-cy=match-scoring-qf1]').within(() => {
      cy.get('[data-cy=score-input-a]').clear().type('6');
      cy.get('[data-cy=score-input-b]').clear().type('0');
    });
    
    cy.wait('@graphqlRequest');

    // Verify controls are disabled
    cy.get('[data-cy=match-scoring-qf1]').within(() => {
      cy.get('[data-cy=score-input-a]').should('be.disabled');
      cy.get('[data-cy=score-input-b]').should('be.disabled');
      cy.get('[data-cy=increment-score-a]').should('be.disabled');
      cy.get('[data-cy=increment-score-b]').should('be.disabled');
      cy.get('[data-cy=reset-scores-btn]').should('not.exist');
    });
  });
});