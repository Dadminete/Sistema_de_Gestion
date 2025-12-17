const express = require('express');
const router = express.Router();
const movimientoContableService = require('../services/movimientoContableService');
const { CategoriaCuentaService } = require('../services/categoriaCuentaService');
const { attachUserPermissions } = require('../middleware/authorize');
// const { authenticateToken } = require('../middleware/authMiddleware'); // Temporarily disabled for testing

// Función auxiliar para verificar si el usuario es administrador
const isAdmin = (req) => {
  const permissions = req.user?.permissions;
  return permissions && (
    permissions.has('gestionar_usuarios') || 
    permissions.has('gestionar_roles') ||
    permissions.has('sistema.permisos')
  );
};

// Función auxiliar para validar categorías de ajustes
const validateAdjustmentCategory = async (categoriaId, req) => {
  if (!categoriaId) return true; // Si no hay categoría, permitir
  
  try {
    const categoria = await CategoriaCuentaService.getCategoriaCuentaById(categoriaId);
    if (!categoria) return true; // Si no existe la categoría, el error lo manejará el servicio
    
    // Si es categoría de ajustes, verificar que sea administrador
    if (categoria.subtipo && categoria.subtipo.toLowerCase().includes('ajustes y correcciones')) {
      return isAdmin(req);
    }
    
    return true; // Categoría normal, permitir
  } catch (error) {
    console.error('Error validating adjustment category:', error);
    return true; // En caso de error, permitir (el error lo manejará el servicio)
  }
};

// Get all movimientos
router.get('/', async (req, res) => {
  try {
    const { metodo, tipo } = req.query;
    let movimientos;

    if (metodo) {
      movimientos = await movimientoContableService.getMovimientosByMetodo(metodo);
    } else if (tipo) {
      movimientos = await movimientoContableService.getMovimientosByTipo(tipo);
    } else {
      movimientos = await movimientoContableService.getAllMovimientos();
    }

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get movimiento by ID
router.get('/:id', async (req, res) => {
  try {
    const movimiento = await movimientoContableService.getMovimientoById(req.params.id);
    if (movimiento) {
      res.json(movimiento);
    } else {
      res.status(404).json({ message: 'Movimiento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new movimiento
router.post('/', attachUserPermissions, async (req, res) => {
  try {
    // 🔒 SEGURIDAD: Validar si el usuario puede usar categorías de ajustes
    const isValidCategory = await validateAdjustmentCategory(req.body.categoriaId, req);
    if (!isValidCategory) {
      return res.status(403).json({ 
        message: 'No tienes permisos para usar categorías de ajustes contables' 
      });
    }

    const newMovimiento = await movimientoContableService.createMovimiento(req.body);
    res.status(201).json(newMovimiento);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update movimiento
router.put('/:id', attachUserPermissions, async (req, res) => {
  try {
    // 🔒 SEGURIDAD: Validar si el usuario puede usar categorías de ajustes (solo si se está cambiando la categoría)
    if (req.body.categoriaId) {
      const isValidCategory = await validateAdjustmentCategory(req.body.categoriaId, req);
      if (!isValidCategory) {
        return res.status(403).json({ 
          message: 'No tienes permisos para usar categorías de ajustes contables' 
        });
      }
    }

    const updatedMovimiento = await movimientoContableService.updateMovimiento(req.params.id, req.body);
    if (updatedMovimiento) {
      res.json(updatedMovimiento);
    } else {
      res.status(404).json({ message: 'Movimiento no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete movimiento
router.delete('/:id', async (req, res) => {
  try {
    const deletedMovimiento = await movimientoContableService.deleteMovimiento(req.params.id);
    if (deletedMovimiento) {
      res.json({ message: 'Movimiento eliminado exitosamente' });
    } else {
      res.status(404).json({ message: 'Movimiento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance for caja
router.get('/balance/caja', async (req, res) => {
  try {
    const balance = await movimientoContableService.getBalanceCaja();
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance for papeleria
router.get('/balance/papeleria', async (req, res) => {
  try {
    const balance = await movimientoContableService.getBalancePapeleria();
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance for cuenta bancaria
router.get('/balance/cuenta-bancaria/:id', async (req, res) => {
  try {
    const balance = await movimientoContableService.getBalanceCuentaBancaria(req.params.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
