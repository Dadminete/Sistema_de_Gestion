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

class DepartmentService {
    static async getAll() {
        const departments = await prisma.departamento.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });
        return serializeBigInt(departments);
    }

    static async getById(id) {
        const department = await prisma.departamento.findUnique({
            where: { id: BigInt(id) },
        });
        return serializeBigInt(department);
    }

    static async create(data) {
        const department = await prisma.departamento.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion || null,
                activo: true
            }
        });
        return serializeBigInt(department);
    }
}

module.exports = { DepartmentService };
