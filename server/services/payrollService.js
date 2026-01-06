const PrismaRetry = require('../prismaRetry');
const { CajaService } = require('./cajaService');
const prisma = new PrismaRetry();

class PayrollService {
    // --- Periodos de Nomina ---
    static async getAllPeriods() {
        return prisma.periodoNomina.findMany({
            orderBy: { fechaInicio: 'desc' },
            include: {
                _count: {
                    select: { nominas: true }
                }
            }
        });
    }

    static async getPeriodById(id) {
        return prisma.periodoNomina.findUnique({
            where: { id: BigInt(id) },
            include: {
                nominas: {
                    include: {
                        empleado: {
                            include: {
                                cargo: true,
                                departamento: true
                            }
                        }
                    },
                    orderBy: { empleado: { apellidos: 'asc' } }
                }
            }
        });
    }

    static async createPeriod(data) {
        return prisma.periodoNomina.create({
            data: {
                ...data,
                fechaInicio: new Date(data.fechaInicio),
                fechaFin: new Date(data.fechaFin),
                fechaPago: new Date(data.fechaPago),
            }
        });
    }

    static async updatePeriod(id, data) {
        const updateData = { ...data };
        if (data.fechaInicio) updateData.fechaInicio = new Date(data.fechaInicio);
        if (data.fechaFin) updateData.fechaFin = new Date(data.fechaFin);
        if (data.fechaPago) updateData.fechaPago = new Date(data.fechaPago);

        return prisma.periodoNomina.update({
            where: { id: BigInt(id) },
            data: updateData
        });
    }

    static async deletePeriod(id) {
        return prisma.periodoNomina.delete({
            where: { id: BigInt(id) }
        });
    }

    static async getPayrollHistoryStats() {
        // 1. Group by period and sum amounts
        const aggregations = await prisma.nomina.groupBy({
            by: ['periodoId'],
            _sum: {
                salarioNeto: true,
                comisiones: true
            },
            orderBy: {
                periodoId: 'asc'
            },
            take: 12 // Last 12 periods
        });

        // 2. Fetch period details for labels
        const periodIds = aggregations.map(a => a.periodoId);
        const periods = await prisma.periodoNomina.findMany({
            where: {
                id: { in: periodIds }
            },
            select: {
                id: true,
                mes: true,
                ano: true,
                fechaInicio: true
            }
        });

        // 3. Merge data
        return aggregations.map(agg => {
            const period = periods.find(p => p.id === agg.periodoId);
            return {
                periodoId: agg.periodoId.toString(),
                mes: period ? period.mes : 0,
                ano: period ? period.ano : 0,
                fechaInicio: period ? period.fechaInicio : null,
                totalNomina: agg._sum.salarioNeto || 0,
                totalComisiones: agg._sum.comisiones || 0
            };
        }).sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
    }

    // --- Nomina (Detalle por empleado) ---
    static async getPayrollsByPeriod(periodoId) {
        return prisma.nomina.findMany({
            where: { periodoId: BigInt(periodoId) },
            include: {
                empleado: {
                    include: {
                        cargo: true,
                        departamento: true
                    }
                },
                periodo: true
            },
            orderBy: { empleado: { apellidos: 'asc' } }
        });
    }

    static async getPayrollById(id) {
        return prisma.nomina.findUnique({
            where: { id: BigInt(id) },
            include: {
                empleado: {
                    include: {
                        cargo: true,
                        departamento: true
                    }
                },
                periodo: true,
                nominaPrestamos: {
                    include: {
                        prestamo: true
                    }
                },
                nominaComisiones: {
                    include: {
                        comision: true
                    }
                }
            }
        });
    }

    static async getPayrollByEmployee(empleadoId) {
        return prisma.nomina.findMany({
            where: { empleadoId: BigInt(empleadoId) },
            include: {
                periodo: true
            },
            orderBy: { periodo: { fechaInicio: 'desc' } }
        });
    }

