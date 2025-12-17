const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const CategoriaCuentaService = {
  async getAllCategoriasCuentas() {
    return prisma.categoriaCuenta.findMany({
      orderBy: {
        codigo: 'asc',
      },
    });
  },

  async getCategoriaCuentaById(id) {
    return prisma.categoriaCuenta.findUnique({
      where: { id },
    });
  },

  async createCategoriaCuenta(data) {
    const { nombre, codigo, tipo, subtipo, esDetalle, activa, descripcion } = data;
    return prisma.categoriaCuenta.create({
      data: {
        nombre,
        codigo,
        tipo,
        subtipo,
        esDetalle,
        activa,
        descripcion,
      },
    });
  },

  async updateCategoriaCuenta(id, data) {
    return prisma.categoriaCuenta.update({
      where: { id },
      data,
    });
  },

  async deleteCategoriaCuenta(id) {
    return prisma.categoriaCuenta.delete({
      where: { id },
    });
  },
};

module.exports = { CategoriaCuentaService };
