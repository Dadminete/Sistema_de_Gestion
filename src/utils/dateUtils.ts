/**
 * Utilidades para manejo de fechas
 * Convierte entre formatos DD/MM/YYYY e ISO 8601
 */

/**
 * Convierte una fecha ISO (YYYY-MM-DD) a formato DD/MM/YYYY
 * @param isoDate - Fecha en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
 * @returns Fecha en formato DD/MM/YYYY o string vacío si la entrada es inválida
 */
export const isoToDDMMYYYY = (isoDate?: string | null): string => {
  if (!isoDate) return '';
  
  try {
    // Manejar tanto YYYY-MM-DD como YYYY-MM-DDTHH:mm:ss
    const dateString = isoDate.split('T')[0];
    const [year, month, day] = dateString.split('-');
    
    if (!year || !month || !day) return '';
    
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    
    return `${dayNum.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year}`;
  } catch {
    return '';
  }
};

/**
 * Convierte una fecha en formato DD/MM/YYYY a ISO (YYYY-MM-DD)
 * @param ddmmyyyyDate - Fecha en formato DD/MM/YYYY
 * @returns Fecha en formato ISO (YYYY-MM-DD) o string vacío si la entrada es inválida
 */
export const ddmmyyyyToISO = (ddmmyyyyDate: string): string => {
  if (!ddmmyyyyDate || ddmmyyyyDate.trim() === '') return '';
  
  try {
    const parts = ddmmyyyyDate.split('/');
    if (parts.length !== 3) return '';
    
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    // Validar que año tenga 4 dígitos
    if (year.length !== 4) return '';
    
    // Validar números
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(dayNum) || isNaN(monthNum) || dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
      return '';
    }
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Convierte una fecha en formato DD/MM/YYYY a ISO DateTime (para Prisma)
 * @param ddmmyyyyDate - Fecha en formato DD/MM/YYYY
 * @param hour - Hora (por defecto 12)
 * @param minute - Minuto (por defecto 0)
 * @param second - Segundo (por defecto 0)
 * @returns ISO DateTime o undefined si la entrada es inválida
 */
export const ddmmyyyyToISODateTime = (
  ddmmyyyyDate: string,
  hour = 12,
  minute = 0,
  second = 0
): string | undefined => {
  const isoDate = ddmmyyyyToISO(ddmmyyyyDate);
  if (!isoDate) return undefined;
  
  try {
    // Construir directamente el ISO string sin problemas de zona horaria
    const [year, month, day] = isoDate.split('-');
    const hourStr = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');
    const secondStr = String(second).padStart(2, '0');
    
    // Retornar en formato ISO con Z (UTC)
    return `${year}-${month}-${day}T${hourStr}:${minuteStr}:${secondStr}Z`;
  } catch {
    return undefined;
  }
};

/**
 * Obtiene hoy en formato ISO (YYYY-MM-DD)
 */
export const getTodayISO = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene hoy en formato DD/MM/YYYY
 */
export const getTodayDDMMYYYY = (): string => {
  return isoToDDMMYYYY(getTodayISO());
};

/**
 * Valida si una cadena tiene formato DD/MM/YYYY válido
 */
export const isValidDDMMYYYY = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.match(regex);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Validaciones básicas
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Validar días por mes
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Considerar años bisiestos
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29;
  }
  
  if (day > daysInMonth[month - 1]) return false;
  
  return true;
};

/**
 * Formatea una fecha para mostrarla en UI (DD/MM/YYYY)
 */
export const formatDateForDisplay = (isoDate?: string | null | Date): string => {
  if (!isoDate) return 'N/A';
  
  try {
    let date: Date;
    if (typeof isoDate === 'string') {
      date = new Date(isoDate);
    } else {
      date = isoDate;
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
};
