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

  darkModeEnabled = false;

  constructor() {
    this.darkModeEnabled = this.document.documentElement.classList.contains(
      this.darkModeClass,
    );
  }

  navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
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

  private setDarkMode(isEnabled: boolean): void {
    this.darkModeEnabled = isEnabled;
    this.document.documentElement.classList.toggle(this.darkModeClass, isEnabled);
    this.changeDetectorRef.markForCheck();
  }
}
