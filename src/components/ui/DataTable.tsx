import { useState, type Dispatch, type SetStateAction, useMemo, useContext, useRef, useEffect } from 'react';
import './DataTable.css';
import { ThemeContext } from '../../context/ThemeProvider';
import Swal from 'sweetalert2';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

interface DataTableProps<TData extends object> {
  columns: ColumnDef<TData>[];
  data: TData[];
  sorting?: SortingState;
  setSorting?: Dispatch<SetStateAction<SortingState>>;
  createAction?: {
    label: string;
    onClick: () => void;
  };
  onRowClick?: (row: TData) => void;
  disablePagination?: boolean;
}

const DataTable = <TData extends object>({
  columns,
  data,
  sorting: externalSorting,
  setSorting: externalSetSorting,
  createAction,
  onRowClick,
  disablePagination = false,
}: DataTableProps<TData>) => {

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const isControlled = externalSorting !== undefined && externalSetSorting !== undefined;
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);

  const sorting = isControlled ? externalSorting : internalSorting;
  const setSorting = isControlled ? externalSetSorting : setInternalSorting;
  const [globalFilter, setGlobalFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});

  // Debounce search input to prevent UI freeze
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
    }, 500); // Increased to 500ms for better performance

    return () => clearTimeout(timer);
  }, [searchInput]);

  const table = useReactTable({
    data: safeData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    ...(disablePagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportExcel = async () => {
    if (safeData.length === 0) {
      Swal.fire('Sin datos', 'No hay datos para exportar', 'info');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      const columnsToExport = table.getVisibleLeafColumns().map(column => ({
        header: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
        key: column.id,
        width: 20,
      }));
      worksheet.columns = columnsToExport;

      const dataToExport = table.getRowModel().rows.map(row => {
        const rowData: { [key: string]: any } = {};
        row.getVisibleCells().forEach(cell => {
          const columnId = cell.column.id;
          rowData[columnId] = cell.getValue();
        });
        return rowData;
      });
      worksheet.addRows(dataToExport);

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'table-data.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Swal.fire('Error', 'Error al exportar a Excel', 'error');
    }
  };

  const handleExportPdf = () => {
    if (safeData.length === 0) {
      Swal.fire('Sin datos', 'No hay datos para exportar', 'info');
      return;
    }

    try {
      const doc = new jsPDF();
      const tableColumns = table.getVisibleLeafColumns().map(c =>
        typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id
      );
      const tableData = table.getRowModel().rows.map(row =>
        row.getVisibleCells().map(cell => String(cell.getValue() ?? ''))
      );

      autoTable(doc, {
        head: [tableColumns],
        body: tableData,
      });
      doc.save('table-data.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Swal.fire('Error', 'Error al exportar a PDF', 'error');
    }
  };

  const [isColumnToggleOpen, setIsColumnToggleOpen] = useState(false);
  const noData = table.getRowModel().rows.length === 0;
  const { theme } = useContext(ThemeContext);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsColumnToggleOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="data-table-container" data-theme={theme}>
      <div className="data-table-toolbar">
        <input
          type="text"
          placeholder="Buscar en la tabla..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
          disabled={noData}
        />
        <div className="data-table-actions">
          {createAction && (
            <button className="action-button create" onClick={createAction.onClick}>
              <span className="material-icons">add</span>
              {createAction.label}
            </button>
          )}
          <button className="action-button excel icon-only" onClick={handleExportExcel} disabled={noData} title="Exportar a Excel">
            <span className="material-icons">file_download</span>
          </button>
          <button className="action-button pdf icon-only" onClick={handleExportPdf} disabled={noData} title="Exportar a PDF">
            <span className="material-icons">picture_as_pdf</span>
          </button>
          <div className="column-toggle-container" ref={dropdownRef}>
            <button
              className="action-button columns"
              onClick={() => setIsColumnToggleOpen(!isColumnToggleOpen)}
              disabled={noData}
            >
              <span className="material-icons">view_column</span>
              Columnas
            </button>
            {isColumnToggleOpen && (
              <div className="column-toggle-dropdown">
                <div className="column-toggle-header">Mostrar/Ocultar Columnas</div>
                {table.getAllColumns().filter(column => column.getCanHide()).map(column => (
                  <label key={column.id} className="column-toggle-item">
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    <span>{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())
                    }
                    {header.column.getCanSort() && (
                      <span className="sort-indicator">
                        {{
                          asc: <span className="material-icons">arrow_upward</span>,
                          desc: <span className="material-icons">arrow_downward</span>,
                        }[header.column.getIsSorted() as string] ?? <span className="material-icons unfold-more">unfold_more</span>}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {noData ? (
              <tr>
                <td colSpan={columns.length} className="no-data-message">
                  <span className="material-icons icon">inbox</span>
                  <h3>No hay datos disponibles</h3>
                  <p>No se encontraron registros para mostrar.</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!noData && !disablePagination && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Página{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </strong>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="material-icons">first_page</span>
            </button>
            <button
              className="pagination-button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <button
              className="pagination-button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="material-icons">chevron_right</span>
            </button>
            <button
              className="pagination-button"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="material-icons">last_page</span>
            </button>
          </div>
          <div className="pagination-size">
            <select
              className="pagination-select"
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Mostrar {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
