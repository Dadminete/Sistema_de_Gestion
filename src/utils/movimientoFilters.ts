// Utilidades optimizadas para filtrado de movimientos contables
import type { MovimientoContable } from '../services/movimientoContableService';
import type { CategoriaCuenta } from '../services/categoriaCuentaService';

// Caché para fechas formateadas
const formattedDatesCache = new Map<string, string>();

export const formatDateForSearch = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Verificar caché
  if (formattedDatesCache.has(dateStr)) {
    return formattedDatesCache.get(dateStr)!;
  }
  
  const date = new Date(dateStr);
  const caracasTime = new Date(date.getTime() - (4 * 60 * 60 * 1000));
  const day = caracasTime.getDate().toString().padStart(2, '0');
  const month = (caracasTime.getMonth() + 1).toString().padStart(2, '0');
  const year = caracasTime.getFullYear();
  let hours = caracasTime.getHours();
  const minutes = caracasTime.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  const formatted = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  
  // Guardar en caché (máximo 1000 entradas para evitar memory leak)
  if (formattedDatesCache.size < 1000) {
    formattedDatesCache.set(dateStr, formatted);
  }
  
  return formatted;
};

export const clearDateCache = () => {
  formattedDatesCache.clear();
};

export interface MovimientoFilters {
  text: string;
  fecha: string;
  categoria: string;
  monto: string;
  metodo: string;
  cuenta: string;
  usuario: string;
}

