require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://172.16.0.23:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Unblock user endpoint
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

// List all users endpoint
app.get('/api/users/list', async (req, res) => {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        username: true,
        nombre: true,
        apellido: true,
        activo: true,
        intentosFallidos: true,
        bloqueadoHasta: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Basic login endpoint for testing
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`🔐 Login attempt for: ${username}`);
    
    // Get all users first to see what exists
    const allUsers = await prisma.usuario.findMany({
      select: { username: true, nombre: true, apellido: true }
    });
    console.log('Available users:', allUsers.map(u => u.username));
    
    // Find user
    let user = await prisma.usuario.findUnique({
      where: { username },
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

    // If user doesn't exist and it's admin, create it
    if (!user && username === 'admin') {
      console.log('🔨 Creating admin user...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      user = await prisma.usuario.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          nombre: 'Administrador',
          apellido: 'Sistema',
          activo: true,
          intentosFallidos: 0
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
      console.log('✅ Admin user created');
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Check if account is blocked
    if (user.bloqueadoHasta && new Date(user.bloqueadoHasta) > new Date()) {
      return res.status(423).json({ 
        error: 'Cuenta bloqueada temporalmente',
        blockedUntil: user.bloqueadoHasta
      });
    }

    // For testing: accept 'admin123' for admin or any password for other users
    const isValidPassword = (username === 'admin' && password === 'admin123') || 
                           (username !== 'admin');
    
    if (!isValidPassword) {
      // Increment failed attempts
      await prisma.usuario.update({
        where: { id: user.id },
        data: { intentosFallidos: user.intentosFallidos + 1 }
      });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log(`✅ Login successful for user: ${username}`);
    
    // Extract roles and permissions
    const roles = user.usuariosRoles.map(ur => ur.rol.nombreRol);
    const permissions = user.usuariosRoles.flatMap(ur => 
      ur.rol.rolesPermisos.map(rp => rp.permiso.nombrePermiso)
    );

    // Reset failed attempts on successful login
    await prisma.usuario.update({
      where: { id: user.id },
      data: { intentosFallidos: 0 }
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        roles: [...new Set(roles)],
        permissions: [...new Set(permissions)]
      },
      token: 'dummy-token-for-testing',
      refreshToken: 'dummy-refresh-token'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Network health check: http://172.16.0.23:${PORT}/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
