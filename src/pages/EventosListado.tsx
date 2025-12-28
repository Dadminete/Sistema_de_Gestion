import React, { useState, useEffect } from 'react';
import { getEventos, updateEvento, deleteEvento, createEvento, type Evento } from '../services/eventService';
import { useAuth } from '../context/AuthProvider';
import { Pencil, Trash2, X } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';
import '../styles/TareasListado.css'; // Reusing styles for consistency

const EventosListado: React.FC = () => {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        todoElDia: false,
        color: '#3788d8',
        ubicacion: ''
    });
    const { user } = useAuth();

    const fetchEventos = async () => {
        try {
            const data = await getEventos();
            setEventos(data);
        } catch (error) {
            console.error('Error fetching eventos:', error);
            Swal.fire('Error', 'No se pudieron cargar los eventos', 'error');
        }
    };

    useEffect(() => {
        fetchEventos();
    }, []);

    const handleEdit = (evento: Evento) => {
        setEditingEvento(evento);
        setFormData({
            titulo: evento.titulo,
            descripcion: evento.descripcion || '',
            fechaInicio: evento.fechaInicio.slice(0, 16), // Format for datetime-local
            fechaFin: evento.fechaFin.slice(0, 16),
            todoElDia: evento.todoElDia,
            color: evento.color || '#3788d8',
            ubicacion: evento.ubicacion || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (evento: Evento) => {
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
                await deleteEvento(evento.id);
                await fetchEventos();
                Swal.fire('¡Eliminado!', 'El evento ha sido eliminado', 'success');
            } catch (error) {
                console.error('Error deleting evento:', error);
                Swal.fire('Error', 'No se pudo eliminar el evento', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const payload = {
                ...formData,
                fechaInicio: new Date(formData.fechaInicio).toISOString(),
                fechaFin: new Date(formData.fechaFin).toISOString(),
            };

            if (editingEvento) {
                await updateEvento(editingEvento.id, payload);
                Swal.fire('¡Actualizado!', 'Evento actualizado exitosamente', 'success');
            } else {
                await createEvento({ ...payload, creadoPorId: user.id });
                Swal.fire('¡Creado!', 'Evento creado exitosamente', 'success');
            }
            setIsModalOpen(false);
            setEditingEvento(null);
            setFormData({
                titulo: '',
                descripcion: '',
                fechaInicio: '',
                fechaFin: '',
                todoElDia: false,
                color: '#3788d8',
                ubicacion: ''
            });
            await fetchEventos();
        } catch (error) {
            console.error('Error saving evento:', error);
            Swal.fire('Error', 'No se pudo guardar el evento', 'error');
        }
    };

    const columns: ColumnDef<Evento>[] = [
        {
            accessorKey: 'color',
            header: 'Color',
            cell: ({ row }) => (
                <div style={{ width: '24px', height: '24px', backgroundColor: row.original.color || '#3788d8', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
            ),
            size: 60,
        },
        {
            accessorKey: 'titulo',
            header: 'Título',
            cell: ({ row }) => <span style={{ fontWeight: 500 }}>{row.original.titulo}</span>,
        },
        {
            accessorKey: 'fechaInicio',
            header: 'Inicio',
            cell: ({ row }) => new Date(row.original.fechaInicio).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' }),
        },
        {
            accessorKey: 'fechaFin',
            header: 'Fin',
            cell: ({ row }) => new Date(row.original.fechaFin).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' }),
        },
        {
            accessorKey: 'ubicacion',
            header: 'Ubicación',
            cell: ({ row }) => row.original.ubicacion || '-',
        },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="action-buttons">
                    <button className="btn-icon btn-edit" onClick={() => handleEdit(row.original)} title="Editar">
                        <Pencil size={18} strokeWidth={2.5} />
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(row.original)} title="Eliminar">
                        <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="page-container tareas-listado-container">
            <div className="dashboard-header">
                <div className="dashboard-header-left">
                    <h1 className="dashboard-title">Gestión de Eventos</h1>
                    <p className="dashboard-subtitle">Administra los eventos del calendario</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={eventos}
                createAction={{
                    label: 'Nuevo Evento',
                    onClick: () => {
                        setEditingEvento(null);
                        const now = new Date();
                        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
                        // Adjust to local ISO string for datetime-local input
                        const toLocalISO = (date: Date) => {
                            const offset = date.getTimezoneOffset() * 60000;
                            return new Date(date.getTime() - offset).toISOString().slice(0, 16);
                        };

                        setFormData({
                            titulo: '',
                            descripcion: '',
                            fechaInicio: toLocalISO(now),
                            fechaFin: toLocalISO(oneHourLater),
                            todoElDia: false,
                            color: '#3788d8',
                            ubicacion: ''
                        });
                        setIsModalOpen(true);
                    }
                }}
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b pb-4 dark:border-gray-700 mb-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">Título *</label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Nombre del evento"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">Inicio *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.fechaInicio}
                                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">Fin *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.fechaFin}
                                        onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">Ubicación</label>
                                <input
                                    type="text"
                                    value={formData.ubicacion}
                                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej: Sala de reuniones"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Detalles del evento..."
                                />
                            </div>

                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-white">Color</label>
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="h-8 w-16 p-0 border-0 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="todoElDia"
                                        checked={formData.todoElDia}
                                        onChange={(e) => setFormData({ ...formData, todoElDia: e.target.checked })}
                                        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                    />
                                    <label htmlFor="todoElDia" className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer select-none">Todo el día</label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 font-medium"
                                >
                                    {editingEvento ? 'Actualizar' : 'Crear Evento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventosListado;
