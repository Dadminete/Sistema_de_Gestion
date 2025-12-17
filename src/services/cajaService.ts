import { apiClient } from '../utils/apiClient';

export interface Caja {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  cuentaContableId?: string;
  responsableId?: string;
  saldoInicial: number;
  saldoActual: number;
  limiteMaximo?: number;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  responsable?: {
    nombre: string;
    apellido: string;
  };
  cuentaContable?: {
    nombre: string;
    codigo: string;
  };
}

export interface AperturaCaja {
  cajaId: string;
  montoInicial: number;
  fechaApertura: string;
  usuarioId: string;
  observaciones?: string;
}

export interface CierreCaja {
  cajaId: string;
  montoFinal: number;
  ingresosDelDia: number;
  gastosDelDia: number;
  fechaCierre: string;
  usuarioId: string;
  observaciones?: string;
}

export interface MovimientoCaja {
  id: string;
  cajaId: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  descripcion: string;
  categoria: string;
  fechaMovimiento: string;
  usuarioId: string;
  referencia?: string;
}

// Obtener todas las cajas
export const getAllCajas = async (): Promise<Caja[]> => {
  try {
    const response = await apiClient.get('/cajas');
    return response;
  } catch (error) {
    console.error('Error obteniendo cajas:', error);
    throw error;
  }
};

// Obtener una caja específica
export const getCaja = async (id: string): Promise<Caja> => {
  try {
    const response = await apiClient.get(`/cajas/${id}`);
    return response;
  } catch (error) {
    console.error(`Error obteniendo caja ${id}:`, error);
    throw error;
  }
};

// Crear nueva caja
export const createCaja = async (cajaData: Omit<Caja, 'id' | 'createdAt' | 'updatedAt' | 'saldoActual'>): Promise<Caja> => {
  try {
    const response = await apiClient.post('/cajas', cajaData);
    return response;
  } catch (error) {
    console.error('Error creando caja:', error);
    throw error;
  }
};

// Actualizar caja
export const updateCaja = async (id: string, cajaData: Partial<Caja>): Promise<Caja> => {
  try {
    const response = await apiClient.put(`/cajas/${id}`, cajaData);
    return response;
  } catch (error) {
    console.error(`Error actualizando caja ${id}:`, error);
    throw error;
  }
};

// Eliminar caja
export const deleteCaja = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/cajas/${id}`);
  } catch (error) {
    console.error(`Error eliminando caja ${id}:`, error);
    throw error;
  }
};

// Obtener balance de una caja
export const getBalanceCaja = async (cajaId: string): Promise<number> => {
  try {
    const response = await apiClient.get(`/cajas/${cajaId}/balance`);
    return response.balance;
  } catch (error) {
    console.error(`Error obteniendo balance de caja ${cajaId}:`, error);
    throw error;
  }
};

// Apertura de caja
export const abrirCaja = async (aperturaData: AperturaCaja): Promise<any> => {
  try {
    const response = await apiClient.post('/cajas/apertura', aperturaData);
    return response;
  } catch (error) {
    console.error('Error en apertura de caja:', error);
    throw error;
  }
};

// Cierre de caja
export const cerrarCaja = async (cierreData: CierreCaja): Promise<any> => {
  try {
    const response = await apiClient.post('/cajas/cierre', cierreData);
    return response;
  } catch (error) {
    console.error('Error en cierre de caja:', error);
    throw error;
  }
};

// Obtener movimientos de una caja
export const getMovimientosCaja = async (
  cajaId: string,
  fechaInicio?: string,
  fechaFin?: string
): Promise<MovimientoCaja[]> => {
  try {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    const response = await apiClient.get(`/cajas/${cajaId}/movimientos?${params}`);
    return response;
  } catch (error) {
    console.error(`Error obteniendo movimientos de caja ${cajaId}:`, error);
    throw error;
  }
};

// Agregar movimiento a caja
export const addMovimientoCaja = async (movimientoData: Omit<MovimientoCaja, 'id'>): Promise<MovimientoCaja> => {
  try {
    const response = await apiClient.post('/cajas/movimientos', movimientoData);
    return response;
  } catch (error) {
    console.error('Error agregando movimiento a caja:', error);
    throw error;
  }
};

// Obtener historial de aperturas/cierres
export interface HistorialCaja {
  id: string;
  tipo: 'apertura' | 'cierre' | 'traspaso';
  fecha: string;
  montoInicial?: number;
  montoFinal?: number;
  ingresosDelDia?: number;
  gastosDelDia?: number;
  monto?: number;
  numeroTraspaso?: string;
  conceptoTraspaso?: string;
  tipoTraspaso?: string;
  origen?: string;
  destino?: string;
  esOrigen?: boolean;
  esDestino?: boolean;
  usuario: string;
  observaciones?: string;
}

export const getHistorialCaja = async (cajaId: string): Promise<HistorialCaja[]> => {
  try {
    const response = await apiClient.get(`/cajas/${cajaId}/historial`);
    return response;
  } catch (error) {
    console.error(`Error obteniendo historial de caja ${cajaId}:`, error);
    throw error;
  }
};

// Obtener estadísticas de caja por período
export interface EstadisticasCaja {
  totalIngresos: number;
  totalGastos: number;
  balancePeriodo: number;
  saldoActual: number;
}

export const getEstadisticasCaja = async (
  cajaId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<EstadisticasCaja> => {
  try {
    const response = await apiClient.get(`/cajas/${cajaId}/estadisticas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response;
  } catch (error) {
    console.error(`Error obteniendo estadísticas de caja ${cajaId}:`, error);
    throw error;
  }
};

