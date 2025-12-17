// Este archivo muestra ejemplos de datos basados en tu schema.prisma
// para implementar en el API backend

// ============================================================================
// EJEMPLOS DE QUERIES PARA OBTENER DATOS DEL DASHBOARD
// ============================================================================

/**
 * 1. ESTADÍSTICAS GENERALES (DashboardStats)
 * 
 * Basado en:
 * - model Cliente
 * - model Suscripcion
 * - model Ticket
 * - model FacturaCliente
 */

// Pseudocódigo para backend (Node.js/Express)
async function getDashboardStats() {
  // Total de clientes
  const totalClientes = await prisma.cliente.count({
    where: { estado: 'activo' }
  });

  // Ingresos del mes actual
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

  const ingresesDelMes = await prisma.pagoCliente.aggregate({
    _sum: { monto: true },
    where: {
      fechaPago: {
        gte: inicioMes,
        lte: finMes
      },
      estado: 'confirmado'
    }
  });

  // Suscripciones activas
  const suscripcionesActivas = await prisma.suscripcion.count({
    where: { estado: 'activo' }
  });

  // Tickets abiertos
  const ticketsAbiertos = await prisma.ticket.count({
    where: { estado: 'abierto' }
  });

  return {
    totalClientes,
    ingresesDelMes: ingresesDelMes._sum.monto || 0,
    suscripcionesActivas,
    ticketsAbiertos
  };
}

/**
 * 2. CRECIMIENTO DE CLIENTES (ClientGrowth)
 * 
 * Muestra clientes nuevos por mes
 * Basado en: model Cliente { fechaIngreso }
 */

async function getClientGrowth(period = 'monthly') {
  const ahora = new Date();
  const datos = [];

  // Para últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(ahora);
    fecha.setMonth(fecha.getMonth() - i);
    
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

    const nuevos = await prisma.cliente.count({
      where: {
        fecha_ingreso: {
          gte: inicioMes,
          lte: finMes
        }
      }
    });

    const total = await prisma.cliente.count({
      where: {
        fecha_ingreso: {
          lte: finMes
        }
      }
    });

    datos.push({
      month: fecha.toLocaleDateString('es-ES', { month: 'short' }),
      nuevos,
      total
    });
  }

  return datos;
}

/**
 * 3. CLIENTES TOP POR INGRESOS
 * 
 * Basado en:
 * - model Cliente
 * - model PagoCliente
 * - model Suscripcion
 */

async function getTopClients(limit = 5) {
  const clientes = await prisma.cliente.findMany({
    include: {
      pagos: {
        select: { monto: true },
        where: { estado: 'confirmado' }
      },
      suscripciones: {
        select: { estado: true }
      }
    },
    take: limit,
    orderBy: {
      pagos: {
        _count: 'desc'
      }
    }
  });

  return clientes.map(cliente => {
    const totalIngresos = cliente.pagos.reduce((sum, pago) => sum + pago.monto, 0);
    
    // Determinar categoría
    let categoria = 'NUEVO';
    if (cliente.categoria_cliente === 'VIP') categoria = 'VIP';
    else if (cliente.categoria_cliente === 'VIEJO') categoria = 'Premium';
    
    return {
      id: cliente.id,
      name: `${cliente.nombre} ${cliente.apellidos}`,
      category: categoria,
      revenue: `$${totalIngresos.toFixed(2)}`,
      status: cliente.estado === 'activo' ? 'Activo' : 'Inactivo',
      avatar: cliente.sexo === 'F' ? '👩' : '👨'
    };
  });
}

/**
 * 4. DISTRIBUCIÓN DE INGRESOS (Revenue Distribution)
 * 
 * Por tipo de servicio
 * Basado en:
 * - model DetalleFacturaCliente
 * - model Servicio
 * - model ProductoPapeleria
 */

async function getRevenueDistribution() {
  // Ingresos por servicios
  const servicios = await prisma.detalleFacturaCliente.aggregate({
    _sum: { total: true },
    where: { servicioId: { not: null } }
  });

  // Ingresos por papelería
  const papeleria = await prisma.detalleFacturaCliente.aggregate({
    _sum: { total: true },
    where: { productoId: { not: null } }
  });

  // Ingresos por suscripciones
  const suscripciones = await prisma.pagoCliente.aggregate({
    _sum: { monto: true },
    where: {
      factura: {
        tipoFactura: 'servicio'
      }
    }
  });

  const ingresoEquipos = await prisma.pagoCliente.aggregate({
    _sum: { monto: true },
    where: {
      factura: {
        tipoFactura: 'equipo'
      }
    }
  });

  const totalIngresos = 
    (servicios._sum.total || 0) +
    (papeleria._sum.total || 0) +
    (suscripciones._sum.monto || 0) +
    (ingresoEquipos._sum.monto || 0);

  return [
    {
      name: 'Servicios',
      value: Math.round((servicios._sum.total || 0) / totalIngresos * 100),
      color: '#3B82F6'
    },
    {
      name: 'Papelería',
      value: Math.round((papeleria._sum.total || 0) / totalIngresos * 100),
      color: '#10B981'
    },
    {
      name: 'Suscripciones',
      value: Math.round((suscripciones._sum.monto || 0) / totalIngresos * 100),
      color: '#8B5CF6'
    },
    {
      name: 'Equipos',
      value: Math.round((ingresoEquipos._sum.monto || 0) / totalIngresos * 100),
      color: '#F59E0B'
    }
  ];
}

