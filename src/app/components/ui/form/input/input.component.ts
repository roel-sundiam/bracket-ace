import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-field" [class.form-field-full-width]="fullWidth">
      <label 
        *ngIf="label" 
        [for]="inputId"
        class="form-label"
        [class.form-label-required]="required"
      >
        {{ label }}
      </label>
      
      <div class="form-input-wrapper" [class]="inputWrapperClasses">
        <div *ngIf="prefixIcon" class="form-input-prefix">
          {{ prefixIcon }}
        </div>
        
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [required]="required"
          [class]="inputClasses"
          [value]="value"
          [attr.aria-describedby]="hasError ? errorId : null"
          [attr.aria-invalid]="hasError"
          (input)="onInput($event)"
          (blur)="onBlur($event)"
          (focus)="onFocus($event)"
        />
        
        <div *ngIf="suffixIcon" class="form-input-suffix">
          {{ suffixIcon }}
        </div>
      </div>
      
      <div *ngIf="helpText && !hasError" class="form-help-text">
        {{ helpText }}
      </div>
      
      <div 
        *ngIf="hasError" 
        [id]="errorId"
        class="form-error-text"
        role="alert"
      >
        {{ displayError }}
      </div>
    </div>
  `,
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() size: InputSize = 'md';
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() helpText?: string;
  @Input() errorMessage?: string;
  @Input() error?: string | null; // Alias for errorMessage
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() fullWidth = true;

  @Output() inputChange = new EventEmitter<string>();
  @Output() inputBlur = new EventEmitter<FocusEvent>();
  @Output() inputFocus = new EventEmitter<FocusEvent>();

  value = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get inputId(): string {
    return `input-${Math.random().toString(36).substr(2, 9)}`;
  }

  get errorId(): string {
    return `${this.inputId}-error`;
  }

  get hasError(): boolean {
    return !!(this.errorMessage || this.error);
  }

  get displayError(): string | undefined {
    return this.errorMessage || this.error || undefined;
  }

  get inputWrapperClasses(): string {
    const classes = [
      'form-input-wrapper-base',
      `form-input-wrapper-${this.size}`,
    ];

    if (this.hasError) {
      classes.push('form-input-wrapper-error');
    }

    if (this.disabled) {
      classes.push('form-input-wrapper-disabled');
    }

    if (this.prefixIcon) {
      classes.push('form-input-wrapper-with-prefix');
    }

    if (this.suffixIcon) {
      classes.push('form-input-wrapper-with-suffix');
    }

    return classes.join(' ');
  }

  get inputClasses(): string {
    const classes = [
      'form-input-base',
      `form-input-${this.size}`,
    ];

    return classes.join(' ');
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onBlur(event: FocusEvent): void {
    this.onTouched();
    this.inputBlur.emit(event);
  }

  onFocus(event: FocusEvent): void {
    this.inputFocus.emit(event);
  }
}