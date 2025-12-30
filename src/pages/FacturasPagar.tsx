import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DollarSign, CreditCard, Save, X } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import FormaPagoSelector from '../components/FormaPagoSelector';
import facturaService from '../services/facturaService';
import { formatearMoneda, obtenerColorEstado, obtenerTextoEstado } from '../utils/facturaUtils';
import Swal from 'sweetalert2';

interface Factura {
    id: string;
    numeroFactura: string;
    cliente: {
        nombre: string;
        apellidos: string;
        codigoCliente: string;
    };
    fechaFactura: string;
    fechaVencimiento: string;
    total: number;
    estado: string;
    cuentasPorCobrar: any[];
}

const FacturasPagar: React.FC = () => {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);

    // Form state
    const [montoPagar, setMontoPagar] = useState(0);
    const [descuento, setDescuento] = useState(0);
    const [formaPago, setFormaPago] = useState('efectivo');
    const [cuentaBancariaId, setCuentaBancariaId] = useState<string>();
    const [cajaId, setCajaId] = useState<string>();
    const [observaciones, setObservaciones] = useState('');
    const [procesandoPago, setProcesandoPago] = useState(false);

    useEffect(() => {
        cargarFacturas();
    }, []);

    const cargarFacturas = async () => {
        try {
            setLoading(true);
            // Obtener facturas pendientes o parciales
            const data = await facturaService.obtenerFacturas({ estado: 'pendiente', limit: 100 });
            // También podríamos querer incluir 'parcial' si la API lo soportara explícitamente en el filtro, 
            // pero por ahora 'pendiente' suele incluir las que tienen saldo pendiente.
            setFacturas(data.facturas || []);
        } catch (error) {
            console.error('Error al cargar facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModalPago = (factura: Factura) => {
        setFacturaSeleccionada(factura);

        // Calcular monto pendiente
        // Si hay cuentas por cobrar, usar el monto pendiente de la primera (asumiendo 1 a 1 por ahora)
        let pendiente = factura.total;
        if (factura.cuentasPorCobrar && factura.cuentasPorCobrar.length > 0) {
            pendiente = parseFloat(factura.cuentasPorCobrar[0].montoPendiente);
        }

        setMontoPagar(pendiente);
        setDescuento(0);
        setFormaPago('efectivo');
        setCuentaBancariaId(undefined);
        setCajaId(undefined);
        setObservaciones('');
        setModalOpen(true);
    };

    const handlePagoSubmit = async () => {
        if (!facturaSeleccionada) return;

        if (montoPagar <= 0) {
            Swal.fire('Error', 'El monto a pagar debe ser mayor a 0', 'error');
            return;
        }

        if (descuento < 0) {
            Swal.fire('Error', 'El descuento no puede ser negativo', 'error');
            return;
        }

        if (descuento > montoPagar) {
            Swal.fire('Error', 'El descuento no puede ser mayor al monto a pagar', 'error');
            return;
        }

        if (!formaPago) {
            Swal.fire('Error', 'Debe seleccionar una forma de pago', 'error');
            return;
        }

        try {
            setProcesandoPago(true);
            await facturaService.pagarFactura(facturaSeleccionada.id, {
                monto: montoPagar,
                metodoPago: formaPago,
                cuentaBancariaId,
                cajaId,
                observaciones: descuento > 0
                    ? `${observaciones ? observaciones + ' - ' : ''}Descuento aplicado: ${formatearMoneda(descuento)}`
                    : observaciones
            });

            setModalOpen(false);
            Swal.fire('Éxito', 'Pago registrado correctamente', 'success');
            cargarFacturas();
        } catch (error: any) {
            console.error('Error al registrar pago:', error);
            Swal.fire('Error', error.response?.data?.error || error.message || 'Error al registrar pago', 'error');
        } finally {
            setProcesandoPago(false);
        }
    };

    const columns = useMemo<ColumnDef<Factura>[]>(
        () => [
            {
                accessorKey: 'numeroFactura',
                header: 'Número',
                cell: (info) => <span className="font-medium text-blue-600">{info.getValue() as string}</span>,
            },
            {
                accessorFn: (row) => `${row.cliente.nombre} ${row.cliente.apellidos}`,
                header: 'Cliente',
            },
            {
                accessorKey: 'fechaFactura',
                header: 'Emisión',
                cell: (info) => new Date(info.getValue() as string).toLocaleDateString('es-DO'),
            },
            {
                accessorKey: 'total',
                header: 'Total',
                cell: (info) => <span className="font-bold">{formatearMoneda(info.getValue() as number)}</span>,
            },
            {
                id: 'pendiente',
                header: 'Pendiente',
                cell: (info) => {
                    const factura = info.row.original;
                    let pendiente = factura.total;
                    if (factura.cuentasPorCobrar && factura.cuentasPorCobrar.length > 0) {
                        pendiente = parseFloat(factura.cuentasPorCobrar[0].montoPendiente);
                    }
                    return <span className="font-bold text-red-600">{formatearMoneda(pendiente)}</span>;
                }
            },
            {
                accessorKey: 'estado',
                header: 'Estado',
                cell: (info) => {
                    const estado = info.getValue() as string;
                    return (
                        <span
                            style={{
                                backgroundColor: obtenerColorEstado(estado) + '20',
                                color: obtenerColorEstado(estado),
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600
                            }}
                        >
                            {obtenerTextoEstado(estado)}
                        </span>
                    );
                },
            },
            {
                id: 'acciones',
                header: 'Acciones',
                cell: (info) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            abrirModalPago(info.row.original);
                        }}
                        className="btn-pagar-action"
                        title="Pagar"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        <DollarSign size={16} />
                        Pagar
                    </button>
                ),
            },
        ],
        []
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando facturas por pagar...</div>;
    }

    return (
        <div className="facturas-pagar-page" style={{ padding: '20px' }}>
            <div className="header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                    backgroundColor: '#d1fae5',
                    padding: '10px',
                    borderRadius: '10px',
                    color: '#059669'
                }}>
                    <CreditCard size={24} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>Pagar Facturas</h1>
                    <p style={{ margin: 0, color: '#6b7280' }}>Registrar pagos de facturas pendientes</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={facturas}
                />
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={`Registrar Pago - ${facturaSeleccionada?.numeroFactura}`}
                size="medium"
            >
                <div className="pago-form">
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Monto a Pagar</label>
                        <input
                            type="number"
                            value={montoPagar}
                            onChange={(e) => setMontoPagar(parseFloat(e.target.value) || 0)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#dc2626' }}>
                            Descuento (Opcional)
                        </label>
                        <input
                            type="number"
                            value={descuento}
                            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                            min="0"
                            max={montoPagar}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                backgroundColor: descuento > 0 ? '#fef2f2' : 'white'
                            }}
                            placeholder="0.00"
                        />
                        {descuento > 0 && (
                            <p style={{
                                marginTop: '5px',
                                fontSize: '14px',
                                color: '#059669',
                                fontWeight: 600
                            }}>
                                Monto efectivo a pagar: {formatearMoneda(montoPagar - descuento)}
                            </p>
                        )}
                    </div>

                    <FormaPagoSelector
                        formaPago={formaPago}
                        cuentaId={cuentaBancariaId}
                        onChange={(tipo, cuenta, caja) => {
                            setFormaPago(tipo);
                            setCuentaBancariaId(cuenta);
                            setCajaId(caja);
                        }}
                    />

                    <div className="form-group" style={{ marginTop: '15px', marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Observaciones</label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontFamily: 'inherit'
                            }}
                            placeholder="Notas sobre el pago..."
                        />
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            onClick={() => setModalOpen(false)}
                            style={{
                                padding: '10px 20px',
                                border: '1px solid #e5e7eb',
                                background: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <X size={18} /> Cancelar
                        </button>
                        <button
                            onClick={handlePagoSubmit}
                            disabled={procesandoPago}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                background: '#10b981',
                                color: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                opacity: procesandoPago ? 0.7 : 1
                            }}
                        >
                            <Save size={18} /> {procesandoPago ? 'Procesando...' : 'Registrar Pago'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FacturasPagar;
