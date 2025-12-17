import { apiClient } from '../utils/apiClient';

export interface CategoriaCuenta {
  id: string;
  nombre: string;
  codigo: string;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  subtipo?: string | null;
  esDetalle: boolean;
  activa: boolean;
  descripcion?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getAllCategoriasCuentas = async (): Promise<CategoriaCuenta[]> => {
  const response = await apiClient.get('/contabilidad/categorias-cuentas');
  return response;
};

export const getCategoriaCuentaById = async (id: string): Promise<CategoriaCuenta> => {
  const response = await apiClient.get(`/contabilidad/categorias-cuentas/${id}`);
  return response;
};

export const createCategoriaCuenta = async (data: Omit<CategoriaCuenta, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoriaCuenta> => {
  const response = await apiClient.post('/contabilidad/categorias-cuentas', data);
  return response;
};

export const updateCategoriaCuenta = async (id: string, data: Partial<Omit<CategoriaCuenta, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CategoriaCuenta> => {
  const response = await apiClient.put(`/contabilidad/categorias-cuentas/${id}`, data);
  return response;
};

export const deleteCategoriaCuenta = async (id: string): Promise<void> => {
  await apiClient.delete(`/contabilidad/categorias-cuentas/${id}`);
};