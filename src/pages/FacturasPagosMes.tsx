import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronUp, Search } from 'lucide-react';
import facturaService from '../services/facturaService';
import { formatearMoneda } from '../utils/facturaUtils';

interface Pago {
    id: string;
    numeroPago: string;
    fechaPago: string;
    monto: number;
    metodoPago: string;
    factura: {
        id?: string;
        numeroFactura: string;
    };
    cliente: {
        nombre: string;
        apellidos: string;
    };
}

interface MesPagos {
    mes: number;
    nombreMes: string;
    pagos: Pago[];
    total: number;
}

const FacturasPagosMes: React.FC = () => {
    const navigate = useNavigate();
    const [pagosPorMes, setPagosPorMes] = useState<MesPagos[]>([]);
    const [loading, setLoading] = useState(true);
    const [año, setAño] = useState(new Date().getFullYear());
    const [mesExpandido, setMesExpandido] = useState<number | null>(new Date().getMonth() + 1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        cargarPagos();
    }, [año]);

    const cargarPagos = async () => {
        try {
            setLoading(true);
            const data = await facturaService.obtenerPagosPorMes(año);
            
            // Ordenar los pagos dentro de cada mes alfabéticamente por nombre del cliente
            const dataOrdenada = data.map((mesData: MesPagos) => ({
                ...mesData,
                pagos: [...mesData.pagos].sort((a, b) => {
                    const nombreA = `${a.cliente?.nombre || ''} ${a.cliente?.apellidos || ''}`.trim().toLowerCase();
                    const nombreB = `${b.cliente?.nombre || ''} ${b.cliente?.apellidos || ''}`.trim().toLowerCase();
                    return nombreA.localeCompare(nombreB, 'es');
                })
            }));
            
            setPagosPorMes(dataOrdenada);
        } catch (error) {
            console.error('Error al cargar pagos por mes:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMes = (mes: number) => {
        if (mesExpandido === mes) {
            setMesExpandido(null);
        } else {
            setMesExpandido(mes);
        }
    };

    // Filtrar pagos basado en el término de búsqueda
    const pagosFiltrados = useMemo(() => {
        if (!searchTerm.trim()) {
            return pagosPorMes;
        }

        const termino = searchTerm.toLowerCase().trim();

        return pagosPorMes.map(mesData => ({
            ...mesData,
            pagos: mesData.pagos.filter(pago => {
                // Buscar en número de factura
                const numeroFactura = pago.factura?.numeroFactura?.toLowerCase() || '';
                if (numeroFactura.includes(termino)) return true;

                // Buscar en nombre del cliente
                const nombreCliente = `${pago.cliente?.nombre || ''} ${pago.cliente?.apellidos || ''}`.toLowerCase();
                if (nombreCliente.includes(termino)) return true;

                // Buscar en monto
                const monto = pago.monto.toString();
                if (monto.includes(termino)) return true;

                // Buscar en fecha de pago (formato DD/MM/YYYY)
                const fechaStr = pago.fechaPago.split('T')[0];
                const [año, mes, dia] = fechaStr.split('-');
                const fechaFormateada = `${dia}/${mes}/${año}`;
                if (fechaFormateada.includes(termino)) return true;

                // Buscar en método de pago
                const metodoPago = pago.metodoPago?.toLowerCase() || '';
                if (metodoPago.includes(termino)) return true;

                return false;
            }),
            total: mesData.pagos
                .filter(pago => {
                    const numeroFactura = pago.factura?.numeroFactura?.toLowerCase() || '';
                    const nombreCliente = `${pago.cliente?.nombre || ''} ${pago.cliente?.apellidos || ''}`.toLowerCase();
                    const monto = pago.monto.toString();
                    const fechaStr = pago.fechaPago.split('T')[0];
                    const [año, mes, dia] = fechaStr.split('-');
                    const fechaFormateada = `${dia}/${mes}/${año}`;
                    const metodoPago = pago.metodoPago?.toLowerCase() || '';
                    
                    return numeroFactura.includes(termino) || 
                           nombreCliente.includes(termino) || 
                           monto.includes(termino) || 
                           fechaFormateada.includes(termino) || 
                           metodoPago.includes(termino);
                })
                .reduce((sum, pago) => sum + pago.monto, 0)
        })).filter(mesData => mesData.pagos.length > 0); // Solo mostrar meses con resultados
    }, [pagosPorMes, searchTerm]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando pagos...</div>;
    }

    return (
        <div className="pagos-mes-page" style={{ padding: '20px' }}>
            <div className="header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        backgroundColor: '#dbeafe',
                        padding: '10px',
                        borderRadius: '10px',
                        color: '#2563eb'
                    }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>Pagos por Mes</h1>
                        <p style={{ margin: 0, color: '#6b7280' }}>Reporte de ingresos mensuales</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Buscador */}
                    <div style={{ position: 'relative' }}>
                        <Search 
                            size={18} 
                            style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#9ca3af' 
                            }} 
                        />
                        <input
                            type="text"
                            placeholder="Buscar por factura, cliente, monto, fecha o método..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '10px 15px 10px 40px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '14px',
                                width: '350px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>

                    {/* Selector de año */}
                    <div className="filtro-año">
                        <select
                            value={año}
                            onChange={(e) => setAño(parseInt(e.target.value))}
                            style={{
                                padding: '10px 15px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>
                </div>
            </div>

            <div className="meses-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pagosFiltrados.map((mesData) => (
                    <div
                        key={mesData.mes}
                        className="mes-card"
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}
                    >
                        <div
                            className="mes-header"
                            onClick={() => toggleMes(mesData.mes)}
                            style={{
                                padding: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                backgroundColor: mesExpandido === mesData.mes ? '#f9fafb' : 'white',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: mesData.total > 0 ? '#d1fae5' : '#f3f4f6',
                                    color: mesData.total > 0 ? '#059669' : '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    {mesData.mes}
                                </div>
                                <span style={{ fontSize: '18px', fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>
                                    {mesData.nombreMes}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: mesData.total > 0 ? '#059669' : '#9ca3af' }}>
                                        {formatearMoneda(mesData.total)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {mesData.pagos.length} pagos
                                    </div>
                                </div>
                                {mesExpandido === mesData.mes ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
                            </div>
                        </div>

                        {mesExpandido === mesData.mes && mesData.pagos.length > 0 && (
                            <div className="mes-detalles" style={{ borderTop: '1px solid #e5e7eb' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Fecha de Pago</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Cliente</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Factura</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Método</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mesData.pagos.map((pago) => {
                                            // Parsear fecha correctamente sin problemas de zona horaria
                                            const fechaStr = pago.fechaPago.split('T')[0]; // "2026-01-02"
                                            const [año, mes, dia] = fechaStr.split('-');
                                            
                                            return (
                                                <tr key={pago.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '12px 20px', fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ 
                                                                backgroundColor: '#dbeafe', 
                                                                color: '#2563eb', 
                                                                padding: '4px 8px', 
                                                                borderRadius: '6px',
                                                                fontSize: '13px',
                                                                fontWeight: 600
                                                            }}>
                                                                {dia}/{mes}/{año}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 20px', fontSize: '14px', color: '#374151' }}>
                                                        {pago.cliente?.nombre || 'Cliente'} {pago.cliente?.apellidos || 'Desconocido'}
                                                    </td>
                                                    <td
                                                        style={{ padding: '12px 20px', fontSize: '14px', color: '#3b82f6', cursor: pago.factura?.id ? 'pointer' : 'default', textDecoration: pago.factura?.id ? 'underline' : 'none' }}
                                                        onClick={() => pago.factura?.id && navigate(`/facturas/${pago.factura.id}`)}
                                                        title={pago.factura?.id ? 'Ver detalle de la factura' : 'Factura sin identificador'}
                                                    >
                                                        {pago.factura?.numeroFactura || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '12px 20px', fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>
                                                        {pago.metodoPago}
                                                    </td>
                                                    <td style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, color: '#059669', textAlign: 'right' }}>
                                                        {formatearMoneda(pago.monto)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {mesExpandido === mesData.mes && mesData.pagos.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                No hay pagos registrados en este mes.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FacturasPagosMes;
