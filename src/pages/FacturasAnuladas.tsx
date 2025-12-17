import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, XCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/ui/DataTable';
import facturaService from '../services/facturaService';
import { formatearMoneda, obtenerColorEstado, obtenerTextoEstado } from '../utils/facturaUtils';
import './FacturasAnuladas.css';

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

const FacturasAnuladas: React.FC = () => {
    const navigate = useNavigate();
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        cargarFacturas();
    }, []);

    const cargarFacturas = async () => {
        try {
            setLoading(true);
            const data = await facturaService.obtenerFacturas({ estado: 'anulada', limit: 100 });
            setFacturas(data.facturas || []);
        } catch (error) {
            console.error('Error al cargar facturas anuladas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReactivar = async (id: string) => {
        if (!window.confirm('¿Está seguro de reactivar esta factura? Volverá al estado pendiente.')) return;

        try {
            setLoadingAction(true);
            await facturaService.reactivarFactura(id);
            await cargarFacturas();
            alert('Factura reactivada correctamente');
        } catch (error: any) {
            console.error('Error al reactivar factura:', error);
            alert('Error al reactivar: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoadingAction(false);
        }
    };

    const columns = useMemo<ColumnDef<Factura>[]>(
        () => [
            {
                accessorKey: 'numeroFactura',
                header: 'Número',
                cell: (info) => <span className="cancelled-item">{info.getValue() as string}</span>,
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
                cell: (info) => <span className="cancelled-amount">{formatearMoneda(info.getValue() as number)}</span>,
            },
            {
                accessorKey: 'estado',
                header: 'Estado',
                cell: (info) => {
                    const estado = info.getValue() as string;
                    return (
                        <span className="status-badge-cancelled">
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
                                handleReactivar(info.row.original.id);
                            }}
                            title="Reactivar Factura"
                            className="action-btn reactivate-btn"
                            disabled={loadingAction}
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                ),
            },
        ],
        [loadingAction]
    );

    if (loading) {
        return (
            <div className="facturas-anuladas-page">
                <div className="loading-container">
                    <XCircle />
                    <p>Cargando facturas anuladas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="facturas-anuladas-page">
            <div className="facturas-anuladas-header">
                <div className="header-icon">
                    <XCircle size={24} />
                </div>
                <div className="header-content">
                    <h1>Facturas Anuladas</h1>
                    <p>Historial de facturas canceladas</p>
                </div>
            </div>

            <div className="facturas-table-container">
                <DataTable
                    columns={columns}
                    data={facturas}
                    onRowClick={() => { }}
                />
            </div>
        </div>
    );
};

export default FacturasAnuladas;
