import React, { useState, useEffect } from 'react';
import { getAllCuentaContables, createCuentaContable, updateCuentaContable, deleteCuentaContable } from '../services/cuentaContableService';

import type { CuentaContable } from '../services/cuentaContableService';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

// Utility function to format numbers as currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const initialNewCuentaState: Omit<CuentaContable, 'id'> = {
  nombre: '',
  codigo: '',
  tipoCuenta: '',
  moneda: 'DOP',
  activa: true,
  saldoInicial: 0,
  saldoActual: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const CuentasContables: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaContable | null>(null);
  const [newCuenta, setNewCuenta] = useState(initialNewCuentaState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCuentas();
  }, []);

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const data = await getAllCuentaContables();
      console.log('Cuentas data:', data);
      const sortedCuentas = (data || []).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setCuentas(sortedCuentas);
      setError(null);
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
      setError('Error al cargar las cuentas contables');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCuenta(null);
    setNewCuenta(initialNewCuentaState);
    setShowModal(true);
  };

  const handleEdit = (cuenta: CuentaContable) => {
    setEditingCuenta(cuenta);
    setNewCuenta({
      nombre: cuenta.nombre,
      codigo: cuenta.codigo,
      tipoCuenta: cuenta.tipoCuenta,
      moneda: cuenta.moneda,
      activa: cuenta.activa,
      saldoInicial: cuenta.saldoInicial,
      saldoActual: cuenta.saldoActual,
      createdAt: cuenta.createdAt,
      updatedAt: cuenta.updatedAt,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (editingCuenta) {
        // Update existing cuenta
        const updatedCuenta = await updateCuentaContable(editingCuenta.id, newCuenta);
        setCuentas(cuentas.map(cuenta =>
          cuenta.id === editingCuenta.id ? updatedCuenta : cuenta
        ));
        toast.success('Cuenta actualizada exitosamente');
      } else {
        // Create new cuenta
        const createdCuenta = await createCuentaContable(newCuenta);
        setCuentas([...cuentas, createdCuenta]);
        toast.success('Cuenta creada exitosamente');
      }
      setShowModal(false);
      setNewCuenta(initialNewCuentaState);
      setEditingCuenta(null);
    } catch (err) {
      console.error('Error al guardar cuenta:', err);
      setError('Error al guardar la cuenta');
      toast.error('Error al guardar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cuenta: CuentaContable) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que quieres eliminar la cuenta "${cuenta.nombre}"?`,
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
      await deleteCuentaContable(cuenta.id);
      setCuentas(cuentas.filter(c => c.id !== cuenta.id));
      toast.success('Cuenta eliminada exitosamente');
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      toast.error('Error al eliminar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<CuentaContable>[] = [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nombre', header: 'Nombre' },
    { accessorKey: 'tipoCuenta', header: 'Tipo' },
    {
      accessorKey: 'saldoInicial',
      header: 'Saldo Inicial',
      cell: ({ row }) => {
        const amount = Number(row.original.saldoInicial);
        return <span>{formatCurrency(amount)}</span>;
      },
    },
    { accessorKey: 'moneda', header: 'Moneda' },
    {
      accessorKey: 'activa',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.activa ? 'success' : 'danger'}`}>
          {row.original.activa ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      accessorKey: 'saldoActual',
      header: 'Saldo Actual',
      cell: ({ row }) => {
        const amount = Number(row.original.saldoActual);
        return <span>{formatCurrency(amount)}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="table-actions">
          <button
            onClick={() => handleEdit(row.original)}
            className="action-btn edit-btn"
            title="Editar cuenta"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="action-btn delete-btn"
            title="Eliminar cuenta"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="cuentas-contables">
      <div className="header">
        <h1>Cuentas Contables</h1>
        <Button onClick={handleCreate}>Crear Cuenta</Button>
      </div>



      {error && <div className="error">{error}</div>}

      <DataTable
        data={cuentas}
        columns={columns}
      />

      {showModal && (
        <Modal
          isOpen={showModal}
          title={editingCuenta ? "Editar Cuenta" : "Crear Cuenta"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}>
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={newCuenta.nombre}
                onChange={(e) => setNewCuenta({ ...newCuenta, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Código:</label>
              <input
                type="text"
                value={newCuenta.codigo}
                onChange={(e) => setNewCuenta({ ...newCuenta, codigo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo de Cuenta:</label>
              <select
                value={newCuenta.tipoCuenta}
                onChange={(e) => setNewCuenta({ ...newCuenta, tipoCuenta: e.target.value })}
                required
              >
                <option value="">Seleccione...</option>
                <option value="activo">Activo</option>
                <option value="pasivo">Pasivo</option>
                <option value="patrimonio">Patrimonio</option>
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Moneda:</label>
              <select
                value={newCuenta.moneda}
                onChange={(e) => setNewCuenta({ ...newCuenta, moneda: e.target.value })}
              >
                <option value="DOP">DOP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Saldo Inicial:</label>
              <input
                type="number"
                value={newCuenta.saldoInicial}
                onChange={(e) => setNewCuenta({ ...newCuenta, saldoInicial: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={newCuenta.activa}
                  onChange={(e) => setNewCuenta({ ...newCuenta, activa: e.target.checked })}
                />
                Activa
              </label>
            </div>
            <div className="form-actions">
              <Button type="button" onClick={() => setShowModal(false)} variant="secondary">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CuentasContables;
