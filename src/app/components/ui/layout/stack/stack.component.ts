import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Spacing } from '../../../../styles/design-tokens';

export type StackDirection = 'vertical' | 'horizontal';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

@Component({
  selector: 'app-stack',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="stackClasses" [style]="stackStyles">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./stack.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackComponent {
  @Input() direction: StackDirection = 'vertical';
  @Input() spacing: Spacing = 4;
  @Input() align: StackAlign = 'stretch';
  @Input() justify: StackJustify = 'start';
  @Input() wrap = false;
  @Input() fullWidth = false;
  @Input() fullHeight = false;

  get stackClasses(): string {
    const classes = [
      'stack',
      `stack-${this.direction}`,
      `stack-align-${this.align}`,
      `stack-justify-${this.justify}`,
    ];

    if (this.wrap) {
      classes.push('stack-wrap');
    }

    if (this.fullWidth) {
      classes.push('stack-full-width');
    }

    if (this.fullHeight) {
      classes.push('stack-full-height');
    }

    return classes.join(' ');
  }

  get stackStyles(): { [key: string]: string } {
    return {
      gap: `var(--space-${this.spacing})`
    };
  }
}