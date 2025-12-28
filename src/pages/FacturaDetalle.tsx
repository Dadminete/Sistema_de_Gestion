import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Calendar, User, DollarSign, AlertCircle, CheckCircle, XCircle, Pencil } from 'lucide-react';
import facturaService from '../services/facturaService';
import { formatearMoneda, formatearFecha, obtenerColorEstado, obtenerTextoEstado } from '../utils/facturaUtils';
import './FacturaDetalle.css';

interface DetalleFactura {
    id: string;
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
}

interface Pago {
    id: string;
    numeroPago: string;
    monto: number;
    descuento?: number;
    metodoPago: string;
    fechaPago: string;
    estado: string;
    observaciones?: string;
    recibidoPor?: {
        nombre: string;
        apellido: string;
    };
    cuentaBancaria?: {
        numeroCuenta: string;
        tipoCuenta: string;
        bank: {
            nombre: string;
        };
    };
    caja?: {
        nombre: string;
    };
}

interface Factura {
    id: string;
    numeroFactura: string;
    cliente: {
        nombre: string;
        apellidos: string;
        codigoCliente: string;
        telefono?: string;
        email?: string;
    };
    fechaFactura: string;
    fechaVencimiento: string;
    periodoFacturadoInicio?: string;
    periodoFacturadoFin?: string;
    subtotal: number;
    descuento: number;
    itbis: number;
    total: number;
    estado: string;
    formaPago?: string;
    observaciones?: string;
    detalles: DetalleFactura[];
    pagos: Pago[];
}

