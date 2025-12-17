// Load environment variables from server/.env first
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const pathModule = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer'); // Import multer
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./prismaClient');
const { CategoriaService } = require('./services/categoriaService');
const { PlanService } = require('./services/planService');

// Strict auth middleware import (no fallback)
const { authenticateToken } = require('./middleware/authMiddleware');
const { auditMiddleware } = require('./middleware/auditMiddleware');

// Route modules
const categoriaPapeleriaRoutes = require('./routes/categoriaPapeleriaRoutes');
const productoPapeleriaRoutes = require('./routes/productoPapeleriaRoutes');
const clientePapeleriaRoutes = require('./routes/clientePapeleriaRoutes');
const ventaPapeleriaRoutes = require('./routes/ventaPapeleriaRoutes');
const bankRoutes = require('./routes/bankRoutes');
const clientRoutes = require('./routes/clientRoutes');
const categoriaCuentaRoutes = require('./routes/categoriaCuentaRoutes');
const movimientoContableRoutes = require('./routes/movimientoContableRoutes');
const traspasoRoutes = require('./routes/traspasoRoutes');
const cuentaContableRoutes = require('./routes/cuentaContableRoutes');
const cuentasPorCobrarRoutes = require('./routes/cuentasPorCobrar');
const cuentasPorPagarRoutes = require('./routes/cuentasPorPagar');
const databaseRoutes = require('./routes/databaseRoutes');
const chatRoutes = require('./routes/chatRoutes');
const averiasRoutes = require('./routes/averiasRoutes');
const bitacoraRoutes = require('./routes/bitacoraRoutes');
const eventosAndTareasRoutes = require('./routes/eventosAndTareasRoutes');
const suscripcionesRoutes = require('./routes/suscripcionesRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const eventSystem = require('./eventSystem');
const mePermissionsRoute = require('./routes/me.permissions');
const roleRoutes = require('./routes/roleRoutes');
const permisoRoutes = require('./routes/permisoRoutes');
const usuarioPermisoRoutes = require('./routes/usuarioPermisoRoutes');
const { attachUserPermissions, requirePermission } = require('./middleware/authorize');

// RR.HH. Routes
const employeeRoutes = require('./routes/employeeRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const loanRoutes = require('./routes/loanRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const vacacionRoutes = require('./routes/vacacionRoutes');

// Make eventSystem globally available
global.eventSystem = eventSystem;

// Fallback: also try to load env from project root if not already loaded, but ensure server/.env takes precedence
try {
  if (!process.env.DATABASE_URL) { // Only load root .env if DATABASE_URL is not already set
    const rootEnv = path.resolve(__dirname, '../.env');
    if (fs.existsSync(rootEnv)) {
      // Load root .env, but don't override existing variables (like JWT_SECRET)
      require('dotenv').config({ path: rootEnv, override: false });
    }
  }
} catch (_) { }

const app = express();
const PORT = process.env.PORT || 54116; // Default port for backend server
const upload = multer({ storage: multer.memoryStorage() });

// Fix BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware for better performance
app.use(compression({
  level: 6, // Compression level (1-9, 6 is default)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't accept gzip
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress SSE endpoints
    if (req.path.includes('/api/events')) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for production security
  message: {
    error: 'Demasiados intentos de login. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // Higher limit for development
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
// CORS configuration should be before rate limiting and other middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://172.16.0.23:5173',
    'http://172.27.240.1:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
}));

// Static file serving for uploads (logos, images, etc.)
// Add CORS headers for static files
app.use('/uploads', (req, res, next) => {
  const origin = req.get('origin') || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use('/uploads', express.static(pathModule.join(__dirname, 'uploads')));

// File upload endpoint
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    console.log('File upload request received');

    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Archivo no encontrado' });
    }

    // List of allowed file types - allow common document, image, and media formats
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
      // Documents
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain', // .txt
      'text/csv', // .csv
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Video
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'
    ];

    // Validate file type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: imágenes, documentos (PDF, Word, Excel, etc.), videos y audio.`
      });
    }

    // Validate file size (50MB max for documents)
    if (file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ message: 'El archivo no puede ser mayor a 50MB' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop();
    const filename = `client_${timestamp}_${randomSuffix}.${fileExtension}`;

    // Ensure uploads directory exists
    const uploadsDir = pathModule.join(__dirname, 'uploads');
    if (!require('fs').existsSync(uploadsDir)) {
      require('fs').mkdirSync(uploadsDir, { recursive: true });
    }

    // Move file to uploads directory
    const filePath = pathModule.join(uploadsDir, filename);
    require('fs').writeFileSync(filePath, file.buffer);

    console.log('File uploaded successfully:', filename);

    res.json({
      message: 'Archivo subido exitosamente',
      filePath: `/uploads/${filename}`,
      filename: filename
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error interno del servidor al subir archivo' });
  }
});

// SSE Events endpoint - REMOVED: conflicts with the proper SSE implementation below

