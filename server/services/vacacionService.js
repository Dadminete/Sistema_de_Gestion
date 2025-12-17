const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

class VacacionService {
    // Obtener todos los tipos de vacaciones
    static async getAllTipos() {
        return await prisma.tipoVacacion.findMany({
            where: { activo: true }
        });
    }

    // Obtener periodos de vacaciones por empleado
    static async getPeriodosByEmpleado(empleadoId) {
        return await prisma.periodoVacacion.findMany({
            where: { empleadoId: BigInt(empleadoId) },
            include: { tipoVacacion: true },
            orderBy: { ano: 'desc' }
        });
    }

    // Obtener solicitudes de vacaciones por empleado
    static async getSolicitudesByEmpleado(empleadoId) {
        return await prisma.solicitudVacacion.findMany({
            where: { empleadoId: BigInt(empleadoId) },
            include: {
                tipoVacacion: true,
                aprobadoPor: {
                    select: {
                        nombres: true,
                        apellidos: true
                    }
                }
            },
            orderBy: { fechaSolicitud: 'desc' }
        });
    }

    // Crear una nueva solicitud de vacaciones
    static async createSolicitud(data) {
        return await prisma.solicitudVacacion.create({
            data: {
                empleadoId: BigInt(data.empleadoId),
                tipoVacacionId: BigInt(data.tipoVacacionId),
                fechaInicio: new Date(data.fechaInicio),
                fechaFin: new Date(data.fechaFin),
                diasSolicitados: parseInt(data.diasSolicitados),
                motivo: data.motivo,
                estado: 'PENDIENTE'
            }
        });
    }

    // Obtener todas las solicitudes pendientes (para admin/RRHH)
    static async getPendingSolicitudes() {
        return await prisma.solicitudVacacion.findMany({
            where: { estado: 'PENDIENTE' },
            include: {
                empleado: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        cargo: {
                            select: { nombreCargo: true }
                        }
                    }
                },
                tipoVacacion: true
            },
            orderBy: { fechaSolicitud: 'asc' }
        });
    }

    // Actualizar estado de solicitud (Aprobar/Rechazar)
    static async updateSolicitudStatus(id, status, aprobadoPorId, observaciones) {
        const updateData = {
            estado: status,
            fechaAprobacion: new Date(),
            aprobadoPorId: BigInt(aprobadoPorId),
            observacionesAprobacion: observaciones
        };

        const result = await prisma.solicitudVacacion.update({
            where: { id: BigInt(id) },
            data: updateData
        });

        if (status === 'APROBADA') {
            const solicitud = await prisma.solicitudVacacion.findUnique({
                where: { id: BigInt(id) }
            });

            if (solicitud) {
                const year = solicitud.fechaInicio.getFullYear();

                // Find period to deduct from
                const periodo = await prisma.periodoVacacion.findFirst({
                    where: {
                        empleadoId: solicitud.empleadoId,
                        tipoVacacionId: solicitud.tipoVacacionId,
                        ano: year
                    }
                });

                if (periodo) {
                    await prisma.periodoVacacion.update({
                        where: { id: periodo.id },
                        data: {
                            diasTomados: { increment: solicitud.diasSolicitados },
                            diasDisponibles: { decrement: solicitud.diasSolicitados }
                        }
                    });
                }
            }
        }

        return result;
    }

    // Editar solicitud (Solo si está pendiente)
    static async updateSolicitud(id, data) {
        return await prisma.solicitudVacacion.update({
            where: { id: BigInt(id) },
            data: {
                tipoVacacionId: BigInt(data.tipoVacacionId),
                fechaInicio: new Date(data.fechaInicio),
                fechaFin: new Date(data.fechaFin),
                diasSolicitados: parseInt(data.diasSolicitados),
                motivo: data.motivo
            }
        });
    }

    // Eliminar solicitud
    static async deleteSolicitud(id) {
        return await prisma.solicitudVacacion.delete({
            where: { id: BigInt(id) }
        });
    }

    // Asignar periodo de vacaciones (Crear balance anual)
    static async assignPeriodo(data) {
        return await prisma.periodoVacacion.create({
            data: {
                empleadoId: BigInt(data.empleadoId),
                tipoVacacionId: BigInt(data.tipoVacacionId),
                ano: parseInt(data.ano),
                diasGanados: parseFloat(data.diasGanados),
                diasDisponibles: parseFloat(data.diasGanados),
                diasTomados: 0,
                diasPagados: 0,
                observaciones: data.observaciones
            }
        });
    }

    // Obtener todos los periodos (para admin/RRHH)
    static async getAllPeriodos() {
        return await prisma.periodoVacacion.findMany({
            include: {
                tipoVacacion: true,
                empleado: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        codigoEmpleado: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
    }
}

module.exports = { VacacionService };