    static async createPayrollRecord(data) {
        const parseFloatSafe = (val) => val ? parseFloat(val) : 0;
        const parseIntSafe = (val) => val ? parseInt(val) : 0;

        return prisma.nomina.create({
            data: {
                periodoId: BigInt(data.periodoId),
                empleadoId: BigInt(data.empleadoId),
                diasTrabajados: parseIntSafe(data.diasTrabajados),
                horasTrabajadas: data.horasTrabajadas ? parseFloatSafe(data.horasTrabajadas) : null,
                salarioBase: parseFloatSafe(data.salarioBase),
                horasExtrasOrdinarias: parseFloatSafe(data.horasExtrasOrdinarias),
                horasExtrasNocturnas: parseFloatSafe(data.horasExtrasNocturnas),
                horasExtrasFeriados: parseFloatSafe(data.horasExtrasFeriados),
                bonificaciones: parseFloatSafe(data.bonificaciones),
                comisiones: parseFloatSafe(data.comisiones),
                viaticos: parseFloatSafe(data.viaticos),
                subsidios: parseFloatSafe(data.subsidios),
                retroactivos: parseFloatSafe(data.retroactivos),
                vacacionesPagadas: parseFloatSafe(data.vacacionesPagadas),
                otrosIngresos: parseFloatSafe(data.otrosIngresos),
                seguridadSocial: parseFloatSafe(data.seguridadSocial),
                seguroSalud: parseFloatSafe(data.seguroSalud),
                isr: parseFloatSafe(data.isr),
                prestamos: parseFloatSafe(data.prestamos),
                adelantos: parseFloatSafe(data.adelantos),
                faltas: parseFloatSafe(data.faltas),
                tardanzas: parseFloatSafe(data.tardanzas),
                otrasDeducciones: parseFloatSafe(data.otrasDeducciones),
                totalIngresos: parseFloatSafe(data.totalIngresos),
                totalDeducciones: parseFloatSafe(data.totalDeducciones),
                salarioNeto: parseFloatSafe(data.salarioNeto),
                formaPago: data.formaPago || null,
                numeroTransaccion: data.numeroTransaccion || null,
                fechaPago: data.fechaPago ? new Date(data.fechaPago) : null,
                estadoPago: data.estadoPago || 'PENDIENTE',
                calculadoPorId: data.calculadoPorId ? BigInt(data.calculadoPorId) : null,
                observaciones: data.observaciones || null
            },
            include: {
                empleado: {
                    include: {
                        cargo: true,
                        departamento: true
                    }
                },
                periodo: true
            }
        });
    }

    static async updatePayrollRecord(id, data) {
        const parseFloatSafe = (val) => val !== undefined ? (val ? parseFloat(val) : 0) : undefined;
        const parseIntSafe = (val) => val !== undefined ? (val ? parseInt(val) : 0) : undefined;

        const updateData = {};
        if (data.diasTrabajados !== undefined) updateData.diasTrabajados = parseIntSafe(data.diasTrabajados);
        if (data.horasTrabajadas !== undefined) updateData.horasTrabajadas = data.horasTrabajadas ? parseFloatSafe(data.horasTrabajadas) : null;
        if (data.salarioBase !== undefined) updateData.salarioBase = parseFloatSafe(data.salarioBase);
        if (data.horasExtrasOrdinarias !== undefined) updateData.horasExtrasOrdinarias = parseFloatSafe(data.horasExtrasOrdinarias);
        if (data.horasExtrasNocturnas !== undefined) updateData.horasExtrasNocturnas = parseFloatSafe(data.horasExtrasNocturnas);
        if (data.horasExtrasFeriados !== undefined) updateData.horasExtrasFeriados = parseFloatSafe(data.horasExtrasFeriados);
        if (data.bonificaciones !== undefined) updateData.bonificaciones = parseFloatSafe(data.bonificaciones);
        if (data.comisiones !== undefined) updateData.comisiones = parseFloatSafe(data.comisiones);
        if (data.viaticos !== undefined) updateData.viaticos = parseFloatSafe(data.viaticos);
        if (data.subsidios !== undefined) updateData.subsidios = parseFloatSafe(data.subsidios);
        if (data.retroactivos !== undefined) updateData.retroactivos = parseFloatSafe(data.retroactivos);
        if (data.vacacionesPagadas !== undefined) updateData.vacacionesPagadas = parseFloatSafe(data.vacacionesPagadas);
        if (data.otrosIngresos !== undefined) updateData.otrosIngresos = parseFloatSafe(data.otrosIngresos);
        if (data.seguridadSocial !== undefined) updateData.seguridadSocial = parseFloatSafe(data.seguridadSocial);
        if (data.seguroSalud !== undefined) updateData.seguroSalud = parseFloatSafe(data.seguroSalud);
        if (data.isr !== undefined) updateData.isr = parseFloatSafe(data.isr);
        if (data.prestamos !== undefined) updateData.prestamos = parseFloatSafe(data.prestamos);
        if (data.adelantos !== undefined) updateData.adelantos = parseFloatSafe(data.adelantos);
        if (data.faltas !== undefined) updateData.faltas = parseFloatSafe(data.faltas);
        if (data.tardanzas !== undefined) updateData.tardanzas = parseFloatSafe(data.tardanzas);
        if (data.otrasDeducciones !== undefined) updateData.otrasDeducciones = parseFloatSafe(data.otrasDeducciones);
        if (data.totalIngresos !== undefined) updateData.totalIngresos = parseFloatSafe(data.totalIngresos);
        if (data.totalDeducciones !== undefined) updateData.totalDeducciones = parseFloatSafe(data.totalDeducciones);
        if (data.salarioNeto !== undefined) updateData.salarioNeto = parseFloatSafe(data.salarioNeto);
        if (data.formaPago !== undefined) updateData.formaPago = data.formaPago;
        if (data.numeroTransaccion !== undefined) updateData.numeroTransaccion = data.numeroTransaccion;
        if (data.fechaPago !== undefined) updateData.fechaPago = data.fechaPago ? new Date(data.fechaPago) : null;
        if (data.estadoPago !== undefined) updateData.estadoPago = data.estadoPago;
        if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

        return prisma.nomina.update({
            where: { id: BigInt(id) },
            data: updateData,
            include: {
                empleado: {
                    include: {
                        cargo: true,
                        departamento: true
                    }
                },
                periodo: true
            }
        });
    }

