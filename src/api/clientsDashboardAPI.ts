import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración

interface ClientStats {
  totalClientes: number;
  ingresesDelMes: number;
  suscripcionesActivas: number;
  ticketsAbiertos: number;
}

interface ClientGrowthData {
  month: string;
  nuevos: number;
  total: number;
}

interface TopClient {
  id: string;
  name: string;
  category: string;
  revenue: string;
  status: string;
}

interface RecentTransaction {
  id: string;
  client: string;
  type: string;
  amount: string;
  date: string;
  status: string;
}

interface RecentSubscribedClient {
  id: string;
  name: string;
  email: string;
  fecha_suscripcion: string;
  servicio: string;
  plan: string;
  estado: string;
}

interface DashboardData {
  stats: ClientStats;
  clientGrowth: ClientGrowthData[];
  topClients: TopClient[];
  recentTransactions: RecentTransaction[];
}

class ClientsDashboardAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token if exists
    const token = localStorage.getItem('authToken');
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Obtener estadísticas generales del dashboard
   */
  async getDashboardStats(): Promise<ClientStats> {
    try {
      const response = await this.api.get<ClientStats>('/clients/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de crecimiento de clientes
   */
  async getClientGrowth(
    period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<ClientGrowthData[]> {
    try {
      const response = await this.api.get<ClientGrowthData[]>(
        '/clients/growth',
        {
          params: { period },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching client growth:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes top por ingresos
   */
  async getTopClients(limit: number = 5): Promise<TopClient[]> {
    try {
      const response = await this.api.get<TopClient[]>('/clients/top', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top clients:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las suscripciones activas
   */
  async getActiveSuscripciones() {
    try {
      const response = await this.api.get('/suscripciones?estado=activo');
      return response.data;
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los tickets abiertos
   */
  async getOpenTickets() {
    try {
      const response = await this.api.get('/tickets?estado=abierto');
      return response.data;
    } catch (error) {
      console.error('Error fetching open tickets:', error);
      throw error;
    }
  }

  /**
   * Obtener transacciones recientes
   */
  async getRecentTransactions(limit: number = 10): Promise<RecentTransaction[]> {
    try {
      const response = await this.api.get<RecentTransaction[]>(
        '/transactions/recent',
        {
          params: { limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Obtener últimos clientes suscritos
   */
  async getRecentSubscribedClients(limit: number = 5): Promise<RecentSubscribedClient[]> {
    try {
      const response = await this.api.get<RecentSubscribedClient[]>(
        '/clients/recent-subscribed',
        {
          params: { limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent subscribed clients:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las facturas del mes
   */
  async getMonthlyFacturas() {
    try {
      const response = await this.api.get('/facturas?periodo=mes');
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly invoices:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de distribución de ingresos
   */
  async getRevenueDistribution() {
    try {
      const response = await this.api.get('/clients/revenue-distribution');
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue distribution:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de clientes por categoría
   */
  async getClientsByCategory() {
    try {
      const response = await this.api.get('/clients/by-category');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients by category:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de servicios más vendidos
   */
  async getTopServices(limit: number = 5) {
    try {
      const response = await this.api.get('/servicios/top', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top services:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen completo del dashboard
   */
  async getFullDashboard(): Promise<DashboardData> {
    try {
      const [stats, clientGrowth, topClients, recentTransactions] =
        await Promise.all([
          this.getDashboardStats(),
          this.getClientGrowth(),
          this.getTopClients(),
          this.getRecentTransactions(),
        ]);

      return {
        stats,
        clientGrowth,
        topClients,
        recentTransactions,
      };
    } catch (error) {
      console.error('Error fetching full dashboard:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo cliente
   */
  async createClient(clientData: any) {
    try {
      const response = await this.api.post('/clientes', clientData);
      return response.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * Actualizar cliente
   */
  async updateClient(clientId: string, clientData: any) {
    try {
      const response = await this.api.put(`/clientes/${clientId}`, clientData);
      return response.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * Obtener cliente por ID
   */
  async getClientById(clientId: string) {
    try {
      const response = await this.api.get(`/clientes/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las facturas de un cliente
   */
  async getClientFacturas(clientId: string) {
    try {
      const response = await this.api.get(
        `/facturas?cliente_id=${clientId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching client invoices:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las suscripciones de un cliente
   */
  async getClientSuscripciones(clientId: string) {
    try {
      const response = await this.api.get(
        `/suscripciones?cliente_id=${clientId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching client subscriptions:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets de un cliente
   */
  async getClientTickets(clientId: string) {
    try {
      const response = await this.api.get(
        `/tickets?cliente_id=${clientId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching client tickets:', error);
      throw error;
    }
  }

  /**
   * Exportar reporte en PDF
   */
  async exportToPDF(data: any) {
    try {
      const response = await this.api.post('/reports/export-pdf', data, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Exportar reporte en Excel
   */
  async exportToExcel(data: any) {
    try {
      const response = await this.api.post('/reports/export-excel', data, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }
}

export default new ClientsDashboardAPI();
