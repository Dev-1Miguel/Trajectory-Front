import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import {
  MovementFormValue,
  MovementKind,
  MovementOption,
  MovementStep,
  SuccessSummary,
} from '../../models/movements.models';

@Component({
  selector: 'app-movement-workbench',
  templateUrl: './movement-workbench.component.html',
  styleUrls: ['./movement-workbench.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementWorkbenchComponent {
  @Input({ required: true }) currentStep: MovementStep = 'selector';
  @Input({ required: true }) title = 'Nuevo movimiento';
  @Input({ required: true }) kind: MovementKind = 'income';
  @Input({ required: true }) movementOptions: MovementOption[] = [];
  @Input({ required: true }) successSummary!: SuccessSummary;
  @Input() saving = false;
  @Input() errorMessage = '';

  @Output() showList = new EventEmitter<void>();
  @Output() openSelector = new EventEmitter<void>();
  @Output() openForm = new EventEmitter<MovementKind>();
  @Output() save = new EventEmitter<MovementFormValue>();
}