    static async deletePayrollRecord(id) {
        return prisma.nomina.delete({
            where: { id: BigInt(id) }
        });
    }

    static async updatePaymentStatus(id, status, paymentData = {}, userId = null) {
        // First, get the payroll record to validate amounts
        const payroll = await prisma.nomina.findUnique({
            where: { id: BigInt(id) },
            include: {
                empleado: true
            }
        });

        if (!payroll) {
            throw new Error('Payroll record not found');
        }

        // Usar transacción para garantizar integridad
        return await prisma.$transaction(async (tx) => {
            const updateData = {
                estadoPago: status
            };

            // Handle payment method and amounts
            if (paymentData.formaPago) {
                updateData.formaPago = paymentData.formaPago;

                const montoBanco = parseFloat(paymentData.montoBanco) || 0;
                const montoCaja = parseFloat(paymentData.montoCaja) || 0;

                // Validate split payment amounts
                if (status === 'PAGADO') {
                    const total = montoBanco + montoCaja;
                    const salarioNeto = parseFloat(payroll.salarioNeto);

                    if (Math.abs(total - salarioNeto) > 0.01) { // Allow 1 cent tolerance for rounding
                        throw new Error(`Total payment (${total}) must equal net salary (${salarioNeto})`);
                    }

                    // --- LOGICA DE PAGO Y MOVIMIENTOS ---
                    const categoriaId = await PayrollService._getCategoriaNominaId(tx);
                    const descripcion = `Pago Nómina: ${payroll.empleado.nombres} ${payroll.empleado.apellidos} - Periodo ID: ${payroll.periodoId}`;

                    // Determinar fecha del movimiento: si es hoy (o no viene), usar fecha/hora actual para que salga en reportes de "hoy"
                    // Si viene una fecha distinta, usar esa (probablemente media noche UTC)
                    let fechaMovimiento = new Date();
                    if (paymentData.fechaPago) {
                        const todayStr = new Date().toISOString().split('T')[0];
                        if (paymentData.fechaPago !== todayStr) {
                            fechaMovimiento = new Date(paymentData.fechaPago);
                            // Ajustar a mediodía para evitar problemas de timezone si es una fecha pura
                            if (paymentData.fechaPago.length === 10) {
                                fechaMovimiento.setHours(12, 0, 0, 0);
                            }
                        }
                    }


                    // 1. Pago por CAJA
                    if (montoCaja > 0) {
                        const cajaId = process.env.CAJA_PRINCIPAL_ID || (await tx.caja.findFirst({ where: { nombre: { equals: 'Caja Principal', mode: 'insensitive' } } }))?.id;

                        // Si viene una caja específica en paymentData, usar esa, sino buscar la principal
                        // Asumimos que el frontend podría mandar 'cajaId' en paymentData si soportara múltiples cajas
                        // Por ahora usamos la lógica de caja principal si no se especifica
                        const targetCajaId = paymentData.cajaId || cajaId;

                        if (!targetCajaId) {
                            throw new Error("No se encontró caja para realizar el pago.");
                        }


                        // Crear movimiento de gasto
                        const mov = await tx.movimientoContable.create({
                            data: {
                                tipo: 'gasto',
                                monto: montoCaja,
                                descripcion: descripcion,
                                metodo: 'caja',
                                cajaId: targetCajaId,
                                usuarioId: userId,
                                categoriaId: categoriaId,
                                fecha: fechaMovimiento
                            }
                        });

                        // Actualizar saldo de caja será manejado por CajaService.recalculateAndUpdateSaldo
                        // PERO como estamos dentro de una tx, CajaService usa `prisma` global si no se le pasa tx.
                        // CajaService no está adaptado para recibir tx.
                        // OPCIÓN: Hacer el update manual aquí o llamar a recalculate después de la tx.
                        // Lo mejor es hacer el movimiento aquí y dejar que CajaService recalcule después, 
                        // pero para que el saldo esté bien dentro de la tx si fuera necesario, 
                        // necesitaríamos acceso exclusivo. 
                        // SIMPLIFICACION: Hacemos el movimiento aquí. El recálculo lo haremos FUERA de la tx 
                        // o al final de la tx llamando al servicio si este no usa transacciones internas conflictivas.
                        // CajaService.recalculateAndUpdateSaldo usa `prisma.caja.update`, que es una operación atómica.
                        // Al usar `prisma` global, no ve los cambios de `tx` hasta el commit.
                        // SOLUCIÓN: Hacemos el update manual del saldo en `tx` para consistencia.

                        /* 
                           NOTA: CajaService.calcularSaldoActual suma todos los movimientos.
                           Si creamos el movimiento en `tx`, CajaService (con `prisma` global) NO lo verá hasta commit.
                           Así que no podemos usar CajaService.recalculateAndUpdateSaldo DENTRO de esta tx.
                        */
                    }

                    // 2. Pago por BANCO
                    if (montoBanco > 0) {
                        if (!paymentData.cuentaBancariaId && !payroll.cuentaBancariaId) {
                            throw new Error("Se requiere cuenta bancaria para el pago.");
                        }
                        const cuentaBancariaId = paymentData.cuentaBancariaId || payroll.cuentaBancariaId;

                        const cuentaBancaria = await tx.cuentaBancaria.findUnique({
                            where: { id: cuentaBancariaId }
                        });

                        if (!cuentaBancaria) throw new Error("Cuenta bancaria no encontrada.");

                        // Crear movimiento de gasto
                        await tx.movimientoContable.create({
                            data: {
                                tipo: 'gasto',
                                monto: montoBanco,
                                descripcion: descripcion,
                                metodo: 'banco',
                                cuentaBancariaId: cuentaBancariaId,
                                usuarioId: userId,
                                categoriaId: categoriaId,
                                fecha: fechaMovimiento
                            }
                        });

                        // Actualizar saldo cuenta contable asociada al banco
                        if (cuentaBancaria.cuentaContableId) {
                            await tx.cuentaContable.update({
                                where: { id: cuentaBancaria.cuentaContableId },
                                data: {
                                    saldoActual: {
                                        decrement: montoBanco
                                    }
                                }
                            });
                        }
                    }
                }

                updateData.montoBanco = montoBanco;
                updateData.montoCaja = montoCaja;
            }

            if (paymentData.cuentaBancariaId) {
                updateData.cuentaBancariaId = paymentData.cuentaBancariaId;
            }

            if (paymentData.numeroTransaccion) updateData.numeroTransaccion = paymentData.numeroTransaccion;
            if (paymentData.fechaPago) updateData.fechaPago = new Date(paymentData.fechaPago);

            const updatedPayroll = await tx.nomina.update({
                where: { id: BigInt(id) },
                data: updateData,
                include: {
                    empleado: true, // No incluir periodo completo para evitar payload gigante si no es necesario
                    periodo: true
                }
            });

            return updatedPayroll;
        });

        // FUERA DE LA TRANSACCIÓN: Recalcular saldos de cajas si hubo pago por caja
        // Esto es necesario porque CajaService usa el prisma client global y necesita ver los datos commiteados.
        if (status === 'PAGADO' && parseFloat(paymentData.montoCaja || 0) > 0) {
            // Identificar caja de nuevo (hacky pero seguro)
            const cajaId = paymentData.cajaId || (await prisma.caja.findFirst({ where: { nombre: { equals: 'Caja Principal', mode: 'insensitive' } } }))?.id;
            if (cajaId) {
                console.log('[PayrollService] Recalculando saldo de caja después del pago:', cajaId);
                await CajaService.recalculateAndUpdateSaldo(cajaId);
                // Actualizar también la cuenta contable de la caja
                const caja = await prisma.caja.findUnique({ where: { id: cajaId } });
                if (caja && caja.cuentaContableId) {
                    const nuevoSaldo = await CajaService.calcularSaldoActual(cajaId); // Ya commiteado
                    await prisma.cuentaContable.update({
                        where: { id: caja.cuentaContableId },
                        data: { saldoActual: nuevoSaldo }
                    });
                    console.log('[PayrollService] Saldo actualizado a:', nuevoSaldo);
                }
            }
        }
    }

