import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  CambiarPasswordPayload,
  CambiarPasswordResponse,
  CerrarSesionesPayload,
  CerrarSesionesResponse,
  ConsultarSesionesResponse,
  LoginRequest,
  RegisterPayload,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'trajectory_access_token';
  private readonly refreshTokenKey = 'trajectory_refresh_token';
  private readonly userKey = 'trajectory_auth_user';
  private readonly expiresAtKey = 'trajectory_auth_expires_at';
  private readonly activeWalletKey = 'trajectory_active_wallet_id';
  private readonly authStorageKeys = [
    this.tokenKey,
    this.refreshTokenKey,
    this.userKey,
    this.expiresAtKey,
    this.activeWalletKey,
  ];
  private sesionValidada = false;

  login(correo: string, password: string): Observable<AuthResponse> {
    const payload: LoginRequest = { correo, password };

    return this.http.post<AuthResponse>(`${this.authUrl}/login`, payload).pipe(
      tap((response) => this.guardarSesion(response)),
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/register`, payload);
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthResponse | AuthUser>(`${this.authUrl}/me`).pipe(
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

  logout(): void {
    this.clearSession();
  }

  clearSession(): void {
    this.sesionValidada = false;

    for (const key of this.authStorageKeys) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
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

  obtenerRefreshToken(): string | null {
    const refreshToken =
      localStorage.getItem(this.refreshTokenKey) ??
      sessionStorage.getItem(this.refreshTokenKey);

    return refreshToken?.trim() || null;
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

  private guardarSesion(response: AuthResponse): void {
    this.clearSession();

    const token = this.extraerToken(response);
    const refreshToken = this.extraerRefreshToken(response);
    const expiresAt = this.extraerExpiresAt(response);
    const usuario = this.extraerUsuario(response);

    if (
      !token ||
      this.expiresAtEstaVencido(expiresAt) ||
      !this.tokenEsLocalmenteValido(token)
    ) {
      return;
    }

    this.guardarToken(token);

    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken.trim());
    }

    if (expiresAt !== null) {
      localStorage.setItem(this.expiresAtKey, String(expiresAt));
    }

    if (usuario) {
      this.guardarUsuario(usuario);
    }
  }

  private extraerToken(response: AuthResponse): string | null {
    return (
      response.accessToken ??
      response.token ??
      response.data?.accessToken ??
      response.data?.token ??
      null
    );
  }

  private extraerUsuario(response: AuthResponse): AuthUser | null {
    return (
      response.usuario ??
      response.user ??
      response.data?.usuario ??
      response.data?.user ??
      null
    );
  }

  private normalizarUsuario(response: AuthResponse | AuthUser): AuthUser {
    const usuario = this.extraerUsuario(response as AuthResponse);

    return usuario ?? (response as AuthUser);
  }

  private extraerRefreshToken(response: AuthResponse): string | null {
    return (
      response.refreshToken ??
      response.data?.refreshToken ??
      null
    );
  }

  private extraerExpiresAt(response: AuthResponse): number | string | null {
    return (
      response.expiresAt ??
      response.data?.expiresAt ??
      null
    );
  }

  private tokenEsLocalmenteValido(token: string): boolean {
    const tokenNormalizado = token.trim();

    if (!tokenNormalizado) {
      return false;
    }

    if (this.expiresAtEstaVencido(this.obtenerExpiresAt())) {
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

  private obtenerExpiresAt(): number | string | null {
    return (
      localStorage.getItem(this.expiresAtKey) ??
      sessionStorage.getItem(this.expiresAtKey)
    );
  }

  private expiresAtEstaVencido(expiresAt: number | string | null): boolean {
    if (expiresAt === null || expiresAt === '') {
      return false;
    }

    const timestamp =
      typeof expiresAt === 'number' ? expiresAt : Number(expiresAt);
    const expiresAtMs = Number.isNaN(timestamp)
      ? Date.parse(String(expiresAt))
      : this.normalizarTimestampExpiracion(timestamp);

    if (Number.isNaN(expiresAtMs)) {
      return false;
    }

    return expiresAtMs <= Date.now();
  }

  private normalizarTimestampExpiracion(timestamp: number): number {
    return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
  }
}
