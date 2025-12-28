import { useState, useEffect } from 'react';
import {
    Users,
    DollarSign,
    CreditCard,
    Briefcase,
    RefreshCw,
    Settings
} from 'lucide-react';
import { hrService } from '../../services/hrService';
import KpiWidget from '../../components/ui/KpiWidget';
import InfoCard from '../../components/ui/InfoCard';
import PayrollChart from '../../components/charts/PayrollChart';
import EmployeeGrowthChart from '../../components/charts/EmployeeGrowthChart';
import '../../styles/HRDashboard.css';

interface HRStats {
    totalEmployees: number;
    monthlyPayroll: number;
    activeLoans: number;
    pendingCommissions: number;
    employeeDistribution: {
        labels: string[];
        data: number[];
    };
}

const HRDashboard = () => {
    const [stats, setStats] = useState<HRStats>({
        totalEmployees: 0,
        monthlyPayroll: 0,
        activeLoans: 0,
        pendingCommissions: 0,
        employeeDistribution: { labels: [], data: [] }
    });
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsData, historyData] = await Promise.all([
                    hrService.getDashboardStats(),
                    hrService.getPayrollHistory()
                ]);
                setStats(statsData);

                // Format history data for chart
                const formattedHistory = (historyData.data || historyData).map((item: any) => {
                    const date = new Date(item.fechaInicio);
                    const monthName = date.toLocaleDateString('es-DO', { month: 'short' });
                    return {
                        label: `${monthName}`,
                        payroll: parseFloat(item.totalNomina),
                        commissions: parseFloat(item.totalComisiones)
                    };
                });
                setPayrollHistory(formattedHistory);

            } catch (error) {
                console.error('Failed to fetch HR stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(amount);
    };

    return (
        <div className="dashboard-layout fade-in">
            <div className="dashboard-header">
                <div className="header-left">
                    <div className="breadcrumb">
                        <h1>Recursos Humanos</h1>
                        <p>Gestión integral de personal y nómina</p>
                    </div>
                </div>
                <div className="header-right">
                    <div className="date-range-picker">
                        {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="header-actions">
                        <button title="Refresh" onClick={() => window.location.reload()}>
                            <RefreshCw size={18} strokeWidth={2.5} />
                        </button>
                        <button title="Settings">
                            <Settings size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-kpis">
                <KpiWidget
                    title="TOTAL EMPLEADOS"
                    value={loading ? '...' : stats.totalEmployees.toString()}
                    percentage="↑ Activos"
                    percentageClass="positive"
                    icon={<Users className="w-5 h-5" />}
                    barColor="#3b82f6" // Blue
                />
                <KpiWidget
                    title="NÓMINA MENSUAL"
                    value={loading ? '...' : formatCurrency(stats.monthlyPayroll)}
                    percentage="Estimado"
                    percentageClass=""
                    icon={<DollarSign className="w-5 h-5" />}
                    barColor="#a855f7" // Purple
                />
                <KpiWidget
                    title="PRÉSTAMOS ACTIVOS"
                    value={loading ? '...' : stats.activeLoans.toString()}
                    percentage="En curso"
                    percentageClass="positive"
                    icon={<CreditCard className="w-5 h-5" />}
                    barColor="#f97316" // Orange
                />
                <KpiWidget
                    title="COMISIONES PEND."
                    value={loading ? '...' : formatCurrency(stats.pendingCommissions)}
                    percentage="Por pagar"
                    percentageClass="positive"
                    icon={<Briefcase className="w-5 h-5" />}
                    barColor="#10b981" // Emerald
                />
            </div>

            <div className="dashboard-main-content">
                <div className="dashboard-row">
                    <div className="card-revenue" style={{ gridColumn: 'span 8' }}>
                        <InfoCard title="Historial de Nómina">
                            <PayrollChart data={payrollHistory} />
                        </InfoCard>
                    </div>
                    <div className="card-sales" style={{ gridColumn: 'span 4' }}>
                        <InfoCard title="Distribución de Personal">
                            <EmployeeGrowthChart data={stats.employeeDistribution} />
                        </InfoCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
