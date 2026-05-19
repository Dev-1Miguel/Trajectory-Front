import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

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
}

export interface MovementPayload {
  tipoMovimiento: string;
  titulo: string;
  descripcion?: string;
  monto: number;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  fechaMovimiento?: string;
}

@Injectable({ providedIn: 'root' })
export class MovementsApiService {
  private readonly http = inject(HttpClient);
  private readonly movementsUrl = `${environment.apiBaseUrl}/movimientos`;

  consultar(query: MovementQuery = {}): Observable<StoredProcedureResponse> {
    return this.http.get<StoredProcedureResponse>(this.movementsUrl, {
      params: this.toParams(query),
    });
  }

  crear(payload: MovementPayload): Observable<StoredProcedureResponse> {
    return this.http.post<StoredProcedureResponse>(this.movementsUrl, payload);
  }

  actualizar(
    id: number,
    payload: MovementPayload,
  ): Observable<StoredProcedureResponse> {
    return this.http.put<StoredProcedureResponse>(
      `${this.movementsUrl}/${id}`,
      payload,
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
}
