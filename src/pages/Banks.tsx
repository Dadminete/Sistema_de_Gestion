import React, { useState, useEffect } from 'react';
import './Banks.css';
import { useNavigate } from 'react-router-dom';
import { getBanks, createBank, updateBank, deleteBank, getAccountsByBankId } from '../services/bankService';
import type { Bank, CuentaBancaria } from '../services/bankService';
import { getAllCuentaContables } from '../services/cuentaContableService';
import type { CuentaContable } from '../services/cuentaContableService';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import InfoCard from '../components/ui/InfoCard';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';



const initialNewBankState = {
  nombre: '',
  codigo: '',
  activo: true,
};

const Banks: React.FC = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [newBank, setNewBank] = useState(initialNewBankState);
  const [bankAccounts, setBankAccounts] = useState<CuentaBancaria[]>([]);
  const [cuentasContables, setCuentasContables] = useState<CuentaContable[]>([]); // New state for CuentaContable
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      fetchBanks();
      fetchCuentasContables(); // Fetch CuentaContable data
    } else {
      setError('Debes iniciar sesión para acceder a esta página');
    }
  }, []);

  const calculateStats = (banksData: Bank[]) => {
    const totalBanks = banksData.length;
    const activeBanks = banksData.filter(b => b.activo).length;
    const totalAccounts = banksData.reduce((sum, bank) => sum + (bank.cuentas?.length || 0), 0);
    const averageAccountsPerBank = totalBanks > 0 ? totalAccounts / totalBanks : 0;
  };

  const fetchBanks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBanks();
      const sortedBanks = data.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setBanks(sortedBanks);
    } catch (err) {
      console.error('Error al cargar bancos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar bancos';
      setError(errorMessage);
      setBanks([]);
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

  const handleCreate = () => {
    setEditingBank(null);
    setNewBank(initialNewBankState);
    setBankAccounts([]); // Clear accounts for new bank
    setShowModal(true);
  };

  const handleEdit = async (bank: Bank) => {
    setLoading(true);
    setError(null);
    try {
      const accountsData = await getAccountsByBankId(bank.id);
      setEditingBank(bank);
      setNewBank({
        nombre: bank.nombre,
        codigo: bank.codigo || '',
        activo: bank.activo,
      });
      setBankAccounts(accountsData);
      setShowModal(true);
    } catch (err) {
      console.error('Error al cargar cuentas bancarias:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar cuentas bancarias';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (index: number, field: keyof CuentaBancaria, value: string | boolean) => {
    const updatedAccounts = [...bankAccounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setBankAccounts(updatedAccounts);
  };

  const handleAddAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        id: `new-${Date.now()}`, // Temporary ID for new accounts
        bankId: editingBank?.id || '',
        numeroCuenta: '',
        tipoCuenta: '',
        moneda: 'DOP',
        nombreOficialCuenta: '',
        cuentaContableId: '', // Set to empty string instead of generating a UUID
        activo: true,
        observaciones: '',
        nombre: '', // Will be set when numeroCuenta is entered
        saldo: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const handleRemoveAccount = (index: number) => {
    const updatedAccounts = bankAccounts.filter((_, i) => i !== index);
    setBankAccounts(updatedAccounts);
  };



  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Está seguro de que desea eliminar este banco? Esto solo lo desactivará.',
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
      await deleteBank(id);
      setBanks(banks.filter((bank) => bank.id !== id));
    } catch (err) {
      console.error('Error eliminando banco:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando banco';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!newBank.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }

    if (newBank.nombre.length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return false;
    }

    if (newBank.codigo && newBank.codigo.length > 10) {
      setError('El código no puede exceder 10 caracteres');
      return false;
    }

    // Check for duplicate codes when creating new bank
    if (!editingBank && newBank.codigo) {
      const existingBank = banks.find(bank =>
        bank.codigo?.toLowerCase() === newBank.codigo.toLowerCase()
      );
      if (existingBank) {
        setError(`Ya existe un banco con el código "${newBank.codigo}". Por favor, use un código diferente.`);
        return false;
      }
    }

    // Check for duplicate names when creating new bank
    if (!editingBank) {
      const existingBank = banks.find(bank =>
        bank.nombre.toLowerCase() === newBank.nombre.toLowerCase()
      );
      if (existingBank) {
        setError(`Ya existe un banco con el nombre "${newBank.nombre}". Por favor, use un nombre diferente.`);
        return false;
      }
    }

    // Validate bank accounts
    if (editingBank) { // Only validate accounts when editing an existing bank
      for (const account of bankAccounts) {
        if (!account.numeroCuenta.trim()) {
          setError(`El número de cuenta es requerido para la cuenta "${account.nombreOficialCuenta || account.id}"`);
          return false;
        }
        if (account.numeroCuenta.length > 50) {
          setError(`El número de cuenta no puede exceder 50 caracteres para la cuenta "${account.nombreOficialCuenta || account.id}"`);
          return false;
        }
        if (!account.cuentaContableId.trim()) {
          setError(`El ID de cuenta contable es requerido para la cuenta "${account.nombreOficialCuenta || account.id}"`);
          return false;
        }
        if (account.nombreOficialCuenta && account.nombreOficialCuenta.length > 150) {
          setError(`El nombre oficial de la cuenta no puede exceder 150 caracteres para la cuenta "${account.nombreOficialCuenta || account.id}"`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingBank) {
        // Update bank and its accounts
        const updatedBank = await updateBank(editingBank.id, { ...newBank, cuentas: bankAccounts });
        setBanks(banks.map((bank) => (bank.id === editingBank.id ? updatedBank : bank)));
      } else {
        // Create new bank (accounts cannot be created with a new bank in this flow, only added after creation)
        const createdBank = await createBank(newBank);
        setBanks([...banks, createdBank]);
      }

      // Only close modal and reset form on success
      setShowModal(false);
      setNewBank(initialNewBankState);
      setEditingBank(null);
    } catch (err) {
      console.error('Error guardando banco:', err);
      const errorMessage = err instanceof Error ? err.message : (editingBank ? 'Error actualizando banco' : 'Error creando banco');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Bank>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/banks/${row.original.id}`)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--colors-primary)',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: 'inherit',
            fontFamily: 'inherit'
          }}
          title="Ver detalles del banco"
        >
          {row.original.nombre}
        </button>
      ),
    },
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: ({ row }) => (
        <span>{row.original.codigo || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.activo ? 'success' : 'danger'}`}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      accessorKey: 'cuentas',
      header: 'Cuentas',
      cell: ({ row }) => (
        <span>{row.original.cuentas?.length || 0} cuentas</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="table-actions">
          <button
            className="action-btn view-btn"
            onClick={() => navigate(`/banks/${row.original.id}`)}
            title="Ver detalles"
            disabled={loading}
          >
            <span className="material-icons">visibility</span>
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => handleEdit(row.original)}
            title="Editar"
            disabled={loading}
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(row.original.id)}
            title="Eliminar"
            disabled={loading}
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      ),
    },
  ];

  // Mostrar loading inicial
  if (loading && banks.length === 0) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="breadcrumb">Gestión / Bancos</div>
            <h1>Gestión de Bancos</h1>
            <p>Administra las instituciones financieras.</p>
          </div>
        </div>
        <div className="loading-message" style={{
          textAlign: 'center',
          padding: '4rem',
          color: 'var(--colors-text-secondary)'
        }}>
          <span className="material-icons" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>refresh</span>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Cargando bancos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb"><h1>Gestión de Bancos</h1>
          <p>
            Administra las instituciones financieras y sus cuentas asociadas.
          </p></div>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button title="Refresh" onClick={fetchBanks} disabled={loading}>
              <span className="material-icons">refresh</span>
            </button>
            <button title="Nuevo Banco" onClick={() => {
              setEditingBank(null);
              setNewBank(initialNewBankState);
              setBankAccounts([]);
              setShowModal(true);
            }} disabled={loading}>
              <span className="material-icons">add</span>
            </button>
          </div>
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

      {banks.length === 0 ? (
        <div className="glass-container">
          <InfoCard title="No hay bancos registrados">
            <div style={{ textAlign: 'center', color: 'var(--av-subtext)' }}>
              <span className="material-icons" style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }}>account_balance</span>
              <p>No se han registrado bancos en el sistema aún.</p>
              <p>Haz clic en "Nuevo Banco" para agregar el primer banco.</p>
            </div>
          </InfoCard>
        </div>
      ) : (
        <div className="glass-container">
          <DataTable columns={columns} data={banks} />
        </div>
      )}

      {showModal && (
        <Modal
          title={editingBank ? 'Editar Banco' : 'Nuevo Banco'}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setError(null);
          }}
        >
          <form onSubmit={handleSave} className="glass-modal-content-inner">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={newBank.nombre}
                onChange={(e) => setNewBank({ ...newBank, nombre: e.target.value })}
                className="compact-input"
                required
                disabled={loading}
                maxLength={100}
              />
              <small style={{ color: 'var(--av-subtext)', fontSize: '0.8rem' }}>
                Máximo 100 caracteres
              </small>
            </div>
            <div className="form-group">
              <label>Código</label>
              <input
                type="text"
                value={newBank.codigo}
                onChange={(e) => setNewBank({ ...newBank, codigo: e.target.value })}
                className="compact-input"
                disabled={loading}
                maxLength={10}
                placeholder="Código opcional"
              />
              <small style={{ color: 'var(--av-subtext)', fontSize: '0.8rem' }}>
                Máximo 10 caracteres
              </small>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newBank.activo}
                  onChange={(e) => setNewBank({ ...newBank, activo: e.target.checked })}
                  disabled={loading}
                />
                Activo
              </label>
            </div>

            {editingBank && (
              <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                <label>Cuentas Bancarias</label>
                <p style={{ fontSize: '0.9rem', color: 'var(--av-subtext)', marginBottom: '1rem' }}>
                  Añade o edita las cuentas bancarias asociadas a este banco.
                </p>

                {bankAccounts.map((account, index) => (
                  <div key={account.id || `new-${index}`} style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)' }}>
                    <h4 style={{ marginTop: '0', marginBottom: '1rem', color: 'var(--av-text)' }}>
                      Cuenta #{index + 1} {account.numeroCuenta ? `(${account.numeroCuenta})` : ''}
                    </h4>
                    <div className="form-group">
                      <label>Número de Cuenta *</label>
                      <input
                        type="text"
                        value={account.numeroCuenta}
                        onChange={(e) => handleAccountChange(index, 'numeroCuenta', e.target.value)}
                        className="compact-input"
                        required
                        disabled={loading}
                        maxLength={50}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tipo de Cuenta</label>
                      <select
                        value={account.tipoCuenta || ''}
                        onChange={(e) => handleAccountChange(index, 'tipoCuenta', e.target.value)}
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
                        value={account.moneda}
                        onChange={(e) => handleAccountChange(index, 'moneda', e.target.value)}
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
                        value={account.nombreOficialCuenta || ''}
                        onChange={(e) => handleAccountChange(index, 'nombreOficialCuenta', e.target.value)}
                        className="compact-input"
                        disabled={loading}
                        maxLength={150}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cuenta Contable *</label>
                      <select
                        value={account.cuentaContableId}
                        onChange={(e) => handleAccountChange(index, 'cuentaContableId', e.target.value)}
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
                        value={account.observaciones || ''}
                        onChange={(e) => handleAccountChange(index, 'observaciones', e.target.value)}
                        className="compact-input"
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={account.activo}
                          onChange={(e) => handleAccountChange(index, 'activo', e.target.checked)}
                          disabled={loading}
                        />
                        Activa
                      </label>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveAccount(index)}
                      disabled={loading}
                      className="danger"
                      style={{ marginTop: '1rem' }}
                    >
                      <span className="material-icons">remove_circle_outline</span>
                      Eliminar Cuenta
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={handleAddAccount}
                  disabled={loading}
                  className="btn-secondary-gradient"
                  style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                >
                  <span className="material-icons">add_circle_outline</span>
                  Añadir Nueva Cuenta
                </Button>
              </div>
            )}

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

    </div>
  );
};

export default Banks;
