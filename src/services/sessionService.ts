import prisma from '../lib/prisma'

// Servicio para gestión de sesiones de usuario
export class SessionService {
  // Crear nueva sesión
  static async createSession(data: {
    usuarioId: string
    tokenHash: string
    ipAddress?: string
    userAgent?: string
    fechaExpiracion: Date
  }) {
    return await prisma.sesionUsuario.create({
      data,
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })
  }

  // Obtener sesión por token hash
  static async getSessionByToken(tokenHash: string) {
    return await prisma.sesionUsuario.findFirst({
      where: {
        tokenHash,
        activa: true,
        fechaExpiracion: {
          gt: new Date()
        }
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true,
            activo: true
          }
        }
      }
    })
  }

  // Actualizar último uso de sesión
  static async updateSessionLastUse(id: string) {
    return await prisma.sesionUsuario.update({
      where: { id },
      data: {
        fechaUltimoUso: new Date()
      }
    })
  }

  // Obtener sesiones activas de un usuario
  static async getUserActiveSessions(usuarioId: string) {
    return await prisma.sesionUsuario.findMany({
      where: {
        usuarioId,
        activa: true,
        fechaExpiracion: {
          gt: new Date()
        }
      },
      orderBy: {
        fechaUltimoUso: 'desc'
      }
    })
  }

  // Cerrar sesión específica
  static async closeSession(id: string) {
    return await prisma.sesionUsuario.update({
      where: { id },
      data: {
        activa: false
      }
    })
  }

  // Cerrar todas las sesiones de un usuario
  static async closeAllUserSessions(usuarioId: string) {
    return await prisma.sesionUsuario.updateMany({
      where: {
        usuarioId,
        activa: true
      },
      data: {
        activa: false
      }
    })
  }

  // Limpiar sesiones expiradas
  static async cleanExpiredSessions() {
    const result = await prisma.sesionUsuario.deleteMany({
      where: {
        OR: [
          { fechaExpiracion: { lt: new Date() } },
          { activa: false }
        ]
      }
    })

    return result.count
  }

  // Obtener estadísticas de sesiones
  static async getSessionStats() {
    const [totalActivas, totalExpiradas, porUsuario] = await Promise.all([
      prisma.sesionUsuario.count({
        where: {
          activa: true,
          fechaExpiracion: { gt: new Date() }
        }
      }),

      prisma.sesionUsuario.count({
        where: {
          OR: [
            { activa: false },
            { fechaExpiracion: { lte: new Date() } }
          ]
        }
      }),

      prisma.sesionUsuario.groupBy({
        by: ['usuarioId'],
        where: {
          activa: true,
          fechaExpiracion: { gt: new Date() }
        },
        _count: { usuarioId: true },
        orderBy: { _count: { usuarioId: 'desc' } },
        take: 10
      })
    ])

    return {
      sesionesActivas: totalActivas,
      sesionesExpiradas: totalExpiradas,
      usuariosConMasSesiones: porUsuario.map(u => ({
        usuarioId: u.usuarioId,
        cantidadSesiones: u._count.usuarioId
      }))
    }
  }
}
