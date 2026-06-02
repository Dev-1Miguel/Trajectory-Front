import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, NgZone, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  Subscription,
  filter,
  fromEvent,
  merge,
  throttleTime,
  timer,
} from 'rxjs';

import { WalletStateService } from '../../features/wallets/services/wallet-state.service';
import { AuthService } from './auth.service';
import { SESSION_IDLE_TIMEOUT_MS } from './session.constants';

@Injectable({ providedIn: 'root' })
export class SessionActivityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly subscriptions = new Subscription();
  private inactivityTimer?: Subscription;

  constructor() {
    this.listenForActivity();
    this.resetInactivityTimer();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.inactivityTimer?.unsubscribe();
  }

  private listenForActivity(): void {
    const activityEvents = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    this.ngZone.runOutsideAngular(() => {
      const activity$ = merge(
        ...activityEvents.map((eventName) =>
          fromEvent(this.document, eventName, {
            passive: true,
          } as AddEventListenerOptions),
        ),
      ).pipe(throttleTime(1000, undefined, { leading: true, trailing: true }));

      this.subscriptions.add(
        activity$.subscribe(() => this.resetInactivityTimer()),
      );
    });

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => this.resetInactivityTimer()),
    );
  }

  private resetInactivityTimer(): void {
    this.inactivityTimer?.unsubscribe();

    if (!this.authService.estaAutenticado()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = timer(SESSION_IDLE_TIMEOUT_MS).subscribe(() =>
        this.ngZone.run(() => this.closeSessionByInactivity()),
      );
    });
  }

  private closeSessionByInactivity(): void {
    if (!this.authService.estaAutenticado()) {
      return;
    }

    this.authService.clearSession();
    this.injector.get(WalletStateService).clearActiveWallet();

    void this.router.navigate(['/auth/login'], {
      queryParams: { sessionExpired: '1' },
    });
  }
}
