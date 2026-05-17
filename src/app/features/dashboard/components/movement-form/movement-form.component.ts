import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';

import { MovementFormValue, MovementKind } from '../movements-page/movements-page.models';

@Component({
  selector: 'app-movement-form',
  templateUrl: './movement-form.component.html',
  styleUrls: ['./movement-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementFormComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  @Input({ required: true }) title = '';
  @Input({ required: true }) kind: MovementKind = 'income';
  @Input() saving = false;
  @Input() errorMessage = '';

  @Output() back = new EventEmitter<void>();
  @Output() save = new EventEmitter<MovementFormValue>();

  readonly form = this.formBuilder.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    cuentaOrigen: [''],
    cuentaDestino: [''],
    fecha: [this.getTodayValue(), Validators.required],
    hora: [this.getCurrentTimeValue(), Validators.required],
    descripcion: [''],
  });

  get buttonText(): string {
    const labels: Record<MovementKind, string> = {
      income: 'Guardar ingreso',
      expense: 'Guardar gasto',
      transfer: 'Guardar transferencia',
    };

    return labels[this.kind];
  }

  get isTransfer(): boolean {
    return this.kind === 'transfer';
  }

  get accountLabel(): string {
    return this.kind === 'income' ? 'Cuenta destino' : 'Cuenta origen';
  }

  get accountPlaceholder(): string {
    return this.kind === 'income'
      ? 'Ej. Banco Pichincha'
      : 'Ej. Efectivo';
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.save.emit({
      kind: this.kind,
      titulo: value.titulo.trim(),
      descripcion: this.toOptionalString(value.descripcion),
      monto: value.monto,
      cuentaOrigen: this.toOptionalString(value.cuentaOrigen),
      cuentaDestino: this.toOptionalString(value.cuentaDestino),
      fechaMovimiento: this.toIsoDate(value.fecha, value.hora),
    });
  }

  private toOptionalString(value: string): string | undefined {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private toIsoDate(fecha: string, hora: string): string | undefined {
    if (!fecha || !hora) {
      return undefined;
    }

    return new Date(`${fecha}T${hora}:00`).toISOString();
  }

  private getTodayValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getCurrentTimeValue(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }
}
