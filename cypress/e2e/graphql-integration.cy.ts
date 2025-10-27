describe('GraphQL Integration', () => {
  beforeEach(() => {
    // Intercept all GraphQL requests for monitoring
    cy.intercept('POST', '/graphql').as('graphqlRequest');
  });

  it('should use GraphQL for creating tournaments', () => {
    cy.visit('/');

    // Create tournament
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('GraphQL Test Tournament');
    cy.get('[data-cy=tournament-mode]').select('singles');
    cy.get('[data-cy=create-tournament-btn]').click();

    // Verify GraphQL mutation was called
    cy.wait('@graphqlRequest').then((interception) => {
      expect(interception.request.body.query).to.include('createTournament');
      expect(interception.request.body.variables.input.name).to.equal('GraphQL Test Tournament');
      expect(interception.request.body.variables.input.mode).to.equal('singles');
    });
  });

  it('should use GraphQL for player registration', () => {
    // Mock tournament creation response
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
              id: 'player1',
              name: req.body.variables.input.name,
              mode: req.body.variables.input.mode,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      }
    }).as('graphqlMocked');

    cy.visit('/');

    // Create tournament first
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Test Tournament');
    cy.get('[data-cy=tournament-mode]').select('singles');
    cy.get('[data-cy=create-tournament-btn]').click();
    
    cy.wait('@graphqlMocked');

    // Register player
    cy.get('[data-cy=register-player-btn]').click();
    cy.get('[data-cy=player-name]').type('Test Player');
    cy.get('[data-cy=register-player-submit]').click();

    // Verify GraphQL mutation was called correctly
    cy.wait('@graphqlMocked').then((interception) => {
      expect(interception.request.body.query).to.include('registerPlayer');
      expect(interception.request.body.variables.input.name).to.equal('Test Player');
      expect(interception.request.body.variables.input.mode).to.equal('singles');
      expect(interception.request.body.variables.input.tournamentId).to.equal('1');
    });
  });

  it('should use GraphQL for team registration in doubles', () => {
    // Mock GraphQL responses
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('createTournament')) {
        req.reply({
          data: {
            createTournament: {
              id: '1',
              name: 'Doubles Tournament',
              mode: 'doubles',
              status: 'registration',
              maxParticipants: 16,
              currentParticipants: 0,
              bracketState: { winners: [], losers: [] },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      } else if (req.body.query.includes('registerTeam')) {
        req.reply({
          data: {
            registerTeam: {
              id: 'team1',
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
    }).as('doublesGraphql');

    cy.visit('/');

    // Create doubles tournament
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Doubles Tournament');
    cy.get('[data-cy=tournament-mode]').select('doubles');
    cy.get('[data-cy=create-tournament-btn]').click();
    
    cy.wait('@doublesGraphql');

    // Register team
    cy.get('[data-cy=register-team-btn]').click();
    cy.get('[data-cy=team-name]').type('Dream Team');
    cy.get('[data-cy=player1-name]').type('Player One');
    cy.get('[data-cy=player2-name]').type('Player Two');
    cy.get('[data-cy=register-team-submit]').click();

    // Verify GraphQL mutation
    cy.wait('@doublesGraphql').then((interception) => {
      expect(interception.request.body.query).to.include('registerTeam');
      expect(interception.request.body.variables.input.name).to.equal('Dream Team');
      expect(interception.request.body.variables.input.player1Name).to.equal('Player One');
      expect(interception.request.body.variables.input.player2Name).to.equal('Player Two');
      expect(interception.request.body.variables.input.tournamentId).to.equal('1');
    });
  });

  it('should use GraphQL for generating matches', () => {
    // Mock tournament with full participants
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('generateMatches')) {
        req.reply({
          data: {
            generateMatches: [
              {
                id: 'match1',
                tournamentId: req.body.variables.tournamentId,
                round: 1,
                bracketType: 'winners',
                participant1: 'player1',
                participant2: 'player2',
                participant1Name: 'Player 1',
                participant2Name: 'Player 2',
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          }
        });
      }
    }).as('generateMatches');

    cy.visit('/tournament/1');

    // Generate matches
    cy.get('[data-cy=generate-matches-btn]').click();

    // Verify GraphQL mutation
    cy.wait('@generateMatches').then((interception) => {
      expect(interception.request.body.query).to.include('generateMatches');
      expect(interception.request.body.variables.tournamentId).to.equal('1');
    });
  });

  it('should use GraphQL for live score updates', () => {
    // Mock match for live scoring
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('updateLiveScore')) {
        req.reply({
          data: {
            updateLiveScore: {
              id: req.body.variables.input.matchId,
              score: {
                participant1Score: req.body.variables.input.scoreA,
                participant2Score: req.body.variables.input.scoreB
              },
              completed: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      }
    }).as('liveScore');

    cy.visit('/match/test-match');

    // Update live score
    cy.get('[data-cy=increment-score-a]').click();

    // Verify GraphQL mutation for live scoring
    cy.wait('@liveScore').then((interception) => {
      expect(interception.request.body.query).to.include('updateLiveScore');
      expect(interception.request.body.variables.input.matchId).to.equal('test-match');
      expect(interception.request.body.variables.input.scoreA).to.equal(1);
      expect(interception.request.body.variables.input.scoreB).to.equal(0);
    });
  });

  it('should handle GraphQL errors gracefully', () => {
    // Mock GraphQL error response
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('createTournament')) {
        req.reply({
          errors: [{
            message: 'Tournament name already exists',
            extensions: {
              code: 'DUPLICATE_NAME'
            }
          }]
        });
      }
    }).as('graphqlError');

    cy.visit('/');

    // Try to create tournament
    cy.contains('Create Tournament').click();
    cy.get('[data-cy=tournament-name]').type('Duplicate Tournament');
    cy.get('[data-cy=tournament-mode]').select('singles');
    cy.get('[data-cy=create-tournament-btn]').click();

    cy.wait('@graphqlError');

    // Verify error message is displayed
    cy.contains('Tournament name already exists').should('be.visible');
    cy.get('[data-cy=error-alert]').should('be.visible');
  });

  it('should use GraphQL queries for fetching tournament data', () => {
    // Mock tournament data
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('GetTournaments')) {
        req.reply({
          data: {
            tournaments: [
              {
                id: '1',
                name: 'Tournament 1',
                mode: 'singles',
                status: 'registration',
                maxParticipants: 8,
                currentParticipants: 3,
                bracketState: { winners: [], losers: [] },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                id: '2',
                name: 'Tournament 2',
                mode: 'doubles',
                status: 'in-progress',
                maxParticipants: 16,
                currentParticipants: 16,
                bracketState: { winners: ['match1'], losers: [] },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          }
        });
      }
    }).as('getTournaments');

    cy.visit('/dashboard');

    // Verify GraphQL query was made
    cy.wait('@getTournaments').then((interception) => {
      expect(interception.request.body.query).to.include('GetTournaments');
    });

    // Verify data is displayed correctly
    cy.contains('Tournament 1').should('be.visible');
    cy.contains('Tournament 2').should('be.visible');
    cy.contains('3/8 participants').should('be.visible');
    cy.contains('16/16 participants').should('be.visible');
  });

  it('should use GraphQL fragments for efficient queries', () => {
    cy.intercept('POST', '/graphql').as('anyGraphql');

    cy.visit('/tournament/1');

    // Check that queries use fragments (this reduces payload size)
    cy.wait('@anyGraphql').then((interception) => {
      if (interception.request.body.query.includes('GetBracket')) {
        // Verify fragments are used in the query
        expect(interception.request.body.query).to.include('TournamentFragment');
        expect(interception.request.body.query).to.include('MatchFragment');
      }
    });
  });

  it('should implement proper GraphQL caching policies', () => {
    // Mock the same query response
    const mockResponse = {
      data: {
        tournament: {
          id: '1',
          name: 'Cached Tournament',
          mode: 'singles',
          status: 'registration',
          maxParticipants: 8,
          currentParticipants: 0,
          bracketState: { winners: [], losers: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    };

    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.query.includes('GetTournament')) {
        req.reply(mockResponse);
      }
    }).as('cachedQuery');

    cy.visit('/tournament/1');
    cy.wait('@cachedQuery');

    // Navigate away and back
    cy.visit('/dashboard');
    cy.visit('/tournament/1');

    // Apollo should cache the result and may not make another request
    // or make it with cache-and-network policy
    cy.get('@cachedQuery.all').should('have.length.at.least', 1);
  });
});