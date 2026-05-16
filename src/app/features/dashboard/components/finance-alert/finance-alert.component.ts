import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-finance-alert',
  templateUrl: './finance-alert.component.html',
  styleUrls: ['./finance-alert.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceAlertComponent {}
