import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, DollarSign, AlertCircle, Edit, Trash2, XCircle, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/ui/DataTable';
import facturaService from '../services/facturaService';
import { formatearMoneda, obtenerColorEstado, obtenerTextoEstado } from '../utils/facturaUtils';
import Modal from '../components/ui/Modal';
import './FacturasPendientes.css';

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
}

const FacturasPendientes: React.FC = () => {
    const navigate = useNavigate();
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);
    const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
    const [modalAnularOpen, setModalAnularOpen] = useState(false);
    const [facturaAAnular, setFacturaAAnular] = useState<string | null>(null);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        cargarFacturas();
    }, []);

    const cargarFacturas = async () => {
        try {
            setLoading(true);
            const data = await facturaService.obtenerFacturas({ estado: 'pendiente', limit: 100 });
            setFacturas(data.facturas || []);
            setSeleccionadas([]);
        } catch (error) {
            console.error('Error al cargar facturas pendientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSeleccion = (id: string) => {
        setSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSeleccionarTodo = () => {
        if (seleccionadas.length === facturas.length) {
            setSeleccionadas([]);
        } else {
            setSeleccionadas(facturas.map(f => f.id));
        }
    };

    const handleEliminarMasivo = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar ${seleccionadas.length} facturas? Esta acción no se puede deshacer.`)) return;

        try {
            setLoadingAction(true);
            await facturaService.eliminarFacturas(seleccionadas);
            await cargarFacturas();
            alert('Facturas eliminadas correctamente');
        } catch (error: any) {
            console.error('Error al eliminar facturas:', error);
            alert('Error al eliminar: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoadingAction(false);
        }
    };

    const handleEliminarIndividual = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta factura?')) return;

        try {
            setLoadingAction(true);
            await facturaService.eliminarFactura(id);
            await cargarFacturas();
        } catch (error: any) {
            console.error('Error al eliminar factura:', error);
            alert('Error al eliminar: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoadingAction(false);
        }
    };

    const abrirModalAnular = (id: string) => {
        setFacturaAAnular(id);
        setMotivoAnulacion('');
        setModalAnularOpen(true);
    };

    const handleAnular = async () => {
        if (!facturaAAnular || !motivoAnulacion.trim()) {
            alert('Debe ingresar un motivo para la anulación');
            return;
        }

        try {
            setLoadingAction(true);
            await facturaService.anularFactura(facturaAAnular, motivoAnulacion);
            setModalAnularOpen(false);
            await cargarFacturas();
            alert('Factura anulada correctamente');
        } catch (error: any) {
            console.error('Error al anular factura:', error);
            alert('Error al anular: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoadingAction(false);
        }
    };

    const columns = useMemo<ColumnDef<Factura>[]>(
        () => [
            {
                id: 'select',
                header: () => (
                    <button
                        onClick={toggleSeleccionarTodo}
                        className="select-column-header"
                        style={{ color: facturas.length > 0 && seleccionadas.length === facturas.length ? '#3b82f6' : '#64748b' }}
                    >
                        {facturas.length > 0 && seleccionadas.length === facturas.length ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                ),
                cell: (info) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSeleccion(info.row.original.id);
                        }}
                        className="select-column-header"
                        style={{ color: seleccionadas.includes(info.row.original.id) ? '#3b82f6' : '#64748b' }}
                    >
                        {seleccionadas.includes(info.row.original.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                ),
            },
            {
                accessorKey: 'numeroFactura',
                header: 'Número',
                cell: (info) => <span className="pending-invoice-number">{info.getValue() as string}</span>,
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
                    const vencida = fecha < hoy;
                    return (
                        <span className={vencida ? 'overdue-date' : ''}>
                            {fecha.toLocaleDateString('es-DO')}
                            {vencida && <span>⚠️</span>}
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
                accessorKey: 'estado',
                header: 'Estado',
                cell: (info) => {
                    const estado = info.getValue() as string;
                    return (
                        <span className="status-badge-pending">
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
                            <Eye size={18} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/facturas/crear?id=${info.row.original.id}`);
                            }}
                            title="Editar factura"
                            className="action-btn edit-btn"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/facturas/pagar');
                            }}
                            title="Registrar Pago"
                            className="action-btn reactivate-btn"
                        >
                            <DollarSign size={18} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                abrirModalAnular(info.row.original.id);
                            }}
                            title="Anular Factura"
                            className="action-btn suspend-btn"
                        >
                            <XCircle size={18} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarIndividual(info.row.original.id);
                            }}
                            title="Eliminar Factura"
                            className="action-btn delete-btn"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ),
            },
        ],
        [facturas, seleccionadas]
    );

    if (loading) {
        return (
            <div className="facturas-pendientes-page">
                <div className="loading-container">
                    <AlertCircle />
                    <p>Cargando facturas pendientes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="facturas-pendientes-page">
            <div className="glass-header">
                <div className="header-content">
                    <AlertCircle className="header-icon" />
                    <div className="header-text">
                        <h1 className="header-title">Facturas Pendientes</h1>
                        <p className="header-subtitle">
                            Gestiona las facturas que están pendientes de pago
                        </p>
                    </div>
                </div>
            </div>

            {seleccionadas.length > 0 && (
                <div className="bulk-actions-bar">
                    <span className="selection-count">
                        {seleccionadas.length} factura{seleccionadas.length !== 1 ? 's' : ''} seleccionada{seleccionadas.length !== 1 ? 's' : ''}
                    </span>
                    <div className="bulk-actions">
                        <button
                            onClick={handleEliminarMasivo}
                            disabled={loadingAction}
                            className="bulk-action-btn danger"
                        >
                            <Trash2 size={16} />
                            Eliminar ({seleccionadas.length})
                        </button>
                    </div>
                </div>
            )}

            <div className="table-container">
                <DataTable
                    columns={columns}
                    data={facturas}
                    onRowClick={() => { }}
                />
            </div>

            <Modal
                isOpen={modalAnularOpen}
                onClose={() => setModalAnularOpen(false)}
                title="Anular Factura"
            >
                <div className="modal-content">
                    <p className="modal-description">
                        Por favor, ingrese el motivo de la anulación. Esta acción no se puede deshacer.
                    </p>
                    <textarea
                        value={motivoAnulacion}
                        onChange={(e) => setMotivoAnulacion(e.target.value)}
                        className="modal-textarea"
                        rows={4}
                        placeholder="Motivo de anulación..."
                    />
                    <div className="modal-actions">
                        <button
                            onClick={() => setModalAnularOpen(false)}
                            className="modal-btn secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAnular}
                            disabled={loadingAction || !motivoAnulacion.trim()}
                            className="modal-btn danger"
                        >
                            {loadingAction ? 'Anulando...' : 'Confirmar Anulación'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FacturasPendientes;
