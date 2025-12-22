const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const movimientoContableService = require('./movimientoContableService');

class FacturaService {
    // Generar número de factura automático
    async generarNumeroFactura() {
        const año = new Date().getFullYear();

        // Obtener la última factura del año
        const ultimaFactura = await prisma.facturaCliente.findFirst({
            where: {
                numeroFactura: {
                    startsWith: `FAC-${año}-`
                }
            },
            orderBy: {
                numeroFactura: 'desc'
            }
        });

        let numeroSecuencial = 1;
        if (ultimaFactura) {
            const partes = ultimaFactura.numeroFactura.split('-');
            numeroSecuencial = parseInt(partes[2]) + 1;
        }

        return `FAC-${año}-${numeroSecuencial.toString().padStart(5, '0')}`;
    }

    // Calcular próxima fecha de facturación basada en día de facturación
    calcularFechaFacturacion(diaFacturacion) {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = hoy.getMonth();

        // Crear fecha con el día de facturación del mes actual
        let fechaFactura = new Date(año, mes, diaFacturacion);

        // Si ya pasó el día de facturación este mes, usar el próximo mes
        if (fechaFactura < hoy) {
            fechaFactura = new Date(año, mes + 1, diaFacturacion);
        }

        return fechaFactura;
    }

    // Calcular fecha de vencimiento (+5 días)
    calcularFechaVencimiento(fechaFactura) {
        const fecha = new Date(fechaFactura);
        fecha.setDate(fecha.getDate() + 5);
        return fecha;
    }

    // Calcular período facturado (30 días)
    calcularPeriodoFacturado(fechaFactura) {
        const inicio = new Date(fechaFactura);
        const fin = new Date(fechaFactura);
        fin.setDate(fin.getDate() + 30);

        return {
            inicio,
            fin
        };
    }

