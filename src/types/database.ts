import type {
  Usuario,
  Role,
  Permiso,
  Cliente,
  Categoria,
  Servicio,
  Plan,
  Suscripcion,
  Contrato,
  EquipoCliente,
  Factura,
  DetalleFactura,
  Pago,
  Ticket,
  RespuestaTicket,
  Departamento,
  Cargo,
  Empleado,
  TipoComision,
  Comision,
  TipoPrestamo,
  Tarea,
  Prestamo,
  PagoPrestamo,
  TipoVacacion,
  PeriodoVacacion,
  SolicitudVacacion,
  PeriodoNomina,
  Nomina,
  NominaPrestamo,
  NominaComision,
  HistorialSalario,
  Bank,
  CategoriaCuenta,
  CuentaContable,
  CuentaBancaria,
  Caja,
  AsientoContable,
  DetalleAsiento,
  FacturaCliente,
  DetalleFacturaCliente,
  PagoCliente,
  PagoFijo,
  PagoPagoFijo,
  CuentaPorCobrar,
  CuentaPorPagar,
  Traspaso,
  MovimientoContable,
  CategoriaPapeleria,
  ProductoPapeleria,
  MovimientoInventario,
  VentaPapeleria,
  DetalleVentaPapeleria,
  Proveedor,
  CompraPapeleria,
  DetalleCompraPapeleria,
  Chat,
  ChatParticipante,
  MensajeChat,
  Archivo,
  Evento,
  Bitacora,
  SesionUsuario,
  Configuracion,
  Empresa
} from '@prisma/client';

// Note: Enum types are only available if defined in Prisma schema.
// Avoid re-exporting missing enums to prevent build errors.

// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export type RoleWithPermissions = Role & {
  rolesPermisos: { permiso: Permiso }[];
};

export type UserWithRoles = Usuario & {
  usuariosRoles: { rol: Role }[];
};

export type UserWithPermissions = Usuario & {
  usuariosPermisos: { permiso: Permiso }[];
};

// ============================================
// CLIENT TYPES
// ============================================

export type ClienteWithRelations = Cliente & {
  datosISP?: any;
  datosPapeleria?: any;
  datosFinancieros?: any;
  contratos: Contrato[];
  facturas: FacturaCliente[];
  pagos: PagoCliente[];
  tickets: Ticket[];
  cuentasPorCobrar: CuentaPorCobrar[];
  ventasPapeleria: VentaPapeleria[];
  conversaciones: Chat[];
  archivos: Archivo[];
  referidos: Cliente[];
  referidoPor?: Cliente;
};

export type ClienteISPWithData = Cliente & {
  datosISP: any & {
    equipos: EquipoCliente[];
  };
};

// ============================================
// ISP SERVICE TYPES
// ============================================

export type CategoriaWithServices = Categoria & {
  servicios: Servicio[];
  planes: Plan[];
};

export type ServicioWithCategory = Servicio & {
  categoria: Categoria;
  suscripciones: Suscripcion[];
  contratos: Contrato[];
  detallesFacturaCliente: DetalleFacturaCliente[];
};

export type PlanWithCategory = Plan & {
  categoria: Categoria;
  suscripciones: Suscripcion[];
};

export type SuscripcionWithRelations = Suscripcion & {
  contrato: Contrato;
  servicio: Servicio;
  plan?: Plan;
  usuarioRegistro: Usuario;
  facturas: Factura[];
  equipos: EquipoCliente[];
  tickets: Ticket[];
};

export type ContratoWithRelations = Contrato & {
  cliente: Cliente;
  servicio: Servicio;
  suscripciones: Suscripcion[];
  equipos: EquipoCliente[];
  facturas: FacturaCliente[];
  tickets: Ticket[];
};

// ============================================
// EQUIPMENT TYPES
// ============================================

export type EquipoClienteWithRelations = EquipoCliente & {
  datosCliente: any;
  suscripcion?: Suscripcion;
  contrato?: Contrato;
};

// ============================================
// BILLING TYPES
// ============================================

export type FacturaWithRelations = Factura & {
  usuario: Usuario;
  suscripcion?: Suscripcion;
  detalles: DetalleFactura[];
  pagos: Pago[];
};

export type FacturaClienteWithRelations = FacturaCliente & {
  cliente: Cliente;
  contrato?: Contrato;
  facturadaPor?: Usuario;
  detalles: DetalleFacturaCliente[];
  pagos: PagoCliente[];
  cuentasPorCobrar: CuentaPorCobrar[];
};

export type PagoWithRelations = Pago & {
  factura: Factura;
  usuario: Usuario;
};

export type PagoClienteWithRelations = PagoCliente & {
  factura?: FacturaCliente;
  cliente: Cliente;
  cuentaBancaria?: CuentaBancaria;
  caja?: Caja;
  recibidoPor?: Usuario;
};

// ============================================
// SUPPORT TYPES
// ============================================

export type TicketWithRelations = Ticket & {
  cliente: Cliente;
  contrato?: Contrato;
  suscripcion?: Suscripcion;
  usuarioCreador: Usuario;
  tecnicoAsignado?: Empleado;
  respuestas: RespuestaTicket[];
  chats: Chat[];
};

