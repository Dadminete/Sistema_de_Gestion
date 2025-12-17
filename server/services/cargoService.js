const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

class CargoService {
    static async getAll() {
        return prisma.findMany({
            where: { activo: true },
            orderBy: { nombreCargo: 'asc' },
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
                nombreCargo: data.nombreCargo,
                descripcion: data.descripcion || null,
                activo: true
            }
        });
    }
}

module.exports = { CargoService };
