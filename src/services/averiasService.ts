import api from './api';

export const averiasService = {
  async getAverias(params?: { page?: number; limit?: number; estado?: string; clienteId?: string }) {
    try {
      const response = await api.get(`/averias`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching averias:', error);
      throw error;
    }
  },

  async statsRange(from: string, to: string) {
    try {
      const response = await api.get(`/averias/stats/range`, { params: { from, to } });
      return response.data as { total: number; pendientes: number; resueltos: number; promedioHorasResolucion: number | null };
    } catch (error) {
      console.error('Error fetching averias stats by range:', error);
      throw error;
    }
  },

  async aggregationsRange(from: string, to: string) {
    try {
      const response = await api.get(`/averias/aggregations/range`, { params: { from, to } });
      return response.data as { categoria: { key: string; count: number }[]; prioridad: { key: string; count: number }[] };
    } catch (error) {
      console.error('Error fetching averias aggregations by range:', error);
      throw error;
    }
  },

  async statsMes(offset: number = 0) {
    try {
      const response = await api.get(`/averias/stats/mes`, { params: { offset } });
      return response.data as { total: number; pendientes: number; resueltos: number; promedioHorasResolucion: number | null };
    } catch (error) {
      console.error('Error fetching monthly averias stats:', error);
      throw error;
    }
  },

  async aggregationsMes(offset: number = 0) {
    try {
      const response = await api.get(`/averias/aggregations/mes`, { params: { offset } });
      return response.data as { categoria: { key: string; count: number }[]; prioridad: { key: string; count: number }[] };
    } catch (error) {
      console.error('Error fetching monthly aggregations:', error);
      throw error;
    }
  },

  async getTopClients(limit: number = 5) {
    try {
      const response = await api.get(`/averias/stats/top-clients`, { params: { limit } });
      return response.data as { clienteId: string; nombre: string; codigo: string; count: number }[];
    } catch (error) {
      console.error('Error fetching top clients:', error);
      throw error;
    }
  },

  async getTechnicianStats() {
    try {
      const response = await api.get(`/averias/stats/technicians`);
      return response.data as { tecnico: string; count: number }[];
    } catch (error) {
      console.error('Error fetching technician stats:', error);
      throw error;
    }
  },

  async crear(averiaData: any) {
    try {
      const response = await api.post(`/averias`, averiaData);
      return response.data;
    } catch (error) {
      console.error('Error creating averia:', error);
      throw error;
    }
  },

  async statsHoy() {
    try {
      const response = await api.get(`/averias/stats/hoy`);
      return response.data;
    } catch (error) {
      console.error('Error fetching averias stats:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const response = await api.get(`/averias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching averia by id:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<{ asunto: string; descripcion: string; categoria: string; prioridad: string; estado: string; notas: string }>) {
    try {
      const response = await api.put(`/averias/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating averia:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await api.delete(`/averias/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting averia:', error);
      throw error;
    }
  },

  async close(id: string, mensaje?: string | { mensaje?: string; imagenUrl?: string; estado?: string }) {
    try {
      let payload: any = {};
      if (typeof mensaje === 'string') {
        payload = { mensaje };
      } else if (mensaje && typeof mensaje === 'object') {
        payload = mensaje;
      }
      const response = await api.post(`/averias/${id}/cerrar`, payload);
      return response.data;
    } catch (error) {
      console.error('Error closing averia:', error);
      throw error;
    }
  },

  async closeWithMessage(id: string, mensaje: string) {
    return this.close(id, { mensaje });
  },
};