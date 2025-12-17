import { apiClient } from '../utils/apiClient';

export interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  categoriaId?: string | null;
  tipoCuenta: string;
  moneda: string;
  saldoInicial: number;
  saldoActual: number;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getAllCuentaContables = async (): Promise<CuentaContable[]> => {
  const response = await apiClient.get('/contabilidad/cuentas-contables');
  return response;
};

export const getCuentaContableById = async (id: string): Promise<CuentaContable> => {
  const response = await apiClient.get(`/contabilidad/cuentas-contables/${id}`);
  return response;
};

export const createCuentaContable = async (data: Omit<CuentaContable, 'id'>): Promise<CuentaContable> => {
  const response = await apiClient.post('/contabilidad/cuentas-contables', data);
  return response;
};

export const updateCuentaContable = async (id: string, data: Partial<Omit<CuentaContable, 'id'>>): Promise<CuentaContable> => {
  const response = await apiClient.put(`/contabilidad/cuentas-contables/${id}`, data);
  return response;
};

export const deleteCuentaContable = async (id: string): Promise<void> => {
  await apiClient.delete(`/contabilidad/cuentas-contables/${id}`);
};
