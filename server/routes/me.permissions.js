const express = require('express');
const router = express.Router();
const { attachUserPermissions } = require('../services/permissions.service');

// Nota: Se asume que ya existe un middleware de autenticación que pobló req.user
router.get('/me/permissions', attachUserPermissions, async (req, res) => {
  const set = req.user?.permissions || new Set();
  res.json({ permissions: Array.from(set) });
});

module.exports = router;
