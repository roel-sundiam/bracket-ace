import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ContainerComponent } from '../../ui/layout/container/container.component';
import { CardComponent } from '../../ui/card/card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/form/input/input.component';
import { SpinnerComponent } from '../../ui/loading/spinner/spinner.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ConfirmationModalComponent } from '../../ui/modal/confirmation-modal/confirmation-modal.component';

import { USERS_QUERY } from '../../../graphql/auth.graphql';
import { User } from '../../../graphql/types';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContainerComponent,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SpinnerComponent,
    ModalComponent,
    ConfirmationModalComponent
  ],
  template: `
    <app-container>
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
            <p class="text-gray-600">Manage all users in the system</p>
          </div>
          <app-button variant="primary" (click)="showCreateUserModal = true">
            Add New User
          </app-button>
        </div>

        <!-- Search and Filters -->
        <app-card>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <app-input
                placeholder="Search users..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                class="md:col-span-2">
              </app-input>
              
              <select 
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                [(ngModel)]="selectedRole"
                (ngModelChange)="onRoleFilterChange()">
                <option value="">All Roles</option>
                <option value="member">Members</option>
                <option value="club_admin">Club Admins</option>
                <option value="superadmin">Super Admins</option>
              </select>
            </div>
          </div>
        </app-card>

        <!-- User Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4" *ngIf="userStats$ | async as stats">
          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-blue-600">{{ stats.total }}</div>
              <div class="text-gray-600">Total Users</div>
            </div>
          </app-card>
          
          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-green-600">{{ stats.members }}</div>
              <div class="text-gray-600">Members</div>
            </div>
          </app-card>
          
          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-purple-600">{{ stats.clubAdmins }}</div>
              <div class="text-gray-600">Club Admins</div>
            </div>
          </app-card>
          
          <app-card>
            <div class="p-4 text-center">
              <div class="text-2xl font-bold text-red-600">{{ stats.superAdmins }}</div>
              <div class="text-gray-600">Super Admins</div>
            </div>
          </app-card>
        </div>

        <!-- Users Table -->
        <app-card>
          <div class="p-6">
            <div *ngIf="loading$ | async" class="flex justify-center py-8">
              <app-spinner></app-spinner>
            </div>

            <div *ngIf="!(loading$ | async) && (filteredUsers$ | async)?.length === 0" 
                 class="text-center py-8 text-gray-500">
              No users found
            </div>

            <div *ngIf="!(loading$ | async) && (filteredUsers$ | async) && (filteredUsers$ | async)!.length > 0" 
                 class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3">User</th>
                    <th class="text-left py-3">Email</th>
                    <th class="text-left py-3">Role</th>
                    <th class="text-left py-3">Joined</th>
                    <th class="text-left py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of filteredUsers$ | async" class="border-b hover:bg-gray-50">
                    <td class="py-3">
                      <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                        </div>
                        <div>
                          <div class="font-medium">{{ user.firstName }} {{ user.lastName }}</div>
                          <div class="text-sm text-gray-500">ID: {{ user.id }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3">{{ user.email }}</td>
                    <td class="py-3">
                      <span class="px-2 py-1 text-xs rounded-full"
                            [ngClass]="{
                              'bg-red-100 text-red-800': user.role === 'superadmin',
                              'bg-blue-100 text-blue-800': user.role === 'club_admin',
                              'bg-gray-100 text-gray-800': user.role === 'member'
                            }">
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="py-3">{{ user.createdAt | date:'short' }}</td>
                    <td class="py-3">
                      <div class="flex space-x-2">
                        <app-button
                          variant="outline"
                          size="sm"
                          (click)="editUser(user)">
                          Edit
                        </app-button>
                        <app-button
                          variant="danger"
                          size="sm"
                          (click)="openDeleteModal(user)"
                          *ngIf="user.role !== 'superadmin'">
                          Delete
                        </app-button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </app-card>

        <!-- Create User Modal -->
        <app-modal 
          [isOpen]="showCreateUserModal" 
          (close)="showCreateUserModal = false"
          title="Add New User">
          <div class="space-y-4">
            <app-input
              label="First Name"
              placeholder="Enter first name"
              [(ngModel)]="newUser.firstName">
            </app-input>
            
            <app-input
              label="Last Name"
              placeholder="Enter last name"
              [(ngModel)]="newUser.lastName">
            </app-input>
            
            <app-input
              label="Email"
              type="email"
              placeholder="Enter email address"
              [(ngModel)]="newUser.email">
            </app-input>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                [(ngModel)]="newUser.role">
                <option value="member">Member</option>
                <option value="club_admin">Club Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            
            <app-input
              label="Password"
              type="password"
              placeholder="Enter password"
              [(ngModel)]="newUser.password">
            </app-input>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <app-button variant="outline" (click)="showCreateUserModal = false">
              Cancel
            </app-button>
            <app-button variant="primary" (click)="createUser()">
              Create User
            </app-button>
          </div>
        </app-modal>

        <!-- Edit User Modal -->
        <app-modal 
          [isOpen]="showEditUserModal" 
          (close)="showEditUserModal = false"
          title="Edit User">
          <div class="space-y-4" *ngIf="editingUser">
            <app-input
              label="First Name"
              placeholder="Enter first name"
              [(ngModel)]="editingUser.firstName">
            </app-input>
            
            <app-input
              label="Last Name"
              placeholder="Enter last name"
              [(ngModel)]="editingUser.lastName">
            </app-input>
            
            <app-input
              label="Email"
              type="email"
              placeholder="Enter email address"
              [(ngModel)]="editingUser.email">
            </app-input>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                [(ngModel)]="editingUser.role">
                <option value="member">Member</option>
                <option value="club_admin">Club Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <app-button variant="outline" (click)="showEditUserModal = false">
              Cancel
            </app-button>
            <app-button variant="primary" (click)="updateUser()">
              Update User
            </app-button>
          </div>
        </app-modal>
      </div>
    </app-container>

    <!-- Delete Confirmation Modal -->
    <app-confirmation-modal [isOpen]="showDeleteModal" [title]="'Delete User'" [message]="'Are you sure you want to delete ' + (pendingDeleteUser?.firstName || '') + ' ' + (pendingDeleteUser?.lastName || '') + '? This action cannot be undone.'" [confirmText]="'Delete'" [cancelText]="'Cancel'" [variant]="'danger'" [isProcessing]="isDeleting" (confirm)="confirmDeleteUser()" (cancel)="closeDeleteModal()"></app-confirmation-modal>
  `
})
export class UserManagementComponent implements OnInit {
  users$!: Observable<User[]>;
  filteredUsers$!: Observable<User[]>;
  userStats$!: Observable<{total: number; members: number; clubAdmins: number; superAdmins: number}>;
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  searchTerm = '';
  selectedRole = '';

