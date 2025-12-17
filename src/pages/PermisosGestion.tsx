import React, { useEffect, useState } from 'react';
import './PermisosGestion.css';

interface Permiso {
  id: string;
  nombrePermiso: string;
  descripcion: string;
  categoria: string;
  activo: boolean;
}

interface RolPermiso {
  rolId: string;
  permisoId: string;
  activo: boolean;
}

interface Role {
  id: string;
  nombreRol: string;
  descripcion: string;
  rolePermisos: RolPermiso[];
}

const PermisosGestion: React.FC = () => {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRol, setSelectedRol] = useState<Role | null>(null);
  const [selectedPermisos, setSelectedPermisos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [permisosRes, rolesRes] = await Promise.all([
        fetch('http://172.16.0.23:54116/api/permisos', { headers }),
        fetch('http://172.16.0.23:54116/api/roles', { headers }),
      ]);

      if (!permisosRes.ok || !rolesRes.ok) throw new Error('Error al cargar datos');

      const permisosData = await permisosRes.json();
      const rolesData = await rolesRes.json();

      setPermisos(permisosData);
      setRoles(rolesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarRol = (rol: Role) => {
    setSelectedRol(rol);
    const permisoIds = rol.rolePermisos
      .filter(rp => rp.activo)
      .map(rp => rp.permisoId);
    setSelectedPermisos(new Set(permisoIds));
  };

  const togglePermiso = (permisoId: string) => {
    const newSet = new Set(selectedPermisos);
    if (newSet.has(permisoId)) {
      newSet.delete(permisoId);
    } else {
      newSet.add(permisoId);
    }
    setSelectedPermisos(newSet);
  };

  const toggleCategoria = (categoria: string) => {
    const newSet = new Set(categoriasExpandidas);
    if (newSet.has(categoria)) {
      newSet.delete(categoria);
    } else {
      newSet.add(categoria);
    }
    setCategoriasExpandidas(newSet);
  };

  const guardarPermisos = async () => {
    if (!selectedRol) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`http://172.16.0.23:54116/api/roles/${selectedRol.id}/permisos`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permisoIds: Array.from(selectedPermisos),
        }),
      });

      if (!response.ok) throw new Error('Error al guardar permisos');

      setSuccess(`Permisos del rol "${selectedRol.nombreRol}" actualizados correctamente`);
      await cargarDatos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const permisoPorCategoria = permisos.reduce((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
  }, {} as Record<string, Permiso[]>);

  return (
    <div className="permisos-gestion">
      <h1>⚙️ Gestión de Permisos</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="permisos-container">
        {/* Sección de Roles */}
        <div className="roles-section">
          <h2>Roles del Sistema</h2>
          <div className="roles-list">
            {roles.map(rol => (
              <button
                key={rol.id}
                className={`role-btn ${selectedRol?.id === rol.id ? 'active' : ''}`}
                onClick={() => seleccionarRol(rol)}
              >
                <span className="role-name">{rol.nombreRol}</span>
                <span className="role-count">
                  {rol.rolePermisos?.filter(rp => rp.activo).length || 0} permisos
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sección de Permisos */}
        {selectedRol && (
          <div className="permisos-section">
            <h2>Permisos - {selectedRol.nombreRol}</h2>

            {Object.entries(permisoPorCategoria).map(([categoria, permisosCategoria]) => (
              <div key={categoria} className="categoria-group">
                <button
                  className="categoria-header"
                  onClick={() => toggleCategoria(categoria)}
                >
                  <span className="categoria-toggle">
                    {categoriasExpandidas.has(categoria) ? '▼' : '▶'}
                  </span>
                  <span className="categoria-name">{categoria.toUpperCase()}</span>
                  <span className="categoria-count">
                    {permisosCategoria.filter(p => selectedPermisos.has(p.id)).length} / {permisosCategoria.length}
                  </span>
                </button>

                {categoriasExpandidas.has(categoria) && (
                  <div className="permisos-list">
                    {permisosCategoria.map(permiso => (
                      <label key={permiso.id} className="permiso-item">
                        <input
                          type="checkbox"
                          checked={selectedPermisos.has(permiso.id)}
                          onChange={() => togglePermiso(permiso.id)}
                          disabled={loading}
                        />
                        <div className="permiso-info">
                          <span className="permiso-nombre">{permiso.nombrePermiso}</span>
                          <span className="permiso-descripcion">{permiso.descripcion}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="permisos-actions">
              <button
                className="btn btn-primary"
                onClick={guardarPermisos}
                disabled={loading}
              >
                {loading ? 'Guardando...' : '💾 Guardar Permisos'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermisosGestion;
