const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

class EmployeeService {
    static async getAll() {
        return prisma.empleado.findMany({
            include: {
                cargo: true,
                departamento: true,
                usuario: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getById(id) {
        return prisma.empleado.findUnique({
            where: { id: BigInt(id) },
            include: {
                cargo: true,
                departamento: true,
                usuario: true,
                historialSalarios: {
                    orderBy: { fechaRegistro: 'desc' }
                },
                nominas: {
                    orderBy: { periodo: { fechaInicio: 'desc' } },
                    take: 12
                },
                prestamos: true,
                comisiones: true,
                periodosVacaciones: true
            },
        });
    }

    static async create(data) {
        // Handle BigInt conversion for foreign keys if they come as strings
        const formattedData = {
            ...data,
            departamentoId: data.departamentoId ? BigInt(data.departamentoId) : null,
            cargoId: data.cargoId ? BigInt(data.cargoId) : null,
            salarioBase: parseFloat(data.salarioBase),
            fechaIngreso: new Date(data.fechaIngreso),
            usuarioId: data.usuarioId || null,
        };

        const newEmployee = await prisma.empleado.create({
            data: formattedData,
            include: {
                cargo: true,
                departamento: true,
                usuario: true,
            },
        });

        // If a user was linked, update the user to be an employee
        if (newEmployee.usuarioId) {
            await prisma.usuario.update({
                where: { id: newEmployee.usuarioId },
                data: { esEmpleado: true }
            });
        }

        return newEmployee;
    }

    static async update(id, data) {
        const formattedData = {
            ...data,
            departamentoId: data.departamentoId ? BigInt(data.departamentoId) : undefined,
            cargoId: data.cargoId ? BigInt(data.cargoId) : undefined,
            salarioBase: data.salarioBase ? parseFloat(data.salarioBase) : undefined,
            fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : undefined,
            usuarioId: data.usuarioId === '' ? null : (data.usuarioId || undefined),
        };

        const updatedEmployee = await prisma.empleado.update({
            where: { id: BigInt(id) },
            data: formattedData,
            include: {
                cargo: true,
                departamento: true,
                usuario: true,
            },
        });

        // If a user was linked, update the user to be an employee
        if (updatedEmployee.usuarioId) {
            await prisma.usuario.update({
                where: { id: updatedEmployee.usuarioId },
                data: { esEmpleado: true }
            });
        }

        return updatedEmployee;
    }

    static async delete(id) {
        return prisma.empleado.delete({
            where: { id: BigInt(id) },
        });
    }
}

module.exports = { EmployeeService };