// Apply rate limiting after CORS
app.use('/api/auth/login', loginLimiter);
app.use('/api/', generalLimiter);
// Adjuntar permisos efectivos tras autenticar
app.use('/api', (req, res, next) => {
  // Solo adjuntar permisos si ya existe req.user (token válido). El authenticateToken se aplica más abajo en protectRoute/publicPaths
  if (req.user && !req.user.permissions) {
    // Cargar async y continuar
    return attachUserPermissions(req, res, next);
  }
  return next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit middleware - must be after body parsers and before routes
app.use(auditMiddleware);

// Proxy routes for frontend compatibility
app.use('/users', (req, res) => res.redirect('/api/users' + req.url));
app.use('/roles', (req, res) => res.redirect('/api/roles' + req.url));
app.use('/permisos', (req, res) => res.redirect('/api/permisos' + req.url));
app.use('/contabilidad/categorias-cuentas', (req, res) => res.redirect('/api/contabilidad/categorias-cuentas' + req.url));
app.use('/banks', (req, res) => res.redirect('/api/banks' + req.url));
app.use('/contabilidad/movimientos', (req, res) => res.redirect('/api/contabilidad/movimientos' + req.url));
app.use('/api/traspasos', traspasoRoutes);
app.use('/api/rrhh/departamentos', departmentRoutes);
app.use('/api/rrhh/cargos', cargoRoutes);
app.use('/api/rrhh/empleados', employeeRoutes);
app.use('/api/rrhh/nomina', payrollRoutes);
app.use('/api/rrhh/prestamos', loanRoutes);
app.use('/api/rrhh/comisiones', commissionRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/rrhh/vacaciones', vacacionRoutes);

// Health and performance routes
const healthRoutes = require('./routes/healthRoutes');
app.use('/api/system', healthRoutes);

// Security constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const SALT_ROUNDS = 12;

// Debug env presence in dev
if (process.env.NODE_ENV !== 'production') {
  console.log(`DATABASE_URL present: ${!!process.env.DATABASE_URL}`);
  console.log(`JWT_SECRET loaded: ${!!process.env.JWT_SECRET ? 'YES' : 'NO'}`);
  console.log(`JWT_SECRET value (first 10 chars): ${process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) : 'N/A'}`);
}

// Bitácora helper functions
const logAction = async (usuarioId, accion, tablaAfectada, registroAfectadoId, detallesAnteriores, detallesNuevos, req, resultado = 'exitoso', mensajeError = null, duracionMs = null) => {
  try {
    await prisma.bitacora.create({
      data: {
        usuarioId: usuarioId || null,
        accion,
        tablaAfectada,
        registroAfectadoId: registroAfectadoId ? registroAfectadoId.toString() : null,
        detallesAnteriores: detallesAnteriores || null,
        detallesNuevos: detallesNuevos || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        userAgent: req.get('User-Agent') || null,
        resultado,
        mensajeError,
        duracionMs
      }
    });
  } catch (error) {
    console.error('Error logging action to bitácora:', error);
  }
};

const withBitacora = (handler, accion, tablaAfectada) => {
  return async (req, res) => {
    const startTime = Date.now();
    let detallesAnteriores = null;
    let registroAfectadoId = null;

    try {
      // For updates and deletes, get the current state
      if ((accion.includes('ACTUALIZAR') || accion.includes('ELIMINAR')) && req.params.id) {
        try {
          let currentRecord = null;
          registroAfectadoId = req.params.id;

          if (tablaAfectada === 'usuarios') {
            currentRecord = await prisma.usuario.findUnique({ where: { id: req.params.id } });
          } else if (tablaAfectada === 'roles') {
            currentRecord = await prisma.role.findUnique({ where: { id: BigInt(req.params.id) } });
          } else if (tablaAfectada === 'permisos') {
            currentRecord = await prisma.permiso.findUnique({ where: { id: BigInt(req.params.id) } });
          }

          if (currentRecord) {
            detallesAnteriores = JSON.parse(JSON.stringify(currentRecord, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value
            ));
          }
        } catch (err) {
          console.warn('Could not fetch current record for bitácora:', err);
        }
      }

      // Execute the original handler
      const result = await handler(req, res);

      const duracionMs = Date.now() - startTime;

      // Log successful action
      try {
        await logAction(
          req.user?.id || req.body.usuarioId || req.headers['x-user-id'] || null,
          accion,
          tablaAfectada,
          registroAfectadoId || (req.body.id || req.params.id),
          detallesAnteriores,
          accion.includes('CREAR') ? req.body : (accion.includes('ACTUALIZAR') ? req.body : null),
          req,
          'exitoso',
          null,
          duracionMs
        );
      } catch (error) {
        console.error('Error logging successful action:', error);
      }

      return result;
    } catch (error) {
      const duracionMs = Date.now() - startTime;

      // Log failed action
      try {
        await logAction(
          req.user?.id || req.body.usuarioId || req.headers['x-user-id'] || null,
          accion,
          tablaAfectada,
          registroAfectadoId || (req.body.id || req.params.id),
          detallesAnteriores,
          req.body,
          req,
          'error',
          error.message,
          duracionMs
        );
      } catch (logError) {
        console.error('Error logging failed action:', logError);
      }

      throw error;
    }
  };
};

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Database Status Check
app.get('/api/database/status', async (req, res) => {
  try {
    // 1. Connection check / latency
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    // 2. Table count
    const tableCountResult = await prisma.$queryRaw`
      SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
    `;
    const tableCount = parseInt(tableCountResult[0].count, 10);

    // 3. Database size (pretty + bytes)
    const dbSizeResult = await prisma.$queryRaw`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) AS pretty,
        pg_database_size(current_database()) AS bytes;
    `;
    const dbSizePretty = dbSizeResult[0].pretty;
    const dbSizeBytes = Number(dbSizeResult[0].bytes);

    // 4. Activity for current day using bitacora as generic activity log
    let todayActivity = [];
    try {
      todayActivity = await prisma.$queryRaw`
        SELECT
          date_trunc('hour', "fecha_hora") AS hour,
          COUNT(*)::int AS count
        FROM "bitacora"
        WHERE "fecha_hora"::date = CURRENT_DATE
        GROUP BY date_trunc('hour', "fecha_hora")
        ORDER BY hour;
      `;
    } catch (activityError) {
      console.warn('Could not fetch today activity for database status:', activityError);
      todayActivity = [];
    }

    // 4.1 Tables modified today (using same bitacora data, effectively)
    let tablesWorkedOn = [];
    try {
      const tablesResult = await prisma.$queryRaw`
            SELECT "tabla_afectada" as table_name, COUNT(*)::int as count
            FROM "bitacora"
            WHERE "fecha_hora"::date = CURRENT_DATE
            AND "tabla_afectada" IS NOT NULL
            GROUP BY "tabla_afectada"
            ORDER BY count DESC
            LIMIT 10;
        `;

      tablesWorkedOn = tablesResult.map(row => ({
        tableName: row.table_name || 'Desconocida',
        count: row.count
      }));
    } catch (tableError) {
      console.warn('Could not fetch tables worked on:', tableError);
    }

    const totalEventsToday = todayActivity.reduce((sum, row) => sum + row.count, 0);

    // Map to a simpler structure for the frontend chart
    const activityByHour = todayActivity.map(row => ({
      hour: row.hour,
      count: row.count,
    }));

    // 5. Neon / database connection details
    const dbUrl = process.env.DATABASE_URL || '';
    let dbName = null;
    let dbHost = null;
    try {
      if (dbUrl) {
        const url = new URL(dbUrl);
        dbHost = url.hostname || null;
        dbName = (url.pathname || '').replace(/^\//, '') || null;
      }
    } catch (_) {
      // ignore parse errors, keep nulls
    }

    // 6. Usage percentage against configurable max size (MB)
    const maxSizeMbRaw = process.env.DB_MAX_SIZE_MB;
    const maxSizeMb = maxSizeMbRaw ? Number(maxSizeMbRaw) : null;
    const maxSizeBytes = maxSizeMb ? maxSizeMb * 1024 * 1024 : null;
    const dbUsagePercent = maxSizeBytes
      ? Math.min(100, Number(((dbSizeBytes / maxSizeBytes) * 100).toFixed(2)))
      : null;

    // Simple stability classification based on latency
    let stability = 'estable';
    if (latencyMs > 500) {
      stability = 'inestable';
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latencyMs,
      stability,
      tableCount,
      dbSizePretty,
      dbSizeBytes,
      activityToday: {
        totalEventsToday,
        activityByHour,
      },
      dbInfo: {
        dbName,
        dbHost,
        maxSizeMb,
        dbUsagePercent,
      },
      tablesWorkedOn,
    });
  } catch (error) {
    console.error('Error fetching database status:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'No se pudo conectar o consultar la base de datos.',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Temporary endpoint to create admin user
app.post('/api/create-admin', async (req, res) => {
  try {
    // 1. Define all system permissions
    const allPermissions = [
      { nombrePermiso: 'gestionar_usuarios', descripcion: 'Permite crear, ver, editar y eliminar usuarios.' },
      { nombrePermiso: 'gestionar_roles', descripcion: 'Permite crear, ver, editar y eliminar roles.' },
      { nombrePermiso: 'gestionar_permisos', descripcion: 'Permite crear, ver, editar y eliminar permisos.' },
      { nombrePermiso: 'ver_dashboard', descripcion: 'Permite ver el panel de control principal.' },
      { nombrePermiso: 'ver_bitacora', descripcion: 'Permite ver el registro de auditoría del sistema.' },
      { nombrePermiso: 'configuracion_sistema', descripcion: 'Permite acceder a la configuración avanzada del sistema.' },
    ];

    // 2. Upsert all permissions to ensure they exist
    const createdPermissions = await Promise.all(
      allPermissions.map(p =>
        prisma.permiso.upsert({
          where: { nombrePermiso: p.nombrePermiso },
          update: {},
          create: { ...p, esSistema: true },
        })
      )
    );

    // 3. Upsert the Administrador role
    const adminRole = await prisma.role.upsert({
      where: { nombreRol: 'Administrador' },
      update: {},
      create: {
        nombreRol: 'Administrador',
        descripcion: 'Acceso total a todas las funciones del sistema.',
        prioridad: 1,
        esSistema: true,
      },
    });

    // 4. Link all permissions to the Administrador role
    await prisma.rolePermiso.deleteMany({ where: { rolId: adminRole.id } });
    await prisma.rolePermiso.createMany({
      data: createdPermissions.map(p => ({
        rolId: adminRole.id,
        permisoId: p.id,
        activo: true,
      })),
    });

    // 5. Delete existing admin user if exists
    await prisma.usuario.deleteMany({ where: { username: 'admin' } });

    // 6. Hash password
    const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

    // 7. Create admin user
    const adminUser = await prisma.usuario.create({
      data: {
        id: uuidv4(),
        username: 'admin',
        passwordHash: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        activo: true,
        esEmpleado: true,
        intentosFallidos: 0,
        bloqueadoHasta: null,
      },
    });

    // 8. Assign the Administrador role to the new admin user
    await prisma.usuarioRole.create({
      data: {
        usuarioId: adminUser.id,
        rolId: adminRole.id,
        activo: true,
      },
    });

    res.json({
      success: true,
      message: 'Admin user created successfully with full permissions.',
      username: 'admin',
      password: 'admin123',
      userId: adminUser.id,
      roleId: adminRole.id.toString(),
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user',
      details: error.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.usuario.findMany({
      include: {
        usuariosRoles: {
          include: {
            rol: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// Get user by ID
// Get online users (MUST be before /api/users/:id to avoid route collision)
app.get('/api/users/online', (req, res) => {
  try {
    // Get connected users from the event system
    const connectedUsers = global.eventSystem ? global.eventSystem.getConnectedUsers() : [];

    res.json({
      success: true,
      count: connectedUsers.length,
      users: connectedUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users', message: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// Create user
app.post('/api/users', withBitacora(async (req, res) => {
  const { roles, ...userData } = req.body;

  const userDataForDb = {
    id: uuidv4(),
    username: userData.username,
    nombre: userData.nombre,
    apellido: userData.apellido,
    telefono: userData.telefono || null,
    cedula: userData.cedula || null,
    sexo: userData.sexo || null,
    avatar: userData.avatar || null,
    passwordHash: userData.passwordHash,
    activo: userData.activo ?? true,
  };

  const newUser = await prisma.usuario.create({
    data: userDataForDb
  });

  // Assign roles if provided
  if (roles && roles.length > 0) {
    const roleAssignments = roles.map(roleId => ({
      usuarioId: newUser.id,
      rolId: BigInt(roleId),
      activo: true,
    }));

    await prisma.usuarioRole.createMany({
      data: roleAssignments
    });
  }

  // Fetch user with roles
  const userWithRoles = await prisma.usuario.findUnique({
    where: { id: newUser.id },
    include: {
      usuariosRoles: {
        include: {
          rol: true
        }
      }
    }
  });

  res.status(201).json(userWithRoles);
}, 'CREAR_USUARIO', 'usuarios'));

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { roles, ...updateData } = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Only update user data if there are fields to update
    let updatedUser;
    if (Object.keys(updateData).length > 0) {
      updatedUser = await prisma.usuario.update({
        where: { id },
        data: updateData
      });
    }

    // Update roles if provided
    if (roles !== undefined) {
      // Delete existing role assignments
      await prisma.usuarioRole.deleteMany({
        where: { usuarioId: id }
      });

      // Create new role assignments
      if (roles.length > 0) {
        const roleAssignments = roles.map(roleId => ({
          usuarioId: id,
          rolId: BigInt(roleId),
          activo: true,
        }));

        await prisma.usuarioRole.createMany({
          data: roleAssignments
        });
      }
    }

    // Fetch user with updated roles
    const userWithRoles = await prisma.usuario.findUnique({
      where: { id },
      include: {
        usuariosRoles: {
          include: {
            rol: true
          }
        }
      }
    });

    res.json(userWithRoles);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.usuario.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

// ========== ROLES ENDPOINTS ==========

// Get all roles
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolesPermisos: {
          include: {
            permiso: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles', message: error.message });
  }
});

// Get role by ID
app.get('/api/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role', message: error.message });
  }
});

// Create new role
app.post('/api/roles', withBitacora(async (req, res) => {
  const { permisos, ...roleData } = req.body;

  const roleDataForDb = {
    nombreRol: roleData.nombreRol,
    descripcion: roleData.descripcion,
    prioridad: parseInt(roleData.prioridad) || 0,
    activo: roleData.activo ?? true,
    esSistema: roleData.esSistema ?? false,
  };

  const newRole = await prisma.role.create({
    data: roleDataForDb
  });

  // Assign permissions if provided
  if (permisos && permisos.length > 0) {
    const permissionAssignments = permisos.map(permisoId => ({
      rolId: newRole.id,
      permisoId: BigInt(permisoId),
      activo: true,
    }));

    await prisma.rolePermiso.createMany({
      data: permissionAssignments
    });
  }

  // Fetch role with permissions
  const roleWithPermissions = await prisma.role.findUnique({
    where: { id: newRole.id },
    include: {
      rolesPermisos: {
        include: {
          permiso: true
        }
      }
    }
  });

  res.status(201).json(roleWithPermissions);
}, 'CREAR_ROL', 'roles'));

// Update role
app.put('/api/roles/:id', withBitacora(async (req, res) => {
  const { id } = req.params;
  const { permisos, ...updateData } = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  // Parse prioridad as integer if present
  if (updateData.prioridad !== undefined) {
    updateData.prioridad = parseInt(updateData.prioridad) || 0;
  }

  const updatedRole = await prisma.role.update({
    where: { id: BigInt(id) },
    data: updateData
  });

  // Update permissions if provided
  if (permisos !== undefined) {
    // Delete existing permission assignments
    await prisma.rolePermiso.deleteMany({
      where: { rolId: BigInt(id) }
    });

    // Create new permission assignments
    if (permisos.length > 0) {
      const permissionAssignments = permisos.map(permisoId => ({
        rolId: BigInt(id),
        permisoId: BigInt(permisoId),
        activo: true,
      }));

      await prisma.rolePermiso.createMany({
        data: permissionAssignments
      });
    }
  }

  // Fetch role with updated permissions
  const roleWithPermissions = await prisma.role.findUnique({
    where: { id: BigInt(id) },
    include: {
      rolesPermisos: {
        include: {
          permiso: true
        }
      }
    }
  });

  res.json(roleWithPermissions);
}, 'ACTUALIZAR_ROL', 'roles'));

// Delete role
app.delete('/api/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a system role
    const role = await prisma.role.findUnique({
      where: { id },
      select: { esSistema: true }
    });

    if (role?.esSistema) {
      return res.status(400).json({ error: 'Cannot delete system role' });
    }

    await prisma.role.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting role:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(500).json({ error: 'Failed to delete role', message: error.message });
  }
});

// ========== PERMISOS ENDPOINTS ==========

// Get all permisos
app.get('/api/permisos', async (req, res) => {
  try {
    const permisos = await prisma.permiso.findMany({
      include: {
        rolesPermisos: {
          include: {
            rol: {
              select: {
                id: true,
                nombreRol: true,
                activo: true
              }
            }
          },
          where: {
            activo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(permisos);
  } catch (error) {
    console.error('Error fetching permisos:', error);
    res.status(500).json({ error: 'Failed to fetch permisos', message: error.message });
  }
});

// Check if permiso name exists
app.get('/api/permisos/check/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    const existingPermiso = await prisma.permiso.findFirst({
      where: { nombrePermiso: nombre }
    });
    res.json({ exists: !!existingPermiso });
  } catch (error) {
    console.error('Error checking permiso:', error);
    res.status(500).json({ error: 'Failed to check permiso', message: error.message });
  }
});

// Get permiso by ID
app.get('/api/permisos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const permiso = await prisma.permiso.findUnique({
      where: { id }
    });

    if (!permiso) {
      return res.status(404).json({ error: 'Permiso not found' });
    }

    res.json(permiso);
  } catch (error) {
    console.error('Error fetching permiso:', error);
    res.status(500).json({ error: 'Failed to fetch permiso', message: error.message });
  }
});

// Create new permiso
app.post('/api/permisos', async (req, res) => {
  try {
    const permisoData = {
      nombrePermiso: req.body.nombrePermiso,
      descripcion: req.body.descripcion,
      categoria: req.body.categoria || 'general',
      activo: req.body.activo ?? true,
      esSistema: req.body.esSistema ?? false,
    };

    const newPermiso = await prisma.permiso.create({
      data: permisoData
    });

    res.status(201).json(newPermiso);
  } catch (error) {
    console.error('Error creating permiso:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre_permiso')) {
      return res.status(400).json({
        error: 'El nombre del permiso ya existe',
        message: 'Ya existe un permiso con ese nombre. Por favor, elija un nombre diferente.'
      });
    }

    res.status(500).json({ error: 'Failed to create permiso', message: error.message });
  }
});

// Update permiso
app.put('/api/permisos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    const updatedPermiso = await prisma.permiso.update({
      where: { id },
      data: updateData
    });

    res.json(updatedPermiso);
  } catch (error) {
    console.error('Error updating permiso:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Permiso not found' });
    }
    res.status(500).json({ error: 'Failed to update permiso', message: error.message });
  }
});

// Delete permiso
app.delete('/api/permisos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a system permiso
    const permiso = await prisma.permiso.findUnique({
      where: { id },
      select: { esSistema: true }
    });

    if (permiso?.esSistema) {
      return res.status(400).json({ error: 'Cannot delete system permission' });
    }

    await prisma.permiso.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting permiso:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Permiso not found' });
    }
    res.status(500).json({ error: 'Failed to delete permiso', message: error.message });
  }
});

// ========== EMPRESA ENDPOINTS ==========

// Get all empresa records
app.get('/api/empresa', async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(empresas);
  } catch (error) {
    console.error('Error fetching empresas:', error);
    res.status(500).json({ error: 'Failed to fetch empresas', message: error.message });
  }
});

