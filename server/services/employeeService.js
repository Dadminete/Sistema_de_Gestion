const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

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

class EmployeeService {
    static async getAll() {
        const employees = await prisma.empleado.findMany({
            include: {
                cargo: true,
                departamento: true,
                usuario: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return serializeBigInt(employees);
    }

    static async getById(id) {
        const employee = await prisma.empleado.findUnique({
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
        return serializeBigInt(employee);
    }

    static async create(data) {
        // Handle BigInt conversion for foreign keys if they come as strings
        const formattedData = {
            codigoEmpleado: data.codigoEmpleado,
            cedula: data.cedula,
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono || null,
            email: data.email || null,
            direccion: data.direccion || null,
            departamentoId: data.departamentoId ? BigInt(data.departamentoId) : null,
            cargoId: data.cargoId ? BigInt(data.cargoId) : null,
            salarioBase: parseFloat(data.salarioBase),
            fechaIngreso: new Date(data.fechaIngreso),
            estado: data.estado || 'ACTIVO',
            usuarioId: data.usuarioId || null,
            montoAfp: data.montoAfp ? parseFloat(data.montoAfp) : 0,
            montoSfs: data.montoSfs ? parseFloat(data.montoSfs) : 0,
            montoIsr: data.montoIsr ? parseFloat(data.montoIsr) : 0,
            otrosDescuentos: data.otrosDescuentos ? parseFloat(data.otrosDescuentos) : 0,
            tipoSalario: data.tipoSalario || 'MENSUAL',
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

        return serializeBigInt(newEmployee);
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

        return serializeBigInt(updatedEmployee);
    }

    static async delete(id) {
        const result = await prisma.empleado.delete({
            where: { id: BigInt(id) },
        });
        return serializeBigInt(result);
    }
}

module.exports = { EmployeeService };
