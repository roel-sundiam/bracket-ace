import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '../graphql/auth.graphql';
import { 
  User, 
  LoginInput, 
  RegisterInput, 
  LoginResponse, 
  RegisterResponse, 
  MeResponse,
  AuthPayload 
} from '../graphql/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'bracketace_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apollo: Apollo,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          if (user) {
            this.setAuthState(user, true);
          } else {
            this.logout();
          }
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  login(credentials: LoginInput): Observable<AuthPayload> {
    return this.apollo.mutate<LoginResponse>({
      mutation: LOGIN_MUTATION,
      variables: { input: credentials }
    }).pipe(
      map(result => {
        if (!result.data?.login) {
          throw new Error('Login failed');
        }
        return result.data.login;
      }),
      tap(authPayload => {
        this.setToken(authPayload.token);
        this.setAuthState(authPayload.user, true);
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  register(userData: RegisterInput): Observable<AuthPayload> {
    return this.apollo.mutate<RegisterResponse>({
      mutation: REGISTER_MUTATION,
      variables: { input: userData }
    }).pipe(
      map(result => {
        if (!result.data?.register) {
          throw new Error('Registration failed');
        }
        return result.data.register;
      }),
      tap(authPayload => {
        this.setToken(authPayload.token);
        this.setAuthState(authPayload.user, true);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    this.removeToken();
    this.setAuthState(null, false);
    this.apollo.client.clearStore();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User | null> {
    return this.apollo.query<MeResponse>({
      query: ME_QUERY,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data?.me || null),
      catchError(() => of(null))
    );
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private removeToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  private setAuthState(user: User | null, isAuthenticated: boolean): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(isAuthenticated);
  }

  // Helper methods for role checking
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'superadmin';
  }

  isClubAdmin(): boolean {
    return this.currentUser?.role === 'club_admin' || this.isSuperAdmin();
  }

  isMember(): boolean {
    return this.currentUser?.role === 'member';
  }

  hasRole(roles: string[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.role);
  }

  // Get authorization header for HTTP requests
  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}