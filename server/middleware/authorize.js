const { attachUserPermissions, requirePermission } = require('../services/permissions.service');

// Exporta directamente para uso en app.js/router
module.exports = {
  attachUserPermissions,
  requirePermission,
};