    /**
     * Helper para obtener o crear categoría 'Nómina'
     */
    static async _getCategoriaNominaId(tx) {
        let categoria = await tx.categoriaCuenta.findFirst({
            where: {
                nombre: 'Nómina',
            },
        });

        if (!categoria) {
            categoria = await tx.categoriaCuenta.create({
                data: {
                    nombre: 'Nómina',
                    codigo: 'NOM-001',
                    tipo: 'gasto', // Asumimos que es un gasto
                    subtipo: 'Operativo',
                    nivel: 1,
                    esDetalle: true,
                    activa: true,
                },
            });
        }

        return categoria.id;
    }


    // Calculate payroll for a single employee
    static calculatePayroll(empleado, periodoData, workData = {}) {
        const salarioBase = workData.salarioBase !== undefined ? parseFloat(workData.salarioBase) : (parseFloat(empleado.salarioBase) || 0);
        const diasTrabajados = workData.diasTrabajados || 30;
        const salarioDiario = salarioBase / 30;

        // Income calculations
        const horasExtrasOrdinarias = parseFloat(workData.horasExtrasOrdinarias) || 0;
        const horasExtrasNocturnas = parseFloat(workData.horasExtrasNocturnas) || 0;
        const horasExtrasFeriados = parseFloat(workData.horasExtrasFeriados) || 0;
        const bonificaciones = parseFloat(workData.bonificaciones) || 0;
        const comisiones = parseFloat(workData.comisiones) || 0;
        const viaticos = parseFloat(workData.viaticos) || 0;
        const subsidios = parseFloat(workData.subsidios) || 0;
        const retroactivos = parseFloat(workData.retroactivos) || 0;
        const vacacionesPagadas = parseFloat(workData.vacacionesPagadas) || 0;
        const otrosIngresos = parseFloat(workData.otrosIngresos) || 0;

        // Calculate total income
        const totalIngresos = salarioBase + horasExtrasOrdinarias + horasExtrasNocturnas +
            horasExtrasFeriados + bonificaciones + comisiones + viaticos +
            subsidios + retroactivos + vacacionesPagadas + otrosIngresos;

        // Deduction calculations - MANUAL ONLY
        // Only apply deductions if explicitly provided via employee profile or wizard

        const seguridadSocial = parseFloat(workData.montoAfp) || 0;
        const seguroSalud = parseFloat(workData.montoSfs) || 0;
        const isr = parseFloat(workData.montoIsr) || 0;

        const prestamos = parseFloat(workData.prestamos) || 0;
        const adelantos = parseFloat(workData.adelantos) || 0;
        const faltas = parseFloat(workData.faltas) || 0;
        const tardanzas = parseFloat(workData.tardanzas) || 0;
        const otrasDeducciones = (parseFloat(workData.otrasDeducciones) || 0) + (parseFloat(workData.otrosDescuentosRecurrentes) || 0);

        // Calculate total deductions
        const totalDeducciones = seguridadSocial + seguroSalud + isr + prestamos +
            adelantos + faltas + tardanzas + otrasDeducciones;

        // Calculate net salary
        const salarioNeto = totalIngresos - totalDeducciones;

        return {
            diasTrabajados,
            salarioBase,
            horasExtrasOrdinarias,
            horasExtrasNocturnas,
            horasExtrasFeriados,
            bonificaciones,
            comisiones,
            viaticos,
            subsidios,
            retroactivos,
            vacacionesPagadas,
            otrosIngresos,
            seguridadSocial,
            seguroSalud,
            isr,
            prestamos,
            adelantos,
            faltas,
            tardanzas,
            otrasDeducciones,
            totalIngresos,
            totalDeducciones,
            salarioNeto
        };
    }

