import React, { useState, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/feature/DataTable';
import Modal from '../../components/feature/Modal';
import { useAuth } from '../../context/AuthProvider';
import Swal from 'sweetalert2';
import './ListadoIngresosGastos.css';
import { movimientoContableService, type MovimientoContable } from '../../services/movimientoContableService';
import { getAllCategoriasCuentas, type CategoriaCuenta } from '../../services/categoriaCuentaService';
import { getBanks, type Bank } from '../../services/bankService';
import { getUsers } from '../../services/userService';
import { Edit2, Eye, TrendingDown, Search, Calendar, DollarSign, Tag, CreditCard, User } from 'lucide-react';
import { FaEye, FaEdit } from 'react-icons/fa';
import { formatearMonto } from '../../utils/montoUtils';

interface CuentaBancaria {
  id: string;
  nombre: string;
  saldo: number;
  bankId: string;
}

const ListaGastosCorregida: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [filterText, setFilterText] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterMonto, setFilterMonto] = useState('');
  const [filterMetodo, setFilterMetodo] = useState('');
  const [filterCuenta, setFilterCuenta] = useState('');
  const [filterUsuario, setFilterUsuario] = useState('');
  const [allCategoriasCuenta, setAllCategoriasCuenta] = useState<CategoriaCuenta[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoContable | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MovimientoContable>>({});
  const [metodosUnicos, setMetodosUnicos] = useState<string[]>([]);

  const fetchCategorias = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getAllCategoriasCuentas();
      setAllCategoriasCuenta(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire('Error', 'Error al cargar las categorías de cuenta. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const fetchBanks = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getBanks();
      setBanks(data);
    } catch (error) {
      console.error('Error fetching banks:', error);
      Swal.fire('Error', 'Error al cargar los bancos. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const fetchUsuarios = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getUsers();
      setUsuarios(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMetodosUnicos = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await movimientoContableService.getMovimientosByTipo('gasto');
      const metodos = [...new Set(data.map((mov: MovimientoContable) => mov.metodo))];
      setMetodosUnicos(metodos);
    } catch (error) {
      console.error('Error fetching unique methods:', error);
    }
  };

  const fetchMovimientos = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await movimientoContableService.getMovimientosByTipo('gasto');
      setMovimientos(data);
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      Swal.fire('Error', 'Error al cargar los movimientos. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const openEditModal = (movimiento: MovimientoContable) => {
    setSelectedMovimiento(movimiento);
    setEditFormData({
      monto: movimiento.monto,
      categoriaId: movimiento.categoriaId,
      metodo: movimiento.metodo,
      descripcion: movimiento.descripcion,
      bankId: movimiento.bankId,
      cuentaBancariaId: movimiento.cuentaBancariaId,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (movimiento: MovimientoContable) => {
    setSelectedMovimiento(movimiento);
    setIsViewModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleUpdateMovimiento = async () => {
    if (!selectedMovimiento) return;

    try {
      await movimientoContableService.updateMovimiento(selectedMovimiento.id, editFormData as any);
      Swal.fire('Éxito', 'Gasto actualizado correctamente', 'success');
      setIsEditModalOpen(false);
      fetchMovimientos();
    } catch (error) {
      console.error('Error updating movimiento:', error);
      Swal.fire('Error', 'Error al actualizar el gasto', 'error');
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchMovimientos();
    fetchBanks();
    fetchUsuarios();
    fetchMetodosUnicos();
  }, []);

  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(mov => {
      const categoria = allCategoriasCuenta.find(cat => cat.id === mov.categoriaId);
      const categoriaNombre = categoria ? categoria.nombre : '';

      // Format date for search
      const formatDateForSearch = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const caracasTime = new Date(date.getTime() - (4 * 60 * 60 * 1000));
        const day = caracasTime.getDate().toString().padStart(2, '0');
        const month = (caracasTime.getMonth() + 1).toString().padStart(2, '0');
        const year = caracasTime.getFullYear();
        let hours = caracasTime.getHours();
        const minutes = caracasTime.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
      };

      const formattedFecha = formatDateForSearch(mov.fecha);

      // Verificar filtros individuales
      const matchFecha = filterFecha ?
        mov.fecha.includes(filterFecha) || formattedFecha.toLowerCase().includes(filterFecha.toLowerCase()) : true;

      const matchCategoria = filterCategoria ?
        categoriaNombre.toLowerCase().includes(filterCategoria.toLowerCase()) : true;

      const matchMonto = filterMonto ?
        mov.monto.toString().includes(filterMonto) : true;

      const matchMetodo = filterMetodo ?
        mov.metodo.toLowerCase().includes(filterMetodo.toLowerCase()) : true;

      const matchCuenta = filterCuenta ?
        (mov.cuentaBancaria?.numeroCuenta?.toLowerCase().includes(filterCuenta.toLowerCase()) || false) : true;

      const matchUsuario = filterUsuario ?
        (mov.usuario?.nombre?.toLowerCase().includes(filterUsuario.toLowerCase()) ||
          mov.usuario?.apellido?.toLowerCase().includes(filterUsuario.toLowerCase()) ||
          mov.usuario?.username?.toLowerCase().includes(filterUsuario.toLowerCase())) : true;

      // Verificar filtro de texto general
      const matchGeneral = filterText ?
        (categoriaNombre.toLowerCase().includes(filterText.toLowerCase()) ||
          mov.descripcion?.toLowerCase().includes(filterText.toLowerCase()) ||
          mov.fecha.includes(filterText) ||
          formattedFecha.toLowerCase().includes(filterText.toLowerCase()) ||
          mov.metodo.toLowerCase().includes(filterText.toLowerCase()) ||
          (mov.cuentaBancaria?.numeroCuenta?.toLowerCase().includes(filterText.toLowerCase()) || false) ||
          (mov.usuario?.nombre?.toLowerCase().includes(filterText.toLowerCase()) ||
            mov.usuario?.apellido?.toLowerCase().includes(filterText.toLowerCase()) ||
            mov.usuario?.username?.toLowerCase().includes(filterText.toLowerCase()))) : true;

      return matchFecha && matchCategoria && matchMonto && matchMetodo && matchCuenta && matchUsuario && matchGeneral;
    });
  }, [movimientos, filterText, filterFecha, filterCategoria, filterMonto, filterMetodo, filterCuenta, filterUsuario, allCategoriasCuenta]);

  const columns: ColumnDef<MovimientoContable>[] = useMemo(() => [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: info => {
        const dateStr = info.getValue() as string;
        if (!dateStr) return 'N/A';

        const date = new Date(dateStr);
        // Convert to Caracas timezone (UTC-4)
        const caracasTime = new Date(date.getTime() - (4 * 60 * 60 * 1000));

        const day = caracasTime.getDate().toString().padStart(2, '0');
        const month = (caracasTime.getMonth() + 1).toString().padStart(2, '0');
        const year = caracasTime.getFullYear();

        let hours = caracasTime.getHours();
        const minutes = caracasTime.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12

        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
      },
    },
    {
      accessorKey: 'categoriaId',
      header: 'Categoría',
      cell: ({ row }) => {
        const categoria = allCategoriasCuenta.find(cat => cat.id === row.original.categoriaId);
        return categoria ? categoria.nombre : 'N/A';
      },
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: info => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: ({ row }) => (
        <span style={{ fontWeight: 'bold', color: 'var(--colors-error-main)' }}>
          {formatearMonto(row.original.monto)}
        </span>
      ),
    },
    {
      accessorKey: 'metodo',
      header: 'Método',
    },
    {
      id: 'cuenta',
      header: 'Cuenta',
      cell: ({ row }) => (
        <span>{row.original.cuentaBancaria ? row.original.cuentaBancaria.numeroCuenta : 'N/A'}</span>
      ),
    },
    {
      id: 'usuario',
      header: 'Usuario',
      cell: ({ row }) => {
        const usuario = row.original.usuario;
        return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'N/A';
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="action-buttons">
          <button
            className="action-btn view-btn"
            onClick={() => openViewModal(row.original)}
            title="Ver detalles"
          >
            <FaEye size={16} />
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => openEditModal(row.original)}
            title="Editar gasto"
          >
            <FaEdit size={16} />
          </button>
        </div>
      ),
    },
  ], [allCategoriasCuenta]);

  return (
    <div className="listado-ingresos-gastos-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <TrendingDown className="icon" size={28} />
            Listado de Gastos
          </h1>
          <p>Consulta y gestión de gastos registrados</p>
        </div>
      </div>

      <div className="datatable-wrapper">
        {/* Filtros */}
        <div className="filters-container">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="searchText"><Search size={14} /> Buscar</label>
              <input
                type="text"
                id="searchText"
                placeholder="Descripción, categoría, usuario..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="form-input compact"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="mes"><Calendar size={14} /> Mes/Año</label>
              <input
                type="month"
                id="mes"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="form-input compact"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="categoria"><Tag size={14} /> Categoría</label>
              <select
                id="categoria"
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="form-input compact"
              >
                <option value="">Todas</option>
                {allCategoriasCuenta.map(cat => (
                  <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="metodo"><CreditCard size={14} /> Método</label>
              <select
                id="metodo"
                value={filterMetodo}
                onChange={(e) => setFilterMetodo(e.target.value)}
                className="form-input compact"
              >
                <option value="">Todos</option>
                {metodosUnicos.map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="monto"><DollarSign size={14} /> Monto</label>
              <input
                type="text"
                id="monto"
                placeholder="Ej: 1000 o >500"
                value={filterMonto}
                onChange={(e) => setFilterMonto(e.target.value)}
                className="form-input compact"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="usuario"><User size={14} /> Usuario</label>
              <select
                id="usuario"
                value={filterUsuario}
                onChange={(e) => setFilterUsuario(e.target.value)}
                className="form-input compact"
              >
                <option value="">Todos</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={`${usuario.nombre} ${usuario.apellido}`}>
                    {usuario.nombre} {usuario.apellido} (@{usuario.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <button
                className="clear-filters-btn-simple"
                onClick={() => {
                  setFilterText('');
                  setFilterFecha('');
                  setFilterCategoria('');
                  setFilterMonto('');
                  setFilterMetodo('');
                  setFilterUsuario('');
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Datatable */}
        <DataTable
          columns={columns}
          data={filteredMovimientos}
          isLoading={false}
          tableName="gastos"
        />
      </div>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles del Gasto"
      >
        {selectedMovimiento && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Fecha:</label>
              <p>{new Date(selectedMovimiento.fecha).toLocaleString('es-VE')}</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Categoría:</label>
              <p>{allCategoriasCuenta.find(c => c.id === selectedMovimiento.categoriaId)?.nombre || 'N/A'}</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Monto:</label>
              <p style={{ color: 'var(--colors-error-main)', fontWeight: 'bold' }}>{formatearMonto(selectedMovimiento.monto)}</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Método:</label>
              <p>{selectedMovimiento.metodo}</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Cuenta:</label>
              <p>{selectedMovimiento.cuentaBancaria?.numeroCuenta || 'N/A'}</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Usuario:</label>
              <p>{selectedMovimiento.usuario ? `${selectedMovimiento.usuario.nombre} ${selectedMovimiento.usuario.apellido}` : 'N/A'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Descripción:</label>
              <p>{selectedMovimiento.descripcion || 'N/A'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Gasto"
      >
        {selectedMovimiento && (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateMovimiento(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Monto:</label>
                <input
                  type="number"
                  name="monto"
                  value={editFormData.monto || ''}
                  onChange={handleEditFormChange}
                  min="0.01"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--colors-divider)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--colors-background-paper)',
                    color: 'var(--form-text-color)',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Categoría:</label>
                <select
                  name="categoriaId"
                  value={editFormData.categoriaId || ''}
                  onChange={handleEditFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--colors-divider)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--colors-background-paper)',
                    color: 'var(--form-text-color)',
                  }}
                  required
                >
                  {allCategoriasCuenta
                    .filter(cat => ['gasto', 'pasivo'].includes(cat.tipo))
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Método:</label>
                <select
                  name="metodo"
                  value={editFormData.metodo || ''}
                  onChange={handleEditFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--colors-divider)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--colors-background-paper)',
                    color: 'var(--form-text-color)',
                  }}
                  required
                >
                  <option value="caja">Caja</option>
                  <option value="banco">Banco</option>
                  <option value="papeleria">Papelería</option>
                </select>
              </div>

              {editFormData.metodo === 'banco' && (
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Cuenta Bancaria:</label>
                  <select
                    name="cuentaBancariaId"
                    value={editFormData.cuentaBancariaId || ''}
                    onChange={handleEditFormChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--colors-divider)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--colors-background-paper)',
                      color: 'var(--form-text-color)',
                    }}
                  >
                    <option value="">Seleccione una cuenta</option>
                    {/* Note: You need to add cuentasBancarias state for bank accounts */}
                  </select>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Descripción:</label>
              <textarea
                name="descripcion"
                value={editFormData.descripcion || ''}
                onChange={handleEditFormChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--colors-divider)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--colors-background-paper)',
                  color: 'var(--form-text-color)',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--colors-divider)',
                  color: 'var(--form-text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--button-text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ListaGastosCorregida;