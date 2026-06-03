import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthUser,
  AuthUserResponse,
  CambiarPasswordPayload,
  CambiarPasswordResponse,
  CerrarSesionesPayload,
  CerrarSesionesResponse,
  ConsultarSesionesResponse,
  LoginResponse,
  LoginRequest,
  LogoutResponse,
  RegisterPayload,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'trajectory_access_token';
  private readonly userKey = 'trajectory_auth_user';
  private readonly legacyExpiresAtKey = 'trajectory_auth_expires_at';
  private readonly activeWalletKey = 'trajectory_active_wallet_id';
  private readonly trajectoryKeyPrefix = 'trajectory_';
  private readonly tokenKeySuffix = '_token';
  private readonly authStorageKeys = [
    this.tokenKey,
    this.userKey,
    this.legacyExpiresAtKey,
    this.activeWalletKey,
  ];
  private sesionValidada = false;

  login(correo: string, password: string): Observable<LoginResponse> {
    const payload: LoginRequest = { correo, password };

    return this.http.post<LoginResponse>(`${this.authUrl}/login`, payload).pipe(
      tap((response) => this.guardarSesion(response)),
    );
  }

  register(payload: RegisterPayload): Observable<unknown> {
    return this.http.post<unknown>(`${this.authUrl}/register`, payload);
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUserResponse | AuthUser>(`${this.authUrl}/me`).pipe(
      map((response) => this.normalizarUsuario(response)),
      tap((usuario) => this.guardarUsuario(usuario)),
    );
  }

  cambiarPassword(
    payload: CambiarPasswordPayload,
  ): Observable<CambiarPasswordResponse> {
    return this.http.patch<CambiarPasswordResponse>(
      `${this.authUrl}/password`,
      payload,
    );
  }

  consultarSesiones(): Observable<ConsultarSesionesResponse> {
    return this.http.get<ConsultarSesionesResponse>(`${this.authUrl}/sesiones`);
  }

  cerrarSesiones(idSesiones: string[]): Observable<CerrarSesionesResponse> {
    const payload: CerrarSesionesPayload = { idSesiones };

    return this.http.patch<CerrarSesionesResponse>(
      `${this.authUrl}/sesiones/cerrar`,
      payload,
    );
  }

  cerrarTodasSesiones(): Observable<CerrarSesionesResponse> {
    return this.http.patch<CerrarSesionesResponse>(
      `${this.authUrl}/sesiones/cerrar-todas`,
      {},
    );
  }

  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(
      `${this.authUrl}/logout`,
      {},
    ).pipe(
      catchError(() =>
        of({
          mensaje: 'Sesion cerrada localmente.',
        }),
      ),
      tap(() => this.clearSession()),
    );
  }

  clearSession(): void {
    this.sesionValidada = false;

    this.clearAuthStorage(localStorage);
    this.clearAuthStorage(sessionStorage);
  }

  guardarToken(token: string): void {
    if (!this.tokenEsLocalmenteValido(token)) {
      this.clearSession();
      return;
    }

    localStorage.setItem(this.tokenKey, token.trim());
  }

  obtenerToken(): string | null {
    const token =
      localStorage.getItem(this.tokenKey) ??
      sessionStorage.getItem(this.tokenKey);

    if (!token) {
      return null;
    }

    if (!this.tokenEsLocalmenteValido(token)) {
      this.clearSession();
      return null;
    }

    return token.trim();
  }

  estaAutenticado(): boolean {
    return Boolean(this.obtenerToken());
  }

  validarSesionActiva(): Observable<boolean> {
    if (!this.estaAutenticado()) {
      this.sesionValidada = false;
      return of(false);
    }

    if (this.sesionValidada) {
      return of(true);
    }

    return this.me().pipe(
      map(() => {
        this.sesionValidada = true;
        return true;
      }),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
    );
  }

  guardarUsuario(usuario: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(usuario));
  }

  obtenerUsuario(): AuthUser | null {
    if (!this.estaAutenticado()) {
      return null;
    }

    const usuario = localStorage.getItem(this.userKey);

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario) as AuthUser;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private guardarSesion(response: LoginResponse): void {
    this.clearSession();

    const token = response.accessToken?.trim();
    const usuario = this.extraerUsuario(response);

    if (!token || !this.tokenEsLocalmenteValido(token)) {
      return;
    }

    this.guardarToken(token);

    if (usuario) {
      this.guardarUsuario(usuario);
    }
  }

  private extraerUsuario(
    response: AuthUserResponse | LoginResponse,
  ): AuthUser | null {
    const data = 'data' in response ? response.data : undefined;

    return (
      response.usuario ??
      ('user' in response ? response.user : undefined) ??
      data?.usuario ??
      data?.user ??
      null
    );
  }

  private normalizarUsuario(response: AuthUserResponse | AuthUser): AuthUser {
    const usuario = this.extraerUsuario(response as AuthUserResponse);

    return usuario ?? (response as AuthUser);
  }

  private tokenEsLocalmenteValido(token: string): boolean {
    const tokenNormalizado = token.trim();

    if (!tokenNormalizado) {
      return false;
    }

    if (!this.pareceJwt(tokenNormalizado)) {
      return true;
    }

    const payload = this.extraerPayloadJwt(tokenNormalizado);

    if (!payload) {
      return false;
    }

    return typeof payload.exp === 'number'
      ? payload.exp * 1000 > Date.now()
      : true;
  }

  private pareceJwt(token: string): boolean {
    return token.split('.').length === 3;
  }

  private extraerPayloadJwt(token: string): { exp?: number } | null {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '=',
      );

      return JSON.parse(atob(paddedBase64)) as { exp?: number };
    } catch {
      return null;
    }
  }

  private clearAuthStorage(storage: Storage): void {
    for (const key of this.authStorageKeys) {
      storage.removeItem(key);
    }

    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);

      if (
        key?.startsWith(this.trajectoryKeyPrefix) &&
        key.endsWith(this.tokenKeySuffix)
      ) {
        storage.removeItem(key);
      }
    }
  }
}
