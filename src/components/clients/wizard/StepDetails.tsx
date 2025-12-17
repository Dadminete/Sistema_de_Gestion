import React from 'react';
import { Settings, Building, UserCheck, CheckCircle, CreditCard, Calendar, Percent, FileText, User } from 'lucide-react';
import type { StepProps } from './types';

const StepDetails: React.FC<StepProps> = ({
    formData,
    updateFormData
}) => {
    return (
        <div className="step-content">
            <div className="step-header">
                <div className="step-icon">
                    <Settings size={24} />
                </div>
                <div>
                    <h3>Detalles del Cliente</h3>
                    <p>Configuración y detalles financieros</p>
                </div>
            </div>

            <div className="form-section">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="tipo_cliente">
                            <Building size={16} />
                            Tipo de Cliente
                        </label>
                        <select
                            id="tipo_cliente"
                            value={formData.tipo_cliente}
                            onChange={(e) => updateFormData('tipo_cliente', e.target.value)}
                            className="form-input"
                        >
                            <option value="residencial">Residencial</option>
                            <option value="comercial">Comercial</option>
                            <option value="empresarial">Empresarial</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="categoria_cliente">
                            <UserCheck size={16} />
                            Categoría
                        </label>
                        <select
                            id="categoria_cliente"
                            value={formData.categoria_cliente}
                            onChange={(e) => updateFormData('categoria_cliente', e.target.value as any)}
                            className="form-input"
                        >
                            <option value="NUEVO">Nuevo</option>
                            <option value="VIEJO">Viejo</option>
                            <option value="VIP">VIP</option>
                            <option value="INACTIVO">Inactivo</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="estado">
                            <CheckCircle size={16} />
                            Estado
                        </label>
                        <select
                            id="estado"
                            value={formData.estado}
                            onChange={(e) => updateFormData('estado', e.target.value)}
                            className="form-input"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="suspendido">Suspendido</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="referido_por">
                            <User size={16} />
                            Referido Por (ID)
                        </label>
                        <input
                            id="referido_por"
                            type="text"
                            value={formData.referido_por}
                            onChange={(e) => updateFormData('referido_por', e.target.value)}
                            className="form-input"
                            placeholder="UUID del cliente que refirió"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="limite_crediticio">
                            <CreditCard size={16} />
                            Límite de Crédito (DOP)
                        </label>
                        <input
                            id="limite_crediticio"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.limite_crediticio}
                            onChange={(e) => updateFormData('limite_crediticio', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dias_credito">
                            <Calendar size={16} />
                            Días de Crédito
                        </label>
                        <input
                            id="dias_credito"
                            type="number"
                            min="0"
                            value={formData.dias_credito}
                            onChange={(e) => updateFormData('dias_credito', parseInt(e.target.value) || 0)}
                            className="form-input"
                            placeholder="30"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="descuento_porcentaje">
                            <Percent size={16} />
                            Descuento (%)
                        </label>
                        <input
                            id="descuento_porcentaje"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.descuento_porcentaje}
                            onChange={(e) => updateFormData('descuento_porcentaje', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group full-width">
                        <label htmlFor="notas">
                            <FileText size={16} />
                            Notas Adicionales
                        </label>
                        <textarea
                            id="notas"
                            value={formData.notas}
                            onChange={(e) => updateFormData('notas', e.target.value)}
                            className="form-input"
                            rows={3}
                            placeholder="Información adicional, observaciones especiales, etc."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepDetails;
