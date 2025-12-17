import React, { useState, useEffect } from 'react';
import './Banks.css';
import { getBanks } from '../services/bankService';
import type { Bank } from '../services/bankService';
import KpiWidget from '../components/ui/KpiWidget';
import InfoCard from '../components/ui/InfoCard';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const getPercentageClass = (percentage: string) => {
  if (percentage.startsWith('+') || percentage.startsWith('↑')) {
    return 'positive';
  }
  if (percentage.startsWith('-') || percentage.startsWith('↓')) {
    return 'negative';
  }
  return '';
};

const BanksDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBanks: 0,
    activeBanks: 0,
    totalAccounts: 0,
    averageAccountsPerBank: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      fetchBanks();
    } else {
      setError('Debes iniciar sesión para acceder a esta página');
    }
  }, []);

  const calculateStats = (banksData: Bank[]) => {
    const totalBanks = banksData.length;
    const activeBanks = banksData.filter(b => b.activo).length;
    const totalAccounts = banksData.reduce((sum, bank) => sum + (bank.cuentas?.length || 0), 0);
    const averageAccountsPerBank = totalBanks > 0 ? totalAccounts / totalBanks : 0;

    setStats({
      totalBanks,
      activeBanks,
      totalAccounts,
      averageAccountsPerBank
    });
  };

  const fetchBanks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBanks();
      const sortedBanks = data.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setBanks(sortedBanks);
      calculateStats(sortedBanks);
    } catch (err) {
      console.error('Error al cargar bancos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar bancos';
      setError(errorMessage);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="breadcrumb"><h1>Dashboard de Bancos</h1>
            <p>Visualiza las estadísticas de tus instituciones financieras.</p></div>
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
          <div className="breadcrumb"><h1>Dashboard de Bancos</h1>
          <p>
            Resumen general de instituciones financieras y cuentas bancarias.
          </p></div>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button title="Refresh" onClick={fetchBanks} disabled={loading}>
              <span className="material-icons">refresh</span>
            </button>
            <button title="Ir a Gestión" onClick={() => navigate('/banks/management')} disabled={loading}>
              <span className="material-icons">settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-kpis">
        <KpiWidget
          title="BANCOS TOTALES"
          value={stats.totalBanks.toString()}
          percentage={stats.activeBanks > 0 ? `↑ ${((stats.activeBanks / stats.totalBanks) * 100).toFixed(0)}% activos` : 'N/A'}
          percentageClass={stats.activeBanks > 0 ? 'positive' : ''}
          icon={<span className="material-icons">account_balance</span>}
          barColor="#00BFA5"
        />
        <KpiWidget
          title="BANCOS ACTIVOS"
          value={stats.activeBanks.toString()}
          percentage={stats.totalBanks > 0 ? `${((stats.activeBanks / stats.totalBanks) * 100).toFixed(0)}%` : 'N/A'}
          percentageClass={getPercentageClass("↑")}
          icon={<span className="material-icons">check_circle</span>}
          barColor="#4CAF50"
        />
        <KpiWidget
          title="CUENTAS TOTALES"
          value={stats.totalAccounts.toString()}
          percentage={stats.totalAccounts > 0 ? `↑ ${stats.totalAccounts} cuentas` : 'Sin cuentas'}
          percentageClass={stats.totalAccounts > 0 ? 'positive' : ''}
          icon={<span className="material-icons">account_balance_wallet</span>}
          barColor="#2196F3"
        />
        <KpiWidget
          title="PROMEDIO CUENTAS/BANCO"
          value={stats.averageAccountsPerBank.toFixed(1)}
          percentage={stats.totalBanks > 0 ? `Total ${stats.totalBanks} bancos` : 'N/A'}
          percentageClass={stats.averageAccountsPerBank > 0 ? 'positive' : ''}
          icon={<span className="material-icons">trending_up</span>}
          barColor="#FF9800"
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-main-content">
        <div className="dashboard-row">
          <div className="card-welcome" style={{ gridColumn: '1 / -1' }}>
            <InfoCard title="Dashboard de Instituciones Financieras">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                <div>
                  <span className="material-icons" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}>account_balance</span>
                  <p>Visualiza las estadísticas y resumen de todas tus instituciones financieras.</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--av-subtext)', marginTop: '0.5rem' }}>Total de bancos: <strong>{stats.totalBanks}</strong> | Cuentas: <strong>{stats.totalAccounts}</strong></p>
                </div>
                <Button
                  className="btn-primary-gradient"
                  onClick={() => navigate('/banks/management')}
                  disabled={loading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <span className="material-icons">settings</span>
                  Ir a Gestión
                </Button>
              </div>
            </InfoCard>
          </div>
        </div>

        {error && (
          <div className="dashboard-row" style={{ marginBottom: '1rem' }}>
            <div className="error-message" style={{
              backgroundColor: 'var(--colors-error-main)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              gridColumn: '1 / -1'
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
          </div>
        )}

        {banks.length === 0 ? (
          <div className="dashboard-row" style={{ gridColumn: '1 / -1' }}>
            <div className="glass-container">
              <InfoCard title="No hay bancos registrados">
                <div style={{ textAlign: 'center', color: 'var(--av-subtext)' }}>
                  <span className="material-icons" style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }}>account_balance</span>
                  <p>No se han registrado bancos en el sistema aún.</p>
                  <p>Ve a "Gestión de Bancos" para agregar el primer banco.</p>
                </div>
              </InfoCard>
            </div>
          </div>
        ) : (
          <div className="dashboard-row" style={{ gridColumn: '1 / -1' }}>
            <div className="glass-container" style={{ width: '100%' }}>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--av-text)' }}>Bancos Registrados ({stats.totalBanks})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {banks.map(bank => (
                    <div key={bank.id} style={{
                      padding: '1rem',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }} onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }} onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <h4 style={{ margin: 0, color: 'var(--av-text)' }}>{bank.nombre}</h4>
                        <span className={`status-badge ${bank.activo ? 'success' : 'danger'}`}>
                          {bank.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {bank.codigo && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--av-subtext)' }}>Código: {bank.codigo}</p>}
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--av-subtext)' }}>Cuentas: {bank.cuentas?.length || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BanksDashboard;