    // Generate payroll for all active employees in a period
    static async generatePayrollForPeriod(periodoId, userId = null, employeeIds = null, payrollDetails = null) {
        // Resolve the employee ID for the user who is calculating the payroll
        let empleadoIdCalculador = null;
        if (userId) {
            try {
                const empleadoCalculador = await prisma.empleado.findUnique({
                    where: { usuarioId: userId }
                });
                if (empleadoCalculador) {
                    empleadoIdCalculador = empleadoCalculador.id;
                }
            } catch (error) {
                console.warn('Could not resolve employee for user ID:', userId);
            }
        }

        // Get all active employees or specific employees
        let whereClause = { estado: 'ACTIVO' };

        if (employeeIds && employeeIds.length > 0) {
            // Filter by specific employee IDs AND active status
            whereClause = {
                AND: [
                    { estado: 'ACTIVO' },
                    { id: { in: employeeIds.map(id => BigInt(id)) } }
                ]
            };
        }

        const empleados = await prisma.empleado.findMany({
            where: whereClause,
            include: {
                cargo: true,
                departamento: true
            }
        });

        const periodo = await prisma.periodoNomina.findUnique({
            where: { id: BigInt(periodoId) }
        });

        if (!periodo) {
            throw new Error('Period not found');
        }

        const payrollRecords = [];

        for (const empleado of empleados) {
            // Check if payroll already exists for this employee in this period
            const existing = await prisma.nomina.findUnique({
                where: {
                    periodoId_empleadoId: {
                        periodoId: BigInt(periodoId),
                        empleadoId: empleado.id
                    }
                }
            });

            if (existing) {
                continue; // Skip if already exists
            }

            // Determine base salary based on period type and employee salary type
            let salarioBase = parseFloat(empleado.salarioBase);

            // If period is Quincenal and employee is Monthly (or default), divide by 2
            // We check for 'QUINCENAL' (case insensitive just in case)
            const tipoPeriodo = periodo.tipoPeriodo ? periodo.tipoPeriodo.toUpperCase() : 'QUINCENAL';
            const tipoSalario = empleado.tipoSalario ? empleado.tipoSalario.toUpperCase() : 'MENSUAL';

            if (tipoPeriodo === 'QUINCENAL' && tipoSalario === 'MENSUAL') {
                salarioBase = salarioBase / 2;
            }

            // Get variable details for this employee if provided
            // Convert BigInt id to string for lookup if needed, or ensure keys match
            const empIdStr = empleado.id.toString();
            const details = payrollDetails && payrollDetails[empIdStr] ? payrollDetails[empIdStr] : {};

            // Calculate payroll
            const calculatedData = this.calculatePayroll(empleado, periodo, {
                salarioBase: salarioBase,
                montoAfp: empleado.montoAfp,
                montoSfs: empleado.montoSfs,
                montoIsr: empleado.montoIsr,
                otrosDescuentosRecurrentes: empleado.otrosDescuentos,
                ...details
            });

            // Create payroll record
            const payroll = await prisma.nomina.create({
                data: {
                    periodoId: BigInt(periodoId),
                    empleadoId: empleado.id,
                    ...calculatedData,
                    estadoPago: 'PENDIENTE',
                    calculadoPorId: empleadoIdCalculador
                },
                include: {
                    empleado: {
                        include: {
                            cargo: true,
                            departamento: true
                        }
                    }
                }
            });

            payrollRecords.push(payroll);
        }

        return payrollRecords;
    }

