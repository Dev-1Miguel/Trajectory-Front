import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  DashboardResumenQuery,
  DashboardResumenResponse,
} from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly dashboardResumenUrl = `${environment.apiUrl}/dashboard/resumen`;

  obtenerResumen(
    query: DashboardResumenQuery = {},
  ): Observable<DashboardResumenResponse> {
    return this.http.get<DashboardResumenResponse>(this.dashboardResumenUrl, {
      params: this.toParams(query),
    });
  }

  private toParams(query: DashboardResumenQuery): HttpParams {
    return Object.entries(query).reduce((params, [key, value]) => {
      if (value === undefined || value === '') {
        return params;
      }

      return params.set(key, value);
    }, new HttpParams());
  }
}
