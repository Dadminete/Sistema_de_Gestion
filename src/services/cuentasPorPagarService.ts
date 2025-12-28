import api from '../lib/api';

export interface CuentaPorPagar {
  id: string;
  numeroDocumento: string;
  proveedorId?: string;
  proveedor?: {
    id: string;
    nombre: string;
    razonSocial?: string;
    telefono?: string;
    email?: string;
  };
  tipoDocumento: string;
  fechaEmision: string;
  fechaVencimiento: string;
  concepto: string;
  montoOriginal: number;
  montoPendiente: number;
  cuotaMensual?: number;
  moneda: string;
  estado: 'pendiente' | 'vencida' | 'pagada';
  diasVencido: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumenCuentasPorPagar {
  totalPorPagar: number;
  totalVencidas: number;
  totalProximasVencer: number;
  cuentasPendientes: number;
  cuentasVencidas: number;
  totalCuotasMensuales: number;
  totalPagadoMes: number;
}

export interface FiltrosCuentasPorPagar {
  proveedorId?: string;
  estado?: 'pendiente' | 'vencida' | 'pagada';
  fechaDesde?: string;
  fechaHasta?: string;
  montoMinimo?: number;
  montoMaximo?: number;
  diasVencidoDesde?: number;
  diasVencidoHasta?: number;
  page?: number;
  limit?: number;
}

class CuentasPorPagarService {
  // Obtener todas las cuentas por pagar con filtros
  async getCuentasPorPagar(filtros: FiltrosCuentasPorPagar = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/contabilidad/cuentas-por-pagar?${params.toString()}`);
    return response.data.data || []; // Extraer el array de datos de la respuesta paginada
  }

  // Obtener una cuenta por pagar específica
  async getCuentaPorPagar(id: string): Promise<CuentaPorPagar> {
    const response = await api.get(`/contabilidad/cuentas-por-pagar/${id}`);
    return response.data;
  }

  // Crear nueva cuenta por pagar
  async createCuentaPorPagar(data: Omit<CuentaPorPagar, 'id' | 'createdAt' | 'updatedAt' | 'diasVencido'>) {
    const response = await api.post('/contabilidad/cuentas-por-pagar', data);
    return response.data;
  }

  // Actualizar cuenta por pagar
  async updateCuentaPorPagar(id: string, data: Partial<CuentaPorPagar>) {
    const response = await api.put(`/contabilidad/cuentas-por-pagar/${id}`, data);
    return response.data;
  }

  // Eliminar cuenta por pagar
  async deleteCuentaPorPagar(id: string) {
    await api.delete(`/contabilidad/cuentas-por-pagar/${id}`);
  }

  // Obtener resumen/dashboard
  async getResumenCuentasPorPagar(): Promise<ResumenCuentasPorPagar> {
    const response = await api.get('/contabilidad/cuentas-por-pagar/dashboard/resumen');
    return response.data;
  }

  // Obtener cuentas vencidas
  async getCuentasVencidas() {
    const response = await api.get('/contabilidad/cuentas-por-pagar/vencidas');
    return response.data || [];
  }

  // Obtener solo cuentas con estado específico (método de conveniencia)
  async getCuentasPorEstado(estado: 'pendiente' | 'vencida' | 'pagada') {
    return this.getCuentasPorPagar({ estado });
  }

  // Obtener próximas a vencer (próximos 7 días por defecto)
  async getCuentasProximasVencer(dias: number = 7) {
    const response = await api.get(`/contabilidad/cuentas-por-pagar/proximas-vencer?dias=${dias}`);
    return response.data;
  }

  // Registrar pago a una cuenta por pagar
  async registrarPago(cuentaId: string, pagoData: {
    monto: number;
    fechaPago: string;
    metodoPago: string;
    numeroReferencia?: string;
    observaciones?: string;
    cajaId?: string;
    cuentaBancariaId?: string;
  }) {
    const response = await api.post(`/contabilidad/cuentas-por-pagar/${cuentaId}/pagar`, pagoData);
    return response.data;
  }

  // Obtener historial de pagos de una cuenta
  async getPagos(cuentaId: string) {
    const response = await api.get(`/contabilidad/cuentas-por-pagar/${cuentaId}/pagos`);
    return response.data;
  }
}

export default new CuentasPorPagarService();