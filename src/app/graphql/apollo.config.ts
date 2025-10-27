import { ApplicationConfig, inject } from '@angular/core';
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { ApolloClientOptions, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { AuthService } from '../services/auth.service';

const uri = 'http://localhost:3001/graphql'; // GraphQL endpoint

export function apolloOptionsFactory(): ApolloClientOptions<any> {
  // Create the HTTP link
  const httpLink = createHttpLink({
    uri
  });

  // Create auth link that adds the authorization header
  const authLink = setContext((_, { headers }) => {
    // Get the authentication token from local storage if it exists
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bracketace_token') : null;
    
    // Return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
  });

  // Error handling link
  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
        
        // Handle authentication errors
        if (message.includes('Authentication required') || message.includes('Invalid token')) {
          // Clear invalid token and redirect to login
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('bracketace_token');
          }
          // Note: We can't inject AuthService here directly in this context
          // The AuthService will handle this in its token verification
        }
      });
    }

    if (networkError) {
      console.error(`Network error: ${networkError}`);
      
      // Handle network errors (like CORS, server down, etc.)
      if (networkError.message.includes('fetch')) {
        console.error('Network fetch error - check if the GraphQL server is running');
      }
    }
  });

  return {
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache({
      typePolicies: {
        Tournament: {
          fields: {
            participants: {
              merge(existing = [], incoming) {
                return incoming;
              }
            }
          }
        },
        Club: {
          fields: {
            members: {
              merge(existing = [], incoming) {
                return incoming;
              }
            }
          }
        },
        User: {
          fields: {
            clubs: {
              merge(existing = [], incoming) {
                return incoming;
              }
            }
          }
        }
      }
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true
      },
      query: {
        errorPolicy: 'all'
      },
      mutate: {
        errorPolicy: 'all'
      }
    },
    connectToDevTools: true // Enable Apollo DevTools in development
  };
}

export const apolloConfig = {
  provide: APOLLO_OPTIONS,
  useFactory: apolloOptionsFactory
};