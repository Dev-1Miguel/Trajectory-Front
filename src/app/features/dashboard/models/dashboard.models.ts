export type DashboardTone = 'success' | 'primary' | 'danger' | 'neutral';
export type MovementType = 'income' | 'expense' | 'transfer';

export interface MetricCard {
  title: string;
  amount: string;
  subtitle: string;
  tone: DashboardTone;
  icon: string;
  accentIcon: string;
}

export interface CategoryExpense {
  label: string;
  amount: string;
  percentage: number;
  color: string;
}

export interface ExpenseCategory {
  label: string;
  amount: string;
  percentage: number;
}

export interface SummaryItem {
  label: string;
  amount: string;
  tone: DashboardTone;
}

export interface Movement {
  title: string;
  category: string;
  date: string;
  amount: string;
  type: MovementType;
}

export interface DashboardResumenQuery {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface DashboardMovimientoApiRecord {
  idMovimiento?: number;
  tipoMovimiento?: string;
  titulo?: string;
  descripcion?: string;
  monto?: number | string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  fechaMovimiento?: string;
}

export interface DashboardResumenPorTipo {
  ingreso: number;
  gasto: number;
  transferencia: number;
}

export interface DashboardGastoPorTitulo {
  titulo: string;
  total: number;
}

export interface DashboardResumenResponse {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  cantidadMovimientos: number;
  ultimosMovimientos: DashboardMovimientoApiRecord[];
  resumenPorTipo: DashboardResumenPorTipo;
  gastosPorTitulo: DashboardGastoPorTitulo[];
}
