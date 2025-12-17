import { useState, useEffect } from 'react';
import { X, DollarSign, Clock, Calculator, FileText } from 'lucide-react';
import type { Payroll } from '../../../services/hrService';

interface PayrollFormProps {
    payroll: Payroll;
    onClose: () => void;
    onSave: (id: string, data: any) => void;
}

const PayrollForm = ({ payroll, onClose, onSave }: PayrollFormProps) => {
    const [formData, setFormData] = useState({
        diasTrabajados: 30,
        horasTrabajadas: 0,
        salarioBase: 0,
        horasExtrasOrdinarias: 0,
        horasExtrasNocturnas: 0,
        horasExtrasFeriados: 0,
        bonificaciones: 0,
        comisiones: 0,
        viaticos: 0,
        subsidios: 0,
        retroactivos: 0,
        vacacionesPagadas: 0,
        otrosIngresos: 0,
        prestamos: 0,
        adelantos: 0,
        faltas: 0,
        tardanzas: 0,
        otrasDeducciones: 0,
        isr: 0,
        seguridadSocial: 0,
        seguroSalud: 0,
        observaciones: ''
    });

    const [totals, setTotals] = useState({
        totalIngresos: 0,
        totalDeducciones: 0,
        salarioNeto: 0
    });

    useEffect(() => {
        if (payroll) {
            setFormData({
                diasTrabajados: Number(payroll.diasTrabajados) || 30,
                horasTrabajadas: Number(payroll.horasTrabajadas) || 0,
                salarioBase: Number(payroll.salarioBase) || 0,
                horasExtrasOrdinarias: Number(payroll.horasExtrasOrdinarias) || 0,
                horasExtrasNocturnas: Number(payroll.horasExtrasNocturnas) || 0,
                horasExtrasFeriados: Number(payroll.horasExtrasFeriados) || 0,
                bonificaciones: Number(payroll.bonificaciones) || 0,
                comisiones: Number(payroll.comisiones) || 0,
                viaticos: Number(payroll.viaticos) || 0,
                subsidios: Number(payroll.subsidios) || 0,
                retroactivos: Number(payroll.retroactivos) || 0,
                vacacionesPagadas: Number(payroll.vacacionesPagadas) || 0,
                otrosIngresos: Number(payroll.otrosIngresos) || 0,
                prestamos: Number(payroll.prestamos) || 0,
                adelantos: Number(payroll.adelantos) || 0,
                faltas: Number(payroll.faltas) || 0,
                tardanzas: Number(payroll.tardanzas) || 0,
                otrasDeducciones: Number(payroll.otrasDeducciones) || 0,
                isr: Number(payroll.isr) || 0,
                seguridadSocial: Number(payroll.seguridadSocial) || 0,
                seguroSalud: Number(payroll.seguroSalud) || 0,
                observaciones: payroll.observaciones || ''
            });
        }
    }, [payroll]);

    useEffect(() => {
        // Calculate totals with strict number casting
        const ingresos =
            (Number(formData.salarioBase) || 0) +
            (Number(formData.horasExtrasOrdinarias) || 0) +
            (Number(formData.horasExtrasNocturnas) || 0) +
            (Number(formData.horasExtrasFeriados) || 0) +
            (Number(formData.bonificaciones) || 0) +
            (Number(formData.comisiones) || 0) +
            (Number(formData.viaticos) || 0) +
            (Number(formData.subsidios) || 0) +
            (Number(formData.retroactivos) || 0) +
            (Number(formData.vacacionesPagadas) || 0) +
            (Number(formData.otrosIngresos) || 0);

        // Taxes from form data (editable)
        const impuestos =
            (Number(formData.isr) || 0) +
            (Number(formData.seguridadSocial) || 0) +
            (Number(formData.seguroSalud) || 0);

        const deducciones =
            impuestos +
            (Number(formData.prestamos) || 0) +
            (Number(formData.adelantos) || 0) +
            (Number(formData.faltas) || 0) +
            (Number(formData.tardanzas) || 0) +
            (Number(formData.otrasDeducciones) || 0);

        setTotals({
            totalIngresos: ingresos,
            totalDeducciones: deducciones,
            salarioNeto: ingresos - deducciones
        });
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'observaciones' ? value : (value === '' ? 0 : parseFloat(value))
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(payroll.id, formData);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(amount);
    };

    return (
        <div className="glass-modal-overlay" onClick={onClose}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="glass-modal-header">
                    <h2 className="glass-modal-title">
                        Editar Nómina - {payroll.empleado?.nombres} {payroll.empleado?.apellidos}
                    </h2>
                    <button className="glass-modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="glass-modal-body">
                        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            {/* Work Info */}
                            <div className="form-section" style={{ gridColumn: '1 / -1' }}>
                                <h3 className="form-section-title">
                                    <Clock className="w-5 h-5" />
                                    Tiempo Trabajado
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="glass-label">Días Trabajados</label>
                                        <input
                                            type="number"
                                            name="diasTrabajados"
                                            value={formData.diasTrabajados}
                                            onChange={handleChange}
                                            className="glass-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="glass-label">Salario Base</label>
                                        <input
                                            type="number"
                                            name="salarioBase"
                                            value={formData.salarioBase}
                                            onChange={handleChange}
                                            className="glass-input"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Income */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                    Ingresos Adicionales
                                </h3>
                                <div className="form-group">
                                    <label className="glass-label">Horas Extras</label>
                                    <input type="number" name="horasExtrasOrdinarias" value={formData.horasExtrasOrdinarias} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Bonificaciones</label>
                                    <input type="number" name="bonificaciones" value={formData.bonificaciones} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Comisiones</label>
                                    <input type="number" name="comisiones" value={formData.comisiones} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Otros Ingresos</label>
                                    <input type="number" name="otrosIngresos" value={formData.otrosIngresos} onChange={handleChange} className="glass-input" />
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <Calculator className="w-5 h-5 text-red-500" />
                                    Deducciones
                                </h3>
                                <div className="form-group">
                                    <label className="glass-label">Préstamos</label>
                                    <input type="number" name="prestamos" value={formData.prestamos} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Adelantos</label>
                                    <input type="number" name="adelantos" value={formData.adelantos} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Faltas/Tardanzas</label>
                                    <input type="number" name="faltas" value={formData.faltas} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Otras Deducciones</label>
                                    <input type="number" name="otrasDeducciones" value={formData.otrasDeducciones} onChange={handleChange} className="glass-input" />
                                </div>
                            </div>

                            {/* Taxes (New Section) */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                    Impuestos y Retenciones
                                </h3>
                                <div className="form-group">
                                    <label className="glass-label">ISR (Impuesto Sobre Renta)</label>
                                    <input type="number" name="isr" value={formData.isr} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Seguridad Social (AFP)</label>
                                    <input type="number" name="seguridadSocial" value={formData.seguridadSocial} onChange={handleChange} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label className="glass-label">Seguro Salud (SFS)</label>
                                    <input type="number" name="seguroSalud" value={formData.seguroSalud} onChange={handleChange} className="glass-input" />
                                </div>
                            </div>

                            {/* Observations */}
                            <div className="form-section" style={{ gridColumn: '1 / -1' }}>
                                <div className="form-group">
                                    <label className="glass-label">Observaciones</label>
                                    <textarea
                                        name="observaciones"
                                        value={formData.observaciones}
                                        onChange={handleChange}
                                        className="glass-input"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="form-section" style={{ gridColumn: '1 / -1', background: 'rgba(102, 126, 234, 0.05)', padding: '16px', borderRadius: '12px' }}>
                                <h3 className="form-section-title">
                                    <Calculator className="w-5 h-5 text-blue-500" />
                                    Resumen de Cálculos (Estimado)
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div className="text-sm text-gray-500 mb-1">Total Ingresos</div>
                                        <div className="text-lg font-bold text-green-500">
                                            {formatCurrency(totals.totalIngresos)}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div className="text-sm text-gray-500 mb-1">Total Deducciones</div>
                                        <div className="text-lg font-bold text-red-500">
                                            {formatCurrency(totals.totalDeducciones)}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div className="text-sm text-gray-500 mb-1">Salario Neto</div>
                                        <div className="text-xl font-bold text-blue-500">
                                            {formatCurrency(totals.salarioNeto)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-modal-footer">
                        <button type="button" className="btn-glass secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-glass primary">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayrollForm;
