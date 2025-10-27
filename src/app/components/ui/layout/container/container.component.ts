import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContainerComponent {
  @Input() size: ContainerSize = 'xl';
  @Input() centerContent = false;
  @Input() noPadding = false;

  get containerClasses(): string {
    const classes = [
      'container',
      `container-${this.size}`,
    ];

    if (this.centerContent) {
      classes.push('container-center');
    }

    if (this.noPadding) {
      classes.push('container-no-padding');
    }

    return classes.join(' ');
  }
}