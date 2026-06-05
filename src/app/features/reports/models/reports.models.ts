export type ReportMovementType = 'INGRESO' | 'GASTO' | 'TRANSFERENCIA';

export interface ReportFilters {
  fechaInicio: string;
  fechaFin: string;
  idBilletera?: number | null;
  tipoMovimiento?: ReportMovementType | '' | null;
}

export interface ReportSummary {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  cantidadMovimientos: number;
}

export interface ReportSummaryResponse extends Partial<ReportSummary> {
  data?: Partial<ReportSummary> | Partial<ReportSummary>[];
  resumen?: Partial<ReportSummary>;
  summary?: Partial<ReportSummary>;
}

export interface ReportMovement {
  idMovimiento?: number;
  fechaMovimiento?: string;
  tipoMovimiento?: string;
  categoria?: string;
  billetera?: string;
  titulo?: string;
  descripcion?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  monto?: number;
}

export interface ReportMovementsResponse {
  data?: ReportMovement[];
  movimientos?: ReportMovement[];
  rowsAffected?: number[];
  output?: Record<string, unknown>;
}
