import { apiClient } from '../utils/apiClient';

export interface MovimientoContable {
  id: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  categoriaId: string;
  metodo: string;
  bankId?: string;
  cuentaBancariaId?: string;
  descripcion?: string;
  fecha: string;
  usuarioId: string;
  categoria: {
    id: string;
    nombre: string;
    tipo: string;
  };
  usuario: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
  };
  bank?: {
    id: string;
    nombre: string;
  };
  cuentaBancaria?: {
    id: string;
    numeroCuenta: string;
    nombreOficialCuenta?: string;
  };
}

export interface CreateMovimientoData {
  tipo: 'ingreso' | 'gasto';
  monto: number;
  categoriaId: string;
  metodo: string;
  descripcion?: string;
  usuarioId: string;
}

export interface UpdateMovimientoData {
  tipo?: 'ingreso' | 'gasto';
  monto?: number;
  categoriaId?: string;
  metodo?: string;
  descripcion?: string;
}

export const movimientoContableService = {
  // Obtener todos los movimientos contables
  async getAllMovimientos(): Promise<MovimientoContable[]> {
    const response = await apiClient.get('/contabilidad/movimientos');
    return response;
  },

  // Obtener movimientos por método (banco, caja, etc.)
  async getMovimientosByMetodo(metodo: string): Promise<MovimientoContable[]> {
    const response = await apiClient.get(`/contabilidad/movimientos?metodo=${metodo}`);
    return response;
  },

  // Obtener movimiento por ID
  async getMovimientoById(id: string): Promise<MovimientoContable> {
    const response = await apiClient.get(`/contabilidad/movimientos/${id}`);
    return response;
  },

  // Crear nuevo movimiento
  async createMovimiento(data: CreateMovimientoData): Promise<MovimientoContable> {
    const response = await apiClient.post('/contabilidad/movimientos', data);
    return response;
  },

  // Actualizar movimiento
  async updateMovimiento(id: string, data: UpdateMovimientoData): Promise<MovimientoContable> {
    const response = await apiClient.put(`/contabilidad/movimientos/${id}`, data);
    return response;
  },

  // Eliminar movimiento
  async deleteMovimiento(id: string): Promise<void> {
    await apiClient.delete(`/contabilidad/movimientos/${id}`);
  },

  // Obtener movimientos por rango de fechas
  async getMovimientosByDateRange(startDate: string, endDate: string): Promise<MovimientoContable[]> {
    const response = await apiClient.get(`/contabilidad/movimientos?startDate=${startDate}&endDate=${endDate}`);
    return response;
  },

  // Obtener movimientos por tipo
  async getMovimientosByTipo(tipo: 'ingreso' | 'gasto'): Promise<MovimientoContable[]> {
    const response = await apiClient.get(`/contabilidad/movimientos?tipo=${tipo}`);
    return response;
  }
};