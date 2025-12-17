import { useState, useEffect } from 'react';
import {
    Plus,
    Calendar,
    DollarSign,
    Users,
    Edit,
    Trash2,
    FileText,
    CheckCircle
} from 'lucide-react';
import { hrService, type PayrollPeriod, type Payroll } from '../../../services/hrService';
import PeriodForm from './PeriodForm';
import EmployeeSelectionModal from './EmployeeSelectionModal';
import PayrollForm from './PayrollForm';
import PayrollWizard from './PayrollWizard';
import PaymentModal from './PaymentModal';
import './PayrollPage.css';

const PayrollPage = () => {
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [loadingPeriods, setLoadingPeriods] = useState(true);
    const [loadingPayrolls, setLoadingPayrolls] = useState(false);
    const [showPeriodForm, setShowPeriodForm] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
    const [showEmployeeSelection, setShowEmployeeSelection] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
    const [showPayrollForm, setShowPayrollForm] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [selectedEmployeesForWizard, setSelectedEmployeesForWizard] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payrollForPayment, setPayrollForPayment] = useState<any>(null);

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            const data = await hrService.getPayrollPeriods();
            setPeriods(data);
            if (data.length > 0 && !selectedPeriod) {
                setSelectedPeriod(data[0]);
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
        } finally {
            setLoadingPeriods(false);
        }
    };

    useEffect(() => {
        if (selectedPeriod) {
            fetchPayrollsForPeriod(selectedPeriod.id);
        }
    }, [selectedPeriod]);

    const fetchPayrollsForPeriod = async (periodId: string) => {
        try {
            setLoadingPayrolls(true);
            const data = await hrService.getPayrollsByPeriod(periodId);
            setPayrolls(data);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setLoadingPayrolls(false);
        }
    };

    const handleMarkAsPaid = (payroll: any) => {
        setPayrollForPayment(payroll);
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async (paymentData: any) => {
        if (!payrollForPayment) return;

        try {
            await hrService.updatePaymentStatus(payrollForPayment.id, 'PAGADO', paymentData);
            if (selectedPeriod) {
                await fetchPayrollsForPeriod(selectedPeriod.id);
            }
            setShowPaymentModal(false);
            setPayrollForPayment(null);
        } catch (error: any) {
            console.error('Error updating payment status:', error);
            alert(error.message || 'Error al actualizar el estado de pago');
        }
    };

    const handleGeneratePayroll = () => {
        if (!selectedPeriod) return;
        setShowEmployeeSelection(true);
    };

    const handleGenerateForEmployees = async (employees: any[]) => {
        if (!selectedPeriod) return;

        setSelectedEmployeesForWizard(employees);
        setShowEmployeeSelection(false);
        setShowWizard(true);
    };

    const handleConfirmGeneration = async (payrollDetails: any) => {
        if (!selectedPeriod) return;

        try {
            setLoadingPayrolls(true);
            const employeeIds = selectedEmployeesForWizard.map(e => e.id);
            await hrService.generatePayrollForPeriod(selectedPeriod.id, employeeIds, payrollDetails);
            await fetchPayrollsForPeriod(selectedPeriod.id);
            setShowWizard(false);
            alert(`Nómina generada exitosamente para ${employeeIds.length} empleado(s)`);
        } catch (error) {
            console.error('Error generating payroll:', error);
            alert('Error al generar la nómina');
        } finally {
            setLoadingPayrolls(false);
        }
    };

    const handleCreatePeriod = () => {
        setEditingPeriod(null);
        setShowPeriodForm(true);
    };

    const handleEditPeriod = (period: PayrollPeriod) => {
        setEditingPeriod(period);
        setShowPeriodForm(true);
    };

    const handleSavePeriod = async (data: any) => {
        try {
            if (editingPeriod) {
                await hrService.updatePayrollPeriod(editingPeriod.id, data);
            } else {
                await hrService.createPayrollPeriod(data);
            }
            await fetchPeriods();
            setShowPeriodForm(false);
            setEditingPeriod(null);
        } catch (error) {
            console.error('Error saving period:', error);
            alert('Error al guardar el período');
        }
    };

    const handleDeletePeriod = async (id: string) => {
        if (!window.confirm('¿Está seguro de eliminar este período? Esto eliminará todos los registros de nómina asociados.')) {
            return;
        }

        try {
            await hrService.deletePayrollPeriod(id);
            await fetchPeriods();
            if (selectedPeriod?.id === id) {
                setSelectedPeriod(null);
                setPayrolls([]);
            }
        } catch (error) {
            console.error('Error deleting period:', error);
            alert('Error al eliminar el período');
        }
    };

    const handleDeletePayroll = async (id: string) => {
        if (!window.confirm('¿Está seguro de eliminar este registro de nómina?')) {
            return;
        }

        try {
            await hrService.deletePayroll(id);
            if (selectedPeriod) {
                await fetchPayrollsForPeriod(selectedPeriod.id);
            }
        } catch (error) {
            console.error('Error deleting payroll:', error);
            alert('Error al eliminar el registro de nómina');
        }
    };

    const handleEditPayroll = (payroll: Payroll) => {
        setEditingPayroll(payroll);
        setShowPayrollForm(true);
    };

    const handleSavePayroll = async (id: string, data: any) => {
        try {
            await hrService.updatePayroll(id, data);
            if (selectedPeriod) {
                await fetchPayrollsForPeriod(selectedPeriod.id);
            }
            setShowPayrollForm(false);
            setEditingPayroll(null);
        } catch (error) {
            console.error('Error updating payroll:', error);
            alert('Error al actualizar la nómina');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(amount);
    };

    return (
        <div className="payroll-page">
            <div className="payroll-header">
                <div>
                    <h1 className="payroll-title">Gestión de Nómina</h1>
                    <p className="payroll-subtitle">Administra períodos y pagos de empleados</p>
                </div>
                <div className="payroll-actions">
                    <button className="btn-glass primary" onClick={handleCreatePeriod}>
                        <Plus className="w-4 h-4" />
                        Nuevo Período
                    </button>
                </div>
            </div>

            <div className="period-selector">
                <div className="period-selector-header">
                    <h2 className="period-selector-title">Períodos de Nómina</h2>
                </div>

                {loadingPeriods ? (
                    <div className="text-center py-8 text-gray-400">Cargando períodos...</div>
                ) : (
                    <div className="period-grid">
                        {periods.map((period) => (
                            <div
                                key={period.id}
                                className={`period-card ${selectedPeriod?.id === period.id ? 'active' : ''}`}
                                onClick={() => setSelectedPeriod(period)}
                            >
                                <div className="period-card-header">
                                    <span className="period-code">{period.codigoPeriodo}</span>
                                    <span className={`period-badge ${period.estado.toLowerCase()}`}>
                                        {period.estado}
                                    </span>
                                </div>
                                <div className="period-info">
                                    <div className="period-info-item">
                                        <Calendar />
                                        <span>{new Date(period.fechaInicio).toLocaleDateString()} - {new Date(period.fechaFin).toLocaleDateString()}</span>
                                    </div>
                                    <div className="period-info-item">
                                        <DollarSign />
                                        <span>Pago: {new Date(period.fechaPago).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: '12px',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    alignItems: 'center'
                                }}>
                                    <button
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            color: '#2563eb',
                                            backgroundColor: '#dbeafe',
                                            border: '1px solid #93c5fd',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#bfdbfe'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditPeriod(period);
                                        }}
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Editar
                                    </button>
                                    <button
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            color: '#dc2626',
                                            backgroundColor: '#fee2e2',
                                            border: '1px solid #fca5a5',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePeriod(period.id);
                                        }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedPeriod && (
                <div className="payroll-table-container">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Nómina - {selectedPeriod.codigoPeriodo}
                        </h2>
                        {payrolls.length > 0 && (
                            <div className="text-sm text-gray-600">
                                Total: {formatCurrency(payrolls.reduce((sum, p) => sum + Number(p.salarioNeto), 0))}
                            </div>
                        )}
                    </div>

                    {loadingPayrolls ? (
                        <div className="text-center py-8 text-gray-400">Cargando nómina...</div>
                    ) : payrolls.length === 0 ? (
                        <div className="empty-state">
                            <FileText className="mx-auto" />
                            <h3>No hay registros de nómina</h3>
                            <p>Genera la nómina para este período</p>
                            <button className="btn-glass primary mt-4" onClick={handleGeneratePayroll}>
                                Generar Nómina
                            </button>
                        </div>
                    ) : (
                        <table className="payroll-table">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Días</th>
                                    <th>Salario Base</th>
                                    <th>Total Ingresos</th>
                                    <th>Total Deducciones</th>
                                    <th>Salario Neto</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls.map((payroll) => (
                                    <tr key={payroll.id}>
                                        <td>
                                            <div className="employee-cell">
                                                <div className="employee-avatar">
                                                    {payroll.empleado?.nombres.charAt(0)}
                                                    {payroll.empleado?.apellidos.charAt(0)}
                                                </div>
                                                <div className="employee-info">
                                                    <span className="employee-name">
                                                        {payroll.empleado?.nombres} {payroll.empleado?.apellidos}
                                                    </span>
                                                    <span className="employee-cargo">
                                                        {payroll.empleado?.cargo?.nombreCargo || 'Sin cargo'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{payroll.diasTrabajados}</td>
                                        <td className="amount-cell">{formatCurrency(payroll.salarioBase)}</td>
                                        <td className="amount-cell amount-positive">
                                            {formatCurrency(payroll.totalIngresos)}
                                        </td>
                                        <td className="amount-cell amount-negative">
                                            {formatCurrency(payroll.totalDeducciones)}
                                        </td>
                                        <td className="amount-cell font-bold">
                                            {formatCurrency(payroll.salarioNeto)}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${payroll.estadoPago.toLowerCase()}`}>
                                                {payroll.estadoPago}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                {payroll.estadoPago === 'PENDIENTE' && (
                                                    <button
                                                        type="button"
                                                        className="action-icon-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsPaid(payroll);
                                                        }}
                                                        title="Marcar como pagado"
                                                        style={{ width: 'auto', padding: '0 8px', gap: '4px' }}
                                                    >
                                                        <CheckCircle size={16} />
                                                        <span className="text-xs">Pagar</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="action-icon-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditPayroll(payroll);
                                                    }}
                                                    title="Editar"
                                                    style={{ width: 'auto', padding: '0 8px', gap: '4px' }}
                                                >
                                                    <Edit size={16} />
                                                    <span className="text-xs">Editar</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="action-icon-btn delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePayroll(payroll.id);
                                                    }}
                                                    title="Eliminar"
                                                    style={{ width: 'auto', padding: '0 8px', gap: '4px' }}
                                                >
                                                    <Trash2 size={16} />
                                                    <span className="text-xs">Eliminar</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {showPeriodForm && (
                <PeriodForm
                    period={editingPeriod}
                    onClose={() => {
                        setShowPeriodForm(false);
                        setEditingPeriod(null);
                    }}
                    onSave={handleSavePeriod}
                />
            )}

            {showPayrollForm && editingPayroll && (
                <PayrollForm
                    payroll={editingPayroll}
                    onClose={() => {
                        setShowPayrollForm(false);
                        setEditingPayroll(null);
                    }}
                    onSave={handleSavePayroll}
                />
            )}

            {showEmployeeSelection && (
                <EmployeeSelectionModal
                    periodId={selectedPeriod?.id || ''}
                    onClose={() => setShowEmployeeSelection(false)}
                    onGenerate={handleGenerateForEmployees}
                />
            )}

            {showWizard && (
                <PayrollWizard
                    employees={selectedEmployeesForWizard}
                    onClose={() => setShowWizard(false)}
                    onGenerate={handleConfirmGeneration}
                    loading={loadingPayrolls}
                />
            )}

            {showPaymentModal && payrollForPayment && (
                <PaymentModal
                    payroll={payrollForPayment}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setPayrollForPayment(null);
                    }}
                    onConfirm={handleConfirmPayment}
                />
            )}
        </div>
    );
};

export default PayrollPage;
