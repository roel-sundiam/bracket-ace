import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4204',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      graphqlUrl: 'http://localhost:3001/graphql'
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },

        async clearTestData() {
          // GraphQL mutations to clear test data
          const graphqlUrl = config.env.graphqlUrl || 'http://localhost:3001/graphql';

          try {
            // This would connect to your backend and clear test data
            // For now, returning null to indicate task completion
            console.log('Clearing test data...');
            return null;
          } catch (error) {
            console.error('Failed to clear test data:', error);
            return null;
          }
        },

        async promoteToSuperadmin({ email }: { email: string }) {
          // GraphQL mutation to promote user to superadmin
          const graphqlUrl = config.env.graphqlUrl || 'http://localhost:3001/graphql';

          try {
            const mutation = `
              mutation PromoteToSuperadmin($email: String!) {
                promoteToSuperadmin(email: $email) {
                  id
                  email
                  role
                }
              }
            `;

            // This would call your GraphQL API
            // For now, you'll need to implement the promoteToSuperadmin mutation in your backend
            console.log(`Promoting ${email} to superadmin...`);

            // Example fetch call (uncomment when mutation is ready):
            /*
            const response = await fetch(graphqlUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: mutation,
                variables: { email }
              })
            });
            const data = await response.json();
            return data.data.promoteToSuperadmin;
            */

            return null;
          } catch (error) {
            console.error('Failed to promote user:', error);
            return null;
          }
        }
      });
    },
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts'
  }
})