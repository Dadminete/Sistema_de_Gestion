import React, { useState, useEffect } from 'react';
import { getRecentTransactions } from '../../services/cajaService';
import { FaSpinner, FaEye, FaFilter, FaDownload } from 'react-icons/fa';
import './RecentTransactionsTable.css';

interface Transaction {
  id: string;
  fecha: string;
  fechaMovimiento?: string;
  descripcion: string;
  categoria: string;
  monto: number | string;
  usuario: string;
  tipo: 'ingreso' | 'gasto';
  referencia?: string;
}

interface RecentTransactionsTableProps {
  limit?: number;
  period?: 'week' | 'month' | 'custom';
  onRowClick?: (transaction: Transaction) => void;
}

const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ 
  limit = 10,
  period = 'week',
  onRowClick 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'gasto'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRecentTransactions(limit);
        
        if (data && data.length > 0) {
          // Normalizar datos - convertir monto a número
          let filtered = data.map(t => ({
            ...t,
            monto: typeof t.monto === 'string' ? parseFloat(t.monto) : Number(t.monto)
          }));

          // Filtrar por tipo
          if (filterType !== 'all') {
            filtered = filtered.filter(t => t.tipo === filterType);
          }

          // Ordenar
          if (sortBy === 'date') {
            filtered = filtered.sort((a, b) => 
              new Date(b.fechaMovimiento || b.fecha).getTime() - 
              new Date(a.fechaMovimiento || a.fecha).getTime()
            );
          } else {
            filtered = filtered.sort((a, b) => b.monto - a.monto);
          }

          setTransactions(filtered);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error('Error cargando transacciones:', err);
        setError('No se pudieron cargar las transacciones');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [period, filterType, sortBy, limit]);

  // Mantener la función para reutilización si es necesaria
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecentTransactions(limit);
      
      if (data && data.length > 0) {
        // Normalizar datos - convertir monto a número
        let filtered = data.map(t => ({
          ...t,
          monto: typeof t.monto === 'string' ? parseFloat(t.monto) : Number(t.monto)
        }));

        // Filtrar por tipo
        if (filterType !== 'all') {
          filtered = filtered.filter(t => t.tipo === filterType);
        }

        // Ordenar
        if (sortBy === 'date') {
          filtered = filtered.sort((a, b) => 
            new Date(b.fechaMovimiento || b.fecha).getTime() - 
            new Date(a.fechaMovimiento || a.fecha).getTime()
          );
        } else {
          filtered = filtered.sort((a, b) => b.monto - a.monto);
        }

        setTransactions(filtered);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error cargando transacciones:', err);
      setError('No se pudieron cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCategoryBadge = (categoria: string) => {
    const badges: { [key: string]: string } = {
      'ventas': '🛍️',
      'devoluciones': '↩️',
      'mantenimiento': '🔧',
      'servicios': '⚙️',
      'otros': '📌',
      'salarios': '💼',
      'utilidades': '💰',
      'intereses': '📈'
    };
    return badges[categoria.toLowerCase()] || '📝';
  };

  const getTotalAmount = () => {
    return transactions.reduce((sum, t) => {
      const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : Number(t.monto);
      return t.tipo === 'ingreso' ? sum + monto : sum - monto;
    }, 0);
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Usuario'];
    const rows = transactions.map(t => [
      formatDate(t.fechaMovimiento || t.fecha),
      t.descripcion,
      t.categoria,
      t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      t.monto,
      t.usuario
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="transactions-loading">
        <FaSpinner className="spinner-icon" />
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-error">
        <p>{error}</p>
        <button onClick={fetchTransactions} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="recent-transactions-container">
      <div className="transactions-toolbar">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as 'all' | 'ingreso' | 'gasto')}
            className="filter-select"
          >
            <option value="all">Todas las transacciones</option>
            <option value="ingreso">Solo Ingresos</option>
            <option value="gasto">Solo Gastos</option>
          </select>
        </div>

        <div className="sort-group">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="sort-select"
          >
            <option value="date">Ordenar por fecha</option>
            <option value="amount">Ordenar por monto</option>
          </select>
        </div>

        <button onClick={exportToCSV} className="export-btn" title="Exportar a CSV">
          <FaDownload /> Exportar
        </button>
      </div>

      <div className="transactions-summary">
        <div className="summary-item">
          <span className="summary-label">Total Ingresos:</span>
          <span className="summary-value income">
            {formatCurrency(transactions
              .filter(t => t.tipo === 'ingreso')
              .reduce((sum, t) => {
                const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : Number(t.monto);
                return sum + monto;
              }, 0)
            )}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Gastos:</span>
          <span className="summary-value expense">
            {formatCurrency(transactions
              .filter(t => t.tipo === 'gasto')
              .reduce((sum, t) => {
                const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : Number(t.monto);
                return sum + monto;
              }, 0)
            )}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Neto:</span>
          <span className={`summary-value ${getTotalAmount() >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(getTotalAmount())}
          </span>
        </div>
      </div>

      <div className="transactions-table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th className="col-type">Tipo</th>
              <th className="col-fecha">Fecha</th>
              <th className="col-descripcion">Descripción</th>
              <th className="col-categoria">Categoría</th>
              <th className="col-monto">Monto</th>
              <th className="col-usuario">Usuario</th>
              <th className="col-accion">Acción</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  className={`transaction-row transaction-${transaction.tipo}`}
                  onClick={() => onRowClick && onRowClick(transaction)}
                >
                  <td className="col-type">
                    <span className={`badge badge-${transaction.tipo}`}>
                      {transaction.tipo === 'ingreso' ? '📥 Ingreso' : '📤 Gasto'}
                    </span>
                  </td>
                  <td className="col-fecha">
                    <div className="fecha-cell">
                      {formatDate(transaction.fechaMovimiento || transaction.fecha)}
                    </div>
                  </td>
                  <td className="col-descripcion">
                    <div className="descripcion-cell">
                      <strong>{transaction.descripcion}</strong>
                      {transaction.referencia && (
                        <span className="referencia">Ref: {transaction.referencia}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-categoria">
                    <span className="categoria-badge">
                      {getCategoryBadge(transaction.categoria)} {transaction.categoria}
                    </span>
                  </td>
                  <td className="col-monto">
                    <span className={`monto ${transaction.tipo}`}>
                      {transaction.tipo === 'ingreso' ? '+' : '-'}
                      {formatCurrency(typeof transaction.monto === 'string' ? parseFloat(transaction.monto) : Number(transaction.monto))}
                    </span>
                  </td>
                  <td className="col-usuario">
                    <span className="usuario-badge">{transaction.usuario}</span>
                  </td>
                  <td className="col-accion">
                    <button 
                      className="btn-view-transaction"
                      title="Ver detalles"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRowClick) onRowClick(transaction);
                      }}
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="empty-state-row">
                <td colSpan={7}>
                  <div className="empty-state">
                    <p>No hay transacciones disponibles</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > 0 && (
        <div className="transactions-footer">
          <span className="transaction-count">
            Mostrando {transactions.length} de {transactions.length} transacciones
          </span>
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsTable;
