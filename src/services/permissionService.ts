import prisma from '../lib/prisma'

// Servicio para gestión de permisos
export class PermissionService {
  // Obtener todos los permisos
  static async getPermissions() {
    return await prisma.permiso.findMany({
      include: {
        rolesPermisos: {
          include: {
            rol: {
              select: {
                id: true,
                nombreRol: true,
                descripcion: true
              }
            }
          },
          where: { activo: true }
        },
        usuariosPermisos: {
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
          where: { activo: true }
        }
      },
      orderBy: [
        { categoria: 'asc' },
        { nombrePermiso: 'asc' }
      ]
    })
  }

  // Obtener permisos por categoría
  static async getPermissionsByCategory(categoria: string) {
    return await prisma.permiso.findMany({
      where: { categoria, activo: true },
      orderBy: { nombrePermiso: 'asc' }
    })
  }

  // Obtener permiso por ID
  static async getPermissionById(id: bigint) {
    return await prisma.permiso.findUnique({
      where: { id },
      include: {
        rolesPermisos: {
          include: {
            rol: true
          },
          where: { activo: true }
        },
        usuariosPermisos: {
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
          where: { activo: true }
        }
      }
    })
  }

  // Crear permiso
  static async createPermission(data: {
    nombrePermiso: string
    descripcion?: string
    categoria?: string
    esSistema?: boolean
  }) {
    return await prisma.permiso.create({
      data
    })
  }

  // Actualizar permiso
  static async updatePermission(id: bigint, data: {
    nombrePermiso?: string
    descripcion?: string
    categoria?: string
    activo?: boolean
  }) {
    return await prisma.permiso.update({
      where: { id },
      data
    })
  }

  // Eliminar permiso (solo si no es del sistema)
  static async deletePermission(id: bigint) {
    // Verificar que no sea un permiso del sistema
    const permission = await prisma.permiso.findUnique({
      where: { id },
      select: { esSistema: true }
    })

    if (permission?.esSistema) {
      throw new Error('No se puede eliminar un permiso del sistema')
    }

    return await prisma.permiso.delete({
      where: { id }
    })
  }

  // Obtener permisos de un usuario (directos + por roles)
  static async getUserPermissions(usuarioId: string) {
    // Permisos directos
    const directPermissions = await prisma.usuarioPermiso.findMany({
      where: {
        usuarioId,
        activo: true,
        OR: [
          { fechaVencimiento: null },
          { fechaVencimiento: { gt: new Date() } }
        ]
      },
      include: {
        permiso: true
      }
    })

    // Permisos por roles
    const rolePermissions = await prisma.rolePermiso.findMany({
      where: {
        activo: true,
        rol: {
          usuariosRoles: {
            some: {
              usuarioId,
              activo: true,
              OR: [
                { fechaVencimiento: null },
                { fechaVencimiento: { gt: new Date() } }
              ]
            }
          }
        }
      },
      include: {
        permiso: true,
        rol: true
      }
    })

    return {
      directos: directPermissions.map(up => up.permiso),
      porRoles: rolePermissions.map(rp => ({
        permiso: rp.permiso,
        rol: rp.rol
      }))
    }
  }

  // Verificar si un usuario tiene un permiso específico
  static async userHasPermission(usuarioId: string, nombrePermiso: string): Promise<boolean> {
    // Verificar permiso directo
    const directPermission = await prisma.usuarioPermiso.findFirst({
      where: {
        usuarioId,
        activo: true,
        permiso: {
          nombrePermiso,
          activo: true
        },
        OR: [
          { fechaVencimiento: null },
          { fechaVencimiento: { gt: new Date() } }
        ]
      }
    })

    if (directPermission) return true

    // Verificar permiso por rol
    const rolePermission = await prisma.rolePermiso.findFirst({
      where: {
        activo: true,
        permiso: {
          nombrePermiso,
          activo: true
        },
        rol: {
          activo: true,
          usuariosRoles: {
            some: {
              usuarioId,
              activo: true,
              OR: [
                { fechaVencimiento: null },
                { fechaVencimiento: { gt: new Date() } }
              ]
            }
          }
        }
      }
    })

    return !!rolePermission
  }

  // Asignar permiso directo a usuario
  static async assignDirectPermission(
    usuarioId: string, 
    permisoId: bigint, 
    asignadoPorId?: string,
    fechaVencimiento?: Date,
    motivo?: string
  ) {
    return await prisma.usuarioPermiso.create({
      data: {
        usuarioId,
        permisoId,
        asignadoPorId,
        fechaVencimiento,
        motivo
      }
    })
  }

  // Remover permiso directo de usuario
  static async removeDirectPermission(usuarioId: string, permisoId: bigint) {
    return await prisma.usuarioPermiso.delete({
      where: {
        usuarioId_permisoId: {
          usuarioId,
          permisoId
        }
      }
    })
  }

  // Obtener categorías de permisos
  static async getPermissionCategories() {
    const categories = await prisma.permiso.groupBy({
      by: ['categoria'],
      where: { activo: true },
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
}