/**
 * 5. TRANSACCIONES RECIENTES
 * 
 * Basado en:
 * - model PagoCliente
 * - model Cliente
 */

async function getRecentTransactions(limit = 10) {
  const transacciones = await prisma.pagoCliente.findMany({
    include: {
      cliente: {
        select: { nombre: true, apellidos: true }
      },
      factura: {
        select: { tipoFactura: true }
      }
    },
    orderBy: { fechaPago: 'desc' },
    take: limit
  });

  return transacciones.map(trans => ({
    id: trans.id,
    client: `${trans.cliente.nombre} ${trans.cliente.apellidos}`,
    type: trans.factura?.tipoFactura === 'servicio' ? 'Suscripción' : 
          trans.factura?.tipoFactura === 'equipo' ? 'Equipo' : 'Servicio',
    amount: `$${trans.monto.toFixed(2)}`,
    date: formatFecha(trans.fechaPago),
    status: trans.estado === 'confirmado' ? 'Completado' : 'Pendiente'
  }));
}

/**
 * 6. CLIENTES POR CATEGORÍA
 * 
 * Basado en: model Cliente { categoria_cliente }
 */

async function getClientsByCategory() {
  const categorias = await prisma.cliente.groupBy({
    by: ['categoria_cliente'],
    _count: true
  });

  return categorias.map(cat => ({
    category: cat.categoria_cliente,
    count: cat._count
  }));
}

/**
 * 7. SERVICIOS MÁS VENDIDOS
 * 
 * Basado en:
 * - model DetalleFacturaCliente
 * - model Servicio
 */

async function getTopServices(limit = 5) {
  const servicios = await prisma.detalleFacturaCliente.groupBy({
    by: ['servicioId'],
    _sum: { cantidad: true, total: true },
    _count: true,
    where: { servicioId: { not: null } }
  });

  return servicios
    .sort((a, b) => (b._count || 0) - (a._count || 0))
    .slice(0, limit)
    .map(async (serv) => {
      const servicio = await prisma.servicio.findUnique({
        where: { id: serv.servicioId || '' }
      });
      return {
        id: serv.servicioId,
        nombre: servicio?.nombre,
        ventas: serv._count,
        ingresos: serv._sum.total,
        cantidad: serv._sum.cantidad
      };
    });
}

/**
 * 8. ENDPOINT COMPLETO: GET /api/clients/dashboard
 * 
 * Combina todos los datos
 */

async function getFullDashboard() {
  const [stats, growth, topClients, revenue, transactions, distribution, topServices] = 
    await Promise.all([
      getDashboardStats(),
      getClientGrowth(),
      getTopClients(5),
      getRevenueDistribution(),
      getRecentTransactions(10),
      getClientsByCategory(),
      getTopServices(5)
    ]);

  return {
    stats,
    clientGrowth: growth,
    topClients,
    revenueData: revenue,
    recentTransactions: transactions,
    clientsByCategory: distribution,
    topServices
  };
}

// ============================================================================
// EJEMPLO DE ENDPOINT EN EXPRESS
// ============================================================================

// router.get('/clients/dashboard', async (req, res) => {
//   try {
//     const data = await getFullDashboard();
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching dashboard:', error);
//     res.status(500).json({ 
//       error: 'Error fetching dashboard data',
//       message: error.message 
//     });
//   }
// });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatFecha(fecha) {
  const ahora = new Date();
  const diff = ahora.getTime() - fecha.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `${dias} días`;
  if (dias < 30) return `${Math.floor(dias / 7)} semanas`;
  return `${Math.floor(dias / 30)} meses`;
}

// ============================================================================
// TIPOS TYPESCRIPT PARA FRONTEND
// ============================================================================

interface DashboardStats {
  totalClientes: number;
  ingresesDelMes: number;
  suscripcionesActivas: number;
  ticketsAbiertos: number;
}

interface ClientGrowthData {
  month: string;
  nuevos: number;
  total: number;
}

interface TopClient {
  id: string;
  name: string;
  category: string;
  revenue: string;
  status: string;
  avatar: string;
}

interface RevenueItem {
  name: string;
  value: number;
  color: string;
}

interface Transaction {
  id: string;
  client: string;
  type: string;
  amount: string;
  date: string;
  status: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface ServiceData {
  id: string;
  nombre: string;
  ventas: number;
  ingresos: number;
  cantidad: number;
}

interface FullDashboard {
  stats: DashboardStats;
  clientGrowth: ClientGrowthData[];
  topClients: TopClient[];
  revenueData: RevenueItem[];
  recentTransactions: Transaction[];
  clientsByCategory: CategoryCount[];
  topServices: ServiceData[];
}

export {
  getDashboardStats,
  getClientGrowth,
  getTopClients,
  getRevenueDistribution,
  getRecentTransactions,
  getClientsByCategory,
  getTopServices,
  getFullDashboard
};
