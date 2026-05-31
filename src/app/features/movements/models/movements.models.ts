export type MovementKind = 'income' | 'expense' | 'transfer';
export type MovementStep = 'list' | 'selector' | MovementKind | 'success';

export interface MovementFilter {
  id: MovementKind | 'all';
  label: string;
}

export interface MovementEntry {
  id?: number;
  title: string;
  description: string;
  amount: string;
  time: string;
  kind: MovementKind;
}

export interface MovementGroup {
  label: string;
  items: MovementEntry[];
}

export interface MovementOption {
  kind: MovementKind;
  title: string;
  subtitle: string;
  icon: string;
}

export interface SuccessSummary {
  title: string;
  message: string;
  accent: MovementKind;
  rows: string[];
  amount: string;
}

export interface MovementFormValue {
  kind: MovementKind;
  titulo: string;
  descripcion?: string;
  monto: number;
  idCategoria?: number | null;
  idBilletera?: number | null;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  fechaMovimiento?: string;
}

export interface MovementCategoryOption {
  idCategoria: number;
  nombre: string;
}

export interface MovementWalletOption {
  idBilletera: number;
  nombre: string;
  esPrincipal: boolean;
}

export interface BottomNavigationItem {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
}
