import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'neutral' | 'white';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="spinnerClasses" [attr.aria-label]="ariaLabel">
      <div class="spinner-circle"></div>
      <span *ngIf="text" class="spinner-text">{{ text }}</span>
    </div>
  `,
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() variant: SpinnerVariant = 'primary';
  @Input() text?: string;
  @Input() ariaLabel = 'Loading';

  get spinnerClasses(): string {
    const classes = [
      'spinner',
      `spinner-${this.size}`,
      `spinner-${this.variant}`,
    ];

    if (this.text) {
      classes.push('spinner-with-text');
    }

    return classes.join(' ');
  }
}