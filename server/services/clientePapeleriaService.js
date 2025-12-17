const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const getAllClientesPapeleria = async () => {
    return prisma.clientePapeleria.findMany();
};

const getClientePapeleriaById = async (id) => {
    return prisma.clientePapeleria.findUnique({
        where: { id: id },
    });
};

const createClientePapeleria = async (data) => {
    return prisma.clientePapeleria.create({
        data: data,
    });
};

const updateClientePapeleria = async (id, data) => {
    return prisma.clientePapeleria.update({
        where: { id: id },
        data: data,
    });
};

const deleteClientePapeleria = async (id) => {
    return prisma.clientePapeleria.delete({
        where: { id: id },
    });
};

module.exports = {
    getAllClientesPapeleria,
    getClientePapeleriaById,
    createClientePapeleria,
    updateClientePapeleria,
    deleteClientePapeleria,
};