// Get empresa by ID
app.get('/api/empresa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await prisma.empresa.findUnique({
      where: { id }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa not found' });
    }

    res.json(empresa);
  } catch (error) {
    console.error('Error fetching empresa:', error);
    res.status(500).json({ error: 'Failed to fetch empresa', message: error.message });
  }
});

// Create new empresa
app.post('/api/empresa', withBitacora(async (req, res) => {
  const empresaData = {
    nombre: req.body.nombre,
    razonSocial: req.body.razonSocial || null,
    rnc: req.body.rnc || null,
    telefono: req.body.telefono || null,
    email: req.body.email || null,
    direccion: req.body.direccion || null,
    ciudad: req.body.ciudad || null,
    provincia: req.body.provincia || null,
    codigoPostal: req.body.codigoPostal || null,
    logoUrl: req.body.logoUrl || null,
    sitioWeb: req.body.sitioWeb || null,
    monedaPrincipal: req.body.monedaPrincipal || 'DOP',
  };

  const newEmpresa = await prisma.empresa.create({
    data: empresaData
  });

  res.status(201).json(newEmpresa);
}, 'CREAR_EMPRESA', 'empresa'));

// Update empresa
app.put('/api/empresa/:id', withBitacora(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Remove fields that shouldn't be updated directly
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  const updatedEmpresa = await prisma.empresa.update({
    where: { id },
    data: updateData
  });

  res.json(updatedEmpresa);
}, 'ACTUALIZAR_EMPRESA', 'empresa'));

// Delete empresa
app.delete('/api/empresa/:id', withBitacora(async (req, res) => {
  const { id } = req.params;

  await prisma.empresa.delete({
    where: { id }
  });
}, 'ELIMINAR_EMPRESA', 'empresa'));

// ========== AVERÍAS (TICKETS) ENDPOINTS ==========

// Crear nueva avería (ticket)
app.post('/api/averias', authenticateToken, withBitacora(async (req, res) => {
  const { clienteId, categoria, prioridad, tipo, descripcion, imagenUrl } = req.body || {};

  if (!clienteId || !categoria || !prioridad || !descripcion) {
    return res.status(400).json({ error: 'clienteId, categoria, prioridad y descripcion son requeridos' });
  }

  // Generar número de ticket simple: TCK-YYYYMMDD-XXXX
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  const numeroTicket = `TCK-${ymd}-${random}`;

  const asunto = tipo ? `Avería: ${tipo}` : 'Avería reportada';
  const notas = imagenUrl ? `Imagen adjunta: ${imagenUrl}` : null;

  const nuevo = await prisma.ticket.create({
    data: {
      numeroTicket,
      usuarioId: req.user?.id || req.user?.userId || req.body.usuarioId || uuidv4(),
      clienteId,
      asunto,
      descripcion,
      categoria,
      prioridad: (prioridad || 'media').toLowerCase(),
      estado: 'abierto',
      notas,
    }
  });

  res.status(201).json(nuevo);
}, 'CREAR_TICKET', 'tickets'));

app.use('/api/database', databaseRoutes);
app.use('/api/averias', averiasRoutes);
// Suscripciones (nuevo router con connect/disconnect y numeración CT-YYYYMM-####)
app.use('/api/suscripciones', suscripcionesRoutes);

// Papeleria routes
app.use('/api/papeleria/categorias', categoriaPapeleriaRoutes);
app.use('/api/papeleria/productos', productoPapeleriaRoutes);
app.use('/api/papeleria/clientes', clientePapeleriaRoutes);
app.use('/api/papeleria/ventas', ventaPapeleriaRoutes);

// Mount missing routers
app.use('/api/banks', bankRoutes);
app.use('/api/clients', authenticateToken, attachUserPermissions, clientRoutes);
// Contabilidad
app.use('/api/contabilidad/cuentas-contables', cuentaContableRoutes);
app.use('/api/contabilidad/movimientos', movimientoContableRoutes);
app.use('/api/contabilidad/categorias-cuentas', categoriaCuentaRoutes);

// Debug routes (solo para desarrollo)
const debugCategoriaRoutes = require('./routes/debugCategoriaRoutes');
app.use('/api/debug/categorias', debugCategoriaRoutes);
app.use('/api/contabilidad/cuentas-por-cobrar', cuentasPorCobrarRoutes);

// Cuentas por Pagar Routes
app.use('/api/contabilidad/cuentas-por-pagar', cuentasPorPagarRoutes);

// Proveedores Routes
const proveedorRoutes = require('./routes/proveedorRoutes');
app.use('/api/proveedores', proveedorRoutes);

