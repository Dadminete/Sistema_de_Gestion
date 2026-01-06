import { apiClient } from '../utils/apiClient';

export interface Employee {
  id: string;
  codigoEmpleado: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  cargoId: string;
  departamentoId: string;
  fechaIngreso: string;
  salarioBase: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'VACACIONES' | 'LICENCIA';
  cargo?: { nombreCargo: string };
  departamento?: { nombre: string };
  usuarioId?: string;
  usuario?: { username: string; avatar?: string };
}

export interface PayrollPeriod {
  id: string;
  codigoPeriodo: string;
  ano: number;
  mes?: number;
  quincena?: number;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
  estado: string;
  tipoPeriodo: string;
  observaciones?: string;
  _count?: { nominas: number };
}

export interface Payroll {
  id: string;
  periodoId: string;
  empleadoId: string;
  diasTrabajados: number;
  horasTrabajadas?: number;
  salarioBase: number;
  horasExtrasOrdinarias: number;
  horasExtrasNocturnas: number;
  horasExtrasFeriados: number;
  bonificaciones: number;
  comisiones: number;
  viaticos: number;
  subsidios: number;
  retroactivos: number;
  vacacionesPagadas: number;
  otrosIngresos: number;
  seguridadSocial: number;
  seguroSalud: number;
  isr: number;
  prestamos: number;
  adelantos: number;
  faltas: number;
  tardanzas: number;
  otrasDeducciones: number;
  totalIngresos: number;
  totalDeducciones: number;
  salarioNeto: number;
  formaPago?: string;
  numeroTransaccion?: string;
  fechaPago?: string;
  estadoPago: string;
  observaciones?: string;
  empleado?: Employee;
  periodo?: PayrollPeriod;
}

export interface Loan {
  id: string;
  empleadoId: string;
  montoSolicitado: number;
  montoAprobado: number;
  plazoMeses: number;
  cuotaMensual: number;
  estado: 'SOLICITADO' | 'APROBADO' | 'RECHAZADO' | 'PAGADO';
  empleado?: Employee;
}

export interface Commission {
  id: string;
  empleadoId: string;
  montoComision: number;
  fechaGeneracion: string;
  estado: 'PENDIENTE' | 'PAGADO';
  empleado?: Employee;
}

