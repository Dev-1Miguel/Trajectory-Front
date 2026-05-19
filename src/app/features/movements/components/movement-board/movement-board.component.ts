import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

import {
  BottomNavigationItem,
  MovementEntry,
  MovementFilter,
  MovementGroup,
} from '../../models/movements.models';

@Component({
  selector: 'app-movement-board',
  templateUrl: './movement-board.component.html',
  styleUrls: ['./movement-board.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementBoardComponent {
  private readonly router = inject(Router);

  @Input({ required: true }) filters: MovementFilter[] = [];
  @Input({ required: true }) selectedFilter: MovementFilter['id'] = 'all';
  @Input({ required: true }) groups: MovementGroup[] = [];
  @Input({ required: true }) bottomNavigation: BottomNavigationItem[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';

  @Output() filterChange = new EventEmitter<MovementFilter['id']>();
  @Output() addMovement = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  trackByLabel(_: number, group: MovementGroup): string {
    return group.label;
  }

  trackByMovement(_: number, movement: MovementEntry): string {
    return movement.id ? String(movement.id) : `${movement.title}-${movement.time}`;
  }

  navigateFromBottomNavigation(item: BottomNavigationItem, event: Event): void {
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
}
