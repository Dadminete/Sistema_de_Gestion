import { apiClient } from '../utils/apiClient';

export const getTotalVentasPapeleria = async (): Promise<number> => {
  try {
    console.log('Fetching total de ventas de papelería...');
        const response = await apiClient.get('/papeleria/ventas/total');
    console.log('Response from ventas-papeleria/total:', response);
    
    // Check if response is valid and has the expected structure
        if (response && typeof response.total === 'number') {
      return response.total;
    } else if (response && typeof response.total === 'string') {
      return parseFloat(response.total);
    } else if (typeof response === 'number') {
      // In case the API returns the number directly
      return response;
    }
    
    console.warn('Unexpected response format from ventas-papeleria/total:', response);
    return 0; // Return 0 as fallback
  } catch (error: any) {
    // Check if it's a 404 error (endpoint not found)
    if (error.status === 404) {
      console.warn('El endpoint /ventas-papeleria/total no está disponible. Mostrando 0 como valor predeterminado.');
      return 0;
    }
    console.error('Error obteniendo el total de ventas de papelería:', error);
    return 0; // Return 0 in case of error to prevent UI breaking
  }
};
