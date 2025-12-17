import { apiClient } from '../utils/apiClient';

export interface CommissionType {
    id: string | number;
    nombreTipo: string;
    descripcion?: string;
    porcentajeBase?: number;
    montoFijo?: number;
    activo: boolean;
}

export interface Commission {
    id: string | number;
    empleadoId: string | number;
    tipoComisionId: string | number;
    periodoAno: number;
    periodoMes: number;
    montoBase: number;
    porcentajeAplicado: number;
    montoComision: number;
    descripcion?: string;
    fechaGeneracion: string;
    estado: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
    fechaPago?: string;
    observaciones?: string;
    empleado?: {
        id: string | number;
        nombres: string;
        apellidos: string;
        cedula?: string;
        codigoEmpleado: string;
    };
    tipoComision?: CommissionType;
}

export interface CommissionStats {
    total: number;
    totalPendiente: number;
    totalPagado: number;
    montoPendiente: number;
    montoPagado: number;
    montoCancelado: number;
}

export interface CommissionFilters {
    empleadoId?: string | number;
    tipoComisionId?: string | number;
    periodoAno?: number;
    periodoMes?: number;
    estado?: string;
}

// Commission Types
export const getCommissionTypes = async (includeInactive = false): Promise<CommissionType[]> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get(`/rrhh/comisiones/types${params}`);
    return response;
};

export const createCommissionType = async (data: Partial<CommissionType>): Promise<CommissionType> => {
    const response = await apiClient.post('/rrhh/comisiones/types', data);
    return response;
};

export const updateCommissionType = async (id: string | number, data: Partial<CommissionType>): Promise<CommissionType> => {
    const response = await apiClient.put(`/rrhh/comisiones/types/${id}`, data);
    return response;
};

export const deleteCommissionType = async (id: string | number): Promise<void> => {
    await apiClient.delete(`/rrhh/comisiones/types/${id}`);
};

// Commissions
export const getCommissions = async (filters?: CommissionFilters): Promise<Commission[]> => {
    const params = new URLSearchParams();
    if (filters?.empleadoId) params.append('empleadoId', String(filters.empleadoId));
    if (filters?.tipoComisionId) params.append('tipoComisionId', String(filters.tipoComisionId));
    if (filters?.periodoAno) params.append('periodoAno', String(filters.periodoAno));
    if (filters?.periodoMes) params.append('periodoMes', String(filters.periodoMes));
    if (filters?.estado) params.append('estado', filters.estado);
    
    const queryString = params.toString();
    const response = await apiClient.get(`/rrhh/comisiones${queryString ? `?${queryString}` : ''}`);
    return response;
};

export const getCommissionById = async (id: string | number): Promise<Commission> => {
    const response = await apiClient.get(`/rrhh/comisiones/${id}`);
    return response;
};

export const getEmployeeCommissions = async (
    empleadoId: string | number,
    year?: number,
    month?: number
): Promise<Commission[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    
    const queryString = params.toString();
    const response = await apiClient.get(`/rrhh/comisiones/employee/${empleadoId}${queryString ? `?${queryString}` : ''}`);
    return response;
};

export const createCommission = async (data: Partial<Commission>): Promise<Commission> => {
    const response = await apiClient.post('/rrhh/comisiones', data);
    return response;
};

export const updateCommission = async (id: string | number, data: Partial<Commission>): Promise<Commission> => {
    const response = await apiClient.put(`/rrhh/comisiones/${id}`, data);
    return response;
};

export const markAsPaid = async (id: string | number, fechaPago?: string): Promise<Commission> => {
    const response = await apiClient.put(`/rrhh/comisiones/${id}/pay`, { fechaPago });
    return response;
};

export const deleteCommission = async (id: string | number): Promise<void> => {
    await apiClient.delete(`/rrhh/comisiones/${id}`);
};

export const calculateCommission = async (
    tipoComisionId: string | number,
    montoBase: number
): Promise<{ montoComision: number; porcentajeAplicado: number }> => {
    const response = await apiClient.post('/rrhh/comisiones/calculate', {
        tipoComisionId,
        montoBase
    });
    return response;
};

export const getCommissionStats = async (year?: number, month?: number): Promise<CommissionStats> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    
    const queryString = params.toString();
    const response = await apiClient.get(`/rrhh/comisiones/stats${queryString ? `?${queryString}` : ''}`);
    return response;
};
