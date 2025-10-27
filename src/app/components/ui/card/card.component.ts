import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      <div *ngIf="title || subtitle" class="card-header">
        <h3 *ngIf="title" class="card-title">{{ title }}</h3>
        <p *ngIf="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </div>
      
      <div class="card-content" [class.card-content-no-header]="!title && !subtitle">
        <ng-content></ng-content>
      </div>
      
      <div *ngIf="hasFooterContent" class="card-footer">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() clickable = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  get cardClasses(): string {
    const classes = [
      'card',
      `card-${this.variant}`,
    ];

    if (this.clickable) {
      classes.push('card-clickable');
    }

    if (this.loading) {
      classes.push('card-loading');
    }

    if (this.fullWidth) {
      classes.push('card-full-width');
    }

    return classes.join(' ');
  }

  get hasFooterContent(): boolean {
    // This would need to be implemented based on projected content
    // For now, we'll assume footer content exists if the slot is used
    return true; // Simplified for this implementation
  }
}