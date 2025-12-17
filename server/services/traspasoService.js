const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();
const { Prisma } = require('@prisma/client');
const { CajaService } = require('./cajaService');

const traspasoService = {
    /**
     * Obtener todos los traspasos con paginación
     */
    async getAllTraspasos(page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const [traspasos, total] = await Promise.all([
            prisma.traspaso.findMany({
                skip,
                take: limit,
                include: {
                    autorizadoPor: {
                        select: {
                            id: true,
                            username: true,
                            nombre: true,
                            apellido: true,
                        },
                    },
                    cuentaBancariaOrigen: {
                        select: {
                            id: true,
                            numeroCuenta: true,
                            nombreOficialCuenta: true,
                            bank: {
                                select: {
                                    id: true,
                                    nombre: true,
                                },
                            },
                        },
                    },
                    cuentaBancariaDestino: {
                        select: {
                            id: true,
                            numeroCuenta: true,
                            nombreOficialCuenta: true,
                            bank: {
                                select: {
                                    id: true,
                                    nombre: true,
                                },
                            },
                        },
                    },
                    cajaOrigen: {
                        select: {
                            id: true,
                            nombre: true,
                            tipo: true,
                        },
                    },
                    cajaDestino: {
                        select: {
                            id: true,
                            nombre: true,
                            tipo: true,
                        },
                    },
                },
                orderBy: {
                    fechaTraspaso: 'desc',
                },
            }),
            prisma.traspaso.count(),
        ]);

        return {
            traspasos,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    /**
     * Obtener un traspaso por ID
     */
    async getTraspasoById(id) {
        return prisma.traspaso.findUnique({
            where: { id },
            include: {
                autorizadoPor: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true,
                        apellido: true,
                    },
                },
                cuentaBancariaOrigen: {
                    select: {
                        id: true,
                        numeroCuenta: true,
                        nombreOficialCuenta: true,
                        bank: true,
                    },
                },
                cuentaBancariaDestino: {
                    select: {
                        id: true,
                        numeroCuenta: true,
                        nombreOficialCuenta: true,
                        bank: true,
                    },
                },
                cajaOrigen: true,
                cajaDestino: true,
            },
        });
    },

    /**
     * Crear un nuevo traspaso
     */
    async createTraspaso(data) {
        const {
            monto,
            conceptoTraspaso,
            autorizadoPorId,
            // Origen
            tipoOrigen, // 'caja' o 'banco'
            cajaOrigenId,
            bancoOrigenId,
            // Destino
            tipoDestino, // 'caja' o 'banco'
            cajaDestinoId,
            bancoDestinoId,
        } = data;

        // Validaciones
        if (!monto || parseFloat(monto) <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }

        if (!conceptoTraspaso || conceptoTraspaso.trim() === '') {
            throw new Error('El concepto es requerido');
        }

        // Validar que origen y destino no sean el mismo
        if (tipoOrigen === 'caja' && tipoDestino === 'caja' && cajaOrigenId === cajaDestinoId) {
            throw new Error('La caja origen y destino no pueden ser la misma');
        }

        if (
            tipoOrigen === 'banco' &&
            tipoDestino === 'banco' &&
            bancoOrigenId === bancoDestinoId
        ) {
            throw new Error('La cuenta bancaria origen y destino no pueden ser la misma');
        }

        // Validar fondos suficientes en origen
        let saldoOrigen = 0;
        if (tipoOrigen === 'caja') {
            const caja = await prisma.caja.findUnique({
                where: { id: cajaOrigenId },
            });
            if (!caja) {
                throw new Error('Caja origen no encontrada');
            }
            saldoOrigen = await CajaService.calcularSaldoActual(cajaOrigenId);
        } else if (tipoOrigen === 'banco') {
            const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
                where: { id: bancoOrigenId },
                include: {
                    cuentaContable: true,
                },
            });
            if (!cuentaBancaria) {
                throw new Error('Cuenta bancaria origen no encontrada');
            }
            saldoOrigen = parseFloat(cuentaBancaria.cuentaContable.saldoActual || 0);
        }

        if (saldoOrigen < parseFloat(monto)) {
            throw new Error(
                `Fondos insuficientes. Saldo disponible: ${saldoOrigen.toFixed(2)}`
            );
        }

        // Generar número de traspaso único
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const prefix = `TR-${año}${mes}-`;

        // Buscar el último traspaso de este mes para mantener la secuencia
        const ultimoTraspaso = await prisma.traspaso.findFirst({
            where: {
                numeroTraspaso: {
                    startsWith: prefix
                }
            },
            orderBy: {
                numeroTraspaso: 'desc',
            },
        });

        let numeroSecuencial = 1;
        if (ultimoTraspaso && ultimoTraspaso.numeroTraspaso) {
            const parts = ultimoTraspaso.numeroTraspaso.split('-');
            // Formato esperado: TR-YYYYMM-XXXXX
            if (parts.length === 3) {
                const lastSequence = parseInt(parts[2], 10);
                if (!isNaN(lastSequence)) {
                    numeroSecuencial = lastSequence + 1;
                }
            }
        }

        const numeroTraspaso = `${prefix}${String(numeroSecuencial).padStart(5, '0')}`;

        // Usar transacción para garantizar atomicidad
        const traspaso = await prisma.$transaction(async (tx) => {
            // 1. Crear registro de traspaso
            const nuevoTraspaso = await tx.traspaso.create({
                data: {
                    numeroTraspaso,
                    fechaTraspaso: new Date(),
                    monto: parseFloat(monto),
                    conceptoTraspaso,
                    estado: 'completado',
                    autorizadoPorId,
                    cajaOrigenId: tipoOrigen === 'caja' ? cajaOrigenId : null,
                    bancoOrigenId: tipoOrigen === 'banco' ? bancoOrigenId : null,
                    cajaDestinoId: tipoDestino === 'caja' ? cajaDestinoId : null,
                    bancoDestinoId: tipoDestino === 'banco' ? bancoDestinoId : null,
                },
                include: {
                    autorizadoPor: {
                        select: {
                            id: true,
                            username: true,
                            nombre: true,
                            apellido: true,
                        },
                    },
                    cuentaBancariaOrigen: true,
                    cuentaBancariaDestino: true,
                    cajaOrigen: true,
                    cajaDestino: true,
                },
            });

            // 2. Actualizar saldo de origen (restar)
            if (tipoOrigen === 'caja') {
                // Para cajas, el saldo se recalcula con los movimientos
                // Crear movimiento de salida
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'gasto',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'caja',
                        cajaId: cajaOrigenId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            } else if (tipoOrigen === 'banco') {
                // Para bancos, actualizar directamente el saldo en cuenta_contable
                const cuentaBancaria = await tx.cuentaBancaria.findUnique({
                    where: { id: bancoOrigenId },
                });
                await tx.cuentaContable.update({
                    where: { id: cuentaBancaria.cuentaContableId },
                    data: {
                        saldoActual: {
                            decrement: parseFloat(monto),
                        },
                    },
                });

                // Crear movimiento contable
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'gasto',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'banco',
                        cuentaBancariaId: bancoOrigenId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            }

            // 3. Actualizar saldo de destino (sumar)
            if (tipoDestino === 'caja') {
                // Crear movimiento de entrada
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'ingreso',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'caja',
                        cajaId: cajaDestinoId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            } else if (tipoDestino === 'banco') {
                // Actualizar saldo en cuenta_contable
                const cuentaBancaria = await tx.cuentaBancaria.findUnique({
                    where: { id: bancoDestinoId },
                });
                await tx.cuentaContable.update({
                    where: { id: cuentaBancaria.cuentaContableId },
                    data: {
                        saldoActual: {
                            increment: parseFloat(monto),
                        },
                    },
                });

                // Crear movimiento contable
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'ingreso',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'banco',
                        cuentaBancariaId: bancoDestinoId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            }

            return nuevoTraspaso;
        });

        // 4. Recalcular saldos de cajas y actualizar cuentas contables si aplica
        if (tipoOrigen === 'caja') {
            const nuevoSaldoOrigen = await CajaService.recalculateAndUpdateSaldo(cajaOrigenId);
            // Actualizar también la cuenta contable asociada
            const cajaOrigen = await prisma.caja.findUnique({ where: { id: cajaOrigenId } });
            if (cajaOrigen && cajaOrigen.cuentaContableId) {
                await prisma.cuentaContable.update({
                    where: { id: cajaOrigen.cuentaContableId },
                    data: { saldoActual: nuevoSaldoOrigen },
                });
            }
        }
        if (tipoDestino === 'caja') {
            const nuevoSaldoDestino = await CajaService.recalculateAndUpdateSaldo(cajaDestinoId);
            // Actualizar también la cuenta contable asociada
            const cajaDestino = await prisma.caja.findUnique({ where: { id: cajaDestinoId } });
            if (cajaDestino && cajaDestino.cuentaContableId) {
                await prisma.cuentaContable.update({
                    where: { id: cajaDestino.cuentaContableId },
                    data: { saldoActual: nuevoSaldoDestino },
                });
            }
        }

        return traspaso;
    },

    /**
     * Obtener categoría para traspasos (crear si no existe)
     */
    async _getCategoriaTraspasoId(tx) {
        let categoria = await tx.categoriaCuenta.findFirst({
            where: {
                nombre: 'Traspasos',
            },
        });

        if (!categoria) {
            categoria = await tx.categoriaCuenta.create({
                data: {
                    nombre: 'Traspasos',
                    codigo: 'TRASP-001',
                    tipo: 'Transferencia',
                    subtipo: 'Interna',
                    nivel: 1,
                    esDetalle: true,
                    activa: true,
                },
            });
        }

        return categoria.id;
    },

    /**
     * Filtrar traspasos por rango de fechas
     */
    async getTraspasosByFecha(fechaInicio, fechaFin) {
        return prisma.traspaso.findMany({
            where: {
                fechaTraspaso: {
                    gte: new Date(fechaInicio),
                    lte: new Date(fechaFin),
                },
            },
            include: {
                autorizadoPor: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true,
                        apellido: true,
                    },
                },
                cuentaBancariaOrigen: true,
                cuentaBancariaDestino: true,
                cajaOrigen: true,
                cajaDestino: true,
            },
            orderBy: {
                fechaTraspaso: 'desc',
            },
        });
    },

    /**
     * Obtener traspasos por cuenta específica
     */
    async getTraspasosByCuenta(cuentaId, tipo) {
        const where = {};

        if (tipo === 'caja') {
            where.OR = [{ cajaOrigenId: cuentaId }, { cajaDestinoId: cuentaId }];
        } else if (tipo === 'banco') {
            where.OR = [{ bancoOrigenId: cuentaId }, { bancoDestinoId: cuentaId }];
        }

        return prisma.traspaso.findMany({
            where,
            include: {
                autorizadoPor: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true,
                        apellido: true,
                    },
                },
                cuentaBancariaOrigen: true,
                cuentaBancariaDestino: true,
                cajaOrigen: true,
                cajaDestino: true,
            },
            orderBy: {
                fechaTraspaso: 'desc',
            },
        });
    },

    /**
     * Obtener todas las cajas activas
     */
    async getCajasActivas() {
        return prisma.caja.findMany({
            where: {
                activa: true,
            },
            select: {
                id: true,
                nombre: true,
                tipo: true,
                saldoActual: true,
            },
            orderBy: {
                nombre: 'asc',
            },
        });
    },

    /**
     * Obtener todas las cuentas bancarias activas
     */
    async getCuentasBancariasActivas() {
        return prisma.cuentaBancaria.findMany({
            where: {
                activo: true,
            },
            include: {
                bank: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
                cuentaContable: {
                    select: {
                        saldoActual: true,
                    },
                },
            },
            orderBy: {
                numeroCuenta: 'asc',
            },
        });
    },
};

module.exports = traspasoService;
