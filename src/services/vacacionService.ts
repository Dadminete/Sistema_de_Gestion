import axios from '@/services/api';

export interface TipoVacacion {
    id: string; // BigInt serialized as string
    nombreTipo: string;
    descripcion: string;
    diasPorAno: string;
    acumulable: boolean;
    maximoAcumulable: number;
    activo: boolean;
}

export interface PeriodoVacacion {
    id: string;
    empleadoId: string;
    tipoVacacionId: string;
    ano: number;
    diasGanados: string;
    diasTomados: string;
    diasPagados: string;
    diasDisponibles: string;
    fechaCorte: string;
    observaciones: string;
    tipoVacacion?: TipoVacacion;
    empleado?: {
        nombres: string;
        apellidos: string;
        codigoEmpleado: string;
    };
}

export interface SolicitudVacacion {
    id: string;
    empleadoId: string;
    tipoVacacionId: string;
    fechaInicio: string;
    fechaFin: string;
    diasSolicitados: number;
    motivo: string;
    fechaSolicitud: string;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
    aprobadoPorId: string;
    fechaAprobacion: string;
    observacionesAprobacion: string;
    pagoAdelantado: boolean;
    montoPago: string;
    tipoVacacion?: TipoVacacion;
    aprobadoPor?: {
        nombres: string;
        apellidos: string;
    };
    empleado?: {
        id: string;
        nombres: string;
        apellidos: string;
        cargo?: {
            nombreCargo: string;
        };
    };
}

export const vacacionService = {
    getAllTipos: async (): Promise<TipoVacacion[]> => {
        const response = await axios.get('/rrhh/vacaciones/tipos');
        return response.data;
    },

    getPeriodosByEmpleado: async (empleadoId: string): Promise<PeriodoVacacion[]> => {
        const response = await axios.get(`/rrhh/vacaciones/periodos/${empleadoId}`);
        return response.data;
    },

    getSolicitudesByEmpleado: async (empleadoId: string): Promise<SolicitudVacacion[]> => {
        const response = await axios.get(`/rrhh/vacaciones/solicitudes/${empleadoId}`);
        return response.data;
    },

    getPendingSolicitudes: async (): Promise<SolicitudVacacion[]> => {
        const response = await axios.get('/rrhh/vacaciones/admin/solicitudes-pendientes');
        return response.data;
    },

    createSolicitud: async (data: Partial<SolicitudVacacion>): Promise<SolicitudVacacion> => {
        const response = await axios.post('/rrhh/vacaciones/solicitar', data);
        return response.data;
    },

    updateStatus: async (id: string, estado: string, aprobadoPorId: string, observaciones?: string): Promise<SolicitudVacacion> => {
        const response = await axios.patch(`/rrhh/vacaciones/solicitudes/${id}/estado`, {
            estado,
            aprobadoPorId,
            observaciones
        });
        return response.data;
    },

    assignPeriodo: async (data: { empleadoId: string | number, tipoVacacionId: string | number, ano: number, diasGanados: number, observaciones?: string }) => {
        const response = await axios.post('/rrhh/vacaciones/admin/asignar-periodo', data);
        return response.data;
    },

    getAllPeriodos: async (): Promise<PeriodoVacacion[]> => {
        const response = await axios.get('/rrhh/vacaciones/admin/periodos');
        return response.data;
    },

    updateSolicitud: async (id: string, data: any) => {
        const response = await axios.put(`/rrhh/vacaciones/solicitudes/${id}`, data);
        return response.data;
    },

    deleteSolicitud: async (id: string) => {
        const response = await axios.delete(`/rrhh/vacaciones/solicitudes/${id}`);
        return response.data;
    }
};
