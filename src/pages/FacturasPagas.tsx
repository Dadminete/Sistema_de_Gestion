import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, CheckCircle, Printer, Edit, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import DataTable from '../components/ui/DataTable';
import facturaService from '../services/facturaService';
import { formatearMoneda, obtenerColorEstado, obtenerTextoEstado } from '../utils/facturaUtils';
import './FacturasPagas.css';

interface Pago {
    id: string;
    metodoPago: string;
    fechaPago: string;
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

const FacturasPagas: React.FC = () => {
    const navigate = useNavigate();
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarFacturas();
    }, []);

    const cargarFacturas = async () => {
        try {
            setLoading(true);
            const data = await facturaService.obtenerFacturas({ estado: 'pagada', limit: 100 });
            setFacturas(data.facturas || []);
        } catch (error) {
            console.error('Error al cargar facturas pagadas:', error);
        } finally {
            setLoading(false);
        }
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

    const obtenerFechaPago = (factura: Factura): string => {
        if (!factura.pagos || factura.pagos.length === 0) return 'N/A';
        
        // Obtener la fecha de pago más reciente
        const fechasMasRecientes = factura.pagos
            .map(pago => new Date(pago.fechaPago))
            .sort((a, b) => b.getTime() - a.getTime());
        
        return fechasMasRecientes[0].toLocaleDateString('es-DO');
    };

    const handleRevertirPago = async (factura: Factura) => {
        if (!factura.pagos || factura.pagos.length === 0) {
            Swal.fire('Error', 'Esta factura no tiene pagos registrados', 'error');
            return;
        }

        const result = await Swal.fire({
            title: '¿Revertir pago?',
            html: `¿Estás seguro de que deseas revertir el pago de la factura <strong>${factura.numeroFactura}</strong>?<br><br>Esta acción cambiará el estado de la factura a <strong>pendiente</strong>.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, revertir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // Revertir el último pago (el más reciente)
                const ultimoPago = factura.pagos[factura.pagos.length - 1];
                await facturaService.revertirPago(ultimoPago.id);
                
                Swal.fire({
                    title: '¡Revertido!',
                    text: 'El pago ha sido revertido exitosamente',
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
                
                cargarFacturas(); // Recargar la lista
            } catch (error: any) {
                console.error('Error al revertir pago:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'No se pudo revertir el pago',
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const columns = useMemo<ColumnDef<Factura>[]>(
        () => [
            {
                accessorKey: 'numeroFactura',
                header: 'Número',
                cell: (info) => <span className="paid-invoice-number">{info.getValue() as string}</span>,
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
                cell: (info) => <span className="amount-cell">{formatearMoneda(info.getValue() as number)}</span>,
            },
            {
                id: 'metodoPago',
                header: 'Método de Pago',
                cell: (info) => (
                    <span className="payment-method">
                        {obtenerMetodoPago(info.row.original)}
                    </span>
                ),
            },
            {
                id: 'fechaPago',
                header: 'Fecha de Pago',
                cell: (info) => (
                    <span className="payment-date">
                        {obtenerFechaPago(info.row.original)}
                    </span>
                ),
            },
            {
                accessorKey: 'estado',
                header: 'Estado',
                cell: (info) => {
                    const estado = info.getValue() as string;
                    return (
                        <span className="status-badge-paid">
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
                                handleRevertirPago(info.row.original);
                            }}
                            title="Revertir pago (cambiar a pendiente)"
                            className="action-btn revert-btn"
                        >
                            <XCircle size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement print receipt functionality
                                alert('Funcionalidad de impresión en desarrollo');
                            }}
                            title="Imprimir Recibo"
                            className="action-btn print-btn"
                        >
                            <Printer size={16} />
                        </button>
                    </div>
                ),
            },
        ],
        []
    );

    if (loading) {
        return (
            <div className="facturas-pagas-page">
                <div className="loading-container">
                    <CheckCircle />
                    <p>Cargando facturas pagadas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="facturas-pagas-page">
            <div className="glass-header">
                <div className="header-content">
                    <CheckCircle className="header-icon" />
                    <div className="header-text">
                        <h1 className="header-title">Facturas Pagadas</h1>
                        <p className="header-subtitle">
                            Historial de facturas cobradas exitosamente
                        </p>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <DataTable
                    columns={columns}
                    data={facturas}
                    onRowClick={() => { }}
                    noDataMessage="No hay facturas pagadas"
                />
            </div>
        </div>
    );
};

export default FacturasPagas;
