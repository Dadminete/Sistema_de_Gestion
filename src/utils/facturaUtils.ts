// Calcular próxima fecha de facturación basada en día de facturación
export const calcularFechaFacturacion = (diaFacturacion: number): Date => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth();
  
  // Crear fecha con el día de facturación del mes actual
  let fechaFactura = new Date(año, mes, diaFacturacion);
  
  // Si ya pasó el día de facturación este mes, usar el próximo mes
  if (fechaFactura < hoy) {
    fechaFactura = new Date(año, mes + 1, diaFacturacion);
  }
  
  return fechaFactura;
};

// Calcular fecha de vencimiento (+5 días)
export const calcularFechaVencimiento = (fechaFactura: Date): Date => {
  const fecha = new Date(fechaFactura);
  fecha.setDate(fecha.getDate() + 5);
  return fecha;
};

// Calcular período facturado (30 días)
export const calcularPeriodoFacturado = (fechaFactura: Date): { inicio: Date; fin: Date } => {
  const inicio = new Date(fechaFactura);
  const fin = new Date(fechaFactura);
  fin.setDate(fin.getDate() + 30);
  
  return { inicio, fin };
};

// Formatear fecha a string (DD/MM/YYYY)
export const formatearFecha = (fecha: Date | string): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const año = date.getFullYear();
  return `${dia}/${mes}/${año}`;
};

// Formatear fecha para input type="date" (YYYY-MM-DD)
export const formatearFechaInput = (fecha: Date | string): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const año = date.getFullYear();
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const dia = date.getDate().toString().padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

// Formatear moneda (RD$)
export const formatearMoneda = (monto: number): string => {
  return `RD$ ${monto.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Calcular subtotal de una línea de detalle
export const calcularSubtotal = (cantidad: number, precioUnitario: number): number => {
  return cantidad * precioUnitario;
};

// Calcular total de una línea de detalle (subtotal - descuento + impuesto)
export const calcularTotalLinea = (
  cantidad: number,
  precioUnitario: number,
  descuento: number = 0,
  impuesto: number = 0
): number => {
  const subtotal = calcularSubtotal(cantidad, precioUnitario);
  return subtotal - descuento + impuesto;
};

// Calcular totales de factura
export const calcularTotalesFactura = (detalles: Array<{
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  impuesto?: number;
}>): {
  subtotal: number;
  descuentoTotal: number;
  impuestoTotal: number;
  total: number;
} => {
  let subtotal = 0;
  let descuentoTotal = 0;
  let impuestoTotal = 0;
  
  detalles.forEach(detalle => {
    const lineaSubtotal = calcularSubtotal(detalle.cantidad, detalle.precioUnitario);
    subtotal += lineaSubtotal;
    descuentoTotal += detalle.descuento || 0;
    impuestoTotal += detalle.impuesto || 0;
  });
  
  const total = subtotal - descuentoTotal + impuestoTotal;
  
  return {
    subtotal,
    descuentoTotal,
    impuestoTotal,
    total
  };
};

// Obtener color de estado de factura
export const obtenerColorEstado = (estado: string): string => {
  const colores: Record<string, string> = {
    'pendiente': '#f59e0b', // Amarillo
    'pagada': '#10b981',    // Verde
    'parcial': '#3b82f6',   // Azul
    'anulada': '#ef4444',   // Rojo
    'vencida': '#dc2626'    // Rojo oscuro
  };
  return colores[estado] || '#6b7280'; // Gris por defecto
};

// Obtener texto de estado de factura
export const obtenerTextoEstado = (estado: string): string => {
  const textos: Record<string, string> = {
    'pendiente': 'Pendiente',
    'pagada': 'Pagada',
    'parcial': 'Pago Parcial',
    'anulada': 'Anulada',
    'vencida': 'Vencida'
  };
  return textos[estado] || estado;
};

// Verificar si una factura está vencida
export const estaVencida = (fechaVencimiento: Date | string, estado: string): boolean => {
  if (estado === 'pagada' || estado === 'anulada') return false;
  
  const fecha = typeof fechaVencimiento === 'string' ? new Date(fechaVencimiento) : fechaVencimiento;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  
  return fecha < hoy;
};

// Calcular días vencidos
export const calcularDiasVencidos = (fechaVencimiento: Date | string): number => {
  const fecha = typeof fechaVencimiento === 'string' ? new Date(fechaVencimiento) : fechaVencimiento;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  
  const diferencia = hoy.getTime() - fecha.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  
  return dias > 0 ? dias : 0;
};

// Validar datos de factura
export const validarFactura = (data: {
  clienteId?: string;
  detalles?: Array<any>;
  itbis?: number;
  formaPago?: string;
}): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];
  
  if (!data.clienteId) {
    errores.push('Debe seleccionar un cliente');
  }
  
  if (!data.detalles || data.detalles.length === 0) {
    errores.push('Debe agregar al menos un detalle a la factura');
  }
  
  if (data.detalles) {
    data.detalles.forEach((detalle, index) => {
      if (!detalle.concepto || detalle.concepto.trim() === '') {
        errores.push(`El detalle ${index + 1} debe tener un concepto`);
      }
      if (!detalle.cantidad || detalle.cantidad <= 0) {
        errores.push(`El detalle ${index + 1} debe tener una cantidad válida`);
      }
      if (!detalle.precioUnitario || detalle.precioUnitario <= 0) {
        errores.push(`El detalle ${index + 1} debe tener un precio unitario válido`);
      }
    });
  }
  
  // if (!data.formaPago) {
  //   errores.push('Debe seleccionar una forma de pago');
  // }
  
  if (data.itbis !== undefined && data.itbis < 0) {
    errores.push('El ITBIS no puede ser negativo');
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
};

export default {
  calcularFechaFacturacion,
  calcularFechaVencimiento,
  calcularPeriodoFacturado,
  formatearFecha,
  formatearFechaInput,
  formatearMoneda,
  calcularSubtotal,
  calcularTotalLinea,
  calcularTotalesFactura,
  obtenerColorEstado,
  obtenerTextoEstado,
  estaVencida,
  calcularDiasVencidos,
  validarFactura
};
