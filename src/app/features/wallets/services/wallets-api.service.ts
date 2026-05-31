import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  WalletApiRecord,
  WalletPayload,
  WalletStatePayload,
} from '../models/wallet.models';

export interface WalletsApiResponse<T = WalletApiRecord> {
  data: T[];
  rowsAffected?: number[];
  output?: Record<string, unknown>;
}

export type WalletsApiResult =
  | WalletApiRecord[]
  | WalletsApiResponse<WalletApiRecord>;

@Injectable({ providedIn: 'root' })
export class WalletsApiService {
  private readonly http = inject(HttpClient);
  private readonly walletsUrl = `${environment.apiUrl}/billeteras`;

  consultar(activo?: boolean): Observable<WalletsApiResult> {
    let params = new HttpParams();

    if (activo !== undefined) {
      params = params.set('activo', String(activo));
    }

    return this.http.get<WalletsApiResult>(this.walletsUrl, { params });
  }

  crear(payload: WalletPayload): Observable<WalletsApiResult> {
    return this.http.post<WalletsApiResult>(this.walletsUrl, payload);
  }

  actualizar(
    idBilletera: number,
    payload: WalletPayload,
  ): Observable<WalletsApiResult> {
    return this.http.put<WalletsApiResult>(
      `${this.walletsUrl}/${idBilletera}`,
      payload,
    );
  }

  cambiarEstado(
    idBilletera: number,
    activo: boolean,
  ): Observable<WalletsApiResult> {
    const payload: WalletStatePayload = { activo };

    return this.http.patch<WalletsApiResult>(
      `${this.walletsUrl}/${idBilletera}/estado`,
      payload,
    );
  }

  marcarPrincipal(idBilletera: number): Observable<WalletsApiResult> {
    return this.http.patch<WalletsApiResult>(
      `${this.walletsUrl}/${idBilletera}/principal`,
      {},
    );
  }
}
