import React, { useState, useEffect } from 'react';
import './BankDetail.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getBanks, getBankById, getAccountsByBankId, createAccount, updateAccount, deleteAccount, getClientPaymentsByBank } from '../services/bankService';
import type { Bank, ClientPayment } from '../services/bankService';
import { movimientoContableService } from '../services/movimientoContableService';
import { getAllCuentaContables } from '../services/cuentaContableService';
import type { BankWithAccounts, CuentaBancaria } from '../services/bankService';
import type { MovimientoContable } from '../services/movimientoContableService';
import type { CuentaContable } from '../services/cuentaContableService';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { formatearMontoConSigno, formatearMonto } from '../utils/montoUtils';
import Swal from 'sweetalert2';
import type { ColumnDef } from '@tanstack/react-table';

// Get dynamic API base URL
const getAPIBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, '');
  }
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  return `${protocol}://${hostname}${port}`;
};

const RAW_API_BASE = getAPIBaseURL();
const API_BASE = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : `${RAW_API_BASE.replace(/\/$/, '')}/api`;

interface CategoriaCuenta {
  id: string;
  nombre: string;
  codigo: string;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  subtipo?: string | null;
  esDetalle: boolean;
  activa: boolean;
}

const initialNewAccountState = {
  bankId: '',
  numeroCuenta: '',
  tipoCuenta: '',
  moneda: 'DOP',
  nombreOficialCuenta: '',
  cuentaContableId: '',
  activo: true,
  observaciones: '',
};

