import prisma from '../lib/prisma'

// Servicio para gestión de configuraciones del sistema
export class ConfigService {
  // Obtener todas las configuraciones
  static async getConfigurations(esPublica?: boolean) {
    const where: any = {}
    if (esPublica !== undefined) {
      where.esPublica = esPublica
    }

    return await prisma.configuracion.findMany({
      where,
      orderBy: [
        { categoria: 'asc' },
        { clave: 'asc' }
      ],
      cacheStrategy: {
        ttl: 600, // Cache largo para configuraciones
      },
    })
  }

  // Obtener configuración por clave
  static async getConfigByKey(clave: string) {
    return await prisma.configuracion.findUnique({
      where: { clave },
      cacheStrategy: {
        ttl: 600,
      },
    })
  }

  // Obtener configuraciones por categoría
  static async getConfigsByCategory(categoria: string, esPublica?: boolean) {
    const where: any = { categoria }
    if (esPublica !== undefined) {
      where.esPublica = esPublica
    }

    return await prisma.configuracion.findMany({
      where,
      orderBy: { clave: 'asc' },
      cacheStrategy: {
        ttl: 600,
      },
    })
  }

  // Crear configuración
  static async createConfig(data: {
    clave: string
    valor: string
    descripcion?: string
    tipo?: string
    esPublica?: boolean
    categoria?: string
  }) {
    return await prisma.configuracion.create({
      data
    })
  }

  // Actualizar configuración
  static async updateConfig(id: bigint, data: {
    valor?: string
    descripcion?: string
    tipo?: string
    esPublica?: boolean
    categoria?: string
  }) {
    return await prisma.configuracion.update({
      where: { id },
      data
    })
  }

  // Actualizar configuración por clave
  static async updateConfigByKey(clave: string, valor: string) {
    return await prisma.configuracion.update({
      where: { clave },
      data: { valor }
    })
  }

  // Eliminar configuración
  static async deleteConfig(id: bigint) {
    return await prisma.configuracion.delete({
      where: { id }
    })
  }

  // Obtener valor de configuración (con tipo parsing)
  static async getConfigValue<T = string>(clave: string): Promise<T | null> {
    const config = await this.getConfigByKey(clave)
    if (!config) return null

    switch (config.tipo) {
      case 'boolean':
        return (config.valor.toLowerCase() === 'true') as T
      case 'number':
        return Number(config.valor) as T
      case 'json':
        try {
          return JSON.parse(config.valor) as T
        } catch {
          return config.valor as T
        }
      default:
        return config.valor as T
    }
  }

  // Establecer valor de configuración (con tipo conversion)
  static async setConfigValue(clave: string, valor: any, tipo?: string) {
    let valorString: string
    let tipoFinal = tipo

    if (typeof valor === 'boolean') {
      valorString = valor.toString()
      tipoFinal = 'boolean'
    } else if (typeof valor === 'number') {
      valorString = valor.toString()
      tipoFinal = 'number'
    } else if (typeof valor === 'object') {
      valorString = JSON.stringify(valor)
      tipoFinal = 'json'
    } else {
      valorString = String(valor)
      tipoFinal = tipoFinal || 'string'
    }

    // Intentar actualizar primero
    try {
      return await prisma.configuracion.update({
        where: { clave },
        data: { 
          valor: valorString,
          tipo: tipoFinal
        }
      })
    } catch {
      // Si no existe, crear nueva
      return await prisma.configuracion.create({
        data: {
          clave,
          valor: valorString,
          tipo: tipoFinal
        }
      })
    }
  }

  // Obtener categorías de configuraciones
  static async getConfigCategories() {
    const categories = await prisma.configuracion.groupBy({
      by: ['categoria'],
      _count: {
        categoria: true
      },
      orderBy: {
        categoria: 'asc'
      }
    })

    return categories.map(cat => ({
      categoria: cat.categoria,
      cantidad: cat._count.categoria
    }))
  }

  // Configuraciones predeterminadas del sistema
  static async initializeDefaultConfigs() {
    const defaultConfigs = [
      {
        clave: 'sistema.nombre',
        valor: 'Sistema de Gestión',
        descripcion: 'Nombre del sistema',
        categoria: 'sistema',
        esPublica: true
      },
      {
        clave: 'sistema.version',
        valor: '1.0.0',
        descripcion: 'Versión del sistema',
        categoria: 'sistema',
        esPublica: true
      },
      {
        clave: 'auth.max_intentos_login',
        valor: '5',
        descripcion: 'Máximo número de intentos de login fallidos',
        tipo: 'number',
        categoria: 'autenticacion',
        esPublica: false
      },
      {
        clave: 'auth.tiempo_bloqueo_minutos',
        valor: '30',
        descripcion: 'Tiempo de bloqueo en minutos tras exceder intentos',
        tipo: 'number',
        categoria: 'autenticacion',
        esPublica: false
      },
      {
        clave: 'sesion.duracion_horas',
        valor: '24',
        descripcion: 'Duración de sesión en horas',
        tipo: 'number',
        categoria: 'sesion',
        esPublica: false
      },
      {
        clave: 'auditoria.dias_retencion',
        valor: '90',
        descripcion: 'Días de retención de registros de auditoría',
        tipo: 'number',
        categoria: 'auditoria',
        esPublica: false
      }
    ]

    const results = []
    for (const config of defaultConfigs) {
      try {
        const existing = await prisma.configuracion.findUnique({
          where: { clave: config.clave }
        })
        
        if (!existing) {
          const created = await prisma.configuracion.create({
            data: config
          })
          results.push(created)
        }
      } catch (error) {
        console.error(`Error creando configuración ${config.clave}:`, error)
      }
    }

    return results
  }
}