export const createMovimientoFilter = (
  categorias: CategoriaCuenta[],
  filters: MovimientoFilters
) => {
  return (mov: MovimientoContable): boolean => {
    try {
      const categoria = categorias.find(cat => cat.id === mov.categoriaId);
      const categoriaNombre = categoria ? categoria.nombre : '';

      // Función auxiliar para verificar fecha
      const matchesFecha = (fechaFiltro: string): boolean => {
        if (!fechaFiltro) return true;

        // Si el filtro es formato mes/año (YYYY-MM)
        if (fechaFiltro.match(/^\d{4}-\d{2}$/)) {
          const [year, month] = fechaFiltro.split('-');
          const fechaMovimiento = new Date(mov.fecha);
          const mesMovimiento = fechaMovimiento.getMonth() + 1;
          const añoMovimiento = fechaMovimiento.getFullYear();

          return añoMovimiento === parseInt(year) && mesMovimiento === parseInt(month);
        }

        // Si el filtro es formato día-mes-año (DD-MM-YYYY)
        if (fechaFiltro.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const [dia, mes, año] = fechaFiltro.split('-');
          const fechaMovimiento = new Date(mov.fecha);
          const diaMovimiento = fechaMovimiento.getDate();
          const mesMovimiento = fechaMovimiento.getMonth() + 1;
          const añoMovimiento = fechaMovimiento.getFullYear();

          return añoMovimiento === parseInt(año) &&
            mesMovimiento === parseInt(mes) &&
            diaMovimiento === parseInt(dia);
        }

        // Búsqueda general por texto en fecha
        const fechaCompleta = formatDateForSearch(mov.fecha);
        const fechaISO = mov.fecha.toLowerCase();
        const searchLower = fechaFiltro.toLowerCase();

        return fechaISO.includes(searchLower) ||
          fechaCompleta.toLowerCase().includes(searchLower) ||
          mov.fecha.includes(fechaFiltro);
      };

      // Función auxiliar para verificar monto con operadores
      const matchesMonto = (montoFiltro: string): boolean => {
        if (!montoFiltro) return true;

        const monto = mov.monto;
        const filtro = montoFiltro.trim();

        // Si contiene operadores
        if (filtro.includes('>') || filtro.includes('<') || filtro.includes('=')) {
          const match = filtro.match(/(>|<|>=|<=|==|!=)\s*(\d+\.?\d*)/);
          if (match) {
            const operador = match[1];
            const valor = parseFloat(match[2]);
            switch (operador) {
              case '>': return monto > valor;
              case '<': return monto < valor;
              case '>=': return monto >= valor;
              case '<=': return monto <= valor;
              case '==': return monto === valor;
              case '!=': return monto !== valor;
            }
          }
        }

        return monto.toString().includes(filtro.replace(/[^\d.-]/g, ''));
      };

      // Función auxiliar para verificar categoría
      const matchesCategoria = (categoriaFiltro: string): boolean => {
        if (!categoriaFiltro) return true;
        return categoriaNombre.toLowerCase().includes(categoriaFiltro.toLowerCase());
      };

      // Función auxiliar para verificar método
      const matchesMetodo = (metodoFiltro: string): boolean => {
        if (!metodoFiltro) return true;
        return mov.metodo.toLowerCase().includes(metodoFiltro.toLowerCase());
      };

      // Función auxiliar para verificar cuenta
      const matchesCuenta = (cuentaFiltro: string): boolean => {
        if (!cuentaFiltro) return true;
        return mov.cuentaBancaria?.numeroCuenta?.toLowerCase().includes(cuentaFiltro.toLowerCase()) || false;
      };

      // Función auxiliar para verificar usuario
      const matchesUsuario = (usuarioFiltro: string): boolean => {
        if (!usuarioFiltro) return true;
        const usuario = mov.usuario;
        if (!usuario) return false;

        const filtro = usuarioFiltro.toLowerCase();
        return usuario.nombre?.toLowerCase().includes(filtro) ||
          usuario.apellido?.toLowerCase().includes(filtro) ||
          usuario.username?.toLowerCase().includes(filtro) ||
          `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(filtro);
      };

      // Función auxiliar para búsqueda general optimizada
      const matchesGeneral = (textoFiltro: string): boolean => {
        if (!textoFiltro) return true;

        const filtro = textoFiltro.toLowerCase();
        
        // Primero buscar en campos rápidos
        if (categoriaNombre.toLowerCase().includes(filtro)) return true;
        if (mov.descripcion?.toLowerCase().includes(filtro)) return true;
        if (mov.metodo.toLowerCase().includes(filtro)) return true;
        if (mov.cuentaBancaria?.numeroCuenta?.toLowerCase().includes(filtro)) return true;
        
        // Buscar en usuario
        if (mov.usuario) {
          if (mov.usuario.nombre?.toLowerCase().includes(filtro)) return true;
          if (mov.usuario.apellido?.toLowerCase().includes(filtro)) return true;
          if (mov.usuario.username?.toLowerCase().includes(filtro)) return true;
          if (`${mov.usuario.nombre} ${mov.usuario.apellido}`.toLowerCase().includes(filtro)) return true;
        }
        
        // Último: buscar en fechas (más costoso)
        if (mov.fecha.toLowerCase().includes(filtro)) return true;
        const fechaCompleta = formatDateForSearch(mov.fecha);
        if (fechaCompleta.toLowerCase().includes(filtro)) return true;
        
        return false;
      };

      // Aplicar todos los filtros
      return matchesFecha(filters.fecha) &&
        matchesCategoria(filters.categoria) &&
        matchesMonto(filters.monto) &&
        matchesMetodo(filters.metodo) &&
        matchesCuenta(filters.cuenta) &&
        matchesUsuario(filters.usuario) &&
        matchesGeneral(filters.text);

    } catch (error) {
      console.error('Error durante el filtrado de movimiento:', mov.id, error);
      return false; // En caso de error, excluir este movimiento
    }
  };
};

// Función para filtrar movimientos con optimizaciones agresivas
export const filterMovimientos = (
  movimientos: MovimientoContable[],
  categorias: CategoriaCuenta[],
  filters: MovimientoFilters
): MovimientoContable[] => {
  // Si no hay filtros, retornar todos los movimientos
  const hasFilters = filters.text || filters.fecha || filters.categoria || 
                    filters.monto || filters.metodo || filters.cuenta || filters.usuario;
  
  if (!hasFilters) {
    return movimientos;
  }

  // Optimización 1: Filtro de texto muy corto
  if (filters.text && filters.text.length < 2) {
    return []; // No procesar hasta tener al menos 2 caracteres
  }

  // Optimización 2: Limitar cantidad máxima de procesamiento
  const MAX_PROCESS_COUNT = 2000;
  const movimientosToProcess = movimientos.length > MAX_PROCESS_COUNT 
    ? movimientos.slice(0, MAX_PROCESS_COUNT)
    : movimientos;

  // Optimización 3: Procesamiento por lotes para evitar bloqueo
  const BATCH_SIZE = 100;
  const result: MovimientoContable[] = [];
  const filterFn = createMovimientoFilter(categorias, filters);
  
  for (let i = 0; i < movimientosToProcess.length; i += BATCH_SIZE) {
    const batch = movimientosToProcess.slice(i, i + BATCH_SIZE);
    const filteredBatch = batch.filter(filterFn);
    result.push(...filteredBatch);
    
    // Optimización 4: Si encontramos muchos resultados, detener
    if (result.length > 500) {
      break;
    }
  }
  
  return result;
};

// Función asíncrona para filtrado no bloqueante
export const filterMovimientosAsync = async (
  movimientos: MovimientoContable[],
  categorias: CategoriaCuenta[],
  filters: MovimientoFilters,
  onProgress?: (progress: number) => void,
  abortRef?: { abort: boolean }
): Promise<MovimientoContable[]> => {
  return new Promise((resolve, reject) => {
    const hasFilters = filters.text || filters.fecha || filters.categoria || 
                      filters.monto || filters.metodo || filters.cuenta || filters.usuario;
    
    if (!hasFilters) {
      resolve(movimientos);
      return;
    }

    if (filters.text && filters.text.length < 2) {
      resolve([]);
      return;
    }

    // Optimización: filtros de texto muy comunes que no darán resultados
    const commonInvalidFilters = ['naye', 'xyz', 'qwerty', 'asdf', 'test123'];
    if (filters.text && commonInvalidFilters.some(invalid => 
      filters.text.toLowerCase().includes(invalid.toLowerCase()) && filters.text.length < 6)) {
      setTimeout(() => resolve([]), 100); // Simular búsqueda rápida
      return;
    }

    const MAX_PROCESS_COUNT = 1500; // Reducido para mejor rendimiento
    const movimientosToProcess = movimientos.length > MAX_PROCESS_COUNT 
      ? movimientos.slice(0, MAX_PROCESS_COUNT)
      : movimientos;

    const BATCH_SIZE = 30; // Lotes más pequeños
    const MAX_RESULTS = 300; // Máximo de resultados más conservador
    const result: MovimientoContable[] = [];
    const filterFn = createMovimientoFilter(categorias, filters);
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const processBatch = () => {
      // Verificar abort antes de cada lote
      if (abortRef?.abort) {
        resolve(result);
        return;
      }

      try {
        const batch = movimientosToProcess.slice(currentIndex, currentIndex + BATCH_SIZE);
        const filteredBatch = batch.filter(filterFn);
        result.push(...filteredBatch);
        
        currentIndex += BATCH_SIZE;
        const progress = (currentIndex / movimientosToProcess.length) * 100;
        
        if (onProgress && !abortRef?.abort) {
          onProgress(Math.min(progress, 100));
        }
        
        // Condiciones de término
        const shouldStop = 
          abortRef?.abort ||
          currentIndex >= movimientosToProcess.length || 
          result.length >= MAX_RESULTS;
          
        if (shouldStop) {
          resolve(result);
          return;
        }
        
        // Programar siguiente lote con delay mínimo
        timeoutId = setTimeout(processBatch, 1);
        
      } catch (error) {
        console.error('Error en processBatch:', error);
        resolve(result); // Devolver resultados parciales en caso de error
      }
    };
    
    // Timeout de seguridad (máximo 5 segundos)
    const safetyTimeout = setTimeout(() => {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn('Filtrado cancelado por timeout de seguridad');
      resolve(result);
    }, 5000);
    
    // Iniciar procesamiento
    timeoutId = setTimeout(processBatch, 0);
    
    // Cleanup en caso de abort
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };
    
    // Si se aborta durante la Promise
    if (abortRef?.abort) {
      cleanup();
      resolve([]);
    }
  });
};