import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Movement } from '../../models/dashboard.models';

@Component({
  selector: 'app-movements-list',
  templateUrl: './movements-list.component.html',
  styleUrls: ['./movements-list.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementsListComponent {
  private readonly router = inject(Router);

  @Input({ required: true }) movements: Movement[] = [];

  navigateToMovements(event: Event): void {
    this.releaseNavigationFocus(event);

    window.requestAnimationFrame(() => {
      this.releaseNavigationFocus();
      void this.router.navigateByUrl('/movimientos');
    });
  }

  private releaseNavigationFocus(event?: Event): void {
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
