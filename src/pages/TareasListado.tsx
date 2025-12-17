import React, { useState, useEffect } from 'react';
import { getTareas, updateTarea, deleteTarea, toggleTareaCompletada, createTarea, type Tarea } from '../services/taskService';
import { useAuth } from '../context/AuthProvider';
import DataTable from '../components/ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';
import '../styles/TareasListado.css';

const TareasListado: React.FC = () => {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
    const [filter, setFilter] = useState<'todas' | 'pendientes' | 'completadas'>('todas');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
    const [formData, setFormData] = useState({ titulo: '', descripcion: '', color: '#3788d8' });
    const { user } = useAuth();

    const fetchTareas = async () => {
        if (!user) return;
        try {
            const data = await getTareas(user.id);
            setTareas(data);
        } catch (error) {
            console.error('Error fetching tareas:', error);
            Swal.fire('Error', 'No se pudieron cargar las tareas', 'error');
        }
    };

    useEffect(() => {
        fetchTareas();
    }, [user]);

    useEffect(() => {
        let filtered = tareas;
        if (filter === 'pendientes') {
            filtered = tareas.filter(t => !t.completada);
        } else if (filter === 'completadas') {
            filtered = tareas.filter(t => t.completada);
        }
        setFilteredTareas(filtered);
    }, [tareas, filter]);

    const handleToggleCompletada = async (tarea: Tarea) => {
        try {
            await toggleTareaCompletada(tarea.id, !tarea.completada);
            await fetchTareas();
            const action = !tarea.completada ? 'completada' : 'pendiente';
            // Optional: Toast notification instead of full alert for smoother experience
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'success',
                title: `Tarea marcada como ${action}`
            });
        } catch (error) {
            console.error('Error toggling tarea:', error);
            Swal.fire('Error', 'No se pudo actualizar la tarea', 'error');
        }
    };

    const handleEdit = (tarea: Tarea) => {
        setEditingTarea(tarea);
        setFormData({ titulo: tarea.titulo, descripcion: tarea.descripcion || '', color: tarea.color });
        setIsModalOpen(true);
    };

    const handleDelete = async (tarea: Tarea) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteTarea(tarea.id);
                await fetchTareas();
                Swal.fire('¡Eliminado!', 'La tarea ha sido eliminada', 'success');
            } catch (error) {
                console.error('Error deleting tarea:', error);
                Swal.fire('Error', 'No se pudo eliminar la tarea', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            if (editingTarea) {
                await updateTarea(editingTarea.id, formData);
                Swal.fire('¡Actualizado!', 'Tarea actualizada exitosamente', 'success');
            } else {
                await createTarea({ ...formData, creadoPorId: user.id });
                Swal.fire('¡Creado!', 'Tarea creada exitosamente', 'success');
            }
            setIsModalOpen(false);
            setEditingTarea(null);
            setFormData({ titulo: '', descripcion: '', color: '#3788d8' });
            await fetchTareas();
        } catch (error) {
            console.error('Error saving tarea:', error);
            Swal.fire('Error', 'No se pudo guardar la tarea', 'error');
        }
    };

    const columns: ColumnDef<Tarea>[] = [
        {
            accessorKey: 'color',
            header: 'Color',
            cell: ({ row }) => (
                <div style={{ width: '24px', height: '24px', backgroundColor: row.original.color, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} title={row.original.color} />
            ),
            size: 60,
        },
        {
            accessorKey: 'titulo',
            header: 'Título',
            cell: ({ row }) => (
                <span style={{
                    textDecoration: row.original.completada ? 'line-through' : 'none',
                    color: row.original.completada ? 'var(--text-secondary)' : 'var(--text-primary)'
                }}>
                    {row.original.titulo}
                </span>
            ),
        },
        {
            accessorKey: 'descripcion',
            header: 'Descripción',
            cell: ({ row }) => (
                <span className="truncate-text" title={row.original.descripcion || ''}>
                    {row.original.descripcion || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'completada',
            header: 'Estado',
            cell: ({ row }) => (
                <span className={`estado-badge ${row.original.completada ? 'completada' : 'pendiente'}`}>
                    {row.original.completada ? 'Completada' : 'Pendiente'}
                </span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Fecha Creación',
            cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString('es-DO') : '-',
        },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="action-buttons">
                    <button
                        className={`btn-icon ${row.original.completada ? 'btn-undo' : 'btn-check'}`}
                        onClick={() => handleToggleCompletada(row.original)}
                        title={row.original.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
                    >
                        <span className="material-icons">{row.original.completada ? 'undo' : 'check_circle'}</span>
                    </button>
                    <button className="btn-icon btn-edit" onClick={() => handleEdit(row.original)} title="Editar">
                        <span className="material-icons">edit</span>
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(row.original)} title="Eliminar">
                        <span className="material-icons">delete</span>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="page-container tareas-listado-container">
            <div className="dashboard-header">
                <div className="dashboard-header-left">
                    <h1 className="dashboard-title">Gestión de Tareas</h1>
                    <p className="dashboard-subtitle">Administra y organiza tus tareas pendientes</p>
                </div>
            </div>

            <div className="tareas-toolbar">
                <div className="filter-buttons">
                    <button className={`filter-btn ${filter === 'todas' ? 'active' : ''}`} onClick={() => setFilter('todas')}>
                        Todas
                    </button>
                    <button className={`filter-btn ${filter === 'pendientes' ? 'active' : ''}`} onClick={() => setFilter('pendientes')}>
                        Pendientes
                    </button>
                    <button className={`filter-btn ${filter === 'completadas' ? 'active' : ''}`} onClick={() => setFilter('completadas')}>
                        Completadas
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredTareas}
                createAction={{
                    label: 'Nueva Tarea',
                    onClick: () => {
                        setEditingTarea(null);
                        setFormData({ titulo: '', descripcion: '', color: '#3788d8' });
                        setIsModalOpen(true);
                    }
                }}
            />

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Título *</label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    required
                                    placeholder="Ej: Revisar reporte mensual"
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows={3}
                                    placeholder="Detalles adicionales..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-picker-container">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="color-input"
                                    />
                                    <span className="color-value">{formData.color}</span>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingTarea ? 'Actualizar' : 'Crear Tarea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TareasListado;
