/**
 * Formatea un monto numérico con el prefijo RD$ y un espacio
 * con separadores de miles y dos decimales con punto como separador decimal.
 *
 * @param monto - El monto a formatear
 * @returns El monto formateado como string (ej: "RD$ 1,250.00")
 */
export const formatearMonto = (monto: number | string): string => {
  // Asegurar que el monto es un número
  const numeroLimpio = typeof monto === 'string' ? parseFloat(monto) : monto;
  
  // Verificar que es un número válido
  if (isNaN(numeroLimpio)) {
    return 'RD$ 0.00';
  }

  // Formatear manualmente para asegurar el formato correcto
  const partes = numeroLimpio.toFixed(2).toString().split('.');
  const entero = partes[0];
  const decimal = partes[1];
  
  // Agregar comas cada 3 dígitos desde la derecha
  const enteroConComas = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Agregar el prefijo RD$ con un espacio
  return `RD$ ${enteroConComas}.${decimal}`;
};

/**
 * Formatea un monto numérico al formato de moneda dominicana (RD$)
 * con separadores de miles y dos decimales.
 *
 * @param monto - El monto a formatear
 * @param tipo - El tipo de movimiento ('ingreso' o 'gasto') - no usado actualmente
 * @returns El monto formateado como string (ej: "RD$ 1,250.00")
 */
export const formatearMontoConSigno = (monto: number | string, tipo: string): string => {
  return formatearMonto(monto);
};