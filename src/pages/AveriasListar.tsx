import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { averiasService } from '../services/averiasService';
import DataTable from '../components/ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import './AveriasListar.css';
import './AveriasCommon.css';

interface Averia {
  id: string;
  numeroTicket: string;
  clienteId: string | null;
  cliente?: { nombre?: string; apellidos?: string } | null;
  asunto: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  createdAt: string;
}

const AveriasListar: React.FC = () => {
  const [data, setData] = useState<Averia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const resp = await averiasService.getAverias();
      const aviasArray = Array.isArray(resp) ? resp : (resp?.data || []);
      const sortedAverias = aviasArray.sort((a, b) => {
        const clienteA = `${a.cliente?.nombre || ''} ${a.cliente?.apellidos || ''}`;
        const clienteB = `${b.cliente?.nombre || ''} ${b.cliente?.apellidos || ''}`;
        return clienteA.localeCompare(clienteB, 'es');
      });
      setData(sortedAverias);
    } catch (e) {
      setError('Error al cargar las averías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('averias:updated', handler);
    return () => window.removeEventListener('averias:updated', handler);
  }, []);

  const handleView = (id: string) => {
    navigate(`/averias/${id}`);
  };
  const handleEdit = (id: string) => {
    navigate(`/averias/${id}/editar`);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta avería? Esta acción no se puede deshacer.')) return;
    await averiasService.delete(id);
    await load();
  };
  const handleClose = (id: string) => {
    navigate(`/averias/cerrar/${id}`);
  };

  const columns = useMemo<ColumnDef<Averia>[]>(() => [
    { accessorKey: 'numeroTicket', header: 'Ticket' },
    {
      id: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => {
        const c = row.original.cliente;
        const full = [c?.nombre, c?.apellidos].filter(Boolean).join(' ');
        return full || row.original.clienteId || '-';
      }
    },
    { accessorKey: 'asunto', header: 'Asunto' },
    { accessorKey: 'categoria', header: 'Categoría' },
    {
      accessorKey: 'prioridad',
      header: 'Prioridad',
      cell: ({ getValue }) => {
        const p = String(getValue() ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        return (
          <span className={`priority-badge ${p}`}>{String(getValue() ?? '')}</span>
        );
      }
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = String(getValue() ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        return (
          <span className={`estado-badge ${estado}`}>{String(getValue() ?? '')}</span>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Creado',
      cell: ({ getValue }) => new Date(String(getValue())).toLocaleString()
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="dt-actions">
          <button className="action-button icon-only" onClick={(e) => { e.stopPropagation(); handleView(row.original.id); }} title="Ver">
            <span className="material-icons">visibility</span>
          </button>
          <button className="action-button icon-only" onClick={(e) => { e.stopPropagation(); handleEdit(row.original.id); }} title="Editar">
            <span className="material-icons">edit</span>
          </button>
          <button className="action-button icon-only" onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }} title="Eliminar">
            <span className="material-icons">delete</span>
          </button>
          <button className="action-button icon-only" onClick={(e) => { e.stopPropagation(); handleClose(row.original.id); }} title="Cerrar">
            <span className="material-icons">task_alt</span>
          </button>
        </div>
      )
    }
  ], []);

  if (loading) return <div className="page-container"><p>Cargando averías...</p></div>;
  if (error) return <div className="page-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="page-title">AVERIAS / Listado de Averías</h2>
          <p className="page-subtitle">Visualiza y gestiona todas las averías registradas</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Listado de Averías</h3>
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
};

export default AveriasListar;
