describe('Club Request and Approval Flow', () => {
  const timestamp = Date.now();

  const regularUser = {
    email: `regularuser${timestamp}@test.com`,
    password: 'password123',
    firstName: 'Regular',
    lastName: 'User'
  };

  const superAdmin = {
    email: 'sundiamr@aol.com', // Use existing superadmin account
    password: 'your_password_here' // Update with actual password
  };

  const clubRequest = {
    name: `Test Tennis Club ${timestamp}`,
    description: 'A test club for Cypress testing'
  };

  // Note: You'll need to manually set sundiamr@aol.com as superadmin in the database first
  // Or use an existing superadmin account

  it('should allow regular user to request a club and superadmin to approve it', () => {
    // Step 1: Register regular user
    cy.visit('/register');
    cy.get('input[name="email"]').type(regularUser.email);
    cy.get('input[name="password"]').type(regularUser.password);
    cy.get('input[name="firstName"]').type(regularUser.firstName);
    cy.get('input[name="lastName"]').type(regularUser.lastName);
    cy.get('button[type="submit"]').click();

    // Verify registration successful and redirected to dashboard
    cy.url().should('include', '/dashboard');

    // Verify user is a regular member
    cy.window().its('localStorage.bracketace_token').should('exist');

    // Step 2: Regular user requests a club
    cy.visit('/clubs/request');
    cy.get('input#name').type(clubRequest.name);
    cy.get('textarea#description').type(clubRequest.description);
    cy.get('button[type="submit"]').click();

    // Verify success message
    cy.contains('Club creation request submitted successfully').should('be.visible');

    // Wait for redirect to my-requests page
    cy.url().should('include', '/clubs/my-requests', { timeout: 3000 });

    // Logout regular user
    cy.get('[aria-label="User profile"]').click(); // Open user menu
    cy.contains('Sign out').click();

    // Step 3: Login as superadmin (must already exist in database)
    cy.visit('/login');
    cy.get('input[name="email"]').type(superAdmin.email);
    cy.get('input[name="password"]').type(superAdmin.password);
    cy.get('button[type="submit"]').click();

    // Step 4: Superadmin navigates to club requests
    cy.get('[aria-label="Admin"]').should('be.visible').trigger('mouseover');
    cy.contains('Club Requests').click();

    // Verify club request is visible
    cy.contains(clubRequest.name).should('be.visible');
    cy.contains(regularUser.email).should('be.visible');
    cy.contains('pending').should('be.visible');

    // Step 5: Superadmin approves the club request
    cy.contains(clubRequest.name)
      .parents('tr')
      .find('button')
      .contains('Approve')
      .click();

    // Confirm approval dialog
    cy.on('window:confirm', () => true);

    // Verify success message
    cy.contains(`Club "${clubRequest.name}" has been created successfully`, { timeout: 10000 })
      .should('be.visible');

    // Verify the request status changed to 'approved'
    cy.contains(clubRequest.name)
      .parents('tr')
      .should('contain', 'approved');

    // Logout superadmin
    cy.get('[aria-label="User profile"]').click();
    cy.contains('Sign out').click();

    // Step 6: Login as regular user again and verify they are now club admin
    cy.visit('/login');
    cy.get('input[name="email"]').type(regularUser.email);
    cy.get('input[name="password"]').type(regularUser.password);
    cy.get('button[type="submit"]').click();

    // Verify user can now see Club Admin features
    cy.url().should('include', '/dashboard');

    // Check if user role is displayed as Club Admin
    cy.get('[aria-label="User profile"]').click();
    cy.contains('Club Admin').should('be.visible');

    // Verify "Create Tournament" option is now available in navigation
    cy.contains('Tournaments').trigger('mouseover');
    cy.contains('Create Tournament').should('be.visible');

    // Verify Club Dashboard is accessible
    cy.contains('Clubs').trigger('mouseover');
    cy.contains('Club Dashboard').should('be.visible').click();

    // Verify they're on the club dashboard
    cy.url().should('include', '/club/dashboard');

    // Verify the club they requested is now managed by them
    cy.contains(clubRequest.name).should('be.visible');
  });

  it('should verify only the requesting user becomes club admin, not others', () => {
    const anotherUser = {
      email: 'anotheruser@test.com',
      password: 'password123',
      firstName: 'Another',
      lastName: 'User'
    };

    // Register another user
    cy.visit('/register');
    cy.get('input[name="email"]').type(anotherUser.email);
    cy.get('input[name="password"]').type(anotherUser.password);
    cy.get('input[name="firstName"]').type(anotherUser.firstName);
    cy.get('input[name="lastName"]').type(anotherUser.lastName);
    cy.get('button[type="submit"]').click();

    // Verify they are still a regular member
    cy.get('[aria-label="User profile"]').click();
    cy.contains('Member').should('be.visible');

    // Verify they don't have Club Admin features
    cy.contains('Tournaments').trigger('mouseover');
    cy.contains('Create Tournament').should('not.exist');

    // Verify they can't access Club Dashboard
    cy.visit('/club/dashboard');
    // Should be redirected or show unauthorized message
    cy.url().should('not.include', '/club/dashboard');
  });

  // Note: Manual cleanup may be needed in the database after running this test
});
