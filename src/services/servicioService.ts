import type { ServicioWithCategory, PaginationOptions, FilterOptions } from '../types/database';
import { apiClient } from '../utils/apiClient';

export class ServicioService {
  // Get all services with pagination and filters
  async getServicios(options: PaginationOptions & FilterOptions = {}) {
    const { page = 1, limit = 10, search, status, category } = options;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status !== undefined && { status: status.toString() }),
      ...(category && { category })
    });

    return apiClient.get(`/servicios?${queryParams}`);
  }

  // Get service by ID with full relations
  async getServicioById(id: string): Promise<ServicioWithCategory | null> {
    return apiClient.get(`/servicios/${id}`);
  }

  // Create new service
  async createServicio(data: {
    nombre: string;
    descripcion?: string;
    descripcionCorta?: string;
    categoriaId: string;
    tipo: string;
    esRecurrente?: boolean;
    requierePlan?: boolean;
    precioBase?: number;
    moneda?: string;
    unidadTiempo?: string;
    imagen?: string;
    caracteristicas?: Record<string, any>;
    activo?: boolean;
    destacado?: boolean;
    orden?: number;
  }) {
    return apiClient.post('/servicios', data);
  }

  // Update service
  async updateServicio(id: string, updateData: {
    nombre?: string;
    descripcion?: string;
    descripcionCorta?: string;
    categoriaId?: string;
    tipo?: string;
    esRecurrente?: boolean;
    requierePlan?: boolean;
    precioBase?: number;
    moneda?: string;
    unidadTiempo?: string;
    imagen?: string;
    caracteristicas?: Record<string, any>;
    activo?: boolean;
    destacado?: boolean;
    orden?: number;
  }) {
    return apiClient.put(`/servicios/${id}`, updateData);
  }

  // Delete service (soft delete)
  async deleteServicio(id: string) {
    return apiClient.delete(`/servicios/${id}`);
  }

  // Get service statistics
  async getServicioStats() {
    return apiClient.get('/servicios/stats');
  }

  // Get services by category
  async getServiciosByCategoria(categoriaId: string) {
    return apiClient.get(`/servicios/categoria/${categoriaId}`);
  }

  // Get featured services
  async getServiciosDestacados() {
    return apiClient.get('/servicios/destacados');
  }
}

export const servicioService = new ServicioService();
