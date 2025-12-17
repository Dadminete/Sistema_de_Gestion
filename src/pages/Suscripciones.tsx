import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import DataTable from '../components/ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';
import './ClientesEquiposServicios.css';

interface Suscripcion {
    id: string;
    numeroContrato: string;
    precioMensual: number;
    fechaInicio: string;
    estado: string;
    cliente?: {
        id?: string;
        nombre?: string;
        apellidos?: string;
        codigoCliente?: string;
    };
    servicio?: {
        id?: string;
        nombre?: string;
    };
    plan?: {
        id?: string;
        nombre?: string;
    };
}

const formatearMonto = (monto: number): string =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(monto);

// Normalize API base URL
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, '');
  }
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  return `${protocol}://${hostname}${port}/api`;
};

const Suscripciones: React.FC = () => {
    const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const baseUrl = getApiBaseUrl();

    useEffect(() => {
        cargarSuscripciones();
    }, []);

    const cargarSuscripciones = async () => {
        try {
            setLoading(true);
            const token = AuthService.getToken();
            const resp = await fetch(`${baseUrl}/suscripciones`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) throw new Error('Error al cargar suscripciones');
            const data = await resp.json();
            
            // Filter suscripciones to only include those from active clients
            const filteredData = (data || []).filter((sus: Suscripcion) => {
                const clienteEstado = (sus.cliente?.estadoCliente || sus.cliente?.estado || '').toLowerCase();
                // Only include suscripciones where cliente is 'activo'
                return clienteEstado === 'activo';
            });
            
            const sorted = filteredData.sort((a: Suscripcion, b: Suscripcion) => {
                const nombreA = `${a.cliente?.nombre || ''} ${a.cliente?.apellidos || ''}`.trim().toLowerCase();
                const nombreB = `${b.cliente?.nombre || ''} ${b.cliente?.apellidos || ''}`.trim().toLowerCase();
                return nombreA.localeCompare(nombreB);
            });
            setSuscripciones(sorted);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstado = async (id: string, nuevoEstado: string) => {
        try {
            const token = AuthService.getToken();
            const resp = await fetch(`${baseUrl}/suscripciones/${id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
            });
            if (!resp.ok) throw new Error('Error al actualizar estado');
            await Swal.fire({
                icon: 'success',
                title: '¡Estado actualizado!',
                text: `La suscripción ahora está en estado: ${nuevoEstado}`,
                timer: 2000,
                showConfirmButton: false,
            });
            cargarSuscripciones();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el estado' });
        }
    };

    // Cambiar estado en masa
    const cambiarEstadoEnMasa = async (nuevoEstado: string) => {
        if (selectedIds.size === 0) {
            Swal.fire({ icon: 'warning', title: 'Selecciona suscripciones', text: 'Debes seleccionar al menos una suscripción' });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: 'Confirmar cambio de estado',
            html: `<p>¿Cambiar estado a <strong>${nuevoEstado}</strong> para ${selectedIds.size} suscripción(es)?</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar',
        });

        if (!isConfirmed) return;

        try {
            setProcessingIds(new Set(selectedIds));
            const token = AuthService.getToken();
            
            let successCount = 0;
            let errorCount = 0;

            for (const id of Array.from(selectedIds)) {
                try {
                    const resp = await fetch(`${baseUrl}/suscripciones/${id}`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: nuevoEstado }),
                    });
                    if (resp.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch {
                    errorCount++;
                }
            }

            setSelectedIds(new Set());
            setProcessingIds(new Set());
            cargarSuscripciones();

            if (successCount > 0 && errorCount === 0) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Cambios aplicados!',
                    text: `${successCount} suscripción(es) actualizada(s) a estado ${nuevoEstado}`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else if (successCount > 0 && errorCount > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Cambios parciales',
                    text: `${successCount} actualizadas, ${errorCount} con error`,
                    timer: 3000,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron actualizar las suscripciones',
                });
            }
        } catch (e) {
            setProcessingIds(new Set());
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al procesar cambios' });
        }
    };

    // Seleccionar/deseleccionar
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Seleccionar todas
    const toggleSelectAll = () => {
        if (selectedIds.size === suscripciones.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(suscripciones.map(s => s.id)));
        }
    };

    const handleCambiarEstado = async (sus: Suscripcion) => {
        const { value: nuevoEstado } = await Swal.fire({
            title: 'Cambiar Estado',
            html: `<p>Suscripción: <strong>${sus.numeroContrato}</strong></p>
             <p>Cliente: <strong>${sus.cliente?.nombre || ''} ${sus.cliente?.apellidos || ''}</strong></p>
             <p>Estado actual: <strong>${sus.estado}</strong></p>`,
            input: 'select',
            inputOptions: {
                activo: 'Activo',
                pendiente: 'Pendiente',
                suspendida: 'Suspendida',
                cancelada: 'Cancelada',
            },
            inputValue: sus.estado,
            showCancelButton: true,
            confirmButtonText: 'Cambiar',
            cancelButtonText: 'Cancelar',
        });
        if (nuevoEstado && nuevoEstado !== sus.estado) {
            await cambiarEstado(sus.id, nuevoEstado);
        }
    };

    // Active subscriptions (case‑insensitive)
    const suscripcionesActivas = suscripciones.filter((s) => s.estado && s.estado.toLowerCase() === 'activo');
    const totalMensual = suscripcionesActivas.reduce((sum, s) => sum + Number(s.precioMensual), 0);

    const indeterminateRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (indeterminateRef.current) {
            indeterminateRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < suscripciones.length;
        }
    }, [selectedIds.size, suscripciones.length]);

    const columns: ColumnDef<Suscripcion>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <input
                    ref={indeterminateRef}
                    type="checkbox"
                    checked={selectedIds.size === suscripciones.length && suscripciones.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    title="Seleccionar todas"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={selectedIds.has(row.original.id)}
                    onChange={() => toggleSelect(row.original.id)}
                    disabled={processingIds.has(row.original.id)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px', opacity: processingIds.has(row.original.id) ? 0.5 : 1 }}
                />
            ),
            size: 50,
        },
        {
            id: 'cliente',
            header: 'Cliente',
            accessorFn: (row) => `${row.cliente?.nombre || ''} ${row.cliente?.apellidos || ''}`,
            cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: processingIds.has(row.original.id) ? 0.6 : 1 }}>
                    <span className="material-icons" style={{ color: 'var(--colors-primary-main)', fontSize: '1.1rem' }}>person</span>
                    <div>
                        <div style={{ fontWeight: '500' }}>{row.original.cliente?.nombre || 'N/A'} {row.original.cliente?.apellidos || 'N/A'}</div>
                        <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>{row.original.cliente?.codigoCliente || 'N/A'}</small>
                    </div>
                </div>
            ),
        },
        {
            id: 'servicio',
            header: 'Servicio',
            accessorFn: (row) => row.servicio?.nombre || '',
            cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: processingIds.has(row.original.id) ? 0.6 : 1 }}>
                    <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>wifi</span>
                    {row.original.servicio ? (
                        <span style={{ fontWeight: '500' }}>{row.original.servicio.nombre}</span>
                    ) : (
                        <span style={{ color: 'var(--colors-text-secondary)', fontStyle: 'italic' }}>Sin servicio</span>
                    )}
                </div>
            ),
        },
        {
            id: 'plan',
            header: 'Plan',
            accessorFn: (row) => row.plan?.nombre || '',
            cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: processingIds.has(row.original.id) ? 0.6 : 1 }}>
                    <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>router</span>
                    {row.original.plan ? (
                        <span style={{ fontWeight: '500' }}>{row.original.plan.nombre}</span>
                    ) : (
                        <span style={{ color: 'var(--colors-text-secondary)', fontStyle: 'italic' }}>Sin plan</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'precioMensual',
            header: 'Precio Mensual',
            cell: ({ row }) => (
                <div style={{ fontWeight: '600', color: 'var(--colors-success-dark)', fontSize: '1rem', opacity: processingIds.has(row.original.id) ? 0.6 : 1 }}>
                    {formatearMonto(Number(row.original.precioMensual))}
                </div>
            ),
        },
        {
            accessorKey: 'estado',
            header: 'Estado',
            cell: ({ row }) => (
                <span
                    style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor:
                            row.original.estado === 'activo'
                                ? 'var(--colors-success-main)'
                                : row.original.estado === 'cancelada'
                                    ? 'var(--colors-error-main)'
                                    : row.original.estado === 'suspendida'
                                        ? 'var(--colors-warning-main)'
                                        : 'var(--colors-info-main)',
                        color: 'white',
                        opacity: processingIds.has(row.original.id) ? 0.6 : 1,
                    }}
                >
                    {row.original.estado}
                </span>
            ),
        },
        {
            accessorKey: 'fechaInicio',
            header: 'Fecha Inicio',
            cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: processingIds.has(row.original.id) ? 0.6 : 1 }}>
                    <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>calendar_today</span>
                    <span>{new Date(row.original.fechaInicio).toLocaleDateString('es-ES')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'numeroContrato',
            header: 'Contrato',
            cell: ({ row }) => (
                <div
                    style={{
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: 'var(--colors-primary-main)',
                        backgroundColor: 'var(--colors-background-secondary)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        display: 'inline-block',
                        opacity: processingIds.has(row.original.id) ? 0.6 : 1,
                    }}
                >
                    {row.original.numeroContrato}
                </div>
            ),
        },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <button
                    onClick={() => handleCambiarEstado(row.original)}
                    disabled={processingIds.has(row.original.id)}
                    style={{ background: 'transparent', border: 'none', cursor: processingIds.has(row.original.id) ? 'not-allowed' : 'pointer', opacity: processingIds.has(row.original.id) ? 0.5 : 1 }}
                    title="Cambiar Estado"
                >
                    <span className="material-icons" style={{ fontSize: '1.2rem', color: 'var(--colors-primary-main)' }}>edit</span>
                </button>
            ),
        },
    ];

    return (
        <div className="dashboard-layout">
            <div className="dashboard-header">
                <div className="header-left">
                    <div className="breadcrumb"><h1>Suscripciones</h1></div>
                    <p>Gestión completa de todas las suscripciones de clientes</p>
                </div>
            </div>

            {error && (
                <div className="error-message" style={{ backgroundColor: 'var(--colors-error-main)', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-icons">error</span>{error}
                </div>
            )}

            {/* Resumen cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span className="material-icons" style={{ fontSize: '2rem' }}>subscriptions</span>
                        <div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Suscripciones</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{suscripciones.length}</div>
                        </div>
                    </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span className="material-icons" style={{ fontSize: '2rem' }}>check_circle</span>
                        <div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Activas</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{suscripcionesActivas.length}</div>
                        </div>
                    </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span className="material-icons" style={{ fontSize: '2rem' }}>attach_money</span>
                        <div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Ingreso Mensual</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatearMonto(totalMensual)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="form-control">
                <h3>Todas las Suscripciones</h3>
                <p>Lista completa de suscripciones con información detallada</p>

                {/* Toolbar de acciones en masa */}
                {selectedIds.size > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '8px',
                        border: '2px solid var(--colors-primary-main)',
                    }}>
                        <span style={{ fontWeight: '600', color: 'var(--colors-primary-main)' }}>
                            {selectedIds.size} suscripción(es) seleccionada(s)
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                            <button
                                onClick={() => cambiarEstadoEnMasa('activo')}
                                disabled={processingIds.size > 0}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--colors-success-main)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processingIds.size > 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    opacity: processingIds.size > 0 ? 0.6 : 1,
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (processingIds.size === 0) {
                                        (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '1.1rem' }}>check_circle</span>
                                Activar
                            </button>
                            <button
                                onClick={() => cambiarEstadoEnMasa('suspendida')}
                                disabled={processingIds.size > 0}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--colors-warning-main)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processingIds.size > 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    opacity: processingIds.size > 0 ? 0.6 : 1,
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (processingIds.size === 0) {
                                        (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '1.1rem' }}>pause_circle</span>
                                Suspender
                            </button>
                            <button
                                onClick={() => cambiarEstadoEnMasa('cancelada')}
                                disabled={processingIds.size > 0}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--colors-error-main)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processingIds.size > 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    opacity: processingIds.size > 0 ? 0.6 : 1,
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (processingIds.size === 0) {
                                        (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '1.1rem' }}>cancel</span>
                                Cancelar
                            </button>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                disabled={processingIds.size > 0}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#94a3b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processingIds.size > 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    opacity: processingIds.size > 0 ? 0.6 : 1,
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '1.1rem' }}>close</span>
                                Limpiar
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '1.125rem', color: '#64748b' }}>Cargando suscripciones...</div>
                    </div>
                ) : (
                    <DataTable columns={columns} data={suscripciones} />
                )}
            </div>
        </div>
    );
};

export default Suscripciones;