  showCreateUserModal = false;
  showEditUserModal = false;
  showDeleteModal = false;
  pendingDeleteUser: User | null = null;
  isDeleting = false;

  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'member',
    password: ''
  };

  editingUser: User | null = null;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.loadingSubject.next(true);
    
    this.users$ = this.apollo.query<{ users: User[] }>({
      query: USERS_QUERY,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => {
        this.loadingSubject.next(false);
        return result.data?.users || [];
      })
    );

    this.filteredUsers$ = this.users$;

    this.userStats$ = this.users$.pipe(
      map(users => ({
        total: users.length,
        members: users.filter(u => u.role === 'member').length,
        clubAdmins: users.filter(u => u.role === 'club_admin').length,
        superAdmins: users.filter(u => u.role === 'superadmin').length
      }))
    );
  }

  onSearchChange() {
    this.applyFilters();
  }

  onRoleFilterChange() {
    this.applyFilters();
  }

  private applyFilters() {
    this.filteredUsers$ = this.users$.pipe(
      map(users => {
        return users.filter(user => {
          const matchesSearch = !this.searchTerm || 
            user.firstName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
          
          const matchesRole = !this.selectedRole || user.role === this.selectedRole;
          
          return matchesSearch && matchesRole;
        });
      })
    );
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.showEditUserModal = true;
  }

  openDeleteModal(user: User) {
    this.pendingDeleteUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.pendingDeleteUser = null;
    this.isDeleting = false;
  }

  confirmDeleteUser() {
    if (!this.pendingDeleteUser) return;

    this.isDeleting = true;
    // TODO: Implement delete user mutation
    console.log('Delete user:', this.pendingDeleteUser);

    // Simulate async operation
    setTimeout(() => {
      this.closeDeleteModal();
    }, 500);
  }

  createUser() {
    // TODO: Implement create user mutation
    console.log('Create user:', this.newUser);
    this.showCreateUserModal = false;
    this.resetNewUser();
  }

  updateUser() {
    if (this.editingUser) {
      // TODO: Implement update user mutation
      console.log('Update user:', this.editingUser);
      this.showEditUserModal = false;
      this.editingUser = null;
    }
  }

  private resetNewUser() {
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      role: 'member',
      password: ''
    };
  }
}