import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  categoryExpenses,
  dashboardNavigation,
  latestMovements,
  metricCards,
  summaryItems,
} from '../../data/dashboard.data';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  readonly navigation = dashboardNavigation;
  readonly metrics = metricCards;
  readonly categories = categoryExpenses;
  readonly summary = summaryItems;
  readonly movements = latestMovements;
}
