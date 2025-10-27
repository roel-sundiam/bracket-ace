import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isOpen" 
      class="modal-overlay"
      [class.modal-overlay-closing]="isClosing"
      (click)="onOverlayClick($event)"
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="title ? 'modal-title' : null"
      [attr.aria-describedby]="'modal-content'"
    >
      <div 
        [class]="modalClasses"
        (click)="$event.stopPropagation()"
        role="document"
      >
        <!-- Modal Header -->
        <div class="modal-header" *ngIf="title || showCloseButton">
          <h2 *ngIf="title" id="modal-title" class="modal-title">
            {{ title }}
          </h2>
          <button 
            *ngIf="showCloseButton"
            class="modal-close-button"
            (click)="close()"
            aria-label="Close modal"
            type="button"
          >
            <span class="close-icon">✕</span>
          </button>
        </div>
        
        <!-- Modal Content -->
        <div class="modal-content" id="modal-content">
          <ng-content></ng-content>
        </div>
        
        <!-- Modal Footer -->
        <div class="modal-footer" *ngIf="hasFooterContent">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() size: ModalSize = 'md';
  @Input() showCloseButton = true;
  @Input() closeOnOverlayClick = true;
  @Input() closeOnEscape = true;

  @Output() closed = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();

  isClosing = false;
  hasFooterContent = true; // Simplified for this implementation

  get modalClasses(): string {
    const classes = [
      'modal',
      `modal-${this.size}`,
    ];

    if (this.isClosing) {
      classes.push('modal-closing');
    }

    return classes.join(' ');
  }

  ngOnInit(): void {
    if (this.isOpen) {
      this.handleOpen();
    }
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.handleOpen();
    } else {
      this.handleClose();
    }
  }

  private handleOpen(): void {
    document.body.style.overflow = 'hidden';
    this.addEventListeners();
    this.opened.emit();
  }

  private handleClose(): void {
    document.body.style.overflow = '';
    this.removeEventListeners();
  }

  private addEventListeners(): void {
    if (this.closeOnEscape) {
      document.addEventListener('keydown', this.onEscapeKey);
    }
  }

  private removeEventListeners(): void {
    document.removeEventListener('keydown', this.onEscapeKey);
  }

  private onEscapeKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.close();
    }
  };

  onOverlayClick(event: Event): void {
    if (this.closeOnOverlayClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  close(): void {
    this.isClosing = true;
    
    // Allow animation to complete before emitting close
    setTimeout(() => {
      this.isClosing = false;
      this.closed.emit();
    }, 300);
  }
}