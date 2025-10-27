describe('Auto-Scoring Signals Functionality', () => {
  beforeEach(() => {
    // Mock a live match for testing signals
    const mockMatch = {
      id: 'test-match',
      tournamentId: '1',
      round: 1,
      bracketType: 'winners',
      participant1: 'player1',
      participant2: 'player2',
      participant1Name: 'John Doe',
      participant2Name: 'Jane Smith',
      completed: false,
      score: { participant1Score: 0, participant2Score: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Mock GraphQL responses for live scoring
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('updateLiveScore')) {
        const scoreA = req.body.variables.input.scoreA;
        const scoreB = req.body.variables.input.scoreB;
        
        // Tennis scoring logic: first to 6 games with 2-game lead
        let completed = false;
        let winner = null;
        let loser = null;
        
        if (scoreA >= 6 && scoreA >= scoreB + 2) {
          completed = true;
          winner = 'player1';
          loser = 'player2';
        } else if (scoreB >= 6 && scoreB >= scoreA + 2) {
          completed = true;
          winner = 'player2';
          loser = 'player1';
        } else if (scoreA === 7 && scoreB === 5) {
          completed = true;
          winner = 'player1';
          loser = 'player2';
        } else if (scoreB === 7 && scoreA === 5) {
          completed = true;
          winner = 'player2';
          loser = 'player1';
        }
        
        req.reply({
          data: {
            updateLiveScore: {
              ...mockMatch,
              score: {
                participant1Score: scoreA,
                participant2Score: scoreB
              },
              completed,
              winner,
              loser
            }
          }
        });
      }
    }).as('liveScoreUpdate');

    cy.visit('/match/test-match');
  });

  it('should update scores in real-time with signals', () => {
    // Verify initial state
    cy.get('[data-cy=score-display-a]').should('contain', '0');
    cy.get('[data-cy=score-display-b]').should('contain', '0');
    cy.get('[data-cy=match-completed]').should('not.exist');

    // Increment score A
    cy.get('[data-cy=increment-score-a]').click();
    cy.wait('@liveScoreUpdate');
    
    // Verify score updated immediately
    cy.get('[data-cy=score-display-a]').should('contain', '1');
    cy.get('[data-cy=score-display-b]').should('contain', '0');

    // Increment score B multiple times
    cy.get('[data-cy=increment-score-b]').click().click().click();
    cy.wait('@liveScoreUpdate');
    
    cy.get('[data-cy=score-display-a]').should('contain', '1');
    cy.get('[data-cy=score-display-b]').should('contain', '3');
  });

  it('should auto-determine winner when score reaches completion criteria', () => {
    // Test 6-0 completion
    for (let i = 0; i < 6; i++) {
      cy.get('[data-cy=increment-score-a]').click();
      cy.wait('@liveScoreUpdate');
    }
    
    // Match should be completed
    cy.get('[data-cy=match-completed]').should('be.visible');
    cy.get('[data-cy=winner-banner]').should('contain', 'John Doe Wins!');
    cy.get('[data-cy=final-score]').should('contain', '6 - 0');
    cy.get('[data-cy=trophy-icon]').should('be.visible');
  });

  it('should handle close score scenarios (7-5 win)', () => {
    // Set up a close score scenario: 5-5
    cy.get('[data-cy=score-input-a]').clear().type('5');
    cy.get('[data-cy=score-input-b]').clear().type('5');
    cy.wait('@liveScoreUpdate');

    // Player A should need to win 7-5
    cy.get('[data-cy=increment-score-a]').click();
    cy.wait('@liveScoreUpdate');
    
    // 6-5 should not complete the match
    cy.get('[data-cy=match-completed]').should('not.exist');
    
    cy.get('[data-cy=increment-score-a]').click();
    cy.wait('@liveScoreUpdate');
    
    // 7-5 should complete the match
    cy.get('[data-cy=match-completed]').should('be.visible');
    cy.get('[data-cy=winner-banner]').should('contain', 'John Doe Wins!');
    cy.get('[data-cy=final-score]').should('contain', '7 - 5');
  });

  it('should require 2-game lead for matches under 6 games', () => {
    // Test that 6-5 doesn't end the match
    cy.get('[data-cy=score-input-a]').clear().type('6');
    cy.get('[data-cy=score-input-b]').clear().type('5');
    cy.wait('@liveScoreUpdate');

    // Match should still be active
    cy.get('[data-cy=match-completed]').should('not.exist');
    cy.get('[data-cy=increment-score-a]').should('be.enabled');
    cy.get('[data-cy=increment-score-b]').should('be.enabled');

    // But 6-4 should end it
    cy.get('[data-cy=score-input-b]').clear().type('4');
    cy.wait('@liveScoreUpdate');

    cy.get('[data-cy=match-completed]').should('be.visible');
  });

  it('should show match progress as computed signal', () => {
    cy.get('[data-cy=match-progress-bar]').should('be.visible');
    cy.get('[data-cy=progress-percentage]').should('contain', '0%');

    // Add some scores
    cy.get('[data-cy=increment-score-a]').click().click();
    cy.get('[data-cy=increment-score-b]').click();
    cy.wait('@liveScoreUpdate');

    // Progress should increase
    cy.get('[data-cy=progress-percentage]').should('not.contain', '0%');
    
    // Complete the match
    cy.get('[data-cy=score-input-a]').clear().type('6');
    cy.get('[data-cy=score-input-b]').clear().type('0');
    cy.wait('@liveScoreUpdate');

    // Progress should be at 100%
    cy.get('[data-cy=progress-percentage]').should('contain', '100%');
  });

  it('should disable controls when match is completed via signals', () => {
    // Complete a match
    cy.get('[data-cy=score-input-a]').clear().type('6');
    cy.get('[data-cy=score-input-b]').clear().type('0');
    cy.wait('@liveScoreUpdate');

    // All controls should be disabled
    cy.get('[data-cy=score-input-a]').should('be.disabled');
    cy.get('[data-cy=score-input-b]').should('be.disabled');
    cy.get('[data-cy=increment-score-a]').should('be.disabled');
    cy.get('[data-cy=increment-score-b]').should('be.disabled');
    cy.get('[data-cy=decrement-score-a]').should('be.disabled');
    cy.get('[data-cy=decrement-score-b]').should('be.disabled');
    cy.get('[data-cy=reset-scores-btn]').should('not.exist');
  });

  it('should handle rapid score changes with signals', () => {
    // Rapidly increment scores
    for (let i = 0; i < 3; i++) {
      cy.get('[data-cy=increment-score-a]').click();
      cy.get('[data-cy=increment-score-b]').click();
    }
    
    cy.wait('@liveScoreUpdate');

    // Final scores should be reflected correctly
    cy.get('[data-cy=score-display-a]').should('contain', '3');
    cy.get('[data-cy=score-display-b]').should('contain', '3');
  });

  it('should validate score input boundaries', () => {
    // Test maximum score input
    cy.get('[data-cy=score-input-a]').clear().type('25');
    cy.wait('@liveScoreUpdate');
    
    // Should be clamped to 20
    cy.get('[data-cy=score-display-a]').should('contain', '20');

    // Test negative score input
    cy.get('[data-cy=score-input-b]').clear().type('-5');
    cy.wait('@liveScoreUpdate');
    
    // Should be clamped to 0
    cy.get('[data-cy=score-display-b]').should('contain', '0');
  });

  it('should prevent decrementing below zero', () => {
    // Try to decrement from 0
    cy.get('[data-cy=decrement-score-a]').should('be.disabled');
    cy.get('[data-cy=decrement-score-b]').should('be.disabled');

    // Add a point then decrement
    cy.get('[data-cy=increment-score-a]').click();
    cy.wait('@liveScoreUpdate');
    
    cy.get('[data-cy=decrement-score-a]').should('be.enabled').click();
    cy.wait('@liveScoreUpdate');
    
    // Should be back to 0 and decrement disabled again
    cy.get('[data-cy=score-display-a]').should('contain', '0');
    cy.get('[data-cy=decrement-score-a]').should('be.disabled');
  });

  it('should reset scores correctly via signals', () => {
    // Add some scores
    cy.get('[data-cy=increment-score-a]').click().click();
    cy.get('[data-cy=increment-score-b]').click();
    cy.wait('@liveScoreUpdate');

    // Reset
    cy.get('[data-cy=reset-scores-btn]').click();
    cy.wait('@liveScoreUpdate');

    // Scores should be back to 0
    cy.get('[data-cy=score-display-a]').should('contain', '0');
    cy.get('[data-cy=score-display-b]').should('contain', '0');
    cy.get('[data-cy=progress-percentage]').should('contain', '0%');
  });

  it('should show winner/loser computed signals correctly', () => {
    // Complete match with John Doe winning
    cy.get('[data-cy=score-input-a]').clear().type('6');
    cy.get('[data-cy=score-input-b]').clear().type('3');
    cy.wait('@liveScoreUpdate');

    // Winner should be highlighted
    cy.get('[data-cy=participant-a]').should('have.class', 'winner');
    cy.get('[data-cy=participant-b]').should('not.have.class', 'winner');
    
    // Winner icon should appear
    cy.get('[data-cy=participant-a]').find('[data-cy=winner-icon]').should('be.visible');
    cy.get('[data-cy=participant-b]').find('[data-cy=winner-icon]').should('not.exist');
  });
});