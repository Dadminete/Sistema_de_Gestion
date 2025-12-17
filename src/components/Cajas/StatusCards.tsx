import React from 'react';
import { Unlock, Lock, Activity, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { Caja, DashboardData } from '../../services/cajaService';
import KpiWidget from '../ui/KpiWidget';

interface StatusCardsProps {
    cajas: Caja[];
    resumenDiario: Record<string, { ingresos: number; gastos: number }>;
    cajasAbiertas: Record<string, boolean>;
    dashboardStats: DashboardData['stats'] | null;
    montoInicialDia: number;
    activeTab: 'apertura' | 'cierre';
    cierreForm: { cajaId: string; totalVentasPapeleria: number };
    totalPapeleria: number;
}

const StatusCards: React.FC<StatusCardsProps> = ({
    cajas,
    resumenDiario,
    cajasAbiertas,
    dashboardStats,
    montoInicialDia,
    activeTab,
    cierreForm,
    totalPapeleria
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
        }).format(amount);
    };

    return (
        <div className="dashboard-kpis">
            {/* Resumen General de Ingresos y Gastos */}
            <KpiWidget
                title="INGRESOS HOY"
                value={formatCurrency(dashboardStats?.ingresosHoy || 0)}
                percentage={dashboardStats?.ingresosHoy && dashboardStats.ingresosHoy > 0 ? "↑ Activo" : "Sin movimientos"}
                percentageClass={dashboardStats?.ingresosHoy && dashboardStats.ingresosHoy > 0 ? "positive" : ""}
                icon={<TrendingUp size={20} />}
                barColor="#10B981"
            />
            
            <KpiWidget
                title="GASTOS HOY"
                value={formatCurrency(dashboardStats?.gastosHoy || 0)}
                percentage={dashboardStats?.gastosHoy && dashboardStats.gastosHoy > 0 ? "↓ Activo" : "Sin gastos"}
                percentageClass={dashboardStats?.gastosHoy && dashboardStats.gastosHoy > 0 ? "negative" : ""}
                icon={<TrendingDown size={20} />}
                barColor="#EF4444"
            />

            <KpiWidget
                title="BALANCE CAJA PRINCIPAL"
                value={formatCurrency(dashboardStats?.balanceCajaPrincipal || 0)}
                percentage={cajasAbiertas[cajas.find(c => c.tipo === 'general' || c.nombre.toLowerCase().includes('principal'))?.id || ''] ? "✓ Abierta" : "✗ Cerrada"}
                percentageClass={cajasAbiertas[cajas.find(c => c.tipo === 'general' || c.nombre.toLowerCase().includes('principal'))?.id || ''] ? "positive" : "negative"}
                icon={<DollarSign size={20} />}
                barColor="#3B82F6"
            />

            <KpiWidget
                title="BALANCE PAPELERÍA"
                value={formatCurrency(dashboardStats?.balancePapeleria || 0)}
                percentage={cajasAbiertas[cajas.find(c => c.tipo === 'papeleria' || c.nombre.toLowerCase().includes('papeler'))?.id || ''] ? "✓ Abierta" : "✗ Cerrada"}
                percentageClass={cajasAbiertas[cajas.find(c => c.tipo === 'papeleria' || c.nombre.toLowerCase().includes('papeler'))?.id || ''] ? "positive" : "negative"}
                icon={<Activity size={20} />}
                barColor="#F59E0B"
            />

            {/* Cards individuales de cajas */}
            {cajas.map((caja) => {
                const nombreLower = caja.nombre.toLowerCase();
                const isCajaPrincipal = nombreLower === 'caja' || nombreLower === 'caja principal' || caja.tipo === 'general';
                const isPapeleria = nombreLower.includes('papeler') || caja.tipo === 'papeleria';
                const isOpen = cajasAbiertas[caja.id];
                
                const ingresosDia = isCajaPrincipal
                    ? (dashboardStats?.ingresosHoyCajaPrincipal ?? (resumenDiario[caja.id]?.ingresos || 0))
                    : isPapeleria
                        ? (dashboardStats?.ingresosHoyPapeleria ?? (resumenDiario[caja.id]?.ingresos || 0))
                        : (resumenDiario[caja.id]?.ingresos || 0);

                const gastosDia = isCajaPrincipal
                    ? (dashboardStats?.gastosHoyCajaPrincipal ?? (resumenDiario[caja.id]?.gastos || 0))
                    : isPapeleria
                        ? (dashboardStats?.gastosHoyPapeleria ?? (resumenDiario[caja.id]?.gastos || 0))
                        : (resumenDiario[caja.id]?.gastos || 0);

                const balanceDia = montoInicialDia + ingresosDia - gastosDia;
                const cajaNombre = caja.nombre === 'Papeleria' ? 'CAJA PAPELERÍA' : caja.nombre.toUpperCase();

                return (
                    <KpiWidget
                        key={caja.id}
                        title={cajaNombre}
                        value={formatCurrency(caja.saldoActual)}
                        percentage={`${isOpen ? '🔓' : '🔒'} ${isOpen ? 'Abierta' : 'Cerrada'}`}
                        percentageClass={isOpen ? 'positive' : 'negative'}
                        subtitle={activeTab === 'cierre' && cierreForm.cajaId === caja.id ? 
                            `Balance del día: ${formatCurrency(balanceDia)}` : 
                            undefined}
                        subtitleClass={activeTab === 'cierre' && cierreForm.cajaId === caja.id ? 
                            (balanceDia >= 0 ? 'positive' : 'negative') : ''}
                        // Renderizar ingresos/gastos como JSX personalizado en lugar de subtitle
                        customContent={activeTab !== 'cierre' || cierreForm.cajaId !== caja.id ? (
                            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <span style={{ color: '#10B981' }}>
                                    ↗ {formatCurrency(ingresosDia)}
                                </span>
                                <span style={{ color: '#EF4444' }}>
                                    ↙ {formatCurrency(gastosDia)}
                                </span>
                            </div>
                        ) : undefined}
                        icon={isOpen ? <Unlock size={20} /> : <Lock size={20} />}
                        barColor={isOpen ? '#10B981' : '#6B7280'}
                    />
                );
            })}

            {/* Card de Venta Papelería Extra */}
            <KpiWidget
                title="VENTAS PAPELERÍA"
                value={totalPapeleria > 0 ? formatCurrency(totalPapeleria) : "No disponible"}
                percentage={activeTab === 'cierre' ? `Efectivo: ${formatCurrency(cierreForm.totalVentasPapeleria)}` : "Sistema activo"}
                percentageClass="positive"
                icon={<Activity size={20} />}
                barColor="#8B5CF6"
            />
        </div>
    );
};

export default StatusCards;
