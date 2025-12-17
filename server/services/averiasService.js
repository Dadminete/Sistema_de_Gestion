const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

// Nota: En index.js la creación de tickets usa la tabla `ticket` con campos
// createdAt, categoria, prioridad y estado ('abierto', 'en_proceso', 'resuelto').
// Ajustamos este servicio para usar ese modelo.

const averiasService = {
  getAllAverias: async () => {
    try {
      const tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: {
            select: { nombre: true, apellidos: true }
          }
        }
      });
      return tickets;
    } catch (error) {
      console.error('Error fetching all averias:', error);
      throw new Error('Error al obtener todas las averías');
    }
  },

  // Estadísticas por rango personalizado [from, to)
  getAveriasStatsRange: async (from, to) => {
    try {
      const start = new Date(from);
      const end = new Date(to);
      const where = { createdAt: { gte: start, lt: end } };

      const [total, pendientes, resueltos, resueltosTickets] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.count({ where: { ...where, estado: { in: ['abierto', 'en_proceso'] } } }),
        prisma.ticket.count({ where: { ...where, estado: 'resuelto' } }),
        prisma.ticket.findMany({ where: { ...where, estado: 'resuelto', fechaCierre: { not: null } }, select: { fechaCreacion: true, fechaCierre: true } }),
      ]);

      let promedioHorasResolucion = null;
      if (resueltosTickets.length > 0) {
        const totalMs = resueltosTickets.reduce((acc, t) => acc + Math.max(new Date(t.fechaCierre).getTime() - new Date(t.fechaCreacion).getTime(), 0), 0);
        promedioHorasResolucion = +(totalMs / resueltosTickets.length / 36e5).toFixed(2);
      }

      return { total, pendientes, resueltos, promedioHorasResolucion };
    } catch (error) {
      console.error('Error fetching range stats:', error);
      throw new Error('Error al obtener estadísticas por rango');
    }
  },

  // Agrupaciones por rango personalizado [from, to)
  getAveriasAggregationsRange: async (from, to) => {
    try {
      const start = new Date(from);
      const end = new Date(to);
      const where = { createdAt: { gte: start, lt: end } };

      const [byCategoria, byPrioridad] = await Promise.all([
        prisma.ticket.groupBy({ by: ['categoria'], where, _count: { _all: true } }),
        prisma.ticket.groupBy({ by: ['prioridad'], where, _count: { _all: true } }),
      ]);

      return {
        categoria: byCategoria.map(r => ({ key: r.categoria || 'Sin categoría', count: r._count._all })),
        prioridad: byPrioridad.map(r => ({ key: r.prioridad || 'Sin prioridad', count: r._count._all })),
      };
    } catch (error) {
      console.error('Error fetching range aggregations:', error);
      throw new Error('Error al obtener agrupaciones por rango');
    }
  },

  // Estadísticas del mes en curso
  getAveriasStatsMes: async (offset = 0) => {
    try {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1, 0, 0, 0, 0);

      const baseWhere = { createdAt: { gte: start, lt: end } };

      const [total, pendientes, resueltos, resueltosTickets] = await Promise.all([
        prisma.ticket.count({ where: baseWhere }),
        prisma.ticket.count({ where: { ...baseWhere, estado: { in: ['abierto', 'en_proceso'] } } }),
        prisma.ticket.count({ where: { ...baseWhere, estado: 'resuelto' } }),
        prisma.ticket.findMany({
          where: { ...baseWhere, estado: 'resuelto', fechaCierre: { not: null } },
          select: { fechaCreacion: true, fechaCierre: true },
        }),
      ]);

      // Calcular promedio de horas de resolución
      let promedioHorasResolucion = null;
      if (resueltosTickets.length > 0) {
        const totalMs = resueltosTickets.reduce((acc, t) => {
          const diff = new Date(t.fechaCierre).getTime() - new Date(t.fechaCreacion).getTime();
          return acc + Math.max(diff, 0);
        }, 0);
        promedioHorasResolucion = +(totalMs / resueltosTickets.length / 36e5).toFixed(2);
      }

      return { total, pendientes, resueltos, promedioHorasResolucion };
    } catch (error) {
      console.error('Error fetching monthly averias stats:', error);
      throw new Error('Error al obtener estadísticas mensuales de averías');
    }
  },

  // Agrupaciones del mes por categoría y prioridad
  getAveriasAggregationsMes: async (offset = 0) => {
    try {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1, 0, 0, 0, 0);

      const where = { createdAt: { gte: start, lt: end } };

      const [byCategoria, byPrioridad] = await Promise.all([
        prisma.ticket.groupBy({
          by: ['categoria'],
          where,
          _count: { _all: true },
        }),
        prisma.ticket.groupBy({
          by: ['prioridad'],
          where,
          _count: { _all: true },
        }),
      ]);

      return {
        categoria: byCategoria.map(r => ({ key: r.categoria || 'Sin categoría', count: r._count._all })),
        prioridad: byPrioridad.map(r => ({ key: r.prioridad || 'Sin prioridad', count: r._count._all })),
      };
    } catch (error) {
      console.error('Error fetching monthly aggregations:', error);
      throw new Error('Error al obtener agrupaciones mensuales de averías');
    }
  },

  getAveriasStatsHoy: async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const baseWhere = {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      };

      const [total, pendientes, proceso, resueltos] = await Promise.all([
        prisma.ticket.count({ where: baseWhere }),
        prisma.ticket.count({ where: { ...baseWhere, estado: 'abierto' } }),
        prisma.ticket.count({ where: { ...baseWhere, estado: 'en_proceso' } }),
        prisma.ticket.count({ where: { ...baseWhere, estado: 'resuelto' } }),
      ]);

      return { total, pendientes, proceso, resueltos };
    } catch (error) {
      console.error('Error fetching averias stats for today:', error);
      throw new Error('Error al obtener estadísticas de averías de hoy');
    }
  },

  getTopClients: async (limit = 5) => {
    try {
      const topClients = await prisma.ticket.groupBy({
        by: ['clienteId'],
        _count: {
          clienteId: true
        },
        orderBy: {
          _count: {
            clienteId: 'desc'
          }
        },
        take: limit,
        where: {
          clienteId: { not: null }
        }
      });

      // Enrich with client details
      const enriched = await Promise.all(topClients.map(async (item) => {
        const cliente = await prisma.cliente.findUnique({
          where: { id: item.clienteId },
          select: { nombre: true, apellidos: true, codigoCliente: true }
        });
        return {
          ...item,
          nombre: cliente ? `${cliente.nombre} ${cliente.apellidos}` : 'Desconocido',
          codigo: cliente?.codigoCliente || 'N/A',
          count: item._count.clienteId
        };
      }));

      return enriched;
    } catch (error) {
      console.error('Error fetching top clients:', error);
      throw new Error('Error al obtener top clientes');
    }
  },

  getTechnicianStats: async () => {
    try {
      const stats = await prisma.ticket.groupBy({
        by: ['tecnicoAsignadoId'],
        _count: {
          _all: true
        },
        where: {
          tecnicoAsignadoId: { not: null }
        }
      });

      // Enrich with technician details
      const enriched = await Promise.all(stats.map(async (item) => {
        const tecnico = await prisma.empleado.findUnique({
          where: { id: item.tecnicoAsignadoId },
          select: { nombres: true, apellidos: true }
        });
        return {
          tecnico: tecnico ? `${tecnico.nombres} ${tecnico.apellidos}` : 'Desconocido',
          count: item._count._all
        };
      }));

      return enriched.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error fetching technician stats:', error);
      throw new Error('Error al obtener estadísticas de técnicos');
    }
  },

  getById: async (id) => {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          cliente: { select: { nombre: true, apellidos: true } },
        }
      });
      return ticket;
    } catch (error) {
      console.error('Error fetching averia by id:', error);
      throw new Error('Error al obtener la avería');
    }
  },

  update: async (id, data) => {
    try {
      // Only allow specific fields to be updated
      const { asunto, descripcion, categoria, prioridad, estado, notas } = data || {};
      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          ...(asunto !== undefined && { asunto }),
          ...(descripcion !== undefined && { descripcion }),
          ...(categoria !== undefined && { categoria }),
          ...(prioridad !== undefined && { prioridad }),
          ...(estado !== undefined && { estado }),
          ...(notas !== undefined && { notas }),
        },
      });
      return updated;
    } catch (error) {
      console.error('Error updating averia:', error);
      throw new Error('Error al actualizar la avería');
    }
  },

  delete: async (id) => {
    try {
      await prisma.ticket.delete({ where: { id } });
      return true;
    } catch (error) {
      console.error('Error deleting averia:', error);
      throw new Error('Error al eliminar la avería');
    }
  },
};

module.exports = averiasService;
