import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, X, Receipt, Calendar, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import ClienteSelectorConFiltro from '../components/ClienteSelectorConFiltro';
import FacturaResumen from '../components/FacturaResumen';
import facturaService from '../services/facturaService';
import {
    calcularFechaFacturacion,
    calcularFechaVencimiento,
    calcularPeriodoFacturado,
    formatearFechaInput,
    formatearFecha,
    calcularTotalLinea,
    validarFactura
} from '../utils/facturaUtils';
import '../styles/invoices-theme.css';
import './FacturasCrear.css';

interface DetalleFactura {
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    total: number;
    servicioId?: string;
}

const FacturasCrear: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const facturaId = searchParams.get('id');

    const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
    const [suscripciones, setSuscripciones] = useState<any[]>([]);
    const [numeroFactura, setNumeroFactura] = useState('');
    const [fechaFactura, setFechaFactura] = useState('');
    const [fechaVencimiento, setFechaVencimiento] = useState('');
    const [periodoInicio, setPeriodoInicio] = useState('');
    const [periodoFin, setPeriodoFin] = useState('');
    const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
    const [itbis, setItbis] = useState(0);
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSuscripciones, setLoadingSuscripciones] = useState(false);

    useEffect(() => {
        if (facturaId) {
            cargarFacturaParaEditar();
        } else {
            generarNumeroFactura();
        }
    }, [facturaId]);

    useEffect(() => {
        console.log('🔄 useEffect - Cliente seleccionado cambió:', clienteSeleccionado);
        // Solo cargar suscripciones si NO estamos editando una factura existente
        // o si el cliente cambió después de haber cargado la factura inicial
        if (clienteSeleccionado && !facturaId) {
            console.log('✅ Hay cliente y no es edición, cargando suscripciones...');
            cargarSuscripcionesCliente();
        } else if (!clienteSeleccionado) {
            console.log('❌ No hay cliente, limpiando datos...');
            setSuscripciones([]);
            setDetalles([]);
            resetearFechas();
        }
    }, [clienteSeleccionado, facturaId]);

    const generarNumeroFactura = async () => {
        try {
            const numero = await facturaService.generarNumeroFactura();
            setNumeroFactura(numero);
        } catch (error) {
            console.error('Error al generar número de factura:', error);
        }
    };

    const cargarFacturaParaEditar = async () => {
        try {
            setLoading(true);
            const factura = await facturaService.obtenerFacturaPorId(facturaId!);

            setNumeroFactura(factura.numeroFactura);
            setClienteSeleccionado(factura.cliente);
            setFechaFactura(formatearFechaInput(factura.fechaFactura));
            setFechaVencimiento(formatearFechaInput(factura.fechaVencimiento));

            if (factura.periodoFacturadoInicio) {
                setPeriodoInicio(formatearFechaInput(factura.periodoFacturadoInicio));
            }
            if (factura.periodoFacturadoFin) {
                setPeriodoFin(formatearFechaInput(factura.periodoFacturadoFin));
            }

            setItbis(parseFloat(factura.itbis));
            setObservaciones(factura.observaciones || '');

            const detallesMapeados = factura.detalles.map((det: any) => ({
                concepto: det.concepto,
                cantidad: parseFloat(det.cantidad),
                precioUnitario: parseFloat(det.precioUnitario),
                descuento: parseFloat(det.descuento),
                subtotal: parseFloat(det.subtotal),
                total: parseFloat(det.total),
                servicioId: det.servicioId
            }));
            setDetalles(detallesMapeados);
        } catch (error) {
            console.error('Error al cargar factura:', error);
            alert('Error al cargar la factura para editar');
        } finally {
            setLoading(false);
        }
    };

    const cargarSuscripcionesCliente = async () => {
        if (!clienteSeleccionado) {
            console.log('⚠️ No hay cliente seleccionado');
            return;
        }

        try {
            console.log('📡 Cargando suscripciones para cliente:', clienteSeleccionado.id, clienteSeleccionado.nombre);
            setLoadingSuscripciones(true);
            const subs = await facturaService.obtenerSuscripcionesCliente(clienteSeleccionado.id);
            console.log('✅ Suscripciones recibidas:', subs);
            console.log('📊 Cantidad de suscripciones:', subs.length);
            setSuscripciones(subs);

            if (subs.length > 0) {
                const diaFacturacion = subs[0].diaFacturacion;
                const fechaFact = calcularFechaFacturacion(diaFacturacion);
                const fechaVenc = calcularFechaVencimiento(fechaFact);
                const periodo = calcularPeriodoFacturado(fechaFact);

                setFechaFactura(formatearFechaInput(fechaFact));
                setFechaVencimiento(formatearFechaInput(fechaVenc));
                setPeriodoInicio(formatearFechaInput(periodo.inicio));
                setPeriodoFin(formatearFechaInput(periodo.fin));

                const detallesIniciales = subs.map((sub: any) => {
                    const nombreItem = sub.servicio?.nombre || sub.plan?.nombre || 'Servicio/Plan';
                    const precio = parseFloat(sub.precioMensual);
                    const descuento = parseFloat(sub.descuentoAplicado || '0');

                    return {
                        concepto: `${nombreItem} - Período ${formatearFecha(periodo.inicio)} a ${formatearFecha(periodo.fin)}`,
                        cantidad: 1,
                        precioUnitario: precio,
                        descuento: descuento,
                        subtotal: precio,
                        total: precio - descuento,
                        servicioId: sub.servicioId,
                    };
                });

                console.log('📝 Detalles iniciales generados:', detallesIniciales);
                setDetalles(detallesIniciales);
            } else {
                console.log('⚠️ El cliente no tiene suscripciones activas');
                setDetalles([]);
            }
        } catch (error) {
            console.error('❌ Error al cargar suscripciones:', error);
            console.error('Detalles del error:', error);
        } finally {
            setLoadingSuscripciones(false);
            console.log('✅ Proceso de carga completado');
        }
    };

    const resetearFechas = () => {
        setFechaFactura('');
        setFechaVencimiento('');
        setPeriodoInicio('');
        setPeriodoFin('');
    };

    const agregarDetalle = () => {
        setDetalles([
            ...detalles,
            {
                concepto: '',
                cantidad: 1,
                precioUnitario: 0,
                descuento: 0,
                subtotal: 0,
                total: 0
            }
        ]);
    };

    const eliminarDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const actualizarDetalle = (index: number, campo: string, valor: any) => {
        const nuevosDetalles = [...detalles];
        nuevosDetalles[index] = {
            ...nuevosDetalles[index],
            [campo]: valor
        };

        const cantidad = nuevosDetalles[index].cantidad;
        const precioUnitario = nuevosDetalles[index].precioUnitario;
        const descuento = nuevosDetalles[index].descuento;

        nuevosDetalles[index].subtotal = cantidad * precioUnitario;
        nuevosDetalles[index].total = calcularTotalLinea(cantidad, precioUnitario, descuento);

        setDetalles(nuevosDetalles);
    };

    const calcularSubtotal = () => {
        return detalles.reduce((sum, d) => sum + d.subtotal, 0);
    };

    const calcularDescuentoTotal = () => {
        return detalles.reduce((sum, d) => sum + d.descuento, 0);
    };

    const handleGuardar = async () => {
        const validacion = validarFactura({
            clienteId: clienteSeleccionado?.id,
            detalles,
            itbis,
        });

        if (!validacion.valido) {
            alert('Errores de validación:\\n' + validacion.errores.join('\\n'));
            return;
        }

        try {
            setLoading(true);

            const data = {
                clienteId: clienteSeleccionado.id,
                detalles: detalles.map(d => ({
                    concepto: d.concepto,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                    subtotal: d.subtotal,
                    descuento: d.descuento,
                    impuesto: 0,
                    total: d.total,
                    servicioId: d.servicioId
                })),
                itbis,
                observaciones,
                pagarInmediatamente: false
            };

            if (facturaId) {
                await facturaService.actualizarFactura(facturaId, {
                    ...data,
                    fechaFactura,
                    fechaVencimiento,
                    periodoFacturadoInicio: periodoInicio,
                    periodoFacturadoFin: periodoFin
                });
                alert('✅ Factura actualizada exitosamente');
            } else {
                await facturaService.crearFactura(data);
                alert('✅ Factura creada exitosamente');
                // Reset form to create another factura
                setClienteSeleccionado(null);
                setDetalles([{
                    concepto: '',
                    cantidad: 1,
                    precioUnitario: 0,
                    subtotal: 0,
                    descuento: 0,
                    total: 0
                }]);
                setObservaciones('');
                setItbis(0);
            }
            // Stay on the create page instead of navigating to dashboard
        } catch (error: any) {
            console.error('Error al crear factura:', error);
            alert('Error al crear factura: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-invoice-page">
            <div className="create-invoice-hero">
                <div className="hero-header">
                    <div className="hero-title">
                        <FileText size={36} />
                        <h1>{facturaId ? 'Editar Factura' : 'Crear Nueva Factura'}</h1>
                    </div>
                    <div className="hero-actions">
                        <button className="btn-cancel" onClick={() => navigate('/facturas')}>
                            <X size={18} />
                            Ir a Facturas
                        </button>
                    </div>
                </div>
            </div>

            <div className="invoice-content">
                {/* Client Selection */}
                <div className="form-section">
                    <div className="section-header">
                        <User size={20} />
                        <span>Seleccionar Cliente</span>
                    </div>
                    <GlassCard>
                        <ClienteSelectorConFiltro onClienteSelect={setClienteSeleccionado} />
                    </GlassCard>
                </div>

                {clienteSeleccionado && (
                    <>
                        {/* Invoice Information */}
                        <div className="form-section">
                            <div className="section-header">
                                <Receipt size={20} />
                                <span>Información de Factura</span>
                            </div>
                            <GlassCard>
                                <div className="invoice-info-grid">
                                    <div className="info-field">
                                        <label>Número de Factura</label>
                                        <input type="text" value={numeroFactura} readOnly />
                                    </div>
                                    <div className="info-field">
                                        <label>Fecha de Factura</label>
                                        <input
                                            type="date"
                                            value={fechaFactura}
                                            onChange={(e) => setFechaFactura(e.target.value)}
                                        />
                                    </div>
                                    <div className="info-field">
                                        <label>Fecha de Vencimiento</label>
                                        <input
                                            type="date"
                                            value={fechaVencimiento}
                                            onChange={(e) => setFechaVencimiento(e.target.value)}
                                        />
                                    </div>
                                    <div className="info-field">
                                        <label>Período Inicio</label>
                                        <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
                                    </div>
                                    <div className="info-field">
                                        <label>Período Fin</label>
                                        <input type="date" value={periodoFin} onChange={(e) => setPeriodoFin(e.target.value)} />
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Invoice Details */}
                        <div className="form-section">
                            <div className="section-header">
                                <Calendar size={20} />
                                <span>Detalles de Factura</span>
                            </div>
                            <GlassCard>
                                <div className="details-section">
                                    <div className="details-header">
                                        <h3>Items</h3>
                                        <button className="btn-add-line" onClick={agregarDetalle}>
                                            <Plus size={18} />
                                            Agregar Línea
                                        </button>
                                    </div>

                                    <div className="details-table-wrapper">
                                        {detalles.length > 0 ? (
                                            <table className="details-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '35%' }}>Concepto</th>
                                                        <th style={{ width: '10%' }}>Cant.</th>
                                                        <th style={{ width: '15%' }}>P. Unitario</th>
                                                        <th style={{ width: '12%' }}>Descuento</th>
                                                        <th style={{ width: '13%' }}>Subtotal</th>
                                                        <th style={{ width: '13%' }}>Total</th>
                                                        <th style={{ width: '5%' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detalles.map((detalle, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    value={detalle.concepto}
                                                                    onChange={(e) => actualizarDetalle(index, 'concepto', e.target.value)}
                                                                    placeholder="Descripción del servicio/producto"
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    value={detalle.cantidad}
                                                                    onChange={(e) => actualizarDetalle(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                                    min="1"
                                                                    step="1"
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    value={detalle.precioUnitario}
                                                                    onChange={(e) => actualizarDetalle(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    value={detalle.descuento}
                                                                    onChange={(e) => actualizarDetalle(index, 'descuento', parseFloat(e.target.value) || 0)}
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>
                                                            <td className="amount-cell">RD$ {detalle.subtotal.toFixed(2)}</td>
                                                            <td className="amount-cell">RD$ {detalle.total.toFixed(2)}</td>
                                                            <td>
                                                                <button
                                                                    className="btn-delete-line"
                                                                    onClick={() => eliminarDetalle(index)}
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="no-details">
                                                No hay detalles agregados. Haz clic en "Agregar Línea" para comenzar.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Summary */}
                        <div className="form-section">
                            <GlassCard>
                                <div className="invoice-summary">
                                    <FacturaResumen
                                        subtotal={calcularSubtotal()}
                                        descuento={calcularDescuentoTotal()}
                                        itbis={itbis}
                                        onItbisChange={setItbis}
                                    />
                                </div>
                            </GlassCard>
                        </div>

                        {/* Observations */}
                        <div className="form-section">
                            <GlassCard>
                                <div className="observations-section">
                                    <label>Observaciones</label>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        placeholder="Notas adicionales sobre la factura..."
                                        rows={3}
                                    />
                                </div>
                            </GlassCard>
                        </div>

                        {/* Action Buttons */}
                        <GlassCard>
                            <div className="invoice-actions">
                                <button className="btn-cancel" onClick={() => navigate('/facturas')}>
                                    <X size={18} />
                                    Ir a Facturas
                                </button>
                                <button className="btn-save" onClick={handleGuardar} disabled={loading}>
                                    <Save size={18} />
                                    {loading ? 'Guardando...' : (facturaId ? 'Actualizar Factura' : 'Guardar Factura')}
                                </button>
                            </div>
                        </GlassCard>
                    </>
                )}
            </div>
        </div>
    );
};

export default FacturasCrear;
