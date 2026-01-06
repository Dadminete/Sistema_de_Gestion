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
        if (data.plazoMeses) updateData.plazoMeses = parseInt(data.plazoMeses);
        if (data.empleadoId) updateData.empleadoId = BigInt(data.empleadoId);
        if (data.tipoPrestamoId) updateData.tipoPrestamoId = BigInt(data.tipoPrestamoId);

        return prisma.prestamo.update({
            where: { id: BigInt(id) },
            data: updateData,
            include: {
                empleado: true,
                tipoPrestamo: true
            }
        });
    }

    static async approveLoan(id, approvalData) {
        const { montoAprobado, metodoPago, cajaId, cuentaBancariaId, observaciones, aprobadoPorId, usuarioId } = approvalData;

        // Actualizar el préstamo
        const loan = await prisma.prestamo.update({
            where: { id: BigInt(id) },
            data: {
                estado: 'APROBADO',
                montoAprobado: parseFloat(montoAprobado),
                fechaAprobacion: new Date(),
                metodoPago,
                cajaId: cajaId || null, // cajaId es UUID string, no BigInt
                cuentaBancariaId: cuentaBancariaId || null, // cuentaBancariaId es UUID string, no BigInt
                observacionesAprobacion: observaciones,
                aprobadoPorId: aprobadoPorId ? BigInt(aprobadoPorId) : null
            },
            include: {
                empleado: true,
                tipoPrestamo: true
            }
        });

        // Buscar categoría contable para préstamos
        const categoria = await prisma.categoriaCuenta.findFirst({
            where: {
                OR: [
                    { nombre: { contains: 'Prestamo', mode: 'insensitive' } },
                    { nombre: { contains: 'Préstamo', mode: 'insensitive' } },
                    { nombre: { contains: 'Empleado', mode: 'insensitive' } },
                    { tipo: 'egreso' } // Fallback genérico
                ]
            }
        });

        // Crear movimiento contable de salida (egreso)
        const movimientoContableService = require('./movimientoContableService');

        try {
            await movimientoContableService.createMovimiento({
                tipo: 'egreso',
                monto: parseFloat(montoAprobado),
                categoriaId: categoria ? categoria.id : null, // Usar ID de categoría encontrada
                metodo: metodoPago.toLowerCase() === 'efectivo' ? 'caja' : 'banco',
                cajaId: cajaId || null, // cajaId es UUUID string
                cuentaBancariaId: cuentaBancariaId || null, // cuentaBancariaId es UUID string
                descripcion: `Préstamo aprobado - ${loan.empleado.nombres} ${loan.empleado.apellidos} - ${loan.codigoPrestamo}`,
                usuarioId: usuarioId ? String(usuarioId) : null // Usar el ID de usuario (UUID)
            });
        } catch (error) {
            console.error('Error al crear movimiento contable:', error);
            // Si falla por falta de categoría (que es required en schema), loguear el error específico
            if (!categoria) {
                console.error('ERROR CRÍTICO: No se encontró ninguna categoría contable para asociar al préstamo.');
            }
            // No falla la aprobación si el movimiento no se crea, pero idealmente debería ser transaccional
        }

        return loan;
    }

    static async rejectLoan(id, motivo) {
        return prisma.prestamo.update({
            where: { id: BigInt(id) },
            data: {
                estado: 'RECHAZADO',
                observacionesAprobacion: motivo,
                fechaAprobacion: new Date()
            },
            include: {
                empleado: true,
                tipoPrestamo: true
            }
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
