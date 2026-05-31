export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegisterPayload {
  nombreCompleto: string;
  correo: string;
  password: string;
  confirmarPassword: string;
}

export interface AuthUser {
  id?: number | string;
  nombreCompleto?: string;
  correo?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: number | string;
  user?: AuthUser;
  usuario?: AuthUser;
  data?: {
    accessToken?: string;
    token?: string;
    refreshToken?: string;
    expiresAt?: number | string;
    user?: AuthUser;
    usuario?: AuthUser;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
