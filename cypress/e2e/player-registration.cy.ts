describe('Player Registration Flow', () => {
  beforeEach(() => {
    // Mock GraphQL responses
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('createTournament')) {
        req.reply({
          data: {
            createTournament: {
              id: '1',
              name: 'Test Tournament',
              mode: 'singles',
              status: 'registration',
              maxParticipants: 8,
              currentParticipants: 0,
              bracketState: { winners: [], losers: [] },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      } else if (req.body.query.includes('registerPlayer')) {
        req.reply({
          data: {
            registerPlayer: {
              id: `player-${Date.now()}`,
              name: req.body.variables.input.name,
              mode: req.body.variables.input.mode,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      } else if (req.body.query.includes('registerTeam')) {
        req.reply({
          data: {
            registerTeam: {
              id: `team-${Date.now()}`,
              name: req.body.variables.input.name,
              player1Id: 'player1',
              player2Id: 'player2',
              tournamentId: req.body.variables.input.tournamentId,
              player1: {
                id: 'player1',
                name: req.body.variables.input.player1Name,
                mode: 'doubles'
              },
              player2: {
                id: 'player2',
                name: req.body.variables.input.player2Name,
                mode: 'doubles'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      }
    }).as('graphqlRequest');

    cy.visit('/');
  });

  it('should allow creating a singles tournament and registering 8 players', () => {
    // Create a singles tournament
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Test Singles Tournament');
    cy.get('[data-cy=tournament-mode]').select('singles');
    cy.get('[data-cy=create-tournament-btn]').click();

    cy.wait('@graphqlRequest');

    // Verify tournament was created
    cy.contains('Test Singles Tournament').should('be.visible');
    cy.contains('Singles Tournament').should('be.visible');

    // Register 8 players for singles tournament
    const players = [
      'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson',
      'Tom Brown', 'Lisa Davis', 'Chris Anderson', 'Amy Taylor'
    ];

    players.forEach((playerName, index) => {
      cy.get('[data-cy=register-player-btn]').click();
      cy.get('[data-cy=player-name]').type(playerName);
      cy.get('[data-cy=register-player-submit]').click();
      
      cy.wait('@graphqlRequest');
      
      // Verify player was added to the list
      cy.contains(playerName).should('be.visible');
      
      // Check participant counter
      cy.contains(`${index + 1}/8 participants`).should('be.visible');
    });

    // Verify tournament is ready to start
    cy.get('[data-cy=start-tournament-btn]').should('be.enabled');
    cy.contains('8/8 participants').should('be.visible');
  });

  it('should allow creating a doubles tournament and registering 8 teams (16 players)', () => {
    // Create a doubles tournament
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Test Doubles Tournament');
    cy.get('[data-cy=tournament-mode]').select('doubles');
    cy.get('[data-cy=create-tournament-btn]').click();

    cy.wait('@graphqlRequest');

    // Verify tournament was created
    cy.contains('Test Doubles Tournament').should('be.visible');
    cy.contains('Doubles Tournament').should('be.visible');

    // Register 8 teams for doubles tournament
    const teams = [
      { name: 'Team Alpha', player1: 'John Doe', player2: 'Jane Smith' },
      { name: 'Team Beta', player1: 'Mike Johnson', player2: 'Sarah Wilson' },
      { name: 'Team Gamma', player1: 'Tom Brown', player2: 'Lisa Davis' },
      { name: 'Team Delta', player1: 'Chris Anderson', player2: 'Amy Taylor' },
      { name: 'Team Echo', player1: 'Mark Roberts', player2: 'Emma White' },
      { name: 'Team Foxtrot', player1: 'David Clark', player2: 'Sophie Turner' },
      { name: 'Team Golf', player1: 'James Miller', player2: 'Olivia Harris' },
      { name: 'Team Hotel', player1: 'Ryan Lee', player2: 'Grace Adams' }
    ];

    teams.forEach((team, index) => {
      cy.get('[data-cy=register-team-btn]').click();
      cy.get('[data-cy=team-name]').type(team.name);
      cy.get('[data-cy=player1-name]').type(team.player1);
      cy.get('[data-cy=player2-name]').type(team.player2);
      cy.get('[data-cy=register-team-submit]').click();
      
      cy.wait('@graphqlRequest');
      
      // Verify team was added to the list
      cy.contains(team.name).should('be.visible');
      cy.contains(team.player1).should('be.visible');
      cy.contains(team.player2).should('be.visible');
      
      // Check participant counter (doubles counts players, not teams)
      cy.contains(`${(index + 1) * 2}/16 participants`).should('be.visible');
    });

    // Verify tournament is ready to start
    cy.get('[data-cy=start-tournament-btn]').should('be.enabled');
    cy.contains('16/16 participants').should('be.visible');
  });

  it('should prevent registering more than the maximum participants', () => {
    // Create a singles tournament
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Full Tournament');
    cy.get('[data-cy=tournament-mode]').select('singles');
    cy.get('[data-cy=create-tournament-btn]').click();

    cy.wait('@graphqlRequest');

    // Mock a full tournament
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('registerPlayer')) {
        req.reply({
          errors: [{
            message: 'Tournament is full'
          }]
        });
      }
    }).as('fullTournamentRequest');

    // Try to register a player when tournament is full
    cy.get('[data-cy=register-player-btn]').click();
    cy.get('[data-cy=player-name]').type('Extra Player');
    cy.get('[data-cy=register-player-submit]').click();
    
    cy.wait('@fullTournamentRequest');
    
    // Verify error message is displayed
    cy.contains('Tournament is full').should('be.visible');
    cy.get('[data-cy=register-player-btn]').should('be.disabled');
  });

  it('should validate player registration form', () => {
    // Create a tournament first
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Validation Test');
    cy.get('[data-cy=tournament-mode]').select('singles');
    cy.get('[data-cy=create-tournament-btn]').click();

    cy.wait('@graphqlRequest');

    // Try to register with empty name
    cy.get('[data-cy=register-player-btn]').click();
    cy.get('[data-cy=register-player-submit]').click();
    
    // Verify validation error
    cy.get('[data-cy=player-name]').should('have.class', 'ng-invalid');
    cy.contains('Player name is required').should('be.visible');

    // Try to register with name too short
    cy.get('[data-cy=player-name]').type('A');
    cy.get('[data-cy=register-player-submit]').click();
    
    cy.contains('Player name must be at least 2 characters').should('be.visible');

    // Valid registration
    cy.get('[data-cy=player-name]').clear().type('Valid Player');
    cy.get('[data-cy=register-player-submit]').click();
    
    cy.wait('@graphqlRequest');
    cy.contains('Valid Player').should('be.visible');
  });

  it('should show different UI for singles vs doubles mode', () => {
    // Singles mode
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Singles Test');
    cy.get('[data-cy=tournament-mode]').select('singles');
    cy.get('[data-cy=create-tournament-btn]').click();

    cy.wait('@graphqlRequest');

    // Should show player registration UI
    cy.get('[data-cy=register-player-btn]').should('be.visible');
    cy.get('[data-cy=register-team-btn]').should('not.exist');
    cy.contains('Register Player').should('be.visible');

    // Switch to doubles mode
    cy.get('[data-cy=mode-selector]').select('doubles');

    // Should show team registration UI
    cy.get('[data-cy=register-team-btn]').should('be.visible');
    cy.get('[data-cy=register-player-btn]').should('not.exist');
    cy.contains('Register Team').should('be.visible');
  });
});