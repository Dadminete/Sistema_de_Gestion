import React, { useState, useEffect, useCallback, useMemo } from 'react';
import KpiWidget from '@/components/ui/KpiWidget';
import { Wallet, FileText, Landmark, Briefcase, Users, AlertTriangle, TrendingUp, PlayCircle, RefreshCw, Settings, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import InfoCard from '@/components/ui/InfoCard';
import RevenueChart from '@/components/charts/RevenueChart';
import SalesChart from '@/components/charts/SalesChart';
import { AuthService } from '@/services/authService';
import { getDashboardData, type DashboardData, getSavingsAnalysis, type SavingsAnalysis } from '@/services/cajaService';
import { getBanks, type Bank } from '@/services/bankService';
import { recentClientsService, type RecentSubscribedClient } from '../services/recentClientsService';
import '../styles/RecentClients.css';
import '../styles/DashboardOptimizations.css';

const getPercentageClass = (percentage: string) => {
  if (percentage.startsWith('+') || percentage.startsWith('↑')) {
    return 'positive';
  }
  if (percentage.startsWith('-') || percentage.startsWith('↓')) {
    return 'negative';
  }
  return '';
};

const Dashboard: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const userName = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Usuario';

  const [cajaData, setCajaData] = useState<DashboardData | null>(null);
  const [savingsAnalysis, setSavingsAnalysis] = useState<SavingsAnalysis | null>(null);
  const [recentClients, setRecentClients] = useState<RecentSubscribedClient[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [totalBankBalance, setTotalBankBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingClients(true);
      setError(null);

      // Show loading state immediately and track performance
      const startTime = performance.now();
      console.log('🔄 Starting dashboard data fetch...');

      const [cajaDataResult, recentClientsResult, savingsResult, banksResult] = await Promise.all([
        getDashboardData('week').catch(error => {
          console.error('Error fetching caja data:', error);
          setError('Error cargando datos de caja');
          return null;
        }),
        recentClientsService.getRecentSubscribedClients(7).catch(error => {
          console.error('Error fetching recent clients:', error);
          return [];
        }),
        getSavingsAnalysis().catch(error => {
          console.error('Error fetching savings analysis:', error);
          return null;
        }),
        getBanks().catch(error => {
          console.error('Error fetching banks:', error);
          return [];
        })
      ]);

      // Performance monitoring
      const fetchTime = performance.now() - startTime;
      console.log(`⚡ Data fetched in ${fetchTime.toFixed(2)}ms`);

      // Ensure minimum loading time for better UX (prevent flash)
      const elapsedTime = Date.now() - startTime;
      const minLoadTime = 500; // 500ms minimum

      if (elapsedTime < minLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
      }

      setCajaData(cajaDataResult);
      setRecentClients(recentClientsResult);
      setSavingsAnalysis(savingsResult);
      setBanks(banksResult);
      
      // Calculate total bank balance excluding Banfondesa
      // Use individual account balances (saldoIndividual) calculated from movements
      const seenAccountIds = new Set<string>();
      let totalBalance = 0;
      console.log('🏦 Bancos encontrados:', banksResult.map(b => ({ nombre: b.nombre, cuentas: b.cuentas?.length || 0 })));
      
      banksResult.forEach(bank => {
        const bankName = bank.nombre?.toLowerCase() || '';
        const isBanfondesa = bankName.includes('fondesa') || bankName.includes('banfondesa');
        const cuentasCount = bank.cuentas?.length || 0;
        console.log(`Procesando banco: "${bank.nombre}" - Es Banfondesa: ${isBanfondesa} - Cuentas: ${cuentasCount}`);
        
        // Skip Banfondesa bank (handles "Ban Fondesa" and "Banfondesa")
        if (isBanfondesa) {
          console.log(`⏭️ Saltando banco Banfondesa: ${bank.nombre}`);
          let excludedTotal = 0;
          (bank.cuentas || []).forEach(cuenta => {
            const saldo = Number((cuenta as any).saldoIndividual ?? 0);
            excludedTotal += saldo;
          });
          console.log(`  🚫 Total excluido de ${bank.nombre}: ${excludedTotal}`);
          return;
        }
        
        let bankTotal = 0;
        // Process accounts from non-Banfondesa banks
        (bank.cuentas || []).forEach(cuenta => {
          const cuentaKey = cuenta.id;
          const saldo = Number((cuenta as any).saldoIndividual ?? 0);
          
          if (cuentaKey && !seenAccountIds.has(cuentaKey)) {
            seenAccountIds.add(cuentaKey);
            totalBalance += saldo;
            bankTotal += saldo;
            console.log(`  ✅ Cuenta: ${cuenta.numeroCuenta}, Saldo individual: ${saldo}`);
          }
        });
        console.log(`  💵 Total del banco ${bank.nombre}: ${bankTotal}`);
      });
      
      console.log(`💰 Balance total (sin Banfondesa): ${totalBalance}`);
      setTotalBankBalance(totalBalance);
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
      setLoadingClients(false);
    }
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchData();

    const refreshInterval = setInterval(fetchData, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [fetchData]);

  // Memoized currency formatter for better performance
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Memoized loading states
  const isDataLoading = useMemo(() => loading || loadingClients, [loading, loadingClients]);

  // Memoized stats for KPI widgets
  const kpiStats = useMemo(() => {
    if (!cajaData) return null;

    return [
      {
        title: "BALANCE CAJA",
        value: formatCurrency(cajaData.stats.balanceCajaPrincipal || 0),
        percentage: `Gasto Mensual: ${formatCurrency(cajaData.stats.gastosMesCajaPrincipal || 0)}`,
        percentageClass: "bright-red",
        icon: <Wallet size={24} strokeWidth={2.5} />,
        barColor: "#00BFA5"
      },
      {
        title: "PAPELERIA",
        value: formatCurrency(cajaData.stats.balancePapeleria || 0),
        percentage: `Gastos Mes: ${formatCurrency(cajaData.stats.gastosMesPapeleria || 0)}`,
        percentageClass: "bright-red",
        icon: <FileText size={24} strokeWidth={2.5} />,
        barColor: "#F44336"
      },
      {
        title: "BALANCE BANCO NETO",
        value: formatCurrency(totalBankBalance),
        percentage: `Gastos Banco: ${formatCurrency(cajaData.stats.gastosMesBanco || 0)}`,
        percentageClass: "bright-red",
        icon: <Landmark size={24} strokeWidth={2.5} />,
        barColor: "#00BFA5"
      },
      {
        title: "INGRESO REAL MES",
        value: formatCurrency(cajaData.stats.ingresoRealMes || 0),
        percentage: `Gastos Totales: ${formatCurrency((cajaData.stats.gastosMesCajaPrincipal || 0) + (cajaData.stats.gastosMesPapeleria || 0) + (cajaData.stats.gastosMesBanco || 0))}`,
        percentageClass: "bright-red",
        icon: <Briefcase size={24} strokeWidth={2.5} />,
        barColor: "#FFC107"
      },
      {
        title: "CLIENTES ACTIVOS",
        value: (cajaData.stats.totalClientesActivos?.toString() || "0"),
        percentage: "Total Clientes activos",
        percentageClass: "neutral",
        icon: <Users size={24} strokeWidth={2.5} />,
        barColor: "#2196F3"
      },
      {
        title: "FACTURAS PENDIENTES",
        value: formatCurrency(cajaData.stats.totalFacturasPendientes || 0),
        percentage: "Monto total facturas pendientes",
        percentageClass: "negative",
        icon: <AlertTriangle size={24} strokeWidth={2.5} />,
        barColor: "#9C27B0"
      },
      {
        title: "POTENCIAL AHORRO",
        value: savingsAnalysis ? formatCurrency(savingsAnalysis.proyectado.ahorro) : formatCurrency(72900),
        percentage: `Margen: ${savingsAnalysis?.proyectado.margenAhorro || '52.07'}%`,
        percentageClass: "positive",
        icon: <TrendingUp size={24} strokeWidth={2.5} />,
        barColor: "#4CAF50"
      },
      {
        title: "VALOR SUSCRIPCIONES",
        value: formatCurrency(cajaData.stats.ingresosServiciosMes || 0),
        percentage: "Total precio mensual activo",
        percentageClass: "positive",
        icon: <PlayCircle size={24} strokeWidth={2.5} />,
        barColor: "#607D8B"
      }
    ];
  }, [cajaData, savingsAnalysis, formatCurrency]);

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb"><h1>Dashboard</h1>
            <p>
              ¡Bienvenido, {userName}! Aquí está lo que está pasando en el negocio hoy.
            </p></div>
        </div>
        <div className="header-right">
          <div className="date-range-picker">
            Última actualización: {lastRefresh.toLocaleTimeString('es-ES')}
            {loading && <span style={{ color: '#666', marginLeft: '8px' }}>• Cargando...</span>}
          </div>
          <div className="header-actions">
            <button
              title="Actualizar datos"
              onClick={handleRefresh}
              disabled={isDataLoading}
              style={{ opacity: isDataLoading ? 0.6 : 1 }}
            >
              <RefreshCw size={20} strokeWidth={2.5} className={isDataLoading ? 'rotating' : ''} />
            </button>
            <button title="Configuración">
              <Settings size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-banner" style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '20px',
          color: '#c62828'
        }}>
          <AlertCircle size={20} strokeWidth={2.5} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
          <button
            onClick={handleRefresh}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: '#c62828',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="dashboard-kpis">
        {kpiStats ? kpiStats.map((stat, index) => (
          <KpiWidget
            key={stat.title}
            title={stat.title}
            value={isDataLoading ? "Cargando..." : stat.value}
            percentage={isDataLoading ? "" : stat.percentage}
            percentageClass={stat.percentageClass}
            icon={stat.icon}
            barColor={stat.barColor}
          />
        )) : (
          // Skeleton loading cards
          Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton-card" style={{
              height: '120px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          ))
        )}
      </div>

      {/* Main Content */}
      <div className="dashboard-main-content">
        <div className="dashboard-row">
          <div className="card-welcome">
            <InfoCard title="Actividad Reciente">
              <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                {/* Eventos */}
                <div>
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Últimos Eventos</h5>
                  <div className="recent-list">
                    {cajaData?.recentEvents?.length ? (
                      cajaData.recentEvents.map(evt => (
                        <div key={evt.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', padding: '8px', background: 'var(--colors-background-paper-secondary, rgba(0,0,0,0.02))', borderRadius: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: evt.color || '#2196f3', marginRight: '10px', flexShrink: 0 }}></div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.titulo}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--colors-text-secondary)' }}>{new Date(evt.fechaInicio).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--colors-text-secondary)', fontStyle: 'italic' }}>No hay eventos recientes.</div>
                    )}
                  </div>
                </div>

                {/* Tareas */}
                <div>
                  <h5 style={{ margin: '10px 0 10px 0', fontSize: '0.85rem', color: 'var(--colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Últimas Tareas</h5>
                  <div className="recent-list">
                    {cajaData?.recentTasks?.length ? (
                      cajaData.recentTasks.map(task => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', padding: '8px', background: 'var(--colors-background-paper-secondary, rgba(0,0,0,0.02))', borderRadius: '6px' }}>
                          {task.completada ? (
                            <CheckCircle2 size={18} strokeWidth={2.5} style={{ marginRight: '10px', color: '#4caf50' }} />
                          ) : (
                            <Circle size={18} strokeWidth={2.5} style={{ marginRight: '10px', color: task.color || '#ff9800' }} />
                          )}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, textDecoration: task.completada ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.titulo}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--colors-text-secondary)', fontStyle: 'italic' }}>No hay tareas recientes.</div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
          <div className="card-revenue">
            <RevenueChart data={cajaData?.chartData || []} />
          </div>
          <div className="card-sales">
            <SalesChart data={cajaData?.topEarlyPayers || []} />
          </div>
        </div>

        <div className="dashboard-row">
          <div className="card-wallet">
            <InfoCard title="Últimas Transacciones">
              <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                <div>
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos y Gastos Recientes</h5>
                  <div className="recent-list" style={{ minHeight: '200px' }}>
                    {cajaData?.recentTransactions?.length ? (
                      cajaData.recentTransactions.map(transaction => {
                        const formatCurrency = (amount: number) =>
                          new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
                        const formatDate = (dateStr: string) =>
                          new Date(dateStr).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' });

                        return (
                          <div key={transaction.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            padding: '8px',
                            background: 'var(--colors-background-paper-secondary, rgba(0,0,0,0.02))',
                            borderRadius: '6px',
                            borderLeft: `3px solid ${transaction.tipo === 'ingreso' ? '#4caf50' : '#f44336'}`
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: '2px'
                              }}>
                                {transaction.descripcion || transaction.categoria}
                              </div>
                              <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--colors-text-secondary)',
                                display: 'flex',
                                gap: '8px'
                              }}>
                                <span>{formatDate(transaction.fecha)}</span>
                                <span>•</span>
                                <span>{transaction.categoria}</span>
                              </div>
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: transaction.tipo === 'ingreso' ? '#4caf50' : '#f44336',
                              textAlign: 'right'
                            }}>
                              {transaction.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(transaction.monto)}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--colors-text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                        No hay transacciones recientes.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
          <div className="card-downloads">
            <InfoCard title="👥 Últimos Clientes Suscritos">
              <div className="recent-clients-card">
                {loadingClients ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.9rem', color: 'var(--colors-text-secondary)' }}>
                    Cargando clientes...
                  </div>
                ) : recentClients.length > 0 ? (
                  <>
                    {recentClients.map((client, index) => (
                      <div key={client.id} className="download-item" style={{ marginBottom: '12px', padding: '8px 0', borderBottom: index < recentClients.length - 1 ? '1px solid var(--colors-divider)' : 'none' }}>
                        <div className="download-info" style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--colors-text-primary)', marginBottom: '4px' }}>
                            {client.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--colors-text-secondary)', marginBottom: '2px' }}>
                            🔧 {client.servicio} - {client.plan}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--colors-text-secondary)' }}>
                            📅 {new Date(client.fecha_suscripcion).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <span className={`badge ${client.estado === 'activo' ? 'success' : 'secondary'}`} style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {client.estado}
                        </span>
                      </div>
                    ))}
                    <div className="downloads-summary" style={{
                      textAlign: 'center',
                      marginTop: '12px',
                      fontSize: '0.8rem',
                      color: 'var(--colors-text-secondary)',
                      fontWeight: '500'
                    }}>
                      {recentClients.length} de {recentClients.length} clientes mostrados
                    </div>
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px 0',
                    fontSize: '0.9rem',
                    color: 'var(--colors-text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    📋 No hay clientes suscritos recientes.
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
          <div className="card-reports">
            <InfoCard title="Análisis de Presupuesto">
              <div className="budget-analysis">
                {savingsAnalysis ? (
                  <>
                    <div className="collection-breakdown" style={{ marginBottom: '20px', padding: '12px', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', background: '#f8fafc' }}>
                      <h6 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: 'var(--colors-text-secondary)', textTransform: 'uppercase' }}>Recaudación Proyectada</h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Día 15 (Suscripciones)</span>
                          <span style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(savingsAnalysis.proyectado.recaudacion15)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Otros Días (Cobros)</span>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>{formatCurrency(savingsAnalysis.proyectado.recaudacionOtros)}</span>
                        </div>
                        <div style={{ padding: '8px 0', marginTop: '4px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                          <span>Total Mensual</span>
                          <span>{formatCurrency(savingsAnalysis.proyectado.ingreso)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="collection-breakdown" style={{ marginBottom: '20px', padding: '12px', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', background: '#f1f5f9' }}>
                      <h6 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: 'var(--colors-text-secondary)', textTransform: 'uppercase' }}>Resultado Real del Mes</h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Ingreso Real</span>
                          <span style={{ fontWeight: 600, color: '#0ea5e9' }}>{formatCurrency(savingsAnalysis.realMes.ingreso)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Gastos Reales</span>
                          <span style={{ fontWeight: 600, color: '#ef4444' }}>{formatCurrency(savingsAnalysis.realMes.gastos)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Total Real</span>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(savingsAnalysis.realMes.ahorro)}</span>
                        </div>
                        <div style={{ padding: '8px 0', marginTop: '4px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                          <span>Margen Real</span>
                          <span>{`${savingsAnalysis.realMes.margenAhorro}%`}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                        <span>Gastos Fijos Previstos</span>
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{formatCurrency(savingsAnalysis.proyectado.totalGastos)}</span>
                      </div>
                      <div className="reports-progress-bar-container">
                        <div className="reports-progress-bar" style={{
                          width: `${Math.min(100, (savingsAnalysis.proyectado.totalGastos / savingsAnalysis.proyectado.ingreso) * 100)}%`,
                          backgroundColor: '#f59e0b'
                        }}></div>
                      </div>
                      <small style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Consumo del {((savingsAnalysis.proyectado.totalGastos / savingsAnalysis.proyectado.ingreso) * 100).toFixed(1)}% de la recaudación proyectada
                      </small>
                    </div>

                    <div className="budget-details" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h6 style={{ margin: '5px 0 8px 0', fontSize: '0.75rem', color: 'var(--colors-text-secondary)', textTransform: 'uppercase' }}>Desglose de Gastos Fijos</h6>
                      {Object.entries(savingsAnalysis.proyectado.gastos).map(([name, amount]) => (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                          <span style={{ textTransform: 'capitalize' }}>{name}</span>
                          <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#2e7d32' }}>💡 Sugerencia</h5>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#1b5e20', lineHeight: 1.4 }}>
                        {savingsAnalysis.recomendaciones[1].mensaje}
                      </p>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--colors-text-secondary)' }}>
                    Cargando análisis...
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
