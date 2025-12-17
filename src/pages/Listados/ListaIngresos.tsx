import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/feature/DataTable';
import Modal from '../../components/feature/Modal';
import { useAuth } from '../../context/AuthProvider';
import Swal from 'sweetalert2';
import './ListadoIngresosGastos.css';

// Estilos inline para animación
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inyectar estilos si no existen
if (!document.querySelector('#spin-animation-styles')) {
  const style = document.createElement('style');
  style.id = 'spin-animation-styles';
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}
import { movimientoContableService, type MovimientoContable } from '../../services/movimientoContableService';
import { getAllCategoriasCuentas, type CategoriaCuenta } from '../../services/categoriaCuentaService';
import { getBanks, type CuentaBancaria } from '../../services/bankService';
import { getUsers } from '../../services/userService';
import { Edit2, Eye, TrendingUp, Search, Calendar, DollarSign, Tag, CreditCard, User } from 'lucide-react';
import { FaEye, FaEdit } from 'react-icons/fa';
import { formatearMonto } from '../../utils/montoUtils';
import { filterMovimientos, filterMovimientosAsync } from '../../utils/movimientoFilters';



const ListaIngresosCorregida: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [filterText, setFilterText] = useState('');
  const [debouncedFilterText, setDebouncedFilterText] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterMonto, setFilterMonto] = useState('');
  const [filterMetodo, setFilterMetodo] = useState('');
  const [filterCuenta, setFilterCuenta] = useState('');
  const [filterUsuario, setFilterUsuario] = useState('');
  const [allCategoriasCuenta, setAllCategoriasCuenta] = useState<CategoriaCuenta[]>([]);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterProgress, setFilterProgress] = useState(0);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterAbortRef = useRef<{ abort: boolean }>({ abort: false });
  const [metodosUnicos, setMetodosUnicos] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoContable | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MovimientoContable>>({});
  
  // Refs para debounce y caché
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formattedDatesCache = useRef<Map<string, string>>(new Map());

  const fetchCategorias = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getAllCategoriasCuentas();
      // Filtrar solo categorías de ingresos
      const categoriasIngreso = data.filter((cat: CategoriaCuenta) => cat.tipo === 'ingreso');
      setAllCategoriasCuenta(categoriasIngreso);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire('Error', 'Error al cargar las categorías de cuenta. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const fetchCuentasBancarias = async () => {
    if (!isAuthenticated) return;
    try {
      const banks = await getBanks();
      const cuentas: CuentaBancaria[] = [];
      banks.forEach(bank => {
        if (bank.cuentas) {
          cuentas.push(...bank.cuentas);
        }
      });
      setCuentasBancarias(cuentas);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
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
      const data = await movimientoContableService.getMovimientosByTipo('ingreso');
      const metodos = [...new Set(data.map((mov: MovimientoContable) => mov.metodo))];
      setMetodosUnicos(metodos);
    } catch (error) {
      console.error('Error fetching unique methods:', error);
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
      Swal.fire('Éxito', 'Ingreso actualizado correctamente', 'success');
      setIsEditModalOpen(false);
      fetchMovimientos();
    } catch (error) {
      console.error('Error updating movimiento:', error);
      Swal.fire('Error', 'Error al actualizar el ingreso', 'error');
    }
  };

  const fetchMovimientos = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await movimientoContableService.getMovimientosByTipo('ingreso');
      setMovimientos(data);
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      Swal.fire('Error', 'Error al cargar los movimientos. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  // Debounce para el texto de búsqueda
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    setIsFiltering(true);
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedFilterText(filterText);
      setIsFiltering(false);
    }, 300);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filterText]);

  useEffect(() => {
    fetchCategorias();
    fetchMovimientos();
    fetchCuentasBancarias();
    fetchUsuarios();
    fetchMetodosUnicos();
    
    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);



  const [filteredMovimientos, setFilteredMovimientos] = useState<MovimientoContable[]>([]);

  // Efecto para filtrado asíncrono con cancelación
  useEffect(() => {
    // Cancelar cualquier filtrado pendiente
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    filterAbortRef.current.abort = true;

    const filters = {
      text: debouncedFilterText,
      fecha: filterFecha,
      categoria: filterCategoria,
      monto: filterMonto,
      metodo: filterMetodo,
      cuenta: filterCuenta,
      usuario: filterUsuario
    };

    const hasFilters = filters.text || filters.fecha || filters.categoria || 
                      filters.monto || filters.metodo || filters.cuenta || filters.usuario;
    
    if (!hasFilters) {
      setFilteredMovimientos(movimientos);
      setIsFiltering(false);
      return;
    }

    // Si el filtro de texto es muy corto, no filtrar
    if (filters.text && filters.text.length < 2) {
      setFilteredMovimientos([]);
      setIsFiltering(false);
      return;
    }

    // Crear nuevo controlador de abort
    const currentAbortRef = { abort: false };
    filterAbortRef.current = currentAbortRef;

    // Timeout para evitar filtrados demasiado frecuentes
    filterTimeoutRef.current = setTimeout(() => {
      if (currentAbortRef.abort) return;

      setIsFiltering(true);
      setFilterProgress(0);

      // Usar filtrado asíncrono para evitar bloqueos
      filterMovimientosAsync(
        movimientos, 
        allCategoriasCuenta, 
        filters,
        (progress) => {
          if (!currentAbortRef.abort) {
            setFilterProgress(progress);
          }
        },
        currentAbortRef
      ).then((results) => {
        if (!currentAbortRef.abort) {
          setFilteredMovimientos(results);
          setIsFiltering(false);
          setFilterProgress(100);
        }
      }).catch((error) => {
        if (!currentAbortRef.abort) {
          console.error('Error en filtrado:', error);
          setFilteredMovimientos([]);
          setIsFiltering(false);
        }
      });
    }, 100); // Pequeño delay adicional

    // Cleanup
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      currentAbortRef.abort = true;
    };
  }, [movimientos, debouncedFilterText, filterFecha, filterCategoria, filterMonto, filterMetodo, filterCuenta, filterUsuario, allCategoriasCuenta]);


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
        <span style={{ fontWeight: 'bold', color: 'var(--colors-success-main)' }}>
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
            title="Editar ingreso"
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
            <TrendingUp className="icon" size={28} />
            Listado de Ingresos
          </h1>
          <p>Consulta y gestión de ingresos registrados</p>
        </div>
      </div>

      <div className="datatable-wrapper">
        {/* Filtros */}
        <div className="filters-container">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="searchText"><Search size={14} /> Buscar</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="searchText"
                  placeholder="Descripción, categoría, usuario..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className={`form-input compact ${isFiltering ? 'searching' : ''}`}
                />
                {isFiltering && (
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e5e7eb',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}>
                  </div>
                )}
              </div>
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
              <label htmlFor="cuenta"><CreditCard size={14} /> Cuenta</label>
              <select
                id="cuenta"
                value={filterCuenta}
                onChange={(e) => setFilterCuenta(e.target.value)}
                className="form-input compact"
              >
                <option value="">Todas</option>
                {cuentasBancarias.map(cuenta => (
                  <option key={cuenta.id} value={cuenta.numeroCuenta}>
                    {cuenta.numeroCuenta} - {cuenta.nombre}
                  </option>
                ))}
              </select>
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
                  setFilterCuenta('');
                  setFilterUsuario('');
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Indicador de carga y progreso */}
        {isFiltering && (
          <div style={{
            background: 'var(--colors-background-paper)',
            padding: '20px',
            borderRadius: '8px',
            margin: '10px 0',
            textAlign: 'center',
            border: '1px solid var(--colors-divider)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid var(--colors-divider)',
                borderTop: '2px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Filtrando datos...</span>
            </div>
            <div style={{
              background: 'var(--colors-divider)',
              borderRadius: '4px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'var(--primary-color)',
                height: '100%',
                width: `${filterProgress}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <small style={{ color: 'var(--colors-text-secondary)', marginTop: '5px', display: 'block' }}>
              Progreso: {Math.round(filterProgress)}%
            </small>
            <button
              onClick={() => {
                filterAbortRef.current.abort = true;
                setIsFiltering(false);
                setFilterProgress(0);
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Cancelar búsqueda
            </button>
          </div>
        )}

        {/* Mensaje cuando hay muchos resultados */}
        {!isFiltering && filteredMovimientos.length >= 500 && (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: '15px',
            borderRadius: '8px',
            margin: '10px 0',
            border: '1px solid #ffeaa7',
            textAlign: 'center'
          }}>
            <strong>ℹ️ Mostrando los primeros 500 resultados</strong><br/>
            <small>Refina tu búsqueda para obtener resultados más específicos</small>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {!isFiltering && filteredMovimientos.length === 0 && (debouncedFilterText || filterFecha || filterCategoria || filterMonto || filterMetodo || filterCuenta || filterUsuario) && (
          <div style={{
            background: 'var(--colors-background-paper)',
            padding: '40px 20px',
            borderRadius: '8px',
            margin: '10px 0',
            textAlign: 'center',
            border: '1px solid var(--colors-divider)',
            color: 'var(--colors-text-secondary)'
          }}>
            <Search size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--colors-text-primary)' }}>Sin resultados</h3>
            <p style={{ margin: 0 }}>No se encontraron movimientos que coincidan con los filtros aplicados.</p>
            <small style={{ display: 'block', marginTop: '10px' }}>Intenta con términos de búsqueda diferentes</small>
          </div>
        )}

        {/* Datatable */}
        <DataTable
          columns={columns}
          data={filteredMovimientos}
          isLoading={isFiltering}
          tableName="ingresos"
        />
      </div>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles del Ingreso"
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
              <p style={{ color: 'var(--colors-success-main)', fontWeight: 'bold' }}>{formatearMonto(selectedMovimiento.monto)}</p>
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
        title="Editar Ingreso"
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
                    .filter(cat => ['ingreso', 'activo', 'patrimonio'].includes(cat.tipo))
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
                    {cuentasBancarias.map(cuenta => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.numeroCuenta} - {cuenta.nombre}
                      </option>
                    ))}
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

export default ListaIngresosCorregida;
