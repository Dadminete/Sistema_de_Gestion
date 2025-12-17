const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

class DepartmentService {
    static async getAll() {
        return prisma.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });
    }

    static async getById(id) {
        return prisma.findUnique({
            where: { id: BigInt(id) },
        });
    }

    static async create(data) {
        return prisma.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion || null,
                activo: true
            }
        });
    }
}

module.exports = { DepartmentService };
