import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { servicioService } from '../services/servicioService';
import { getCategorias, type Categoria } from '../services/categoriaService';

import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';

// Types for the service data
interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precioBase?: number;
  unidadTiempo?: string;
  activo: boolean;
  categoriaId?: string;
}

interface CreateServicioData {
  nombre: string;
  descripcion: string;
  precio: number;
  duracion?: number;
  activo: boolean;
  categoriaId?: string;
}

const initialServiceState = {
  nombre: '',
  descripcion: '',
  descripcionCorta: '',
  categoriaId: '',
  tipo: 'internet',
  esRecurrente: false,
  requierePlan: false,
  precio: 0,
  moneda: 'DOP',
  unidadTiempo: 'mes',
  imagen: '',
  caracteristicas: null,
  activo: true,
  destacado: false,
  orden: 0,
};

const Servicios: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Servicio | null>(null);
  const [newService, setNewService] = useState<CreateServicioData>(initialServiceState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]); // New state for categories

  useEffect(() => {
    fetchServicios();
    fetchCategorias(); // Fetch categories on mount
  }, []);

  const fetchServicios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await servicioService.getServicios();
      // Ordenar alfabéticamente por nombre
      const serviciosData = response.data || response;
      const sortedServicios = (serviciosData as Servicio[]).sort((a: Servicio, b: Servicio) => {
        const nameA = (a.nombre || '').toLowerCase();
        const nameB = (b.nombre || '').toLowerCase();
        return nameA.localeCompare(nameB, 'es');
      });
      setServicios(sortedServicios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const data = await getCategorias(); // Use the named export getCategorias
      setCategorias(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    setNewService(initialServiceState);
    setShowModal(true);
  };

  const handleEdit = (servicio: Servicio) => {
    setEditingService(servicio);
    setNewService({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precioBase || 0,
      duracion: servicio.unidadTiempo ? parseInt(servicio.unidadTiempo) || 0 : 0,
      activo: servicio.activo,
      categoriaId: servicio.categoriaId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar este servicio?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await servicioService.deleteServicio(id);
        await fetchServicios();
        Swal.fire('Eliminado', 'Servicio eliminado exitosamente.', 'success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar el servicio');
        Swal.fire('Error', 'Error al eliminar el servicio.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingService) {
        await servicioService.updateServicio(editingService.id, {
          nombre: newService.nombre,
          descripcion: newService.descripcion,
          precioBase: newService.precio,
          activo: newService.activo,
          categoriaId: newService.categoriaId || '',
          tipo: 'servicio',
        });
      } else {
        await servicioService.createServicio({
          nombre: newService.nombre,
          descripcion: newService.descripcion,
          precioBase: newService.precio,
          activo: newService.activo,
          categoriaId: newService.categoriaId || '',
          tipo: 'servicio',
        });
      }
      setShowModal(false);
      await fetchServicios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-DO', { // Changed locale to es-DO
      style: 'currency',
      currency: 'DOP' // Changed currency to DOP
    }).format(price);
  };

  const formatDuration = (unidadTiempo: string | undefined): string => {
    if (!unidadTiempo) return 'N/A';

    // Si es un número seguido de unidad (ej: "60 minutos", "2 horas")
    if (unidadTiempo.includes(' ')) {
      return unidadTiempo;
    }

    // Si es solo un número, asumir minutos
    const minutes = parseInt(unidadTiempo);
    if (isNaN(minutes) || minutes === 0) return 'N/A';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const columns: ColumnDef<Servicio>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {row.original.nombre}
        </div>
      ),
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {row.original.descripcion}
        </div>
      ),
    },
    {
      accessorKey: 'precioBase',
      header: 'Precio',
      cell: ({ row }) => (
        <div className="font-semibold text-green-600">
          {formatPrice(row.original.precioBase || 0)}
        </div>
      ),
    },
    {
      accessorKey: 'unidadTiempo',
      header: 'Duración',
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDuration(row.original.unidadTiempo)}
        </div>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
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
          >
            <Pencil size={16} strokeWidth={2.5} />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(row.original.id)}
            title="Eliminar"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">
            <h1>Gestión de Servicios</h1></div>
          <p>Administra los servicios ofrecidos por tu empresa.</p>
        </div>
        <div className="header-right">
          <Button
            className="primary"
            onClick={handleCreate}
            disabled={loading}
          >
            <Plus size={20} strokeWidth={2.5} />
            Nuevo Servicio
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
          <AlertCircle size={20} strokeWidth={2.5} />
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message" style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--colors-text-secondary)'
        }}>
          <RefreshCw size={32} strokeWidth={2.5} className="rotating" />
          <p>Cargando...</p>
        </div>
      )}

      <DataTable columns={columns} data={servicios} />

      {showModal && (
        <Modal
          title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Nombre del Servicio</label>
              <input
                type="text"
                value={newService.nombre}
                onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
                className="compact-input"
                required
                placeholder="Ej: Corte de cabello"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={newService.descripcion}
                onChange={(e) => setNewService({ ...newService, descripcion: e.target.value })}
                className="compact-input"
                rows={3}
                placeholder="Describe el servicio en detalle"
                required
              />
            </div>

            <div className="form-group">
              <label>Precio (DOP)</label>
              <input
                type="number"
                value={newService.precio}
                onChange={(e) => setNewService({ ...newService, precio: parseFloat(e.target.value) || 0 })}
                className="compact-input"
                min="0"
                step="0.01"
                required
                placeholder="250.00"
              />
            </div>

            <div className="form-group">
              <label>Duración (minutos)</label>
              <input
                type="number"
                value={newService.duracion || ''}
                onChange={(e) => setNewService({ ...newService, duracion: parseInt(e.target.value) || 0 })}
                className="compact-input"
                min="0"
                placeholder="60"
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select
                value={newService.categoriaId}
                onChange={(e) => setNewService({ ...newService, categoriaId: e.target.value })}
                className="compact-input"
                required
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newService.activo}
                  onChange={(e) => setNewService({ ...newService, activo: e.target.checked })}
                />
                <span className="checkmark"></span>
                Activo
              </label>
            </div>

            <div className="form-actions">
              <Button onClick={() => setShowModal(false)} disabled={loading}>
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

export default Servicios;
