import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { NavigationItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  @Input({ required: true }) navigation: NavigationItem[] = [];
}
