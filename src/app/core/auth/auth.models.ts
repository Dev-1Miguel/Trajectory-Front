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

export interface CambiarPasswordPayload {
  passwordActual: string;
  passwordNueva: string;
  confirmarPasswordNueva: string;
}

export interface CambiarPasswordResponse {
  mensaje: string;
}

export interface LogoutResponse {
  mensaje?: string;
  message?: string;
}

export interface SesionActiva {
  [key: string]: unknown;
}

export interface ConsultarSesionesResponse {
  sesiones?: SesionActiva[];
  data?: SesionActiva[];
}

export interface CerrarSesionesPayload {
  idSesiones: string[];
}

export interface CerrarSesionesResponse {
  mensaje?: string;
  message?: string;
}

export interface AuthUser {
  id?: number | string;
  nombreCompleto?: string;
  correo?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  accessToken: string;
  usuario: AuthUser;
}

export interface AuthUserResponse {
  user?: AuthUser;
  usuario?: AuthUser;
  data?: {
    user?: AuthUser;
    usuario?: AuthUser;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
