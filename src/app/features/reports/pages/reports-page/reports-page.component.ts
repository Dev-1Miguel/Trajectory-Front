import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, Subject, take, takeUntil } from 'rxjs';

import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import {
  ActiveWallet,
  WalletStateService,
} from '../../../wallets/services/wallet-state.service';
import {
  ReportFilters,
  ReportMovement,
  ReportMovementsResponse,
  ReportMovementType,
  ReportSummary,
  ReportSummaryResponse,
} from '../../models/reports.models';
import { ReportsApiService } from '../../services/reports-api.service';

interface ReportMovementViewModel {
  idMovimiento?: number;
  fechaMovimiento: string;
  tipoMovimiento: string;
  categoria: string;
  billetera: string;
  titulo: string;
  descripcion: string;
  monto: string;
  tone: 'income' | 'expense' | 'transfer' | 'neutral';
}

type ReportFormValue = {
  fechaInicio: string;
  fechaFin: string;
  idBilletera: number;
  tipoMovimiento: ReportMovementType | '';
};

const EMPTY_SUMMARY: ReportSummary = {
  totalIngresos: 0,
  totalGastos: 0,
  balance: 0,
  cantidadMovimientos: 0,
};

const reportDateRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const fechaInicio = control.get('fechaInicio')?.value;
  const fechaFin = control.get('fechaFin')?.value;

  if (!fechaInicio || !fechaFin) {
    return null;
  }

  return fechaInicio <= fechaFin ? null : { invalidDateRange: true };
};

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  private readonly reportsApiService = inject(ReportsApiService);
  private readonly walletStateService = inject(WalletStateService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private readonly currencyFormatter = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  });

  readonly movementTypes: Array<{ label: string; value: ReportMovementType | '' }> = [
    { label: 'Todos', value: '' },
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Gasto', value: 'GASTO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
  ];

  readonly bottomNavigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home' },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos' },
    { label: 'Categorias', icon: 'pricetags-outline', route: '/categorias' },
    { label: 'Billeteras', icon: 'wallet-outline', route: '/billeteras' },
    { label: 'Reportes', icon: 'bar-chart-outline', route: '/reportes', active: true },
    { label: 'Configuracion', icon: 'settings-outline', route: '/configuracion' },
  ];

  readonly form = this.formBuilder.group(
    {
      fechaInicio: [this.getMonthStart(), Validators.required],
      fechaFin: [this.getMonthEnd(), Validators.required],
      idBilletera: [0],
      tipoMovimiento: ['' as ReportMovementType | ''],
    },
    { validators: reportDateRangeValidator },
  );

  wallets: ActiveWallet[] = [];
  summary: ReportSummary = EMPTY_SUMMARY;
  movements: ReportMovementViewModel[] = [];
  loading = false;
  downloading = false;
  errorMessage = '';

  private walletFilterTouched = false;
  private requestId = 0;

  ngOnInit(): void {
    this.walletStateService.wallets$
      .pipe(takeUntil(this.destroy$))
      .subscribe((wallets) => {
        this.wallets = wallets;
        this.changeDetectorRef.markForCheck();
      });

    this.walletStateService.activeWalletId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((idBilletera) => {
        if (!this.walletFilterTouched) {
          this.form.controls.idBilletera.setValue(idBilletera ?? 0, {
            emitEvent: false,
          });
        }
      });

    this.form.controls.idBilletera.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.walletFilterTouched = true;
      });

    this.walletStateService.activeWalletId$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => this.loadReports());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReports(): void {
    if (!this.validateFilters()) {
      return;
    }

    const currentRequestId = ++this.requestId;
    const filters = this.createFilters();

    this.loading = true;
    this.errorMessage = '';
    this.changeDetectorRef.markForCheck();

    forkJoin({
      summary: this.reportsApiService.getResumen(filters),
      movements: this.reportsApiService.getMovimientos(filters),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.loading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: ({ summary, movements }) => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.summary = this.toSummary(summary);
          this.movements = this.toMovements(movements);
        },
        error: () => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.summary = EMPTY_SUMMARY;
          this.movements = [];
          this.errorMessage = 'No se pudo cargar el reporte.';
        },
      });
  }

  downloadPdf(): void {
    if (!this.validateFilters() || this.downloading) {
      return;
    }

    const filters = this.createFilters();

    this.downloading = true;
    this.errorMessage = '';
    this.changeDetectorRef.markForCheck();

    this.reportsApiService
      .downloadPdf(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.downloading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (blob) => this.savePdf(blob, filters),
        error: () => {
          this.errorMessage = 'No se pudo descargar el PDF.';
        },
      });
  }

  hasDateRangeError(): boolean {
    return (
      this.form.hasError('invalidDateRange') &&
      (this.form.controls.fechaInicio.dirty ||
        this.form.controls.fechaInicio.touched ||
        this.form.controls.fechaFin.dirty ||
        this.form.controls.fechaFin.touched)
    );
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  navigateFromBottomNavigation(item: NavigationItem, event: Event): void {
    this.releaseNavigationFocus(event);

    if (item.route) {
      window.requestAnimationFrame(() => {
        this.releaseNavigationFocus();
        void this.router.navigateByUrl(item.route as string);
      });
    }
  }

  releaseNavigationFocus(event?: Event): void {
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  trackByWallet(_: number, wallet: ActiveWallet): number {
    return wallet.idBilletera;
  }

  trackByMovement(index: number, movement: ReportMovementViewModel): string {
    return movement.idMovimiento
      ? String(movement.idMovimiento)
      : `${movement.fechaMovimiento}-${movement.titulo}-${index}`;
  }

  private validateFilters(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = this.form.hasError('invalidDateRange')
        ? 'La fecha inicio no puede ser posterior a la fecha fin.'
        : 'Completa las fechas para consultar el reporte.';
      this.changeDetectorRef.markForCheck();
      return false;
    }

    return true;
  }

  private createFilters(): ReportFilters {
    const value = this.form.getRawValue() as ReportFormValue;
    const idBilletera =
      Number.isFinite(value.idBilletera) && value.idBilletera > 0
        ? value.idBilletera
        : null;

    return {
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin,
      idBilletera,
      tipoMovimiento: value.tipoMovimiento || '',
    };
  }

  private toSummary(response: ReportSummaryResponse): ReportSummary {
    const record = this.extractSummaryRecord(response);

    return {
      totalIngresos: this.getNumber(record, [
        'totalIngresos',
        'TotalIngresos',
        'TOTALINGRESOS',
        'ingresos',
        'Ingresos',
      ]),
      totalGastos: this.getNumber(record, [
        'totalGastos',
        'TotalGastos',
        'TOTALGASTOS',
        'gastos',
        'Gastos',
      ]),
      balance: this.getNumber(record, ['balance', 'Balance', 'BALANCE']),
      cantidadMovimientos: this.getNumber(record, [
        'cantidadMovimientos',
        'CantidadMovimientos',
        'CANTIDADMOVIMIENTOS',
        'movimientos',
        'Movimientos',
      ]),
    };
  }

  private extractSummaryRecord(
    response: ReportSummaryResponse,
  ): Record<string, unknown> {
    const data = response.data;

    if (Array.isArray(data)) {
      return (data[0] ?? {}) as Record<string, unknown>;
    }

    return (
      (response.resumen as Record<string, unknown> | undefined) ??
      (response.summary as Record<string, unknown> | undefined) ??
      (data as Record<string, unknown> | undefined) ??
      (response as Record<string, unknown>)
    );
  }

  private toMovements(
    response: ReportMovementsResponse | ReportMovement[],
  ): ReportMovementViewModel[] {
    return this.extractMovementRecords(response)
      .map((movement) => this.toMovementViewModel(movement))
      .sort((left, right) =>
        right.fechaMovimiento.localeCompare(left.fechaMovimiento),
      );
  }

  private extractMovementRecords(
    response: ReportMovementsResponse | ReportMovement[],
  ): ReportMovement[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response.movimientos ?? response.data ?? [];
  }

  private toMovementViewModel(
    movement: ReportMovement,
  ): ReportMovementViewModel {
    const record = movement as Record<string, unknown>;
    const tipoMovimiento = this.getText(record, [
      'tipoMovimiento',
      'TipoMovimiento',
      'TIPOMOVIMIENTO',
    ]);
    const amount = this.getNumber(record, ['monto', 'Monto', 'MONTO']);
    const tone = this.getMovementTone(tipoMovimiento);

    return {
      idMovimiento: this.getOptionalNumber(record, [
        'idMovimiento',
        'IdMovimiento',
        'IDMOVIMIENTO',
        'id',
      ]),
      fechaMovimiento: this.formatDate(
        this.getText(record, [
          'fechaMovimiento',
          'FechaMovimiento',
          'FECHAMOVIMIENTO',
        ]),
      ),
      tipoMovimiento: this.formatMovementType(tipoMovimiento),
      categoria:
        this.getText(record, [
          'categoria',
          'Categoria',
          'CATEGORIA',
          'nombreCategoria',
          'NombreCategoria',
        ]) || 'Sin categoria',
      billetera:
        this.getText(record, [
          'billetera',
          'Billetera',
          'BILLETERA',
          'nombreBilletera',
          'NombreBilletera',
        ]) || 'Sin billetera',
      titulo:
        this.getText(record, ['titulo', 'Titulo', 'TITULO']) || 'Movimiento',
      descripcion:
        this.getText(record, [
          'descripcion',
          'Descripcion',
          'DESCRIPCION',
          'notas',
          'Notas',
          'NOTAS',
        ]) || 'Sin descripcion',
      monto: this.formatMovementAmount(amount, tone),
      tone,
    };
  }

  private getNumber(record: Record<string, unknown>, keys: string[]): number {
    return this.getOptionalNumber(record, keys) ?? 0;
  }

  private getOptionalNumber(
    record: Record<string, unknown>,
    keys: string[],
  ): number | undefined {
    const value = this.getValue(record, keys);

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);

      return Number.isFinite(parsedValue) ? parsedValue : undefined;
    }

    return undefined;
  }

  private getText(record: Record<string, unknown>, keys: string[]): string {
    const value = this.getValue(record, keys);

    if (value === undefined || value === null) {
      return '';
    }

    return String(value).trim();
  }

  private getValue(record: Record<string, unknown>, keys: string[]): unknown {
    return keys.map((key) => record[key]).find((value) => value !== undefined);
  }

  private getMovementTone(
    value: string,
  ): ReportMovementViewModel['tone'] {
    const normalizedValue = this.normalizeText(value);

    if (normalizedValue.includes('ingreso')) {
      return 'income';
    }

    if (normalizedValue.includes('gasto')) {
      return 'expense';
    }

    if (normalizedValue.includes('transfer')) {
      return 'transfer';
    }

    return 'neutral';
  }

  private formatMovementType(value: string): string {
    const tone = this.getMovementTone(value);

    if (tone === 'income') {
      return 'Ingreso';
    }

    if (tone === 'expense') {
      return 'Gasto';
    }

    if (tone === 'transfer') {
      return 'Transferencia';
    }

    return value || 'Movimiento';
  }

  private formatMovementAmount(
    value: number,
    tone: ReportMovementViewModel['tone'],
  ): string {
    const sign = tone === 'income' ? '+' : tone === 'expense' ? '-' : '';

    return `${sign}${this.formatCurrency(Math.abs(value))}`;
  }

  private formatDate(value: string): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private savePdf(blob: Blob, filters: ReportFilters): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `reporte-movimientos-${filters.fechaInicio.slice(0, 7)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private getMonthStart(): string {
    const today = new Date();

    return this.toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  private getMonthEnd(): string {
    const today = new Date();

    return this.toDateInputValue(
      new Date(today.getFullYear(), today.getMonth() + 1, 0),
    );
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
