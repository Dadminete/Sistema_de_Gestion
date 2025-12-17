import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import facturaService from '../services/facturaService';
import { formatearMoneda } from '../utils/facturaUtils';

interface Pago {
    id: string;
    numeroPago: string;
    fechaPago: string;
    monto: number;
    metodoPago: string;
    factura: {
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
    const [pagosPorMes, setPagosPorMes] = useState<MesPagos[]>([]);
    const [loading, setLoading] = useState(true);
    const [año, setAño] = useState(new Date().getFullYear());
    const [mesExpandido, setMesExpandido] = useState<number | null>(new Date().getMonth() + 1);

    useEffect(() => {
        cargarPagos();
    }, [año]);

    const cargarPagos = async () => {
        try {
            setLoading(true);
            const data = await facturaService.obtenerPagosPorMes(año);
            setPagosPorMes(data);
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

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando pagos...</div>;
    }

    return (
        <div className="pagos-mes-page" style={{ padding: '20px' }}>
            <div className="header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

            <div className="meses-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pagosPorMes.map((mesData) => (
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
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>FECHA</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>CLIENTE</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>FACTURA</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>MÉTODO</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>MONTO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mesData.pagos.map((pago) => (
                                            <tr key={pago.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '12px 20px', fontSize: '14px', color: '#374151' }}>
                                                    {new Date(pago.fechaPago).toLocaleDateString('es-DO')}
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '14px', color: '#374151' }}>
                                                    {pago.cliente?.nombre || 'Cliente'} {pago.cliente?.apellidos || 'Desconocido'}
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '14px', color: '#3b82f6' }}>
                                                    {pago.factura?.numeroFactura || 'N/A'}
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>
                                                    {pago.metodoPago}
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, color: '#059669', textAlign: 'right' }}>
                                                    {formatearMoneda(pago.monto)}
                                                </td>
                                            </tr>
                                        ))}
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
