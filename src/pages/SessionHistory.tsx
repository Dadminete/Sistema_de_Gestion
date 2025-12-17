import React, { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiClient } from '../utils/apiClient';
import Button from '../components/ui/Button';

// Types
interface Session {
    id: string;
    usuarioId: string;
    ipAddress: string;
    userAgent: string;
    activa: boolean;
    fechaInicio: string;
    fechaUltimoUso: string;
    fechaExpiracion: string;
    usuario: {
        id: string;
        username: string;
        nombre: string;
        apellido: string;
        avatar: string | null;
    };
}

const SessionHistory: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [usernameFilter, setUsernameFilter] = useState('');

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);

            // Build query params
            const params = new URLSearchParams();
            if (usernameFilter) params.append('username', usernameFilter);
            
            const queryString = params.toString();
            const endpoint = `/sessions${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get(endpoint);

            if (response && response.data) {
                setSessions(response.data);
            } else if (Array.isArray(response)) {
                setSessions(response);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('Error al cargar historial de sesiones');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSessions();
    };

    const columns = [
        {
            header: 'Usuario',
            accessorKey: 'usuario',
            cell: ({ row }: { row: { original: Session } }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {row.original.usuario.avatar ? (
                        <img
                            src={row.original.usuario.avatar}
                            alt="avatar"
                            style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: '#ccc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#fff'
                        }}>
                            {row.original.usuario.username.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{row.original.usuario.username}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                            {row.original.usuario.nombre} {row.original.usuario.apellido}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Fecha Inicio',
            accessorKey: 'fechaInicio',
            cell: ({ row }: { row: { original: Session } }) => (
                <span>
                    {format(new Date(row.original.fechaInicio), 'dd MMM yyyy HH:mm', { locale: es })}
                </span>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'activa',
            cell: ({ row }: { row: { original: Session } }) => (
                <span className={`status-badge ${row.original.activa ? 'success' : 'danger'}`} style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: row.original.activa ? '#d4edda' : '#f8d7da',
                    color: row.original.activa ? '#155724' : '#721c24',
                    fontSize: '0.9em'
                }}>
                    {row.original.activa ? 'Activa' : 'Cerrada'}
                </span>
            )
        },
        {
            header: 'Último Uso',
            accessorKey: 'fechaUltimoUso',
            cell: ({ row }: { row: { original: Session } }) => (
                <span>
                    {format(new Date(row.original.fechaUltimoUso), 'dd MMM HH:mm', { locale: es })}
                </span>
            )
        },
        {
            header: 'IP Address',
            accessorKey: 'ipAddress'
        },
        {
            header: 'Dispositivo',
            accessorKey: 'userAgent',
            cell: ({ row }: { row: { original: Session } }) => {
                const ua = row.original.userAgent;
                let device = 'Desconocido';
                if (ua.includes('Windows')) device = 'Windows';
                else if (ua.includes('Mac')) device = 'Mac';
                else if (ua.includes('Linux')) device = 'Linux';
                else if (ua.includes('Android')) device = 'Android';
                else if (ua.includes('iPhone')) device = 'iPhone';

                let browser = 'Desconocido';
                if (ua.includes('Chrome')) browser = 'Chrome';
                else if (ua.includes('Firefox')) browser = 'Firefox';
                else if (ua.includes('Safari')) browser = 'Safari';
                else if (ua.includes('Edge')) browser = 'Edge';

                return (
                    <span title={ua}>
                        {device} - {browser}
                    </span>
                );
            }
        }
    ];

    if (loading && sessions.length === 0) return <div className="p-4">Cargando historial...</div>;

    return (
        <div className="session-history-page">
            <div className="header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Historial de Sesiones</h1>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por usuario..."
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                    <Button type="submit">Buscar</Button>
                </form>
            </div>

            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <div className="card">
                <DataTable
                    data={sessions}
                    columns={columns}
                />
            </div>
        </div>
    );
};

export default SessionHistory;
