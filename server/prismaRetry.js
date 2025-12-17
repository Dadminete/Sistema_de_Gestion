const prisma = require('./prismaClient');

/**
 * Wrapper para operaciones de Prisma con reintentos automáticos
 * Útil para bases de datos como Neon que pueden pausarse por inactividad
 */
class PrismaRetry {
  constructor() {
    // Crear un proxy que intercepte las llamadas a los modelos
    return new Proxy(this, {
      get(target, prop) {
        // Si es una propiedad de la clase
        if (prop in target) {
          return target[prop];
        }
        
        // Si es $queryRaw, $executeRaw, etc. (métodos especiales de Prisma)
        if (prop.startsWith('$')) {
          return (...args) => {
            return PrismaRetry.executeWithRetry(() => prisma[prop](...args));
          };
        }
        
        // Si es un modelo de Prisma, devolver un objeto con los métodos
        if (prisma[prop]) {
          return new Proxy(prisma[prop], {
            get(modelTarget, method) {
              if (typeof modelTarget[method] === 'function') {
                return (...args) => {
                  return PrismaRetry.executeWithRetry(() => modelTarget[method](...args));
                };
              }
              return modelTarget[method];
            }
          });
        }
        
        return undefined;
      }
    });
  }

  static async executeWithRetry(operation, maxRetries = 3, delay = 2000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Verificar si es un error de conexión
        const isConnectionError = 
          error.message?.includes('Can\'t reach database server') ||
          error.message?.includes('Connection refused') ||
          error.message?.includes('timeout') ||
          error.code === 'P1001' || // Connection error
          error.code === 'P1008' || // Timeout error
          error.code === 'P1017';   // Server has closed connection
        
        if (isConnectionError && attempt < maxRetries) {
          console.log(`[PRISMA-RETRY] Intento ${attempt}/${maxRetries} fallido. Reintentando en ${delay}ms...`);
          console.log(`[PRISMA-RETRY] Error: ${error.message}`);
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Incrementar el delay para el siguiente intento (backoff exponencial)
          delay = Math.min(delay * 1.5, 10000);
          
          continue;
        }
        
        // Si no es un error de conexión o se agotaron los reintentos, lanzar el error
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Wrapper para findFirst con reintentos
   */
  static async findFirst(model, args) {
    return this.executeWithRetry(() => prisma[model].findFirst(args));
  }

  /**
   * Wrapper para findUnique con reintentos
   */
  static async findUnique(model, args) {
    return this.executeWithRetry(() => prisma[model].findUnique(args));
  }

  /**
   * Wrapper para create con reintentos
   */
  static async create(model, args) {
    return this.executeWithRetry(() => prisma[model].create(args));
  }

  /**
   * Wrapper para update con reintentos
   */
  static async update(model, args) {
    return this.executeWithRetry(() => prisma[model].update(args));
  }

  /**
   * Wrapper para findMany con reintentos
   */
  static async findMany(model, args) {
    return this.executeWithRetry(() => prisma[model].findMany(args));
  }

  /**
   * Wrapper para count con reintentos
   */
  static async count(model, args) {
    return this.executeWithRetry(() => prisma[model].count(args));
  }

  /**
   * Wrapper para aggregate con reintentos
   */
  static async aggregate(model, args) {
    return this.executeWithRetry(() => prisma[model].aggregate(args));
  }

  /**
   * Wrapper para delete con reintentos
   */
  static async delete(model, args) {
    return this.executeWithRetry(() => prisma[model].delete(args));
  }

  /**
   * Wrapper para groupBy con reintentos
   */
  static async groupBy(model, args) {
    return this.executeWithRetry(() => prisma[model].groupBy(args));
  }

  /**
   * Wrapper para queries raw con reintentos
   */
  static async queryRaw(query, ...params) {
    return this.executeWithRetry(() => prisma.$queryRaw(query, ...params));
  }

  /**
   * Método de prueba de conexión
   */
  static async testConnection() {
    try {
      await this.executeWithRetry(() => prisma.$queryRaw`SELECT 1 as test`);
      return true;
    } catch (error) {
      console.error('[PRISMA-RETRY] Test de conexión fallido:', error.message);
      return false;
    }
  }
}

module.exports = PrismaRetry;