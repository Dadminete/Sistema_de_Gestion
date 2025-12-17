const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

/**
 * Carga los permisos efectivos de un usuario combinando:
 * - Permisos por roles activos del usuario
 * - Overrides directos en usuarios_permisos
 * Reglas simples: activo=true y fecha_vencimiento null o futura.
 */
async function getUserEffectivePermissions(usuarioId) {
  if (!usuarioId) return new Set();

  // Permisos por roles
  const rolesUsuario = await prisma.usuarioRole.findMany({
    where: { usuarioId, activo: true },
    select: { rolId: true, rol: { select: { activo: true } } },
  });

  const rolIds = rolesUsuario.filter(r => r.rol?.activo !== false).map(r => r.rolId);

  const permisosPorRoles = await prisma.rolePermiso.findMany({
    where: {
      rolId: { in: rolIds.length ? rolIds : [0] },
      activo: true,
    },
    select: {
      permiso: { select: { nombrePermiso: true, activo: true } },
    },
  });

  // Permisos directos del usuario (overrides)
  const hoy = new Date();
  const permisosDirectos = await prisma.usuarioPermiso.findMany({
    where: {
      usuarioId,
      activo: true,
      OR: [
        { fechaVencimiento: null },
        { fechaVencimiento: { gt: hoy } },
      ],
    },
    select: {
      permiso: { select: { nombrePermiso: true, activo: true } },
    },
  });

  const set = new Set();
  for (const pr of permisosPorRoles) {
    if (pr.permiso?.activo) set.add(pr.permiso.nombrePermiso);
  }
  for (const pu of permisosDirectos) {
    if (pu.permiso?.activo) set.add(pu.permiso.nombrePermiso);
  }
  return set;
}

/**
 * Middleware que adjunta req.user.permissions (Set<string>)
 * Requiere que req.user exista y contenga id de usuario.
 */
async function attachUserPermissions(req, res, next) {
  try {
    const userId = req.user?.id;
    req.user = req.user || {};
    req.user.permissions = await getUserEffectivePermissions(userId);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Factory de middleware para exigir un permiso específico.
 * Uso: router.get('/ruta', requirePermission('clientes.crear'), handler)
 */
function requirePermission(permKey) {
  return function (req, res, next) {
    const perms = req.user?.permissions;
    if (perms && perms.has(permKey)) return next();
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Permiso requerido: ' + permKey });
  };
}

/**
 * Devuelve permisos por categoría para facilitar render de menú.
 */
async function listPermissionsByCategory() {
  const permisos = await prisma.permiso.findMany({
    where: { activo: true },
    select: { nombrePermiso: true, descripcion: true, categoria: true },
    orderBy: [{ categoria: 'asc' }, { nombrePermiso: 'asc' }],
  });
  const map = {};
  for (const p of permisos) {
    if (!map[p.categoria]) map[p.categoria] = [];
    map[p.categoria].push(p);
  }
  return map;
}

module.exports = {
  getUserEffectivePermissions,
  attachUserPermissions,
  requirePermission,
  listPermissionsByCategory,
};
