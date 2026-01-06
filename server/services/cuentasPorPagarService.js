const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CuentasPorPagarService = {
    // Función para calcular días vencidos
    calcularDiasVencidos(fechaVencimiento) {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diffTime = hoy - vencimiento;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Función para determinar el estado basado en días vencidos
    determinarEstado(diasVencido, montoPendiente) {
        if (montoPendiente <= 0) return 'pagada';
        if (diasVencido > 0) return 'vencida';
        return 'pendiente';
    },

    async getAll(filtros = {}) {
        const { proveedorId, estado, fechaDesde, fechaHasta, montoMinimo, montoMaximo, skip = 0, take = 50 } = filtros;

        const where = { AND: [] };
        if (proveedorId) where.AND.push({ proveedorId });
        if (estado) where.AND.push({ estado });
        if (fechaDesde || fechaHasta) {
            const fechaFiltro = {};
            if (fechaDesde) fechaFiltro.gte = new Date(fechaDesde);
            if (fechaHasta) fechaFiltro.lte = new Date(fechaHasta);
            where.AND.push({ fechaVencimiento: fechaFiltro });
        }

        const [cuentas, total] = await Promise.all([
            prisma.cuentaPorPagar.findMany({
                where: where.AND.length > 0 ? where : {},
                include: { proveedor: true },
                orderBy: { fechaVencimiento: 'desc' },
                skip,
                take
            }),
            prisma.cuentaPorPagar.count({
                where: where.AND.length > 0 ? where : {}
            })
        ]);

        return {
            data: cuentas.map(c => ({
                ...c,
                diasVencido: this.calcularDiasVencidos(c.fechaVencimiento),
                estado: this.determinarEstado(this.calcularDiasVencidos(c.fechaVencimiento), c.montoPendiente)
            })),
            total
        };
    },

    async registrarPago(id, { monto, fechaPago, metodoPago, numeroReferencia, observaciones, usuarioId }) {
        const montoPago = parseFloat(monto);

        return await prisma.$transaction(async (tx) => {
            const cuenta = await tx.cuentaPorPagar.findUnique({ where: { id } });
            if (!cuenta) throw new Error('Cuenta por pagar no encontrada');

            if (montoPago > cuenta.montoPendiente) {
                throw new Error('El monto del pago no puede ser mayor al monto pendiente');
            }

            const nuevoMontoPendiente = cuenta.montoPendiente - montoPago;
            const diasVencido = this.calcularDiasVencidos(cuenta.fechaVencimiento);
            const nuevoEstado = this.determinarEstado(diasVencido, nuevoMontoPendiente);

            // 1. Crear el registro de pago para el historial
            await tx.pagoCuentaPorPagar.create({
                data: {
                    cuentaPorPagarId: id,
                    monto: montoPago,
                    fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
                    metodoPago,
                    numeroReferencia,
                    observaciones,
                    creadoPorId: usuarioId
                }
            });

            // 2. Actualizar la cuenta por pagar
            return await tx.cuentaPorPagar.update({
                where: { id },
                data: {
                    montoPendiente: nuevoMontoPendiente,
                    estado: nuevoEstado,
                    diasVencido
                },
                include: { proveedor: true }
            });
        });
    }
};

module.exports = CuentasPorPagarService;
