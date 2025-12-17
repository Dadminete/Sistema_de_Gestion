import { apiClient } from '../utils/apiClient';

export interface Bank {
  id: string;
  nombre: string;
  codigo?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  cuentas?: CuentaBancaria[];
}

export interface CuentaBancaria {
  id: string;
  bankId: string;
  numeroCuenta: string;
  tipoCuenta?: string;
  moneda: string;
  nombreOficialCuenta?: string;
  cuentaContableId: string;
  activo: boolean;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  nombre: string; // Added for display
  saldo: number; // Added for balance
  bank?: Bank;
  cuentaContable?: {
    nombre: string;
    saldoActual: number;
  };
}

export interface BankWithAccounts extends Bank {
  cuentas: CuentaBancaria[];
}

export interface ClientPayment {
  id: string;
  numeroPago: string;
  fechaPago: string;
  monto: number;
  metodoPago: string;
  numeroReferencia?: string;
  estado: string;
  observaciones?: string;
  cliente: {
    id: string;
    nombre: string;
    apellidos: string;
    codigoCliente: string;
    email?: string;
  };
  factura?: {
    id: string;
    numeroFactura: string;
  };
  cuentaBancaria?: {
    id: string;
    numeroCuenta: string;
    nombreOficialCuenta?: string;
  };
  recibidoPor?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

// Banks
export const getBanks = async (): Promise<BankWithAccounts[]> => {
  const response = await apiClient.get('/banks');
  return response;
};

export const getBankById = async (id: string): Promise<BankWithAccounts | null> => {
  try {
    const response = await apiClient.get(`/banks/${id}`);
    return response;
  } catch (err) {
    console.log('Error in getBankById:', err);
    const error = err as any;
    console.log('Error status:', error.status);
    if (error.status === 404) {
      console.log('Returning null for 404');
      return null;
    }
    throw err;
  }
};

export const createBank = async (data: Omit<Bank, 'id' | 'createdAt' | 'updatedAt' | 'cuentas'>): Promise<Bank> => {
  const response = await apiClient.post('/banks', data);
  return response;
};

export interface UpdateBankData extends Partial<Omit<Bank, 'id' | 'createdAt' | 'updatedAt' | 'cuentas'>> {
  cuentas?: Partial<CuentaBancaria>[];
}

export const updateBank = async (id: string, data: UpdateBankData): Promise<Bank> => {
  const response = await apiClient.put(`/banks/${id}`, data);
  return response;
};

export const deleteBank = async (id: string): Promise<void> => {
  await apiClient.delete(`/banks/${id}`);
};

// Bank Accounts
export const getAccountsByBankId = async (bankId: string): Promise<CuentaBancaria[]> => {
  const response = await apiClient.get(`/banks/${bankId}/accounts`);
  return response;
};

export const getAccountById = async (id: string): Promise<CuentaBancaria> => {
  const response = await apiClient.get(`/banks/accounts/${id}`);
  return response;
};

export const createAccount = async (data: Omit<CuentaBancaria, 'id' | 'createdAt' | 'updatedAt' | 'bank' | 'cuentaContable' | 'nombre' | 'saldo'>): Promise<CuentaBancaria> => {
  const response = await apiClient.post(`/banks/${data.bankId}/accounts`, data);
  return response;
};

export const updateAccount = async (id: string, data: Partial<Omit<CuentaBancaria, 'id' | 'createdAt' | 'updatedAt' | 'bank' | 'cuentaContable' | 'nombre' | 'saldo'>>): Promise<CuentaBancaria> => {
  const response = await apiClient.put(`/banks/accounts/${id}`, data);
  return response;
};

export const deleteAccount = async (id: string): Promise<void> => {
  await apiClient.delete(`/banks/accounts/${id}`);
};

// Client Payments
export const getClientPaymentsByBank = async (bankId: string): Promise<ClientPayment[]> => {
  const response = await apiClient.get(`/banks/${bankId}/client-payments`);
  return response;
};
