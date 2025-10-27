import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideApollo } from 'apollo-angular';
import { InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';

import { routes } from './app.routes';
import { tournamentReducer } from './store/tournament.reducer';
import { TournamentEffects } from './store/tournament.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideStore({ tournament: tournamentReducer }),
    provideEffects([TournamentEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
      connectInZone: true
    }),
    provideApollo(() => {
      const httpLink = inject(HttpLink);

      // Create auth link to add authorization header
      const authLink = setContext((_, { headers }) => {
        // Get token from localStorage
        const token = typeof localStorage !== 'undefined'
          ? localStorage.getItem('bracketace_token')
          : null;

        // Return headers with authorization token
        return {
          headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
          }
        };
      });

      const link = authLink.concat(
        httpLink.create({
          uri: 'http://localhost:3001/graphql',
        })
      );

      return {
        link,
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            errorPolicy: 'all',
          },
          query: {
            errorPolicy: 'all',
          },
        },
      };
    }),
  ]
};