// RR.HH. Routes
app.use('/api/rrhh/empleados', employeeRoutes);
app.use('/api/rrhh/nomina', payrollRoutes);
app.use('/api/rrhh/prestamos', loanRoutes);

// Bank accounts endpoint for payment forms
const cuentaBancariaService = require('./services/cuentaBancariaService');
app.get('/api/contabilidad/cuentas-bancarias', async (req, res) => {
  try {
    // Get all active bank accounts across all banks
    const allAccounts = await prisma.cuentaBancaria.findMany({
      where: { activo: true },
      include: {
        bank: {
          select: {
            nombre: true,
            codigo: true
          }
        },
        cuentaContable: {
          select: {
            nombre: true,
            saldoActual: true
          }
        }
      },
      orderBy: { numeroCuenta: 'asc' }
    });

    res.json(allAccounts);
  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Bitácora
app.use('/api/bitacora', bitacoraRoutes);

// Public auth routes (no authentication required)
const publicAuthRoutes = ['/api/auth/login', '/api/auth/csrf-token', '/api/auth/refresh', '/api/auth/forgot-password', '/api/auth/unblock'];

// Ruta para consultar permisos del usuario autenticado
// Excluir rutas públicas de autenticación
app.use((req, res, next) => {
  if (publicAuthRoutes.includes(req.path)) {
    return next();
  }
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  return authenticateToken(req, res, next);
});

app.use('/api', mePermissionsRoute);

// Roles y Permisos routes
app.use('/api/roles', roleRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/usuarios', usuarioPermisoRoutes);

// Eventos y Tareas
app.use('/api', eventosAndTareasRoutes);

// KPI Dashboard Endpoint for Papeleria
app.get('/api/papeleria/dashboard-kpis', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Sales today vs yesterday
    const salesToday = await prisma.ventaPapeleria.aggregate({
      _sum: { total: true },
      where: { fechaVenta: { gte: today, lt: tomorrow } },
    });

    const salesYesterday = await prisma.ventaPapeleria.aggregate({
      _sum: { total: true },
      where: { fechaVenta: { gte: yesterday, lt: today } },
    });

    // 2. Products sold in last 24 hours
    const salesLast24h = await prisma.ventaPapeleria.findMany({
      where: { fechaVenta: { gte: last24Hours } },
      include: { detalles: true },
    });
    const productsSoldCount = salesLast24h.reduce((acc, sale) =>
      acc + sale.detalles.reduce((sum, detail) => sum + detail.cantidad, 0),
      0);

    // 3. Total stock value
    const products = await prisma.productoPapeleria.findMany();
    const stockValue = products.reduce((acc, product) =>
      acc + (product.stockActual * parseFloat(product.precioCompra)),
      0);

    // 4. Total sales this month (ventas de papelería)
    const salesThisMonth = await prisma.ventaPapeleria.aggregate({
      _sum: { total: true },
      where: { fechaVenta: { gte: startOfMonth } },
    });

    // 5. Total income movements this month (movimientos contables ADICIONALES, excluyendo los ya registrados en ventas)
    // Nota: Las ventas de papelería ya se registran como movimientos con metodo='papeleria' y tipo='ingreso'
    // Por eso buscamos otros ingresos que NO sean de papelería (ej: devoluciones, reembolsos, etc)
    const otherIngresosThisMonth = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      where: {
        tipo: 'ingreso',
        fecha: { gte: startOfMonth },
        // Excluir movimientos de papelería (ya están en las ventas)
        NOT: {
          metodo: 'papeleria'
        }
      },
    });

    // 6. Total expenses this month (movimientos with metodo 'papeleria' and tipo 'gasto')
    const expensesThisMonthMovimientos = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      where: {
        metodo: 'papeleria',
        tipo: 'gasto',
        fecha: { gte: startOfMonth }
      },
    });

    // Calculate total ingresos (sales + other income movements, pero NO duplicar)
    const totalSalesThisMonth = parseFloat(salesThisMonth._sum?.total || 0);
    const totalOtherIngresos = parseFloat(otherIngresosThisMonth._sum?.monto || 0);
    const totalIngresosMes = totalSalesThisMonth + totalOtherIngresos;

    res.json({
      salesToday: parseFloat(salesToday._sum?.total || 0),
      salesYesterday: parseFloat(salesYesterday._sum?.total || 0),
      productsSoldLast24h: productsSoldCount,
      totalStockValue: stockValue,
      salesThisMonth: totalSalesThisMonth,
      ingresosThisMonth: totalOtherIngresos,
      totalIngresosMes: totalIngresosMes,
      expensesThisMonth: parseFloat(expensesThisMonthMovimientos._sum?.monto || 0),
    });

  } catch (error) {
    console.error('Error fetching papeleria KPI data:', error);
    res.status(500).json({ error: 'Failed to fetch KPI data', message: error.message });
  }
});

// ========== CHAT ENDPOINTS ==========

app.use('/api/chat', authenticateToken, chatRoutes);

// ========== CAJA ENDPOINTS ==========

const cajaRoutes = require('./routes/cajaRoutes');
app.use('/api/cajas', cajaRoutes);

// ========== PLANES ENDPOINTS ==========

// Get all planes
app.get('/api/planes', async (req, res) => {
  try {
    const planes = await PlanService.getAll();
    res.json(planes);
  } catch (error) {
    console.error('Error fetching planes:', error);
    res.status(500).json({ error: 'Failed to fetch planes', message: error.message });
  }
});

// Get plan by ID
app.get('/api/planes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await PlanService.getById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan', message: error.message });
  }
});

// Create new plan
app.post('/api/planes', async (req, res) => {
  try {
    const newPlan = await PlanService.create(req.body);
    res.status(201).json(newPlan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan', message: error.message });
  }
});

// Update plan
app.put('/api/planes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPlan = await PlanService.update(id, req.body);
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.status(500).json({ error: 'Failed to update plan', message: error.message });
  }
});

// Delete plan
app.delete('/api/planes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await PlanService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.status(500).json({ error: 'Failed to delete plan', message: error.message });
  }
});


app.delete('/api/eventos/:id', withBitacora(async (req, res) => {
  const { id } = req.params;

  console.log('🗑️ Server: Deleting event with ID:', id);

  try {
    // First check if the event exists
    const existingEvent = await prisma.evento.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      console.log('❌ Server: Event not found in database:', id);
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    console.log('✅ Server: Event found, proceeding with deletion:', existingEvent);

    await prisma.evento.delete({
      where: { id }
    });

    console.log('✅ Server: Event deleted successfully:', id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Server: Error deleting event:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.status(500).json({ error: 'Failed to delete event', message: error.message });
  }
}, 'ELIMINAR_EVENTO', 'eventos'));



// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error', message: error.message });
});

// ========== BITÁCORA ENDPOINTS ==========

