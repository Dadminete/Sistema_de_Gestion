import { apiClient } from '../utils/apiClient';

export interface DashboardStats {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  trend: 'up' | 'down';
  bgColor: string;
}

export interface ClientGrowthData {
  month: string;
  nuevos: number;
  total: number;
}

export interface RevenueData {
  name: string;
  value: number;
  color: string;
}

export interface TopClient {
  id: string;
  name: string;
  category: string;
  revenue: number;
  status: string;
  avatar: string | null;
}

export interface Transaction {
  id: string;
  client: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}

export interface Notification {
  id: number;
  message: string;
  time: string;
}

export interface Client {
  id: string;
  name?: string;
  nombre?: string;
  email?: string;
  category?: string;
  categoria?: string;
  status?: string;
  estado?: string;
  avatar?: string | null;
  [key: string]: any; // Allow for additional properties from API
}

export interface DashboardData {
  stats: DashboardStats[];
  clientGrowth: ClientGrowthData[];
  revenueData: RevenueData[];
  topClients: TopClient[];
  recentTransactions: Transaction[];
  notifications: Notification[];
  allClients: Client[];
}

export const clientService = {
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get('/clients/dashboard/overview');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  getClients: async (options?: { 
    status?: string; 
    page?: number; 
    limit?: number; 
    diaFacturacion?: number;
    search?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.diaFacturacion) params.append('diaFacturacion', options.diaFacturacion.toString());
      if (options?.search) params.append('search', options.search);
      // Si no se especifica limit, usar 9999 para obtener todos
      const limit = options?.limit || 9999;
      params.append('limit', limit.toString());
      
      const queryString = params.toString();
      const endpoint = `/clients${queryString ? `?${queryString}` : ''}`;
      
      console.log('🌐 Llamada API clientes:', endpoint);
      
      // Crear timeout promise para prevenir llamadas infinitas
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: La consulta de clientes tardó demasiado (más de 15 segundos)'));
        }, 15000);
      });
      
      // Ejecutar la llamada con timeout
      const response = await Promise.race([
        apiClient.get(endpoint),
        timeoutPromise
      ]);
      
      console.log('🌐 Respuesta API clientes - Total:', response?.data?.length || 0);
      
      // Validar que la respuesta tenga el formato esperado
      if (!response || (typeof response !== 'object')) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching clients:', error);
      // Re-lanzar error con mensaje más descriptivo
      if (error.message?.includes('Timeout')) {
        throw new Error('La búsqueda de clientes está tardando demasiado. Verifique su conexión.');
      } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión. Verifique que el servidor esté funcionando.');
      }
      throw error;
    }
  },

  getClientById: async (id: string) => {
    try {
      const response = await apiClient.get(`/clients/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  },

  createClient: async (data: any) => {
    try {
      const response = await apiClient.post('/clients', data);
      return response;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  updateClient: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/clients/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  deleteClient: async (id: string) => {
    try {
      const response = await apiClient.delete(`/clients/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Búsqueda rápida y optimizada de clientes
  searchClients: async (query: string, options?: { 
    status?: string; 
    limit?: number; 
    diaFacturacion?: number;
  }) => {
    try {
      if (!query || query.trim().length < 2) {
        return { data: [], total: 0 };
      }

      const params = new URLSearchParams();
      params.append('q', query.trim());
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.diaFacturacion) params.append('diaFacturacion', options.diaFacturacion.toString());
      
      const queryString = params.toString();
      const endpoint = `/clients/search?${queryString}`;
      
      console.log('🔍 Búsqueda rápida API:', endpoint);
      
      // Timeout más corto para búsquedas rápidas
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: La búsqueda tardó demasiado (más de 8 segundos)'));
        }, 8000);
      });
      
      const response = await Promise.race([
        apiClient.get(endpoint),
        timeoutPromise
      ]);
      
      console.log('✅ Búsqueda rápida - Resultados:', response?.data?.length || 0);
      
      return response;
    } catch (error: any) {
      console.error('❌ Error en búsqueda rápida:', error);
      
      if (error.message?.includes('Timeout')) {
        throw new Error('La búsqueda está tardando demasiado. Intente con menos caracteres.');
      }
      
      throw error;
    }
  },

  getClientInvoiceInfo: async (clienteId: string) => {
    try {
      console.log('🌐 Llamando API para facturas-info, clienteId:', clienteId);
      const response = await apiClient.get(`/clients/${clienteId}/facturas-info`);
      console.log('🌐 Respuesta API facturas-info:', response);
      return response;
    } catch (error) {
      console.error('🌐 Error en API facturas-info:', error);
      throw error;
    }
  },
};

