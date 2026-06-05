import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import type { ToggleCustomEvent } from '@ionic/angular';

import { AuthService } from '../../../../core/auth/auth.service';
import { NavigationItem } from '../../../../shared/models/navigation-item.model';
import { WalletStateService } from '../../../wallets/services/wallet-state.service';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly walletStateService = inject(WalletStateService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly darkModeClass = 'ion-palette-dark';

  readonly activeWallet$ = this.walletStateService.activeWallet$;
  readonly loadingWallets$ = this.walletStateService.loading$;

  readonly bottomNavigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home' },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos' },
    { label: 'Categorias', icon: 'pricetags-outline', route: '/categorias' },
    { label: 'Billeteras', icon: 'wallet-outline', route: '/billeteras' },
    { label: 'Reportes', icon: 'bar-chart-outline', route: '/reportes' },
    { label: 'Configuracion', icon: 'settings-outline', route: '/configuracion', active: true },
  ];

  darkModeEnabled = false;

  constructor() {
    this.darkModeEnabled = this.document.documentElement.classList.contains(
      this.darkModeClass,
    );
  }

  navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
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

  toggleDarkMode(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.setDarkMode(!this.darkModeEnabled);
  }

  onDarkModeToggleClick(event: Event): void {
    event.stopPropagation();
  }

  onDarkModeToggleChange(event: Event): void {
    event.stopPropagation();
    this.setDarkMode(Boolean((event as ToggleCustomEvent).detail.checked));
  }

  logout(): void {
    this.walletStateService.clearActiveWallet();
    this.authService.logout().subscribe(() => {
      void this.router.navigateByUrl('/auth/login');
    });
  }

  releaseNavigationFocus(event?: Event): void {
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  private setDarkMode(isEnabled: boolean): void {
    this.darkModeEnabled = isEnabled;
    this.document.documentElement.classList.toggle(this.darkModeClass, isEnabled);
    this.changeDetectorRef.markForCheck();
  }
}
