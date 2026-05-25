import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import {
  CategoryExpense,
  DashboardMovimientoApiRecord,
  DashboardGastoPorTitulo,
  DashboardResumenPorTipo,
  DashboardResumenQuery,
  DashboardResumenResponse,
  ExpenseCategory,
  MetricCard,
  Movement,
  MovementType,
  SummaryItem,
} from '../../models/dashboard.models';
import { DashboardApiService } from '../../services/dashboard-api.service';

const EMPTY_DASHBOARD_SUMMARY: DashboardResumenResponse = {
  totalIngresos: 0,
  totalGastos: 0,
  balance: 0,
  cantidadMovimientos: 0,
  ultimosMovimientos: [],
  resumenPorTipo: {
    ingreso: 0,
    gasto: 0,
    transferencia: 0,
  },
  gastosPorTitulo: [],
};

const ECUADOR_TIME_ZONE = 'America/Guayaquil';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly dashboardApiService = inject(DashboardApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly currencyFormatter = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  });
  private readonly integerFormatter = new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 0,
  });

  readonly bottomNavigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home', active: true },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos' },
    { label: 'Cuentas', icon: 'card-outline' },
    { label: 'Reportes', icon: 'bar-chart-outline' },
    { label: 'Configuracion', icon: 'settings-outline' },
  ];
  metrics: MetricCard[] = [];
  categories: CategoryExpense[] = [];
  expenseCategories: ExpenseCategory[] = [];
  summary: SummaryItem[] = [];
  movements: Movement[] = [];
  dashboardSummary = EMPTY_DASHBOARD_SUMMARY;
  isLoadingSummary = false;
  summaryError = '';
  greetingName = '';

  ngOnInit(): void {
    this.greetingName = this.obtenerNombreUsuario();
    this.cargarUsuarioActual();
    this.applySummary(EMPTY_DASHBOARD_SUMMARY);
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSummary(query: DashboardResumenQuery = {}): void {
    this.isLoadingSummary = true;
    this.summaryError = '';
    this.changeDetectorRef.markForCheck();

    this.dashboardApiService
      .obtenerResumen(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingSummary = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (resumen) => {
          this.applySummary(resumen);
        },
        error: () => {
          this.applySummary(EMPTY_DASHBOARD_SUMMARY);
          this.summaryError = 'No se pudo cargar el resumen financiero.';
        },
      });
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

  private applySummary(resumen: DashboardResumenResponse): void {
    this.dashboardSummary = resumen;
    this.metrics = this.createMetricCards(resumen);
    this.categories = this.createTypeSummary(resumen.resumenPorTipo);
    this.expenseCategories = this.createExpenseCategories(
      resumen.gastosPorTitulo,
    );
    this.summary = this.createMonthlySummary(resumen);
    this.movements = resumen.ultimosMovimientos.map((movement) =>
      this.toMovement(movement),
    );
  }

  private cargarUsuarioActual(): void {
    this.authService
      .me()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.greetingName = this.obtenerNombreUsuario();
          this.changeDetectorRef.markForCheck();
        },
        error: () => undefined,
      });
  }

  private obtenerNombreUsuario(): string {
    const usuario = this.authService.obtenerUsuario();
    const nombreCompleto = usuario?.nombreCompleto?.trim();

    if (nombreCompleto) {
      return nombreCompleto.split(/\s+/)[0];
    }

    const correo = usuario?.correo?.trim();

    if (correo) {
      return correo.split('@')[0];
    }

    return '';
  }

  private createMetricCards(resumen: DashboardResumenResponse): MetricCard[] {
    const monthLabel = this.getCurrentMonthLabel();

    return [
      {
        title: 'Balance',
        amount: this.formatCurrency(resumen.balance),
        subtitle: monthLabel,
        tone: resumen.balance >= 0 ? 'success' : 'danger',
        icon: 'wallet-outline',
        accentIcon: 'trending-up-outline',
      },
      {
        title: 'Ingresos',
        amount: this.formatCurrency(resumen.totalIngresos),
        subtitle: monthLabel,
        tone: 'primary',
        icon: 'download-outline',
        accentIcon: 'cash-outline',
      },
      {
        title: 'Gastos',
        amount: this.formatCurrency(resumen.totalGastos),
        subtitle: monthLabel,
        tone: 'danger',
        icon: 'arrow-up-outline',
        accentIcon: 'pricetag-outline',
      },
      {
        title: 'Movimientos',
        amount: this.integerFormatter.format(resumen.cantidadMovimientos),
        subtitle: 'Registrados',
        tone: 'neutral',
        icon: 'swap-horizontal-outline',
        accentIcon: 'list-outline',
      },
    ];
  }

  private createMonthlySummary(
    resumen: DashboardResumenResponse,
  ): SummaryItem[] {
    return [
      {
        label: 'Ingresos',
        amount: this.formatCurrency(resumen.totalIngresos),
        tone: 'success',
      },
      {
        label: 'Gastos',
        amount: this.formatCurrency(resumen.totalGastos),
        tone: 'danger',
      },
      {
        label: 'Balance',
        amount: this.formatCurrency(resumen.balance),
        tone: resumen.balance >= 0 ? 'success' : 'danger',
      },
      {
        label: 'Movimientos',
        amount: this.integerFormatter.format(resumen.cantidadMovimientos),
        tone: 'neutral',
      },
    ];
  }

  private createTypeSummary(
    resumenPorTipo: DashboardResumenPorTipo,
  ): CategoryExpense[] {
    const items = [
      {
        label: 'Ingresos',
        value: resumenPorTipo.ingreso,
        color: '#10924c',
      },
      {
        label: 'Gastos',
        value: resumenPorTipo.gasto,
        color: '#cb313e',
      },
      {
        label: 'Transferencias',
        value: resumenPorTipo.transferencia,
        color: '#2d72d8',
      },
    ];
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items.map((item) => ({
      label: item.label,
      amount: this.formatCurrency(item.value),
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
      color: item.color,
    }));
  }

  private createExpenseCategories(
    gastosPorTitulo: DashboardGastoPorTitulo[] = [],
  ): ExpenseCategory[] {
    const maxTotal = Math.max(
      ...gastosPorTitulo.map((expense) => this.toNumber(expense.total)),
      0,
    );

    return gastosPorTitulo.map((expense) => {
      const amount = this.toNumber(expense.total);

      return {
        label: expense.titulo || 'Sin titulo',
        amount: this.formatCurrency(amount),
        percentage:
          maxTotal > 0 ? Math.max(Math.round((amount / maxTotal) * 100), 8) : 0,
      };
    });
  }

  private toMovement(record: DashboardMovimientoApiRecord): Movement {
    const type = this.toMovementType(record.tipoMovimiento);
    const amount = this.toNumber(record.monto);
    const date = this.toDate(record.fechaMovimiento);

    return {
      title: record.titulo || 'Movimiento',
      category: this.getMovementCategory(record, type),
      date: date ? this.formatDate(date) : 'Sin fecha',
      amount: this.formatMovementAmount(amount, type),
      type,
    };
  }

  private getMovementCategory(
    record: DashboardMovimientoApiRecord,
    type: MovementType,
  ): string {
    const labels: Record<MovementType, string> = {
      income: 'Ingreso',
      expense: 'Gasto',
      transfer: 'Transferencia',
    };
    const accountLabel = this.getAccountLabel(record, type);

    return accountLabel ? `${labels[type]} - ${accountLabel}` : labels[type];
  }

  private getAccountLabel(
    record: DashboardMovimientoApiRecord,
    type: MovementType,
  ): string {
    if (type === 'transfer') {
      return [record.cuentaOrigen, record.cuentaDestino]
        .filter(Boolean)
        .join(' -> ');
    }

    return type === 'income'
      ? record.cuentaDestino || record.cuentaOrigen || ''
      : record.cuentaOrigen || record.cuentaDestino || '';
  }

  private toMovementType(value?: string): MovementType {
    const normalizedValue = (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalizedValue.includes('transfer')) {
      return 'transfer';
    }

    if (normalizedValue.includes('ingreso') || normalizedValue.includes('income')) {
      return 'income';
    }

    return 'expense';
  }

  private toNumber(value: number | string | undefined): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);

      return Number.isFinite(parsedValue) ? parsedValue : 0;
    }

    return 0;
  }

  private toDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatMovementAmount(amount: number, type: MovementType): string {
    const sign = type === 'income' ? '+' : type === 'expense' ? '-' : '';

    return `${sign}${this.formatCurrency(Math.abs(amount))}`;
  }

  private formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIME_ZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private getCurrentMonthLabel(): string {
    const label = new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIME_ZONE,
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  releaseNavigationFocus(event?: Event): void {
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
