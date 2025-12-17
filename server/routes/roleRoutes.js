const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { requirePermission } = require('../middleware/authorize');

// Get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermisos: {
          include: {
            permiso: true
          }
        }
      }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles', message: error.message });
  }
});

// Get role by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermisos: {
          include: {
            permiso: true
          }
        }
      }
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

// Update role permissions
router.put('/:roleId/permisos', requirePermission('usuarios.permisos'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permisoIds } = req.body;

    if (!Array.isArray(permisoIds)) {
      return res.status(400).json({ error: 'permisoIds must be an array' });
    }

    // Verify role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Delete existing permissions for this role
    await prisma.rolePermiso.deleteMany({
      where: { rolId: roleId }
    });

    // Create new permissions
    if (permisoIds.length > 0) {
      await prisma.rolePermiso.createMany({
        data: permisoIds.map((permisoId) => ({
          rolId: roleId,
          permisoId: permisoId,
          activo: true
        }))
      });
    }

    // Return updated role
    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermisos: {
          include: {
            permiso: true
          }
        }
      }
    });

    console.log(`✅ Permisos actualizados para rol: ${role.nombreRol} (${permisoIds.length} permisos)`);
    res.json({ message: 'Permisos actualizados exitosamente', role: updatedRole });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions', message: error.message });
  }
});

// Create new role
router.post('/', requirePermission('usuarios.roles'), async (req, res) => {
  try {
    const { nombreRol, descripcion } = req.body;

    if (!nombreRol) {
      return res.status(400).json({ error: 'nombreRol is required' });
    }

    const role = await prisma.role.create({
      data: {
        nombreRol,
        descripcion: descripcion || '',
      }
    });

    console.log(`✅ Rol creado: ${nombreRol}`);
    res.json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role', message: error.message });
  }
});

// Update role
router.patch('/:id', requirePermission('usuarios.roles'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreRol, descripcion } = req.body;

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(nombreRol && { nombreRol }),
        ...(descripcion && { descripcion })
      }
    });

    console.log(`✅ Rol actualizado: ${nombreRol || role.nombreRol}`);
    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role', message: error.message });
  }
});

// Delete role
router.delete('/:id', requirePermission('usuarios.roles'), async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting Administrador role
    const role = await prisma.role.findUnique({ where: { id } });
    if (role?.nombreRol === 'Administrador') {
      return res.status(403).json({ error: 'Cannot delete Administrador role' });
    }

    await prisma.role.delete({ where: { id } });

    console.log(`✅ Rol eliminado: ${role?.nombreRol}`);
    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role', message: error.message });
  }
});

module.exports = router;
