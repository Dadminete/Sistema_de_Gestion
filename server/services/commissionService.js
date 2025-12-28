const prisma = require('../prismaClient');
const { CajaService } = require('./cajaService');

class CommissionService {
    constructor() {
        this.prisma = prisma;
    }

    // Commission Types
    async getCommissionTypes(includeInactive = false) {
        try {
            const where = includeInactive ? {} : { activo: true };
            return await this.prisma.TipoComision.findMany({
                where,
                orderBy: { nombreTipo: 'asc' }
            });
        } catch (error) {
            console.error('Error in getCommissionTypes:', error);
            throw error;
        }
    }

    async createCommissionType(data) {
        try {
            console.log('[Commission Service] Creating commission type with data:', data);
            
            // Validaciones - aceptar tanto 'nombre' como 'nombreTipo'
            const nombre = data.nombreTipo || data.nombre;
            if (!nombre || !String(nombre).trim()) {
                throw new Error('El nombre del tipo de comisión es requerido');
            }

            // Manejo para porcentajeBase o porcentaje, y montoFijo o monto
            let porcentajeBase = data.porcentajeBase !== undefined ? parseFloat(data.porcentajeBase) : null;
            let montoFijo = data.montoFijo !== undefined ? parseFloat(data.montoFijo) : null;

            // Validar al menos uno de los dos campos
            const tieneValorValido = (porcentajeBase !== null && porcentajeBase > 0) || 
                                     (montoFijo !== null && montoFijo > 0);

            if (!tieneValorValido) {
                throw new Error('El tipo de comisión debe tener un porcentaje o un monto fijo válido');
            }

            // Si tienen ambos, validarlos
            if (porcentajeBase !== null && (isNaN(porcentajeBase) || porcentajeBase < 0 || porcentajeBase > 100)) {
                throw new Error('El porcentaje debe ser un número válido entre 0 y 100');
            }

            if (montoFijo !== null && (isNaN(montoFijo) || montoFijo < 0)) {
                throw new Error('El monto fijo debe ser un número válido positivo');
            }

            return await this.prisma.TipoComision.create({
                data: {
                    nombreTipo: String(nombre).trim(),
                    descripcion: data.descripcion?.trim() || null,
                    porcentajeBase: porcentajeBase,
                    montoFijo: montoFijo,
                    activo: data.activo !== undefined ? data.activo : true
                }
            });
        } catch (error) {
            console.error('Error in createCommissionType:', error);
            throw error;
        }
    }

    async updateCommissionType(id, data) {
        try {
            const updateData = {};

            // Aceptar tanto 'nombre' como 'nombreTipo'
            if (data.nombreTipo || data.nombre) {
                const nombre = data.nombreTipo || data.nombre;
                if (String(nombre).trim()) {
                    updateData.nombreTipo = String(nombre).trim();
                }
            }

            if (data.descripcion !== undefined) {
                updateData.descripcion = data.descripcion?.trim() || null;
            }

            if (data.porcentajeBase !== undefined && data.porcentajeBase !== null) {
                updateData.porcentajeBase = parseFloat(data.porcentajeBase);
            }

            if (data.montoFijo !== undefined && data.montoFijo !== null) {
                updateData.montoFijo = parseFloat(data.montoFijo);
            }

            if (data.activo !== undefined) {
                updateData.activo = data.activo;
            }

            return await this.prisma.TipoComision.update({
                where: { id: parseInt(id) },
                data: updateData
            });
        } catch (error) {
            console.error('Error in updateCommissionType:', error);
            throw error;
        }
    }

    async deleteCommissionType(id) {
        try {
            return await this.prisma.TipoComision.delete({
                where: { id: parseInt(id) }
            });
        } catch (error) {
            console.error('Error in deleteCommissionType:', error);
            throw error;
        }
    }

