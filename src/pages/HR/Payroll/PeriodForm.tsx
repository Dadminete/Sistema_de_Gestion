import { useState, useEffect } from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import type { PayrollPeriod } from '../../../services/hrService';

interface PeriodFormProps {
    period?: PayrollPeriod | null;
    onClose: () => void;
    onSave: (data: any) => void;
}

const PeriodForm = ({ period, onClose, onSave }: PeriodFormProps) => {
    const [formData, setFormData] = useState({
        codigoPeriodo: '',
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        quincena: 1,
        fechaInicio: '',
        fechaFin: '',
        fechaPago: '',
        estado: 'ABIERTO',
        tipoPeriodo: 'QUINCENAL',
        observaciones: ''
    });

    useEffect(() => {
        if (period) {
            setFormData({
                codigoPeriodo: period.codigoPeriodo || '',
                ano: period.ano || new Date().getFullYear(),
                mes: period.mes || new Date().getMonth() + 1,
                quincena: period.quincena || 1,
                fechaInicio: period.fechaInicio?.split('T')[0] || '',
                fechaFin: period.fechaFin?.split('T')[0] || '',
                fechaPago: period.fechaPago?.split('T')[0] || '',
                estado: period.estado || 'ABIERTO',
                tipoPeriodo: period.tipoPeriodo || 'QUINCENAL',
                observaciones: period.observaciones || ''
            });
        } else {
            // Auto-generate period code for new periods
            const year = new Date().getFullYear();
            const month = new Date().getMonth() + 1;
            const code = `${year}-${month.toString().padStart(2, '0')}-Q1`;
            setFormData(prev => ({ ...prev, codigoPeriodo: code }));
        }
    }, [period]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'ano' || name === 'mes' || name === 'quincena' ? parseInt(value) : value
        }));

        // Auto-update period code when year, month, or quincena changes
        if (name === 'ano' || name === 'mes' || name === 'quincena') {
            const year = name === 'ano' ? parseInt(value) : formData.ano;
            const month = name === 'mes' ? parseInt(value) : formData.mes;
            const quinc = name === 'quincena' ? parseInt(value) : formData.quincena;
            const code = `${year}-${month.toString().padStart(2, '0')}-Q${quinc}`;
            setFormData(prev => ({ ...prev, codigoPeriodo: code }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="glass-modal-overlay" onClick={onClose}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <h2 className="glass-modal-title">
                        {period ? 'Editar Período' : 'Nuevo Período de Nómina'}
                    </h2>
                    <button className="glass-modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="glass-modal-body">
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Calendar className="w-5 h-5" />
                                Información del Período
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="glass-label">Código del Período</label>
                                    <input
                                        type="text"
                                        name="codigoPeriodo"
                                        value={formData.codigoPeriodo}
                                        onChange={handleChange}
                                        className="glass-input"
                                        required
                                        readOnly
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Tipo de Período</label>
                                    <select
                                        name="tipoPeriodo"
                                        value={formData.tipoPeriodo}
                                        onChange={handleChange}
                                        className="glass-input glass-select"
                                        required
                                    >
                                        <option value="SEMANAL">Semanal</option>
                                        <option value="QUINCENAL">Quincenal</option>
                                        <option value="MENSUAL">Mensual</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Año</label>
                                    <input
                                        type="number"
                                        name="ano"
                                        value={formData.ano}
                                        onChange={handleChange}
                                        className="glass-input"
                                        required
                                        min="2020"
                                        max="2100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Mes</label>
                                    <select
                                        name="mes"
                                        value={formData.mes}
                                        onChange={handleChange}
                                        className="glass-input glass-select"
                                        required
                                    >
                                        <option value="1">Enero</option>
                                        <option value="2">Febrero</option>
                                        <option value="3">Marzo</option>
                                        <option value="4">Abril</option>
                                        <option value="5">Mayo</option>
                                        <option value="6">Junio</option>
                                        <option value="7">Julio</option>
                                        <option value="8">Agosto</option>
                                        <option value="9">Septiembre</option>
                                        <option value="10">Octubre</option>
                                        <option value="11">Noviembre</option>
                                        <option value="12">Diciembre</option>
                                    </select>
                                </div>

                                {formData.tipoPeriodo === 'QUINCENAL' && (
                                    <div className="form-group">
                                        <label className="glass-label">Quincena</label>
                                        <select
                                            name="quincena"
                                            value={formData.quincena}
                                            onChange={handleChange}
                                            className="glass-input glass-select"
                                        >
                                            <option value="1">Primera Quincena</option>
                                            <option value="2">Segunda Quincena</option>
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="glass-label">Estado</label>
                                    <select
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        className="glass-input glass-select"
                                        required
                                    >
                                        <option value="ABIERTO">Abierto</option>
                                        <option value="CERRADO">Cerrado</option>
                                        <option value="PROCESADO">Procesado</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        name="fechaInicio"
                                        value={formData.fechaInicio}
                                        onChange={handleChange}
                                        className="glass-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Fecha Fin</label>
                                    <input
                                        type="date"
                                        name="fechaFin"
                                        value={formData.fechaFin}
                                        onChange={handleChange}
                                        className="glass-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Fecha de Pago</label>
                                    <input
                                        type="date"
                                        name="fechaPago"
                                        value={formData.fechaPago}
                                        onChange={handleChange}
                                        className="glass-input"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <FileText className="w-5 h-5" />
                                Observaciones
                            </h3>
                            <div className="form-group">
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    className="glass-input"
                                    rows={3}
                                    placeholder="Notas adicionales sobre este período..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-modal-footer">
                        <button type="button" className="btn-glass secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-glass primary">
                            {period ? 'Actualizar' : 'Crear'} Período
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PeriodForm;
