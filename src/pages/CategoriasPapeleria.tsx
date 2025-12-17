import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CategoriaPapeleria } from '@/services/papeleriaApi';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '@/services/papeleriaApi';
import DataTable from '@/components/ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { AxiosResponse, AxiosError } from 'axios';
import Swal from 'sweetalert2';

const initialCategoryState: Omit<CategoriaPapeleria, 'id'> = {
    nombre: '',
    descripcion: '',
    activo: true,
};

const CategoriasPapeleria: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoriaPapeleria | null>(null);
    const [formData, setFormData] = useState<Omit<CategoriaPapeleria, 'id'>>(initialCategoryState);

    const { data: categorias, isLoading: isLoadingCategorias } = useQuery({
        queryKey: ['categoriasPapeleria'],
        queryFn: () => getCategorias().then(res => res.data),
        select: (data) => {
            if (!Array.isArray(data)) return [];
            return data.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        }
    });

    const mutationConfig = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categoriasPapeleria'] });
            closeModal();
        },
    };

    const createMutation = useMutation<AxiosResponse<CategoriaPapeleria>, AxiosError, Omit<CategoriaPapeleria, 'id'>>({
        mutationFn: (data) => createCategoria(data),
        ...mutationConfig,
        onSuccess: (response) => {
            toast.success(`Categoría "${response.data.nombre}" creada con éxito.`);
            mutationConfig.onSuccess();
        },
        onError: (error) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || error.message;
            toast.error(`Error al crear la categoría: ${errorMessage}`);
        },
    });

    const updateMutation = useMutation<AxiosResponse<CategoriaPapeleria>, AxiosError, CategoriaPapeleria>({
        mutationFn: (data) => updateCategoria(data.id, data),
        ...mutationConfig,
        onSuccess: (response) => {
            toast.success(`Categoría "${response.data.nombre}" actualizada con éxito.`);
            mutationConfig.onSuccess();
        },
        onError: (error) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || error.message;
            toast.error(`Error al actualizar la categoría: ${errorMessage}`);
        },
    });

    const deleteMutation = useMutation<AxiosResponse, AxiosError, number>({
        mutationFn: (id) => deleteCategoria(id),
        onSuccess: (_, id) => {
            toast.success(`Categoría ID ${id} eliminada con éxito.`);
            queryClient.invalidateQueries({ queryKey: ['categoriasPapeleria'] });
        },
        onError: (error) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || error.message;
            toast.error(`Error al eliminar la categoría: ${errorMessage}`);
        },
    });

    const openModalForCreate = () => {
        setEditingCategory(null);
        setFormData(initialCategoryState);
        setIsModalOpen(true);
    };

    const openModalForEdit = (category: CategoriaPapeleria) => {
        setEditingCategory(category);
        setFormData(category);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        
        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ ...formData, id: editingCategory.id } as CategoriaPapeleria);
        } else {
            createMutation.mutate(formData as Omit<CategoriaPapeleria, 'id'>);
        }
    };

    const handleDelete = useCallback(async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Estás seguro de que quieres eliminar esta categoría?',
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

    const columns = useMemo<ColumnDef<CategoriaPapeleria>[]>(() => [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Nombre', accessorKey: 'nombre' },
        { header: 'Descripción', accessorKey: 'descripcion' },
        { header: 'Estado', accessorKey: 'activo', cell: ({ row }) => row.original.activo ? <span className="badge active">Activo</span> : <span className="badge inactive">Inactivo</span> },
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
                    <h1>Categorías de Papelería</h1>
                    <p>Gestiona las categorías de tu papelería.</p>
                </div>
            </header>
            
            {isLoadingCategorias ? (
                <div className="loading-message" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Cargando categorías...</p>
                </div>
            ) : (
                <DataTable 
                    columns={columns} 
                    data={categorias || []}
                    createAction={{
                      label: 'Nueva Categoría',
                      onClick: openModalForCreate,
                    }}
                />
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Nombre</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange}></textarea>
                    </div>
                    <div className="form-group form-group-checkbox">
                        <input type="checkbox" id="activo" name="activo" checked={formData.activo} onChange={handleChange} />
                        <label htmlFor="activo">Activo</label>
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

export default CategoriasPapeleria;
