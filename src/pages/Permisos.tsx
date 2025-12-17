import React, { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { PermisoService } from '../services/permisoService';
import type { Permiso, CreatePermisoData, UpdatePermisoData } from '../services/permisoService';
import type { ColumnDef } from '@tanstack/react-table';
import './Users.css';
import Swal from 'sweetalert2';

const Permisos: React.FC = () => {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null); // New state for form-specific errors
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermiso, setEditingPermiso] = useState<Permiso | null>(null);
  const [formData, setFormData] = useState<CreatePermisoData>({
    nombrePermiso: '',
    descripcion: '',
    esSistema: false,
  });

  // Cargar permisos al montar el componente
  useEffect(() => {
    loadPermisos();
  }, []);

  const loadPermisos = async () => {
    try {
      setLoading(true);
      const data = await PermisoService.getPermisos();
      // Ordenar alfabéticamente por nombre
      const sortedPermisos = data.sort((a, b) => {
        const nameA = (a.nombrePermiso || '').toLowerCase();
        const nameB = (b.nombrePermiso || '').toLowerCase();
        return nameA.localeCompare(nameB, 'es');
      });
      setPermisos(sortedPermisos);
    } catch (err) {
      setError('Error al cargar permisos');
      console.error('Error loading permisos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPermiso(null);
    setFormData({
      nombrePermiso: '',
      descripcion: '',
      esSistema: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (permiso: Permiso) => {
    setEditingPermiso(permiso);
    setFormData({
      nombrePermiso: permiso.nombrePermiso,
      descripcion: permiso.descripcion || '',
      esSistema: permiso.esSistema,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (permiso: Permiso) => {
    if (permiso.esSistema) {
      Swal.fire('Error', 'No se puede eliminar un permiso del sistema', 'error');
      return;
    }
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el permiso "${permiso.nombrePermiso}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await PermisoService.deletePermiso(permiso.id);
        await loadPermisos();
        Swal.fire('Eliminado', 'Permiso eliminado exitosamente.', 'success');
      } catch (err) {
        setError('Error al eliminar permiso');
        console.error('Error deleting permiso:', err);
        Swal.fire('Error', 'Error al eliminar el permiso.', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear previous form errors
    try {
      if (editingPermiso) {
        const updateData: UpdatePermisoData = {
          nombrePermiso: formData.nombrePermiso,
          descripcion: formData.descripcion,
          esSistema: formData.esSistema,
        };
        await PermisoService.updatePermiso(editingPermiso.id, updateData);
      } else {
        await PermisoService.createPermiso(formData);
      }
      setIsModalOpen(false);
      await loadPermisos();
    } catch (err) {
      let errorMessage = 'Error al guardar permiso';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setFormError(editingPermiso ? 'Error al actualizar permiso: ' + errorMessage : 'Error al crear permiso: ' + errorMessage);
      console.error('Error saving permiso:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Helper function to check if permission is security-related
  const isSecurityPermission = (nombrePermiso: string): boolean => {
    const securityKeywords = ['seguridad', 'security', 'admin', 'delete', 'eliminar', 'usuario', 'user', 'role', 'rol', 'permiso', 'permission', 'sistema', 'system'];
    return securityKeywords.some(keyword => nombrePermiso.toLowerCase().includes(keyword));
  };

  const columns: ColumnDef<Permiso>[] = [
    {
      accessorKey: 'nombrePermiso',
      header: 'Nombre del Permiso',
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => row.original.descripcion || 'Sin descripción',
    },
    {
      id: 'usage',
      header: 'En Uso',
      cell: ({ row }) => {
        const permiso = row.original;
        const rolesCount = permiso.rolesPermisos?.filter(rp => rp.activo && rp.rol.activo).length || 0;
        const isInUse = rolesCount > 0;
        const isSecurity = isSecurityPermission(permiso.nombrePermiso);
        
        return (
          <div className="permission-usage">
            <span 
              className={`usage-icon ${
                isInUse 
                  ? (isSecurity ? 'security-active' : 'normal-active')
                  : (isSecurity ? 'security-inactive' : 'normal-inactive')
              }`}
              title={`${isInUse ? 'En uso' : 'Sin uso'} - ${isSecurity ? 'Permiso de seguridad' : 'Permiso normal'}`}
            >
              {isSecurity ? '🔒' : '📋'}
            </span>
            <span className="usage-count">{rolesCount}</span>
          </div>
        );
      },
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

  if (loading) return <div className="loading">Cargando permisos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">
          <h1>Gestión de Permisos</h1></div>
          <p>Administra los permisos del sistema y su asignación.</p>
        </div>
        <div className="header-right">
          {/* The create button is now part of the DataTable component */}
        </div>
      </div>

      <DataTable
        data={permisos}
        columns={columns}
        createAction={{
          label: 'Nuevo Permiso',
          onClick: handleCreate,
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormError(null); // Clear form errors when closing modal
        }}
        title={editingPermiso ? 'Editar Permiso' : 'Nuevo Permiso'}
      >
        <form onSubmit={handleSubmit} className="form-container">
          {formError && <div className="error-message">{formError}</div>} {/* Display form error */}
          <div className="form-group">
            <label htmlFor="nombrePermiso">Nombre del Permiso *</label>
            <input
              type="text"
              id="nombrePermiso"
              name="nombrePermiso"
              value={formData.nombrePermiso}
              onChange={handleInputChange}
              required
              className="form-input compact"
            />
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
                  disabled={editingPermiso?.esSistema}
                />
                <span className="checkmark"></span>
                Es permiso del sistema
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingPermiso ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Permisos;
