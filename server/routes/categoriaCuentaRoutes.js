const express = require('express');
const router = express.Router();
const { CategoriaCuentaService } = require('../services/categoriaCuentaService');
const { attachUserPermissions } = require('../middleware/authorize');
// const { authenticateToken } = require('../middleware/authMiddleware'); // Import auth middleware

// Función auxiliar para verificar si el usuario es administrador
const isAdmin = (req) => {
  const permissions = req.user?.permissions;
  return permissions && (
    permissions.has('gestionar_usuarios') || 
    permissions.has('gestionar_roles') ||
    permissions.has('sistema.permisos')
  );
};

// Get all categories
router.get('/', attachUserPermissions, async (req, res) => {
  try {
    const categorias = await CategoriaCuentaService.getAllCategoriasCuentas();
    
    // 🔒 SEGURIDAD: Filtrar categorías de ajustes para usuarios no administradores
    const categoriasFiltered = isAdmin(req) 
      ? categorias 
      : categorias.filter(cat => 
          !cat.subtipo || 
          !cat.subtipo.toLowerCase().includes('ajustes y correcciones')
        );
    
    res.json(categoriasFiltered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const newCategoria = await CategoriaCuentaService.createCategoriaCuenta(req.body);
    res.status(201).json(newCategoria);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const updatedCategoria = await CategoriaCuentaService.updateCategoriaCuenta(req.params.id, req.body);
    res.json(updatedCategoria);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    await CategoriaCuentaService.deleteCategoriaCuenta(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
