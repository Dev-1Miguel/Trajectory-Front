import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CategoryApiRecord,
  CategoryPayload,
  CategoryStatePayload,
} from '../models/category.models';

export interface CategoriesApiResponse<T = CategoryApiRecord> {
  data: T[];
  rowsAffected?: number[];
  output?: Record<string, unknown>;
}

export type CategoriesApiResult =
  | CategoryApiRecord[]
  | CategoriesApiResponse<CategoryApiRecord>;

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly categoriesUrl = `${environment.apiUrl}/categorias`;

  consultar(activo?: boolean): Observable<CategoriesApiResult> {
    let params = new HttpParams();

    if (activo !== undefined) {
      params = params.set('activo', String(activo));
    }

    return this.http.get<CategoriesApiResult>(this.categoriesUrl, { params });
  }

  crear(payload: CategoryPayload): Observable<CategoriesApiResult> {
    return this.http.post<CategoriesApiResult>(this.categoriesUrl, payload);
  }

  actualizar(
    idCategoria: number,
    payload: CategoryPayload,
  ): Observable<CategoriesApiResult> {
    return this.http.put<CategoriesApiResult>(
      `${this.categoriesUrl}/${idCategoria}`,
      payload,
    );
  }

  cambiarEstado(
    idCategoria: number,
    activo: boolean,
  ): Observable<CategoriesApiResult> {
    const payload: CategoryStatePayload = { activo };

    return this.http.patch<CategoriesApiResult>(
      `${this.categoriesUrl}/${idCategoria}/estado`,
      payload,
    );
  }
}
