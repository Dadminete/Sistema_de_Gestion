import api from '../lib/api';

export interface CuentaPorCobrar {
  id: string;
  numeroDocumento: string;
  clienteId: string;
  cliente?: {
    id: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    email: string;
  };
  facturaId?: string;
  factura?: {
    numeroFactura: string;
    tipoFactura: string;
  };
  fechaEmision: string;
  fechaVencimiento: string;
  montoOriginal: number;
  montoPendiente: number;
  moneda: string;
  estado: 'pendiente' | 'vencida' | 'pagada' | 'parcial';
  diasVencido: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumenCuentasPorCobrar {
  totalPorCobrar: number;
  totalVencidas: number;
  totalProximasVencer: number; // próximas 7 días
  totalCobradas: number;
  cuentasPendientes: number;
  cuentasVencidas: number;
  promedioTiempoCobro: number;
}

export interface EdadCartera {
  alDia: { count: number; monto: number }; // 0 días
  dias1a30: { count: number; monto: number };
  dias31a60: { count: number; monto: number };
  dias61a90: { count: number; monto: number };
  mas90dias: { count: number; monto: number };
}

export interface ProyeccionCobro {
  mes: string;
  montoEsperado: number;
  probabilidadCobro: number;
  cuentasVencen: number;
}

export interface FiltrosCuentasPorCobrar {
  clienteId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  montoMinimo?: number;
  montoMaximo?: number;
  diasVencidoDesde?: number;
  diasVencidoHasta?: number;
}

class CuentasPorCobrarService {
  // Obtener todas las cuentas por cobrar con filtros
  async getCuentasPorCobrar(filtros: FiltrosCuentasPorCobrar = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/contabilidad/cuentas-por-cobrar?${params.toString()}`);
    return response.data.data || []; // Extraer el array de datos de la respuesta paginada
  }

  // Obtener una cuenta por cobrar específica
  async getCuentaPorCobrar(id: string): Promise<CuentaPorCobrar> {
    const response = await api.get(`/contabilidad/cuentas-por-cobrar/${id}`);
    return response.data;
  }

  // Crear nueva cuenta por cobrar
  async createCuentaPorCobrar(data: Omit<CuentaPorCobrar, 'id' | 'createdAt' | 'updatedAt' | 'diasVencido'>) {
    const response = await api.post('/contabilidad/cuentas-por-cobrar', data);
    return response.data;
  }

  // Actualizar cuenta por cobrar
  async updateCuentaPorCobrar(id: string, data: Partial<CuentaPorCobrar>) {
    const response = await api.put(`/contabilidad/cuentas-por-cobrar/${id}`, data);
    return response.data;
  }

  // Eliminar cuenta por cobrar
  async deleteCuentaPorCobrar(id: string) {
    await api.delete(`/contabilidad/cuentas-por-cobrar/${id}`);
  }

  // Obtener resumen/dashboard
  async getResumenCuentasPorCobrar(): Promise<ResumenCuentasPorCobrar> {
    const response = await api.get('/contabilidad/cuentas-por-cobrar/dashboard/resumen');
    return response.data;
  }

  // Obtener edad de cartera
  async getEdadCartera(): Promise<EdadCartera> {
    const response = await api.get('/contabilidad/cuentas-por-cobrar/analytics/edad-cartera');
    return response.data;
  }

  // Obtener proyección de cobros
  async getProyeccionCobros(meses: number = 6): Promise<ProyeccionCobro[]> {
    const response = await api.get(`/contabilidad/cuentas-por-cobrar/analytics/proyeccion?meses=${meses}`);
    return response.data;
  }

  // Obtener cuentas vencidas
  async getCuentasVencidas() {
    const response = await api.get('/contabilidad/cuentas-por-cobrar/vencidas');
    return response.data || [];
  }

  // Obtener solo cuentas con estado específico (método de conveniencia)
  async getCuentasPorEstado(estado: 'pendiente' | 'vencida' | 'pagada' | 'parcial') {
    return this.getCuentasPorCobrar({ estado });
  }

  // Obtener próximas a vencer (próximos 7 días por defecto)
  async getCuentasProximasVencer(dias: number = 7) {
    const response = await api.get(`/contabilidad/cuentas-por-cobrar/proximas-vencer?dias=${dias}`);
    return response.data;
  }

  // Registrar pago a una cuenta por cobrar
  async registrarPago(cuentaId: string, pagoData: {
    monto: number;
    fechaPago: string;
    metodoPago: string;
    numeroReferencia?: string;
    observaciones?: string;
  }) {
    const response = await api.post(`/contabilidad/cuentas-por-cobrar/${cuentaId}/pagos`, pagoData);
    return response.data;
  }

  // Obtener historial de pagos de una cuenta
  async getHistorialPagos(cuentaId: string) {
    const response = await api.get(`/contabilidad/cuentas-por-cobrar/${cuentaId}/pagos`);
    return response.data;
  }

  // Enviar recordatorio de pago
  async enviarRecordatorio(cuentaId: string, tipo: 'email' | 'whatsapp' | 'sms', mensaje?: string) {
    const response = await api.post(`/contabilidad/cuentas-por-cobrar/${cuentaId}/recordatorio`, {
      tipo,
      mensaje
    });
    return response.data;
  }

  // Generar estado de cuenta para cliente
  async generarEstadoCuenta(clienteId: string, fechaDesde?: string, fechaHasta?: string) {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const response = await api.get(`/contabilidad/cuentas-por-cobrar/cliente/${clienteId}/estado-cuenta?${params.toString()}`);
    return response.data;
  }

  // Exportar reportes
  async exportarReporte(tipo: 'excel' | 'pdf', filtros: FiltrosCuentasPorCobrar = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/contabilidad/cuentas-por-cobrar/exportar/${tipo}?${params.toString()}`, {
      responseType: 'blob'
    });
    
    // Crear y descargar archivo
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuentas-por-cobrar-${new Date().toISOString().split('T')[0]}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Calcular métricas de rendimiento
  async getMetricasRendimiento() {
    const response = await api.get('/contabilidad/cuentas-por-cobrar/analytics/metricas');
    return response.data;
  }

  // Obtener alertas y notificaciones
  async getAlertas() {
    const response = await api.get('/contabilidad/cuentas-por-cobrar/alertas');
    return response.data;
  }
}

export default new CuentasPorCobrarService();