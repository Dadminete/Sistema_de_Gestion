import prisma from '../lib/prisma'

// Servicio para gestión de auditoría y bitácora
export class AuditService {
  // Registrar acción en bitácora
  static async logAction(data: {
    usuarioId?: string
    accion: string
    tablaAfectada?: string
    registroAfectadoId?: string
    detallesAnteriores?: any
    detallesNuevos?: any
    ipAddress?: string
    userAgent?: string
    resultado?: string
    mensajeError?: string
    duracionMs?: number
  }) {
    return await prisma.bitacora.create({
      data: {
        usuarioId: data.usuarioId,
        accion: data.accion,
        tablaAfectada: data.tablaAfectada,
        registroAfectadoId: data.registroAfectadoId,
        detallesAnteriores: data.detallesAnteriores,
        detallesNuevos: data.detallesNuevos,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        resultado: data.resultado || 'exitoso',
        mensajeError: data.mensajeError,
        duracionMs: data.duracionMs
      }
    })
  }

  // Obtener registros de auditoría
  static async getAuditLogs(filters?: {
    usuarioId?: string
    accion?: string
    tablaAfectada?: string
    resultado?: string
    fechaDesde?: Date
    fechaHasta?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.usuarioId) where.usuarioId = filters.usuarioId
    if (filters?.accion) where.accion = { contains: filters.accion, mode: 'insensitive' }
    if (filters?.tablaAfectada) where.tablaAfectada = filters.tablaAfectada
    if (filters?.resultado) where.resultado = filters.resultado

    if (filters?.fechaDesde || filters?.fechaHasta) {
      where.fechaHora = {}
      if (filters.fechaDesde) where.fechaHora.gte = filters.fechaDesde
      if (filters.fechaHasta) where.fechaHora.lte = filters.fechaHasta
    }

    return await prisma.bitacora.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fechaHora: 'desc'
      },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      cacheStrategy: {
        ttl: 60, // Cache corto para datos de auditoría
      },
    })
  }

  // Obtener estadísticas de auditoría
  static async getAuditStats(fechaDesde?: Date, fechaHasta?: Date) {
    const where: any = {}
    
    if (fechaDesde || fechaHasta) {
      where.fechaHora = {}
      if (fechaDesde) where.fechaHora.gte = fechaDesde
      if (fechaHasta) where.fechaHasta.lte = fechaHasta
    }

    const [totalAcciones, accionesPorResultado, accionesPorTabla, accionesPorUsuario] = await Promise.all([
      // Total de acciones
      prisma.bitacora.count({ where }),

      // Acciones por resultado
      prisma.bitacora.groupBy({
        by: ['resultado'],
        where,
        _count: { resultado: true },
        orderBy: { _count: { resultado: 'desc' } }
      }),

      // Acciones por tabla
      prisma.bitacora.groupBy({
        by: ['tablaAfectada'],
        where: { ...where, tablaAfectada: { not: null } },
        _count: { tablaAfectada: true },
        orderBy: { _count: { tablaAfectada: 'desc' } },
        take: 10
      }),

      // Acciones por usuario (top 10)
      prisma.bitacora.groupBy({
        by: ['usuarioId'],
        where: { ...where, usuarioId: { not: null } },
        _count: { usuarioId: true },
        orderBy: { _count: { usuarioId: 'desc' } },
        take: 10
      })
    ])

    return {
      totalAcciones,
      porResultado: accionesPorResultado.map(r => ({
        resultado: r.resultado,
        cantidad: r._count.resultado
      })),
      porTabla: accionesPorTabla.map(t => ({
        tabla: t.tablaAfectada,
        cantidad: t._count.tablaAfectada
      })),
      porUsuario: accionesPorUsuario.map(u => ({
        usuarioId: u.usuarioId,
        cantidad: u._count.usuarioId
      }))
    }
  }

  // Limpiar registros antiguos de auditoría
  static async cleanOldAuditLogs(diasAntiguedad: number = 90) {
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad)

    const result = await prisma.bitacora.deleteMany({
      where: {
        fechaHora: {
          lt: fechaLimite
        }
      }
    })

    return result.count
  }
}
