import type { PlanWithCategory, PaginationOptions, FilterOptions } from '../types/database';
import { apiClient } from '../utils/apiClient';

export class PlanService {
  // Get all plans with pagination and filters
  async getPlanes(options: PaginationOptions & FilterOptions = {}) {
    const { page = 1, limit = 10, search, status, category } = options;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status !== undefined && { status: status.toString() }),
      ...(category && { category })
    });

    return apiClient.get(`/planes?${queryParams}`);
  }

  // Get plan by ID with full relations
  async getPlanById(id: string): Promise<PlanWithCategory | null> {
    return apiClient.get(`/planes/${id}`);
  }

  // Create new plan
  async createPlan(data: {
    nombre: string;
    descripcion?: string;
    categoriaId: string;
    precio: number;
    moneda?: string;
    subidaMbps: number;
    bajadaMbps: number;
    detalles?: Record<string, any>;
    activo?: boolean;
    orden?: number;
  }) {
    return apiClient.post('/planes', data);
  }

  // Update plan
  async updatePlan(id: string, updateData: {
    nombre?: string;
    descripcion?: string;
    categoriaId?: string;
    precio?: number;
    moneda?: string;
    subidaMbps?: number;
    bajadaMbps?: number;
    detalles?: Record<string, any>;
    activo?: boolean;
    orden?: number;
  }) {
    return apiClient.put(`/planes/${id}`, updateData);
  }

  // Delete plan (soft delete)
  async deletePlan(id: string) {
    return apiClient.delete(`/planes/${id}`);
  }

  // Get plan statistics
  async getPlanStats() {
    return apiClient.get('/planes/stats');
  }

  // Get plans by category
  async getPlanesByCategoria(categoriaId: string) {
    return apiClient.get(`/planes/categoria/${categoriaId}`);
  }

  // Get popular plans (by subscription count)
  async getPlanesPopulares(limit: number = 10) {
    return apiClient.get(`/planes/populares?limit=${limit}`);
  }
}

export const planService = new PlanService();