export const getResumenDiario = async (cajaId: string, fecha: string): Promise<{ totalIngresos: number; totalGastos: number }> => {
  try {
    const response = await apiClient.get(`/cajas/${cajaId}/resumen-diario?fecha=${fecha}`);
    return response;
  } catch (error) {
    console.error(`Error obteniendo resumen diario de caja ${cajaId}:`, error);
    throw error;
  }
};

export const getUltimaApertura = async (cajaId: string): Promise<AperturaCaja | null> => {
  try {
    const response = await apiClient.get(`/cajas/${cajaId}/ultima-apertura`);
    return response;
  } catch (error) {
    console.error(`Error obteniendo la última apertura de la caja ${cajaId}:`, error);
    throw error;
  }
};

export const setSaldoInicial = async (cuentaContableId: string, monto: number): Promise<Caja> => {
  try {
    const response = await apiClient.post('/cajas/saldo-inicial', { cuentaContableId, monto });
    return response;
  } catch (error) {
    console.error(`Error estableciendo el saldo inicial para la cuenta contable ${cuentaContableId}:`, error);
    throw error;
  }
};

// Interfaces for the new dashboard endpoint
export interface DashboardStats {
  ingresosHoy: number;
  ingresosHoyCajaPrincipal: number;
  ingresosHoyPapeleria: number;
  gastosHoy: number;
  gastosHoyCajaPrincipal: number;
  gastosHoyPapeleria: number;
  gastosMesCajaPrincipal: number;
  balanceCajaPrincipal: number;
  balancePapeleria: number;
  // Custom Metrics
  balanceBanco: number;
  gastosMesBanco: number;
  gastosMesPapeleria: number;
  ingresoRealMes: number;
  ingresosMesBanco: number;
  // Row 2 Metrics
  totalClientesActivos: number;
  totalFacturasPendientes: number;
  totalIngresosBimensual: number;
  ingresosServiciosMes: number;
  cajasActivas: number;
  cajasInactivas: number;
  cajasAbiertas: number;
  cajasCerradas: number;
}

export interface ChartDataPoint {
  name: string;
  IngresoCaja: number;
  GastoCaja: number;
  IngresoBanco: number;
  GastoBanco: number;
  IngresoPapeleria: number;
  GastoPapeleria: number;
}

export interface Evento {
  id: string;
  titulo: string;
  fechaInicio: string;
  color?: string;
}

export interface Tarea {
  id: string;
  titulo: string;
  completada: boolean;
  color: string;
  createdAt: string;
}

export interface EarlyPayer {
  name: string;
  count: number;
  total: number;
}

export interface RecentTransaction {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  usuario: string;
  metodo: string;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  historial: HistorialCaja[];
  recentEvents: Evento[];
  recentTasks: Tarea[];
  topEarlyPayers: EarlyPayer[];
  recentTransactions: RecentTransaction[];
}

export type ChartFilter = 'week' | 'month' | 'custom';

// Function to get all dashboard data
export const getDashboardData = async (
  filter: ChartFilter = 'week',
  customMonth?: Date
): Promise<DashboardData> => {
  try {
    const params = new URLSearchParams();
    params.append('filter', filter);
    if (customMonth && filter === 'custom') {
      params.append('customMonth', customMonth.toISOString());
    }
    const response = await apiClient.get(`/cajas/dashboard?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error obteniendo los datos del dashboard:', error);
    throw error;
  }
};

export const getTopIncomeSources = async (startDate?: string, endDate?: string): Promise<{ name: string; value: number }[]> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get(`/cajas/dashboard/top-sources?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error obteniendo fuentes de ingreso:', error);
    throw error;
  }
};

export const getRecentTransactions = async (limit: number = 10): Promise<any[]> => {
  try {
    const response = await apiClient.get(`/cajas/dashboard/recent-transactions?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error obteniendo transacciones recientes:', error);
    throw error;
  }
};
