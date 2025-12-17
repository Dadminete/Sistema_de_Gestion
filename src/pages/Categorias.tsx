import React, { useState, useEffect } from 'react';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, type Categoria } from '../services/categoriaService';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';
import './Categorias.css';

const initialNewCategoriaState = {
  nombre: '',
  descripcion: '',
  icono: '',
  color: '#007bff',
  activo: true,
  orden: 0,
};

const Categorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [newCategoria, setNewCategoria] = useState(initialNewCategoriaState);
  const [loading, setLoading] = useState(true); // Cambiar a true inicialmente
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get dynamic API base URL
      const getAPIBaseURL = () => {
        const envUrl = import.meta.env.VITE_API_BASE_URL;
        if (envUrl && envUrl.trim()) {
          return envUrl.replace(/\/$/, '');
        }
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol.replace(':', '');
        return `${protocol}://${hostname}${port}/api`;
      };
      const apiUrl = getAPIBaseURL();
      console.log('🔄 Iniciando carga de categorías desde:', `${apiUrl}/categorias`);
      const data = await getCategorias();
      console.log('✅ Respuesta recibida de categorías:', data);
      console.log('📊 Tipo de datos recibidos:', typeof data, Array.isArray(data) ? 'es array' : 'no es array');
      console.log('📈 Cantidad de categorías:', Array.isArray(data) ? data.length : 'N/A');
      // Asegurar que data sea un array
      const categoriasArray = Array.isArray(data) ? data : [];
      const sortedCategorias = categoriasArray.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      console.log('💾 Guardando categorías en estado:', sortedCategorias.length, 'elementos');
      setCategorias(sortedCategorias);
    } catch (err) {
      console.error('❌ Error detallado al cargar categorías:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar categorías';
      console.error('🚨 Mensaje de error:', errorMessage);
      setError(errorMessage);
      // Asegurar que categorias sea un array vacío en caso de error
      setCategorias([]);
    } finally {
      setLoading(false);
      console.log('🏁 Finalizada carga de categorías');
    }
  };

  const handleCreate = () => {
    setEditingCategoria(null);
    setNewCategoria(initialNewCategoriaState);
    setShowModal(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setNewCategoria({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      icono: categoria.icono || '',
      color: categoria.color || '#000000',
      activo: categoria.activo,
      orden: categoria.orden,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Está seguro de que desea eliminar esta categoría?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await deleteCategoria(id);
      setCategorias(categorias.filter((categoria) => categoria.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando categoría';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!newCategoria.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }

    if (newCategoria.nombre.length > 255) {
      setError('El nombre no puede exceder 255 caracteres');
      return false;
    }

    if (newCategoria.descripcion && newCategoria.descripcion.length > 1000) {
      setError('La descripción no puede exceder 1000 caracteres');
      return false;
    }

    if (newCategoria.icono && newCategoria.icono.length > 100) {
      setError('El icono no puede exceder 100 caracteres. Use solo el nombre del icono (ej: wifi, settings)');
      return false;
    }

    if (newCategoria.color && newCategoria.color.length > 50) {
      setError('El color no puede exceder 50 caracteres');
      return false;
    }

    // Validar que el icono no contenga URLs o HTML
    if (newCategoria.icono && (newCategoria.icono.includes('http') || newCategoria.icono.includes('<'))) {
      setError('El icono debe ser solo el nombre del icono de Material Icons (ej: wifi, settings, home)');
      return false;
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (editingCategoria) {
        // Update category
        const updatedCategoria = await updateCategoria(editingCategoria.id, newCategoria);
        setCategorias(categorias.map((categoria) => (categoria.id === editingCategoria.id ? updatedCategoria : categoria)));
      } else {
        // Create new category
        const createdCategoria = await createCategoria(newCategoria);
        setCategorias([...categorias, createdCategoria]);
      }
      
      setShowModal(false);
      setNewCategoria(initialNewCategoriaState);
      setEditingCategoria(null);
    } catch (err) {
      console.error('Error saving category:', err);
      const errorMessage = err instanceof Error ? err.message : (editingCategoria ? 'Error actualizando categoría' : 'Error creando categoría');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Categoria>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <span>{row.original.descripcion || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'icono',
      header: 'Icono',
      cell: ({ row }) => (
        <div className="icon-cell" style={{ color: row.original.color || 'inherit' }}>
          {row.original.icono ? (
            <span className="material-icons" title={row.original.icono}>{row.original.icono}</span>
          ) : (
            <span style={{ opacity: 0.5 }}>Sin icono</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <div className="color-cell">
          <div className="color-box" style={{ backgroundColor: row.original.color || '#ccc' }}></div>
          <span>{row.original.color || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'orden',
      header: 'Orden',
    },
    {
      accessorKey: 'activo',
      header: 'Activo',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.activo ? 'success' : 'danger'}`}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="table-actions">
          <button 
            className="action-btn edit-btn"
            onClick={() => handleEdit(row.original)}
            title="Editar"
            disabled={loading}
          >
            <span className="material-icons">edit</span>
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={() => handleDelete(row.original.id)}
            title="Eliminar"
            disabled={loading}
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      ),
    },
  ];

  // Mostrar loading inicial
  if (loading && categorias.length === 0) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="breadcrumb">Gestión / Categorías</div>
            <h1>Gestión de Categorías</h1>
            <p>Administra las categorías de servicios.</p>
          </div>
        </div>
        <div className="loading-message" style={{
          textAlign: 'center',
          padding: '4rem',
          color: 'var(--colors-text-secondary)'
        }}>
          <span className="material-icons" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>refresh</span>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">Gestión / Categorías</div>
          <h1>Gestión de Categorías</h1>
          <p>Administra las categorías de servicios.</p>
        </div>
        <div className="header-right">
          <Button 
            className="primary" 
            onClick={handleCreate}
            disabled={loading}
          >
            <span className="material-icons">add</span>
            Nueva Categoría
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{
          backgroundColor: 'var(--colors-error-main)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span className="material-icons">error</span>
          <div>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError(null)}
              style={{
                marginLeft: '1rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
            {!showModal && (
              <button 
                onClick={fetchCategorias}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      )}

      {loading && categorias.length > 0 && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span className="material-icons" style={{ animation: 'spin 1s linear infinite' }}>refresh</span>
            <span>Procesando...</span>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={categorias} />

      {showModal && (
        <Modal
          title={editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setError(null);
          }}
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Nombre *</label>
              <input 
                type="text" 
                value={newCategoria.nombre} 
                onChange={(e) => setNewCategoria({ ...newCategoria, nombre: e.target.value })} 
                className="compact-input"
                required
                disabled={loading}
                maxLength={255}
              />
              <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>
                Máximo 255 caracteres
              </small>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                value={newCategoria.descripcion} 
                onChange={(e) => setNewCategoria({ ...newCategoria, descripcion: e.target.value })} 
                className="compact-input"
                disabled={loading}
                maxLength={1000}
                rows={3}
              />
              <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>
                Máximo 1000 caracteres
              </small>
            </div>
            <div className="form-group">
              <label>Icono (Material Icons)</label>
              <input 
                type="text" 
                value={newCategoria.icono} 
                onChange={(e) => setNewCategoria({ ...newCategoria, icono: e.target.value })} 
                className="compact-input"
                placeholder="Ej: wifi, settings, home"
                disabled={loading}
                maxLength={100}
              />
              <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>
                Solo el nombre del icono (máximo 100 caracteres). 
                <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem' }}>
                  Ver iconos disponibles
                </a>
              </small>
              {newCategoria.icono && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Vista previa:</span>
                  <span className="material-icons" style={{ color: newCategoria.color }}>
                    {newCategoria.icono}
                  </span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Color</label>
              <input 
                type="color" 
                value={newCategoria.color} 
                onChange={(e) => setNewCategoria({ ...newCategoria, color: e.target.value })} 
                className="compact-input"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Orden</label>
              <input 
                type="number" 
                value={newCategoria.orden} 
                onChange={(e) => setNewCategoria({ ...newCategoria, orden: parseInt(e.target.value) || 0 })} 
                className="compact-input"
                disabled={loading}
                min={0}
              />
              <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>
                Orden de visualización (menor número = mayor prioridad)
              </small>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={newCategoria.activo} 
                  onChange={(e) => setNewCategoria({ ...newCategoria, activo: e.target.checked })}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Activo
              </label>
            </div>
            <div className="form-actions">
              <Button 
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }} 
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Categorias;