    // Get pending payroll details with employees
    static async getPendingPayrollDetails() {
        // Find open periods
        const openPeriods = await prisma.periodoNomina.findMany({
            where: { estado: 'ABIERTO' },
            orderBy: { fechaInicio: 'desc' }
        });

        if (openPeriods.length === 0) {
            return {
                totalPendiente: 0,
                empleadosPendientes: [],
                periodos: []
            };
        }

        // Get all pending payrolls for open periods
        const pendingPayrolls = await prisma.nomina.findMany({
            where: {
                periodoId: { in: openPeriods.map(p => p.id) },
                estadoPago: 'PENDIENTE'
            },
            include: {
                empleado: {
                    include: {
                        cargo: true,
                        departamento: true
                    }
                },
                periodo: true
            },
            orderBy: [
                { periodo: { fechaInicio: 'desc' } },
                { empleado: { apellidos: 'asc' } }
            ]
        });

        // Calculate payments made for each payroll from MovimientoContable
        const empleadosPendientes = [];
        let totalPendiente = 0;

        for (const p of pendingPayrolls) {
            const salarioNeto = Number(p.salarioNeto);

            // Get payments from MovimientoContable that reference this nomina
            // We'll search in the descripcion field for the nominaId
            const pagos = await prisma.movimientoContable.findMany({
                where: {
                    tipo: 'gasto',
                    descripcion: {
                        contains: `[nominaId:${p.id.toString()}]`,
                        mode: 'insensitive'
                    }
                }
            });

            console.log(`🔍 Checking nomina ${p.id} for employee ${p.empleado.nombres} ${p.empleado.apellidos}`);
            console.log(`   Salary: ${salarioNeto}, Payments found: ${pagos.length}`);
            if (pagos.length > 0) {
                pagos.forEach(pago => {
                    console.log(`   - Payment: ${Number(pago.monto)} on ${pago.fecha}`);
                });
            }

            const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
            const montoPendiente = salarioNeto - totalPagado;

            console.log(`   Total Paid: ${totalPagado}, Remaining: ${montoPendiente}`);

            // Only include if there's still something pending
            if (montoPendiente > 0.01) { // Avoid floating point precision issues
                empleadosPendientes.push({
                    nominaId: p.id.toString(),
                    empleado: {
                        id: p.empleado.id.toString(),
                        nombres: p.empleado.nombres,
                        apellidos: p.empleado.apellidos,
                        cargo: p.empleado.cargo?.nombreCargo || 'N/A'
                    },
                    periodo: {
                        id: p.periodo.id.toString(),
                        codigoPeriodo: p.periodo.codigoPeriodo,
                        fechaInicio: p.periodo.fechaInicio,
                        fechaFin: p.periodo.fechaFin
                    },
                    salarioNeto: salarioNeto,
                    totalPagado: totalPagado,
                    montoPendiente: montoPendiente,
                    diasTrabajados: p.diasTrabajados
                });

                totalPendiente += montoPendiente;
            }
        }

        return {
            totalPendiente,
            empleadosPendientes,
            periodos: openPeriods.map(p => ({
                id: p.id.toString(),
                codigoPeriodo: p.codigoPeriodo,
                fechaInicio: p.fechaInicio,
                fechaFin: p.fechaFin,
                estado: p.estado
            }))
        };
    }