const FacturaDetalle: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [factura, setFactura] = useState<Factura | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
    const [pagoForm, setPagoForm] = useState({ monto: '', descuento: '', metodoPago: '', estado: '', observaciones: '' });

    useEffect(() => {
        if (id) {
            cargarFactura();
        }
    }, [id]);

    const cargarFactura = async () => {
        try {
            setLoading(true);
            const data = await facturaService.obtenerFacturaPorId(id!);
            setFactura(data);
            setEditingPagoId(null);
        } catch (error) {
            console.error('Error al cargar factura:', error);
            alert('Error al cargar la factura');
        } finally {
            setLoading(false);
        }
    };

    const startEditPago = (pago: Pago) => {
        setEditingPagoId(pago.id);
        setPagoForm({
            monto: pago.monto.toString(),
            descuento: pago.descuento?.toString() || '',
            metodoPago: pago.metodoPago,
            estado: pago.estado,
            observaciones: pago.observaciones || ''
        });
    };

    const savePago = async () => {
        if (!editingPagoId) return;
        try {
            await facturaService.actualizarPago(editingPagoId, {
                monto: pagoForm.monto ? parseFloat(pagoForm.monto) : undefined,
                descuento: pagoForm.descuento ? parseFloat(pagoForm.descuento) : undefined,
                metodoPago: pagoForm.metodoPago || undefined,
                estado: pagoForm.estado || undefined,
                observaciones: pagoForm.observaciones
            });
            await cargarFactura();
        } catch (error: any) {
            alert('Error al guardar pago: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleRevertirPago = async (pagoId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas REVERTIR este pago? Esto eliminará el registro del pago y reversará el movimiento contable asociado.')) {
            return;
        }

        try {
            setLoading(true);
            await facturaService.revertirPago(pagoId);
            alert('✅ Pago revertido exitosamente');
            await cargarFactura();
        } catch (error: any) {
            alert('Error al revertir pago: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pagada':
                return <CheckCircle size={24} strokeWidth={2.5} />;
            case 'pendiente':
                return <AlertCircle size={24} strokeWidth={2.5} />;
            case 'anulada':
                return <XCircle size={24} strokeWidth={2.5} />;
            default:
                return <FileText size={24} strokeWidth={2.5} />;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando factura...</div>;
    }

    if (!factura) {
        return <div className="p-8 text-center text-gray-500">Factura no encontrada</div>;
    }

    return (
        <div className="factura-detalle-page">
            <div className="header-section">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                    Volver
                </button>
                <div className="header-content">
                    <div className="header-left">
                        <FileText size={32} strokeWidth={2.5} />
                        <div>
                            <h1>Factura {factura.numeroFactura}</h1>
                            <p className="subtitle">Detalles completos de la factura</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => navigate(`/facturas/crear?id=${factura.id}`)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#f9fafb',
                                color: '#111827',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                            title="Editar factura"
                        >
                            <Pencil size={18} strokeWidth={2.5} />
                            Editar
                        </button>
                        <div className="estado-badge" style={{ backgroundColor: obtenerColorEstado(factura.estado) + '20', color: obtenerColorEstado(factura.estado) }}>
                            {getEstadoIcon(factura.estado)}
                            <span>{obtenerTextoEstado(factura.estado)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-grid">
                {/* Cliente Info */}
                <div className="info-card">
                    <div className="card-header">
                        <User size={20} strokeWidth={2.5} />
                        <h3>Información del Cliente</h3>
                    </div>
                    <div className="card-content">
                        <div className="info-row">
                            <label>Nombre:</label>
                            <span>{factura.cliente.nombre} {factura.cliente.apellidos}</span>
                        </div>
                        <div className="info-row">
                            <label>Código:</label>
                            <span>{factura.cliente.codigoCliente}</span>
                        </div>
                        {factura.cliente.telefono && (
                            <div className="info-row">
                                <label>Teléfono:</label>
                                <span>{factura.cliente.telefono}</span>
                            </div>
                        )}
                        {factura.cliente.email && (
                            <div className="info-row">
                                <label>Email:</label>
                                <span>{factura.cliente.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fechas */}
                <div className="info-card">
                    <div className="card-header">
                        <Calendar size={20} strokeWidth={2.5} />
                        <h3>Fechas</h3>
                    </div>
                    <div className="card-content">
                        <div className="info-row">
                            <label>Emisión:</label>
                            <span>{formatearFecha(factura.fechaFactura)}</span>
                        </div>
                        <div className="info-row">
                            <label>Vencimiento:</label>
                            <span>{formatearFecha(factura.fechaVencimiento)}</span>
                        </div>
                        {factura.periodoFacturadoInicio && factura.periodoFacturadoFin && (
                            <div className="info-row">
                                <label>Período:</label>
                                <span>{formatearFecha(factura.periodoFacturadoInicio)} - {formatearFecha(factura.periodoFacturadoFin)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detalles de Items */}
                <div className="detalles-card">
                    <div className="card-header">
                        <FileText size={20} strokeWidth={2.5} />
                        <h3>Detalles de Factura</h3>
                    </div>
                    <div className="table-container">
                        <table className="detalles-table">
                            <thead>
                                <tr>
                                    <th>Concepto</th>
                                    <th>Cant.</th>
                                    <th>P. Unit.</th>
                                    <th>Subtotal</th>
                                    <th>Desc.</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factura.detalles.map((detalle) => (
                                    <tr key={detalle.id}>
                                        <td>{detalle.concepto}</td>
                                        <td>{detalle.cantidad}</td>
                                        <td>{formatearMoneda(detalle.precioUnitario)}</td>
                                        <td>{formatearMoneda(detalle.subtotal)}</td>
                                        <td>{formatearMoneda(detalle.descuento)}</td>
                                        <td className="font-bold">{formatearMoneda(detalle.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="info-card resumen-card">
                    <div className="card-header">
                        <DollarSign size={20} strokeWidth={2.5} />
                        <h3>Resumen Financiero</h3>
                    </div>
                    <div className="card-content">
                        <div className="info-row">
                            <label>Subtotal:</label>
                            <span>{formatearMoneda(factura.subtotal)}</span>
                        </div>
                        <div className="info-row">
                            <label>Descuento:</label>
                            <span className="text-red">-{formatearMoneda(factura.descuento)}</span>
                        </div>
                        <div className="info-row">
                            <label>ITBIS (18%):</label>
                            <span>{formatearMoneda(factura.itbis)}</span>
                        </div>
                        <div className="info-row total-row">
                            <label>TOTAL:</label>
                            <span>{formatearMoneda(factura.total)}</span>
                        </div>
                        {factura.formaPago && (
                            <div className="info-row">
                                <label>Forma de Pago:</label>
                                <span className="badge">{factura.formaPago}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Información de Pagos */}
                {factura.pagos && factura.pagos.length > 0 && (
                    <div className="info-card pagos-card">
                        <div className="card-header">
                            <DollarSign size={20} strokeWidth={2.5} />
                            <h3>Información de Pagos</h3>
                        </div>
                        <div className="card-content">
                            {factura.pagos.map((pago, index) => (
                                <div key={pago.id} style={{
                                    marginBottom: index < factura.pagos.length - 1 ? '1rem' : '0',
                                    paddingBottom: index < factura.pagos.length - 1 ? '1rem' : '0',
                                    borderBottom: index < factura.pagos.length - 1 ? '1px solid #e5e7eb' : 'none'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="info-row" style={{ margin: 0, border: 'none', padding: 0 }}>
                                                <label>Número:</label>
                                                <span className="font-bold">{pago.numeroPago}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => startEditPago(pago)}
                                                    className="action-btn"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' }}
                                                    title="Editar pago"
                                                >
                                                    <Pencil size={18} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleRevertirPago(pago.id)}
                                                    className="action-btn"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                                                    title="Revertir este pago"
                                                >
                                                    <XCircle size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <label>Fecha:</label>
                                        <span>{formatearFecha(pago.fechaPago)}</span>
                                    </div>
                                    {editingPagoId === pago.id ? (
                                        <>
                                            <div className="info-row">
                                                <label>Monto:</label>
                                                <input type="number" step="0.01" value={pagoForm.monto} onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '200px' }} />
                                            </div>
                                            <div className="info-row">
                                                <label>Descuento:</label>
                                                <input type="number" step="0.01" value={pagoForm.descuento} onChange={(e) => setPagoForm({ ...pagoForm, descuento: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '200px' }} />
                                            </div>
                                            <div className="info-row">
                                                <label>Método:</label>
                                                <input type="text" value={pagoForm.metodoPago} onChange={(e) => setPagoForm({ ...pagoForm, metodoPago: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '200px' }} />
                                            </div>
                                            <div className="info-row">
                                                <label>Estado:</label>
                                                <select value={pagoForm.estado} onChange={(e) => setPagoForm({ ...pagoForm, estado: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '200px' }}>
                                                    <option value="confirmado">Confirmado</option>
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="anulado">Anulado</option>
                                                </select>
                                            </div>
                                            <div className="info-row">
                                                <label>Observaciones:</label>
                                                <textarea value={pagoForm.observaciones} onChange={(e) => setPagoForm({ ...pagoForm, observaciones: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100%', minHeight: '60px' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <button onClick={savePago} style={{ padding: '8px 16px', borderRadius: 6, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
                                                <button onClick={() => setEditingPagoId(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f3f4f6', cursor: 'pointer' }}>Cancelar</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="info-row">
                                                <label>Monto Pagado:</label>
                                                <span className="font-bold" style={{ color: '#059669' }}>{formatearMoneda(pago.monto)}</span>
                                            </div>
                                            {pago.descuento && pago.descuento > 0 && (
                                                <div className="info-row">
                                                    <label>Descuento Administrativo:</label>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: '#dc2626',
                                                        backgroundColor: '#fee2e2',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {formatearMoneda(pago.descuento)}
                                                    </span>
                                                </div>
                                            )}
                                            {pago.descuento && pago.descuento > 0 && (
                                                <div className="info-row">
                                                    <label>Total Abonado a Factura:</label>
                                                    <span className="font-bold" style={{
                                                        color: '#059669',
                                                        fontSize: '1.125rem'
                                                    }}>
                                                        {formatearMoneda(pago.monto + pago.descuento)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="info-row">
                                                <label>Método:</label>
                                                <span style={{
                                                    textTransform: 'capitalize',
                                                    backgroundColor: '#dbeafe',
                                                    color: '#1e40af',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>
                                                    {pago.metodoPago}
                                                </span>
                                            </div>
                                            {pago.recibidoPor && (
                                                <div className="info-row">
                                                    <label>Recibido por:</label>
                                                    <span>{pago.recibidoPor.nombre} {pago.recibidoPor.apellido}</span>
                                                </div>
                                            )}
                                            {pago.cuentaBancaria && (
                                                <>
                                                    <div className="info-row">
                                                        <label>Banco:</label>
                                                        <span>{pago.cuentaBancaria.bank.nombre}</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <label>Cuenta:</label>
                                                        <span>{pago.cuentaBancaria.numeroCuenta} ({pago.cuentaBancaria.tipoCuenta})</span>
                                                    </div>
                                                </>
                                            )}
                                            {pago.caja && (
                                                <div className="info-row">
                                                    <label>Caja:</label>
                                                    <span>{pago.caja.nombre}</span>
                                                </div>
                                            )}
                                            <div className="info-row">
                                                <label>Estado:</label>
                                                <span style={{
                                                    backgroundColor: pago.estado === 'confirmado' ? '#d1fae5' : '#fee2e2',
                                                    color: pago.estado === 'confirmado' ? '#059669' : '#dc2626',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>
                                                    {pago.estado === 'confirmado' ? 'Confirmado' : pago.estado}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {pago.observaciones && (
                                        <div className="info-row">
                                            <label>Observaciones:</label>
                                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{pago.observaciones}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Observaciones */}
                {factura.observaciones && (
                    <div className="info-card observaciones-card">
                        <div className="card-header">
                            <AlertCircle size={20} strokeWidth={2.5} />
                            <h3>Observaciones</h3>
                        </div>
                        <div className="card-content">
                            <p>{factura.observaciones}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacturaDetalle;
