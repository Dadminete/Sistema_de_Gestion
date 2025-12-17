const prisma = require('../prismaClient');

// Configuración de acciones a ignorar (health checks, etc.)
const IGNORED_PATHS = [
    '/health',
    '/api/events', // SSE endpoint
    '/uploads',
];

// Mapeo de rutas a tablas
const ROUTE_TO_TABLE_MAP = {
    '/api/users': 'usuarios',
    '/api/roles': 'roles',
    '/api/permisos': 'permisos',
    '/api/clients': 'clientes',
    '/api/banks': 'bancos',
    '/api/categorias': 'categorias',
    '/api/servicios': 'servicios',
    '/api/planes': 'planes',
    '/api/suscripciones': 'suscripciones',
    '/api/tickets': 'tickets',
    '/api/empresa': 'empresa',
    '/api/papeleria/categorias': 'categorias_papeleria',
    '/api/papeleria/productos': 'productos_papeleria',
    '/api/papeleria/ventas': 'ventas_papeleria',
    '/api/contabilidad/cuentas': 'cuentas_contables',
    '/api/contabilidad/movimientos': 'movimientos_contables',
    '/api/cajas': 'cajas',
    '/api/averias': 'averias',
    '/api/chats': 'chats',
    '/api/database': 'database',
};

// Mapeo de métodos HTTP a acciones
const METHOD_TO_ACTION_MAP = {
    'GET': 'CONSULTAR',
    'POST': 'CREAR',
    'PUT': 'ACTUALIZAR',
    'PATCH': 'ACTUALIZAR',
    'DELETE': 'ELIMINAR',
};

const auditMiddleware = async (req, res, next) => {
    // Ignorar rutas específicas
    if (IGNORED_PATHS.some(path => req.path.startsWith(path))) {
        return next();
    }

    const startTime = Date.now();

    // Capturar información inicial
    const sesionId = req.session?.id || null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const metodo = req.method;
    const ruta = req.path;

    // Extraer ID del registro afectado de los params
    const registroAfectadoId = req.params.id || null;

    // Interceptar la respuesta para capturar el resultado
    const originalSend = res.send;
    res.send = function (data) {
        const duracionMs = Date.now() - startTime;
        const resultado = res.statusCode < 400 ? 'exitoso' : 'error';

        // Capturar usuarioId AQUÍ, después de que los middlewares de auth hayan corrido
        const usuarioId = req.user?.id || req.user?.userId || null;

        // Determinar tabla afectada basado en la ruta
        let tablaAfectada = null;
        for (const [routePrefix, table] of Object.entries(ROUTE_TO_TABLE_MAP)) {
            if (ruta.startsWith(routePrefix)) {
                tablaAfectada = table;
                break;
            }
        }

        // Fallback: intentar inferir tabla de la URL si no está en el mapa
        if (!tablaAfectada && ruta.startsWith('/api/')) {
            const parts = ruta.split('/');
            if (parts.length > 2) {
                // parts[0] = '', parts[1] = 'api', parts[2] = 'resource'
                tablaAfectada = parts[2];
            }
        }

        // Determinar acción basada en el método HTTP
        const accionBase = METHOD_TO_ACTION_MAP[metodo] || 'ACCION';
        const accion = tablaAfectada
            ? `${accionBase}_${tablaAfectada.toUpperCase()}`
            : accionBase;

        // Log asíncrono (no bloqueante)
        setImmediate(async () => {
            try {
                // Solo crear bitácora si el usuario existe
                if (usuarioId) {
                    await prisma.bitacora.create({
                        data: {
                            usuarioId,
                            // sesionId, // Commented: column doesn't exist in DB yet
                            accion,
                            tablaAfectada,
                            registroAfectadoId: registroAfectadoId?.toString(),
                            detallesNuevos: metodo !== 'GET' ? req.body : null,
                            ipAddress,
                            userAgent,
                            metodo,
                            ruta,
                            resultado,
                            mensajeError: resultado === 'error' ? (typeof data === 'string' ? data : data?.error || data?.message) : null,
                            duracionMs,
                        }
                    });
                }
            } catch (error) {
                // Silently ignore bitacora errors - don't block requests
                if (process.env.DEBUG_AUDIT) {
                    console.error('Error logging to bitácora:', error.message);
                }
            }
        });

        originalSend.call(this, data);
    };

    next();
};

module.exports = { auditMiddleware };
