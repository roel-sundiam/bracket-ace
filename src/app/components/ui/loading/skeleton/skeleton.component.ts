import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'rectangular' | 'circular' | 'rounded';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="skeletonClasses"
      [style.width]="width"
      [style.height]="height"
      [attr.aria-label]="ariaLabel"
    >
      <div class="skeleton-shimmer"></div>
    </div>
  `,
  styleUrls: ['./skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'rectangular';
  @Input() width?: string;
  @Input() height?: string;
  @Input() animated = true;
  @Input() ariaLabel = 'Loading content';

  get skeletonClasses(): string {
    const classes = [
      'skeleton',
      `skeleton-${this.variant}`,
    ];

    if (this.animated) {
      classes.push('skeleton-animated');
    }

    return classes.join(' ');
  }
}