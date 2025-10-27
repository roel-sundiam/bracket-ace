import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface NavigationItem {
  label: string;
  route?: string;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navigation" [class.navigation-mobile]="isMobile">
      <!-- Main Navigation Header -->
      <div class="nav-header">
        <div class="nav-brand" (click)="onBrandClick()">
          <div class="brand-icon">
            <span class="brand-icon-text">🎾</span>
          </div>
          <div class="brand-text">
            <h1 class="brand-title">BracketAce</h1>
            <p class="brand-subtitle">Tournament Manager</p>
          </div>
        </div>
        
        <div class="nav-actions">
          <button 
            class="nav-btn nav-menu-toggle"
            (click)="toggleMobileMenu()"
            [attr.aria-expanded]="showMobileMenu"
            aria-label="Toggle navigation menu"
            *ngIf="isMobile"
          >
            <span class="hamburger-icon" [class.active]="showMobileMenu">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          
          <div class="nav-user-actions" *ngIf="!isMobile">
            <button class="nav-btn" aria-label="Notifications">
              <span class="nav-icon">🔔</span>
            </button>
            <button class="nav-btn" aria-label="Settings">
              <span class="nav-icon">⚙️</span>
            </button>
            <button class="nav-btn" aria-label="User profile">
              <span class="nav-icon">👤</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Breadcrumbs -->
      <div class="breadcrumbs" *ngIf="breadcrumbs && breadcrumbs.length > 0">
        <ol class="breadcrumb-list">
          <li 
            *ngFor="let crumb of breadcrumbs; let last = last" 
            class="breadcrumb-item"
            [class.breadcrumb-current]="last"
          >
            <a 
              *ngIf="crumb.route && !last; else textCrumb"
              [routerLink]="crumb.route"
              class="breadcrumb-link"
            >
              <span *ngIf="crumb.icon" class="breadcrumb-icon">{{ crumb.icon }}</span>
              {{ crumb.label }}
            </a>
            <ng-template #textCrumb>
              <span class="breadcrumb-current-text">
                <span *ngIf="crumb.icon" class="breadcrumb-icon">{{ crumb.icon }}</span>
                {{ crumb.label }}
              </span>
            </ng-template>
            <span 
              *ngIf="!last" 
              class="breadcrumb-separator"
              aria-hidden="true"
            >
              /
            </span>
          </li>
        </ol>
      </div>
      
      <!-- Main Navigation Items -->
      <div 
        class="nav-items" 
        [class.nav-items-mobile-open]="showMobileMenu"
        *ngIf="navigationItems && navigationItems.length > 0"
      >
        <ul class="nav-list">
          <li 
            *ngFor="let item of navigationItems" 
            class="nav-list-item"
          >
            <a 
              *ngIf="item.route; else buttonItem"
              [routerLink]="item.route"
              class="nav-link"
              [class.nav-link-active]="item.active"
              [class.nav-link-disabled]="item.disabled"
              [attr.aria-current]="item.active ? 'page' : null"
            >
              <span *ngIf="item.icon" class="nav-icon">{{ item.icon }}</span>
              {{ item.label }}
            </a>
            <ng-template #buttonItem>
              <button 
                class="nav-button"
                [class.nav-button-active]="item.active"
                [disabled]="item.disabled"
                (click)="onNavigationClick(item)"
              >
                <span *ngIf="item.icon" class="nav-icon">{{ item.icon }}</span>
                {{ item.label }}
              </button>
            </ng-template>
          </li>
        </ul>
      </div>
      
      <!-- Mobile Menu Overlay -->
      <div 
        *ngIf="isMobile && showMobileMenu"
        class="mobile-overlay"
        (click)="closeMobileMenu()"
        aria-hidden="true"
      ></div>
    </nav>
  `,
  styleUrls: ['./navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationComponent {
  @Input() breadcrumbs?: BreadcrumbItem[];
  @Input() navigationItems?: NavigationItem[];
  @Input() isMobile = false;
  
  showMobileMenu = false;

  onBrandClick(): void {
    // Emit brand click event or navigate to home
  }

  onNavigationClick(item: NavigationItem): void {
    if (!item.disabled) {
      // Emit navigation click event
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }
}