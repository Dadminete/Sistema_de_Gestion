import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientePapeleria } from '@/services/papeleriaApi';
import { getClientes, createCliente, updateCliente, deleteCliente } from '@/services/papeleriaApi';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const initialClientState: Omit<ClientePapeleria, 'id'> = {
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
};

const ClientesPapeleria: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientePapeleria | null>(null);
    const [formData, setFormData] = useState<Omit<ClientePapeleria, 'id'>>(initialClientState);

    const { data: clientes, isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientesPapeleria'],
        queryFn: () => getClientes().then(res => res.data),
        select: (data) => {
            if (!Array.isArray(data)) return [];
            return data.sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, 'es'));
        }
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientesPapeleria'] });
            closeModal();
        },
    };

    const createMutation = useMutation({
        mutationFn: createCliente,
        ...mutationOptions,
        onSuccess: () => {
            toast.success('Cliente creado con éxito.');
            mutationOptions.onSuccess();
        },
        onError: (error: any) => {
            toast.error(`Error al crear cliente: ${error.response?.data?.message || error.message}`);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: ClientePapeleria) => updateCliente(data.id, data),
        ...mutationOptions,
        onSuccess: () => {
            toast.success('Cliente actualizado con éxito.');
            mutationOptions.onSuccess();
        },
        onError: (error: any) => {
            toast.error(`Error al actualizar cliente: ${error.response?.data?.message || error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCliente,
        onSuccess: () => {
            toast.success('Cliente eliminado con éxito.');
            queryClient.invalidateQueries({ queryKey: ['clientesPapeleria'] });
        },
        onError: (error: any) => {
            toast.error(`Error al eliminar cliente: ${error.response?.data?.message || error.message}`);
        },
    });

    const openModalForCreate = () => {
        setEditingClient(null);
        setFormData(initialClientState);
        setIsModalOpen(true);
    };

    const openModalForEdit = (client: ClientePapeleria) => {
        setEditingClient(client);
        setFormData(client);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClient) {
            updateMutation.mutate({ ...formData, id: editingClient.id });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = useCallback(async (id: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Estás seguro de que quieres eliminar este cliente?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            deleteMutation.mutate(id);
        }
    }, [deleteMutation]);

    const columns = useMemo<ColumnDef<ClientePapeleria>[]>(() => [
        { header: 'Nombre', accessorKey: 'nombre' },
        { header: 'Apellido', accessorKey: 'apellido' },
        { header: 'Cédula/RNC', accessorKey: 'cedula' },
        { header: 'Email', accessorKey: 'email' },
        { header: 'Teléfono', accessorKey: 'telefono' },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="table-actions">
                    <button onClick={() => openModalForEdit(row.original)} className="action-btn edit-btn" title="Editar">
                        <span className="material-icons">edit</span>
                    </button>
                    <button onClick={() => handleDelete(row.original.id)} className="action-btn delete-btn" title="Eliminar">
                        <span className="material-icons">delete</span>
                    </button>
                </div>
            ),
        },
    ], [handleDelete]);

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Clientes de Papelería</h1>
                    <p>Gestiona los clientes de tu papelería.</p>
                </div>
            </header>
            
            {isLoadingClientes ? (
                <div className="loading-message" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Cargando clientes...</p>
                </div>
            ) : (
                <DataTable 
                    columns={columns} 
                    data={clientes || []}
                    createAction={{
                      label: 'Nuevo Cliente',
                      onClick: openModalForCreate,
                    }}
                />
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Apellido</label>
                            <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Cédula/RNC</label>
                        <input type="text" name="cedula" value={formData.cedula || ''} onChange={handleChange} />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input type="tel" name="telefono" value={formData.telefono || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button type="button" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="primary" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ClientesPapeleria;

