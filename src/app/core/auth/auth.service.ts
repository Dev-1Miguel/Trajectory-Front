import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterPayload,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'trajectory_access_token';
  private readonly userKey = 'trajectory_auth_user';

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

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  guardarToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  estaAutenticado(): boolean {
    return Boolean(this.obtenerToken());
  }

  guardarUsuario(usuario: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(usuario));
  }

  obtenerUsuario(): AuthUser | null {
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
    const token = this.extraerToken(response);
    const usuario = this.extraerUsuario(response);

    if (token) {
      this.guardarToken(token);
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
}
