import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { SummaryItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-monthly-summary',
  templateUrl: './monthly-summary.component.html',
  styleUrls: ['./monthly-summary.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlySummaryComponent {
  @Input({ required: true }) items: SummaryItem[] = [];
}
