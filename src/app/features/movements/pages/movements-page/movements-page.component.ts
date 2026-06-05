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
  CategoriesApiResult,
  CategoriesApiService,
} from '../../../categories/services/categories-api.service';
import {
  CategoryApiRecord,
  CategoryMovementType,
} from '../../../categories/models/category.models';
import { WalletApiRecord } from '../../../wallets/models/wallet.models';
import {
  WalletsApiResult,
  WalletsApiService,
} from '../../../wallets/services/wallets-api.service';
import { WalletStateService } from '../../../wallets/services/wallet-state.service';
import {
  MovementApiRecord,
  MovementPayload,
  MovementQuery,
  MovementsApiService,
} from '../../services/movements-api.service';
import {
  MovementChangePayload,
  MovementStateService,
} from '../../services/movement-state.service';
import {
  BottomNavigationItem,
  MovementCategoryOption,
  MovementEntry,
  MovementFilter,
  MovementFormValue,
  MovementGroup,
  MovementKind,
  MovementOption,
  MovementStep,
  MovementWalletOption,
  SuccessSummary,
} from '../../models/movements.models';

interface HydratedMovement {
  id?: number;
  title: string;
  description: string;
  amount: number;
  date: Date;
  kind: MovementKind;
  accountLabel: string;
  categoryName?: string;
  walletName?: string;
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
  private readonly movementStateService = inject(MovementStateService);
  private readonly categoriesApiService = inject(CategoriesApiService);
  private readonly walletsApiService = inject(WalletsApiService);
  private readonly walletStateService = inject(WalletStateService);
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
    { label: 'Categor\u00edas', icon: 'pricetags-outline', route: '/categorias' },
    { label: 'Billeteras', icon: 'wallet-outline', route: '/billeteras' },
    { label: 'Reportes', icon: 'bar-chart-outline', route: '/reportes' },
    { label: 'Configuracion', icon: 'settings-outline' },
  ];

  movementGroups: MovementGroup[] = [];
  selectedFilter: MovementFilter['id'] = 'all';
  currentStep: MovementStep = 'list';
  lastSavedKind: MovementKind = 'income';
  isLoadingMovements = false;
  isSavingMovement = false;
  isLoadingCategories = false;
  isLoadingWallets = false;
  movementError = '';
  saveError = '';
  categoryError = '';
  walletError = '';
  movementCategories: MovementCategoryOption[] = [];
  movementWallets: MovementWalletOption[] = [];

  private readonly destroy$ = new Subject<void>();
  private activeWalletId: number | null = null;
  private movementRequestId = 0;
  private lastSavedSummary: SuccessSummary = {
    title: 'Movimiento guardado',
    message: 'Tu movimiento se ha registrado correctamente.',
    accent: 'income',
    rows: ['Movimiento', this.formatLongDate(new Date()), 'Sin cuenta'],
    amount: '+$0.00',
  };

  ngOnInit(): void {
    this.walletStateService.activeWalletId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((idBilletera) => {
        this.activeWalletId = idBilletera;
        this.loadMovements();
      });

    this.movementStateService.movementChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((change) => {
        if (this.shouldRefreshForMovement(change)) {
          this.loadMovements();
        }
      });
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
    const requestId = ++this.movementRequestId;
    const query = this.buildMovementQuery();

    this.isLoadingMovements = true;
    this.movementError = '';
    this.changeDetectorRef.markForCheck();

    this.movementsApiService
      .consultar(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (requestId !== this.movementRequestId) {
            return;
          }

          this.isLoadingMovements = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.movementRequestId) {
            return;
          }

          this.movementGroups = this.toMovementGroups(response.data);
        },
        error: () => {
          if (requestId !== this.movementRequestId) {
            return;
          }

          this.movementGroups = [];
          this.movementError = 'No se pudieron cargar los movimientos.';
        },
      });
  }

  private buildMovementQuery(): MovementQuery {
    const query: MovementQuery = {};

    if (this.selectedFilter !== 'all') {
      query.tipoMovimiento = KIND_TO_API[this.selectedFilter];
    }

    if (this.activeWalletId) {
      query.idBilletera = this.activeWalletId;
    }

    return query;
  }

  private loadCategoriesForMovement(kind: MovementKind): void {
    if (kind === 'transfer') {
      this.movementCategories = [];
      this.isLoadingCategories = false;
      this.categoryError = '';
      this.changeDetectorRef.markForCheck();
      return;
    }

    const requestedKind = kind;
    const tipoMovimiento = KIND_TO_API[kind] as CategoryMovementType;

    this.isLoadingCategories = true;
    this.categoryError = '';
    this.movementCategories = [];
    this.changeDetectorRef.markForCheck();

    this.categoriesApiService
      .consultar(true)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (this.currentStep === requestedKind) {
            this.isLoadingCategories = false;
            this.changeDetectorRef.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (this.currentStep !== requestedKind) {
            return;
          }

          this.movementCategories = this.toMovementCategoryOptions(
            response,
            tipoMovimiento,
          );
        },
        error: () => {
          if (this.currentStep !== requestedKind) {
            return;
          }

          this.movementCategories = [];
          this.categoryError = 'No se pudieron cargar las categorias.';
        },
      });
  }

  private loadWalletsForMovement(kind: MovementKind): void {
    const requestedKind = kind;

    this.isLoadingWallets = true;
    this.walletError = '';
    this.movementWallets = [];
    this.changeDetectorRef.markForCheck();

    this.walletsApiService
      .consultar(true)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (this.currentStep === requestedKind) {
            this.isLoadingWallets = false;
            this.changeDetectorRef.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (this.currentStep !== requestedKind) {
            return;
          }

          this.movementWallets = this.toMovementWalletOptions(response);
        },
        error: () => {
          if (this.currentStep !== requestedKind) {
            return;
          }

          this.movementWallets = [];
          this.walletError = 'No se pudieron cargar las billeteras.';
        },
      });
  }

  setFilter(filter: MovementFilter['id']): void {
    this.selectedFilter = filter;
    this.loadMovements();
  }

  openSelector(): void {
    this.saveError = '';
    this.categoryError = '';
    this.walletError = '';
    this.currentStep = 'selector';
    this.scrollToTop();
  }

  openForm(kind: MovementKind): void {
    this.saveError = '';
    this.categoryError = '';
    this.walletError = '';
    this.currentStep = kind;
    this.loadCategoriesForMovement(kind);
    this.loadWalletsForMovement(kind);
    this.scrollToTop();
  }

  showList(): void {
    this.saveError = '';
    this.categoryError = '';
    this.walletError = '';
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
      idCategoria: draft.kind === 'transfer' ? null : draft.idCategoria ?? null,
      idBilletera:
        draft.idBilletera && draft.idBilletera > 0 ? draft.idBilletera : null,
      cuentaOrigen: draft.kind === 'income' ? undefined : draft.cuentaOrigen,
      cuentaDestino: draft.kind === 'income' ? draft.cuentaOrigen : draft.cuentaDestino,
      fechaMovimiento: draft.fechaMovimiento,
    };
  }

  private shouldRefreshForMovement(change: MovementChangePayload): boolean {
    return !this.activeWalletId || change.idBilletera === this.activeWalletId;
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

  private toMovementCategoryOptions(
    response: CategoriesApiResult,
    tipoMovimiento: CategoryMovementType,
  ): MovementCategoryOption[] {
    return this.extractCategoryRecords(response)
      .map((record) => this.toMovementCategoryOption(record, tipoMovimiento))
      .filter(
        (category): category is MovementCategoryOption => category !== null,
      )
      .sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'));
  }

  private toMovementWalletOptions(
    response: WalletsApiResult,
  ): MovementWalletOption[] {
    return this.extractWalletRecords(response)
      .map((record) => this.toMovementWalletOption(record))
      .filter((wallet): wallet is MovementWalletOption => wallet !== null)
      .sort((left, right) => {
        if (left.esPrincipal !== right.esPrincipal) {
          return left.esPrincipal ? -1 : 1;
        }

        return left.nombre.localeCompare(right.nombre, 'es');
      });
  }

  private extractCategoryRecords(
    response: CategoriesApiResult,
  ): CategoryApiRecord[] {
    return Array.isArray(response)
      ? response
      : Array.isArray(response.data)
        ? response.data
        : [];
  }

  private extractWalletRecords(response: WalletsApiResult): WalletApiRecord[] {
    return Array.isArray(response)
      ? response
      : Array.isArray(response.data)
        ? response.data
        : [];
  }

  private toMovementCategoryOption(
    record: CategoryApiRecord,
    tipoMovimiento: CategoryMovementType,
  ): MovementCategoryOption | null {
    const isActive = this.toBoolean(this.getValue(record, ['Activo', 'activo']));

    if (isActive === false) {
      return null;
    }

    const recordType = this.toCategoryMovementType(
      this.getText(record, ['TipoMovimiento', 'tipoMovimiento']),
    );

    if (recordType !== tipoMovimiento) {
      return null;
    }

    const idCategoria = this.getNumber(record, ['IdCategoria', 'idCategoria', 'id']);
    const nombre = this.getText(record, ['Nombre', 'nombre']);

    if (idCategoria === undefined || !nombre) {
      return null;
    }

    return {
      idCategoria,
      nombre,
    };
  }

  private toMovementWalletOption(
    record: WalletApiRecord,
  ): MovementWalletOption | null {
    const isActive = this.toBoolean(this.getValue(record, ['Activo', 'activo']));

    if (isActive === false) {
      return null;
    }

    const idBilletera = this.getNumber(record, ['IdBilletera', 'idBilletera', 'id']);
    const nombre = this.getText(record, ['Nombre', 'nombre']);

    if (idBilletera === undefined || !nombre) {
      return null;
    }

    return {
      idBilletera,
      nombre,
      esPrincipal:
        this.toBoolean(this.getValue(record, ['EsPrincipal', 'esPrincipal'])) ??
        false,
    };
  }

  private toHydratedMovement(record: MovementApiRecord | undefined): HydratedMovement | null {
    if (!record) {
      return null;
    }

    const movementKind = this.getText(record, ['tipoMovimiento', 'TipoMovimiento', 'TIPOMOVIMIENTO']);
    const title = this.getText(record, ['titulo', 'Titulo', 'TITULO', 'nombre', 'Nombre']);
    const amount = this.getNumber(record, ['monto', 'Monto', 'MONTO']);
    const date = this.getDate(record, ['fechaMovimiento', 'FechaMovimiento', 'FECHAMOVIMIENTO']);
    const categoryName = this.getText(record, ['nombreCategoria', 'NombreCategoria', 'NOMBRECATEGORIA']);
    const walletName = this.getText(record, ['nombreBilletera', 'NombreBilletera', 'NOMBREBILLETERA']);

    if (!this.hasMovementData(record, movementKind, title, amount, date)) {
      return null;
    }

    const kind = this.toKind(movementKind);
    const movementDate = date ?? new Date();
    const accountLabel = this.getAccountLabel(kind, record);

    return {
      id: this.getNumber(record, ['idMovimiento', 'IdMovimiento', 'IDMOVIMIENTO', 'id']),
      title: title ?? 'Movimiento',
      description: this.getMovementDescription(kind, categoryName, walletName, accountLabel),
      amount: amount ?? 0,
      date: movementDate,
      kind,
      accountLabel,
      categoryName,
      walletName,
    };
  }

  private toHydratedMovementFromDraft(draft: MovementFormValue): HydratedMovement {
    const date = draft.fechaMovimiento ? new Date(draft.fechaMovimiento) : new Date();
    const accountLabel = this.getDraftAccountLabel(draft);
    const categoryName = this.getDraftCategoryName(draft);
    const walletName = this.getDraftWalletName(draft);

    return {
      title: draft.titulo,
      description: this.getMovementDescription(draft.kind, categoryName, walletName, accountLabel),
      amount: draft.monto,
      date,
      kind: draft.kind,
      accountLabel,
      categoryName,
      walletName,
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
        movement.walletName ?? movement.accountLabel,
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

  private getMovementDescription(
    kind: MovementKind,
    categoryName: string | undefined,
    walletName: string | undefined,
    accountLabel: string,
  ): string {
    if (walletName) {
      return [KIND_LABEL[kind], categoryName, walletName].filter(Boolean).join(' \u00b7 ');
    }

    if (categoryName) {
      return [KIND_LABEL[kind], categoryName, accountLabel].filter(Boolean).join(' \u00b7 ');
    }

    return `${KIND_LABEL[kind]} - ${accountLabel}`;
  }

  private getDraftAccountLabel(draft: MovementFormValue): string {
    if (draft.kind === 'transfer') {
      return [draft.cuentaOrigen, draft.cuentaDestino].filter(Boolean).join(' -> ') || 'Sin cuentas';
    }

    return draft.cuentaOrigen ?? 'Sin cuenta';
  }

  private getDraftCategoryName(draft: MovementFormValue): string | undefined {
    if (draft.kind === 'transfer' || !draft.idCategoria) {
      return undefined;
    }

    return this.movementCategories.find(
      (category) => category.idCategoria === draft.idCategoria,
    )?.nombre;
  }

  private getDraftWalletName(draft: MovementFormValue): string | undefined {
    if (!draft.idBilletera) {
      return undefined;
    }

    return this.movementWallets.find(
      (wallet) => wallet.idBilletera === draft.idBilletera,
    )?.nombre;
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

  private toCategoryMovementType(
    value: string | undefined,
  ): CategoryMovementType | undefined {
    const normalizedValue = (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalizedValue.includes('ingreso')) {
      return 'Ingreso';
    }

    if (normalizedValue.includes('gasto')) {
      return 'Gasto';
    }

    return undefined;
  }

  private toBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();

      if (['true', '1', 'activo'].includes(normalizedValue)) {
        return true;
      }

      if (['false', '0', 'inactivo'].includes(normalizedValue)) {
        return false;
      }
    }

    return undefined;
  }

  private getText(record: Record<string, unknown>, keys: string[]): string | undefined {
    const value = this.getValue(record, keys);

    if (value === undefined || value === null) {
      return undefined;
    }

    const text = String(value).trim();

    return text.length > 0 ? text : undefined;
  }

  private getNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
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

  private getDate(record: Record<string, unknown>, keys: string[]): Date | undefined {
    const value = this.getValue(record, keys);

    if (typeof value !== 'string' && typeof value !== 'number') {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private getValue(record: Record<string, unknown>, keys: string[]): unknown {
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
