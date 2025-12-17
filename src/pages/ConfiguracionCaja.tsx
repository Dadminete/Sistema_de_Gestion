import React, { useState, useEffect } from 'react';
import { getAllCajas, setSaldoInicial } from '../services/cajaService';
import type { Caja } from '../services/cajaService';
import { useAuth } from '../context/AuthProvider';
import Swal from 'sweetalert2';
import { Settings, Save, AlertTriangle, DollarSign, Lock, Unlock } from 'lucide-react';
import '../styles/ConfiguracionCaja.css';

const ConfiguracionCaja: React.FC = () => {
  const { user } = useAuth();
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [saldos, setSaldos] = useState<Record<string, number>>({});

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const cajasData = await getAllCajas();
        setCajas(cajasData);
        const initialSaldos = cajasData.reduce((acc, caja) => {
          acc[caja.id] = caja.saldoInicial;
          return acc;
        }, {} as Record<string, number>);
        setSaldos(initialSaldos);

        // Authorization logic
        const isAdmin = user?.roles.includes('Administrador') ?? false;
        const isAssistant = user?.roles.includes('Asistente') ?? false;
        const isAccountant = user?.roles.includes('Contable') ?? false;

        if (isAdmin) {
          setIsAllowed(true);
        } else if (isAssistant || isAccountant) {
          const today = new Date();
          const isFirstDay = today.getDate() === 1;
          const needsSetup = cajasData.some(caja => caja.saldoInicial === 0);
          setIsAllowed(isFirstDay || needsSetup);
        } else {
          setIsAllowed(false);
        }

      } catch (error) {
        console.error("Error fetching cajas:", error);
        Swal.fire('Error', 'No se pudieron cargar las cajas.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initialize();
    } else {
      setLoading(false);
      setIsAllowed(false);
    }
  }, [user]);

  const fetchCajas = async () => {
    try {
      setLoading(true);
      const cajasData = await getAllCajas();
      const sortedCajas = (cajasData || []).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setCajas(sortedCajas);
      const initialSaldos = sortedCajas.reduce((acc, caja) => {
        acc[caja.id] = caja.saldoInicial;
        return acc;
      }, {} as Record<string, number>);
      setSaldos(initialSaldos);
    } catch (error) {
      console.error("Error fetching cajas:", error);
      Swal.fire('Error', 'No se pudieron cargar las cajas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaldoChange = (cajaId: string, valor: string) => {
    setSaldos(prev => ({
      ...prev,
      [cajaId]: parseFloat(valor) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas actualizar los saldos iniciales de las cajas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-custom-modal',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await Promise.all(
            Object.entries(saldos).map(([cajaId, monto]) => {
              const caja = cajas.find(c => c.id === cajaId);
              const originalSaldo = caja?.saldoInicial;
              const cuentaContableId = caja?.cuentaContableId;

              if (originalSaldo !== monto && cuentaContableId) {
                return setSaldoInicial(cuentaContableId, monto);
              }
              return Promise.resolve();
            })
          );
          Swal.fire({
            title: '¡Actualizado!',
            text: 'Los saldos de las cajas han sido actualizados.',
            icon: 'success',
            confirmButtonColor: '#3b82f6',
            customClass: {
              popup: 'swal-custom-modal',
              confirmButton: 'swal-confirm-btn'
            }
          });
          fetchCajas(); // Refresh data
        } catch (error) {
          console.error("Error updating saldos:", error);
          Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al actualizar los saldos: ' + (error as Error).message,
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: {
              popup: 'swal-custom-modal',
              confirmButton: 'swal-confirm-btn'
            }
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="configuracion-caja-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="configuracion-caja-container">
        <div className="page-header">
          <h1><Settings className="icon" size={28} /> Configuración de Saldos</h1>
          <p>Gestión de saldos iniciales para cajas</p>
        </div>
        <div className="access-denied-card">
          <Lock size={48} className="lock-icon" />
          <h2>Acceso Restringido</h2>
          <p>
            Este módulo solo está disponible para administradores sin restricciones,
            o para asistentes y contables el primer día de cada mes o cuando una caja requiere configuración inicial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="configuracion-caja-container">
      <div className="page-header">
        <h1><Settings className="icon" size={28} /> Configuración de Saldos</h1>
        <p>Establece el saldo inicial para cada caja operativa</p>
      </div>

      <div className="info-alert">
        <AlertTriangle size={20} />
        <span>
          <strong>Atención:</strong> Esta acción modificará el saldo inicial contable.
          Solo debe realizarse al inicio de operaciones o al comienzo del mes fiscal.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="config-form">
        <div className="cajas-grid">
          {cajas.map(caja => (
            <div key={caja.id} className="caja-config-card">
              <div className="caja-header">
                <div className={`caja-icon ${caja.tipo}`}>
                  <DollarSign size={20} />
                </div>
                <div className="caja-title">
                  <h3>{caja.nombre}</h3>
                  <span className={`status-badge ${caja.activa ? 'active' : 'inactive'}`}>
                    {caja.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              <div className="caja-body">
                <label htmlFor={`saldo-${caja.id}`}>Saldo Inicial</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">RD$</span>
                  <input
                    type="number"
                    id={`saldo-${caja.id}`}
                    value={saldos[caja.id] || 0}
                    onChange={(e) => handleSaldoChange(caja.id, e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg">
            <Save size={20} />
            Guardar Todos los Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracionCaja;
