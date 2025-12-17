import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import './PermisosUsuario.css';

interface PermissionCategory {
  name: string;
  permissions: Array<{
    id: string;
    nombrePermiso: string;
  }>;
}

interface UserPermissions {
  usuarioId: string;
  nombreUsuario: string;
  rolePermissions: Array<{ id: string; nombrePermiso: string; rolNombre: string }>;
  userPermissions: Array<{ id: string; nombrePermiso: string }>;
  allPermissions: Array<{ id: string; nombrePermiso: string }>;
}

const PermisosUsuario: React.FC = () => {
  const { usuarioId } = useParams<{ usuarioId: string }>();
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionCategory[]>([]);

  // Get dynamic API base URL
  const getAPIBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    // Fallback to dynamic detection
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol.replace(':', '');
    return `${protocol}://${hostname}${port}`;
  };

  const baseUrl = getAPIBaseURL();
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  useEffect(() => {
    fetchUserPermissions();
    fetchAllPermissions();
  }, [usuarioId]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/usuarios/${usuarioId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }

      const data = await response.json();
      setUserPermissions(data);

      // Select only user-level permissions (not from roles)
      const userPermisoIds = new Set(data.userPermissions.map((p: any) => p.id));
      setSelectedPermissions(userPermisoIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading user permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/permisos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const permisos = await response.json();

      // Organize permissions by category (menu)
      const categories: { [key: string]: PermissionCategory } = {};

      permisos.forEach((p: any) => {
        const parts = p.nombrePermiso.split('.');
        const category = parts[0];

        if (!categories[category]) {
          categories[category] = {
            name: category.charAt(0).toUpperCase() + category.slice(1),
            permissions: []
          };
        }

        categories[category].permissions.push({
          id: p.id,
          nombrePermiso: p.nombrePermiso
        });
      });

      setAllPermissions(Object.values(categories).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading permissions');
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/usuarios/${usuarioId}/permisos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          permisoIds: Array.from(selectedPermissions)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save permissions');
      }

      setSuccess('Permisos del usuario actualizados exitosamente');
      await fetchUserPermissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="permisos-usuario-container">
        <div className="spinner"></div>
        <p>Cargando permisos del usuario...</p>
      </div>
    );
  }

  if (!userPermissions) {
    return (
      <div className="permisos-usuario-container">
        <p className="error">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="permisos-usuario-container">
      <div className="permisos-usuario-header">
        <h1>Gestionar Permisos de Usuario</h1>
        <p className="usuario-info">Usuario: <strong>{userPermissions.nombreUsuario}</strong></p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {userPermissions.rolePermissions.length > 0 && (
        <div className="role-permissions-section">
          <h3>📋 Permisos por Roles</h3>
          <p className="section-description">Estos permisos provienen de los roles asignados al usuario</p>
          <div className="permissions-list">
            {userPermissions.rolePermissions.map(p => (
              <div key={p.id} className="permission-item role-permission">
                <span className="permission-name">{p.nombrePermiso}</span>
                <span className="permission-source">Rol: {p.rolNombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="user-permissions-section">
        <h3>👤 Permisos Adicionales del Usuario</h3>
        <p className="section-description">Estos permisos se asignan directamente al usuario (independiente de sus roles)</p>

        <div className="categories-container">
          {allPermissions.map(category => (
            <div key={category.name} className="category-section">
              <h4>{category.name}</h4>
              <div className="permissions-grid">
                {category.permissions.map(permission => (
                  <label key={permission.id} className="permission-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      disabled={saving}
                    />
                    <span className="checkbox-label">{permission.nombrePermiso}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="permisos-usuario-footer">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
};

export default PermisosUsuario;
