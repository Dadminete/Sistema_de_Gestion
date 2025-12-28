const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();
const { Prisma } = require('@prisma/client');
const { CajaService } = require('./cajaService');
const { CuentaContableService } = require('./cuentaContableService');

/**
 * Obtener fecha actual en zona horaria de República Dominicana (UTC-4)
 * @returns {Date} Fecha actual ajustada a la zona horaria local
 */
function getNowInDominicanaTimeZone() {
    const now = new Date();

    // Obtener la hora en UTC
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const utcDate = now.getUTCDate();
    const utcMonth = now.getUTCMonth();
    const utcYear = now.getUTCFullYear();

    // República Dominicana está en UTC-4 (UTC offset -4 horas)
    // Crear una nueva fecha ajustando por el offset de zona horaria
    // Si estamos en UTC y queremos RD (UTC-4), restamos 4 horas
    const adjustedDate = new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours - 4, utcMinutes, utcSeconds));

    return adjustedDate;
}

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
        const fecha = getNowInDominicanaTimeZone();
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
                    fechaTraspaso: getNowInDominicanaTimeZone(),
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

        // 4. Recalcular saldos de cajas y bancos afectados (sus cuentas contables)
        const cuentasAfectadas = new Set([
            tipoOrigen === 'banco' ? (await prisma.cuentaBancaria.findUnique({ where: { id: bancoOrigenId } }))?.cuentaContableId : null,
            tipoDestino === 'banco' ? (await prisma.cuentaBancaria.findUnique({ where: { id: bancoDestinoId } }))?.cuentaContableId : null,
            tipoOrigen === 'caja' ? (await prisma.caja.findUnique({ where: { id: cajaOrigenId } }))?.cuentaContableId : null,
            tipoDestino === 'caja' ? (await prisma.caja.findUnique({ where: { id: cajaDestinoId } }))?.cuentaContableId : null,
        ].filter(Boolean));

        // Actualizar saldos individuales de las cajas (para el dashboard de cajas)
        if (tipoOrigen === 'caja') await CajaService.recalculateAndUpdateSaldo(cajaOrigenId);
        if (tipoDestino === 'caja') await CajaService.recalculateAndUpdateSaldo(cajaDestinoId);

        // Actualizar saldos agregados de las cuentas contables
        for (const ccId of cuentasAfectadas) {
            await CuentaContableService.recalculateAndUpdateSaldo(ccId);
        }

        return traspaso;
    },

    /**
     * Eliminar un traspaso
     */
    async deleteTraspaso(id) {
        // 1. Obtener el traspaso
        const traspaso = await prisma.traspaso.findUnique({
            where: { id },
        });

        if (!traspaso) {
            throw new Error('Traspaso no encontrado');
        }

        // 2. Realizar eliminación en transacción
        await prisma.$transaction(async (tx) => {
            // Eliminar movimientos contables asociados con el numero de traspaso
            await tx.movimientoContable.deleteMany({
                where: {
                    descripcion: {
                        startsWith: `Traspaso ${traspaso.numeroTraspaso}`
                    }
                }
            });

            // Eliminar el traspaso
            await tx.traspaso.delete({
                where: { id }
            });
        });

        // 3. Recalcular saldos de cuentas afectadas
        const cuentasContablesBancos = new Set([
            traspaso.bancoOrigenId ? (await prisma.cuentaBancaria.findUnique({ where: { id: traspaso.bancoOrigenId } }))?.cuentaContableId : null,
            traspaso.bancoDestinoId ? (await prisma.cuentaBancaria.findUnique({ where: { id: traspaso.bancoDestinoId } }))?.cuentaContableId : null
        ].filter(Boolean));

        const cuentasContablesCajas = new Set([
            traspaso.cajaOrigenId ? (await prisma.caja.findUnique({ where: { id: traspaso.cajaOrigenId } }))?.cuentaContableId : null,
            traspaso.cajaDestinoId ? (await prisma.caja.findUnique({ where: { id: traspaso.cajaDestinoId } }))?.cuentaContableId : null
        ].filter(Boolean));


        const cajasAfectadas = new Set([
            traspaso.cajaOrigenId,
            traspaso.cajaDestinoId,
        ].filter(Boolean));

        // Actualizar saldos individuales de las cajas
        for (const cajaId of cajasAfectadas) {
            await CajaService.recalculateAndUpdateSaldo(cajaId);
        }

        // Actualizar saldos agregados de las cuentas contables (Bancos)
        for (const ccId of cuentasContablesBancos) {
            await CuentaContableService.recalculateAndUpdateSaldo(ccId);
        }
        // Actualizar saldos agregados de las cuentas contables (Cajas)
        for (const ccId of cuentasContablesCajas) {
            await CuentaContableService.recalculateAndUpdateSaldo(ccId);
        }

        return { message: 'Traspaso eliminado correctamente' };
    },

    /**
     * Actualizar un traspaso existente
     */
    async updateTraspaso(id, data) {
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

        // Obtener traspaso actual
        const traspasoActual = await prisma.traspaso.findUnique({
            where: { id },
        });

        if (!traspasoActual) {
            throw new Error('Traspaso no encontrado');
        }

        // Usar transacción para garantizar atomicidad
        const traspaso = await prisma.$transaction(async (tx) => {
            // 1. Revertir movimientos del traspaso anterior
            // Revertir origen anterior (sumar de vuelta)
            if (traspasoActual.cajaOrigenId) {
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'ingreso',
                        monto: parseFloat(traspasoActual.monto),
                        descripcion: `Reversión traspaso ${traspasoActual.numeroTraspaso} (Edición)`,
                        metodo: 'caja',
                        cajaId: traspasoActual.cajaOrigenId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            } else if (traspasoActual.bancoOrigenId) {
                const cuentaBancaria = await tx.cuentaBancaria.findUnique({
                    where: { id: traspasoActual.bancoOrigenId },
                });
                await tx.cuentaContable.update({
                    where: { id: cuentaBancaria.cuentaContableId },
                    data: {
                        saldoActual: {
                            increment: parseFloat(traspasoActual.monto),
                        },
                    },
                });
            }

            // Revertir destino anterior (restar)
            if (traspasoActual.cajaDestinoId) {
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'gasto',
                        monto: parseFloat(traspasoActual.monto),
                        descripcion: `Reversión traspaso ${traspasoActual.numeroTraspaso} (Edición)`,
                        metodo: 'caja',
                        cajaId: traspasoActual.cajaDestinoId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            } else if (traspasoActual.bancoDestinoId) {
                const cuentaBancaria = await tx.cuentaBancaria.findUnique({
                    where: { id: traspasoActual.bancoDestinoId },
                });
                await tx.cuentaContable.update({
                    where: { id: cuentaBancaria.cuentaContableId },
                    data: {
                        saldoActual: {
                            decrement: parseFloat(traspasoActual.monto),
                        },
                    },
                });
            }

            // 2. Validar fondos suficientes en nuevo origen
            let saldoOrigen = 0;
            if (tipoOrigen === 'caja') {
                const caja = await tx.caja.findUnique({
                    where: { id: cajaOrigenId },
                });
                if (!caja) {
                    throw new Error('Caja origen no encontrada');
                }
                saldoOrigen = await CajaService.calcularSaldoActual(cajaOrigenId);
            } else if (tipoOrigen === 'banco') {
                const cuentaBancaria = await tx.cuentaBancaria.findUnique({
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

            // 3. Actualizar registro de traspaso
            const traspasoActualizado = await tx.traspaso.update({
                where: { id },
                data: {
                    monto: parseFloat(monto),
                    conceptoTraspaso,
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

            // 4. Aplicar nuevos movimientos
            // Actualizar saldo de origen (restar)
            if (tipoOrigen === 'caja') {
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'gasto',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${traspasoActual.numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'caja',
                        cajaId: cajaOrigenId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            } else if (tipoOrigen === 'banco') {
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

                await tx.movimientoContable.create({
                    data: {
                        tipo: 'gasto',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${traspasoActual.numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'banco',
                        cuentaBancariaId: bancoOrigenId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            }

            // Actualizar saldo de destino (sumar)
            if (tipoDestino === 'caja') {
                await tx.movimientoContable.create({
                    data: {
                        tipo: 'ingreso',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${traspasoActual.numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'caja',
                        cajaId: cajaDestinoId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            } else if (tipoDestino === 'banco') {
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

                await tx.movimientoContable.create({
                    data: {
                        tipo: 'ingreso',
                        monto: parseFloat(monto),
                        descripcion: `Traspaso ${traspasoActual.numeroTraspaso}: ${conceptoTraspaso}`,
                        metodo: 'banco',
                        cuentaBancariaId: bancoDestinoId,
                        usuarioId: autorizadoPorId,
                        categoriaId: await this._getCategoriaTraspasoId(tx),
                    },
                });
            }

            return traspasoActualizado;
        });

        // 5. Recalcular saldos de cajas y bancos afectados
        const cuentasContablesAfectadas = new Set([
            traspasoActual.bancoOrigenId ? (await prisma.cuentaBancaria.findUnique({ where: { id: traspasoActual.bancoOrigenId } }))?.cuentaContableId : null,
            traspasoActual.bancoDestinoId ? (await prisma.cuentaBancaria.findUnique({ where: { id: traspasoActual.bancoDestinoId } }))?.cuentaContableId : null,
            bancoOrigenId ? (await prisma.cuentaBancaria.findUnique({ where: { id: bancoOrigenId } }))?.cuentaContableId : null,
            bancoDestinoId ? (await prisma.cuentaBancaria.findUnique({ where: { id: bancoDestinoId } }))?.cuentaContableId : null,
            traspasoActual.cajaOrigenId ? (await prisma.caja.findUnique({ where: { id: traspasoActual.cajaOrigenId } }))?.cuentaContableId : null,
            traspasoActual.cajaDestinoId ? (await prisma.caja.findUnique({ where: { id: traspasoActual.cajaDestinoId } }))?.cuentaContableId : null,
            cajaOrigenId ? (await prisma.caja.findUnique({ where: { id: cajaOrigenId } }))?.cuentaContableId : null,
            cajaDestinoId ? (await prisma.caja.findUnique({ where: { id: cajaDestinoId } }))?.cuentaContableId : null,
        ].filter(Boolean));

        const cajasAfectadas = new Set([
            traspasoActual.cajaOrigenId,
            traspasoActual.cajaDestinoId,
            tipoOrigen === 'caja' ? cajaOrigenId : null,
            tipoDestino === 'caja' ? cajaDestinoId : null,
        ].filter(Boolean));

        for (const cajaId of cajasAfectadas) {
            await CajaService.recalculateAndUpdateSaldo(cajaId);
        }

        for (const ccId of cuentasContablesAfectadas) {
            await CuentaContableService.recalculateAndUpdateSaldo(ccId);
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
        const cuentas = await prisma.cuentaBancaria.findMany({
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
                        id: true,
                        saldoActual: true,
                        saldoInicial: true,
                    },
                },
            },
            orderBy: {
                numeroCuenta: 'asc',
            },
        });

        // Recalcular saldoActual para cada cuenta bancaria usando la lógica centralizada
        const cuentasConSaldo = await Promise.all(
            cuentas.map(async (cuenta) => {
                // Balance individual de la cuenta bancaria (no el agregado de la cuenta contable)
                const saldoIndividual = await CuentaContableService.getBankAccountBalance(
                    cuenta.id,
                    0
                );

                return {
                    ...cuenta,
                    cuentaContable: {
                        ...cuenta.cuentaContable,
                        saldoActual: saldoIndividual,
                    },
                };
            })
        );

        return cuentasConSaldo;
    },
};

module.exports = traspasoService;
