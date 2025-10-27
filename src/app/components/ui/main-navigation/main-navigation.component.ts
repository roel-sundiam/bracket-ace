import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../graphql/types';
import { ButtonComponent } from '../button/button.component';

export interface NavigationItem {
  label: string;
  route?: string;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
  roles?: string[];
  children?: NavigationItem[];
}

@Component({
  selector: 'app-main-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <nav class="bg-white shadow-lg border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center">
              <button 
                (click)="navigateHome()"
                class="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
                <span class="text-2xl">🎾</span>
                <div class="hidden sm:block">
                  <span class="text-xl font-bold">BracketAce</span>
                  <span class="text-xs text-gray-500 block">Tournament Manager</span>
                </div>
              </button>
            </div>

            <!-- Main Navigation -->
            @if (isAuthenticated()) {
              <div class="hidden md:ml-8 md:flex md:items-center md:space-x-4">
                @for (item of visibleNavigationItems(); track item.label) {
                  @if (item.children && item.children.length > 0) {
                    <!-- Dropdown Menu -->
                    <div class="relative group">
                      <button
                        class="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        [class.text-blue-600]="item.active"
                        [class.bg-blue-50]="item.active">
                        @if (item.icon) {
                          <span class="text-lg">{{ item.icon }}</span>
                        }
                        <span>{{ item.label }}</span>
                        <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      <!-- Dropdown Content -->
                      <div class="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div class="py-1">
                          @for (child of item.children; track child.label) {
                            @if (hasRequiredRole(child.roles)) {
                              <a
                                [routerLink]="child.route"
                                class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                [class.text-blue-600]="child.active"
                                [class.bg-blue-50]="child.active">
                                @if (child.icon) {
                                  <span class="text-lg">{{ child.icon }}</span>
                                }
                                <span>{{ child.label }}</span>
                              </a>
                            }
                          }
                        </div>
                      </div>
                    </div>
                  } @else {
                    <!-- Regular Menu Item -->
                    <a
                      [routerLink]="item.route"
                      class="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      [class.text-blue-600]="item.active"
                      [class.bg-blue-50]="item.active">
                      @if (item.icon) {
                        <span class="text-lg">{{ item.icon }}</span>
                      }
                      <span>{{ item.label }}</span>
                    </a>
                  }
                }
              </div>
            }
          </div>

          <!-- Right side - User menu or login -->
          <div class="flex items-center space-x-4">
            @if (isAuthenticated()) {
              <!-- User Dropdown -->
              <div class="relative group">
                <button
                  class="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-blue-600">
                      {{ getUserInitials() }}
                    </span>
                  </div>
                  <span class="hidden md:block">{{ getUserDisplayName() }}</span>
                  <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                <!-- User Dropdown Content -->
                <div class="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div class="py-1">
                    <div class="px-4 py-2 border-b border-gray-100">
                      <p class="text-sm font-medium text-gray-900">{{ getUserDisplayName() }}</p>
                      <p class="text-xs text-gray-500">{{ getUserRole() }}</p>
                    </div>
                    
                    <a
                      routerLink="/profile"
                      class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <span>👤</span>
                      <span>Profile</span>
                    </a>
                    
                    <a
                      routerLink="/settings"
                      class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </a>
                    
                    <div class="border-t border-gray-100">
                      <button
                        (click)="logout()"
                        class="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <span>🚪</span>
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Login/Register Buttons -->
              <div class="flex items-center space-x-2">
                <app-button
                  routerLink="/login"
                  variant="outline"
                  size="sm">
                  Sign In
                </app-button>
                <app-button
                  routerLink="/register"
                  variant="primary"
                  size="sm">
                  Sign Up
                </app-button>
              </div>
            }

            <!-- Mobile menu button -->
            <button
              (click)="toggleMobileMenu()"
              class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              [attr.aria-expanded]="showMobileMenu()">
              <span class="sr-only">Open main menu</span>
              @if (!showMobileMenu()) {
                <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              } @else {
                <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              }
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        @if (showMobileMenu()) {
          <div class="md:hidden">
            <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              @if (isAuthenticated()) {
                @for (item of visibleNavigationItems(); track item.label) {
                  @if (item.children && item.children.length > 0) {
                    <!-- Mobile Dropdown -->
                    <div class="space-y-1">
                      <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {{ item.label }}
                      </div>
                      @for (child of item.children; track child.label) {
                        @if (hasRequiredRole(child.roles)) {
                          <a
                            [routerLink]="child.route"
                            (click)="closeMobileMenu()"
                            class="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                            [class.text-blue-600]="child.active"
                            [class.bg-blue-50]="child.active">
                            @if (child.icon) {
                              <span class="text-lg">{{ child.icon }}</span>
                            }
                            <span>{{ child.label }}</span>
                          </a>
                        }
                      }
                    </div>
                  } @else {
                    <a
                      [routerLink]="item.route"
                      (click)="closeMobileMenu()"
                      class="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      [class.text-blue-600]="item.active"
                      [class.bg-blue-50]="item.active">
                      @if (item.icon) {
                        <span class="text-lg">{{ item.icon }}</span>
                      }
                      <span>{{ item.label }}</span>
                    </a>
                  }
                }
              }
              
              @if (!isAuthenticated()) {
                <a
                  routerLink="/login"
                  (click)="closeMobileMenu()"
                  class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Sign In
                </a>
                <a
                  routerLink="/register"
                  (click)="closeMobileMenu()"
                  class="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  Sign Up
                </a>
              } @else {
                <div class="border-t border-gray-200 pt-4">
                  <button
                    (click)="logout()"
                    class="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    <span>🚪</span>
                    <span>Sign out</span>
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </nav>
  `
})
export class MainNavigationComponent implements OnInit {
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  showMobileMenu = signal(false);

  private navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: '🏠'
    },
    {
      label: 'Tournaments',
      icon: '🏆',
      children: [
        { label: 'All Tournaments', route: '/tournaments', icon: '📋' },
        { label: 'Create Tournament', route: '/tournaments/create', icon: '➕', roles: ['superadmin', 'club_admin'] },
        { label: 'Quick Tournaments', route: '/tournaments/quick-list', icon: '⚡', roles: ['superadmin', 'club_admin'] },
        { label: 'My Tournaments', route: '/tournaments/my', icon: '👤' }
      ]
    },
    {
      label: 'Clubs',
      icon: '🏛️',
      children: [
        { label: 'Club Directory', route: '/clubs', icon: '📁' },
        { label: 'My Clubs', route: '/clubs/my', icon: '👥' },
        { label: 'Request New Club', route: '/clubs/request', icon: '✨' },
        { label: 'My Club Requests', route: '/clubs/my-requests', icon: '📝' },
        { label: 'Club Dashboard', route: '/club/dashboard', icon: '📊', roles: ['club_admin'] },
        { label: 'Create Club', route: '/clubs/create', icon: '➕', roles: ['superadmin'] }
      ]
    },
    {
      label: 'Admin',
      icon: '⚙️',
      roles: ['superadmin'],
      children: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: '📊' },
        { label: 'User Management', route: '/admin/users', icon: '👤' },
        { label: 'Club Requests', route: '/admin/club-requests', icon: '📋' },
        { label: 'Club Management', route: '/admin/clubs', icon: '🏛️' },
        { label: 'System Settings', route: '/admin/settings', icon: '⚙️' }
      ]
    }
  ];

  visibleNavigationItems = computed(() => {
    return this.navigationItems.filter(item => 
      this.hasRequiredRole(item.roles)
    );
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });

    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated.set(isAuth);
    });
  }

  navigateHome(): void {
    if (this.isAuthenticated()) {
      const role = this.currentUser()?.role;
      switch (role) {
        case 'superadmin':
          this.router.navigate(['/admin/dashboard']);
          break;
        case 'club_admin':
          this.router.navigate(['/club/dashboard']);
          break;
        default:
          this.router.navigate(['/dashboard']);
          break;
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  hasRequiredRole(roles?: string[]): boolean {
    if (!roles || roles.length === 0) {
      return true; // No role restriction
    }
    
    const userRole = this.currentUser()?.role;
    return !!userRole && roles.includes(userRole);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'User';
    
    return `${user.firstName} ${user.lastName}`;
  }

  getUserRole(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    
    switch (user.role) {
      case 'superadmin':
        return 'Super Admin';
      case 'club_admin':
        return 'Club Admin';
      case 'member':
        return 'Member';
      default:
        return 'User';
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(value => !value);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }
}