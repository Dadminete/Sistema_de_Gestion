import { useAuth } from '../context/AuthProvider';

/**
 * Hook para verificar si un usuario tiene un permiso específico
 * @param permission - Nombre del permiso (ej: 'clientes.crear')
 * @returns boolean - true si tiene el permiso
 */
export const usePermission = (permission: string | string[]): boolean => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return false;
  }

  // Admin siempre tiene todos los permisos
  if (hasRole('Administrador')) {
    return true;
  }

  if (!user.permissions || user.permissions.length === 0) {
    return false;
  }

  // Si es un array, verifica si tiene al menos uno de los permisos
  if (Array.isArray(permission)) {
    return permission.some((p) =>
      user.permissions?.includes(p)
    );
  }

  // Si es un string, verifica ese permiso específico
  return user.permissions.includes(permission);
};

/**
 * Hook para verificar si un usuario tiene al menos uno de varios permisos
 * @param permissions - Array de permisos
 * @returns boolean - true si tiene al menos uno
 */
export const useAnyPermission = (permissions: string[]): boolean => {
  return usePermission(permissions);
};

/**
 * Hook para verificar si un usuario tiene TODOS los permisos especificados
 * @param permissions - Array de permisos
 * @returns boolean - true si tiene todos
 */
export const useAllPermissions = (permissions: string[]): boolean => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return false;
  }

  // Admin siempre tiene todos los permisos
  if (hasRole('Administrador')) {
    return true;
  }

  if (!user.permissions || user.permissions.length === 0) {
    return false;
  }

  return permissions.every((permission) =>
    user.permissions?.includes(permission)
  );
};
