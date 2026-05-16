import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { Movement } from '../../models/dashboard.models';

@Component({
  selector: 'app-movements-list',
  templateUrl: './movements-list.component.html',
  styleUrls: ['./movements-list.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementsListComponent {
  @Input({ required: true }) movements: Movement[] = [];
}
