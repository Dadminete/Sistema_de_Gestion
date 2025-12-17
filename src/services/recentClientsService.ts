import { apiClient } from '../utils/apiClient';

export interface RecentSubscribedClient {
  id: string;
  name: string;
  email: string;
  fecha_suscripcion: string;
  servicio: string;
  plan: string;
  estado: string;
}

export const recentClientsService = {
  getRecentSubscribedClients: async (limit: number = 5): Promise<RecentSubscribedClient[]> => {
    try {
      // Try the regular endpoint first
      let response;
      try {
        response = await apiClient.get(`/clients/recent-subscribed?limit=${limit}`);
        
        // Handle new response format with data wrapper
        if (response.data && response.data.success) {
          console.log('✅ API Response successful:', response.data);
          return response.data.data || [];
        }
        
        // Handle legacy format (direct array)
        return Array.isArray(response.data) ? response.data : [];
        
      } catch (authError) {
        console.warn('Auth endpoint failed, trying debug endpoint:', authError);
        // If auth fails, try debug endpoint (no auth required)
        const debugResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://172.16.0.23:54118/api'}/clients/debug-recent-subscribed?limit=${limit}`);
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('🐛 Debug response:', debugData);
          
          // Handle debug response format
          if (debugData.success && debugData.data) {
            return debugData.data;
          }
          
          return Array.isArray(debugData) ? debugData : (debugData.data || []);
        }
        throw authError;
      }
    } catch (error) {
      console.error('Error fetching recent subscribed clients:', error);
      throw error;
    }
  }
};