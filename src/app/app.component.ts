import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { SessionActivityService } from './core/auth/session-activity.service';
import { dashboardNavigation } from './shared/constants/navigation.constants';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly sessionActivityService = inject(SessionActivityService);

  readonly navigation = dashboardNavigation;
  isAuthRoute = false;

  constructor() {
    this.updateShellLayout(this.document.location.pathname);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateShellLayout(event.urlAfterRedirects));
  }

  private updateShellLayout(url: string): void {
    this.isAuthRoute = url.startsWith('/auth');
  }
}
