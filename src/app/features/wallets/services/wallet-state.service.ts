import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  finalize,
  map,
} from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { WalletApiRecord } from '../models/wallet.models';
import {
  WalletsApiResult,
  WalletsApiService,
} from './wallets-api.service';

export interface ActiveWallet {
  idBilletera: number;
  nombre: string;
  esPrincipal: boolean;
  activo: boolean;
}

type ActiveWalletState = ActiveWallet | null | undefined;

@Injectable({ providedIn: 'root' })
export class WalletStateService {
  private readonly authService = inject(AuthService);
  private readonly walletsApiService = inject(WalletsApiService);
  private readonly storageKey = 'trajectory_active_wallet_id';
  private readonly walletsSubject = new BehaviorSubject<ActiveWallet[]>([]);
  private readonly activeWalletSubject =
    new BehaviorSubject<ActiveWalletState>(undefined);
  private readonly loadingSubject = new BehaviorSubject(false);

  private loadInProgress = false;
  private pendingRefresh = false;

  readonly wallets$ = this.walletsSubject.asObservable();
  readonly activeWallet$ = this.activeWalletSubject.asObservable().pipe(
    filter((wallet): wallet is ActiveWallet | null => wallet !== undefined),
    distinctUntilChanged(
      (previous, current) =>
        previous?.idBilletera === current?.idBilletera &&
        previous?.nombre === current?.nombre &&
        previous?.esPrincipal === current?.esPrincipal &&
        previous?.activo === current?.activo,
    ),
  );
  readonly activeWalletId$ = this.activeWallet$.pipe(
    map((wallet) => wallet?.idBilletera ?? null),
    distinctUntilChanged(),
  );
  readonly loading$ = this.loadingSubject.asObservable();

  constructor() {
    if (this.authService.estaAutenticado()) {
      this.refreshWallets();
    }
  }

  refreshWallets(): void {
    const requestToken = this.authService.obtenerToken();

    if (!requestToken) {
      this.pendingRefresh = false;
      this.loadingSubject.next(false);
      this.walletsSubject.next([]);
      this.activeWalletSubject.next(null);
      return;
    }

    if (this.loadInProgress) {
      this.pendingRefresh = true;
      return;
    }

    this.loadInProgress = true;
    this.pendingRefresh = false;
    this.loadingSubject.next(true);

    this.walletsApiService
      .consultar(true)
      .pipe(
        finalize(() => {
          this.loadInProgress = false;
          this.loadingSubject.next(false);

          if (this.pendingRefresh) {
            this.refreshWallets();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (this.authService.obtenerToken() !== requestToken) {
            this.pendingRefresh = true;
            return;
          }

          this.syncWallets(response);
        },
        error: () => {
          this.walletsSubject.next([]);
          this.activeWalletSubject.next(null);
        },
      });
  }

  syncWallets(response: WalletsApiResult): void {
    const wallets = this.toActiveWallets(response);

    this.walletsSubject.next(wallets);
    this.selectInitialWallet(wallets);
  }

  selectActiveWallet(idBilletera: number): void {
    const wallet = this.walletsSubject.value.find(
      (candidate) => candidate.idBilletera === idBilletera,
    );

    if (!wallet) {
      this.selectInitialWallet(this.walletsSubject.value);
      return;
    }

    this.persistActiveWalletId(wallet.idBilletera);
    this.activeWalletSubject.next(wallet);
  }

  clearActiveWallet(): void {
    localStorage.removeItem(this.storageKey);
    this.walletsSubject.next([]);
    this.activeWalletSubject.next(undefined);
  }

  private selectInitialWallet(wallets: ActiveWallet[]): void {
    if (wallets.length === 0) {
      localStorage.removeItem(this.storageKey);
      this.activeWalletSubject.next(null);
      return;
    }

    const nextWallet = this.resolveActiveWallet(wallets);

    this.persistActiveWalletId(nextWallet.idBilletera);
    this.activeWalletSubject.next(nextWallet);
  }

  private resolveActiveWallet(wallets: ActiveWallet[]): ActiveWallet {
    const savedWalletId = this.getSavedWalletId();
    const savedWallet = savedWalletId
      ? wallets.find((wallet) => wallet.idBilletera === savedWalletId)
      : undefined;

    return (
      savedWallet ??
      wallets.find((wallet) => wallet.esPrincipal) ??
      wallets[0]
    );
  }

  private toActiveWallets(response: WalletsApiResult): ActiveWallet[] {
    return this.extractRecords(response)
      .map((record) => this.toActiveWallet(record))
      .filter((wallet): wallet is ActiveWallet => wallet !== null)
      .sort((left, right) => {
        if (left.esPrincipal !== right.esPrincipal) {
          return left.esPrincipal ? -1 : 1;
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

  private toActiveWallet(record: WalletApiRecord): ActiveWallet | null {
    const activo =
      this.toBoolean(this.getValue(record, ['Activo', 'activo'])) ?? true;

    if (!activo) {
      return null;
    }

    const idBilletera = this.getNumber(record, [
      'IdBilletera',
      'idBilletera',
      'id',
    ]);
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
      activo,
    };
  }

  private getSavedWalletId(): number | null {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    const idBilletera = Number(rawValue);

    if (!Number.isFinite(idBilletera) || idBilletera <= 0) {
      localStorage.removeItem(this.storageKey);
      return null;
    }

    return idBilletera;
  }

  private persistActiveWalletId(idBilletera: number): void {
    localStorage.setItem(this.storageKey, String(idBilletera));
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
}
