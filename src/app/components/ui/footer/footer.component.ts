import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface FooterLink {
  label: string;
  route?: string;
  href?: string;
  icon?: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <!-- Main Footer Content -->
        <div class="footer-main">
          <!-- Brand Section -->
          <div class="footer-brand">
            <div class="footer-logo">
              <div class="brand-icon">
                <span class="brand-icon-text">🎾</span>
              </div>
              <div class="brand-text">
                <h2 class="brand-title">BracketAce</h2>
                <p class="brand-tagline">Professional Tournament Management</p>
              </div>
            </div>
            <p class="footer-description">
              Streamline your tennis tournaments with our professional bracket management system. 
              Built for organizers, loved by players.
            </p>
            <div class="social-links" *ngIf="socialLinks && socialLinks.length > 0">
              <a 
                *ngFor="let social of socialLinks"
                [href]="social.href"
                [attr.aria-label]="social.label"
                class="social-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="social-icon">{{ social.icon }}</span>
              </a>
            </div>
          </div>
          
          <!-- Footer Sections -->
          <div class="footer-sections" *ngIf="footerSections && footerSections.length > 0">
            <div 
              *ngFor="let section of footerSections" 
              class="footer-section"
            >
              <h3 class="section-title">{{ section.title }}</h3>
              <ul class="section-links">
                <li *ngFor="let link of section.links" class="section-link-item">
                  <a 
                    *ngIf="link.route; else externalLink"
                    [routerLink]="link.route"
                    class="section-link"
                  >
                    <span *ngIf="link.icon" class="link-icon">{{ link.icon }}</span>
                    {{ link.label }}
                  </a>
                  <ng-template #externalLink>
                    <a 
                      [href]="link.href"
                      class="section-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span *ngIf="link.icon" class="link-icon">{{ link.icon }}</span>
                      {{ link.label }}
                    </a>
                  </ng-template>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <p class="copyright">
              © {{ currentYear }} BracketAce. All rights reserved.
            </p>
            <div class="footer-bottom-links">
              <a 
                *ngFor="let link of bottomLinks" 
[routerLink]="link.route || undefined"
                [href]="link.href || undefined"
                class="bottom-link"
[target]="link.href ? '_blank' : undefined"
[rel]="link.href ? 'noopener noreferrer' : undefined"
              >
                {{ link.label }}
              </a>
            </div>
            <p class="footer-version" *ngIf="version">
              Version {{ version }}
            </p>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  @Input() footerSections?: FooterSection[];
  @Input() socialLinks?: FooterLink[];
  @Input() bottomLinks: FooterLink[] = [
    { label: 'Privacy Policy', route: '/privacy' },
    { label: 'Terms of Service', route: '/terms' },
    { label: 'Support', route: '/support' }
  ];
  @Input() version?: string;

  get currentYear(): number {
    return new Date().getFullYear();
  }
}