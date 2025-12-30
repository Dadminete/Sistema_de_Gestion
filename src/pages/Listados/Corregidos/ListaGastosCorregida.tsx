import React, { useState, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../../components/feature/DataTable';
import { useAuth } from '../../../context/AuthProvider';
import Swal from 'sweetalert2';
import './FiltrosListados.css';
import { movimientoContableService, type MovimientoContable } from '../../../services/movimientoContableService';
import { getAllCategoriasCuentas, type CategoriaCuenta } from '../../../services/categoriaCuentaService';
import { getBanks, type Bank } from '../../../services/bankService';
import { formatearMonto } from '../../../utils/montoUtils';

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

  useEffect(() => {
    fetchCategorias();
    fetchMovimientos();
    fetchBanks();
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
  ], [allCategoriasCuenta]);

  return (
    <div className="listado-ingresos-gastos-container">
      <div className="data-table-card">
        <h2>Listado de Gastos</h2>

        {/* Filtros fuera del datatable */}
        <div className="filters-section">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Buscar por todo..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Fecha (DD-MM-YYYY)"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Categoría"
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-row">
            <input
              type="text"
              placeholder="Monto"
              value={filterMonto}
              onChange={(e) => setFilterMonto(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Método"
              value={filterMetodo}
              onChange={(e) => setFilterMetodo(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Cuenta"
              value={filterCuenta}
              onChange={(e) => setFilterCuenta(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Usuario"
              value={filterUsuario}
              onChange={(e) => setFilterUsuario(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Datatable */}
        <div className="data-table-section">
          <DataTable
            columns={columns}
            data={filteredMovimientos}
            isLoading={false}
            tableName="gastos"
          />
        </div>
      </div>
    </div>
  );
};

export default ListaGastosCorregida;