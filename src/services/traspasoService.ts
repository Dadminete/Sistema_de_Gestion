import api from '../services/api';

export interface Traspaso {
  id: string;
  numeroTraspaso: string;
  fechaTraspaso: Date | string;
  monto: number;
  moneda: string;
  conceptoTraspaso: string;
  estado: string;
  cajaOrigenId?: string;
  bancoOrigenId?: string;
  cajaDestinoId?: string;
  bancoDestinoId?: string;
  autorizadoPorId?: string;
  autorizadoPor?: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
  };
  cajaOrigen?: {
    id: string;
    nombre: string;
    tipo: string;
  };
  cajaDestino?: {
    id: string;
    nombre: string;
    tipo: string;
  };
  cuentaBancariaOrigen?: {
    id: string;
    numeroCuenta: string;
    nombreOficialCuenta: string;
    bank: {
      id: string;
      nombre: string;
    };
  };
  cuentaBancariaDestino?: {
    id: string;
    numeroCuenta: string;
    nombreOficialCuenta: string;
    bank: {
      id: string;
      nombre: string;
    };
  };
  createdAt?: Date | string;
}

export interface CreateTraspasoData {
  monto: number;
  conceptoTraspaso: string;
  tipoOrigen: 'caja' | 'banco';
  tipoDestino: 'caja' | 'banco';
  cajaOrigenId?: string;
  bancoOrigenId?: string;
  cajaDestinoId?: string;
  bancoDestinoId?: string;
}

export interface Caja {
  id: string;
  nombre: string;
  tipo: string;
  saldoActual: number;
}

export interface CuentaBancaria {
  id: string;
  numeroCuenta: string;
  nombreOficialCuenta: string;
  tipoCuenta: string;
  bank: {
    id: string;
    nombre: string;
  };
  cuentaContable: {
    saldoActual: number;
  };
}

const traspasoService = {
  /**
   * Obtener todos los traspasos
   */
  async getAllTraspasos(page = 1, limit = 50) {
    try {
      const response = await api.get('/traspasos', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener traspasos');
    }
  },

  /**
   * Obtener un traspaso por ID
   */
  async getTraspasoById(id: string) {
    try {
      const response = await api.get(`/traspasos/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener traspaso');
    }
  },

  /**
   * Crear un nuevo traspaso
   */
  async createTraspaso(data: CreateTraspasoData) {
    try {
      const response = await api.post('/traspasos', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al crear traspaso');
    }
  },

  /**
   * Filtrar traspasos por fechas
   */
  async getTraspasosByFecha(fechaInicio: string, fechaFin: string) {
    try {
      const response = await api.get('/traspasos/filtro/fecha', {
        params: { fechaInicio, fechaFin },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al filtrar traspasos');
    }
  },

  /**
   * Filtrar traspasos por cuenta
   */
  async getTraspasosByCuenta(cuentaId: string, tipo: 'caja' | 'banco') {
    try {
      const response = await api.get(`/traspasos/cuenta/${cuentaId}/${tipo}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al filtrar traspasos');
    }
  },

  /**
   * Obtener todas las cajas activas
   */
  async getCajasActivas(): Promise<Caja[]> {
    try {
      const response = await api.get('/traspasos/cuentas/cajas');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener cajas');
    }
  },

  /**
   * Obtener todas las cuentas bancarias activas
   */
  async getCuentasBancariasActivas(): Promise<CuentaBancaria[]> {
    try {
      const response = await api.get('/traspasos/cuentas/bancos');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener cuentas bancarias');
    }
  },
};

export default traspasoService;