    // Commissions
    async getCommissions(filters = {}) {
        try {
            console.log('[Commission Service] Fetching commissions with filters:', filters);
            
            const where = {};

            if (filters.empleadoId) {
                where.empleadoId = parseInt(filters.empleadoId);
            }
            if (filters.tipoComisionId) {
                where.tipoComisionId = parseInt(filters.tipoComisionId);
            }
            if (filters.periodoAno) {
                where.periodoAno = parseInt(filters.periodoAno);
            }
            if (filters.periodoMes) {
                where.periodoMes = parseInt(filters.periodoMes);
            }
            if (filters.estado) {
                where.estado = filters.estado;
            }

            const commissions = await this.prisma.Comision.findMany({
                where,
                include: {
                    empleado: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidos: true,
                            cedula: true,
                            codigoEmpleado: true
                        }
                    },
                    tipoComision: {
                        select: { id: true, nombreTipo: true, porcentajeBase: true }
                    }
                },
                orderBy: { fechaGeneracion: 'desc' }
            });

            console.log(`[Commission Service] Successfully fetched ${commissions.length} commissions`);
            return commissions;
        } catch (error) {
            console.error('Error in getCommissions:', error);
            throw error;
        }
    }

    async getCommissionById(id) {
        try {
            return await this.prisma.Comision.findUnique({
                where: { id: parseInt(id) },
                include: {
                    empleado: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidos: true,
                            cedula: true,
                            codigoEmpleado: true
                        }
                    },
                    tipoComision: {
                        select: { id: true, nombreTipo: true, porcentajeBase: true, descripcion: true }
                    }
                }
            });
        } catch (error) {
            console.error('Error in getCommissionById:', error);
            throw error;
        }
    }

    async calculateCommission(tipoComisionId, montoBase) {
        try {
            console.log('[Commission Service] Calculating commission for type:', tipoComisionId, 'base:', montoBase);
            
            const tipoComision = await this.prisma.TipoComision.findUnique({
                where: { id: parseInt(tipoComisionId) }
            });

            if (!tipoComision) {
                throw new Error('Tipo de comisión no encontrado');
            }

            console.log('[Commission Service] Tipo encontrado:', {
                id: tipoComision.id,
                nombre: tipoComision.nombreTipo,
                porcentajeBase: tipoComision.porcentajeBase,
                montoFijo: tipoComision.montoFijo
            });

            let montoComision = 0;
            let porcentajeAplicado = 0;

            // Si tiene monto fijo, usar eso
            if (tipoComision.montoFijo != null && parseFloat(tipoComision.montoFijo) > 0) {
                montoComision = parseFloat(tipoComision.montoFijo);
                const montoBaseFloat = parseFloat(montoBase) || 0;
                porcentajeAplicado = montoBaseFloat > 0 ? (montoComision / montoBaseFloat) * 100 : 0;
            }
            // Si no tiene monto fijo pero sí porcentaje, calcular por porcentaje
            else if (tipoComision.porcentajeBase != null && parseFloat(tipoComision.porcentajeBase) > 0) {
                porcentajeAplicado = parseFloat(tipoComision.porcentajeBase);
                const montoBaseFloat = parseFloat(montoBase) || 0;
                montoComision = (montoBaseFloat * porcentajeAplicado) / 100;
            }
            
            // Verificar que los valores calculados sean válidos
            if (isNaN(montoComision) || isNaN(porcentajeAplicado)) {
                throw new Error('Error en el cálculo de la comisión: valores inválidos');
            }

            const result = {
                montoComision: parseFloat(montoComision.toFixed(2)),
                porcentajeAplicado: parseFloat(porcentajeAplicado.toFixed(2))
            };

            console.log('[Commission Service] Calculation result:', result);
            return result;
        } catch (error) {
            console.error('Error in calculateCommission:', error);
            throw error;
        }
    }

    async createCommission(data) {
        try {
            // Validar y convertir los datos antes de enviar a Prisma
            const empleadoId = parseInt(data.empleadoId);
            const tipoComisionId = parseInt(data.tipoComisionId);
            const montoBase = parseFloat(data.montoBase);
            const montoComision = parseFloat(data.montoComision);
            const porcentajeAplicado = parseFloat(data.porcentajeAplicado);
            const periodoAno = parseInt(data.periodoAno);
            const periodoMes = parseInt(data.periodoMes);

            // Validar que los valores numéricos no sean NaN
            if (isNaN(empleadoId) || isNaN(tipoComisionId) || isNaN(montoBase) || 
                isNaN(montoComision) || isNaN(porcentajeAplicado) || 
                isNaN(periodoAno) || isNaN(periodoMes)) {
                throw new Error('Todos los campos numéricos son requeridos y deben ser valores válidos');
            }

            return await this.prisma.Comision.create({
                data: {
                    empleadoId,
                    tipoComisionId,
                    montoBase,
                    montoComision,
                    porcentajeAplicado,
                    periodoAno,
                    periodoMes,
                    descripcion: data.descripcion || '',
                    estado: data.estado || 'PENDIENTE'
                },
                include: {
                    empleado: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidos: true,
                            cedula: true,
                            codigoEmpleado: true
                        }
                    },
                    tipoComision: {
                        select: { id: true, nombreTipo: true, porcentajeBase: true }
                    }
                }
            });
        } catch (error) {
            console.error('Error in createCommission:', error);
            throw error;
        }
    }

    async updateCommission(id, data) {
        try {
            return await this.prisma.Comision.update({
                where: { id: parseInt(id) },
                data: {
                    ...(data.empleadoId && { empleadoId: parseInt(data.empleadoId) }),
                    ...(data.tipoComisionId && { tipoComisionId: parseInt(data.tipoComisionId) }),
                    ...(data.montoBase !== undefined && { montoBase: parseFloat(data.montoBase) }),
                    ...(data.montoComision !== undefined && { montoComision: parseFloat(data.montoComision) }),
                    ...(data.porcentajeAplicado !== undefined && { porcentajeAplicado: parseFloat(data.porcentajeAplicado) }),
                    ...(data.periodoAno && { periodoAno: parseInt(data.periodoAno) }),
                    ...(data.periodoMes && { periodoMes: parseInt(data.periodoMes) }),
                    ...(data.descripcion && { descripcion: data.descripcion }),
                    ...(data.estado && { estado: data.estado })
                },
                include: {
                    empleado: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidos: true,
                            cedula: true,
                            codigoEmpleado: true
                        }
                    },
                    tipoComision: {
                        select: { id: true, nombreTipo: true, porcentajeBase: true }
                    }
                }
            });
        } catch (error) {
            console.error('Error in updateCommission:', error);
            throw error;
        }
    }

    async markAsPaid(id, fechaPago, usuarioId) {
        try {
            console.log('[Commission Service] markAsPaid called with:', { id, fechaPago, usuarioId });
            
            // Validar ID
            const comisionId = parseInt(id);
            if (isNaN(comisionId) || comisionId <= 0) {
                throw new Error('ID de comisión inválido');
            }

            const fecha = fechaPago ? new Date(fechaPago) : new Date();
            if (isNaN(fecha.getTime())) {
                throw new Error('Fecha de pago inválida');
            }
            
            // Primero obtener la comisión para saber el monto
            const comision = await this.prisma.Comision.findUnique({
                where: { id: comisionId },
                include: {
                    empleado: {
                        select: {
                            id: true,
                            nombres: true,
                            apellidos: true,
                            cedula: true,
                            codigoEmpleado: true
                        }
                    },
                    tipoComision: {
                        select: { id: true, nombreTipo: true, porcentajeBase: true, montoFijo: true }
                    }
                }
            });

            if (!comision) {
                throw new Error('Comisión no encontrada');
            }

            if (comision.estado === 'PAGADO') {
                throw new Error('La comisión ya está marcada como pagada');
            }

            // Si el monto de comisión es 0 o inválido, intentar recalcularlo
            let montoComisionFinal = parseFloat(comision.montoComision) || 0;
            
            if (montoComisionFinal <= 0) {
                console.log('[Commission Service] Monto inválido, recalculando...');
                
                // Intentar recalcular el monto usando el tipo de comisión
                if (comision.tipoComision.montoFijo && parseFloat(comision.tipoComision.montoFijo) > 0) {
                    montoComisionFinal = parseFloat(comision.tipoComision.montoFijo);
                    const montoBase = parseFloat(comision.montoBase) || 0;
                    const nuevoPorcentaje = montoBase > 0 ? (montoComisionFinal / montoBase) * 100 : 0;
                    
                    console.log('[Commission Service] Monto recalculado:', montoComisionFinal);
                } else if (comision.tipoComision.porcentajeBase && parseFloat(comision.tipoComision.porcentajeBase) > 0) {
                    const porcentaje = parseFloat(comision.tipoComision.porcentajeBase);
                    const montoBase = parseFloat(comision.montoBase) || 0;
                    montoComisionFinal = (montoBase * porcentaje) / 100;
                    
                    console.log('[Commission Service] Monto recalculado por porcentaje:', montoComisionFinal);
                } else {
                    throw new Error('No se puede calcular el monto de la comisión: tipo de comisión sin monto fijo ni porcentaje válido');
                }
            }
            
            // Validar que ahora tengamos un monto válido
            if (isNaN(montoComisionFinal) || montoComisionFinal <= 0) {
                throw new Error('El monto de la comisión es inválido después del recálculo');
            }

            console.log('[Commission Service] Commission found:', {
                id: comision.id,
                monto: comision.montoComision,
                montoFinal: montoComisionFinal,
                empleado: `${comision.empleado?.nombres} ${comision.empleado?.apellidos}`
            });

            // Usar una transacción para asegurar consistencia
            const result = await this.prisma.$transaction(async (trx) => {
                console.log('[Commission Service] Starting transaction...');
                
                // Actualizar el estado de la comisión
                const updatedComision = await trx.Comision.update({
                    where: { id: comisionId },
                    data: {
                        estado: 'PAGADO',
                        fechaPago: fecha
                    },
                    include: {
                        empleado: {
                            select: {
                                id: true,
                                nombres: true,
                                apellidos: true,
                                cedula: true,
                                codigoEmpleado: true
                            }
                        },
                        tipoComision: {
                            select: { id: true, nombreTipo: true, porcentajeBase: true }
                        }
                    }
                });

                // Buscar o crear una categoría para comisiones
                let categoriaComisiones = await trx.CategoriaCuenta.findFirst({
                    where: {
                        OR: [
                            { nombre: { contains: 'Comisiones', mode: 'insensitive' } },
                            { nombre: { contains: 'Gastos Personal', mode: 'insensitive' } },
                            { nombre: { contains: 'Gastos de Personal', mode: 'insensitive' } }
                        ]
                    }
                });

                if (!categoriaComisiones) {
                    // Si no existe, buscar una categoría de gastos generales
                    categoriaComisiones = await trx.CategoriaCuenta.findFirst({
                        where: {
                            tipo: 'gasto',
                            activa: true
                        }
                    });
                }

                if (!categoriaComisiones) {
                    throw new Error('No se encontró una categoría adecuada para registrar el pago de comisiones');
                }

                // Buscar la caja principal
                const cajaPrincipal = await trx.Caja.findFirst({
                    where: {
                        OR: [
                            { nombre: { equals: 'Caja', mode: 'insensitive' } },
                            { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                            { tipo: 'general' }
                        ],
                        activa: true
                    }
                });

                if (!cajaPrincipal) {
                    throw new Error('No se encontró la caja principal para registrar el pago');
                }

                // Obtener usuario del sistema si no se proporciona usuarioId
                let finalUsuarioId = usuarioId;
                if (!finalUsuarioId) {
                    const sistemaUser = await trx.Usuario.findFirst({
                        where: {
                            OR: [
                                { username: 'system' },
                                { username: 'admin' },
                                { username: 'Dadmin' }
                            ]
                        }
                    });
                    finalUsuarioId = sistemaUser?.id;
                }

                if (!finalUsuarioId) {
                    throw new Error('No se encontró un usuario válido para registrar el movimiento');
                }

                // Crear el movimiento contable (gasto)
                const movimientoData = {
                    tipo: 'gasto',
                    monto: montoComisionFinal,
                    categoriaId: categoriaComisiones.id,
                    metodo: 'caja',
                    cajaId: cajaPrincipal.id,
                    descripcion: `Pago comisión - ${comision.empleado?.nombres} ${comision.empleado?.apellidos} - ${comision.tipoComision?.nombreTipo}`,
                    usuarioId: finalUsuarioId,
                    fecha: fecha
                };

                console.log('[Commission Service] Creating MovimientoContable with data:', movimientoData);

                const movimiento = await trx.MovimientoContable.create({
                    data: movimientoData
                });

                console.log('[Commission Service] MovimientoContable created with ID:', movimiento.id);

                return updatedComision;
            });

            // Recalcular y actualizar el saldo de la caja después de la transacción
            const cajaPrincipal = await this.prisma.Caja.findFirst({
                where: {
                    OR: [
                        { nombre: { equals: 'Caja', mode: 'insensitive' } },
                        { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                        { tipo: 'general' }
                    ],
                    activa: true
                }
            });

            if (cajaPrincipal) {
                console.log('[Commission Service] Recalculating caja balance for ID:', cajaPrincipal.id);
                console.log('[Commission Service] Caja balance before:', cajaPrincipal.saldoActual);
                
                try {
                    const nuevoSaldo = await CajaService.recalculateAndUpdateSaldo(cajaPrincipal.id);
                    console.log('[Commission Service] Caja balance after recalculation:', nuevoSaldo);
                } catch (cajaError) {
                    console.error('[Commission Service] Error recalculating caja balance:', cajaError);
                    // No lanzar error aquí, solo log, ya que la comisión se pagó correctamente
                }
            }

            return result;
        } catch (error) {
            console.error('Error in markAsPaid:', error);
            throw error;
        }
    }

    async deleteCommission(id) {
        try {
            return await this.prisma.Comision.delete({
                where: { id: parseInt(id) }
            });
        } catch (error) {
            console.error('Error in deleteCommission:', error);
            throw error;
        }
    }

    async getEmployeeCommissions(empleadoId, year, month) {
        try {
            const where = {
                empleadoId: parseInt(empleadoId)
            };

            if (year) {
                where.periodoAno = parseInt(year);
            }
            if (month) {
                where.periodoMes = parseInt(month);
            }

            return await this.prisma.Comision.findMany({
                where,
                include: {
                    tipoComision: {
                        select: { id: true, nombreTipo: true, porcentajeBase: true }
                    }
                },
                orderBy: [
                    { periodoAno: 'desc' },
                    { periodoMes: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
        } catch (error) {
            console.error('Error in getEmployeeCommissions:', error);
            throw error;
        }
    }

    async getStatistics(year, month) {
        try {
            const where = {};

            if (year) {
                where.periodoAno = parseInt(year);
            }
            if (month) {
                where.periodoMes = parseInt(month);
            }

            const commissions = await this.prisma.Comision.findMany({
                where
            });

            const stats = {
                total: commissions.length,
                totalPendiente: 0,
                totalPagado: 0,
                montoPendiente: 0,
                montoPagado: 0,
                montoCancelado: 0
            };

            commissions.forEach(c => {
                const monto = parseFloat(c.montoComision);
                if (c.estado === 'PENDIENTE') {
                    stats.totalPendiente++;
                    stats.montoPendiente += monto;
                } else if (c.estado === 'PAGADO') {
                    stats.totalPagado++;
                    stats.montoPagado += monto;
                } else if (c.estado === 'CANCELADO') {
                    stats.montoCancelado += monto;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error in getStatistics:', error);
            throw error;
        }
    }
}

const commissionService = new CommissionService();

module.exports = {
    getCommissionTypes: (...args) => commissionService.getCommissionTypes(...args),
    createCommissionType: (...args) => commissionService.createCommissionType(...args),
    updateCommissionType: (...args) => commissionService.updateCommissionType(...args),
    deleteCommissionType: (...args) => commissionService.deleteCommissionType(...args),
    getCommissions: (...args) => commissionService.getCommissions(...args),
    getCommissionById: (...args) => commissionService.getCommissionById(...args),
    calculateCommission: (...args) => commissionService.calculateCommission(...args),
    createCommission: (...args) => commissionService.createCommission(...args),
    updateCommission: (...args) => commissionService.updateCommission(...args),
    markAsPaid: (...args) => commissionService.markAsPaid(...args),
    deleteCommission: (...args) => commissionService.deleteCommission(...args),
    getEmployeeCommissions: (...args) => commissionService.getEmployeeCommissions(...args),
    getStatistics: (...args) => commissionService.getStatistics(...args)
};
