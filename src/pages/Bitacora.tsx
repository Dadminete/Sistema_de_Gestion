import React, { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { BitacoraService, type BitacoraEntry, type BitacoraStats, type BitacoraFilters } from '../services/bitacoraService';
import { getUsers } from '../services/userService';
import { useAuth } from '../context/AuthProvider';
import type { UserWithRoles } from '../types/database';
import type { ColumnDef } from '@tanstack/react-table';
import './Users.css';

const Bitacora: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // State
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [stats, setStats] = useState<BitacoraStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BitacoraEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<BitacoraFilters>({ page: 1, limit: 15 });
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [viewAll, setViewAll] = useState(false);
  const [dateFilter, setDateFilter] = useState({ fechaInicio: '', fechaFin: '' });

  // Load data on mount / filter change
  useEffect(() => {
    loadBitacora();
    loadStats();
    if (isAdmin) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isAdmin, viewAll, dateFilter]);

  const loadBitacora = async () => {
    try {
      setLoading(true);
      // Si viewAll es true, pasar el parámetro al backend para obtener todos sin paginación
      const allFilters = viewAll 
        ? { page: 1, viewAll: 'true', ...dateFilter }  // No enviar limit ni otros filtros de paginación
        : { ...filters, ...dateFilter };
      
      const data = await BitacoraService.getBitacora(allFilters);
      // Apply client‑side global search
      const filtered = (data.data || []).filter((e) =>
        JSON.stringify(e).toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Sort by user name for readability
      const sorted = filtered.sort((a, b) => {
        const nameA = `${a.usuario?.nombre || ''} ${a.usuario?.apellido || ''}`.trim();
        const nameB = `${b.usuario?.nombre || ''} ${b.usuario?.apellido || ''}`.trim();
        return nameA.localeCompare(nameB, 'es');
      });
      setEntries(sorted);
      setPagination(data.pagination);
      console.log('Loaded bitácora entries:', sorted.length, 'Total in DB:', data.pagination.total);
    } catch (err) {
      setError('Error al cargar bitácora');
      console.error('Error loading bitácora:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await BitacoraService.getBitacoraStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleViewDetails = async (entry: BitacoraEntry) => {
    try {
      const detailed = await BitacoraService.getBitacoraById(entry.id);
      setSelectedEntry(detailed);
      setIsDetailModalOpen(true);
    } catch (err) {
      setError('Error al cargar detalles');
      console.error('Error loading entry details:', err);
    }
  };

  const handleFilterChange = (key: keyof BitacoraFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: key !== 'page' ? 1 : (typeof value === 'string' ? parseInt(value) : value),
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  // Table columns – include método, ruta y sesión
  const columns: ColumnDef<BitacoraEntry>[] = [
    {
      accessorKey: 'fechaHora',
      header: 'Fecha/Hora',
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.fechaHora)}</span>,
    },
    {
      accessorKey: 'usuario',
      header: 'Usuario',
      cell: ({ row }) => {
        const u = row.original.usuario;
        return u ? <span className="user-username">{u.username}</span> : <span className="text-muted">Sistema</span>;
      },
    },
    { accessorKey: 'accion', header: 'Acción', cell: ({ row }) => <span className="action-badge">{row.original.accion}</span> },
    { accessorKey: 'tablaAfectada', header: 'Tabla', cell: ({ row }) => <span className="table-badge">{row.original.tablaAfectada || 'N/A'}</span> },
    { accessorKey: 'metodo', header: 'Método', cell: ({ row }) => <span className="method-badge">{row.original.metodo || 'N/A'}</span> },
    { accessorKey: 'ruta', header: 'Ruta', cell: ({ row }) => <code className="route-code">{row.original.ruta || 'N/A'}</code> },
    { accessorKey: 'sesionId', header: 'Sesión', cell: ({ row }) => <span className="session-id">{row.original.sesionId || 'N/A'}</span> },
    {
      accessorKey: 'resultado',
      header: 'Resultado',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.resultado === 'exitoso' ? 'success' : 'error'}`}>
          {row.original.resultado === 'exitoso' ? 'Éxito' : 'Error'}
        </span>
      ),
    },
    { accessorKey: 'duracionMs', header: 'Duración', cell: ({ row }) => <span className="duration-text">{formatDuration(row.original.duracionMs)}</span> },
    { accessorKey: 'ipAddress', header: 'IP', cell: ({ row }) => <span className="ip-text">{row.original.ipAddress || 'N/A'}</span> },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <button onClick={() => handleViewDetails(row.original)} className="action-btn view-btn" title="Ver detalles">
          <span className="material-icons">visibility</span>
        </button>
      ),
    },
  ];

  if (loading && entries.length === 0) return <div className="loading">Cargando bitácora...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">Sistema / Bitácora</div>
          <h1>Bitácora del Sistema</h1>
          <p>Registro de actividades y eventos del sistema.</p>
        </div>
        <div className="header-right">
          <div className="header-stats">
            {stats && (
              <>
                <div className="stat-item">
                  <span className="stat-label">Total:</span>
                  <span className="stat-value">{stats.totalAcciones}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters and global search */}
      <div className="filters-container">
        <div className="filters-row">
          {isAdmin && (
            <div className="filter-group">
              <label htmlFor="usuarioId">Usuario:</label>
              <select
                id="usuarioId"
                value={filters.usuarioId || ''}
                onChange={(e) => handleFilterChange('usuarioId', e.target.value)}
                className="form-input compact"
              >
                <option value="">Todos los usuarios</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} {user.apellido} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="filter-group">
            <label htmlFor="accion">Acción:</label>
            <input
              type="text"
              id="accion"
              placeholder="Filtrar por acción..."
              value={filters.accion || ''}
              onChange={(e) => handleFilterChange('accion', e.target.value)}
              className="form-input compact"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="tablaAfectada">Tabla:</label>
            <select
              id="tablaAfectada"
              value={filters.tablaAfectada || ''}
              onChange={(e) => handleFilterChange('tablaAfectada', e.target.value)}
              className="form-input compact"
            >
              <option value="">Todas</option>
              <option value="usuarios">Usuarios</option>
              <option value="roles">Roles</option>
              <option value="permisos">Permisos</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="resultado">Resultado:</label>
            <select
              id="resultado"
              value={filters.resultado || ''}
              onChange={(e) => handleFilterChange('resultado', e.target.value)}
              className="form-input compact"
            >
              <option value="">Todos</option>
              <option value="exitoso">Éxito</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="limit">Por página:</label>
            <select
              id="limit"
              value={filters.limit || 15}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="form-input compact"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="filter-group search-group">
            <label htmlFor="search">Buscar:</label>
            <input
              type="text"
              id="search"
              placeholder="Buscar en todos los campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input compact"
            />
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="filters-date-group">
          <div className="filter-group">
            <label htmlFor="fechaInicio">Desde:</label>
            <input
              type="date"
              id="fechaInicio"
              value={dateFilter.fechaInicio}
              onChange={(e) => setDateFilter(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="form-input compact"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="fechaFin">Hasta:</label>
            <input
              type="date"
              id="fechaFin"
              value={dateFilter.fechaFin}
              onChange={(e) => setDateFilter(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="form-input compact"
            />
          </div>
          <div className="filter-group">
            <button
              onClick={() => setDateFilter({ fechaInicio: '', fechaFin: '' })}
              className="btn btn-secondary"
              title="Limpiar filtros de fecha"
            >
              Limpiar fechas
            </button>
            <button
              onClick={() => {
                setViewAll(!viewAll);
                if (!viewAll) {
                  setDateFilter({ fechaInicio: '', fechaFin: '' });
                }
              }}
              className={`btn ${viewAll ? 'btn-primary' : 'btn-secondary'}`}
              title={viewAll ? 'Mostrar con paginación' : 'Cargar todos los registros sin filtros de fecha'}
            >
              {viewAll ? '✓ Ver Todo' : 'Ver Todo'}
            </button>
          </div>
        </div>
      </div>

      {/* Data table */}
      <DataTable data={entries} columns={columns} disablePagination={viewAll} />

      {/* Pagination */}
      {!viewAll && pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Página {pagination.page} de {pagination.totalPages} ({pagination.total} entradas)
          </div>
          <div className="pagination-buttons">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-secondary"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detalles de la Entrada">
          {selectedEntry && (
            <div className="entry-details">
              <div className="detail-section">
                <h3>Información General</h3>
                <div className="detail-grid">
                  <div className="detail-item"><label>ID:</label> <span>{selectedEntry.id}</span></div>
                  <div className="detail-item"><label>Fecha/Hora:</label> <span>{formatDate(selectedEntry.fechaHora)}</span></div>
                  <div className="detail-item"><label>Usuario:</label> <span>{selectedEntry.usuario ? `${selectedEntry.usuario.nombre} ${selectedEntry.usuario.apellido} (@${selectedEntry.usuario.username})` : 'Sistema'}</span></div>
                  <div className="detail-item"><label>Acción:</label> <span>{selectedEntry.accion}</span></div>
                  <div className="detail-item"><label>Tabla:</label> <span>{selectedEntry.tablaAfectada || 'N/A'}</span></div>
                  <div className="detail-item"><label>Registro ID:</label> <span>{selectedEntry.registroAfectadoId || 'N/A'}</span></div>
                  <div className="detail-item"><label>Método:</label> <span>{selectedEntry.metodo || 'N/A'}</span></div>
                  <div className="detail-item"><label>Ruta:</label> <span>{selectedEntry.ruta || 'N/A'}</span></div>
                  <div className="detail-item"><label>Sesión:</label> <span>{selectedEntry.sesionId || 'N/A'}</span></div>
                  <div className="detail-item"><label>Resultado:</label> <span className={`status-badge ${selectedEntry.resultado === 'exitoso' ? 'success' : 'error'}`}>{selectedEntry.resultado === 'exitoso' ? 'Éxito' : 'Error'}</span></div>
                  <div className="detail-item"><label>Duración:</label> <span>{formatDuration(selectedEntry.duracionMs)}</span></div>
                  <div className="detail-item"><label>IP:</label> <span>{selectedEntry.ipAddress || 'N/A'}</span></div>
                  <div className="detail-item"><label>User Agent:</label> <span>{selectedEntry.userAgent}</span></div>
                </div>
              </div>
              {selectedEntry.mensajeError && (
                <div className="detail-section">
                  <h3>Error</h3>
                  <div className="error-message">{selectedEntry.mensajeError}</div>
                </div>
              )}
              {selectedEntry.detallesAnteriores && (
                <div className="detail-section">
                  <h3>Datos Anteriores</h3>
                  <pre className="json-display">{JSON.stringify(selectedEntry.detallesAnteriores, null, 2)}</pre>
                </div>
              )}
              {selectedEntry.detallesNuevos && (
                <div className="detail-section">
                  <h3>Datos Nuevos</h3>
                  <pre className="json-display">{JSON.stringify(selectedEntry.detallesNuevos, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </Modal>
    </div>
  );
};

export default Bitacora;
