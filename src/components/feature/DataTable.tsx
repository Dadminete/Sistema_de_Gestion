import React, { useMemo } from 'react';
import { 
    useReactTable, 
    getCoreRowModel, 
    getPaginationRowModel, 
    getFilteredRowModel, 
    getSortedRowModel, 
    ColumnDef, 
    flexRender 
} from '@tanstack/react-table';
import { FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import './DataTable.css';

interface DataTableProps<T extends object> {
    columns: ColumnDef<T>[];
    data: T[];
    isLoading: boolean;
    tableName: string;
    getRowProps?: (row: T) => React.HTMLAttributes<HTMLTableRowElement>;
}

const DataTable = <T extends object>({ columns, data, isLoading, tableName, getRowProps }: DataTableProps<T>) => {
    const table = useReactTable({
        columns,
        data,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className="data-table-wrapper">
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        <span className="sort-icon">
                                            {{ asc: <FaSortUp />, desc: <FaSortDown /> }[header.column.getIsSorted() as string] ?? <FaSort />}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={columns.length}>Cargando...</td></tr>
                        ) : table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map(row => {
                                const rowProps = getRowProps ? getRowProps(row.original) : {};
                                return (
                                    <tr key={row.id} {...rowProps}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan={columns.length}>No hay datos disponibles.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="pagination-controls">
                <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><FaAngleDoubleLeft /></button>
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><FaChevronLeft /></button>
                <span>
                    Página{' '}
                    <strong>
                        {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                    </strong>
                </span>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><FaChevronRight /></button>
                <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><FaAngleDoubleRight /></button>
            </div>
        </div>
    );
};

export default DataTable;
