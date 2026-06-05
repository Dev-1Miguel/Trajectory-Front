import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ReportFilters,
  ReportMovementsResponse,
  ReportSummaryResponse,
} from '../models/reports.models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiUrl}/reportes`;

  getResumen(filters: ReportFilters): Observable<ReportSummaryResponse> {
    return this.http.get<ReportSummaryResponse>(`${this.reportsUrl}/resumen`, {
      params: this.toParams(filters),
    });
  }

  getMovimientos(filters: ReportFilters): Observable<ReportMovementsResponse> {
    return this.http.get<ReportMovementsResponse>(
      `${this.reportsUrl}/movimientos`,
      {
        params: this.toParams(filters),
      },
    );
  }

  downloadPdf(filters: ReportFilters): Observable<Blob> {
    return this.http.get(`${this.reportsUrl}/exportar-pdf`, {
      params: this.toParams(filters),
      responseType: 'blob',
    });
  }

  private toParams(filters: ReportFilters): HttpParams {
    return Object.entries(filters).reduce((params, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return params;
      }

      return params.set(key, String(value));
    }, new HttpParams());
  }
}
