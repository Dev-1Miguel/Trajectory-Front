import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';

import {
  MovementApiRecord,
  MovementPayload,
  MovementsApiService,
} from '../../services/movements-api.service';
import {
  BottomNavigationItem,
  MovementEntry,
  MovementFilter,
  MovementFormValue,
  MovementGroup,
  MovementKind,
  MovementOption,
  MovementStep,
  SuccessSummary,
} from './movements-page.models';

interface HydratedMovement {
  id?: number;
  title: string;
  description: string;
  amount: number;
  date: Date;
  kind: MovementKind;
  accountLabel: string;
}

const KIND_TO_API: Record<MovementKind, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

const KIND_LABEL: Record<MovementKind, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

const ECUADOR_TIME_ZONE = 'America/Guayaquil';

@Component({
  selector: 'app-movements-page',
  templateUrl: './movements-page.component.html',
  styleUrls: ['./movements-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementsPageComponent implements OnInit, OnDestroy {
  private readonly movementsApiService = inject(MovementsApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly filters: MovementFilter[] = [
    { id: 'all', label: 'Todos' },
    { id: 'income', label: 'Ingresos' },
    { id: 'expense', label: 'Gastos' },
    { id: 'transfer', label: 'Transferencias' },
  ];

  readonly movementOptions: MovementOption[] = [
    {
      kind: 'income',
      title: 'Ingreso',
      subtitle: 'Dinero que recibes',
      icon: 'download-outline',
    },
    {
      kind: 'expense',
      title: 'Gasto',
      subtitle: 'Dinero que pagas',
      icon: 'arrow-up-outline',
    },
    {
      kind: 'transfer',
      title: 'Transferencia',
      subtitle: 'Dinero entre cuentas',
      icon: 'swap-horizontal-outline',
    },
  ];

  readonly bottomNavigation: BottomNavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home' },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos', active: true },
    { label: 'Cuentas', icon: 'wallet-outline' },
    { label: 'Reportes', icon: 'bar-chart-outline' },
    { label: 'Configuracion', icon: 'settings-outline' },
  ];

  movementGroups: MovementGroup[] = [];
  selectedFilter: MovementFilter['id'] = 'all';
  currentStep: MovementStep = 'list';
  lastSavedKind: MovementKind = 'income';
  isLoadingMovements = false;
  isSavingMovement = false;
  movementError = '';
  saveError = '';

  private readonly destroy$ = new Subject<void>();
  private lastSavedSummary: SuccessSummary = {
    title: 'Movimiento guardado',
    message: 'Tu movimiento se ha registrado correctamente.',
    accent: 'income',
    rows: ['Movimiento', this.formatLongDate(new Date()), 'Sin cuenta'],
    amount: '+$0.00',
  };

  ngOnInit(): void {
    this.loadMovements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get activeFormTitle(): string {
    const titles: Record<MovementKind, string> = {
      income: 'Nuevo ingreso',
      expense: 'Nuevo gasto',
      transfer: 'Nueva transferencia',
    };

    return this.isMovementKind(this.currentStep)
      ? titles[this.currentStep]
      : 'Nuevo movimiento';
  }

  get successSummary(): SuccessSummary {
    return this.lastSavedSummary;
  }

  get formKind(): MovementKind {
    return this.isMovementKind(this.currentStep)
      ? this.currentStep
      : this.lastSavedKind;
  }

  loadMovements(): void {
    this.isLoadingMovements = true;
    this.movementError = '';
    this.changeDetectorRef.markForCheck();

    this.movementsApiService
      .consultar(
        this.selectedFilter === 'all'
          ? {}
          : { tipoMovimiento: KIND_TO_API[this.selectedFilter] },
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingMovements = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.movementGroups = this.toMovementGroups(response.data);
        },
        error: () => {
          this.movementGroups = [];
          this.movementError = 'No se pudieron cargar los movimientos.';
        },
      });
  }

  setFilter(filter: MovementFilter['id']): void {
    this.selectedFilter = filter;
    this.loadMovements();
  }

  openSelector(): void {
    this.saveError = '';
    this.currentStep = 'selector';
    this.scrollToTop();
  }

  openForm(kind: MovementKind): void {
    this.saveError = '';
    this.currentStep = kind;
    this.scrollToTop();
  }

  showList(): void {
    this.saveError = '';
    this.currentStep = 'list';
    this.scrollToTop();
  }

  saveMovement(draft: MovementFormValue): void {
    this.isSavingMovement = true;
    this.saveError = '';
    this.changeDetectorRef.markForCheck();

    this.movementsApiService
      .crear(this.toPayload(draft))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSavingMovement = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          const savedMovement =
            this.toHydratedMovement(response.data[0]) ??
            this.toHydratedMovementFromDraft(draft);

          this.lastSavedKind = draft.kind;
          this.lastSavedSummary = this.createSuccessSummary(savedMovement);
          this.currentStep = 'success';
          this.loadMovements();
          this.scrollToTop();
        },
        error: () => {
          this.saveError = 'No se pudo guardar el movimiento. Revisa el API e intenta nuevamente.';
        },
      });
  }

  private toPayload(draft: MovementFormValue): MovementPayload {
    return {
      tipoMovimiento: KIND_TO_API[draft.kind],
      titulo: draft.titulo,
      descripcion: draft.descripcion,
      monto: draft.monto,
      cuentaOrigen: draft.kind === 'income' ? undefined : draft.cuentaOrigen,
      cuentaDestino: draft.kind === 'income' ? draft.cuentaOrigen : draft.cuentaDestino,
      fechaMovimiento: draft.fechaMovimiento,
    };
  }

  private toMovementGroups(records: MovementApiRecord[]): MovementGroup[] {
    const movements = records
      .map((record) => this.toHydratedMovement(record))
      .filter((movement): movement is HydratedMovement => movement !== null)
      .sort((left, right) => right.date.getTime() - left.date.getTime());

    const groups = new Map<string, MovementEntry[]>();

    movements.forEach((movement) => {
      const label = this.formatGroupLabel(movement.date);
      const entry: MovementEntry = {
        id: movement.id,
        title: movement.title,
        description: movement.description,
        amount: this.formatAmount(movement.amount, movement.kind),
        time: this.formatTime(movement.date),
        kind: movement.kind,
      };
      const existingGroup = groups.get(label);

      if (existingGroup) {
        existingGroup.push(entry);
      } else {
        groups.set(label, [entry]);
      }
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }

  private toHydratedMovement(record: MovementApiRecord | undefined): HydratedMovement | null {
    if (!record) {
      return null;
    }

    const movementKind = this.getText(record, ['tipoMovimiento', 'TipoMovimiento', 'TIPOMOVIMIENTO']);
    const title = this.getText(record, ['titulo', 'Titulo', 'TITULO', 'nombre', 'Nombre']);
    const amount = this.getNumber(record, ['monto', 'Monto', 'MONTO']);
    const date = this.getDate(record, ['fechaMovimiento', 'FechaMovimiento', 'FECHAMOVIMIENTO']);

    if (!this.hasMovementData(record, movementKind, title, amount, date)) {
      return null;
    }

    const kind = this.toKind(movementKind);
    const movementDate = date ?? new Date();
    const accountLabel = this.getAccountLabel(kind, record);

    return {
      id: this.getNumber(record, ['idMovimiento', 'IdMovimiento', 'IDMOVIMIENTO', 'id']),
      title: title ?? 'Movimiento',
      description: `${KIND_LABEL[kind]} - ${accountLabel}`,
      amount: amount ?? 0,
      date: movementDate,
      kind,
      accountLabel,
    };
  }

  private toHydratedMovementFromDraft(draft: MovementFormValue): HydratedMovement {
    const date = draft.fechaMovimiento ? new Date(draft.fechaMovimiento) : new Date();
    const accountLabel = this.getDraftAccountLabel(draft);

    return {
      title: draft.titulo,
      description: `${KIND_LABEL[draft.kind]} - ${accountLabel}`,
      amount: draft.monto,
      date,
      kind: draft.kind,
      accountLabel,
    };
  }

  private createSuccessSummary(movement: HydratedMovement): SuccessSummary {
    const titles: Record<MovementKind, string> = {
      income: 'Ingreso guardado',
      expense: 'Gasto guardado',
      transfer: 'Transferencia guardada',
    };
    const messages: Record<MovementKind, string> = {
      income: 'Tu ingreso se ha registrado correctamente.',
      expense: 'Tu gasto se ha registrado correctamente.',
      transfer: 'Tu transferencia se ha realizado correctamente.',
    };

    return {
      title: titles[movement.kind],
      message: messages[movement.kind],
      accent: movement.kind,
      rows: this.getSuccessRows(movement),
      amount: this.formatAmount(movement.amount, movement.kind),
    };
  }

  private getSuccessRows(movement: HydratedMovement): string[] {
    if (movement.kind !== 'transfer') {
      return [
        movement.title,
        this.formatLongDate(movement.date),
        movement.accountLabel,
      ];
    }

    const [origin = 'Cuenta origen', destination = 'Cuenta destino'] =
      movement.accountLabel.split(' -> ');

    return [
      `De: ${origin}`,
      `A: ${destination}`,
      this.formatLongDate(movement.date),
    ];
  }

  private getAccountLabel(kind: MovementKind, record: MovementApiRecord): string {
    const origin = this.getText(record, ['cuentaOrigen', 'CuentaOrigen', 'CUENTAORIGEN']);
    const destination = this.getText(record, [
      'cuentaDestino',
      'CuentaDestino',
      'CUENTADESTINO',
    ]);

    if (kind === 'transfer') {
      return [origin, destination].filter(Boolean).join(' -> ') || 'Sin cuentas';
    }

    return (kind === 'income' ? destination ?? origin : origin ?? destination) ?? 'Sin cuenta';
  }

  private getDraftAccountLabel(draft: MovementFormValue): string {
    if (draft.kind === 'transfer') {
      return [draft.cuentaOrigen, draft.cuentaDestino].filter(Boolean).join(' -> ') || 'Sin cuentas';
    }

    return draft.cuentaOrigen ?? 'Sin cuenta';
  }

  private hasMovementData(
    record: MovementApiRecord,
    movementKind: string | undefined,
    title: string | undefined,
    amount: number | undefined,
    date: Date | undefined,
  ): boolean {
    return Boolean(
      movementKind ||
        title ||
        amount !== undefined ||
        date ||
        this.getText(record, ['cuentaOrigen', 'CuentaOrigen', 'CUENTAORIGEN']) ||
        this.getText(record, ['cuentaDestino', 'CuentaDestino', 'CUENTADESTINO']),
    );
  }

  private toKind(value: string | undefined): MovementKind {
    const normalizedValue = (value ?? '').toLowerCase();

    if (normalizedValue.includes('transfer')) {
      return 'transfer';
    }

    if (normalizedValue.includes('ingreso') || normalizedValue.includes('income')) {
      return 'income';
    }

    return 'expense';
  }

  private getText(record: MovementApiRecord, keys: string[]): string | undefined {
    const value = this.getValue(record, keys);

    if (value === undefined || value === null) {
      return undefined;
    }

    return String(value);
  }

  private getNumber(record: MovementApiRecord, keys: string[]): number | undefined {
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

  private getDate(record: MovementApiRecord, keys: string[]): Date | undefined {
    const value = this.getValue(record, keys);

    if (typeof value !== 'string' && typeof value !== 'number') {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private getValue(record: MovementApiRecord, keys: string[]): unknown {
    return keys.map((key) => record[key]).find((value) => value !== undefined);
  }

  private formatAmount(amount: number, kind: MovementKind): string {
    const sign = kind === 'income' ? '+' : '-';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  }

  private formatGroupLabel(date: Date): string {
    const movementParts = this.getEcuadorDateParts(date);
    const todayParts = this.getEcuadorDateParts();
    const movementDay = this.toLocalDateFromParts(movementParts);
    const todayDay = this.toLocalDateFromParts(todayParts);
    const dayDifference = Math.round(
      (todayDay.getTime() - movementDay.getTime()) / 86_400_000,
    );
    const shortDate = new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIME_ZONE,
      day: 'numeric',
      month: 'long',
    }).format(date);

    if (dayDifference === 0) {
      return `Hoy, ${shortDate}`;
    }

    if (dayDifference === 1) {
      return `Ayer, ${shortDate}`;
    }

    return this.formatLongDate(date);
  }

  private formatLongDate(date: Date): string {
    return new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIME_ZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private formatTime(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: ECUADOR_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date).reduce(
      (dateParts, part) => {
        if (part.type === 'hour' || part.type === 'minute') {
          dateParts[part.type] = part.value;
        }

        return dateParts;
      },
      {
        hour: '',
        minute: '',
      },
    );

    return `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`;
  }

  private getEcuadorDateParts(date = new Date()): Record<'year' | 'month' | 'day', string> {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: ECUADOR_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.formatToParts(date).reduce(
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
      },
    );
  }

  private toLocalDateFromParts(
    parts: Record<'year' | 'month' | 'day', string>,
  ): Date {
    return new Date(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
    );
  }

  private isMovementKind(value: MovementStep): value is MovementKind {
    return value === 'income' || value === 'expense' || value === 'transfer';
  }

  private scrollToTop(): void {
    window.requestAnimationFrame(() => {
      const content = document.querySelector('ion-content') as { scrollToTop?: (duration?: number) => Promise<void> } | null;

      void content?.scrollToTop?.(0);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }
}
