const express = require('express');
const router = express.Router();
const { CategoriaCuentaService } = require('../services/categoriaCuentaService');
const { attachUserPermissions } = require('../middleware/authorize');

// Endpoint de debug para verificar categorías y permisos
router.get('/debug', attachUserPermissions, async (req, res) => {
  try {
    console.log('🔍 DEBUG categorias endpoint:', {
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        permissions: req.user.permissions ? Array.from(req.user.permissions).slice(0, 5) : 'none'
      } : 'no user',
      hasPermissions: !!req.user?.permissions
    });
    
    const categorias = await CategoriaCuentaService.getAllCategoriasCuentas();
    
    // Buscar categorías de ajustes
    const categoriasAjustes = categorias.filter(cat => 
      cat.subtipo && cat.subtipo.toLowerCase().includes('ajustes y correcciones')
    );
    
    console.log('🔍 DEBUG categorias found:', {
      total: categorias.length,
      ajustes: categoriasAjustes.length,
      ajustesNames: categoriasAjustes.map(c => c.nombre)
    });
    
    // Función isAdmin del backend
    const isAdmin = (req) => {
      const permissions = req.user?.permissions;
      return permissions && (
        permissions.has('gestionar_usuarios') || 
        permissions.has('gestionar_roles') ||
        permissions.has('sistema.permisos')
      );
    };
    
    const adminStatus = isAdmin(req);
    console.log('🔍 DEBUG admin status:', adminStatus);
    
    res.json({
      debug: true,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        hasPermissions: !!req.user.permissions,
        permissionsCount: req.user.permissions ? req.user.permissions.size : 0,
        firstFewPermissions: req.user.permissions ? Array.from(req.user.permissions).slice(0, 5) : []
      } : null,
      isAdmin: adminStatus,
      categorias: {
        total: categorias.length,
        ajustes: categoriasAjustes.length,
        ajustesDetalle: categoriasAjustes.map(cat => ({
          id: cat.id,
          nombre: cat.nombre,
          codigo: cat.codigo,
          tipo: cat.tipo,
          subtipo: cat.subtipo
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ DEBUG endpoint error:', error);
    res.status(500).json({ 
      error: error.message,
      debug: true 
    });
  }
});

module.exports = router;