// Debug endpoint - total bitácora records
app.get('/api/bitacora/debug/total', authenticateToken, async (req, res) => {
  try {
    const total = await prisma.bitacora.count();
    const byMonth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', fecha_hora) AS mes,
        COUNT(*) as count
      FROM bitacora
      GROUP BY DATE_TRUNC('month', fecha_hora)
      ORDER BY mes DESC
    `;
    res.json({ totalRecords: total, byMonth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bitácora entries
app.get('/api/bitacora', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, accion, tablaAfectada, usuarioId, resultado, fechaInicio, fechaFin, metodo, viewAll } = req.query;

    const where = {};
    if (accion) where.accion = { contains: accion, mode: 'insensitive' };
    if (tablaAfectada) where.tablaAfectada = tablaAfectada;
    if (usuarioId) where.usuarioId = usuarioId;
    if (resultado) where.resultado = resultado;
    if (metodo) where.metodo = metodo;

    // Add date range filters if provided
    if (fechaInicio || fechaFin) {
      where.fechaHora = {};
      if (fechaInicio) where.fechaHora.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaHora.lte = new Date(fechaFin);
    }

    let skip = 0;
    let take = parseInt(limit);

    // If viewAll is true, don't paginate - get all records
    if (viewAll === 'true') {
      skip = 0;
      take = undefined; // Get all records
    } else {
      skip = (parseInt(page) - 1) * parseInt(limit);
    }

    const [entries, total] = await Promise.all([
      prisma.bitacora.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: { fechaHora: 'desc' },
        skip,
        ...(take !== undefined && { take })
      }),
      prisma.bitacora.count({ where })
    ]);

    res.json({
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / (parseInt(limit) || 1))
      }
    });
  } catch (error) {
    console.error('Error fetching bitácora:', error);
    res.status(500).json({ error: 'Failed to fetch bitácora', message: error.message });
  }
});

// Get bitácora statistics
app.get('/api/bitacora/stats', async (req, res) => {
  try {
    console.log('Fetching bitácora stats...');

    const [
      totalEntries,
      successfulActions,
      failedActions,
      actionsByTable,
      recentActivity
    ] = await Promise.all([
      prisma.bitacora.count(),
      prisma.bitacora.count({ where: { resultado: 'exitoso' } }),
      prisma.bitacora.count({ where: { resultado: 'error' } }),
      prisma.bitacora.groupBy({
        by: ['tablaAfectada'],
        _count: { tablaAfectada: true },
        orderBy: { _count: { tablaAfectada: 'desc' } },
        where: {
          tablaAfectada: {
            not: null
          }
        }
      }),
      prisma.bitacora.findMany({
        take: 10,
        orderBy: { fechaHora: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellido: true
            }
          }
        }
      })
    ]);

    console.log('Stats fetched successfully:', { totalEntries, successfulActions, failedActions });

    // Convert BigInt values to strings for JSON serialization
    const processedRecentActivity = recentActivity.map(entry => ({
      ...entry,
      id: entry.id.toString(),
      usuarioId: entry.usuarioId ? entry.usuarioId.toString() : null,
      registroAfectadoId: entry.registroAfectadoId ? entry.registroAfectadoId.toString() : null,
      fechaHora: entry.fechaHora.toISOString()
    }));

    const stats = {
      totalEntries,
      successfulActions,
      failedActions,
      successRate: totalEntries > 0 ? ((successfulActions / totalEntries) * 100).toFixed(2) + '%' : '0%',
      actionsByTable: actionsByTable.map(item => ({
        tabla: item.tablaAfectada || 'Sin especificar',
        count: item._count.tablaAfectada
      })),
      recentActivity: processedRecentActivity
    };

    console.log('Sending stats response');
    res.json(stats);
  } catch (error) {
    console.error('Error fetching bitácora stats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch bitácora stats',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get bitácora entry by ID
app.get('/api/bitacora/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number before converting to BigInt
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid ID format. ID must be a number.' });
    }

    const entry = await prisma.bitacora.findUnique({
      where: { id: BigInt(id) },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Bitácora entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching bitácora entry:', error);
    res.status(500).json({ error: 'Failed to fetch bitácora entry', message: error.message });
  }
});

// Delete bitácora entries (single or bulk)
app.delete('/api/bitacora', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs para eliminar' });
    }

    // Validate all IDs are valid numbers
    const invalidIds = ids.filter(id => !/^\d+$/.test(id.toString()));
    if (invalidIds.length > 0) {
      return res.status(400).json({ error: 'Formato de ID inválido. Los IDs deben ser números.' });
    }

    // Convert to BigInt
    const bigIntIds = ids.map(id => BigInt(id));

    // Delete entries
    const result = await prisma.bitacora.deleteMany({
      where: {
        id: {
          in: bigIntIds
        }
      }
    });

    res.json({
      success: true,
      message: `${result.count} entrada(s) eliminada(s) exitosamente`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting bitácora entries:', error);
    res.status(500).json({ error: 'Error al eliminar entradas de bitácora', message: error.message });
  }
});

// ========== AUTHENTICATION ENDPOINTS ==========

// CSRF Token generation
app.get('/api/auth/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.json({ csrfToken: token });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, rememberMe, captcha } = req.body;

    console.log('🔍 Login attempt:', { username, hasPassword: !!password });

    // Input validation
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    // Security: Validate username format and length
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Formato de usuario inválido'
      });
    }

    if (/[<>;]/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Caracteres no permitidos en el usuario'
      });
    }

    // Find user
    console.log('🔎 Searching for user:', username);
    const user = await prisma.usuario.findFirst({
      where: {
        username: username,
        activo: true
      },
      include: {
        usuariosRoles: {
          include: {
            rol: {
              include: {
                rolesPermisos: {
                  include: {
                    permiso: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('👤 User found:', user ? { id: user.id, username: user.username, hasPassword: !!user.passwordHash } : 'No user found');

    if (!user) {
      console.log('❌ User not found in database');
      await logAction(
        null,
        'LOGIN_FAILED',
        'usuarios',
        null,
        null,
        { username, reason: 'Usuario no encontrado' },
        req,
        'error',
        'Usuario no encontrado'
      );

      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Check if account is blocked
    if (user.bloqueadoHasta && new Date() < user.bloqueadoHasta) {
      return res.status(423).json({
        success: false,
        error: 'Cuenta temporalmente bloqueada. Intenta más tarde.'
      });
    }

    if (!user.passwordHash) {
      console.error(`Error: User '${username}' found but has no password hash.`);
      await logAction(
        user.id,
        'LOGIN_FAILED',
        'usuarios',
        user.id,
        null,
        { username, reason: 'El hash de la contraseña no está configurado' },
        req,
        'error',
        'El hash de la contraseña no está configurado para el usuario'
      );
      return res.status(500).json({
        success: false,
        error: 'Error de configuración de la cuenta. Por favor, contacte al administrador.'
      });
    }

    // Verify password
    console.log('🔐 Verifying password for user:', user.username);
    let isValidPassword = false;

    if (user.passwordHash && user.passwordHash.length < 20) {
      console.log('🔐 Using plain text comparison (legacy)');
      isValidPassword = password === user.passwordHash;
    } else {
      console.log('🔐 Using bcrypt comparison');
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
    }

    console.log('🔐 Password validation result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Password validation failed');
      const newFailedAttempts = (user.intentosFallidos || 0) + 1;
      const updateData = {
        intentosFallidos: newFailedAttempts
      };

      if (newFailedAttempts >= 5) {
        updateData.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await prisma.usuario.update({
        where: { id: user.id },
        data: updateData
      });

      await logAction(
        user.id,
        'LOGIN_FAILED',
        'usuarios',
        user.id,
        null,
        { username, reason: 'Contraseña incorrecta', attempts: newFailedAttempts },
        req,
        'error',
        'Contraseña incorrecta'
      );

      return res.status(401).json({
        success: false,
        error: newFailedAttempts >= 5 ?
          'Cuenta bloqueada por múltiples intentos fallidos' :
          'Credenciales inválidas'
      });
    }

    console.log('✅ Password validation successful. Proceeding to generate tokens.');

    if (user.intentosFallidos > 0) {
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          intentosFallidos: 0,
          bloqueadoHasta: null,
          ultimoAcceso: new Date()
        }
      });
    }

    // Collect user permissions
    const permissions = [];
    user.usuariosRoles.forEach(ur => {
      ur.rol.rolesPermisos.forEach(rp => {
        if (rp.activo && !permissions.find(p => p.nombrePermiso === rp.permiso.nombrePermiso)) {
          permissions.push({
            id: rp.permiso.id,
            nombrePermiso: rp.permiso.nombrePermiso
          });
        }
      });
    });

    // --- SESSION CREATION START ---

    // Generate UUID for session
    const sessionId = uuidv4();

    // 1. Generate Refresh Token first (to store its hash/expiration)
    const refreshTokenExpiresIn = '30d';
    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    const refreshToken = jwt.sign(
      { id: user.id, sessionId: sessionId }, // Include sessionId
      JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiresIn }
    );

    // 2. Create Session Record
    // Store a hash of the refresh token for security validation (optional but good practice)
    // Or just store the token itself if column is big enough, but hash is safer.
    // The schema says `tokenHash String`, let's hash the refresh token.
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const userAgent = req.get('User-Agent') || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    await prisma.sesionUsuario.create({
      data: {
        id: sessionId,
        usuarioId: user.id,
        tokenHash: tokenHash,
        ipAddress: ipAddress,
        userAgent: userAgent,
        fechaExpiracion: expirationDate,
        activa: true
      }
    });

    // 3. Generate Access Token (link to session)
    const tokenPayload = {
      id: user.id,
      sessionId: sessionId, // Critical Link
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      roles: user.usuariosRoles.map(ur => ur.rol.nombreRol),
      permisos: permissions
    };

    const accessToken = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '8h' }
    );

    // --- SESSION CREATION END ---

    console.log('🔑 Tokens generated successfully.');
    console.log(`   - Session ID: ${sessionId}`);

    const permissionNames = permissions.map(p => p.nombrePermiso);

    await logAction(
      user.id,
      'LOGIN_SUCCESS',
      'usuarios',
      user.id,
      null,
      { username, rememberMe, sessionId },
      req,
      'exitoso'
    );

    console.log('📤 Sending success response to client.');

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        avatar: user.avatar,
        roles: user.usuariosRoles.map(ur => ur.rol.nombreRol),
        permissions: permissionNames
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader && authHeader.split(' ')[1];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token requerido'
      });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Refresh token inválido'
        });
      }

      const { sessionId } = decoded;

      // 1. Verify Session if sessionId exists (it should for new tokens)
      if (sessionId) {
        const session = await prisma.sesionUsuario.findUnique({
          where: { id: sessionId }
        });

        if (!session || !session.activa) {
          return res.status(403).json({
            success: false,
            error: 'Sesión inválida o expirada'
          });
        }

        // Update last use
        await prisma.sesionUsuario.update({
          where: { id: sessionId },
          data: { fechaUltimoUso: new Date() }
        });
      }

      // Get user data with roles and permissions
      const user = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        include: {
          usuariosRoles: {
            include: {
              rol: {
                include: {
                  rolesPermisos: {
                    where: { activo: true },
                    include: { permiso: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!user || !user.activo) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado o inactivo'
        });
      }

      // Collect permissions
      const permissions = [];
      user.usuariosRoles.forEach(ur => {
        ur.rol.rolesPermisos.forEach(rp => {
          if (!permissions.find(p => p.nombrePermiso === rp.permiso.nombrePermiso)) {
            permissions.push({
              id: rp.permiso.id,
              nombrePermiso: rp.permiso.nombrePermiso
            });
          }
        });
      });

      // Generate new access token with permisos included
      const tokenPayload = {
        id: user.id,
        sessionId: sessionId, // Propagate session ID
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        roles: user.usuariosRoles.map(ur => ur.rol.nombreRol),
        permisos: permissions
      };

      const newAccessToken = jwt.sign(
        tokenPayload,
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      const permissionNames = permissions.map(p => p.nombrePermiso);

      res.json({
        success: true,
        token: newAccessToken,
        user: {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          apellido: user.apellido,
          avatar: user.avatar,
          roles: user.usuariosRoles.map(ur => ur.rol.nombreRol),
          permissions: permissionNames
        }
      });
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Invalidate session in DB
    if (req.user && req.user.sessionId) {
      try {
        await prisma.sesionUsuario.update({
          where: { id: req.user.sessionId },
          data: { activa: false }
        });
        console.log(`🔒 Session ${req.user.sessionId} invalidated.`);
      } catch (e) {
        console.warn(`Could not invalidate session ${req.user.sessionId}:`, e.message);
      }
    }

    // Log logout
    await logAction(
      req.user.id,
      'LOGOUT',
      'usuarios',
      req.user.id,
      null,
      { username: req.user.username },
      req,
      'exitoso'
    );

    // Forcefully disconnect user from SSE
    if (global.eventSystem) {
      global.eventSystem.disconnectUser(req.user.id);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Get session history (for Users > Session History page)
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, username } = req.query;

    // Build where clause
    const where = {};
    if (username) {
      where.usuario = {
        username: { contains: username, mode: 'insensitive' }
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [sessions, total] = await Promise.all([
      prisma.sesionUsuario.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellido: true,
              avatar: true,
              esEmpleado: true
            }
          }
        },
        orderBy: { fechaInicio: 'desc' },
        skip,
        take
      }),
      prisma.sesionUsuario.count({ where })
    ]);

    res.json({
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / (Number(limit) || 1))
      }
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions', message: error.message });
  }
});

// Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.userId },
      include: {
        usuariosRoles: {
          include: {
            rol: {
              include: {
                rolesPermisos: {
                  include: {
                    permiso: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Extract roles and permissions
    const roles = user.usuariosRoles.map(ur => ur.rol.nombreRol);
    const permissions = user.usuariosRoles.flatMap(ur =>
      ur.rol.rolesPermisos.map(rp => rp.permiso.nombrePermiso)
    );

    res.json({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      roles: [...new Set(roles)],
      permissions: [...new Set(permissions)]
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Admin endpoint to unblock user account
app.post('/api/auth/unblock/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.usuario.update({
      where: { username },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });

    console.log(`Account unblocked for user: ${username}`);
    res.json({
      message: 'Cuenta desbloqueada exitosamente',
      username: user.username
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva son requeridas'
      });
    }

    // Get user
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Log password change
    await logAction(
      req.user.id,
      'PASSWORD_CHANGE',
      'usuarios',
      req.user.id,
      null,
      { username: req.user.username },
      req,
      'exitoso'
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // In a real application, you would:
    // 1. Find user by email
    // 2. Generate a secure reset token
    // 3. Send email with reset link
    // 4. Store token with expiration

    // For now, just return success (security by obscurity)
    res.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Protected route middleware for other endpoints
const protectRoute = (req, res, next) => {
  // Skip authentication for health check and auth routes
  if (req.path === '/health' || req.path.startsWith('/api/auth/')) {
    return next();
  }

  return authenticateToken(req, res, next);
};

// Apply protection to all API routes except auth and specific public service endpoints
app.use('/api', (req, res, next) => {
  // List of paths that do NOT require authentication
  const publicPaths = [
    '/auth/',
    '/categorias', // Assuming /api/categorias is public for now
    '/servicios', // Assuming /api/servicios is public for now
    '/planes', // Assuming /api/planes is public for now
    '/contabilidad/categorias-cuentas', // Make this public for IngresosGastos to fetch categories
    '/contabilidad/movimientos', // Temporarily make this public for testing
    '/contabilidad/balance/', // Make balance endpoints public for IngresosGastos
    '/cuentas-contables', // Make this public for Banks to fetch accounts,
    '/averias', // Make this public for now, authentication is handled within averiasRoutes
    '/cajas/dashboard', // Make dashboard endpoints public for viewing without authentication
  ];

  // Check if the request path starts with any of the public paths
  const isPublicPath = publicPaths.some(path => req.path.startsWith(path));

  if (isPublicPath) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// ============================================
// ENDPOINTS PARA CATEGORÍAS
// ============================================

// Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const categorias = await CategoriaService.getAllCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error fetching categorias:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Obtener categoría por ID
app.get('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await CategoriaService.getCategoriaById(id);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(categoria);
  } catch (error) {
    console.error('Error fetching categoria:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

// Crear nueva categoría
app.post('/api/categorias', withBitacora(async (req, res) => {
  try {
    const { nombre, descripcion, icono, color, orden } = req.body;

    // Validation
    if (icono && icono.length > 100) {
      return res.status(400).json({
        error: 'El ícono es demasiado largo.',
        message: 'El campo de ícono solo debe contener el nombre del Material Icon (ej: "wifi", "settings"), no el código HTML completo. El valor no debe exceder los 100 caracteres.'
      });
    }

    const categoria = await CategoriaService.createCategoria({
      nombre,
      descripcion,
      icono,
      color,
      orden: orden || 0
    });

    res.status(201).json(categoria);
  } catch (error) {
    console.error('Error creating categoria:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    } else if (error.code === 'P2000') {
      res.status(400).json({ error: `El valor para la columna '${error.meta.target}' es demasiado largo.` });
    }
    else {
      res.status(500).json({ error: 'Error al crear categoría' });
    }
  }
}, 'CREAR_CATEGORIA', 'categorias'));

// Actualizar categoría
app.put('/api/categorias/:id', withBitacora(async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, icono, color, activo, orden } = req.body;

    const categoria = await CategoriaService.updateCategoria(id, {
      nombre,
      descripcion,
      icono,
      color,
      activo,
      orden
    });

    res.json(categoria);
  } catch (error) {
    console.error('Error updating categoria:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Categoría no encontrada' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error al actualizar categoría' });
    }
  }
}, 'ACTUALIZAR_CATEGORIA', 'categorias'));

// Eliminar categoría
app.delete('/api/categorias/:id', withBitacora(async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene servicios asociados
    const servicesCount = await prisma.servicio.count({
      where: { categoriaId: id }
    });

    if (servicesCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la categoría.',
        message: `Esta categoría tiene ${servicesCount} servicio(s) asociado(s). Por favor, reasigne o elimine los servicios antes de eliminar la categoría.`
      });
    }

    await CategoriaService.deleteCategoria(id);

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting categoria:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Categoría no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al eliminar categoría' });
    }
  }
}, 'ELIMINAR_CATEGORIA', 'categorias'));

// ============================================
// ENDPOINTS PARA SERVICIOS
// ============================================

// Test endpoint to check Prisma client (bypass authentication)
app.get('/api/test-prisma', (req, res) => {
  // Bypass authentication for this test endpoint
  // Create a mock async function to test Prisma
  (async () => {
    try {
      // Simple query to test Prisma client
      const count = await prisma.servicio.count();
      res.json({ success: true, count });
    } catch (error) {
      console.error('Prisma client test error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  })();
});

// Obtener todos los servicios
app.get('/api/servicios', async (req, res) => {
  try {
    const { categoria, tipo, activo } = req.query;

    const where = {};
    if (categoria) where.categoriaId = categoria;
    if (tipo) where.tipo = tipo;
    if (activo !== undefined) where.activo = activo === 'true';

    const servicios = await prisma.servicio.findMany({
      where,
      include: {
        categoria: {
          include: {
            planes: {
              where: { activo: true },
              orderBy: [{ orden: 'asc' }]
            }
          }
        },
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }]
    });

    res.json(servicios);
  } catch (error) {
    console.error('Error fetching servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// Obtener servicio por ID
app.get('/api/servicios/:id', async (req, res) => {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: req.params.id },
      include: {
        categoria: true,
        planes: {
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    console.error('Error fetching servicio:', error);
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
});

// Crear nuevo servicio
app.post('/api/servicios', async (req, res) => {
  try {
    const {
      nombre, descripcion, descripcionCorta, categoriaId, tipo,
      esRecurrente, requierePlan, precioBase, moneda, unidadTiempo,
      imagen, caracteristicas, destacado, orden
    } = req.body;

    const servicio = await prisma.servicio.create({
      data: {
        nombre,
        descripcion,
        descripcionCorta,
        categoriaId: categoriaId,
        tipo,
        esRecurrente: esRecurrente || false,
        requierePlan: requierePlan || false,
        precioBase: (precioBase === 0 || precioBase) ? parseFloat(precioBase) : null,
        moneda: moneda || 'USD',
        unidadTiempo,
        imagen,
        caracteristicas,
        destacado: destacado || false,
        orden: orden || 0
      },
      include: {
        categoria: true
      }
    });

    res.status(201).json(servicio);
  } catch (error) {
    console.error('Error creating servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// Actualizar servicio
app.put('/api/servicios/:id', async (req, res) => {
  try {
    const {
      nombre, descripcion, descripcionCorta, categoriaId, tipo,
      esRecurrente, requierePlan, precioBase, moneda, unidadTiempo,
      imagen, caracteristicas, activo, destacado, orden
    } = req.body;

    // Validate required fields
    if (!categoriaId) {
      return res.status(400).json({ error: 'La categoría es requerida' });
    }

    // Validate categoriaId exists
    const categoriaExists = await prisma.categoria.findUnique({
      where: { id: categoriaId }
    });
    if (!categoriaExists) {
      return res.status(400).json({ error: 'La categoría especificada no existe' });
    }

    const servicio = await prisma.servicio.update({
      where: { id: req.params.id },
      data: {
        nombre,
        descripcion,
        descripcionCorta,
        categoriaId: categoriaId ? categoriaId : undefined,
        tipo,
        esRecurrente,
        requierePlan,
        precioBase: (precioBase === 0 || precioBase) ? parseFloat(precioBase) : (precioBase === null ? null : undefined),
        moneda,
        unidadTiempo,
        imagen,
        caracteristicas,
        activo,
        destacado,
        orden
      },
      include: {
        categoria: true
      }
    });

    console.log('✅ Servicio updated successfully');
    res.json(servicio);
  } catch (error) {
    console.error('❌ Error updating servicio:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Servicio no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al actualizar servicio', details: error.message });
    }
  }
});

// Eliminar servicio
app.delete('/api/servicios/:id', async (req, res) => {
  try {
    // Verificar si tiene suscripciones asociadas
    const suscripcionesCount = await prisma.suscripcion.count({
      where: { servicioId: req.params.id }
    });

    if (suscripcionesCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el servicio.',
        message: `Este servicio tiene ${suscripcionesCount} suscripción(es) asociada(s). Por favor, reasigne o elimine las suscripciones antes de eliminar el servicio.`
      });
    }

    // Verificar si tiene contratos asociados
    const contratosCount = await prisma.contrato.count({
      where: { servicioId: req.params.id }
    });

    if (contratosCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el servicio.',
        message: `Este servicio tiene ${contratosCount} contrato(s) asociado(s). Por favor, reasigne o elimine los contratos antes de eliminar el servicio.`
      });
    }

    // Verificar si tiene detalles de factura asociados
    const detallesFacturaCount = await prisma.detalleFacturaCliente.count({
      where: { servicioId: req.params.id }
    });

    if (detallesFacturaCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el servicio.',
        message: `Este servicio tiene ${detallesFacturaCount} detalle(s) de factura asociado(s). Por favor, reasigne o elimine los detalles de factura antes de eliminar el servicio.`
      });
    }

    await prisma.servicio.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Servicio eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting servicio:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Servicio no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al eliminar servicio' });
    }
  }
});


// ============================================
// ENDPOINTS PARA PLANES
// ============================================

// Obtener todos los planes
app.get('/api/planes', async (req, res) => {
  try {
    const { servicioId, activo } = req.query;

    const where = {};
    if (servicioId) where.servicioId = servicioId;
    if (activo !== undefined) where.activo = activo === 'true';

    const planes = await prisma.plan.findMany({
      where,
      include: {
        servicio: true
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }]
    });

    res.json(planes);
  } catch (error) {
    console.error('Error fetching planes:', error);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
});

// Obtener plan por ID
app.get('/api/planes/:id', async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: BigInt(req.params.id) },
      include: {
        servicio: true
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Error al obtener plan' });
  }
});

// Crear nuevo plan
app.post('/api/planes', async (req, res) => {
  try {
    const {
      nombre, descripcion, servicioId, precio, moneda,
      subidaKbps, bajadaMkbps, detalles, activo, orden
    } = req.body;

    const plan = await prisma.plan.create({
      data: {
        nombre,
        descripcion,
        servicioId,
        precio: parseFloat(precio),
        moneda: moneda || 'USD',
        subidaKbps: subidaKbps ? parseInt(subidaKbps) : null,
        bajadaMkbps: bajadaMkbps ? parseInt(bajadaMkbps) : null,
        detalles,
        activo: activo !== undefined ? activo : true,
        orden: orden || 0
      },
      include: {
        servicio: true
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Error al crear plan' });
  }
});

// Actualizar plan
app.put('/api/planes/:id', async (req, res) => {
  try {
    const {
      nombre, descripcion, servicioId, precio, moneda,
      subidaKbps, bajadaMkbps, detalles, activo, orden
    } = req.body;

    const plan = await prisma.plan.update({
      where: { id: BigInt(req.params.id) },
      data: {
        nombre,
        descripcion,
        servicioId,
        precio: precio ? parseFloat(precio) : undefined,
        moneda,
        subidaKbps: subidaKbps !== undefined ? (subidaKbps ? parseInt(subidaKbps) : null) : undefined,
        bajadaMkbps: bajadaMkbps !== undefined ? (bajadaMkbps ? parseInt(bajadaMkbps) : null) : undefined,
        detalles,
        activo,
        orden
      },
      include: {
        servicio: true
      }
    });

    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Plan no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al actualizar plan' });
    }
  }
});

// Eliminar plan
app.delete('/api/planes/:id', async (req, res) => {
  try {
    await prisma.plan.delete({
      where: { id: BigInt(req.params.id) }
    });

    res.json({ message: 'Plan eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Plan no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al eliminar plan' });
    }
  }
});

// ============================================
// ENDPOINTS PARA EQUIPOS CLIENTE
// ============================================

// Obtener todos los equipos de cliente
app.get('/api/equipos-cliente', async (req, res) => {
  try {
    const equipos = await prisma.equipoCliente.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            codigoCliente: true
          }
        },
        suscripcion: {
          select: {
            id: true,
            numeroContrato: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(equipos);
  } catch (error) {
    console.error('Error fetching equipos cliente:', error);
    res.status(500).json({ error: 'Error al obtener equipos de cliente' });
  }
});

// Obtener equipo cliente por ID
app.get('/api/equipos-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await prisma.equipoCliente.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            codigoCliente: true
          }
        },
        suscripcion: {
          select: {
            id: true,
            numeroContrato: true
          }
        }
      }
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json(equipo);
  } catch (error) {
    console.error('Error fetching equipo cliente:', error);
    res.status(500).json({ error: 'Error al obtener equipo de cliente' });
  }
});

// Crear nuevo equipo cliente
app.post('/api/equipos-cliente', async (req, res) => {
  try {
    const {
      clienteId,
      suscripcionId,
      contratoId,
      tipoEquipo,
      marca,
      modelo,
      numeroSerie,
      macAddress,
      ipAsignada,
      estado,
      fechaInstalacion,
      fechaRetiro,
      ubicacion,
      notas
    } = req.body;

    // Validate required fields
    if (!clienteId || !tipoEquipo || !marca || !modelo || !numeroSerie) {
      return res.status(400).json({ error: 'Cliente, tipo de equipo, marca, modelo y número de serie son requeridos' });
    }

    // Create equipment
    const equipo = await prisma.equipoCliente.create({
      data: {
        clienteId,
        suscripcionId: suscripcionId || null,
        contratoId: contratoId || null,
        tipoEquipo,
        marca,
        modelo,
        numeroSerie,
        macAddress: macAddress || null,
        ipAsignada: ipAsignada || null,
        estado: estado || 'instalado',
        fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : null,
        fechaRetiro: fechaRetiro ? new Date(fechaRetiro) : null,
        ubicacion: ubicacion || null,
        notas: notas || null,
      }
    });

    res.status(201).json(equipo);
  } catch (error) {
    console.error('Error creating equipo cliente:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un equipo con ese número de serie' });
    } else {
      res.status(500).json({ error: 'Error al crear equipo de cliente' });
    }
  }
});

// Actualizar equipo cliente
app.put('/api/equipos-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      clienteId,
      suscripcionId,
      contratoId,
      tipoEquipo,
      marca,
      modelo,
      numeroSerie,
      macAddress,
      ipAsignada,
      estado,
      fechaInstalacion,
      fechaRetiro,
      ubicacion,
      notas
    } = req.body;

    // Check if equipment exists
    const existingEquipo = await prisma.equipoCliente.findUnique({
      where: { id }
    });

    if (!existingEquipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Validate required fields
    if (!clienteId || !tipoEquipo || !marca || !modelo || !numeroSerie) {
      return res.status(400).json({ error: 'Cliente, tipo de equipo, marca, modelo y número de serie son requeridos' });
    }

    // Update equipment
    const updatedEquipo = await prisma.equipoCliente.update({
      where: { id },
      data: {
        clienteId,
        suscripcionId: suscripcionId || null,
        contratoId: contratoId || null,
        tipoEquipo,
        marca,
        modelo,
        numeroSerie,
        macAddress: macAddress || null,
        ipAsignada: ipAsignada || null,
        estado,
        fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : null,
        fechaRetiro: fechaRetiro ? new Date(fechaRetiro) : null,
        ubicacion: ubicacion || null,
        notas: notas || null,
      }
    });

    res.json(updatedEquipo);
  } catch (error) {
    console.error('Error updating equipo cliente:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un equipo con ese número de serie' });
    } else {
      res.status(500).json({ error: 'Error al actualizar equipo de cliente' });
    }
  }
});

// Eliminar equipo cliente
app.delete('/api/equipos-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if equipment exists
    const equipo = await prisma.equipoCliente.findUnique({
      where: { id }
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Delete the equipment
    await prisma.equipoCliente.delete({
      where: { id }
    });

    res.json({ message: 'Equipo eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting equipo cliente:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Equipo no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al eliminar equipo de cliente' });
    }
  }
});

// ============================================
// ENDPOINTS PARA SUSCRIPCIONES
// ============================================
// Obtener todas las suscripciones
app.get('/api/suscripciones', async (req, res) => {
  try {
    const suscripciones = await prisma.suscripcion.findMany({
      include: {
        cliente: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                username: true
              }
            }
          }
        },
        servicio: {
          select: {
            id: true,
            nombre: true,
            precioBase: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match the expected format
    const transformedSuscripciones = suscripciones.map(sus => ({
      id: sus.id,
      numeroContrato: sus.numeroContrato,
      precioMensual: sus.precioMensual,
      fechaInicio: sus.fechaInicio,
      estado: sus.estado,
      descuentoAplicado: sus.descuentoAplicado,
      diaFacturacion: sus.diaFacturacion,
      notasInstalacion: sus.notasInstalacion,
      notasServicio: sus.notasServicio,
      cliente: sus.cliente ? {
        id: sus.cliente.id,
        nombre: sus.cliente.nombre,
        apellido: sus.cliente.apellidos,
        codigoCliente: sus.cliente.codigoCliente,
        fechaSuscripcion: sus.cliente.fechaSuscripcion
      } : null,
      servicio: sus.servicio,
      plan: sus.plan
    }));

    res.json(transformedSuscripciones);
  } catch (error) {
    console.error('Error fetching suscripciones:', error);
    res.status(500).json({ error: 'Failed to fetch suscripciones', message: error.message });
  }
});

// Crear nueva suscripción
app.post('/api/suscripciones', authenticateToken, async (req, res) => {
  try {
    const {
      clienteId,
      servicioId,
      planId,
      fechaInicio,
      precioMensual,
      descuentoAplicado,
      diaFacturacion,
      notasInstalacion,
      notasServicio
    } = req.body;

    // Validate required fields
    if (!clienteId || !fechaInicio) {
      return res.status(400).json({ error: 'Cliente y fecha de inicio son requeridos' });
    }

    if (!servicioId && !planId) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un servicio o un plan' });
    }

    // Auto-generate contract number
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

    // Find the last contract number for this month/year
    const lastSuscripcion = await prisma.suscripcion.findFirst({
      where: {
        numeroContrato: {
          startsWith: `CON-${currentYear}${currentMonth}-`
        }
      },
      orderBy: {
        numeroContrato: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastSuscripcion) {
      const lastNumber = parseInt(lastSuscripcion.numeroContrato.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const numeroContrato = `CON-${currentYear}${currentMonth}-${String(nextNumber).padStart(3, '0')}`;

    // Create subscription
    const suscripcion = await prisma.suscripcion.create({
      data: {
        cliente: {
          connect: { id: clienteId }
        },
        servicioId: servicioId || null, // Optional service
        planId: planId ? BigInt(planId) : null, // Optional plan, convert to BigInt
        usuarioId: req.user?.id || null, // Get from authenticated user, will be null if not available
        numeroContrato,
        fechaInicio: new Date(fechaInicio),
        precioMensual: parseFloat(precioMensual) || 0,
        descuentoAplicado: parseFloat(descuentoAplicado) || 0,
        diaFacturacion: parseInt(diaFacturacion) || 1,
        notasInstalacion: notasInstalacion || null,
        notasServicio: notasServicio || null,
        estado: 'pendiente'
      },
      include: {
        cliente: true,
        plan: true,
        servicio: true
      }
    });

    res.status(201).json(suscripcion);

    // Emit create event for subscription
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('suscripcion', 'create', suscripcion.id, {
        clienteId: suscripcion.clienteId,
        numeroContrato: suscripcion.numeroContrato,
        precioMensual: suscripcion.precioMensual
      });
    }
  } catch (error) {
    console.error('Error creating suscripcion:', error);
    res.status(500).json({ error: 'Error al crear suscripción', message: error.message });
  }
});

// Actualizar estado de suscripción
app.patch('/api/suscripciones/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar que el estado sea válido
    const estadosValidos = ['activo', 'pendiente', 'suspendida', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const suscripcion = await prisma.suscripcion.update({
      where: { id },
      data: { estado },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            codigoCliente: true
          }
        },
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

    console.log(`✅ Suscripción ${id} actualizada a estado: ${estado}`);

    // Emit update event
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('suscripcion', 'update', suscripcion.id, {
        clienteId: suscripcion.clienteId,
        estado: suscripcion.estado
      });
    }

    res.json(suscripcion);
  } catch (error) {
    console.error('Error updating suscripcion status:', error);
    res.status(500).json({ error: 'Error al actualizar estado de suscripción' });
  }
});

// Actualizar suscripción
app.put('/api/suscripciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      clienteId,
      servicioId,
      planId,
      fechaInicio,
      precioMensual,
      descuentoAplicado,
      diaFacturacion,
      notasInstalacion,
      notasServicio
    } = req.body;

    // Check if subscription exists
    const existingSubscription = await prisma.suscripcion.findUnique({
      where: { id }
    });

    if (!existingSubscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    // Validate required fields
    if (!clienteId || !fechaInicio) {
      return res.status(400).json({ error: 'Cliente y fecha de inicio son requeridos' });
    }

    if (!servicioId && !planId) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un servicio o un plan' });
    }

    // Update subscription
    const updatedSuscripcion = await prisma.suscripcion.update({
      where: { id },
      data: {
        clienteId,
        servicioId: servicioId || null,
        planId: planId ? BigInt(planId) : null,
        fechaInicio: new Date(fechaInicio),
        precioMensual: parseFloat(precioMensual) || 0,
        descuentoAplicado: parseFloat(descuentoAplicado) || 0,
        diaFacturacion: parseInt(diaFacturacion) || 1,
        notasInstalacion: notasInstalacion || null,
        notasServicio: notasServicio || null,
      }
    });

    res.json(updatedSuscripcion);

    // Emit update event for subscription
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('suscripcion', 'update', updatedSuscripcion.id, {
        clienteId: updatedSuscripcion.clienteId,
        numeroContrato: updatedSuscripcion.numeroContrato,
        precioMensual: updatedSuscripcion.precioMensual
      });
    }
  } catch (error) {
    console.error('Error updating suscripcion:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Suscripción no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al actualizar suscripción' });
    }
  }
});

// Eliminar suscripción
app.delete('/api/suscripciones/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subscription exists
    const subscription = await prisma.suscripcion.findUnique({
      where: { id }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    // Check if subscription has associated equipment
    const equipmentCount = await prisma.equipoCliente.count({
      where: { suscripcionId: id }
    });

    if (equipmentCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la suscripción.',
        message: `Esta suscripción tiene ${equipmentCount} equipo(s) asociado(s). Por favor, reasigne o elimine los equipos antes de eliminar la suscripción.`
      });
    }

    // Check if subscription has associated tickets
    const ticketCount = await prisma.ticket.count({
      where: { suscripcionId: id }
    });

    if (ticketCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la suscripción.',
        message: `Esta suscripción tiene ${ticketCount} ticket(s) asociado(s). Por favor, reasigne o elimine los tickets antes de eliminar la suscripción.`
      });
    }

    // Check if subscription has associated invoices
    const invoiceCount = await prisma.factura.count({
      where: { suscripcionId: id }
    });

    if (invoiceCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la suscripción.',
        message: `Esta suscripción tiene ${invoiceCount} factura(s) asociada(s). Por favor, reasigne o elimine las facturas antes de eliminar la suscripción.`
      });
    }

    // Delete the subscription
    await prisma.suscripcion.delete({
      where: { id }
    });

    // Emit delete event for subscription
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('suscripcion', 'delete', id, {
        clienteId: subscription.clienteId
      });
    }

    res.json({ message: 'Suscripción eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting suscripcion:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Suscripción no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al eliminar suscripción' });
    }
  }
});

// ============================================
// ENDPOINTS PARA FACTURAS
// ============================================
app.use('/api/facturas', facturaRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================
// REAL-TIME EVENTS SYSTEM (SSE)
// ============================================

// SSE Connection endpoint (supports both header auth and query param auth)
app.get('/api/events', (req, res, next) => {
  const logger = require('./utils/logger');

  // Try to authenticate with token from query param or header
  let token = req.query.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    logger.debug('[SSE] No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify token
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    req.user = decoded;

    // Extract role from token (assuming roles array in token)
    const userRole = req.user.roles && req.user.roles.length > 0 ? req.user.roles[0] : 'Usuario';
    req.user.role = userRole;

    logger.debug(`[SSE] User ${req.user.username} connected`);

    // Set up SSE headers with proper CORS and caching directives
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    const clientId = Date.now() + Math.random();
    const clientObj = eventSystem.registerClient(clientId, res, req.user);

    // Send initial connection message with connected users
    const connectedUsers = eventSystem.getConnectedUsers();
    logger.debug(`[SSE] ${req.user.username} connected (${connectedUsers.length} users online)`);
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      id: clientId,
      connectedUsers: connectedUsers
    })}\n\n`);

    // Keep connection alive with heartbeat (every 30 seconds)
    let heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (error) {
        logger.debug(`[SSE] Heartbeat failed for ${req.user.username}`);
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Handle client disconnect
    const onClose = () => {
      logger.debug(`[SSE] ${req.user.username} disconnected`);
      clearInterval(heartbeatInterval);
      eventSystem.unregisterClient(clientObj);
      res.end();
    };

    // Clean up on request end
    req.on('close', onClose);
    req.on('end', onClose);

    // Handle errors during response
    res.on('error', (error) => {
      logger.error(`[SSE] Response error for ${req.user.username}:`, error.message);
      clearInterval(heartbeatInterval);
      eventSystem.unregisterClient(clientObj);
    });

  } catch (error) {
    console.error('[SSE] Token verification failed:', error.message);
    res.writeHead(401);
    res.end();
  }
});

