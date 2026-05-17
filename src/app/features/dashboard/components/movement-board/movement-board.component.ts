import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import {
  BottomNavigationItem,
  MovementEntry,
  MovementFilter,
  MovementGroup,
} from '../movements-page/movements-page.models';

@Component({
  selector: 'app-movement-board',
  templateUrl: './movement-board.component.html',
  styleUrls: ['./movement-board.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementBoardComponent {
  @Input({ required: true }) filters: MovementFilter[] = [];
  @Input({ required: true }) selectedFilter: MovementFilter['id'] = 'all';
  @Input({ required: true }) groups: MovementGroup[] = [];
  @Input({ required: true }) bottomNavigation: BottomNavigationItem[] = [];

  @Output() filterChange = new EventEmitter<MovementFilter['id']>();
  @Output() addMovement = new EventEmitter<void>();

  trackByLabel(_: number, group: MovementGroup): string {
    return group.label;
  }

  trackByMovement(_: number, movement: MovementEntry): string {
    return `${movement.title}-${movement.time}`;
  }
}
