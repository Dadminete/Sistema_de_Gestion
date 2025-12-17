import { apiClient } from '../utils/apiClient';
import type { Categoria as PrismaCategoria } from '@prisma/client';

export type Categoria = PrismaCategoria;

export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await apiClient.get('/categorias');
  // La API devuelve { value: [...], Count: N }, así que tomamos solo value
  return response.value || response;
};

export const getCategoriaById = async (id: string): Promise<Categoria> => {
  const response = await apiClient.get(`/categorias/${id}`);
  return response.value || response;
};

export const createCategoria = async (data: Omit<Categoria, 'id' | 'createdAt' | 'updatedAt' | 'servicios'>): Promise<Categoria> => {
  const response = await apiClient.post('/categorias', data);
  return response.value || response;
};

export const updateCategoria = async (id: string, data: Partial<Omit<Categoria, 'id' | 'createdAt' | 'updatedAt' | 'servicios'>>): Promise<Categoria> => {
  const response = await apiClient.put(`/categorias/${id}`, data);
  return response.value || response;
};

export const deleteCategoria = async (id: string): Promise<void> => {
  await apiClient.delete(`/categorias/${id}`);
};