// Export eventSystem for use in routes
global.eventSystem = eventSystem;

const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    const actualPort = server.address().port;
    if (port !== actualPort) {
      console.log(`Port ${port} was in use, server started on port ${actualPort} instead.`);
    }
    console.log(`🚀 Server running on port ${actualPort}`);
    console.log(`📡 API available at: http://localhost:${actualPort}/api`);
    console.log(`📊 Health check: http://localhost:${actualPort}/health`);
    console.log(`📊 Network health check: http://172.16.0.23:${actualPort}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${actualPort}/api/auth/*`);
    console.log(`👥 User endpoints: http://localhost:${actualPort}/api/users/*`);
  });

  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use, trying port ${port + 1}...`);
      server.close(() => {
        startServer(port + 1);
      });
    } else {
      console.error(`Error starting server: ${error.code}`);
      process.exit(1);
    }
  });

  const gracefulShutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => {
      console.log('HTTP server closed.');
      prisma.$disconnect().then(() => {
        console.log('Prisma client disconnected.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer(PORT);

// ============================================
// ENDPOINT DE DIAGNÓSTICO SSE (TEMPORAL)
// ============================================
app.get('/api/debug/sse-status', (req, res) => {
  const status = {
    totalClients: global.eventSystem.clients.size,
    totalUsers: global.eventSystem.connectedUsers.size,
    connectedUsers: global.eventSystem.getConnectedUsers(),
    clients: Array.from(global.eventSystem.clients).map(c => ({
      id: c.id,
      userId: c.user?.id,
      username: c.user?.username
    }))
  };
  res.json(status);
});
app.get('/api/debug/cliente-suscripciones/:nombreCliente', authenticateToken, async (req, res) => {
  try {
    const { nombreCliente } = req.params;

    // Search for client by name
    const cliente = await prisma.cliente.findFirst({
      where: {
        nombre: {
          contains: nombreCliente,
          mode: 'insensitive'
        }
      }
    });

    if (!cliente) {
      return res.json({ error: `Cliente "${nombreCliente}" no encontrado` });
    }

    // Get all subscriptions for this client
    const suscripciones = await prisma.suscripcion.findMany({
      where: {
        clienteId: cliente.id
      },
      include: {
        servicio: {
          select: {
            id: true,
            nombre: true,
            precioBase: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precio: true
          }
        }
      }
    });

    res.json({
      cliente: {
        id: cliente.id,
      }
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        prisma.$disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
