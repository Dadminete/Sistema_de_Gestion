import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {
    X,
    Database,
    Server,
    HardDrive,
    Activity,
    Table,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import './DatabaseStatusModal.css';

interface DatabaseStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DbStatusData {
    status: string;
    latencyMs: number;
    stability: string;
    tableCount: number;
    dbSizePretty: string;
    dbSizeBytes: number;
    activityToday: {
        totalEventsToday: number;
        activityByHour: { hour: string; count: number }[];
    };
    dbInfo: {
        dbName: string | null;
        dbHost: string | null;
        maxSizeMb: number | null;
        dbUsagePercent: number | null;
    };
    tablesWorkedOn?: { tableName: string; count: number }[];
    timestamp: string;
}

const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DbStatusData | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const getAPIBaseURL = () => {
                const envUrl = import.meta.env.VITE_API_BASE_URL;
                if (envUrl && envUrl.trim()) {
                    return envUrl.replace(/\/api$/, '');
                }
                const hostname = window.location.hostname;
                const port = window.location.port ? `:${window.location.port}` : '';
                const protocol = window.location.protocol.replace(':', '');
                return `${protocol}://${hostname}${port}`;
            };

            const baseUrl = getAPIBaseURL();
            const response = await axios.get(`${baseUrl}/api/database/status`);
            setData(response.data);
        } catch (err: any) {
            console.error('Error fetching DB status:', err);
            setError(err.message || 'Error al conectar con la base de datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    // Format data for Recharts
    const chartData = data?.activityToday?.activityByHour?.map(item => ({
        time: new Date(item.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: item.count,
        fullDate: item.hour
    })) || [];

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="db-modal-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="db-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="db-modal-content"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="db-modal-header">
                            <div className="db-modal-title">
                                <Database className="w-6 h-6 text-blue-400" />
                                <h2>Estado de Base de Datos</h2>
                            </div>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="db-modal-body">
                            {loading ? (
                                <div className="loading-state">
                                    <RefreshCw className="animate-spin text-blue-400" size={32} />
                                    <p>Verificando conexión...</p>
                                </div>
                            ) : error ? (
                                <div className="error-state">
                                    <AlertCircle className="text-red-500" size={48} />
                                    <p className="error-msg">{error}</p>
                                    <button className="retry-btn" onClick={fetchData}>Reintentar</button>
                                </div>
                            ) : data ? (
                                <>
                                    {/* Status Indicator (Huge & Visual) */}
                                    <div className={`status-hero ${data.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
                                        <div className="status-icon-wrapper">
                                            {data.status === 'healthy' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                                        </div>
                                        <div className="status-text">
                                            <h3>{data.status === 'healthy' ? 'Sistema Operativo' : 'Problemas Detectados'}</h3>
                                            <p>{data.stability === 'estable' ? 'Conexión Estable' : 'Alta Latencia Detectada'} ({data.latencyMs.toFixed(0)}ms)</p>
                                        </div>
                                        <div className="refresh-wrapper" onClick={fetchData} title="Actualizar">
                                            <RefreshCw size={18} />
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="metrics-grid">
                                        <div className="metric-card">
                                            <div className="metric-icon"><Table size={18} /></div>
                                            <div className="metric-info">
                                                <span className="metric-value">{data.tableCount}</span>
                                                <span className="metric-label">Tablas Totales</span>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-icon"><HardDrive size={18} /></div>
                                            <div className="metric-info">
                                                <span className="metric-value">{data.dbSizePretty}</span>
                                                <span className="metric-label">Tamaño DB</span>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-icon"><Activity size={18} /></div>
                                            <div className="metric-info">
                                                <span className="metric-value">{data.activityToday.totalEventsToday}</span>
                                                <span className="metric-label">Acciones Hoy</span>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-icon"><Server size={18} /></div>
                                            <div className="metric-info">
                                                <span className="metric-value truncate" title={data.dbInfo.dbHost || 'N/A'}>
                                                    {data.dbInfo.dbHost || 'Localhost'}
                                                </span>
                                                <span className="metric-label">Host</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity Chart Section - Recharts Implementation */}
                                    <div className="section-container">
                                        <h4 className="section-title"><Clock size={16} /> Actividad por Hora</h4>
                                        <div className="chart-wrapper">
                                            {chartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                        <XAxis
                                                            dataKey="time"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                                                            interval={chartData.length > 10 ? 1 : 0}
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                                            contentStyle={{
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill="url(#colorGradient)" />
                                                            ))}
                                                        </Bar>
                                                        <defs>
                                                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                                                            </linearGradient>
                                                        </defs>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="no-activity">Sin actividad hoy</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tables Worked On Section */}
                                    <div className="section-container">
                                        <h4 className="section-title"><Table size={16} /> Tablas Trabajadas Hoy</h4>
                                        <div className="tables-list">
                                            {data.tablesWorkedOn && data.tablesWorkedOn.length > 0 ? (
                                                data.tablesWorkedOn.map((table, idx) => (
                                                    <div key={idx} className="table-item">
                                                        <div className="table-name">
                                                            <div className="table-dot"></div>
                                                            {table.tableName}
                                                        </div>
                                                        <span className="table-count">{table.count} cambios</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-data-msg">No se han registrado cambios hoy.</div>
                                            )}
                                        </div>
                                    </div>

                                </>
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default DatabaseStatusModal;
