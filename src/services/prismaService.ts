import prisma from '../lib/prisma';
import type { Prisma, Usuario } from '@prisma/client';

export class PrismaService {
  // Get all users
  static async getUsuarios() {
    return await prisma.usuario.findMany({
      cacheStrategy: { ttl: 60 },
    });
  }

  // Get user by ID
  static async getUsuarioById(id: string) {
    try {
      return await prisma.usuario.findUnique({
        where: { id },
        cacheStrategy: { ttl: 60 },
      });
    } catch (error) {
      console.error(`Error fetching user by ID ${id}:`, error);
      throw new Error('Failed to retrieve user.');
    }
  }

  // Create user
  static async createUsuario(data: Prisma.UsuarioCreateInput) {
    return await prisma.usuario.create({
      data,
    });
  }

  // Update user
  static async updateUsuario(id: string, data: Prisma.UsuarioUpdateInput) {
    return await prisma.usuario.update({
      where: { id },
      data,
    });
  }

  // Delete user
  static async deleteUsuario(id: string) {
    return await prisma.usuario.delete({
      where: { id },
    });
  }

  // Get all roles
  static async getRoles() {
    return await prisma.role.findMany();
  }

  // Get role by ID
  static async getRoleById(id: bigint) {
    return await prisma.role.findUnique({
      where: { id },
    });
  }

  // Create role
  static async createRole(data: Prisma.RoleCreateInput) {
    return await prisma.role.create({
      data,
    });
  }

  // Update role
  static async updateRole(id: bigint, data: Prisma.RoleUpdateInput) {
    return await prisma.role.update({
      where: { id },
      data,
    });
  }

  // Delete role
  static async deleteRole(id: bigint) {
    return await prisma.role.delete({
      where: { id },
    });
  }

  // Get all permissions
  static async getPermisos() {
    return await prisma.permiso.findMany();
  }

  // Get permission by ID
  static async getPermisoById(id: bigint) {
    return await prisma.permiso.findUnique({
      where: { id },
    });
  }

  // Create permission
  static async createPermiso(data: Prisma.PermisoCreateInput) {
    return await prisma.permiso.create({
      data,
    });
  }

  // Update permission
  static async updatePermiso(id: bigint, data: Prisma.PermisoUpdateInput) {
    return await prisma.permiso.update({
      where: { id },
      data,
    });
  }

  // Delete permission
  static async deletePermiso(id: bigint) {
    return await prisma.permiso.delete({
      where: { id },
    });
  }

  // Example of using transactions
  static async createUsuarioWithRole(userData: Prisma.UsuarioCreateInput, roleId: bigint): Promise<Usuario> {
    const transactionFn = async (tx: Prisma.TransactionClient): Promise<Usuario> => {
      const usuario = await tx.usuario.create({
        data: userData,
      });

      await tx.usuarioRole.create({
        data: {
          usuarioId: usuario.id,
          rolId: roleId,
        },
      });

      return usuario;
    };

    return await prisma.$transaction(transactionFn);
  }

  // Health check for database connection
  static async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
