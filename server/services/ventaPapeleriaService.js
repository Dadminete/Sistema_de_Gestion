const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const movimientoContableService = require('./movimientoContableService');

async function getPapeleriaCategoriaId() {
  try {
    // Buscar categoría existente para ventas de papelería
    const existingCategoria = await prisma.categoriaCuenta.findFirst({
      where: {
        OR: [
          { nombre: { contains: 'Venta Papeleria', mode: 'insensitive' } },
          { nombre: { contains: 'Ventas Papelería', mode: 'insensitive' } },
          { nombre: { contains: 'Ingreso Papeleria', mode: 'insensitive' } }
        ]
      }
    });

    if (existingCategoria) {
      return existingCategoria.id;
    }

    // Crear categoría genérica de ingresos si no existe ninguna específica
    const genericCategoria = await prisma.categoriaCuenta.findFirst({
      where: { tipo: 'ingreso', activa: true }
    });
    
    return genericCategoria ? genericCategoria.id : null;
  } catch (error) {
    console.error('Error obteniendo categoría para ventas de papelería:', error);
    return null;
  }
}

const getAllVentasPapeleria = async () => {
    const ventas = await prisma.ventaPapeleria.findMany({
        include: {
            usuario: true,
            detalles: {
                include: {
                    producto: true
                }
            }
        }
    });

    // Map product name to each detalle for frontend consumption
    return ventas.map(venta => ({
        ...venta,
        detalles: venta.detalles.map(detalle => ({
            ...detalle,
            nombreProducto: detalle.producto ? detalle.producto.nombre : 'Producto Desconocido'
        }))
    }));
};

const getVentaPapeleriaById = async (id) => {
    const venta = await prisma.ventaPapeleria.findUnique({
        where: { id },
        include: {
            usuario: true,
            detalles: {
                include: {
                    producto: true
                }
            }
        }
    });

    if (!venta) return null;

    return {
        ...venta,
        detalles: venta.detalles.map(detalle => ({
            ...detalle,
            nombreProducto: detalle.producto ? detalle.producto.nombre : 'Producto Desconocido'
        }))
    };
};

const createVentaPapeleria = async (ventaData) => {
    const { detalles, subtotal, descuentos, total, ...ventaInfo } = ventaData;

    return prisma.$transaction(async (tx) => {
        const venta = await tx.ventaPapeleria.create({
            data: {
                ...ventaInfo,
                subtotal: String(subtotal), // Convert to string for Prisma Decimal
                descuentos: String(descuentos || 0), // Convert to string for Prisma Decimal
                total: String(total), // Convert to string for Prisma Decimal
                detalles: {
                    create: detalles.map(d => ({
                        productoId: d.productoId,
                        nombreProducto: d.nombreProducto, // Store product name
                        cantidad: d.cantidad,
                        precioUnitario: String(d.precioUnitario), // Convert to string for Prisma Decimal
                        subtotal: String(d.cantidad * Number(d.precioUnitario)), // Calculate and convert
                        impuesto: String(0), // Default to 0, or pass from frontend if applicable
                        descuento: String(0), // Default to 0, or pass from frontend if applicable
                        total: String(d.cantidad * Number(d.precioUnitario)), // Calculate and convert
                    })),
                },
            },
            include: { detalles: true },
        });

        for (const detalle of detalles) {
            await tx.productoPapeleria.update({
                where: { id: detalle.productoId },
                data: {
                    stockActual: {
                        decrement: detalle.cantidad,
                    },
                },
            });
        }

        // Crear movimiento contable para la venta
        try {
            const categoriaId = await getPapeleriaCategoriaId();
            if (categoriaId) {
                await movimientoContableService.createMovimiento({
                    tipo: 'ingreso',
                    monto: total,
                    categoriaId: categoriaId,
                    metodo: 'papeleria',
                    descripcion: `Venta de papelería #${venta.numeroVenta}`,
                    usuarioId: venta.usuarioId,
                });
            }
        } catch (error) {
            console.error('Error creando movimiento contable:', error);
            // No lanzamos error aquí para no afectar la creación de la venta
        }

        return venta;
    });
};

const updateVentaPapeleria = async (id, ventaData) => {
    // TODO: This is a simplified update. A full implementation should handle stock changes.
    const { detalles, ...ventaInfo } = ventaData;
    return prisma.ventaPapeleria.update({
        where: { id },
        data: {
            ...ventaInfo,
        },
    });
};

const deleteVentaPapeleria = async (id) => {
    return prisma.$transaction(async (tx) => {
        const venta = await tx.ventaPapeleria.findUnique({
            where: { id },
            include: { detalles: true },
        });

        if (!venta) {
            throw new Error('Venta no encontrada');
        }

        for (const detalle of venta.detalles) {
            await tx.productoPapeleria.update({
                where: { id: detalle.productoId },
                data: {
                    stockActual: {
                        increment: detalle.cantidad,
                    },
                },
            });
        }

        await tx.detalleVentaPapeleria.deleteMany({
            where: { ventaId: id },
        });

        return tx.ventaPapeleria.delete({
            where: { id },
        });
    });
};

const getTotalVentasPapeleria = async () => {
    const result = await prisma.ventaPapeleria.aggregate({
        _sum: {
            total: true,
        },
    });
    return result._sum.total || 0;
};

module.exports = {
    getAllVentasPapeleria,
    getVentaPapeleriaById,
    createVentaPapeleria,
    updateVentaPapeleria,
    deleteVentaPapeleria,
    getTotalVentasPapeleria,
};