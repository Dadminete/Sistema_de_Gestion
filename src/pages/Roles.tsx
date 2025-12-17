import React, { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { RoleService } from '../services/roleService';
import { PermisoService, type Permiso } from '../services/permisoService';
import type { Role, CreateRoleData } from '../services/roleService';
import type { ColumnDef } from '@tanstack/react-table';
import './Users.css';
import Swal from 'sweetalert2';

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleData>({
    nombreRol: '',
    descripcion: '',
    prioridad: 1,
    esSistema: false,
  });
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([]);

  // Cargar roles y permisos al montar el componente
  useEffect(() => {
    loadRoles();
    loadPermisos();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await RoleService.getRoles();
      // Ordenar alfabéticamente por nombre
      const sortedRoles = data.sort((a, b) => {
        const nameA = (a.nombre || '').toLowerCase();
        const nameB = (b.nombre || '').toLowerCase();
        return nameA.localeCompare(nameB, 'es');
      });
      setRoles(sortedRoles);
    } catch (err) {
      setError('Error al cargar roles');
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermisos = async () => {
    try {
      const data = await PermisoService.getPermisos();
      setPermisos(data);
    } catch (err) {
      console.error('Error loading permisos:', err);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      nombreRol: '',
      descripcion: '',
      prioridad: 1,
      esSistema: false,
    });
    setSelectedPermisos([]);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      nombreRol: role.nombreRol,
      descripcion: role.descripcion || '',
      prioridad: role.prioridad,
      esSistema: role.esSistema,
    });
    // Extract current permissions from role
    const currentPermisos = role.rolesPermisos?.map(rp => rp.permisoId) || [];
    setSelectedPermisos(currentPermisos);
    setIsModalOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (role.esSistema) {
      Swal.fire('Error', 'No se puede eliminar un rol del sistema', 'error');
      return;
    }
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el rol "${role.nombreRol}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await RoleService.deleteRole(role.id);
        await loadRoles();
        Swal.fire('Eliminado', 'Rol eliminado exitosamente.', 'success');
      } catch (err) {
        setError('Error al eliminar rol');
        console.error('Error deleting role:', err);
        Swal.fire('Error', 'Error al eliminar el rol.', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        const updateData = {
          nombreRol: formData.nombreRol,
          descripcion: formData.descripcion,
          prioridad: formData.prioridad,
          esSistema: formData.esSistema,
          permisos: selectedPermisos
        };
        await RoleService.updateRole(editingRole.id, updateData);
      } else {
        const createData = {
          ...formData,
          permisos: selectedPermisos
        };
        await RoleService.createRole(createData);
      }
      setIsModalOpen(false);
      await loadRoles();
    } catch (err) {
      setError(editingRole ? 'Error al actualizar rol' : 'Error al crear rol');
      console.error('Error saving role:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'prioridad' ? parseInt(value) || 1 : value)
    }));
  };

  const handlePermisoToggle = (permisoId: string) => {
    setSelectedPermisos(prev => {
      if (prev.includes(permisoId)) {
        return prev.filter(id => id !== permisoId);
      } else {
        return [...prev, permisoId];
      }
    });
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'nombreRol',
      header: 'Nombre del Rol',
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => row.original.descripcion || 'Sin descripción',
    },
    {
      accessorKey: 'prioridad',
      header: 'Prioridad',
    },
    {
      accessorKey: 'esSistema',
      header: 'Sistema',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.esSistema ? 'system' : 'custom'}`}>
          {row.original.esSistema ? 'Sistema' : 'Personalizado'}
        </span>
      ),
    },
    {
      accessorKey: 'rolesPermisos',
      header: 'Permisos',
      cell: ({ row }) => {
        const permisos = row.original.rolesPermisos || [];
        if (permisos.length === 0) {
          return <span className="text-muted">Sin permisos</span>;
        }
        return (
          <div className="permisos-badges">
            {permisos.slice(0, 3).map((rp) => (
              <span key={rp.permisoId} className="permiso-badge">
                {rp.permiso.nombrePermiso}
              </span>
            ))}
            {permisos.length > 3 && (
              <span className="permiso-badge more">+{permisos.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.activo ? 'active' : 'inactive'}`}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="action-buttons">
          <button
            onClick={() => handleEdit(row.original)}
            className="action-btn edit-btn"
            title="Editar"
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="action-btn delete-btn"
            title="Eliminar"
            disabled={row.original.esSistema}
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="loading">Cargando roles...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">
          <h1>Gestión de Roles</h1></div>
          <p>Administra los roles del sistema y sus permisos.</p>
        </div>
        <div className="header-right">
          {/* The create button is now part of the DataTable component */}
        </div>
      </div>

      <DataTable
        data={roles}
        columns={columns}
        createAction={{
          label: 'Nuevo Rol',
          onClick: handleCreate,
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
      >
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombreRol">Nombre del Rol *</label>
              <input
                type="text"
                id="nombreRol"
                name="nombreRol"
                value={formData.nombreRol}
                onChange={handleInputChange}
                required
                className="form-input compact"
              />
            </div>
            <div className="form-group">
              <label htmlFor="prioridad">Prioridad</label>
              <input
                type="number"
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="form-input compact"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <input
              type="text"
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              className="form-input compact"
            />
          </div>

          <div className="form-row">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="esSistema"
                  checked={formData.esSistema}
                  onChange={handleInputChange}
                  disabled={editingRole?.esSistema}
                />
                <span className="checkmark"></span>
                Es rol del sistema
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Permisos</label>
            <div className="permisos-selector">
              {permisos.map((permiso) => (
                <label key={permiso.id} className="checkbox-label permiso-item">
                  <input
                    type="checkbox"
                    checked={selectedPermisos.includes(permiso.id)}
                    onChange={() => handlePermisoToggle(permiso.id)}
                  />
                  <span className="checkmark"></span>
                  <div className="permiso-info">
                    <span className="permiso-name">{permiso.nombrePermiso}</span>
                    {permiso.descripcion && (
                      <span className="permiso-desc">{permiso.descripcion}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingRole ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Roles;
