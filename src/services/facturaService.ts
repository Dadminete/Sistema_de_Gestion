import { apiClient } from '../utils/apiClient';

const API_URL = '/facturas';

// Estadísticas del dashboard
export const obtenerEstadisticas = async (filtros?: { año?: number; mes?: number }) => {
  const params = new URLSearchParams();
  if (filtros?.año) params.append('año', filtros.año.toString());
  if (filtros?.mes) params.append('mes', filtros.mes.toString());
  
  const queryString = params.toString();
  const endpoint = `${API_URL}/dashboard${queryString ? `?${queryString}` : ''}`;
  
  return await apiClient.get(endpoint);
};

// Obtener pagos por mes
export const obtenerPagosPorMes = async (año: number) => {
  return await apiClient.get(`${API_URL}/pagos-mes/${año}`);
};

// Obtener suscripciones de un cliente
export const obtenerSuscripcionesCliente = async (clienteId: string) => {
  return await apiClient.get(`${API_URL}/cliente/${clienteId}/suscripciones`);
};

// Generar número de factura
export const generarNumeroFactura = async () => {
  const data: any = await apiClient.get(`${API_URL}/generar-numero`);
  return data.numeroFactura;
};

// Obtener todas las facturas con filtros
export const obtenerFacturas = async (filtros?: {
  estado?: string;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filtros?.estado) params.append('estado', filtros.estado);
  if (filtros?.clienteId) params.append('clienteId', filtros.clienteId);
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.page) params.append('page', filtros.page.toString());
  if (filtros?.limit) params.append('limit', filtros.limit.toString());

  const queryString = params.toString();
  const endpoint = `${API_URL}${queryString ? `?${queryString}` : ''}`;
  
  return await apiClient.get(endpoint);
};

// Obtener factura por ID
export const obtenerFacturaPorId = async (id: string) => {
  return await apiClient.get(`${API_URL}/${id}`);
};

// Crear nueva factura
export const crearFactura = async (data: {
  clienteId: string;
  detalles: Array<{
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    descuento?: number;
    impuesto?: number;
    total: number;
    servicioId?: string;
    productoId?: number;
  }>;
  itbis?: number;
  formaPago?: string;
  cajaId?: string;
  cuentaBancariaId?: string;
  observaciones?: string;
  pagarInmediatamente?: boolean;
}) => {
  return await apiClient.post(API_URL, data);
};

// Pagar factura
export const pagarFactura = async (facturaId: string, data: {
  monto: number;
  metodoPago: string;
  cuentaBancariaId?: string;
  cajaId?: string;
  observaciones?: string;
}) => {
  return await apiClient.post(`${API_URL}/${facturaId}/pagar`, data);
};

// Anular factura
export const anularFactura = async (facturaId: string, motivo: string) => {
  return await apiClient.post(`${API_URL}/${facturaId}/anular`, { motivo });
};

export default {
  obtenerEstadisticas,
  obtenerPagosPorMes,
  obtenerSuscripcionesCliente,
  generarNumeroFactura,
  obtenerFacturas,
  obtenerFacturaPorId,
  crearFactura,

  // Actualizar factura
  actualizarFactura: async (id: string, data: any) => {
    return await apiClient.put(`${API_URL}/${id}`, data);
  },
  pagarFactura,
  anularFactura,

  // Reactivar factura
  reactivarFactura: async (id: string) => {
    return await apiClient.post(`${API_URL}/${id}/reactivar`, {});
  },
  
  // Eliminar factura
  eliminarFactura: async (id: string) => {
    return await apiClient.delete(`${API_URL}/${id}`);
  },

  // Eliminar facturas masivamente
  eliminarFacturas: async (ids: string[]) => {
    return await apiClient.post(`${API_URL}/eliminar-masivo`, { ids });
  }
};
