const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const getAllCategoriasPapeleria = async () => {
    return prisma.categoriaPapeleria.findMany();
};

const getCategoriaPapeleriaById = async (id) => {
    return prisma.categoriaPapeleria.findUnique({ where: { id: parseInt(id) } });
};

const createCategoriaPapeleria = async (data) => {
    return prisma.categoriaPapeleria.create({ data });
};

const updateCategoriaPapeleria = async (id, data) => {
    return prisma.categoriaPapeleria.update({
        where: { id: parseInt(id) },
        data,
    });
};

const deleteCategoriaPapeleria = async (id) => {
    return prisma.categoriaPapeleria.delete({ where: { id: parseInt(id) } });
};

module.exports = {
    getAllCategoriasPapeleria,
    getCategoriaPapeleriaById,
    createCategoriaPapeleria,
    updateCategoriaPapeleria,
    deleteCategoriaPapeleria,
};
