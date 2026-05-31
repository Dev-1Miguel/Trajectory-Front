import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';

import { NavigationItem } from '../../shared/models/navigation-item.model';
import {
  WalletApiRecord,
  WalletPayload,
} from './models/wallet.models';
import {
  WalletsApiResult,
  WalletsApiService,
} from './services/wallets-api.service';
import { WalletStateService } from './services/wallet-state.service';

interface WalletViewModel {
  idBilletera: number;
  nombre: string;
  descripcion: string;
  esPrincipal: boolean;
  activo: boolean;
  fechaCreacion?: string;
}

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.page.html',
  styleUrls: ['./wallets.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletsPage implements OnInit, OnDestroy {
  private readonly walletsApiService = inject(WalletsApiService);
  private readonly walletStateService = inject(WalletStateService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly bottomNavigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home' },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos' },
    { label: 'Categorias', icon: 'pricetags-outline', route: '/categorias' },
    { label: 'Billeteras', icon: 'wallet-outline', route: '/billeteras', active: true },
    { label: 'Reportes', icon: 'bar-chart-outline' },
    { label: 'Configuracion', icon: 'settings-outline' },
  ];

  readonly form = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', Validators.maxLength(200)],
    esPrincipal: [false],
  });

  wallets: WalletViewModel[] = [];
  editingWallet?: WalletViewModel;
  isLoadingWallets = false;
  isSavingWallet = false;
  walletError = '';
  formError = '';
  formSuccess = '';

  private readonly stateChanges = new Set<number>();
  private readonly principalChanges = new Set<number>();

  ngOnInit(): void {
    this.loadWallets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get formTitle(): string {
    return this.editingWallet ? 'Editar billetera' : 'Nueva billetera';
  }

  loadWallets(): void {
    this.isLoadingWallets = true;
    this.walletError = '';
    this.changeDetectorRef.markForCheck();

    this.walletsApiService
      .consultar()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingWallets = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.wallets = this.toWallets(response);
          this.walletStateService.syncWallets(response);
        },
        error: () => {
          this.wallets = [];
          this.walletError = 'No se pudieron cargar las billeteras.';
        },
      });
  }

  editWallet(wallet: WalletViewModel): void {
    this.editingWallet = wallet;
    this.formError = '';
    this.formSuccess = '';
    this.form.setValue({
      nombre: wallet.nombre,
      descripcion: wallet.descripcion,
      esPrincipal: wallet.esPrincipal,
    });
  }

  cancelEdit(): void {
    this.editingWallet = undefined;
    this.formError = '';
    this.formSuccess = '';
    this.form.reset({
      nombre: '',
      descripcion: '',
      esPrincipal: false,
    });
  }

  saveWallet(): void {
    if (this.form.invalid || this.isSavingWallet) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.toPayload();

    if (!payload) {
      return;
    }

    this.isSavingWallet = true;
    this.formError = '';
    this.formSuccess = '';
    this.changeDetectorRef.markForCheck();

    const request = this.editingWallet
      ? this.walletsApiService.actualizar(
          this.editingWallet.idBilletera,
          payload,
        )
      : this.walletsApiService.crear(payload);

    request
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSavingWallet = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          const successMessage = this.editingWallet
            ? 'Billetera actualizada correctamente.'
            : 'Billetera creada correctamente.';
          this.cancelEdit();
          this.formSuccess = successMessage;
          this.loadWallets();
        },
        error: () => {
          this.formError = 'No se pudo guardar la billetera.';
        },
      });
  }

  changeWalletState(wallet: WalletViewModel): void {
    if (this.stateChanges.has(wallet.idBilletera)) {
      return;
    }

    const nextState = !wallet.activo;
    this.stateChanges.add(wallet.idBilletera);
    this.walletError = '';
    this.changeDetectorRef.markForCheck();

    this.walletsApiService
      .cambiarEstado(wallet.idBilletera, nextState)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.stateChanges.delete(wallet.idBilletera);
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          if (this.editingWallet?.idBilletera === wallet.idBilletera) {
            this.cancelEdit();
          }

          this.loadWallets();
        },
        error: () => {
          this.walletError = 'No se pudo cambiar el estado de la billetera.';
        },
      });
  }

  markAsPrincipal(wallet: WalletViewModel): void {
    if (
      wallet.esPrincipal ||
      !wallet.activo ||
      this.principalChanges.has(wallet.idBilletera)
    ) {
      return;
    }

    this.principalChanges.add(wallet.idBilletera);
    this.walletError = '';
    this.changeDetectorRef.markForCheck();

    this.walletsApiService
      .marcarPrincipal(wallet.idBilletera)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.principalChanges.delete(wallet.idBilletera);
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.loadWallets();
        },
        error: () => {
          this.walletError = 'No se pudo marcar la billetera principal.';
        },
      });
  }

  isChangingState(wallet: WalletViewModel): boolean {
    return this.stateChanges.has(wallet.idBilletera);
  }

  isMarkingPrincipal(wallet: WalletViewModel): boolean {
    return this.principalChanges.has(wallet.idBilletera);
  }

  trackByWallet(_: number, wallet: WalletViewModel): number {
    return wallet.idBilletera;
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

  private toPayload(): WalletPayload | null {
    const value = this.form.getRawValue();
    const nombre = value.nombre.trim();
    const descripcion = value.descripcion.trim();

    if (!nombre) {
      this.form.controls.nombre.setErrors({ required: true });
      this.form.markAllAsTouched();
      return null;
    }

    return {
      nombre,
      descripcion: descripcion.length > 0 ? descripcion : undefined,
      esPrincipal: value.esPrincipal,
    };
  }

  private toWallets(response: WalletsApiResult): WalletViewModel[] {
    return this.extractRecords(response)
      .map((record) => this.toWallet(record))
      .filter((wallet): wallet is WalletViewModel => wallet !== null)
      .sort((left, right) => {
        if (left.esPrincipal !== right.esPrincipal) {
          return left.esPrincipal ? -1 : 1;
        }

        if (left.activo !== right.activo) {
          return left.activo ? -1 : 1;
        }

        return left.nombre.localeCompare(right.nombre, 'es');
      });
  }

  private extractRecords(response: WalletsApiResult): WalletApiRecord[] {
    return Array.isArray(response)
      ? response
      : Array.isArray(response.data)
        ? response.data
        : [];
  }

  private toWallet(record: WalletApiRecord): WalletViewModel | null {
    const idBilletera = this.getNumber(record, ['IdBilletera', 'idBilletera', 'id']);
    const nombre = this.getText(record, ['Nombre', 'nombre']);

    if (idBilletera === undefined || !nombre) {
      return null;
    }

    return {
      idBilletera,
      nombre,
      descripcion: this.getText(record, ['Descripcion', 'descripcion']) ?? '',
      esPrincipal:
        this.toBoolean(this.getValue(record, ['EsPrincipal', 'esPrincipal'])) ??
        false,
      activo:
        this.toBoolean(this.getValue(record, ['Activo', 'activo'])) ?? true,
      fechaCreacion: this.formatDate(
        this.getText(record, ['FechaCreacion', 'fechaCreacion']),
      ),
    };
  }

  private getText(
    record: WalletApiRecord,
    keys: string[],
  ): string | undefined {
    const value = this.getValue(record, keys);

    if (value === undefined || value === null) {
      return undefined;
    }

    const text = String(value).trim();

    return text.length > 0 ? text : undefined;
  }

  private getNumber(
    record: WalletApiRecord,
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

  private getValue(record: WalletApiRecord, keys: string[]): unknown {
    return keys.map((key) => record[key]).find((value) => value !== undefined);
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

      if (['true', '1', 'activo', 'principal'].includes(normalizedValue)) {
        return true;
      }

      if (['false', '0', 'inactivo'].includes(normalizedValue)) {
        return false;
      }
    }

    return undefined;
  }

  private formatDate(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
