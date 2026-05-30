import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  PersonalInfoApiResponse,
  UpdatePersonalInfoPayload,
} from '../models/personal-info.models';

@Injectable({ providedIn: 'root' })
export class PersonalInfoApiService {
  private readonly http = inject(HttpClient);
  private readonly personalInfoUrl = `${environment.apiUrl}/perfil/informacion-personal`;

  obtener(): Observable<PersonalInfoApiResponse> {
    return this.http.get<PersonalInfoApiResponse>(this.personalInfoUrl);
  }

  actualizar(
    payload: UpdatePersonalInfoPayload,
  ): Observable<PersonalInfoApiResponse | null> {
    return this.http.put<PersonalInfoApiResponse | null>(
      this.personalInfoUrl,
      payload,
    );
  }
}