export const hrService = {
  // Employees
  getEmployees: async () => {
    return apiClient.get('/rrhh/empleados');
  },
  
  getEmployeeById: async (id: string) => {
    return apiClient.get(`/rrhh/empleados/${id}`);
  },

  createEmployee: async (data: any) => {
    return apiClient.post('/rrhh/empleados', data);
  },

  updateEmployee: async (id: string, data: any) => {
    return apiClient.put(`/rrhh/empleados/${id}`, data);
  },

  deleteEmployee: async (id: string) => {
    return apiClient.delete(`/rrhh/empleados/${id}`);
  },

  // Payroll Periods
  getPayrollHistory: async () => {
    return apiClient.get('/rrhh/nomina/stats/history');
  },

  getPayrollPeriods: async () => {
    return apiClient.get('/rrhh/nomina/periods');
  },

  getPayrollPeriodById: async (id: string) => {
    return apiClient.get(`/rrhh/nomina/periods/${id}`);
  },

  createPayrollPeriod: async (data: any) => {
    return apiClient.post('/rrhh/nomina/periods', data);
  },

  updatePayrollPeriod: async (id: string, data: any) => {
    return apiClient.put(`/rrhh/nomina/periods/${id}`, data);
  },

  deletePayrollPeriod: async (id: string) => {
    return apiClient.delete(`/rrhh/nomina/periods/${id}`);
  },

  generatePayrollForPeriod: async (periodId: string, employeeIds?: string[], payrollDetails?: any) => {
    return apiClient.post(`/rrhh/nomina/periods/${periodId}/generate`, { employeeIds, payrollDetails });
  },

  // Payroll Records
  getPayrollsByPeriod: async (periodId: string) => {
    return apiClient.get(`/rrhh/nomina/periods/${periodId}/payrolls`);
  },

  getPayrollById: async (id: string) => {
    return apiClient.get(`/rrhh/nomina/payroll/${id}`);
  },

  getPayrollByEmployee: async (employeeId: string) => {
    return apiClient.get(`/rrhh/nomina/employee/${employeeId}`);
  },

  createPayroll: async (data: any) => {
    return apiClient.post('/rrhh/nomina/payroll', data);
  },

  updatePayroll: async (id: string, data: any) => {
    return apiClient.put(`/rrhh/nomina/payroll/${id}`, data);
  },

  deletePayroll: async (id: string) => {
    return apiClient.delete(`/rrhh/nomina/payroll/${id}`);
  },

  updatePaymentStatus: async (id: string, status: string, paymentData?: any) => {
    return apiClient.put(`/rrhh/nomina/payroll/${id}/payment`, { status, ...paymentData });
  },

  // Get pending payroll details with employees
  getPendingPayrollDetails: async () => {
    return apiClient.get('/rrhh/nomina/pending-details');
  },

  // Get payment details for all payrolls in a period
  getPaymentDetailsByPeriod: async (periodId: string) => {
    return apiClient.get(`/rrhh/nomina/period/${periodId}/payment-details`);
  },

  // Apply partial payment to payroll
  applyPartialPayment: async (nominaId: string, paymentData: {
    monto: number;
    metodoPago: string;
    cajaId?: string;
    cuentaBancariaId?: string;
    movimientoContableId?: string;
  }) => {
    return apiClient.post(`/rrhh/nomina/payroll/${nominaId}/partial-payment`, paymentData);
  },

  // Loans
  getLoans: async () => {
    return apiClient.get('/rrhh/prestamos');
  },

  getLoanById: async (id: string) => {
    return apiClient.get(`/rrhh/prestamos/${id}`);
  },

  createLoan: async (data: any) => {
    return apiClient.post('/rrhh/prestamos', data);
  },

  updateLoan: async (id: string, data: any) => {
    return apiClient.put(`/rrhh/prestamos/${id}`, data);
  },

  approveLoan: async (id: string, approvalData: any) => {
    return apiClient.post(`/rrhh/prestamos/${id}/approve`, approvalData);
  },

  rejectLoan: async (id: string, motivo: string) => {
    return apiClient.post(`/rrhh/prestamos/${id}/reject`, { motivo });
  },

  deleteLoan: async (id: string) => {
    return apiClient.delete(`/rrhh/prestamos/${id}`);
  },

  // Commissions
  getCommissions: async () => {
    return apiClient.get('/rrhh/comisiones');
  },
  
  // Dashboard Stats - Get real data from database
  getDashboardStats: async () => {
    try {
      const [employeesRes, loansRes, commissionsRes] = await Promise.all([
        apiClient.get('/rrhh/empleados'),
        apiClient.get('/rrhh/prestamos'),
        apiClient.get('/rrhh/comisiones')
      ]);

      const employees = employeesRes.data || employeesRes;
      const loans = loansRes.data || loansRes;
      const commissions = commissionsRes.data || commissionsRes;

      // Calculate total active employees
      const totalEmployees = Array.isArray(employees) ? employees.length : 0;
      const activeEmployees = Array.isArray(employees) 
        ? employees.filter((e: any) => e.estado === 'ACTIVO').length 
        : 0;

      // Calculate monthly payroll from active employees' base salary
      const monthlyPayroll = Array.isArray(employees)
        ? employees
            .filter((e: any) => e.estado === 'ACTIVO')
            .reduce((sum: number, e: any) => sum + (parseFloat(e.salarioBase) || 0), 0)
        : 0;

      // Count approved loans
      const activeLoans = Array.isArray(loans)
        ? loans.filter((l: any) => l.estado === 'APROBADO').length
        : 0;

      // Sum pending commissions
      const pendingCommissions = Array.isArray(commissions)
        ? commissions
            .filter((c: any) => c.estado === 'PENDIENTE')
            .reduce((sum: number, c: any) => sum + (parseFloat(c.montoComision) || 0), 0)
        : 0;

      return {
        totalEmployees,
        monthlyPayroll,
        activeLoans,
        pendingCommissions,
        employeeDistribution: {
          labels: ['Activo', 'Inactivo', 'Vacaciones', 'Licencia'],
          data: [
            Array.isArray(employees) ? employees.filter((e: any) => e.estado === 'ACTIVO').length : 0,
            Array.isArray(employees) ? employees.filter((e: any) => e.estado === 'INACTIVO').length : 0,
            Array.isArray(employees) ? employees.filter((e: any) => e.estado === 'VACACIONES').length : 0,
            Array.isArray(employees) ? employees.filter((e: any) => e.estado === 'LICENCIA').length : 0
          ]
        }
      };
    } catch (error) {
      console.error('Error fetching HR stats:', error);
      return {
        totalEmployees: 0,
        monthlyPayroll: 0,
        activeLoans: 0,
        pendingCommissions: 0,
        employeeDistribution: {
          labels: [],
          data: []
        }
      };
    }
  },



  // Cargos
  getCargos: async () => {
    return apiClient.get('/rrhh/cargos');
  },

  createCargo: async (data: { nombreCargo: string, descripcion?: string }) => {
    return apiClient.post('/rrhh/cargos', data);
  },

  // Departments
  getDepartments: async () => {
    return apiClient.get('/rrhh/departamentos');
  },

  createDepartment: async (data: { nombre: string, descripcion?: string }) => {
    return apiClient.post('/rrhh/departamentos', data);
  },

  // Users (for linking)
  getUsers: async () => {
    return apiClient.get('/users'); // Assuming this endpoint exists, need to verify or create it
  }
};
