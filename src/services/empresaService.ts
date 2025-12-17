// API service for empresa management

export interface Empresa {
  id: string;
  nombre: string;
  razonSocial?: string;
  rnc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  logoUrl?: string;
  sitioWeb?: string;
  monedaPrincipal: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmpresaData {
  nombre: string;
  razonSocial?: string;
  rnc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  logoUrl?: string;
  sitioWeb?: string;
  monedaPrincipal?: string;
}

type UpdateEmpresaData = Partial<CreateEmpresaData>;

import { AuthService } from './authService'; // Import AuthService to get the token

// Get dynamic API base URL (without /api suffix for this service)
const getAPIBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/api$/, ''); // Remove /api suffix
  }
  // Fallback to dynamic detection
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  return `${protocol}://${hostname}${port}`;
};

const API_BASE_URL = getAPIBaseURL();

class EmpresaService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = AuthService.getToken(); // Get the authentication token

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const defaultOptions: RequestInit = {
      headers: defaultHeaders,
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAllEmpresas(): Promise<Empresa[]> {
    return this.request<Empresa[]>('/api/empresa');
  }

  async getEmpresaById(id: string): Promise<Empresa> {
    return this.request<Empresa>(`/api/empresa/${id}`);
  }

  async createEmpresa(data: CreateEmpresaData): Promise<Empresa> {
    return this.request<Empresa>('/api/empresa', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmpresa(id: string, data: UpdateEmpresaData): Promise<Empresa> {
    return this.request<Empresa>(`/api/empresa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmpresa(id: string): Promise<void> {
    await this.request<void>(`/api/empresa/${id}`, {
      method: 'DELETE',
    });
  }
}

export const empresaService = new EmpresaService();
export default empresaService;
