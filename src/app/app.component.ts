import { Component } from '@angular/core';

import { dashboardNavigation } from './features/dashboard/data/dashboard.data';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  readonly navigation = dashboardNavigation;
}
