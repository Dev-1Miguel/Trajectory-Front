import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

type MovementKind = 'income' | 'expense' | 'transfer';

@Component({
  selector: 'app-movement-form',
  templateUrl: './movement-form.component.html',
  styleUrls: ['./movement-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementFormComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) kind: MovementKind = 'income';

  @Output() back = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  get buttonText(): string {
    const labels: Record<MovementKind, string> = {
      income: 'Guardar ingreso',
      expense: 'Guardar gasto',
      transfer: 'Guardar transferencia',
    };

    return labels[this.kind];
  }

  get isTransfer(): boolean {
    return this.kind === 'transfer';
  }
}
