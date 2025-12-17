import api from './api';

export interface BitacoraEntry {
  id: string;
  usuarioId?: string;
  accion: string;
  tablaAfectada?: string;
  registroAfectadoId?: string;
  detallesAnteriores?: any;
  detallesNuevos?: any;
  ipAddress?: string;
  userAgent?: string;
  sesionId?: string;
  metodo?: string;
  ruta?: string;
  resultado: string;
  mensajeError?: string;
  duracionMs?: number;
  fechaHora: Date;
  usuario?: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
  };
}

export interface BitacoraResponse {
  data: BitacoraEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BitacoraStats {
  totalAcciones: number;
  accionesPorTipo: Array<{
    accion: string;
    _count: { id: number };
  }>;
  accionesPorUsuario: Array<{
    usuarioId: string;
    _count: { id: number };
  }>;
  accionesPorTabla: Array<{
    tablaAfectada: string;
    _count: { id: number };
  }>;
}

export interface BitacoraFilters {
  page?: number;
  limit?: number;
  accion?: string;
  tablaAfectada?: string;
  usuarioId?: string;
  resultado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  metodo?: string;
  viewAll?: string;
}

export class BitacoraService {
  // Obtener entradas de bitácora con filtros y paginación
  static async getBitacora(filters: BitacoraFilters = {}): Promise<BitacoraResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/bitacora?${params}`);
    return response.data;
  }

  // Obtener entrada específica por ID
  static async getBitacoraById(id: string): Promise<BitacoraEntry> {
    const response = await api.get(`/bitacora/${id}`);
    return response.data;
  }

  // Obtener estadísticas de bitácora
  static async getBitacoraStats(): Promise<BitacoraStats> {
    const response = await api.get(`/bitacora/stats`);
    return response.data;
  }

  // Delete bitácora entries
  static async deleteBitacoraEntries(ids: string[]): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const response = await api.delete(`/bitacora`, {
      data: { ids }
    });
    return response.data;
  }
}
