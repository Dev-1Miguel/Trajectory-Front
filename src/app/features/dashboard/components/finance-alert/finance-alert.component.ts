import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type FinanceAlertTone = 'success' | 'danger' | 'neutral';

@Component({
  selector: 'app-finance-alert',
  templateUrl: './finance-alert.component.html',
  styleUrls: ['./finance-alert.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceAlertComponent {
  @Input() totalIngresos = 0;
  @Input() totalGastos = 0;
  @Input() balance = 0;

  dismissed = false;

  dismiss(): void {
    this.dismissed = true;
  }

  private readonly currencyFormatter = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  });

  get tone(): FinanceAlertTone {
    if (this.totalIngresos === 0 && this.totalGastos === 0) {
      return 'neutral';
    }

    return this.balance >= 0 ? 'success' : 'danger';
  }

  get iconName(): string {
    if (this.tone === 'danger') {
      return 'warning-outline';
    }

    if (this.tone === 'neutral') {
      return 'information-circle-outline';
    }

    return 'checkmark-outline';
  }

  get title(): string {
    if (this.tone === 'danger') {
      return 'Atencion al gasto';
    }

    if (this.tone === 'neutral') {
      return 'Sin movimientos';
    }

    return 'Balance positivo';
  }

  get message(): string {
    if (this.tone === 'danger') {
      return 'Tus gastos superan tus ingresos en el periodo.';
    }

    if (this.tone === 'neutral') {
      return 'No hay ingresos ni gastos registrados en el periodo.';
    }

    return 'Tus ingresos son mayores o iguales que tus gastos en el periodo.';
  }

  get detail(): string {
    return `Balance: ${this.currencyFormatter.format(this.balance)}`;
  }
}