    // Get payment details for all payrolls in a specific period
    static async getPaymentDetailsByPeriod(periodId) {
        // Get all payrolls for this period
        const payrolls = await prisma.nomina.findMany({
            where: { periodoId: BigInt(periodId) },
            include: {
                empleado: {
                    include: {
                        cargo: true,
                        departamento: true
                    }
                },
                periodo: true
            },
            orderBy: [{ empleado: { apellidos: 'asc' } }]
        });

        // Calculate payments made for each payroll
        const paymentDetails = [];

        for (const p of payrolls) {
            const salarioNeto = Number(p.salarioNeto);

            // Get payments from MovimientoContable that reference this nomina
            const pagos = await prisma.movimientoContable.findMany({
                where: {
                    tipo: 'gasto',
                    descripcion: {
                        contains: `[nominaId:${p.id.toString()}]`,
                        mode: 'insensitive'
                    }
                }
            });

            const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
            const montoPendiente = salarioNeto - totalPagado;

            paymentDetails.push({
                id: p.id,
                nominaId: p.id.toString(),
                empleado: {
                    id: p.empleado.id.toString(),
                    nombres: p.empleado.nombres,
                    apellidos: p.empleado.apellidos,
                    cargo: p.empleado.cargo?.nombreCargo || 'N/A'
                },
                salarioNeto: salarioNeto,
                totalPagado: totalPagado,
                montoPendiente: montoPendiente,
                estadoPago: p.estadoPago
            });
        }

        return paymentDetails;
    }

