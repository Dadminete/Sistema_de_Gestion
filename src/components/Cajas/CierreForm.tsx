import React from 'react';
import { Save, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import type { Caja } from '../../services/cajaService';

interface CierreFormProps {
    form: {
        cajaId: string;
        montoFinal: number;
        ingresosDelDia: number;
        gastosDelDia: number;
        totalVentasPapeleria: number;
        observaciones: string;
        montosFinales?: Record<string, number>;
        resumenCajas?: Record<string, { ingresos: number; gastos: number }>;
    };
    setForm: React.Dispatch<React.SetStateAction<{
        cajaId: string;
        montoFinal: number;
        ingresosDelDia: number;
        gastosDelDia: number;
        totalVentasPapeleria: number;
        observaciones: string;
        montosFinales?: Record<string, number>;
        resumenCajas?: Record<string, { ingresos: number; gastos: number }>;
    }>>;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
    cajas: Caja[];
    cajasAbiertas?: Record<string, boolean>;
}

const CierreForm: React.FC<CierreFormProps> = ({ form, setForm, onSubmit, isSubmitting, cajas, cajasAbiertas = {} }) => {
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

    // Ordenar cajas: Caja Principal primero, luego alfabéticamente
    const cajasOrdenadas = [...cajas].sort((a, b) => {
        const nameA = (a.nombre || '').toLowerCase();
        const nameB = (b.nombre || '').toLowerCase();
        
        if (nameA.includes('principal') || nameA === 'caja principal') return -1;
        if (nameB.includes('principal') || nameB === 'caja principal') return 1;
        
        return nameA.localeCompare(nameB, 'es');
    });

    return (
        <form onSubmit={onSubmit} className="cierre-form">
            <div className="form-header-section">
                <h3>Cierre de Caja</h3>
                <p className="form-description">
                    <AlertCircle size={16} />
                    Configure el monto final para las cajas que desea cerrar.
                </p>
            </div>

            {cajasOrdenadas.length > 0 ? (
                <div className="cajas-apertura-grid">
                    {cajasOrdenadas.map((caja) => {
                        const estaAbierta = cajasAbiertas[caja.id] || false;
                        const montoIngresado = form.montosFinales?.[caja.id] || 0;
                        const estaSeleccionadaParaCerrar = montoIngresado > 0 && estaAbierta;
                        return (
                            <div key={caja.id} className={`caja-input-card ${estaSeleccionadaParaCerrar ? 'caja-abierta' : 'caja-cerrada'}`}>
                                <div className="caja-info">
                                    <div className="caja-header">
                                        <h4>{caja.nombre}</h4>
                                    </div>
                                    <span className="current-balance">
                                        Balance actual: {formatCurrency(caja.saldoActual)}
                                    </span>
                                    <div className="caja-resumen-dia">
                                        <div className="resumen-item ingreso">
                                            <small>Ingresos:</small>
                                            <span>{formatCurrency((form as any).resumenCajas?.[caja.id]?.ingresos || 0)}</span>
                                        </div>
                                        <div className="resumen-item gasto">
                                            <small>Gastos:</small>
                                            <span>{formatCurrency((form as any).resumenCajas?.[caja.id]?.gastos || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`monto-cierre-${caja.id}`}>
                                        <DollarSign size={14} />
                                        Monto Final
                                    </label>
                                    <input
                                        type="number"
                                        id={`monto-cierre-${caja.id}`}
                                        className={`form-input`}
                                        value={montoIngresado > 0 ? montoIngresado : ''}
                                        onChange={(e) => {
                                            const newMonto = parseFloat(e.target.value) || 0;
                                            setForm(prev => ({
                                                ...prev,
                                                montosFinales: {
                                                    ...prev.montosFinales,
                                                    [caja.id]: newMonto
                                                }
                                            }));
                                        }}
                                        disabled={!estaAbierta}
                                        min="0"
                                        step="0.01"
                                        placeholder={estaAbierta ? "0.00" : "Cerrada"}
                                        title={estaAbierta ? "" : "Esta caja ya está cerrada"}
                                    />
                                    <span className={`estado-badge ${estaAbierta ? 'abierta' : 'cerrada'}`}>
                                        {estaAbierta ? '🟢 Abierta' : '🔴 Cerrada'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="no-data-message">
                    <p>No hay cajas disponibles para cerrar.</p>
                </div>
            )}

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
                <div className="info-item">
                    <span>Cajas a cerrar: <strong>{Object.keys(form.montosFinales || {}).filter(cajaId => (form.montosFinales || {})[cajaId] > 0).length}</strong></span>
                </div>
            </div>

            <button
                type="submit"
                className="submit-button danger"
                disabled={isSubmitting || Object.keys(form.montosFinales || {}).every(cajaId => (form.montosFinales || {})[cajaId] === 0)}
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
