export type CategoryMovementType = 'Ingreso' | 'Gasto';
export type CategoryFilterId = 'all' | CategoryMovementType;

export interface CategoryApiRecord {
  IdCategoria?: number | string;
  Nombre?: string;
  TipoMovimiento?: CategoryMovementType | string;
  Activo?: boolean | number | string;
  FechaCreacion?: string;
  idCategoria?: number | string;
  nombre?: string;
  tipoMovimiento?: CategoryMovementType | string;
  activo?: boolean | number | string;
  fechaCreacion?: string;
  [key: string]: unknown;
}

export interface CategoryFormValue {
  nombre: string;
  tipoMovimiento: CategoryMovementType;
}

export interface CategoryPayload {
  nombre: string;
  tipoMovimiento: CategoryMovementType;
}

export interface CategoryStatePayload {
  activo: boolean;
}

export interface CategoryFilter {
  id: CategoryFilterId;
  label: string;
}