    // Obtener suscripciones activas de un cliente
    async obtenerSuscripcionesCliente(clienteId) {
        try {
            // Validar que el clienteId sea un UUID válido
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(clienteId)) {
                console.error('Invalid clienteId UUID:', clienteId);
                return [];
            }

            const suscripciones = await prisma.suscripcion.findMany({
                where: {
                    clienteId,
                    estado: 'activo'
                },
                include: {
                    servicio: {
                        select: {
                            id: true,
                            nombre: true
                        }
                    },
                    plan: {
                        select: {
                            id: true,
                            nombre: true
                        }
                    }
                }
            });

            return suscripciones;
        } catch (error) {
            console.error('Error al obtener suscripciones del cliente:', error);
            throw error;
        }
    }

    // Crear factura (método principal que usa la UI)
    async crearFactura(data) {
        const { clienteId, detalles, itbis = 0, formaPago, cajaId, cuentaBancariaId, observaciones = '', pagarInmediatamente = false, usuarioId } = data;

        try {
            // Generar número de factura
            const numeroFactura = await this.generarNumeroFactura();

            // Calcular fechas (usar fechas actuales para facturas manuales)
            const fechaFactura = new Date();
            const fechaVencimiento = this.calcularFechaVencimiento(fechaFactura);

            // Calcular totales
            const subtotal = detalles.reduce((sum, d) => sum + parseFloat(d.subtotal || 0), 0);
            const descuentoTotal = detalles.reduce((sum, d) => sum + parseFloat(d.descuento || 0), 0);
            const itbisCalculado = parseFloat(itbis) || 0;
            const total = subtotal - descuentoTotal + itbisCalculado;

            // Crear factura con detalles
            const factura = await prisma.facturaCliente.create({
                data: {
                    numeroFactura,
                    clienteId,
                    tipoFactura: 'servicio',
                    fechaFactura,
                    fechaVencimiento,
                    subtotal,
                    descuento: descuentoTotal,
                    itbis: itbisCalculado,
                    total,
                    estado: pagarInmediatamente ? 'pagada' : 'pendiente',
                    formaPago,
                    observaciones,
                    facturadaPorId: usuarioId,
                    detalles: {
                        create: detalles.map((detalle, index) => ({
                            concepto: detalle.concepto,
                            cantidad: parseFloat(detalle.cantidad || 1),
                            precioUnitario: parseFloat(detalle.precioUnitario || 0),
                            subtotal: parseFloat(detalle.subtotal || 0),
                            descuento: parseFloat(detalle.descuento || 0),
                            impuesto: parseFloat(detalle.impuesto || 0),
                            total: parseFloat(detalle.total || 0),
                            servicioId: detalle.servicioId,
                            productoId: detalle.productoId,
                            orden: index + 1
                        }))
                    }
                },
                include: {
                    detalles: true,
                    cliente: {
                        select: {
                            nombre: true,
                            apellidos: true,
                            codigoCliente: true,
                            telefono: true,
                            email: true
                        }
                    }
                }
            });

            // Si no se paga inmediatamente, crear cuenta por cobrar
            if (!pagarInmediatamente) {
                await prisma.cuentaPorCobrar.create({
                    data: {
                        facturaId: factura.id,
                        clienteId,
                        numeroDocumento: numeroFactura,
                        fechaEmision: fechaFactura,
                        fechaVencimiento,
                        montoOriginal: total,
                        montoPendiente: total,
                        estado: 'pendiente'
                    }
                });
            } else if (pagarInmediatamente && formaPago) {
                // Crear pago automático
                const numeroPago = await this.generarNumeroPago();

                // Resolver caja si es efectivo y no se proporcionó
                let cajaIdFinal = cajaId;
                const metodoNormalizado = formaPago.toLowerCase().trim();
                if ((metodoNormalizado === 'efectivo' || metodoNormalizado === 'caja') && !cajaIdFinal) {
                    const cajaPrincipal = await this.obtenerCajaPrincipalDefault();
                    if (cajaPrincipal) {
                        cajaIdFinal = cajaPrincipal.id;
                    }
                }

                const pago = await prisma.pagoCliente.create({
                    data: {
                        facturaId: factura.id,
                        clienteId,
                        numeroPago,
                        fechaPago: new Date(),
                        monto: total,
                        metodoPago: formaPago,
                        cuentaBancariaId,
                        cajaId: cajaIdFinal,
                        estado: 'confirmado',
                        recibidoPorId: usuarioId
                    }
                });

                // Crear movimiento contable
                try {
                    const categoria = await this.obtenerCategoriaIngresoDefault();
                    if (categoria) {
                        const metodoMovimiento = (metodoNormalizado === 'efectivo' || metodoNormalizado === 'caja') ? 'caja' : 'banco';

                        await movimientoContableService.createMovimiento({
                            tipo: 'ingreso',
                            monto: total,
                            categoriaId: categoria.id,
                            metodo: metodoMovimiento,
                            cajaId: cajaIdFinal || undefined,
                            bankId: undefined,
                            cuentaBancariaId: cuentaBancariaId || undefined,
                            descripcion: `Pago Factura #${numeroFactura} - ${formaPago}`,
                            usuarioId
                        });
                    }
                } catch (error) {
                    console.error('Error al crear movimiento contable automático:', error);
                    // No fallar la creación de factura si falla el movimiento contable
                }
            }

            return factura;
        } catch (error) {
            console.error('Error al crear factura:', error);
            throw error;
        }
    }

    async crearFacturaAutomatica(clienteId, detalles, itbis, pagarInmediatamente = false, formaPago = null, observaciones = '', usuarioId = null, cajaId = null, cuentaBancariaId = null) {
        try {
            const suscripciones = await this.obtenerSuscripcionesCliente(clienteId);

            if (suscripciones.length === 0) {
                throw new Error('El cliente no tiene suscripciones activas');
            }

            // Usar el día de facturación de la primera suscripción
            const diaFacturacion = suscripciones[0].diaFacturacion;

            // Calcular fechas
            const fechaFactura = this.calcularFechaFacturacion(diaFacturacion);
            const fechaVencimiento = this.calcularFechaVencimiento(fechaFactura);
            const periodo = this.calcularPeriodoFacturado(fechaFactura);

            // Generar número de factura
            const numeroFactura = await this.generarNumeroFactura();

            // Calcular totales
            const subtotal = detalles.reduce((sum, d) => sum + parseFloat(d.total), 0);
            const descuentoTotal = detalles.reduce((sum, d) => sum + parseFloat(d.descuento || 0), 0);
            const total = subtotal - descuentoTotal + parseFloat(itbis);

            // Crear factura con detalles
            const factura = await prisma.facturaCliente.create({
                data: {
                    numeroFactura,
                    clienteId,
                    // contratoId: suscripciones[0].id, // Usar primera suscripción como contrato
                    tipoFactura: 'servicio',
                    fechaFactura,
                    fechaVencimiento,
                    periodoFacturadoInicio: periodo.inicio,
                    periodoFacturadoFin: periodo.fin,
                    subtotal,
                    descuento: descuentoTotal,
                    itbis: parseFloat(itbis),
                    total,
                    estado: pagarInmediatamente ? 'pagada' : 'pendiente',
                    formaPago,
                    observaciones,
                    facturadaPorId: usuarioId,
                    detalles: {
                        create: detalles.map((detalle, index) => ({
                            concepto: detalle.concepto,
                            cantidad: parseFloat(detalle.cantidad),
                            precioUnitario: parseFloat(detalle.precioUnitario),
                            subtotal: parseFloat(detalle.subtotal),
                            descuento: parseFloat(detalle.descuento || 0),
                            impuesto: parseFloat(detalle.impuesto || 0),
                            total: parseFloat(detalle.total),
                            servicioId: detalle.servicioId,
                            productoId: detalle.productoId,
                            orden: index + 1
                        }))
                    }
                },
                include: {
                    detalles: true,
                    cliente: {
                        select: {
                            nombre: true,
                            apellidos: true,
                            codigoCliente: true,
                            telefono: true,
                            email: true
                        }
                    }
                }
            });

            // Si no se paga inmediatamente, crear cuenta por cobrar
            // Si no se paga inmediatamente, crear cuenta por cobrar
            if (!pagarInmediatamente) {
                await prisma.cuentaPorCobrar.create({
                    data: {
                        facturaId: factura.id,
                        clienteId,
                        numeroDocumento: numeroFactura,
                        fechaEmision: fechaFactura,
                        fechaVencimiento,
                        montoOriginal: total,
                        montoPendiente: total,
                        estado: 'pendiente'
                    }
                });
            } else {
                // Crear pago automático
                const numeroPago = await this.generarNumeroPago();

                // Resolver caja si es efectivo y no se proporcionó
                let cajaIdFinal = cajaId;
                const metodoNormalizado = formaPago.toLowerCase().trim();
                if ((metodoNormalizado === 'efectivo' || metodoNormalizado === 'caja') && !cajaIdFinal) {
                    const cajaPrincipal = await this.obtenerCajaPrincipalDefault();
                    if (cajaPrincipal) {
                        cajaIdFinal = cajaPrincipal.id;
                    }
                }

                const pago = await prisma.pagoCliente.create({
                    data: {
                        facturaId: factura.id,
                        clienteId,
                        numeroPago,
                        fechaPago: new Date(),
                        monto: total,
                        metodoPago: formaPago,
                        cuentaBancariaId,
                        cajaId: cajaIdFinal,
                        estado: 'confirmado',
                        recibidoPorId: usuarioId
                    }
                });

                // Crear movimiento contable
                try {
                    const categoria = await this.obtenerCategoriaIngresoDefault();
                    if (categoria) {
                        const metodoMovimiento = (metodoNormalizado === 'efectivo' || metodoNormalizado === 'caja') ? 'caja' : 'banco';

                        await movimientoContableService.createMovimiento({
                            tipo: 'ingreso',
                            monto: total,
                            categoriaId: categoria.id,
                            metodo: metodoMovimiento,
                            cajaId: cajaIdFinal || undefined,
                            bankId: undefined, // Se podría derivar de cuentaBancariaId si fuera necesario
                            cuentaBancariaId: cuentaBancariaId || undefined,
                            descripcion: `Pago Factura #${numeroFactura} - ${formaPago}`,
                            usuarioId
                        });
                    }
                } catch (error) {
                    console.error('Error al crear movimiento contable automático:', error);
                    // No fallar la creación de factura si falla el movimiento contable, pero loguear
                }
            }

            return factura;
        } catch (error) {
            console.error('Error al crear factura automática:', error);
            throw error;
        }
    }

    // Helper para obtener categoría de ingreso por defecto
    async obtenerCategoriaIngresoDefault() {
        let categoria = await prisma.categoriaCuenta.findFirst({
            where: {
                OR: [
                    { nombre: { contains: 'Servicios', mode: 'insensitive' } },
                    { nombre: { contains: 'Ventas', mode: 'insensitive' } },
                    { nombre: { contains: 'Ingresos', mode: 'insensitive' } }
                ],
                tipo: 'ingreso'
            }
        });

        if (!categoria) {
            categoria = await prisma.categoriaCuenta.findFirst({
                where: { tipo: 'ingreso' }
            });
        }

        return categoria;
    }

    // Helper para obtener Caja Principal por defecto
    async obtenerCajaPrincipalDefault() {
        let caja = await prisma.caja.findFirst({
            where: {
                OR: [
                    { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                    { tipo: 'general' }
                ],
                activa: true
            }
        });
        return caja;
    }

    // Generar número de pago
    async generarNumeroPago() {
        const año = new Date().getFullYear();

        const ultimoPago = await prisma.pagoCliente.findFirst({
            where: {
                numeroPago: {
                    startsWith: `PAG-${año}-`
                }
            },
            orderBy: {
                numeroPago: 'desc'
            }
        });

        let numeroSecuencial = 1;
        if (ultimoPago) {
            const partes = ultimoPago.numeroPago.split('-');
            numeroSecuencial = parseInt(partes[2]) + 1;
        }

        return `PAG-${año}-${numeroSecuencial.toString().padStart(5, '0')}`;
    }

    // Obtener todas las facturas con filtros
    async obtenerFacturas(filtros = {}) {
        const { estado, clienteId, fechaDesde, fechaHasta, page = 1, limit = 50 } = filtros;

        const where = {};

        if (estado) where.estado = estado;
        if (clienteId) where.clienteId = clienteId;
        if (fechaDesde || fechaHasta) {
            where.fechaFactura = {};
            if (fechaDesde) where.fechaFactura.gte = new Date(fechaDesde);
            if (fechaHasta) where.fechaFactura.lte = new Date(fechaHasta);
        }

        const [facturas, total] = await Promise.all([
            prisma.facturaCliente.findMany({
                where,
                include: {
                    cliente: {
                        select: {
                            nombre: true,
                            apellidos: true,
                            codigoCliente: true,
                            telefono: true
                        }
                    },
                    detalles: true,
                    pagos: {
                        include: {
                            cuentaBancaria: {
                                include: {
                                    bank: true
                                }
                            },
                            caja: true
                        }
                    },
                    cuentasPorCobrar: true
                },
                orderBy: {
                    fechaFactura: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.facturaCliente.count({ where })
        ]);

        return {
            facturas,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    // Obtener factura por ID
    async obtenerFacturaPorId(id) {
        return await prisma.facturaCliente.findUnique({
            where: { id },
            include: {
                cliente: {
                    select: {
                        nombre: true,
                        apellidos: true,
                        codigoCliente: true,
                        telefono: true,
                        email: true,
                        direccion: true
                    }
                },
                detalles: {
                    include: {
                        servicio: true,
                        producto: true
                    }
                },
                pagos: {
                    include: {
                        cuentaBancaria: {
                            include: {
                                bank: true
                            }
                        },
                        caja: true
                    }
                },
                cuentasPorCobrar: true,
                facturadaPor: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    }

    // Actualizar factura
    async actualizarFactura(id, datos) {
        const { clienteId, fechaFactura, fechaVencimiento, periodoFacturadoInicio, periodoFacturadoFin, itbis, observaciones, detalles } = datos;

        // Verificar que la factura existe
        const facturaExistente = await prisma.facturaCliente.findUnique({
            where: { id }
        });

        if (!facturaExistente) {
            throw new Error('Factura no encontrada');
        }

        // Calcular totales
        let subtotal = 0;
        let descuentoTotal = 0;

        detalles.forEach(detalle => {
            subtotal += parseFloat(detalle.subtotal);
            descuentoTotal += parseFloat(detalle.descuento || 0);
        });

        const itbisCalculado = subtotal * (parseFloat(itbis) / 100);
        const total = subtotal - descuentoTotal + itbisCalculado;

        // Actualizar factura
        const facturaActualizada = await prisma.facturaCliente.update({
            where: { id },
            data: {
                clienteId,
                fechaFactura: new Date(fechaFactura),
                fechaVencimiento: new Date(fechaVencimiento),
                periodoFacturadoInicio: periodoFacturadoInicio ? new Date(periodoFacturadoInicio) : null,
                periodoFacturadoFin: periodoFacturadoFin ? new Date(periodoFacturadoFin) : null,
                subtotal,
                descuento: descuentoTotal,
                itbis: itbisCalculado,
                total,
                observaciones
            }
        });

        // Eliminar detalles antiguos
        await prisma.detalleFacturaCliente.deleteMany({
            where: { facturaId: id }
        });

        // Crear nuevos detalles
        for (const detalle of detalles) {
            await prisma.detalleFacturaCliente.create({
                data: {
                    facturaId: id,
                    concepto: detalle.concepto,
                    cantidad: parseFloat(detalle.cantidad),
                    precioUnitario: parseFloat(detalle.precioUnitario),
                    subtotal: parseFloat(detalle.subtotal),
                    descuento: parseFloat(detalle.descuento || 0),
                    impuesto: 0,
                    total: parseFloat(detalle.total),
                    servicioId: detalle.servicioId
                }
            });
        }

        // Actualizar cuenta por cobrar si existe
        const cuentaPorCobrar = await prisma.cuentaPorCobrar.findFirst({
            where: { facturaId: id }
        });

        if (cuentaPorCobrar) {
            await prisma.cuentaPorCobrar.update({
                where: { id: cuentaPorCobrar.id },
                data: {
                    montoOriginal: total,
                    fechaVencimiento: new Date(fechaVencimiento)
                }
            });
        }

        return facturaActualizada;
    }

    // Pagar factura
    async pagarFactura(facturaId, data) {
        const { monto, descuento, metodoPago, cuentaBancariaId, cajaId, usuarioId, observaciones } = data;

        const factura = await prisma.facturaCliente.findUnique({
            where: { id: facturaId },
            include: {
                cuentasPorCobrar: true
            }
        });

        if (!factura) {
            throw new Error('Factura no encontrada');
        }

        if (factura.estado === 'pagada') {
            throw new Error('La factura ya está pagada');
        }

        if (factura.estado === 'anulada') {
            throw new Error('No se puede pagar una factura anulada');
        }

        // Generar número de pago
        const numeroPago = await this.generarNumeroPago();

        // Resolver caja si es efectivo y no se proporcionó
        let cajaIdFinal = cajaId;
        const metodoNormalizado = metodoPago.toLowerCase().trim();
        if ((metodoNormalizado === 'efectivo' || metodoNormalizado === 'caja') && !cajaIdFinal) {
            const cajaPrincipal = await this.obtenerCajaPrincipalDefault();
            if (cajaPrincipal) {
                cajaIdFinal = cajaPrincipal.id;
            }
        }

        // Crear fecha de pago en zona horaria local (América/Santo_Domingo)
        const now = new Date();
        const fechaPagoLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        
        // Preparar descuento
        const descuentoFinal = parseFloat(descuento || 0);
        
        // Crear pago
        const pago = await prisma.pagoCliente.create({
            data: {
                facturaId,
                clienteId: factura.clienteId,
                numeroPago,
                fechaPago: fechaPagoLocal,
                monto: parseFloat(monto),
                descuento: descuentoFinal,
                metodoPago,
                cuentaBancariaId: cuentaBancariaId && cuentaBancariaId !== '' ? cuentaBancariaId : undefined,
                cajaId: cajaIdFinal && cajaIdFinal !== '' ? cajaIdFinal : undefined,
                estado: 'confirmado',
                observaciones,
                recibidoPorId: usuarioId
            }
        });

        // Crear movimiento contable
        try {
            const categoria = await this.obtenerCategoriaIngresoDefault();
            if (categoria) {
                // Determinar método para movimiento contable
                let metodoMovimiento = 'caja';
                if (metodoNormalizado === 'transferencia' || metodoNormalizado === 'cheque' || metodoNormalizado === 'tarjeta' || metodoNormalizado === 'banco') {
                    metodoMovimiento = 'banco';
                }

                await movimientoContableService.createMovimiento({
                    tipo: 'ingreso',
                    monto: parseFloat(monto),
                    categoriaId: categoria.id,
                    metodo: metodoMovimiento,
                    cajaId: cajaIdFinal && cajaIdFinal !== '' ? cajaIdFinal : undefined,
                    bankId: undefined,
                    cuentaBancariaId: cuentaBancariaId && cuentaBancariaId !== '' ? cuentaBancariaId : undefined,
                    descripcion: `Pago Factura #${factura.numeroFactura} - ${metodoPago} - ${observaciones || ''}`,
                    usuarioId
                });
            }
        } catch (error) {
            console.error('Error al crear movimiento contable para pago:', error);
        }

        // Calcular total pagado
        const totalPagado = await prisma.pagoCliente.aggregate({
            where: {
                facturaId,
                estado: 'confirmado'
            },
            _sum: {
                monto: true
            }
        });

        const montoPagado = totalPagado._sum.monto || 0;

        // Actualizar estado de factura
        let nuevoEstado = factura.estado;
        if (montoPagado >= factura.total) {
            nuevoEstado = 'pagada';
        } else if (montoPagado > 0) {
            nuevoEstado = 'parcial';
        }

        await prisma.facturaCliente.update({
            where: { id: facturaId },
            data: { estado: nuevoEstado }
        });

        // Actualizar cuenta por cobrar
        if (factura.cuentasPorCobrar.length > 0) {
            const cuentaPorCobrar = factura.cuentasPorCobrar[0];
            const montoPendiente = Math.max(0, factura.total - montoPagado);

            await prisma.cuentaPorCobrar.update({
                where: { id: cuentaPorCobrar.id },
                data: {
                    montoPendiente,
                    estado: montoPendiente === 0 ? 'pagada' : 'pendiente'
                }
            });
        }

        return pago;
    }

    // Anular factura
    async anularFactura(facturaId, usuarioId, motivo) {
        const factura = await prisma.facturaCliente.findUnique({
            where: { id: facturaId },
            include: {
                pagos: true
            }
        });

        if (!factura) {
            throw new Error('Factura no encontrada');
        }

        if (factura.estado === 'anulada') {
            throw new Error('La factura ya está anulada');
        }

        if (factura.pagos.length > 0) {
            throw new Error('No se puede anular una factura con pagos registrados');
        }

        await prisma.facturaCliente.update({
            where: { id: facturaId },
            data: {
                estado: 'anulada',
                observaciones: `${factura.observaciones || ''}\n\nANULADA: ${motivo}`
            }
        });

        // Anular cuenta por cobrar si existe
        await prisma.cuentaPorCobrar.updateMany({
            where: { facturaId },
            data: { estado: 'anulada' }
        });

        return true;
    }

    // Dashboard - Estadísticas
    async obtenerEstadisticas(filtros = {}) {
        const { año, mes } = filtros;
        const where = {};

        if (año || mes) {
            where.fechaFactura = {};
            if (año && mes) {
                // Primer día del mes a las 00:00:00
                const fechaInicio = new Date(año, mes - 1, 1);
                // Primer día del mes siguiente a las 00:00:00 (no inclusive)
                const fechaFin = new Date(año, mes, 1);
                where.fechaFactura.gte = fechaInicio;
                where.fechaFactura.lte = fechaFin;
            } else if (año) {
                const fechaInicio = new Date(año, 0, 1);
                const fechaFin = new Date(año + 1, 0, 1);
                where.fechaFactura.gte = fechaInicio;
                where.fechaFactura.lte = fechaFin;
            }
        }

        const [
            totalFacturas,
            facturasPendientes,
            facturasPagadas,
            facturasAnuladas,
            facturasParciales,
            totalPendiente,
            totalPagado
        ] = await Promise.all([
            prisma.facturaCliente.count({ where }),
            prisma.facturaCliente.count({ where: { ...where, estado: 'pendiente' } }),
            prisma.facturaCliente.count({ where: { ...where, estado: 'pagada' } }),
            prisma.facturaCliente.count({ where: { ...where, estado: 'anulada' } }),
            prisma.facturaCliente.count({ where: { ...where, estado: 'parcial' } }),
            prisma.facturaCliente.aggregate({
                where: { ...where, estado: 'pendiente' },
                _sum: { total: true }
            }),
            prisma.pagoCliente.aggregate({
                where: {
                    ...(where.fechaFactura ? {
                        factura: {
                            fechaFactura: where.fechaFactura
                        }
                    } : {}),
                    estado: 'confirmado'
                },
                _sum: { monto: true }
            })
        ]);

        return {
            totalFacturas,
            facturasPendientes,
            facturasPagadas,
            facturasAnuladas,
            facturasParciales,
            totalFacturado: totalPagado._sum.monto || 0,
            totalPendiente: totalPendiente._sum.total || 0,
            totalPagado: totalPagado._sum.monto || 0
        };
    }

    // Obtener pagos por mes
    async obtenerPagosPorMes(anio) {
        const pagos = await prisma.pagoCliente.findMany({
            where: {
                fechaPago: {
                    gte: new Date(anio, 0, 1),
                    lte: new Date(anio, 11, 31)
                },
                estado: 'confirmado'
            },
            include: {
                factura: {
                    select: {
                        numeroFactura: true
                    }
                },
                cliente: {
                    select: {
                        nombre: true,
                        apellidos: true,
                        codigoCliente: true
                    }
                },
                cuentaBancaria: {
                    include: {
                        bank: true
                    }
                },
                caja: true
            },
            orderBy: {
                fechaPago: 'desc'
            }
        });

        // Agrupar por mes con desglose por método de pago
        const pagosPorMes = {};
        for (let i = 0; i < 12; i++) {
            pagosPorMes[i + 1] = {
                mes: i + 1,
                nombreMes: new Date(anio, i, 1).toLocaleString('es', { month: 'long' }),
                pagos: [],
                total: 0,
                totalBanco: 0,
                totalCaja: 0
            };
        }

        pagos.forEach(pago => {
            const mes = new Date(pago.fechaPago).getMonth() + 1;
            const monto = parseFloat(pago.monto);
            
            pagosPorMes[mes].pagos.push(pago);
            pagosPorMes[mes].total += monto;
            
            // Clasificar por método de pago
            if (pago.cuentaBancaria) {
                pagosPorMes[mes].totalBanco += monto;
            } else if (pago.caja) {
                pagosPorMes[mes].totalCaja += monto;
            } else {
                // Si no tiene método específico, asumimos caja por defecto
                pagosPorMes[mes].totalCaja += monto;
            }
        });

        return Object.values(pagosPorMes);
    }
    // Reactivar factura anulada
    async reactivarFactura(id, usuarioId) {
        const factura = await prisma.facturaCliente.findUnique({
            where: { id }
        });

        if (!factura) {
            throw new Error('Factura no encontrada');
        }

        if (factura.estado !== 'anulada') {
            throw new Error('Solo se pueden reactivar facturas anuladas');
        }

        await prisma.facturaCliente.update({
            where: { id },
            data: {
                estado: 'pendiente',
                observaciones: `${factura.observaciones || ''}\n\nREACTIVADA por usuario ${usuarioId} el ${new Date().toLocaleString('es-DO')}`
            }
        });

        // Reactivar cuenta por cobrar si existe
        await prisma.cuentaPorCobrar.updateMany({
            where: { facturaId: id },
            data: { estado: 'pendiente' }
        });

        return true;
    }

    // Eliminar factura
    async eliminarFactura(id) {
        const factura = await prisma.facturaCliente.findUnique({
            where: { id },
            include: { pagos: true }
        });

        if (!factura) {
            throw new Error('Factura no encontrada');
        }

        if (factura.pagos.length > 0) {
            throw new Error('No se puede eliminar una factura con pagos. Debe anularla en su lugar.');
        }

        // Eliminar en orden para respetar FKs
        await prisma.detalleFacturaCliente.deleteMany({ where: { facturaId: id } });
        await prisma.cuentaPorCobrar.deleteMany({ where: { facturaId: id } });
        await prisma.facturaCliente.delete({ where: { id } });

        return true;
    }

    // Eliminar múltiples facturas
    async eliminarFacturas(ids) {
        const resultados = {
            eliminadas: 0,
            errores: []
        };

        for (const id of ids) {
            try {
                await this.eliminarFactura(id);
                resultados.eliminadas++;
            } catch (error) {
                resultados.errores.push({ id, error: error.message });
            }
        }

        return resultados;
    }
}

module.exports = new FacturaService();
