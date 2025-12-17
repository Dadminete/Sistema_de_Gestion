import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    DollarSign,
    TrendingUp,
    Calendar,
    Filter,
    Edit,
    Trash2,
    CheckCircle,
    Settings
} from 'lucide-react';
import * as commissionService from '../../../services/commissionService';
import type { Commission, CommissionStats } from '../../../services/commissionService';
import CommissionForm from './CommissionForm';
import CommissionTypeModal from './CommissionTypeModal';
import './CommissionsPage.css';

const CommissionsPage = () => {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [stats, setStats] = useState<CommissionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [filterMonth, setFilterMonth] = useState<number | ''>('');
    const [showForm, setShowForm] = useState(false);
    const [showTypesModal, setShowTypesModal] = useState(false);
    const [editingCommission, setEditingCommission] = useState<Commission | null>(null);

    useEffect(() => {
        loadCommissions();
        loadStats();
    }, [filterStatus, filterYear, filterMonth]);

    const loadCommissions = async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (filterStatus) filters.estado = filterStatus;
            if (filterYear) filters.periodoAno = filterYear;
            if (filterMonth) filters.periodoMes = filterMonth;

            const data = await commissionService.getCommissions(filters);
            console.log('Loaded commissions:', data);
            setCommissions(data);
        } catch (error) {
            console.error('Error loading commissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await commissionService.getCommissionStats(filterYear, filterMonth || undefined);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleCreate = () => {
        setEditingCommission(null);
        setShowForm(true);
    };

    const handleEdit = (commission: Commission) => {
        setEditingCommission(commission);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingCommission(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingCommission(null);
        loadCommissions();
        loadStats();
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm('¿Está seguro de eliminar esta comisión?')) return;

        try {
            await commissionService.deleteCommission(id);
            loadCommissions();
            loadStats();
        } catch (error) {
            console.error('Error deleting commission:', error);
            alert('Error al eliminar la comisión');
        }
    };

    const handleMarkAsPaid = async (id: string | number) => {
        if (!confirm('¿Marcar esta comisión como pagada?')) return;

        try {
            await commissionService.markAsPaid(id);
            loadCommissions();
            loadStats();
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Error al marcar como pagado');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(amount);
    };

    const getMonthName = (month: number) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month - 1];
    };

    const filteredCommissions = commissions.filter(c => {
        const searchLower = searchTerm.toLowerCase();
        const employeeName = `${c.empleado?.nombres} ${c.empleado?.apellidos}`.toLowerCase();
        const employeeCode = c.empleado?.codigoEmpleado?.toLowerCase() || '';

        return employeeName.includes(searchLower) || employeeCode.includes(searchLower);
    });

    return (
        <div className="commissions-page">
            {/* Header */}
            <div className="commissions-header">
                <div>
                    <h1 className="commissions-title">Comisiones</h1>
                    <p className="commissions-subtitle">Gestión de comisiones de empleados</p>
                </div>
                <div className="commissions-actions">
                    <button className="btn-secondary" onClick={() => setShowTypesModal(true)}>
                        <Settings className="w-4 h-4" />
                        Tipos de Comisión
                    </button>
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus className="w-4 h-4" />
                        Nueva Comisión
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card stat-card-primary">
                        <div className="stat-icon">
                            <TrendingUp />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Total Comisiones</p>
                            <p className="stat-value">{stats.total}</p>
                        </div>
                    </div>

                    <div className="stat-card stat-card-warning">
                        <div className="stat-icon">
                            <Calendar />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Pendientes</p>
                            <p className="stat-value">{stats.totalPendiente}</p>
                            <p className="stat-sublabel">{formatCurrency(stats.montoPendiente)}</p>
                        </div>
                    </div>

                    <div className="stat-card stat-card-success">
                        <div className="stat-icon">
                            <CheckCircle />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Pagadas</p>
                            <p className="stat-value">{stats.totalPagado}</p>
                            <p className="stat-sublabel">{formatCurrency(stats.montoPagado)}</p>
                        </div>
                    </div>

                    <div className="stat-card stat-card-info">
                        <div className="stat-icon">
                            <DollarSign />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Total del Período</p>
                            <p className="stat-value">
                                {formatCurrency(stats.montoPendiente + stats.montoPagado)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="commissions-filters">
                <div className="search-bar">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por empleado o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <Filter className="w-4 h-4" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todos los estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="PAGADO">Pagado</option>
                        <option value="CANCELADO">Cancelado</option>
                    </select>

                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(Number(e.target.value))}
                        className="filter-select"
                    >
                        {[...Array(5)].map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>

                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : '')}
                        className="filter-select"
                    >
                        <option value="">Todos los meses</option>
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="commissions-table-container">
                {loading ? (
                    <div className="loading-state">Cargando comisiones...</div>
                ) : filteredCommissions.length === 0 ? (
                    <div className="empty-state">
                        <DollarSign className="empty-icon" />
                        <h3>No hay comisiones registradas</h3>
                        <p>Crea una nueva comisión para comenzar</p>
                    </div>
                ) : (
                    <table className="commissions-table">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Tipo</th>
                                <th>Período</th>
                                <th>Monto Base</th>
                                <th>%</th>
                                <th>Comisión</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCommissions.map((commission) => (
                                <tr key={commission.id}>
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar">
                                                {commission.empleado?.nombres?.charAt(0)}
                                                {commission.empleado?.apellidos?.charAt(0)}
                                            </div>
                                            <div className="employee-info">
                                                <div className="employee-name">
                                                    {commission.empleado?.nombres} {commission.empleado?.apellidos}
                                                </div>
                                                <div className="employee-code">{commission.empleado?.codigoEmpleado}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{commission.tipoComision?.nombreTipo}</td>
                                    <td>
                                        {getMonthName(commission.periodoMes)} {commission.periodoAno}
                                    </td>
                                    <td className="amount-cell">{formatCurrency(Number(commission.montoBase))}</td>
                                    <td className="text-center">{Number(commission.porcentajeAplicado).toFixed(2)}%</td>
                                    <td className="amount-cell amount-positive">
                                        {formatCurrency(Number(commission.montoComision))}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${commission.estado.toLowerCase()}`}>
                                            {commission.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {commission.estado === 'PENDIENTE' && (
                                                <button
                                                    className="action-btn action-btn-success"
                                                    onClick={() => handleMarkAsPaid(commission.id)}
                                                    title="Marcar como pagado"
                                                    style={{ display: 'flex' }}
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                className="action-btn action-btn-primary"
                                                onClick={() => handleEdit(commission)}
                                                title="Editar"
                                                style={{ display: 'flex' }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="action-btn action-btn-danger"
                                                onClick={() => handleDelete(commission.id)}
                                                title="Eliminar"
                                                style={{ display: 'flex' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Modals */}
            {showForm && (
                <CommissionForm
                    commission={editingCommission}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}

            {showTypesModal && (
                <CommissionTypeModal
                    onClose={() => setShowTypesModal(false)}
                />
            )}
        </div>
    );
};

export default CommissionsPage;
