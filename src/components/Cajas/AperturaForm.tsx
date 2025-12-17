import React from 'react';
import { Save, AlertCircle, DollarSign, Calendar } from 'lucide-react';

interface AperturaFormProps {
    form: {
        cajas: Array<{
            id: string;
            nombre: string;
            montoInicial: number;
            saldoActual: number;
        }>;
        observaciones: string;
    };
    setForm: React.Dispatch<React.SetStateAction<{
        cajas: Array<{
            id: string;
            nombre: string;
            montoInicial: number;
            saldoActual: number;
        }>;
        observaciones: string;
    }>>;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
    cajasAbiertas?: Record<string, boolean>;
}

const AperturaForm: React.FC<AperturaFormProps> = ({ form, setForm, onSubmit, isSubmitting, cajasAbiertas = {} }) => {
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
        <form onSubmit={onSubmit} className="apertura-form">
            <div className="form-header-section">
                <h3>Apertura de Cajas</h3>
                <p className="form-description">
                    <AlertCircle size={16} />
                    Configure los montos iniciales para las cajas que desea aperturar.
                </p>
            </div>

            {form.cajas.length > 0 ? (
                <div className="cajas-apertura-grid">
                    {form.cajas.map((caja, index) => {
                        const estaAbierta = cajasAbiertas[caja.id] || false;
                        return (
                            <div key={caja.id} className={`caja-input-card ${estaAbierta ? 'caja-abierta' : 'caja-cerrada'}`}>
                                <div className="caja-info">
                                    <div className="caja-header">
                                        <h4>{caja.nombre}</h4>
                                        <span className={`estado-badge ${estaAbierta ? 'abierta' : 'cerrada'}`}>
                                            {estaAbierta ? '🟢 Abierta' : '🔴 Cerrada'}
                                        </span>
                                    </div>
                                    <span className="current-balance">
                                        Balance actual: {formatCurrency(caja.saldoActual)}
                                    </span>
                                    {estaAbierta && (
                                        <span className="warning-text">
                                            ⚠️ Esta caja ya está abierta
                                        </span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`monto-${caja.id}`}>
                                        <DollarSign size={14} />
                                        Monto Inicial
                                    </label>
                                    <input
                                        type="number"
                                        id={`monto-${caja.id}`}
                                        className={`form-input ${estaAbierta ? 'disabled' : ''}`}
                                        value={caja.montoInicial === 0 ? '' : caja.montoInicial}
                                        onChange={(e) => {
                                            if (estaAbierta) return; // No permitir cambios si la caja está abierta
                                            const newMonto = parseFloat(e.target.value) || 0;
                                            setForm(prev => ({
                                                ...prev,
                                                cajas: prev.cajas.map((c, i) =>
                                                    i === index ? { ...c, montoInicial: newMonto } : c
                                                ),
                                            }));
                                        }}
                                        min="0"
                                        step="0.01"
                                        placeholder={estaAbierta ? "Ya abierta" : "0.00"}
                                        disabled={estaAbierta}
                                        title={estaAbierta ? "Esta caja ya está abierta" : ""}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="no-data-message">
                    <p>No hay cajas disponibles para aperturar.</p>
                </div>
            )}

            <div className="form-group full-width">
                <label htmlFor="apertura-observaciones">Observaciones</label>
                <textarea
                    id="apertura-observaciones"
                    className="form-input"
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    rows={3}
                    placeholder="Observaciones de la apertura..."
                />
            </div>

            <div className="form-footer">
                <div className="info-item">
                    <Calendar size={16} />
                    <span>{formatDateTime(new Date())}</span>
                </div>
                <div className="info-item">
                    <span>Cajas a aperturar: <strong>{form.cajas.filter(c => c.montoInicial > 0).length}</strong></span>
                </div>
            </div>

            <button
                type="submit"
                className="submit-button primary"
                disabled={isSubmitting || !form.cajas.some(c => c.montoInicial > 0)}
            >
                {isSubmitting ? (
                    <>
                        <span className="spinner-small"></span>
                        Procesando...
                    </>
                ) : (
                    <>
                        <Save size={18} />
                        Realizar Apertura
                    </>
                )}
            </button>
        </form>
    );
};

export default AperturaForm;