export type RespuestaTicketWithUser = RespuestaTicket & {
  ticket: Ticket;
  usuario: Usuario;
};

// ============================================
// HR TYPES
// ============================================

export type EmpleadoWithRelations = Empleado & {
  usuario: Usuario;
  departamento?: Departamento;
  cargo?: Cargo;
  comisiones: Comision[];
  prestamos: Prestamo[];
  prestamosAprobados: Prestamo[];
  periodosVacaciones: PeriodoVacacion[];
  solicitudesVacaciones: SolicitudVacacion[];
  solicitudesAprobadas: SolicitudVacacion[];
  nominas: Nomina[];
  nominasCalculadas: Nomina[];
  historialSalarios: HistorialSalario[];
  historialAprobados: HistorialSalario[];
  ticketsAsignados: Ticket[];
};

export type DepartamentoWithEmpleados = Departamento & {
  empleados: Empleado[];
};

export type CargoWithEmpleados = Cargo & {
  empleados: Empleado[];
};

export type ComisionWithRelations = Comision & {
  empleado: Empleado;
  tipoComision: TipoComision;
  nominaComisiones: NominaComision[];
};

export type PrestamoWithRelations = Prestamo & {
  empleado: Empleado;
  tipoPrestamo: TipoPrestamo;
  aprobadoPor?: Empleado;
  pagosPrestamos: PagoPrestamo[];
  nominaPrestamos: NominaPrestamo[];
};

export type NominaWithRelations = Nomina & {
  periodo: PeriodoNomina;
  empleado: Empleado;
  calculadoPor?: Empleado;
  nominaPrestamos: NominaPrestamo[];
  nominaComisiones: NominaComision[];
};

// ============================================
// ACCOUNTING TYPES
// ============================================

export type BankWithAccounts = Bank & {
  cuentas: CuentaBancaria[];
  movimientosContables: MovimientoContable[];
};

export type CuentaContableWithRelations = CuentaContable & {
  categoria?: CategoriaCuenta;
  cuentasBancarias: CuentaBancaria[];
  cajas: Caja[];
  detalleAsientos: DetalleAsiento[];
  pagosFijos: PagoFijo[];
};

export type CuentaBancariaWithRelations = CuentaBancaria & {
  bank: Bank;
  cuentaContable: CuentaContable;
  pagos: PagoCliente[];
  ventasPapeleria: VentaPapeleria[];
  traspasosOrigen: Traspaso[];
  traspasosDestino: Traspaso[];
  movimientosContables: MovimientoContable[];
};

export type CajaWithRelations = Caja & {
  cuentaContable?: CuentaContable;
  responsable?: Usuario;
  pagos: PagoCliente[];
  ventasPapeleria: VentaPapeleria[];
  detalleAsientos: DetalleAsiento[];
  traspasosOrigen: Traspaso[];
  traspasosDestino: Traspaso[];
};

export type AsientoContableWithRelations = AsientoContable & {
  creadoPor?: Usuario;
  detalles: DetalleAsiento[];
};

// ============================================
// STATIONERY TYPES
// ============================================

export type CategoriaPapeleriaWithProducts = CategoriaPapeleria & {
  productos: ProductoPapeleria[];
};

export type ProductoPapeleriaWithRelations = ProductoPapeleria & {
  categoria: CategoriaPapeleria;
  proveedor?: Proveedor;
  movimientos: MovimientoInventario[];
  detallesVenta: DetalleVentaPapeleria[];
  detallesFacturaCliente: DetalleFacturaCliente[];
  detallesCompra: DetalleCompraPapeleria[];
};

export type VentaPapeleriaWithRelations = VentaPapeleria & {
  usuario: Usuario;
  cliente?: Cliente;
  cuentaBancaria?: CuentaBancaria;
  caja?: Caja;
  detalles: DetalleVentaPapeleria[];
};

export type ProveedorWithRelations = Proveedor & {
  productos: ProductoPapeleria[];
  compras: CompraPapeleria[];
  pagosFijos: PagoFijo[];
  cuentasPorPagar: CuentaPorPagar[];
};

export type CompraPapeleriaWithRelations = CompraPapeleria & {
  proveedor: Proveedor;
  recibidaPor?: Usuario;
  detalles: DetalleCompraPapeleria[];
};

// ============================================
// COMMUNICATION TYPES
// ============================================

export type ChatWithRelations = Chat & {
  cliente?: Cliente;
  ticket?: Ticket;
  creadoPor: Usuario;
  mensajes: MensajeChat[];
  participantes: ChatParticipante[];
};

export type MensajeChatWithRelations = MensajeChat & {
  chat: Chat;
  usuario: Usuario;
  archivo?: Archivo;
};

export type ArchivoWithRelations = Archivo & {
  subidoPor: Usuario;
  cliente?: Cliente;
  mensajes: MensajeChat[];
};

// ============================================
// CALENDAR TYPES
// ============================================

export type EventoWithCreator = Evento & {
  creadoPor: Usuario;
};

// ============================================
// UTILITY TYPES
// ============================================

export type PaginationOptions = {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
};

export type FilterOptions = {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
