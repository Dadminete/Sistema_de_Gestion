import { useState, useEffect } from 'react';
import { X, DollarSign, Calculator } from 'lucide-react';
import * as commissionService from '../../../services/commissionService';
import { hrService } from '../../../services/hrService';
import type { Commission, CommissionType } from '../../../services/commissionService';
import './CommissionModals.css';

interface CommissionFormProps {
    commission?: Commission | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CommissionForm = ({ commission, onClose, onSuccess }: CommissionFormProps) => {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [types, setTypes] = useState<CommissionType[]>([]);
    const [formData, setFormData] = useState({
        empleadoId: commission?.empleadoId || '',
        tipoComisionId: commission?.tipoComisionId || '',
        periodoAno: commission?.periodoAno || new Date().getFullYear(),
        periodoMes: commission?.periodoMes || new Date().getMonth() + 1,
        montoBase: commission?.montoBase || 0,
        porcentajeAplicado: commission?.porcentajeAplicado || 0,
        montoComision: commission?.montoComision || 0,
        descripcion: commission?.descripcion || '',
        observaciones: commission?.observaciones || ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [employeesData, typesData] = await Promise.all([
                hrService.getEmployees(),
                commissionService.getCommissionTypes()
            ]);
            setEmployees(employeesData);
            setTypes(typesData);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error al cargar los datos');
        }
    };

    const handleCalculate = async () => {
        if (!formData.tipoComisionId || !formData.montoBase) {
            alert('Seleccione un tipo de comisión y un monto base');
            return;
        }

        try {
            const result = await commissionService.calculateCommission(
                formData.tipoComisionId,
                formData.montoBase
            );
            setFormData({
                ...formData,
                porcentajeAplicado: result.porcentajeAplicado,
                montoComision: result.montoComision
            });
        } catch (error) {
            console.error('Error calculating:', error);
            alert('Error al calcular la comisión');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.empleadoId || !formData.tipoComisionId) {
            alert('Complete todos los campos requeridos');
            return;
        }

        let submitData = { ...formData };

        // Auto-calculate if amount is 0 but base amount is set
        if (submitData.montoComision === 0 && submitData.montoBase > 0 && submitData.tipoComisionId) {
            try {
                const result = await commissionService.calculateCommission(
                    submitData.tipoComisionId,
                    submitData.montoBase
                );
                submitData.porcentajeAplicado = result.porcentajeAplicado;
                submitData.montoComision = result.montoComision;

                // Update state to reflect calculation
                setFormData(prev => ({
                    ...prev,
                    porcentajeAplicado: result.porcentajeAplicado,
                    montoComision: result.montoComision
                }));
            } catch (error) {
                console.error('Error auto-calculating:', error);
                // Proceed with 0 or user can try again
            }
        }

        try {
            setLoading(true);
            if (commission) {
                await commissionService.updateCommission(commission.id, submitData);
            } else {
                await commissionService.createCommission(submitData);
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving commission:', error);
            alert('Error al guardar la comisión');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(amount);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{commission ? 'Editar Comisión' : 'Nueva Comisión'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Employee Selection */}
                        <div className="form-group">
                            <label>Empleado *</label>
                            <select
                                value={formData.empleadoId}
                                onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                                required
                                disabled={!!commission}
                            >
                                <option value="">Seleccione un empleado</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nombres} {emp.apellidos} - {emp.codigoEmpleado}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Commission Type */}
                        <div className="form-group">
                            <label>Tipo de Comisión *</label>
                            <select
                                value={formData.tipoComisionId}
                                onChange={(e) => setFormData({ ...formData, tipoComisionId: e.target.value })}
                                required
                            >
                                <option value="">Seleccione un tipo</option>
                                {types.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.nombreTipo}
                                        {type.porcentajeBase && ` (${type.porcentajeBase}%)`}
                                        {type.montoFijo && ` (${formatCurrency(Number(type.montoFijo))})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Period Selection */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Año *</label>
                                <select
                                    value={formData.periodoAno}
                                    onChange={(e) => setFormData({ ...formData, periodoAno: Number(e.target.value) })}
                                    required
                                >
                                    {[...Array(5)].map((_, i) => {
                                        const year = new Date().getFullYear() - i;
                                        return <option key={year} value={year}>{year}</option>;
                                    })}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Mes *</label>
                                <select
                                    value={formData.periodoMes}
                                    onChange={(e) => setFormData({ ...formData, periodoMes: Number(e.target.value) })}
                                    required
                                >
                                    {[
                                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                                    ].map((month, idx) => (
                                        <option key={idx + 1} value={idx + 1}>{month}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Base Amount */}
                        <div className="form-group">
                            <label>Monto Base *</label>
                            <div className="input-group">
                                <span className="input-icon">
                                    <DollarSign />
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.montoBase}
                                    onChange={(e) => setFormData({ ...formData, montoBase: Number(e.target.value) })}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn-calculate"
                                    onClick={handleCalculate}
                                    title="Calcular comisión"
                                >
                                    <Calculator className="w-4 h-4" />
                                    Calcular
                                </button>
                            </div>
                        </div>

                        {/* Commission Calculation Results */}
                        {formData.montoComision > 0 && (
                            <div className="calculation-results">
                                <div className="result-item">
                                    <span>Porcentaje:</span>
                                    <strong>{formData.porcentajeAplicado.toFixed(2)}%</strong>
                                </div>
                                <div className="result-item result-highlight">
                                    <span>Comisión:</span>
                                    <strong>{formatCurrency(formData.montoComision)}</strong>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                rows={2}
                                placeholder="Descripción opcional de la comisión..."
                            />
                        </div>

                        {/* Observations */}
                        <div className="form-group">
                            <label>Observaciones</label>
                            <textarea
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                rows={2}
                                placeholder="Observaciones adicionales..."
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : commission ? 'Actualizar' : 'Crear Comisión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommissionForm;
