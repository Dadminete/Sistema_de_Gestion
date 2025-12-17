const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { requirePermission } = require('../middleware/authorize');

/**
 * Get all permissions for a specific user
 * GET /api/usuarios/:usuarioId/permisos
 */
router.get('/:usuarioId', requirePermission('usuarios.gestionar'), async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Get user with all roles and their permissions
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
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
        },
        usuariosPermisos: {
          where: { activo: true },
          include: { permiso: true }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Collect permissions from roles
    const rolePermissions = [];
    usuario.usuariosRoles.forEach(ur => {
      ur.rol.rolesPermisos.forEach(rp => {
        if (!rolePermissions.find(p => p.id === rp.permiso.id)) {
          rolePermissions.push({
            id: rp.permiso.id,
            nombrePermiso: rp.permiso.nombrePermiso,
            source: 'role',
            rolNombre: ur.rol.nombreRol
          });
        }
      });
    });

    // Get user-level permissions
    const userPermissions = usuario.usuariosPermisos.map(up => ({
      id: up.permiso.id,
      nombrePermiso: up.permiso.nombrePermiso,
      source: 'user'
    }));

    // Combine and deduplicate
    const allPermissions = [...rolePermissions, ...userPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map(p => [p.id, p])).values()
    );

    res.json({
      usuarioId,
      nombreUsuario: usuario.nombre,
      rolePermissions,
      userPermissions,
      allPermissions: uniquePermissions
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions', message: error.message });
  }
});

/**
 * Assign permissions to a specific user (bypassing roles)
 * PUT /api/usuarios/:usuarioId/permisos
 */
router.put('/:usuarioId/permisos', requirePermission('usuarios.gestionar'), async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { permisoIds } = req.body;

    if (!Array.isArray(permisoIds)) {
      return res.status(400).json({ error: 'permisoIds must be an array' });
    }

    // Verify usuario exists
    const usuario = await prisma.usuario.findUnique({ 
      where: { id: usuarioId },
      include: { usuariosPermisos: true }
    });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Delete existing user-level permissions
    await prisma.usuarioPermiso.deleteMany({
      where: { usuarioId: usuarioId }
    });

    // Create new permissions for user
    if (permisoIds.length > 0) {
      // Verify all permisos exist
      const permisos = await prisma.permiso.findMany({
        where: { id: { in: permisoIds } }
      });

      if (permisos.length !== permisoIds.length) {
        return res.status(400).json({ error: 'Uno o más permisos no existen' });
      }

      await prisma.usuarioPermiso.createMany({
        data: permisoIds.map((permisoId) => ({
          usuarioId: usuarioId,
          permisoId: permisoId,
          activo: true
        }))
      });
    }

    // Return updated permissions
    const updatedUsuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
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
        },
        usuariosPermisos: {
          where: { activo: true },
          include: { permiso: true }
        }
      }
    });

    // Collect all permissions
    const allPermissions = [];
    updatedUsuario.usuariosRoles.forEach(ur => {
      ur.rol.rolesPermisos.forEach(rp => {
        if (!allPermissions.find(p => p.id === rp.permiso.id)) {
          allPermissions.push({
            id: rp.permiso.id,
            nombrePermiso: rp.permiso.nombrePermiso
          });
        }
      });
    });

    updatedUsuario.usuariosPermisos.forEach(up => {
      if (!allPermissions.find(p => p.id === up.permiso.id)) {
        allPermissions.push({
          id: up.permiso.id,
          nombrePermiso: up.permiso.nombrePermiso
        });
      }
    });

    console.log(`✅ Permisos de usuario actualizados: ${usuario.nombre} (${permisoIds.length} permisos adicionales)`);
    res.json({ 
      message: 'Permisos del usuario actualizados exitosamente',
      usuario: {
        id: usuarioId,
        nombre: usuario.nombre,
        permisos: allPermissions
      }
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions', message: error.message });
  }
});

/**
 * Add a single permission to a user
 * POST /api/usuarios/:usuarioId/permisos/:permisoId
 */
router.post('/:usuarioId/permisos/:permisoId', requirePermission('usuarios.gestionar'), async (req, res) => {
  try {
    const { usuarioId, permisoId } = req.params;

    // Verify usuario exists
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verify permiso exists
    const permiso = await prisma.permiso.findUnique({ where: { id: permisoId } });
    if (!permiso) {
      return res.status(404).json({ error: 'Permiso no encontrado' });
    }

    // Check if permission already exists for user
    const existing = await prisma.usuarioPermiso.findUnique({
      where: {
        usuarioId_permisoId: {
          usuarioId,
          permisoId
        }
      }
    });

    if (existing && existing.activo) {
      return res.status(400).json({ error: 'El usuario ya tiene este permiso' });
    }

    // Create or activate permission
    const usuarioPermiso = existing
      ? await prisma.usuarioPermiso.update({
          where: {
            usuarioId_permisoId: {
              usuarioId,
              permisoId
            }
          },
          data: { activo: true }
        })
      : await prisma.usuarioPermiso.create({
          data: {
            usuarioId,
            permisoId,
            activo: true
          }
        });

    console.log(`✅ Permiso ${permiso.nombrePermiso} asignado a ${usuario.nombre}`);
    res.json({ 
      message: 'Permiso asignado exitosamente',
      usuarioPermiso 
    });
  } catch (error) {
    console.error('Error adding permission to user:', error);
    res.status(500).json({ error: 'Failed to add permission', message: error.message });
  }
});

/**
 * Remove a permission from a user
 * DELETE /api/usuarios/:usuarioId/permisos/:permisoId
 */
router.delete('/:usuarioId/permisos/:permisoId', requirePermission('usuarios.gestionar'), async (req, res) => {
  try {
    const { usuarioId, permisoId } = req.params;

    // Verify usuario exists
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verify permiso exists
    const permiso = await prisma.permiso.findUnique({ where: { id: permisoId } });
    if (!permiso) {
      return res.status(404).json({ error: 'Permiso no encontrado' });
    }

    // Delete permission
    await prisma.usuarioPermiso.delete({
      where: {
        usuarioId_permisoId: {
          usuarioId,
          permisoId
        }
      }
    });

    console.log(`✅ Permiso ${permiso.nombrePermiso} removido de ${usuario.nombre}`);
    res.json({ message: 'Permiso removido exitosamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Permiso no asignado a este usuario' });
    }
    console.error('Error removing permission from user:', error);
    res.status(500).json({ error: 'Failed to remove permission', message: error.message });
  }
});

module.exports = router;
