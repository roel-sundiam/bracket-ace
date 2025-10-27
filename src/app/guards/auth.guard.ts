import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(route);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.canActivate(route, state);
  }

  private checkAuth(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRoles = route.data?.['roles'] as string[];
    const requireAuth = route.data?.['requireAuth'] !== false; // Default to true

    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        // If no authentication required, allow access
        if (!requireAuth) {
          return true;
        }

        // If authentication required but user not authenticated, redirect to login
        if (!isAuthenticated) {
          this.router.navigate(['/login']);
          return false;
        }

        // If no specific roles required, allow access to authenticated users
        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        // Check if user has required role
        const hasRequiredRole = this.authService.hasRole(requiredRoles);
        if (!hasRequiredRole) {
          // Redirect to unauthorized page or dashboard based on user role
          this.redirectBasedOnRole();
          return false;
        }

        return true;
      })
    );
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.currentUser;
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.role) {
      case 'superadmin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'club_admin':
        this.router.navigate(['/club/dashboard']);
        break;
      case 'member':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }
}