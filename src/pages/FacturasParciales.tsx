import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/ui/DataTable';
import facturaService from '../services/facturaService';
import { formatearMoneda, obtenerColorEstado, obtenerTextoEstado } from '../utils/facturaUtils';
import './FacturasParciales.css';

interface Pago {
    metodoPago: string;
    fechaPago: string;
    monto: number;
    cuentaBancaria?: {
        numeroCuenta: string;
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
    };
    fechaFactura: string;
    fechaVencimiento: string;
    total: number;
    estado: string;
    pagos: Pago[];
}

const FacturasParciales: React.FC = () => {
    const navigate = useNavigate();
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarFacturas();
    }, []);

    const cargarFacturas = async () => {
        try {
            setLoading(true);
            const data = await facturaService.obtenerFacturas({ estado: 'parcial', limit: 100 });
            setFacturas(data.facturas || []);
        } catch (error) {
            console.error('Error al cargar facturas parciales:', error);
        } finally {
            setLoading(false);
        }
    };

    const calcularMontoPagado = (factura: Factura): number => {
        if (!factura.pagos || factura.pagos.length === 0) return 0;
        return factura.pagos.reduce((total, pago) => total + Number(pago.monto), 0);
    };

    const calcularMontoPendiente = (factura: Factura): number => {
        const montoPagado = calcularMontoPagado(factura);
        return Math.max(0, factura.total - montoPagado);
    };

    const calcularPorcentajePagado = (factura: Factura): number => {
        const montoPagado = calcularMontoPagado(factura);
        return Math.round((montoPagado / factura.total) * 100);
    };

    const obtenerMetodoPago = (factura: Factura): string => {
        if (!factura.pagos || factura.pagos.length === 0) return 'N/A';

        const metodosUnicos = new Set<string>();
        factura.pagos.forEach(pago => {
            let metodo = '';
            switch (pago.metodoPago) {
                case 'efectivo':
                    metodo = 'Efectivo';
                    break;
                case 'transferencia':
                    metodo = pago.cuentaBancaria
                        ? `Transferencia (${pago.cuentaBancaria.bank.nombre})`
                        : 'Transferencia';
                    break;
                case 'cheque':
                    metodo = 'Cheque';
                    break;
                case 'tarjeta':
                    metodo = 'Tarjeta';
                    break;
                case 'caja':
                    metodo = pago.caja ? `Caja (${pago.caja.nombre})` : 'Caja';
                    break;
                default:
                    metodo = pago.metodoPago;
            }
            metodosUnicos.add(metodo);
        });

        return Array.from(metodosUnicos).join(', ');
    };

    const obtenerUltimaFechaPago = (factura: Factura): string => {
        if (!factura.pagos || factura.pagos.length === 0) return 'N/A';

        // Obtener la fecha de pago más reciente
        const fechasMasRecientes = factura.pagos
            .map(pago => new Date(pago.fechaPago))
            .sort((a, b) => b.getTime() - a.getTime());

        return fechasMasRecientes[0].toLocaleDateString('es-DO');
    };

    const agregarPago = async (factura: Factura) => {
        try {
            const montoPendiente = calcularMontoPendiente(factura);

            const montoInput = prompt(
                `Agregar pago a la factura ${factura.numeroFactura}\n\n` +
                `Cliente: ${factura.cliente.nombre} ${factura.cliente.apellidos}\n` +
                `Monto pendiente: ${formatearMoneda(montoPendiente)}\n\n` +
                `Ingrese el monto a pagar:`
            );

            if (!montoInput) return;

            const monto = parseFloat(montoInput.replace(/[^0-9.]/g, ''));

            if (isNaN(monto) || monto <= 0) {
                alert('Por favor ingrese un monto válido.');
                return;
            }

            if (monto > montoPendiente) {
                alert(`El monto no puede ser mayor al monto pendiente (${formatearMoneda(montoPendiente)}).`);
                return;
            }

            // Preguntar por descuento
            const descuentoInput = prompt(
                `Ingrese el monto de descuento (opcional):\n\nMonto a pagar: ${formatearMoneda(monto)}\n\nDeje en blanco si no hay descuento:`,
                '0'
            );

            if (!descuentoInput) return;

            const descuento = parseFloat(descuentoInput.replace(/[^0-9.]/g, '') || '0');

            if (isNaN(descuento) || descuento < 0) {
                alert('Por favor ingrese un descuento válido.');
                return;
            }

            const confirmacion = window.confirm(
                `¿Confirma el pago de ${formatearMoneda(monto)} para la factura ${factura.numeroFactura}?\n\n` +
                `Descuento: ${descuento > 0 ? formatearMoneda(descuento) : 'Sin descuento'}\n\n` +
                `Se registrará como pago en efectivo.`
            );

            if (!confirmacion) return;

            await facturaService.pagarFactura(factura.id, {
                monto: monto,
                metodoPago: 'efectivo',
                observaciones: descuento > 0 ? `Pago parcial con descuento de ${formatearMoneda(descuento)}` : 'Pago parcial adicional desde facturas parciales'
            });

            // Recargar las facturas para reflejar el cambio
            await cargarFacturas();

            const nuevoMontoPendiente = montoPendiente - monto;

            if (nuevoMontoPendiente > 0) {
                alert(`¡Pago registrado exitosamente!\n\nMonto pagado: ${formatearMoneda(monto)}\nDescuento aplicado: ${descuento > 0 ? formatearMoneda(descuento) : 'RD$0.00'}\nMonto pendiente: ${formatearMoneda(nuevoMontoPendiente)}`);
            } else {
                alert(`¡Factura pagada completamente!\n\nLa factura ${factura.numeroFactura} ha sido marcada como pagada.`);
            }

        } catch (error) {
            console.error('Error al agregar pago:', error);
            alert('Error al procesar el pago. Por favor intente nuevamente.');
        }
    };

    const completarPago = async (factura: Factura) => {
        try {
            const montoPendiente = calcularMontoPendiente(factura);

            // Preguntar por descuento
            const descuentoInput = prompt(
                `Ingrese el monto de descuento (opcional):\n\nMonto pendiente: ${formatearMoneda(montoPendiente)}\n\nDeje en blanco si no hay descuento:`,
                '0'
            );

            if (descuentoInput === null) return; // Usuario canceló

            const descuento = parseFloat(descuentoInput.replace(/[^0-9.]/g, '') || '0');

            if (isNaN(descuento) || descuento < 0) {
                alert('Por favor ingrese un descuento válido.');
                return;
            }

            if (descuento > montoPendiente) {
                alert(`El descuento no puede ser mayor al monto pendiente (${formatearMoneda(montoPendiente)}).`);
                return;
            }

            const confirmacion = window.confirm(
                `¿Confirma que desea completar el pago total de la factura ${factura.numeroFactura}?\n\n` +
                `Monto pendiente: ${formatearMoneda(montoPendiente)}\n` +
                `Descuento: ${descuento > 0 ? formatearMoneda(descuento) : 'Sin descuento'}\n` +
                `Cliente: ${factura.cliente.nombre} ${factura.cliente.apellidos}\n\n` +
                `Se registrará como pago en efectivo y la factura quedará totalmente pagada.`
            );

            if (!confirmacion) return;

            await facturaService.pagarFactura(factura.id, {
                monto: montoPendiente,
                metodoPago: 'efectivo',
                observaciones: descuento > 0 ? `Pago completado con descuento de ${formatearMoneda(descuento)}` : 'Pago completado desde facturas parciales'
            });

            // Recargar las facturas para reflejar el cambio
            await cargarFacturas();

            alert(`¡Pago completado exitosamente!\n\nLa factura ${factura.numeroFactura} ha sido marcada como pagada.`);

        } catch (error) {
            console.error('Error al completar pago:', error);
            alert('Error al completar el pago. Por favor intente nuevamente.');
        }
    };

    const columns = useMemo<ColumnDef<Factura>[]>(
        () => [
            {
                accessorKey: 'numeroFactura',
                header: 'Número',
                cell: (info) => <span className="partial-invoice-number">{info.getValue() as string}</span>,
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
                accessorKey: 'fechaVencimiento',
                header: 'Vencimiento',
                cell: (info) => {
                    const fecha = new Date(info.getValue() as string);
                    const hoy = new Date();
                    const esVencida = fecha < hoy;
                    return (
                        <span className={esVencida ? 'overdue-date' : 'due-date'}>
                            {fecha.toLocaleDateString('es-DO')}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'total',
                header: 'Total',
                cell: (info) => <span className="amount-cell">{formatearMoneda(info.getValue() as number)}</span>,
            },
            {
                id: 'montoPagado',
                header: 'Pagado',
                cell: (info) => {
                    const montoPagado = calcularMontoPagado(info.row.original);
                    return <span className="paid-amount">{formatearMoneda(montoPagado)}</span>;
                },
            },
            {
                id: 'montoPendiente',
                header: 'Pendiente',
                cell: (info) => {
                    const montoPendiente = calcularMontoPendiente(info.row.original);
                    return <span className="pending-amount">{formatearMoneda(montoPendiente)}</span>;
                },
            },
            {
                id: 'porcentaje',
                header: 'Progreso',
                cell: (info) => {
                    const porcentaje = calcularPorcentajePagado(info.row.original);
                    return (
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${porcentaje}%` }}
                                ></div>
                            </div>
                            <span className="progress-text">{porcentaje}%</span>
                        </div>
                    );
                },
            },
            {
                id: 'ultimaFechaPago',
                header: 'Último Pago',
                cell: (info) => (
                    <span className="last-payment-date">
                        {obtenerUltimaFechaPago(info.row.original)}
                    </span>
                ),
            },
            {
                id: 'metodoPago',
                header: 'Métodos',
                cell: (info) => (
                    <span className="payment-methods">
                        {obtenerMetodoPago(info.row.original)}
                    </span>
                ),
            },
            {
                accessorKey: 'estado',
                header: 'Estado',
                cell: (info) => {
                    const estado = info.getValue() as string;
                    return (
                        <span className="status-badge-partial">
                            {obtenerTextoEstado(estado)}
                        </span>
                    );
                },
            },
            {
                id: 'acciones',
                header: 'Acciones',
                cell: (info) => (
                    <div className="table-actions">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/facturas/${info.row.original.id}`);
                            }}
                            title="Ver detalle"
                            className="action-btn view-btn"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/facturas/crear?id=${info.row.original.id}`);
                            }}
                            title="Editar factura"
                            className="action-btn edit-btn"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                agregarPago(info.row.original);
                            }}
                            title="Agregar Pago Parcial"
                            className="action-btn partial-pay-btn"
                        >
                            <DollarSign size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                completarPago(info.row.original);
                            }}
                            title="Completar Pago Total"
                            className="action-btn complete-btn"
                        >
                            <CheckCircle size={16} />
                        </button>
                    </div>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    if (loading) {
        return (
            <div className="facturas-parciales-page">
                <div className="loading-container">
                    <AlertCircle />
                    <p>Cargando facturas con pagos parciales...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="facturas-parciales-page">
            <div className="glass-header">
                <div className="header-content">
                    <AlertCircle className="header-icon" />
                    <div className="header-text">
                        <h1 className="header-title">Facturas con Pagos Parciales</h1>
                        <p className="header-subtitle">
                            Facturas que han recibido pagos parciales y aún tienen saldo pendiente
                        </p>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <DataTable
                    columns={columns}
                    data={facturas}
                    onRowClick={() => { }}
                />
            </div>
        </div>
    );
};

export default FacturasParciales;