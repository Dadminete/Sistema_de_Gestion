const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

class LoanService {
    // --- Tipos de Prestamo ---
    static async getAllLoanTypes() {
        return prisma.tipoPrestamo.findMany({
            where: { activo: true }
        });
    }

    // --- Prestamos ---
    static async getAllLoans() {
        return prisma.prestamo.findMany({
            include: {
                empleado: true,
                tipoPrestamo: true,
                pagosPrestamos: true
            },
            orderBy: { fechaSolicitud: 'desc' }
        });
    }

    static async getLoanById(id) {
        return prisma.prestamo.findUnique({
            where: { id: BigInt(id) },
            include: {
                empleado: true,
                tipoPrestamo: true,
                pagosPrestamos: {
                    orderBy: { numeroCuota: 'asc' }
                }
            }
        });
    }

    static async createLoan(data) {
        // 1. Handle TipoPrestamo
        let tipoPrestamoId = data.tipoPrestamoId;
        if (!tipoPrestamoId) {
            const defaultType = await prisma.tipoPrestamo.findFirst({
                where: { activo: true }
            });

            if (defaultType) {
                tipoPrestamoId = defaultType.id;
            } else {
                // Create a default type if none exists
                const newType = await prisma.tipoPrestamo.create({
                    data: {
                        nombreTipo: 'Préstamo Personal',
                        descripcion: 'Préstamo estándar para empleados',
                        tasaInteres: 0,
                        activo: true
                    }
                });
                tipoPrestamoId = newType.id;
            }
        }

        // 2. Generate Code
        const codigoPrestamo = data.codigoPrestamo || `PRE-${Date.now().toString().slice(-6)}`;

        // 3. Calculate Cuota (Simple calculation for request)
        const montoSolicitado = parseFloat(data.montoSolicitado);
        const plazoMeses = parseInt(data.plazoMeses);
        const cuotaMensual = data.cuotaMensual ? parseFloat(data.cuotaMensual) : (montoSolicitado / plazoMeses);

        return prisma.prestamo.create({
            data: {
                empleadoId: BigInt(data.empleadoId),
                tipoPrestamoId: BigInt(tipoPrestamoId),
                codigoPrestamo: codigoPrestamo,
                montoSolicitado: montoSolicitado,
                montoAprobado: parseFloat(data.montoAprobado || 0),
                plazoMeses: plazoMeses,
                cuotaMensual: cuotaMensual,
                fechaSolicitud: new Date(data.fechaSolicitud || new Date()),
                estado: data.estado || 'SOLICITADO',
                motivo: data.motivo,
            }
        });
    }

    static async updateLoan(id, data) {
        const updateData = { ...data };
        if (data.montoSolicitado) updateData.montoSolicitado = parseFloat(data.montoSolicitado);
        if (data.montoAprobado) updateData.montoAprobado = parseFloat(data.montoAprobado);
        if (data.cuotaMensual) updateData.cuotaMensual = parseFloat(data.cuotaMensual);

        return prisma.prestamo.update({
            where: { id: BigInt(id) },
            data: updateData
        });
    }

    // --- Pagos de Prestamo ---
    static async registerPayment(loanId, paymentData) {
        // Logic to register a payment
        return prisma.pagoPrestamo.create({
            data: {
                prestamoId: BigInt(loanId),
                numeroCuota: paymentData.numeroCuota,
                fechaProgramada: new Date(paymentData.fechaProgramada),
                fechaPago: new Date(),
                montoCuota: parseFloat(paymentData.montoCuota),
                montoCapital: parseFloat(paymentData.montoCapital),
                montoInteres: parseFloat(paymentData.montoInteres),
                montoPagado: parseFloat(paymentData.montoPagado),
                estado: 'PAGADO'
            }
        });
    }
}

module.exports = { LoanService };
