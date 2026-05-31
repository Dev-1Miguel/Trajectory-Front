export interface WalletApiRecord {
  IdBilletera?: number | string;
  IdUsuario?: number | string;
  Nombre?: string;
  Descripcion?: string | null;
  EsPrincipal?: boolean | number | string;
  Activo?: boolean | number | string;
  FechaCreacion?: string;
  idBilletera?: number | string;
  idUsuario?: number | string;
  nombre?: string;
  descripcion?: string | null;
  esPrincipal?: boolean | number | string;
  activo?: boolean | number | string;
  fechaCreacion?: string;
  [key: string]: unknown;
}

export interface WalletPayload {
  nombre: string;
  descripcion?: string;
  esPrincipal: boolean;
}

export interface WalletStatePayload {
  activo: boolean;
}
