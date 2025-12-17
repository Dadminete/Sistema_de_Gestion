import React, { useState } from 'react';
import { X, Save, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import '../../../styles/EmployeesList.css';

interface PayrollWizardProps {
    employees: any[];
    onClose: () => void;
    onGenerate: (payrollDetails: any) => void;
    loading?: boolean;
}

const PayrollWizard: React.FC<PayrollWizardProps> = ({ employees, onClose, onGenerate, loading }) => {
    // Map of employeeId -> { field: value }
    const [payrollData, setPayrollData] = useState<Record<string, any>>({});

    const handleInputChange = (employeeId: string, field: string, value: string) => {
        setPayrollData(prev => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [field]: value
            }
        }));
    };

    const handleSubmit = () => {
        onGenerate(payrollData);
    };

    return (
        <div className="glass-modal-overlay">
            <div className="glass-modal w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="glass-modal-header">
                    <div>
                        <h2 className="glass-modal-title flex items-center gap-2">
                            <Calculator className="w-6 h-6 text-blue-400" />
                            Asistente de Nómina - Variables del Período
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Ingrese los montos variables (bonos, comisiones, faltas) para los empleados seleccionados.
                        </p>
                    </div>
                    <button onClick={onClose} className="glass-modal-close">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="glass-modal-body overflow-auto flex-1 p-4">
                    <div className="glass-table-container">
                        <table className="glass-table w-full">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Bonificaciones</th>
                                    <th>Comisiones</th>
                                    <th>Horas Extras ($)</th>
                                    <th>Otros Ingresos</th>
                                    <th>Faltas/Tardanzas ($)</th>
                                    <th>Otras Deducciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{emp.nombres} {emp.apellidos}</span>
                                                <span className="text-xs text-gray-500">{emp.cargo?.nombreCargo}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="glass-input w-24 text-right"
                                                placeholder="0.00"
                                                value={payrollData[emp.id]?.bonificaciones || ''}
                                                onChange={e => handleInputChange(emp.id, 'bonificaciones', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="glass-input w-24 text-right"
                                                placeholder="0.00"
                                                value={payrollData[emp.id]?.comisiones || ''}
                                                onChange={e => handleInputChange(emp.id, 'comisiones', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="glass-input w-24 text-right"
                                                placeholder="0.00"
                                                value={payrollData[emp.id]?.horasExtrasOrdinarias || ''}
                                                onChange={e => handleInputChange(emp.id, 'horasExtrasOrdinarias', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="glass-input w-24 text-right"
                                                placeholder="0.00"
                                                value={payrollData[emp.id]?.otrosIngresos || ''}
                                                onChange={e => handleInputChange(emp.id, 'otrosIngresos', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="glass-input w-24 text-right"
                                                placeholder="0.00"
                                                value={payrollData[emp.id]?.faltas || ''}
                                                onChange={e => handleInputChange(emp.id, 'faltas', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="glass-input w-24 text-right"
                                                placeholder="0.00"
                                                value={payrollData[emp.id]?.otrasDeducciones || ''}
                                                onChange={e => handleInputChange(emp.id, 'otrasDeducciones', e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-200">
                            <p className="font-medium mb-1">Nota:</p>
                            <p>Los valores ingresados aquí se sumarán a los cálculos automáticos y deducciones recurrentes configuradas en el perfil del empleado.</p>
                        </div>
                    </div>
                </div>

                <div className="glass-modal-footer">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-glass primary"
                    >
                        {loading ? 'Generando...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Confirmar y Generar Nómina
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayrollWizard;
