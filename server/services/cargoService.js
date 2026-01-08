const prisma = require('../prismaClient');

// Helper function to convert BigInt and Decimal to string for JSON serialization
const serializeBigInt = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    // Handle Prisma Decimal objects - they have a toNumber() method
    if (typeof obj === 'object' && obj !== null && typeof obj.toNumber === 'function') {
        return obj.toNumber();
    }
    if (Array.isArray(obj)) return obj.map(serializeBigInt);
    if (typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
        );
    }
    return obj;
};

class CargoService {
    static async getAll() {
        const cargos = await prisma.cargo.findMany({
            where: { activo: true },
            orderBy: { nombreCargo: 'asc' },
        });
        return serializeBigInt(cargos);
    }

    static async getById(id) {
        const cargo = await prisma.cargo.findUnique({
            where: { id: BigInt(id) },
        });
        return serializeBigInt(cargo);
    }

    static async create(data) {
        const cargo = await prisma.cargo.create({
            data: {
                nombreCargo: data.nombreCargo,
                descripcion: data.descripcion || null,
                activo: true
            }
        });
        return serializeBigInt(cargo);
    }
}

module.exports = { CargoService };
