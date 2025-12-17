const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/bitacora - Obtener registros de auditoría con filtros
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            usuarioId,
            accion,
            tablaAfectada,
            resultado,
            fechaInicio,
            fechaFin,
            metodo,
        } = req.query;

        const skip = (page - 1) * limit;
        const where = {};

        if (usuarioId) where.usuarioId = usuarioId;
        if (accion) where.accion = { contains: accion, mode: 'insensitive' };
        if (tablaAfectada) where.tablaAfectada = tablaAfectada;
        if (resultado) where.resultado = resultado;
        if (metodo) where.metodo = metodo;

        if (fechaInicio || fechaFin) {
            where.fechaHora = {};
            if (fechaInicio) where.fechaHora.gte = new Date(fechaInicio);
            if (fechaFin) where.fechaHora.lte = new Date(fechaFin);
        }

        const [registros, total] = await Promise.all([
            prisma.bitacora.findMany({
                where,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            username: true,
                            nombre: true,
                            apellido: true,
                        }
                    }
                },
                skip,
                take: parseInt(limit),
                orderBy: { fechaHora: 'desc' }
            }),
            prisma.bitacora.count({ where })
        ]);

        res.json({
            data: registros,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching bitácora:', error);
        res.status(500).json({ error: 'Error al obtener registros de auditoría' });
    }
});

// GET /api/bitacora/stats - Estadísticas de auditoría
router.get('/stats', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        const where = {};

        if (fechaInicio || fechaFin) {
            where.fechaHora = {};
            if (fechaInicio) where.fechaHora.gte = new Date(fechaInicio);
            if (fechaFin) where.fechaHora.lte = new Date(fechaFin);
        }

        const [
            totalAcciones,
            accionesPorTipo,
            accionesPorUsuario,
            accionesPorTabla,
        ] = await Promise.all([
            prisma.bitacora.count({ where }),
            prisma.bitacora.groupBy({
                by: ['accion'],
                where,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            }),
            prisma.bitacora.groupBy({
                by: ['usuarioId'],
                where: { ...where, usuarioId: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            }),
            prisma.bitacora.groupBy({
                by: ['tablaAfectada'],
                where: { ...where, tablaAfectada: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            }),
        ]);

        res.json({
            totalAcciones,
            accionesPorTipo,
            accionesPorUsuario,
            accionesPorTabla,
        });
    } catch (error) {
        console.error('Error fetching bitácora stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas de auditoría' });
    }
});

// GET /api/bitacora/:id - Obtener detalle de un registro
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const registro = await prisma.bitacora.findUnique({
            where: { id: BigInt(id) },
            include: {
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombre: true,
                        apellido: true,
                        email: true,
                    }
                }
            }
        });

        if (!registro) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        res.json(registro);
    } catch (error) {
        console.error('Error fetching bitácora record:', error);
        res.status(500).json({ error: 'Error al obtener registro de auditoría' });
    }
});

module.exports = router;
