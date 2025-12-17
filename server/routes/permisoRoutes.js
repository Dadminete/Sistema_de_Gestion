const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { requirePermission } = require('../middleware/authorize');

// Get all permissions
router.get('/', async (req, res) => {
  try {
    const permisos = await prisma.permiso.findMany({
      where: { activo: true },
      orderBy: [
        { categoria: 'asc' },
        { nombrePermiso: 'asc' }
      ]
    });
    res.json(permisos);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions', message: error.message });
  }
});

// Get permissions by category
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const permisos = await prisma.permiso.findMany({
      where: { 
        categoria,
        activo: true 
      },
      orderBy: { nombrePermiso: 'asc' }
    });
    res.json(permisos);
  } catch (error) {
    console.error('Error fetching permissions by category:', error);
    res.status(500).json({ error: 'Failed to fetch permissions', message: error.message });
  }
});

// Get permission by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const permiso = await prisma.permiso.findUnique({
      where: { id }
    });
    
    if (!permiso) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    res.json(permiso);
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ error: 'Failed to fetch permission', message: error.message });
  }
});

// Get unique categories
router.get('/listado/categorias', async (req, res) => {
  try {
    const categorias = await prisma.permiso.findMany({
      where: { activo: true },
      distinct: ['categoria'],
      select: { categoria: true },
      orderBy: { categoria: 'asc' }
    });
    
    res.json(categorias.map(c => c.categoria));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', message: error.message });
  }
});

// Create permission (admin only)
router.post('/', requirePermission('sistema.permisos'), async (req, res) => {
  try {
    const { nombrePermiso, descripcion, categoria } = req.body;

    if (!nombrePermiso || !categoria) {
      return res.status(400).json({ error: 'nombrePermiso and categoria are required' });
    }

    const permiso = await prisma.permiso.create({
      data: {
        nombrePermiso,
        descripcion: descripcion || '',
        categoria,
        activo: true,
        esSistema: false
      }
    });

    console.log(`✅ Permiso creado: ${nombrePermiso}`);
    res.json(permiso);
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Failed to create permission', message: error.message });
  }
});

// Update permission
router.patch('/:id', requirePermission('sistema.permisos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, activo } = req.body;

    const permiso = await prisma.permiso.update({
      where: { id },
      data: {
        ...(descripcion && { descripcion }),
        ...(typeof activo === 'boolean' && { activo })
      }
    });

    console.log(`✅ Permiso actualizado: ${permiso.nombrePermiso}`);
    res.json(permiso);
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: 'Failed to update permission', message: error.message });
  }
});

// Delete permission (only if not system permission)
router.delete('/:id', requirePermission('sistema.permisos'), async (req, res) => {
  try {
    const { id } = req.params;

    const permiso = await prisma.permiso.findUnique({ where: { id } });
    
    if (!permiso) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    if (permiso.esSistema) {
      return res.status(403).json({ error: 'Cannot delete system permissions' });
    }

    await prisma.permiso.delete({ where: { id } });

    console.log(`✅ Permiso eliminado: ${permiso.nombrePermiso}`);
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ error: 'Failed to delete permission', message: error.message });
  }
});

module.exports = router;
