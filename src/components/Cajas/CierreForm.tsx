import React from 'react';
import { Save, DollarSign, Calendar, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import type { Caja } from '../../services/cajaService';

interface CierreFormProps {
    form: {
        cajaId: string;
        montoFinal: number;
        ingresosDelDia: number;
        gastosDelDia: number;
        totalVentasPapeleria: number;
        observaciones: string;
    };
    setForm: React.Dispatch<React.SetStateAction<{
        cajaId: string;
        montoFinal: number;
        ingresosDelDia: number;
        gastosDelDia: number;
        totalVentasPapeleria: number;
        observaciones: string;
    }>>;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
    cajas: Caja[];
}

const CierreForm: React.FC<CierreFormProps> = ({ form, setForm, onSubmit, isSubmitting, cajas }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
        }).format(amount);
    };

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <form onSubmit={onSubmit} className="cierre-form">
            <div className="form-header-section">
                <h3>Cierre de Caja</h3>
                <p className="form-description">
                    Seleccione la caja y verifique los montos antes de realizar el cierre.
                </p>
            </div>

            <div className="form-group">
                <label htmlFor="cierre-caja">Caja a cerrar</label>
                <select
                    id="cierre-caja"
                    className="form-select"
                    value={form.cajaId}
                    onChange={(e) => setForm({ ...form, cajaId: e.target.value })}
                    required
                >
                    <option value="">Seleccionar caja</option>
                    {cajas.length > 0 ? cajas.map((caja) => (
                        <option key={caja.id} value={caja.id}>
                            {caja.nombre} - Balance: {formatCurrency(caja.saldoActual)}
                        </option>
                    )) : (
                        <option value="" disabled>No hay cajas disponibles</option>
                    )}
                </select>
            </div>

            <div className="stats-summary-row">
                <div className="stat-card">
                    <div className="stat-icon income">
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-details">
                        <label>Ingresos del día</label>
                        <span className="value positive">{formatCurrency(form.ingresosDelDia)}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon expense">
                        <TrendingDown size={20} />
                    </div>
                    <div className="stat-details">
                        <label>Gastos del día</label>
                        <span className="value negative">{formatCurrency(form.gastosDelDia)}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon sales">
                        <ShoppingCart size={20} />
                    </div>
                    <div className="stat-details">
                        <label>Ventas Papelería</label>
                        <span className="value">{formatCurrency(form.totalVentasPapeleria)}</span>
                    </div>
                </div>
            </div>

            <div className="form-group highlight-group">
                <label htmlFor="cierre-monto-final">
                    <DollarSign size={18} />
                    Monto Final de Cierre
                </label>
                <input
                    type="number"
                    id="cierre-monto-final"
                    className="form-input large-input"
                    value={form.montoFinal === 0 ? '' : form.montoFinal}
                    onChange={(e) => setForm({ ...form, montoFinal: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                />
            </div>

            <div className="form-group full-width">
                <label htmlFor="cierre-observaciones">Observaciones</label>
                <textarea
                    id="cierre-observaciones"
                    className="form-input"
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    rows={3}
                    placeholder="Observaciones del cierre..."
                />
            </div>

            <div className="form-footer">
                <div className="info-item">
                    <Calendar size={16} />
                    <span>{formatDateTime(new Date())}</span>
                </div>
            </div>

            <button
                type="submit"
                className="submit-button danger"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <span className="spinner-small"></span>
                        Procesando...
                    </>
                ) : (
                    <>
                        <Save size={18} />
                        Realizar Cierre
                    </>
                )}
            </button>
        </form>
    );
};

export default CierreForm;
