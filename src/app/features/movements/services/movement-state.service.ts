import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type MovementChangeOperation = 'created' | 'updated' | 'deleted';

export interface MovementChangePayload {
  idBilletera: number;
  idMovimiento?: number;
  operation: MovementChangeOperation;
}

type MovementChangeInput = Omit<MovementChangePayload, 'operation'>;

@Injectable({ providedIn: 'root' })
export class MovementStateService {
  private readonly movementChangedSubject = new Subject<MovementChangePayload>();

  readonly movementChanged$ = this.movementChangedSubject.asObservable();

  notifyMovementCreated(payload: MovementChangeInput): void {
    this.notifyMovementChanged({ ...payload, operation: 'created' });
  }

  notifyMovementUpdated(payload: MovementChangeInput): void {
    this.notifyMovementChanged({ ...payload, operation: 'updated' });
  }

  notifyMovementDeleted(payload: MovementChangeInput): void {
    this.notifyMovementChanged({ ...payload, operation: 'deleted' });
  }

  private notifyMovementChanged(payload: MovementChangePayload): void {
    if (!Number.isFinite(payload.idBilletera) || payload.idBilletera <= 0) {
      return;
    }

    this.movementChangedSubject.next(payload);
  }
}
