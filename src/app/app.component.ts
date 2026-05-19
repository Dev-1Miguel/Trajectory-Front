import { Component } from '@angular/core';

import { dashboardNavigation } from './shared/constants/navigation.constants';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  readonly navigation = dashboardNavigation;
}
