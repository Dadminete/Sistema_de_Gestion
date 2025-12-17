const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const CategoriaService = {
  async getAllCategorias() {
    return prisma.Categoria.findMany({
      orderBy: {
        orden: 'asc',
      },
    });
  },

  async getCategoriaById(id) {
    return prisma.Categoria.findUnique({
      where: { id },
    });
  },

  async createCategoria(data) {
    return prisma.Categoria.create({
      data: {
        ...data,
        orden: data.orden || 0, // Ensure 'orden' has a default if not provided
        activo: data.activo ?? true, // Ensure 'activo' has a default if not provided
      },
    });
  },

  async updateCategoria(id, data) {
    return prisma.Categoria.update({
      where: { id },
      data,
    });
  },

  async deleteCategoria(id) {
    return prisma.Categoria.delete({
      where: { id },
    });
  },
};

module.exports = { CategoriaService };
