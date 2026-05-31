import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';

import {
  MovementCategoryOption,
  MovementFormValue,
  MovementKind,
  MovementWalletOption,
} from '../../models/movements.models';

const ECUADOR_TIME_ZONE = 'America/Guayaquil';

@Component({
  selector: 'app-movement-form',
  templateUrl: './movement-form.component.html',
  styleUrls: ['./movement-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementFormComponent implements OnChanges {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  @Input({ required: true }) title = '';
  @Input({ required: true }) kind: MovementKind = 'income';
  @Input() categories: MovementCategoryOption[] = [];
  @Input() wallets: MovementWalletOption[] = [];
  @Input() loadingCategories = false;
  @Input() loadingWallets = false;
  @Input() categoryErrorMessage = '';
  @Input() walletErrorMessage = '';
  @Input() saving = false;
  @Input() errorMessage = '';

  @Output() back = new EventEmitter<void>();
  @Output() save = new EventEmitter<MovementFormValue>();

  readonly form = this.formBuilder.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    idCategoria: [0],
    idBilletera: [0],
    cuentaOrigen: [''],
    cuentaDestino: [''],
    fecha: [this.getTodayValue(), Validators.required],
    hora: [this.getCurrentTimeValue(), Validators.required],
    descripcion: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['kind'] ||
      changes['categories'] ||
      changes['loadingCategories']
    ) {
      this.syncCategoryControlState();
    }

    if (
      changes['wallets'] ||
      changes['loadingWallets']
    ) {
      this.syncWalletControlState();
    }
  }

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
      idCategoria: this.kind === 'transfer' ? null : this.toCategoryId(value.idCategoria),
      idBilletera: this.toWalletId(value.idBilletera),
      cuentaOrigen: this.toOptionalString(value.cuentaOrigen),
      cuentaDestino: this.toOptionalString(value.cuentaDestino),
      fechaMovimiento: this.toEcuadorDateTime(value.fecha, value.hora),
    });
  }

  private toCategoryId(value: number): number | null {
    return value > 0 ? value : null;
  }

  private toWalletId(value: number): number | null {
    return value > 0 ? value : null;
  }

  private syncCategoryControlState(): void {
    const control = this.form.controls.idCategoria;

    if (this.isTransfer) {
      control.setValue(0, { emitEvent: false });
      control.disable({ emitEvent: false });
      return;
    }

    if (this.loadingCategories || this.categories.length === 0) {
      control.setValue(0, { emitEvent: false });
      control.disable({ emitEvent: false });
      return;
    }

    control.enable({ emitEvent: false });
  }

  private syncWalletControlState(): void {
    const control = this.form.controls.idBilletera;

    if (this.loadingWallets || this.wallets.length === 0) {
      control.setValue(0, { emitEvent: false });
      control.disable({ emitEvent: false });
      return;
    }

    control.enable({ emitEvent: false });

    const currentValue = control.value;
    const hasCurrentWallet = this.wallets.some(
      (wallet) => wallet.idBilletera === currentValue,
    );

    if (hasCurrentWallet) {
      return;
    }

    const principalWallet = this.wallets.find((wallet) => wallet.esPrincipal);

    control.setValue(principalWallet?.idBilletera ?? 0, { emitEvent: false });
  }

  private toOptionalString(value: string): string | undefined {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private toEcuadorDateTime(fecha: string, hora: string): string | undefined {
    if (!fecha || !hora) {
      return undefined;
    }

    return `${fecha}T${hora}:00-05:00`;
  }

  private getTodayValue(): string {
    const parts = this.getEcuadorDateParts();

    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  private getCurrentTimeValue(): string {
    const parts = this.getEcuadorDateParts();

    return `${parts.hour}:${parts.minute}`;
  }

  private getEcuadorDateParts(): Record<'year' | 'month' | 'day' | 'hour' | 'minute', string> {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: ECUADOR_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date()).reduce(
      (parts, part) => {
        if (part.type in parts) {
          parts[part.type as keyof typeof parts] = part.value;
        }

        return parts;
      },
      {
        year: '',
        month: '',
        day: '',
        hour: '',
        minute: '',
      },
    );

    return {
      ...parts,
      hour: parts.hour === '24' ? '00' : parts.hour,
    };
  }
}
