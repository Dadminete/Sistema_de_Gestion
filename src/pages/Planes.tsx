import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { planService } from '../services/planService';
import { getCategorias, type Categoria } from '../services/categoriaService';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';

// Types for the plan data
interface Plan {
  id: string;
  nombre: string;
  descripcion?: string;
  categoriaId: string;
  precio: number;
  moneda: string;
  subidaMbps: number | null;
  bajadaMbps: number | null;
  detalles?: Record<string, any>;
  activo: boolean;
  orden: number;
  categoria?: {
    nombre: string;
  };
}

interface CreatePlanData {
  nombre: string;
  descripcion?: string;
  categoriaId: string;
  precio: number;
  moneda?: string;
  subidaMbps?: number | null;
  bajadaMbps?: number | null;
  detalles?: Record<string, any>;
  activo?: boolean;
  orden?: number;
}

const initialPlanState = {
  nombre: '',
  descripcion: '',
  categoriaId: '',
  precio: 0,
  moneda: 'DOP',
  subidaMbps: 0,
  bajadaMbps: 0,
  detalles: undefined as Record<string, any> | undefined,
  activo: true,
  orden: 0,
};

const Planes: React.FC = () => {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState<CreatePlanData>(initialPlanState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlanes();
    fetchCategorias();
  }, []);

  const fetchPlanes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await planService.getPlanes();
      // Ordenar alfabéticamente por nombre
      const planesData = response.data || response;
      const sortedPlanes = (planesData as Plan[]).sort((a: Plan, b: Plan) => {
        const nameA = (a.nombre || '').toLowerCase();
        const nameB = (b.nombre || '').toLowerCase();
        return nameA.localeCompare(nameB, 'es');
      });
      setPlanes(sortedPlanes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (err) {
      console.error('Error fetching categorias:', err);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setNewPlan(initialPlanState);
    setShowModal(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setNewPlan({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      categoriaId: plan.categoriaId,
      precio: plan.precio,
      moneda: plan.moneda,
      subidaMbps: plan.subidaMbps,
      bajadaMbps: plan.bajadaMbps,
      detalles: plan.detalles,
      activo: plan.activo,
      orden: plan.orden,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: '¿Está seguro de que desea eliminar este plan?',
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
      await planService.deletePlan(id);
      await fetchPlanes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      if (editingPlan) {
        await planService.updatePlan(editingPlan.id, {
          nombre: newPlan.nombre,
          descripcion: newPlan.descripcion,
          categoriaId: newPlan.categoriaId,
          precio: newPlan.precio,
          moneda: newPlan.moneda,
          subidaMbps: newPlan.subidaMbps || 0,
          bajadaMbps: newPlan.bajadaMbps || 0,
          activo: newPlan.activo,
          orden: newPlan.orden,
        });
      } else {
        await planService.createPlan({
          nombre: newPlan.nombre,
          descripcion: newPlan.descripcion,
          categoriaId: newPlan.categoriaId,
          precio: newPlan.precio,
          moneda: newPlan.moneda,
          subidaMbps: newPlan.subidaMbps || 0,
          bajadaMbps: newPlan.bajadaMbps || 0,
          activo: newPlan.activo,
          orden: newPlan.orden,
        });
      }
      setShowModal(false);
      await fetchPlanes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el plan');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatBandwidth = (kbps: number | null): string => {
    if (kbps === null) return 'N/A';
    return `${kbps} kbps`;
  };

  const formatBandwidthM = (mbps: number | null): string => {
    if (mbps === null) return 'N/A';
    return `${mbps} Mbps`;
  };

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-medium text-gray-900">
            {row.original.nombre}
          </div>
          {row.original.orden === 0 && (
            <span className="status-badge warning text-xs">
              Destacado
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.categoria?.nombre || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'precio',
      header: 'Precio',
      cell: ({ row }) => (
        <div className="font-semibold text-green-600">
          {formatPrice(row.original.precio, row.original.moneda)}
        </div>
      ),
    },
    {
      accessorKey: 'subidaMbps',
      header: 'Subida',
      cell: ({ row }) => (
        <div className="text-sm">
          {formatBandwidth(row.original.subidaMbps)}
        </div>
      ),
    },
    {
      accessorKey: 'bajadaMbps',
      header: 'Bajada',
      cell: ({ row }) => (
        <div className="text-sm">
          {formatBandwidthM(row.original.bajadaMbps)}
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
          <div className="breadcrumb">Gestión / Planes</div>
          <h1>Gestión de Planes</h1>
          <p>Administra los planes de servicios de tu empresa.</p>
        </div>
        <div className="header-right">
          <Button
            className="primary"
            onClick={handleCreate}
            disabled={loading}
          >
            <Plus size={20} strokeWidth={2.5} />
            Nuevo Plan
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

      <DataTable columns={columns} data={planes} />

      {showModal && (
        <Modal
          title={editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Nombre del Plan</label>
              <input
                type="text"
                value={newPlan.nombre}
                onChange={(e) => setNewPlan({ ...newPlan, nombre: e.target.value })}
                className="compact-input"
                required
                placeholder="Ej: Plan Básico"
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select
                value={newPlan.categoriaId}
                onChange={(e) => setNewPlan({ ...newPlan, categoriaId: e.target.value })}
                className="compact-input"
                required
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={newPlan.descripcion}
                onChange={(e) => setNewPlan({ ...newPlan, descripcion: e.target.value })}
                className="compact-input"
                rows={3}
                placeholder="Describe el plan en detalle"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio</label>
                <input
                  type="number"
                  value={newPlan.precio}
                  onChange={(e) => setNewPlan({ ...newPlan, precio: parseFloat(e.target.value) || 0 })}
                  className="compact-input"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Moneda</label>
                <select
                  value={newPlan.moneda}
                  onChange={(e) => setNewPlan({ ...newPlan, moneda: e.target.value })}
                  className="compact-input"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="DOP">DOP</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Subida (Mbps)</label>
                <input
                  type="number"
                  value={newPlan.subidaMbps || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, subidaMbps: e.target.value ? parseInt(e.target.value) : null })}
                  className="compact-input"
                  min="0"
                  placeholder="10"
                />
              </div>

              <div className="form-group">
                <label>Bajada (Mbps)</label>
                <input
                  type="number"
                  value={newPlan.bajadaMbps || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, bajadaMbps: e.target.value ? parseInt(e.target.value) : null })}
                  className="compact-input"
                  min="0"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Orden</label>
                <input
                  type="number"
                  value={newPlan.orden}
                  onChange={(e) => setNewPlan({ ...newPlan, orden: parseInt(e.target.value) || 0 })}
                  className="compact-input"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newPlan.activo}
                  onChange={(e) => setNewPlan({ ...newPlan, activo: e.target.checked })}
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

export default Planes;
