const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PlanService {
  static async getAll() {
    return prisma.plan.findMany({
      include: {
        categoria: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id) {
    return prisma.plan.findUnique({
      where: { id: BigInt(id) },
      include: {
        categoria: true,
      },
    });
  }

  static async create(data) {
    const { nombre, descripcion, categoriaId, precio, subidaKbps, bajadaMbps, activo } = data;
    return prisma.plan.create({
      data: {
        nombre,
        descripcion,
        categoria: {
          connect: { id: categoriaId },
        },
        precio: parseFloat(precio),
        subidaKbps: parseInt(subidaKbps, 10),
        bajadaMbps: parseInt(bajadaMbps, 10),
        activo: activo !== undefined ? activo : true,
      },
      include: {
        categoria: true,
      },
    });
  }

  static async update(id, data) {
    const { nombre, descripcion, categoriaId, precio, subidaKbps, bajadaMbps, activo } = data;
    return prisma.plan.update({
      where: { id: BigInt(id) },
      data: {
        nombre,
        descripcion,
        categoriaId,
        precio: parseFloat(precio),
        subidaKbps: parseInt(subidaKbps, 10),
        bajadaMbps: parseInt(bajadaMbps, 10),
        activo,
      },
      include: {
        categoria: true,
      },
    });
  }

  static async delete(id) {
    return prisma.plan.delete({
      where: { id: BigInt(id) },
    });
  }
}

module.exports = { PlanService };
