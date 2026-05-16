import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MetricCard } from '../../models/dashboard.models';

@Component({
  selector: 'app-metric-card',
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  @Input({ required: true }) metric!: MetricCard;
}
