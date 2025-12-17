import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    CreditCard,
    Calendar,
    DollarSign,
    X,
    CheckCircle,
    AlertCircle,
    Clock
} from 'lucide-react';
import { hrService, Loan, Employee } from '../../../services/hrService';
import '../../../styles/LoansPage.css';

const LoansPage = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        empleadoId: '',
        montoSolicitado: '',
        plazoMeses: '12',
        motivo: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [loansData, employeesData] = await Promise.all([
                hrService.getLoans(),
                hrService.getEmployees()
            ]);

            // Handle potential data wrapping
            const loansList = Array.isArray(loansData) ? loansData : (loansData.data || []);
            const employeesList = Array.isArray(employeesData) ? employeesData : (employeesData.data || []);

            setLoans(loansList);
            setEmployees(employeesList);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLoan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hrService.createLoan({
                ...formData,
                montoSolicitado: parseFloat(formData.montoSolicitado),
                plazoMeses: parseInt(formData.plazoMeses)
            });
            setIsModalOpen(false);
            setFormData({ empleadoId: '', montoSolicitado: '', plazoMeses: '12', motivo: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating loan:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APROBADO':
                return <span className="status-badge aprobado"><CheckCircle className="w-3 h-3 mr-1" /> Aprobado</span>;
            case 'PENDIENTE':
            case 'SOLICITADO':
                return <span className="status-badge pendiente"><Clock className="w-3 h-3 mr-1" /> Pendiente</span>;
            case 'RECHAZADO':
                return <span className="status-badge rechazado"><X className="w-3 h-3 mr-1" /> Rechazado</span>;
            case 'PAGADO':
                return <span className="status-badge pagado"><CheckCircle className="w-3 h-3 mr-1" /> Pagado</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const filteredLoans = loans.filter(loan =>
        loan.empleado?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.empleado?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.empleado?.codigoEmpleado?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.estado === 'APROBADO').length;
    const pendingLoans = loans.filter(l => l.estado === 'SOLICITADO' || l.estado === 'PENDIENTE').length;
    const totalAmount = loans.reduce((sum, l) => sum + (Number(l.montoSolicitado) || 0), 0);

    return (
        <div className="loans-page">
            {/* Header */}
            <div className="loans-header">
                <div>
                    <h1 className="loans-title">Préstamos</h1>
                    <p className="loans-subtitle">Gestión de préstamos y anticipos a empleados</p>
                </div>
                <div className="loans-actions">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Solicitar Préstamo
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card-primary">
                    <div className="stat-icon">
                        <CreditCard />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Préstamos</p>
                        <p className="stat-value">{totalLoans}</p>
                    </div>
                </div>

                <div className="stat-card stat-card-warning">
                    <div className="stat-icon">
                        <Clock />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Pendientes</p>
                        <p className="stat-value">{pendingLoans}</p>
                    </div>
                </div>

                <div className="stat-card stat-card-success">
                    <div className="stat-icon">
                        <CheckCircle />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Activos</p>
                        <p className="stat-value">{activeLoans}</p>
                    </div>
                </div>

                <div className="stat-card stat-card-info">
                    <div className="stat-icon">
                        <DollarSign />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Monto Total</p>
                        <p className="stat-value">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="loans-filters">
                <div className="search-bar">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por empleado..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <button className="btn-secondary">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="loans-table-container">
                {loading ? (
                    <div className="loading-state">Cargando préstamos...</div>
                ) : filteredLoans.length === 0 ? (
                    <div className="empty-state">
                        <CreditCard className="empty-icon" />
                        <h3>No hay préstamos registrados</h3>
                        <p>Solicita un nuevo préstamo para comenzar</p>
                    </div>
                ) : (
                    <table className="loans-table">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Monto</th>
                                <th>Plazo</th>
                                <th>Cuota Mensual</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLoans.map((loan) => (
                                <tr key={loan.id}>
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar">
                                                {loan.empleado?.nombres?.charAt(0)}{loan.empleado?.apellidos?.charAt(0)}
                                            </div>
                                            <div className="employee-info">
                                                <div className="employee-name">{loan.empleado?.nombres} {loan.empleado?.apellidos}</div>
                                                <div className="employee-code">{loan.empleado?.codigoEmpleado}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="amount-cell">{formatCurrency(loan.montoSolicitado)}</td>
                                    <td>{loan.plazoMeses} meses</td>
                                    <td className="amount-cell">{formatCurrency(loan.cuotaMensual)}</td>
                                    <td>
                                        {getStatusBadge(loan.estado)}
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn action-btn-primary" title="Ver detalles">
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Loan Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Solicitar Nuevo Préstamo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLoan}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Empleado</label>
                                    <select
                                        className="form-select"
                                        value={formData.empleadoId}
                                        onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar empleado...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nombres} {emp.apellidos} - {emp.codigoEmpleado}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid-cols-2">
                                    <div className="form-group">
                                        <label className="form-label">Monto Solicitado</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                className="form-input pl-10"
                                                placeholder="0.00"
                                                value={formData.montoSolicitado}
                                                onChange={(e) => setFormData({ ...formData, montoSolicitado: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Plazo (Meses)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                className="form-input pl-10"
                                                value={formData.plazoMeses}
                                                onChange={(e) => setFormData({ ...formData, plazoMeses: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Motivo / Observaciones</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={formData.motivo}
                                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    Crear Solicitud
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoansPage;