const BankDetail: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const [bank, setBank] = useState<BankWithAccounts | null>(null);
  const [accounts, setAccounts] = useState<CuentaBancaria[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [cuentasContables, setCuentasContables] = useState<CuentaContable[]>([]);
  const [accountBalances, setAccountBalances] = useState<{ [key: string]: number }>({});
  const [allCategoriasCuenta, setAllCategoriasCuenta] = useState<CategoriaCuenta[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CuentaBancaria | null>(null);
  const [newAccount, setNewAccount] = useState(initialNewAccountState);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoContable | null>(null);
  const [movimientoForm, setMovimientoForm] = useState({
    tipo: 'ingreso' as 'ingreso' | 'gasto',
    monto: '',
    categoriaId: '',
    metodo: 'caja' as 'caja' | 'banco' | 'papeleria',
    bankId: '',
    cuentaBancariaId: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);

  const getAuthHeaders = (contentType: string = 'application/json'): HeadersInit => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token && bankId) {
      fetchBankData();
      fetchCuentasContables();
      fetchCategorias();
    } else if (!token) {
      setError('Debes iniciar sesión para acceder a esta página');
      setLoading(false);
    }
  }, [bankId]);

  const fetchBankData = async () => {
    try {
      setLoading(true);
      setError(null);

      const bankData = await getBankById(bankId!);
      if (!bankData) {
        try {
          const banksData = await getBanks();
          setAvailableBanks(banksData);
        } catch (err) {
          console.error('Error fetching available banks:', err);
          setAvailableBanks([]);
        }
        setBank(null);
        setAccounts([]);
        setMovimientos([]);
        setAccountBalances({});
        return;
      }

      const [accountsData, movimientosData, paymentsData] = await Promise.all([
        getAccountsByBankId(bankId!),
        movimientoContableService.getMovimientosByMetodo('banco'),
        getClientPaymentsByBank(bankId!)
      ]);

      const bankMovements = movimientosData.filter(mov =>
        accountsData.some(account => account.id === mov.cuentaBancariaId)
      );

      const balances: { [key: string]: number } = {};
      accountsData.forEach(account => {
        balances[account.id] = account.saldo;
      });

      setBank(bankData);
      setAccounts(accountsData);
      setMovimientos(bankMovements);
      setClientPayments(paymentsData);
      setAccountBalances(balances);
    } catch (err) {
      console.error('Error al cargar datos del banco:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar datos del banco';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchCuentasContables = async () => {
    try {
      const data = await getAllCuentaContables();
      setCuentasContables(data);
    } catch (err) {
      console.error('Error al cargar cuentas contables:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar cuentas contables';
      setError(errorMessage);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE}/contabilidad/categorias-cuentas`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAllCategoriasCuenta(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar categorías';
      setError(errorMessage);
    }
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setNewAccount({ ...initialNewAccountState, bankId: bankId! });
    setShowModal(true);
  };

  const handleEditAccount = (account: CuentaBancaria) => {
    setEditingAccount(account);
    setNewAccount({
      bankId: account.bankId,
      numeroCuenta: account.numeroCuenta,
      tipoCuenta: account.tipoCuenta || '',
      moneda: account.moneda || 'DOP',
      nombreOficialCuenta: account.nombreOficialCuenta || '',
      cuentaContableId: account.cuentaContableId || '',
      activo: account.activo ?? true,
      observaciones: account.observaciones || '',
    });
    setShowModal(true);
  };

  const handleDeleteAccount = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Está seguro de que desea eliminar esta cuenta bancaria?',
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
      setError(null);
      await deleteAccount(id);
      setAccounts(accounts.filter((account) => account.id !== id));
    } catch (err) {
      console.error('Error eliminando cuenta:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando cuenta bancaria';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMovimiento = (movimiento: MovimientoContable) => {
    setEditingMovimiento(movimiento);
    setMovimientoForm({
      tipo: movimiento.tipo,
      monto: movimiento.monto.toString(),
      categoriaId: movimiento.categoriaId,
      metodo: movimiento.metodo as 'caja' | 'banco' | 'papeleria',
      bankId: movimiento.bankId || '',
      cuentaBancariaId: movimiento.cuentaBancariaId || '',
      descripcion: movimiento.descripcion || '',
    });
    setShowMovimientoModal(true);
  };

  const handleDeleteMovimiento = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Está seguro de que desea eliminar este movimiento?',
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
      setError(null);
      const response = await fetch(`${API_BASE}/contabilidad/movimientos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setMovimientos(movimientos.filter(m => m.id !== id));
        fetchBankData();
      } else {
        const errorMessage = 'Error eliminando movimiento';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error eliminando movimiento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando movimiento';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovimiento) return;

    try {
      setLoading(true);
      setError(null);
      const updateData = {
        tipo: movimientoForm.tipo,
        monto: parseFloat(movimientoForm.monto),
        categoriaId: movimientoForm.categoriaId,
        metodo: movimientoForm.metodo,
        bankId: movimientoForm.metodo === 'banco' ? movimientoForm.bankId : null,
        cuentaBancariaId: movimientoForm.metodo === 'banco' ? movimientoForm.cuentaBancariaId : null,
        descripcion: movimientoForm.descripcion || null,
      };

      const response = await fetch(`${API_BASE}/contabilidad/movimientos/${editingMovimiento.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowMovimientoModal(false);
        setEditingMovimiento(null);
        fetchBankData();
      } else {
        const errorMessage = 'Error actualizando movimiento';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error actualizando movimiento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando movimiento';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!newAccount.numeroCuenta.trim()) {
      setError('El número de cuenta es requerido');
      return false;
    }

    if (newAccount.numeroCuenta.length > 50) {
      setError('El número de cuenta no puede exceder 50 caracteres');
      return false;
    }

    if (!newAccount.cuentaContableId.trim()) {
      setError('La cuenta contable es requerida');
      return false;
    }

    if (newAccount.nombreOficialCuenta && newAccount.nombreOficialCuenta.length > 150) {
      setError('El nombre oficial de la cuenta no puede exceder 150 caracteres');
      return false;
    }

    return true;
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingAccount) {
        const updatedAccount = await updateAccount(editingAccount.id, newAccount);
        setAccounts(accounts.map((account) => (account.id === editingAccount.id ? updatedAccount : account)));
      } else {
        const createdAccount = await createAccount(newAccount);
        setAccounts([...accounts, createdAccount]);
      }

      setShowModal(false);
      setNewAccount({ ...initialNewAccountState, bankId: bankId! });
      setEditingAccount(null);
    } catch (err) {
      console.error('Error guardando cuenta:', err);
      const errorMessage = err instanceof Error ? err.message : (editingAccount ? 'Error actualizando cuenta' : 'Error creando cuenta');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const movimientoColumns: ColumnDef<MovimientoContable>[] = [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ row }) => (
        <span>{new Date(row.original.fecha).toLocaleDateString('es-ES')}</span>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.tipo === 'ingreso' ? 'success' : 'danger'}`}>
          {row.original.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
        </span>
      ),
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      cell: ({ row }) => (
        <span>{row.original.categoria.nombre}</span>
      ),
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <span>{row.original.descripcion || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: ({ row }) => (
        <span style={{ fontWeight: 'bold', color: row.original.tipo === 'ingreso' ? 'var(--colors-success-main)' : 'var(--colors-error-main)' }}>
          {formatearMontoConSigno(row.original.monto, row.original.tipo)}
        </span>
      ),
    },
    {
      accessorKey: 'metodo',
      header: 'Método',
    },
    {
      accessorKey: 'cuentaBancaria',
      header: 'Cuenta',
      cell: ({ row }) => (
        <span>{row.original.cuentaBancaria ? `${row.original.cuentaBancaria.numeroCuenta} - ${row.original.cuentaBancaria.nombreOficialCuenta || 'N/A'}` : 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'usuario',
      header: 'Usuario',
      cell: ({ row }) => (
        <span>{row.original.usuario.nombre} {row.original.usuario.apellido}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="table-actions">
          <button
            className="action-btn edit-btn"
            onClick={() => handleEditMovimiento(row.original)}
            title="Editar"
            disabled={loading}
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDeleteMovimiento(row.original.id)}
            title="Eliminar"
            disabled={loading}
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      ),
    },
  ];

  const clientPaymentColumns: ColumnDef<ClientPayment>[] = [
    {
      accessorKey: 'numeroPago',
      header: 'Número de Pago',
      cell: ({ row }) => (
        <span style={{ fontWeight: '500', color: 'var(--colors-primary)' }}>
          {row.original.numeroPago}
        </span>
      ),
    },
    {
      accessorKey: 'fechaPago',
      header: 'Fecha',
      cell: ({ row }) => (
        <span>{new Date(row.original.fechaPago).toLocaleDateString('es-ES')}</span>
      ),
    },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => (
        <span>{row.original.cliente.nombre} {row.original.cliente.apellidos}</span>
      ),
    },
    {
      accessorKey: 'codigoCliente',
      header: 'Código',
      cell: ({ row }) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--av-subtext)' }}>
          {row.original.cliente.codigoCliente}
        </span>
      ),
    },
    {
      accessorKey: 'factura',
      header: 'Factura',
      cell: ({ row }) => (
        <span>{row.original.factura?.numeroFactura || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'metodoPago',
      header: 'Método',
      cell: ({ row }) => (
        <span className="status-badge success">{row.original.metodoPago}</span>
      ),
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
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.estado === 'confirmado' ? 'success' : 'warning'}`}>
          {row.original.estado}
        </span>
      ),
    },
    {
      accessorKey: 'recibidoPor',
      header: 'Recibido por',
      cell: ({ row }) => (
        <span>{row.original.recibidoPor ? `${row.original.recibidoPor.nombre} ${row.original.recibidoPor.apellido}` : 'N/A'}</span>
      ),
    },
  ];

  if (loading && !bank) {
    return (
      <div className="bank-detail-page">
        <div className="bank-detail-header">
          <div className="header-title">
            <div className="breadcrumb">Banco / Cargando...</div>
            <h1>Cargando banco...</h1>
          </div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <span className="material-icons" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', color: 'var(--av-subtext)' }}>refresh</span>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: 'var(--av-subtext)' }}>Cargando datos del banco...</p>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="bank-detail-page">
        <div className="bank-detail-header">
          <div className="header-title">
            <div className="breadcrumb">
              <button onClick={() => navigate('/banks')} style={{ background: 'none', border: 'none', color: 'var(--av-subtext)', cursor: 'pointer' }}>
                Bancos
              </button> / Banco no encontrado
            </div>
            <h1>Banco no encontrado</h1>
            <p>El banco que buscas no existe o ha sido eliminado.</p>
          </div>
        </div>
        <div className="glass-card">
          <div style={{ textAlign: 'center', color: 'var(--av-subtext)' }}>
            <span className="material-icons" style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block' }}>account_balance</span>
            <p>El banco con ID <strong>{bankId}</strong> no fue encontrado en el sistema.</p>
            <p>Puede que haya sido eliminado o que la URL sea incorrecta.</p>
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px', textAlign: 'left' }}>
              <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Bancos disponibles:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableBanks.length > 0 ? (
                  availableBanks.map((availableBank) => (
                    <button
                      key={availableBank.id}
                      onClick={() => navigate(`/banks/${availableBank.id}`)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--colors-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <strong>{availableBank.nombre}</strong>
                      {availableBank.codigo && <span style={{ marginLeft: '0.5rem', color: 'var(--av-subtext)' }}>
                        ({availableBank.codigo})
                      </span>}
                    </button>
                  ))
                ) : (
                  <p style={{ fontSize: '0.9rem' }}>No hay bancos disponibles.</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => navigate('/banks')}
              className="btn-primary-gradient"
              style={{ marginTop: '1rem' }}
            >
              <span className="material-icons">arrow_back</span>
              Volver a Bancos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bank-detail-page">
      <div className="bank-detail-header">
        <div className="header-title">
          <h1>{bank.nombre}</h1>
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
          <span className="material-icons">error</span>
          <div>
            <strong>Error:</strong> {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: '1rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Bank Header Card */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div className="dashboard-row">
          <div className="glass-card card-bank-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className="bank-icon-large">
                <span className="material-icons">account_balance</span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--av-text)', fontSize: '1.25rem' }}>
                  {bank.nombre}
                </h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.95rem', color: 'var(--av-subtext)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>account_balance_wallet</span>
                    {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>receipt</span>
                    {movimientos.length} movimientos
                  </span>
                  <span className={`status-badge ${bank.activo ? 'success' : 'danger'}`}>
                    {bank.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          className="btn-primary-gradient"
          onClick={handleCreateAccount}
          disabled={loading}
        >
          <span className="material-icons">add</span>
          Nueva Cuenta
        </Button>
      </div>

      {/* Account Cards */}
      <div className="av-grid-cards">
        {accounts.length > 0 ? accounts.map((account, index) => {
          const balance = accountBalances[account.id] || 0;
          const isNegative = balance < 0;

          // Determine color and icon based on account type
          let colorClass = 'blue';
          let iconName = 'account_balance_wallet';

          if (account.tipoCuenta?.toLowerCase().includes('ahorro')) {
            colorClass = 'green';
            iconName = 'savings';
          } else if (account.tipoCuenta?.toLowerCase().includes('corriente')) {
            colorClass = 'blue';
            iconName = 'payments';
          } else if (account.tipoCuenta?.toLowerCase().includes('plazo')) {
            colorClass = 'purple';
            iconName = 'lock_clock';
          } else if (account.tipoCuenta?.toLowerCase().includes('credito')) {
            colorClass = 'orange';
            iconName = 'credit_card';
          }

          return (
            <div key={account.id} className="av-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="av-card-head">
                <div className="av-card-eyebrow">{account.tipoCuenta || 'CUENTA'}</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleEditAccount(account)}
                    title="Editar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--av-subtext)', padding: '4px' }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.2rem' }}>edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    title="Eliminar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--av-subtext)', padding: '4px' }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.2rem' }}>delete</span>
                  </button>
                </div>
              </div>

              <div className="av-card-title">
                {account.numeroCuenta}
              </div>

              <div className="av-card-row">
                <div className={`av-card-value ${isNegative ? 'negative' : ''}`}>
                  {formatearMonto(balance)}
                  <span style={{ fontSize: '0.5em', marginLeft: '4px', opacity: 0.7 }}>{account.moneda}</span>
                </div>
                <div className={`av-card-icon ${colorClass}`}>
                  <span className="material-icons">{iconName}</span>
                </div>
              </div>

              <div className="av-card-sub">
                {account.nombreOficialCuenta ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-icons" style={{ fontSize: '1rem' }}>person</span>
                    {account.nombreOficialCuenta}
                  </span>
                ) : (
                  <span className={`status-badge ${account.activo ? 'success' : 'danger'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                    {account.activo ? 'Activa' : 'Inactiva'}
                  </span>
                )}
              </div>

              <div className={`av-card-bar ${colorClass}`}></div>
            </div>
          );
        }) : (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <span className="material-icons" style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--av-subtext)', opacity: 0.5 }}>account_balance_wallet</span>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--av-text)' }}>No hay cuentas bancarias</h3>
            <p style={{ color: 'var(--av-subtext)', marginBottom: '24px' }}>Este banco no tiene cuentas registradas.</p>
            <Button
              className="btn-primary-gradient"
              onClick={handleCreateAccount}
            >
              <span className="material-icons">add</span>
              Agregar Primera Cuenta
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="dashboard-row">
        <div className="glass-card" style={{ width: '100%', padding: '0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: 0, color: 'var(--av-text)', fontSize: '1.1rem' }}>Movimientos Contables</h3>
          </div>
          <div className="modern-table-container">
            <DataTable columns={movimientoColumns} data={movimientos} />
          </div>
        </div>
      </div>

      {/* Client Payments Table */}
      <div className="dashboard-row">
        <div className="glass-card" style={{ width: '100%', padding: '0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: 0, color: 'var(--av-text)', fontSize: '1.1rem' }}>
              <span className="material-icons" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}>payments</span>
              Pagos de Clientes
            </h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--av-subtext)', fontSize: '0.9rem' }}>
              {clientPayments.length} pago(s) registrado(s)
            </p>
          </div>
          <div className="modern-table-container">
            {clientPayments.length > 0 ? (
              <DataTable columns={clientPaymentColumns} data={clientPayments} />
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--av-subtext)' }}>
                <span className="material-icons" style={{ fontSize: '3rem', opacity: 0.5, display: 'block', marginBottom: '1rem' }}>payments</span>
                <p>No hay pagos de clientes registrados para este banco</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal
          title={editingAccount ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setError(null);
          }}
        >
          <form onSubmit={handleSaveAccount} className="glass-modal-content-inner">
            <div className="form-group">
              <label>Número de Cuenta *</label>
              <input
                type="text"
                value={newAccount.numeroCuenta || ''}
                onChange={(e) => setNewAccount({ ...newAccount, numeroCuenta: e.target.value })}
                className="compact-input"
                required
                disabled={loading}
                maxLength={50}
              />
              <small style={{ color: 'var(--av-subtext)', fontSize: '0.8rem' }}>
                Máximo 50 caracteres
              </small>
            </div>
            <div className="form-group">
              <label>Tipo de Cuenta</label>
              <select
                value={newAccount.tipoCuenta || ''}
                onChange={(e) => setNewAccount({ ...newAccount, tipoCuenta: e.target.value })}
                className="compact-input"
                disabled={loading}
              >
                <option value="">Seleccionar tipo</option>
                <option value="Corriente">Corriente</option>
                <option value="Ahorro">Ahorro</option>
                <option value="Plazo">Plazo Fijo</option>
                <option value="Crédito">Crédito</option>
                <option value="Préstamo">Préstamo</option>
                <option value="Nómina">Nómina</option>
                <option value="Empresarial">Empresarial</option>
                <option value="Digital">Digital</option>
              </select>
            </div>
            <div className="form-group">
              <label>Moneda</label>
              <select
                value={newAccount.moneda}
                onChange={(e) => setNewAccount({ ...newAccount, moneda: e.target.value })}
                className="compact-input"
                disabled={loading}
              >
                <option value="DOP">DOP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nombre Oficial de la Cuenta</label>
              <input
                type="text"
                value={newAccount.nombreOficialCuenta || ''}
                onChange={(e) => setNewAccount({ ...newAccount, nombreOficialCuenta: e.target.value })}
                className="compact-input"
                disabled={loading}
                maxLength={150}
              />
              <small style={{ color: 'var(--av-subtext)', fontSize: '0.8rem' }}>
                Máximo 150 caracteres
              </small>
            </div>
            <div className="form-group">
              <label>Cuenta Contable *</label>
              <select
                value={newAccount.cuentaContableId}
                onChange={(e) => setNewAccount({ ...newAccount, cuentaContableId: e.target.value })}
                className="compact-input"
                required
                disabled={loading}
              >
                <option value="">Seleccionar cuenta contable</option>
                {cuentasContables.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.nombre} ({cc.codigo})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                value={newAccount.observaciones || ''}
                onChange={(e) => setNewAccount({ ...newAccount, observaciones: e.target.value })}
                className="compact-input"
                disabled={loading}
                rows={3}
                placeholder="Observaciones adicionales"
              />
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newAccount.activo}
                  onChange={(e) => setNewAccount({ ...newAccount, activo: e.target.checked })}
                  disabled={loading}
                />
                Activa
              </label>
            </div>
            <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                disabled={loading}
                className="btn-secondary-gradient"
                style={{ border: '1px solid var(--glass-border)', color: 'var(--av-text)' }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary-gradient" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showMovimientoModal && editingMovimiento && (
        <Modal
          title="Editar Movimiento Contable"
          isOpen={showMovimientoModal}
          onClose={() => {
            setShowMovimientoModal(false);
            setError(null);
          }}
        >
          <form onSubmit={handleSaveMovimiento} className="glass-modal-content-inner">
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={movimientoForm.tipo}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, tipo: e.target.value as 'ingreso' | 'gasto' })}
                className="compact-input"
                disabled={loading}
              >
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Monto</label>
              <input
                type="number"
                value={movimientoForm.monto}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, monto: e.target.value })}
                className="compact-input"
                disabled={loading}
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={movimientoForm.categoriaId}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, categoriaId: e.target.value })}
                className="compact-input"
                disabled={loading}
                required
              >
                {allCategoriasCuenta.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Método</label>
              <select
                value={movimientoForm.metodo}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, metodo: e.target.value as 'caja' | 'banco' | 'papeleria' })}
                className="compact-input"
                disabled={loading}
              >
                <option value="caja">Caja</option>
                <option value="banco">Banco</option>
                <option value="papeleria">Papelería</option>
              </select>
            </div>
            {movimientoForm.metodo === 'banco' && (
              <>
                <div className="form-group">
                  <label>Banco</label>
                  <select
                    value={movimientoForm.bankId}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, bankId: e.target.value })}
                    className="compact-input"
                    disabled={loading}
                  >
                    <option value="">Seleccionar banco</option>
                    <option value={bank?.id || ''}>{bank?.nombre || ''}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cuenta Bancaria</label>
                  <select
                    value={movimientoForm.cuentaBancariaId}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, cuentaBancariaId: e.target.value })}
                    className="compact-input"
                    disabled={loading}
                  >
                    <option value="">Seleccionar cuenta</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.nombreOficialCuenta || acc.numeroCuenta}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={movimientoForm.descripcion}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, descripcion: e.target.value })}
                className="compact-input"
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                type="button"
                onClick={() => {
                  setShowMovimientoModal(false);
                  setError(null);
                }}
                disabled={loading}
                className="btn-secondary-gradient"
                style={{ border: '1px solid var(--glass-border)', color: 'var(--av-text)' }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary-gradient" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BankDetail;