    // Apply partial payment to a payroll record
    static async applyPartialPayment(nominaId, paymentData) {
        const { monto, metodoPago, cajaId, cuentaBancariaId, movimientoContableId, userId } = paymentData;

        // Get current payroll record
        const nomina = await prisma.nomina.findUnique({
            where: { id: BigInt(nominaId) },
            include: {
                empleado: true,
                periodo: true
            }
        });

        if (!nomina) {
            throw new Error('Payroll record not found');
        }

        if (nomina.estadoPago === 'PAGADO') {
            throw new Error('Payroll already fully paid');
        }

        const montoPago = parseFloat(monto);
        const salarioNeto = parseFloat(nomina.salarioNeto);

        if (montoPago <= 0) {
            throw new Error(`Invalid payment amount. Must be greater than 0`);
        }

        return await prisma.$transaction(async (tx) => {
            // Get all payments already made for this nomina
            const pagosAnteriores = await tx.movimientoContable.findMany({
                where: {
                    tipo: 'gasto',
                    descripcion: {
                        contains: `[nominaId:${nominaId}]`,
                        mode: 'insensitive'
                    }
                }
            });

            console.log(`💰 Processing payment for nomina ${nominaId}`);
            console.log(`   Previous payments found: ${pagosAnteriores.length}`);
            pagosAnteriores.forEach(pago => {
                console.log(`   - ${Number(pago.monto)} on ${pago.fecha} - ${pago.descripcion}`);
            });

            const totalPagadoAnterior = pagosAnteriores.reduce((sum, pago) => sum + Number(pago.monto), 0);
            const totalPagadoNuevo = totalPagadoAnterior + montoPago;

            console.log(`   Previous total: ${totalPagadoAnterior}, New payment: ${montoPago}, New total: ${totalPagadoNuevo}, Salary: ${salarioNeto}`);

            // Check if this payment exceeds the salary
            if (totalPagadoNuevo > salarioNeto + 0.01) { // Allow 1 cent tolerance
                throw new Error(`Payment exceeds remaining balance. Already paid: ${totalPagadoAnterior}, Salary: ${salarioNeto}, Attempting to pay: ${montoPago}`);
            }

            // Track payment in observaciones with a structured format
            let observaciones = nomina.observaciones || '';
            const fechaPago = new Date();
            const pagoInfo = `[PAGO] ${fechaPago.toISOString().split('T')[0]} - ${montoPago} DOP (${metodoPago}) - Mov: ${movimientoContableId || 'N/A'} - Total Pagado: ${totalPagadoNuevo}/${salarioNeto}\n`;
            observaciones += pagoInfo;

            // Check if this completes the payment
            const montoPendiente = salarioNeto - totalPagadoNuevo;
            const estadoPago = montoPendiente <= 0.01 ? 'PAGADO' : 'PENDIENTE';
            const fechaPagoFinal = estadoPago === 'PAGADO' ? fechaPago : nomina.fechaPago;

            // Update payment amounts based on method
            const updateData = {
                estadoPago,
                fechaPago: fechaPagoFinal,
                observaciones,
                formaPago: metodoPago,
                numeroTransaccion: movimientoContableId ? movimientoContableId.toString() : nomina.numeroTransaccion
            };

            // Accumulate payment amounts by method
            if (metodoPago === 'caja') {
                updateData.montoCaja = Number(nomina.montoCaja || 0) + montoPago;
            } else if (metodoPago === 'banco') {
                updateData.montoBanco = Number(nomina.montoBanco || 0) + montoPago;
                if (cuentaBancariaId) {
                    updateData.cuentaBancariaId = cuentaBancariaId;
                }
            }

            const updated = await tx.nomina.update({
                where: { id: BigInt(nominaId) },
                data: updateData,
                include: {
                    empleado: {
                        include: {
                            cargo: true,
                            departamento: true
                        }
                    },
                    periodo: true
                }
            });

            return updated;
        });
    }
}

module.exports = { PayrollService };
