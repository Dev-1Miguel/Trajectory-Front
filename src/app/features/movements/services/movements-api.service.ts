import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { MovementStateService } from './movement-state.service';

export interface StoredProcedureResponse<T = MovementApiRecord> {
  data: T[];
  rowsAffected: number[];
  output: Record<string, unknown>;
}

export interface MovementApiRecord {
  [key: string]: unknown;
}

export interface MovementQuery {
  tipoMovimiento?: string;
  fechaInicio?: string;
  fechaFin?: string;
  idBilletera?: number;
}

export interface MovementPayload {
  tipoMovimiento: string;
  titulo: string;
  descripcion?: string;
  monto: number;
  idCategoria?: number | null;
  idBilletera?: number | null;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  fechaMovimiento?: string;
}

@Injectable({ providedIn: 'root' })
export class MovementsApiService {
  private readonly http = inject(HttpClient);
  private readonly movementStateService = inject(MovementStateService);
  private readonly movementsUrl = `${environment.apiUrl}/movimientos`;

  consultar(query: MovementQuery = {}): Observable<StoredProcedureResponse> {
    return this.http.get<StoredProcedureResponse>(this.movementsUrl, {
      params: this.toParams(query),
    });
  }

  crear(payload: MovementPayload): Observable<StoredProcedureResponse> {
    return this.http.post<StoredProcedureResponse>(this.movementsUrl, payload).pipe(
      tap((response) => this.notifyCreated(payload, response)),
    );
  }

  actualizar(
    id: number,
    payload: MovementPayload,
  ): Observable<StoredProcedureResponse> {
    return this.http.put<StoredProcedureResponse>(
      `${this.movementsUrl}/${id}`,
      payload,
    ).pipe(
      tap((response) => this.notifyUpdated(id, payload, response)),
    );
  }

  eliminar(
    id: number,
    idBilletera: number,
  ): Observable<StoredProcedureResponse> {
    return this.http.delete<StoredProcedureResponse>(
      `${this.movementsUrl}/${id}`,
    ).pipe(
      tap(() =>
        this.movementStateService.notifyMovementDeleted({
          idBilletera,
          idMovimiento: id,
        }),
      ),
    );
  }

  private toParams(query: MovementQuery): HttpParams {
    return Object.entries(query).reduce((params, [key, value]) => {
      if (value === undefined || value === '') {
        return params;
      }

      return params.set(key, value);
    }, new HttpParams());
  }

  private notifyCreated(
    payload: MovementPayload,
    response: StoredProcedureResponse,
  ): void {
    const idBilletera = this.toPositiveNumber(payload.idBilletera);

    if (!idBilletera) {
      return;
    }

    this.movementStateService.notifyMovementCreated({
      idBilletera,
      idMovimiento: this.extractMovementId(response),
    });
  }

  private notifyUpdated(
    id: number,
    payload: MovementPayload,
    response: StoredProcedureResponse,
  ): void {
    const idBilletera = this.toPositiveNumber(payload.idBilletera);

    if (!idBilletera) {
      return;
    }

    this.movementStateService.notifyMovementUpdated({
      idBilletera,
      idMovimiento: this.extractMovementId(response) ?? id,
    });
  }

  private extractMovementId(
    response: StoredProcedureResponse,
  ): number | undefined {
    const record = response.data?.[0];

    return record
      ? this.getNumber(record, ['idMovimiento', 'IdMovimiento', 'IDMOVIMIENTO', 'id'])
      : undefined;
  }

  private toPositiveNumber(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : null;
  }

  private getNumber(
    record: Record<string, unknown>,
    keys: string[],
  ): number | undefined {
    const value = keys.map((key) => record[key]).find((item) => item !== undefined);

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);

      return Number.isFinite(parsedValue) ? parsedValue : undefined;
    }

    return undefined;
  }
}
