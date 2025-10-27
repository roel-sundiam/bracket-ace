import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';

import { ContainerComponent } from '../../ui/layout/container/container.component';
import { CardComponent } from '../../ui/card/card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { SpinnerComponent } from '../../ui/loading/spinner/spinner.component';

import { USERS_QUERY } from '../../../graphql/auth.graphql';
import { User } from '../../../graphql/types';

interface DashboardStats {
  totalUsers: number;
  totalClubs: number;
  totalTournaments: number;
  recentUsers: User[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ContainerComponent,
    CardComponent,
    ButtonComponent,
    SpinnerComponent
  ],
  template: `
    <app-container>
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <h1 class="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p class="text-blue-100">Manage users, clubs, and system settings</p>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <app-card>
            <div class="text-center p-4">
              <div class="text-3xl mb-2">👥</div>
              <h3 class="font-semibold mb-2">User Management</h3>
              <p class="text-gray-600 text-sm mb-4">View and manage all users</p>
              <app-button
                variant="primary"
                (click)="navigateToUsers()"
                class="w-full">
                Manage Users
              </app-button>
            </div>
          </app-card>

          <app-card>
            <div class="text-center p-4">
              <div class="text-3xl mb-2">🏛️</div>
              <h3 class="font-semibold mb-2">Club Management</h3>
              <p class="text-gray-600 text-sm mb-4">Oversee all tennis clubs</p>
              <app-button
                variant="primary"
                (click)="navigateToClubs()"
                class="w-full">
                Manage Clubs
              </app-button>
            </div>
          </app-card>

          <app-card>
            <div class="text-center p-4">
              <div class="text-3xl mb-2">⚙️</div>
              <h3 class="font-semibold mb-2">System Settings</h3>
              <p class="text-gray-600 text-sm mb-4">Configure system options</p>
              <app-button
                variant="primary"
                (click)="navigateToSettings()"
                class="w-full">
                Settings
              </app-button>
            </div>
          </app-card>
        </div>

        <!-- Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4" *ngIf="stats$ | async as stats">
          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-blue-600">{{ stats.totalUsers }}</div>
              <div class="text-gray-600">Total Users</div>
            </div>
          </app-card>

          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-green-600">{{ stats.totalClubs }}</div>
              <div class="text-gray-600">Active Clubs</div>
            </div>
          </app-card>

          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-purple-600">{{ stats.totalTournaments }}</div>
              <div class="text-gray-600">Tournaments</div>
            </div>
          </app-card>

          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-orange-600">{{ (stats.recentUsers || []).length }}</div>
              <div class="text-gray-600">Recent Users</div>
            </div>
          </app-card>
        </div>

        <!-- Recent Users -->
        <app-card>
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Recent Users</h2>
              <app-button
                variant="outline"
                (click)="navigateToUsers()">
                View All
              </app-button>
            </div>

            <ng-container *ngIf="stats$ | async as stats; else loadingUsers">
              <div *ngIf="stats.recentUsers.length === 0"
                   class="text-center py-8 text-gray-500">
                No users found
              </div>

              <div *ngIf="stats.recentUsers.length > 0"
                   class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-2">Name</th>
                      <th class="text-left py-2">Email</th>
                      <th class="text-left py-2">Role</th>
                      <th class="text-left py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let user of stats.recentUsers" class="border-b">
                      <td class="py-2">{{ user.firstName }} {{ user.lastName }}</td>
                      <td class="py-2">{{ user.email }}</td>
                      <td class="py-2">
                        <span class="px-2 py-1 text-xs rounded-full"
                              [ngClass]="{
                                'bg-red-100 text-red-800': user.role === 'superadmin',
                                'bg-blue-100 text-blue-800': user.role === 'club_admin',
                                'bg-gray-100 text-gray-800': user.role === 'member'
                              }">
                          {{ user.role }}
                        </span>
                      </td>
                      <td class="py-2">{{ user.createdAt | date:'short' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ng-container>

            <ng-template #loadingUsers>
              <div *ngIf="loading$ | async" class="flex justify-center py-8">
                <app-spinner></app-spinner>
              </div>
            </ng-template>
          </div>
        </app-card>
      </div>
    </app-container>
  `
})
export class AdminDashboardComponent implements OnInit {
  stats$!: Observable<DashboardStats>;
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  constructor(
    private apollo: Apollo,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.loadingSubject.next(true);
    
    this.stats$ = this.apollo.query<{ users: User[] }>({
      query: USERS_QUERY,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => {
        const users = result.data?.users || [];
        this.loadingSubject.next(false);
        
        return {
          totalUsers: users.length,
          totalClubs: 0, // TODO: Add clubs query when available
          totalTournaments: 0, // TODO: Add tournaments query when available
          recentUsers: [...users]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        };
      })
    );
  }

  navigateToUsers() {
    this.router.navigate(['/admin/users']);
  }

  navigateToClubs() {
    this.router.navigate(['/admin/clubs']);
  }

  navigateToSettings() {
    this.router.navigate(['/admin/settings']);
  }
}