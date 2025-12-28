import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductos, getCategorias, createProducto, updateProducto, deleteProducto, type ProductoPapeleria, type CategoriaPapeleria } from '../services/papeleriaApi';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import type { AxiosResponse, AxiosError } from 'axios';
import Swal from 'sweetalert2';

// Utility function to format numbers as currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const initialProductState = {
    codigo: '',
    nombre: '',
    descripcion: '',
    categoriaId: null,
    marca: '',
    modelo: '',
    unidadMedida: 'unidad',
    precioCompra: 0,
    precioVenta: 0,
    margenGanancia: 0,
    stockMinimo: 0,
    stockActual: 0,
    ubicacion: '',
    codigoBarras: '',
    imagen: '',
    activo: true,
    proveedorId: null,
};

const ProductosPapeleria: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductoPapeleria | null>(null);
    const [formData, setFormData] = useState<Omit<ProductoPapeleria, 'id' | 'categoria'>>(initialProductState);

    const { data: productos, isLoading: isLoadingProductos } = useQuery({
        queryKey: ['productosPapeleria'],
        queryFn: () => getProductos().then(res => res.data),
        select: (data) => {
            if (!Array.isArray(data)) return [];
            return data.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

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
            queryClient.invalidateQueries({ queryKey: ['productosPapeleria'] });
            closeModal();
        },
    };

    const createMutation = useMutation<AxiosResponse<ProductoPapeleria>, AxiosError, Omit<ProductoPapeleria, 'id' | 'categoria'>>({
        mutationFn: (data) => createProducto(data),
        ...mutationConfig,
        onSuccess: (response) => {
            toast.success(`Producto "${response.data.nombre}" creado con éxito.`);
            mutationConfig.onSuccess();
        },
        onError: (error) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || error.message;
            toast.error(`Error al crear el producto: ${errorMessage}`);
        },
    });

    const updateMutation = useMutation<AxiosResponse<ProductoPapeleria>, AxiosError, ProductoPapeleria>({
        mutationFn: (data) => {
            const { id, ...rest } = data; // Destructure id from data
            return updateProducto(id, rest); // Pass rest of the data
        },
        ...mutationConfig,
        onSuccess: (response) => {
            toast.success(`Producto "${response.data.nombre}" actualizado con éxito.`);
            mutationConfig.onSuccess();
        },
        onError: (error) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || error.message;
            toast.error(`Error al actualizar el producto: ${errorMessage}`);
        },
    });

    const deleteMutation = useMutation<AxiosResponse, AxiosError, number>({
        mutationFn: (id) => deleteProducto(id),
        onSuccess: (_, id) => {
            toast.success(`Producto ID ${id} eliminado con éxito.`);
            queryClient.invalidateQueries({ queryKey: ['productosPapeleria'] });
        },
        onError: (error) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || error.message;
            toast.error(`Error al eliminar el producto: ${errorMessage}`);
        },
    });

    const openModalForCreate = () => {
        setEditingProduct(null);
        setFormData(initialProductState);
        setIsModalOpen(true);
    };

    const openModalForEdit = (product: ProductoPapeleria) => {
        setEditingProduct(product);
        setFormData({
            codigo: product.codigo,
            nombre: product.nombre,
            descripcion: product.descripcion || '',
            categoriaId: Number(product.categoriaId),
            marca: product.marca || '',
            modelo: product.modelo || '',
            unidadMedida: product.unidadMedida,
            precioCompra: Number(product.precioCompra),
            precioVenta: Number(product.precioVenta),
            margenGanancia: Number(product.margenGanancia),
            stockMinimo: Number(product.stockMinimo),
            stockActual: Number(product.stockActual),
            ubicacion: product.ubicacion || '',
            codigoBarras: product.codigoBarras || '',
            imagen: product.imagen || '',
            activo: product.activo,
            proveedorId: product.proveedorId,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const isNumber = ['precioCompra', 'precioVenta', 'stockActual', 'stockMinimo', 'margenGanancia'].includes(name);

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox
                ? (e.target as HTMLInputElement).checked
                : (name === 'categoriaId' && value === '')
                    ? null
                    : (isNumber ? Number(value) : value),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation for categoriaId
        if (!formData.categoriaId || formData.categoriaId === 0) {
            toast.error('Debe seleccionar una categoría.');
            return;
        }

        // Basic validation for codigo
        if (!formData.codigo || !formData.codigo.trim()) {
            toast.error('El código del producto es requerido.');
            return;
        }

        // Basic validation for nombre
        if (!formData.nombre || !formData.nombre.trim()) {
            toast.error('El nombre del producto es requerido.');
            return;
        }

        // Validate numeric fields
        if (formData.precioCompra < 0) {
            toast.error('El precio de compra debe ser mayor o igual a 0.');
            return;
        }

        if (formData.precioVenta <= 0) {
            toast.error('El precio de venta debe ser mayor a 0.');
            return;
        }

        if (formData.stockActual < 0) {
            toast.error('El stock actual debe ser mayor o igual a 0.');
            return;
        }

        if (formData.stockMinimo < 0) {
            toast.error('El stock mínimo debe ser mayor o igual a 0.');
            return;
        }

        // Check for duplicate codigo if creating new product
        if (!editingProduct && productos) {
            const duplicateCodigo = productos.find(p => p.codigo.toLowerCase() === formData.codigo.trim().toLowerCase());
            if (duplicateCodigo) {
                toast.error(`Ya existe un producto con el código "${formData.codigo}". Por favor, use un código diferente.`);
                return;
            }

            // Check for duplicate codigoBarras if provided
            if (formData.codigoBarras && typeof formData.codigoBarras === 'string' && formData.codigoBarras.trim()) {
                const duplicateCodigoBarras = productos.find(p => p.codigoBarras && p.codigoBarras.toLowerCase() === formData.codigoBarras?.toLowerCase());
                if (duplicateCodigoBarras) {
                    toast.error(`Ya existe un producto con el código de barras "${formData.codigoBarras}". Por favor, use un código de barras diferente.`);
                    return;
                }
            }
        }

        if (editingProduct) {
            updateMutation.mutate({ ...formData, id: editingProduct.id } as ProductoPapeleria);
        } else {
            createMutation.mutate(formData as Omit<ProductoPapeleria, 'id' | 'categoria'>);
        }
    };

    const handleDelete = useCallback(async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Estás seguro de que quieres eliminar este producto?',
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

    const columns = useMemo<ColumnDef<ProductoPapeleria>[]>(() => [
        { header: 'Código', accessorKey: 'codigo' },
        { header: 'Nombre', accessorKey: 'nombre' },
        { header: 'Categoría', accessorKey: 'categoria.nombre' },
        { header: 'Precio Venta', accessorKey: 'precioVenta', cell: ({ row }) => formatCurrency(Number(row.original.precioVenta)) },
        { header: 'Stock', accessorKey: 'stockActual' },
        { header: 'Estado', accessorKey: 'activo', cell: ({ row }) => row.original.activo ? <span className="badge active">Activo</span> : <span className="badge inactive">Inactivo</span> },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="table-actions">
                    <button onClick={() => openModalForEdit(row.original)} className="action-btn edit-btn" title="Editar">
                        <Pencil size={18} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDelete(row.original.id)} className="action-btn delete-btn" title="Eliminar">
                        <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                </div>
            ),
        },
    ], [handleDelete]);

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Productos de Papelería</h1>
                    <p>Gestiona los productos de tu papelería.</p>
                </div>
            </header>

            {isLoadingProductos ? (
                <div className="loading-message" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Cargando productos...</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={productos || []}
                    createAction={{
                        label: 'Nuevo Producto',
                        onClick: openModalForCreate,
                    }}
                />
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>Código</label>
                            <input type="text" name="codigo" value={formData.codigo} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange}></textarea>
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>Categoría</label>
                            <select name="categoriaId" value={formData.categoriaId || ''} onChange={handleChange} required disabled={isLoadingCategorias}>
                                <option value="">Seleccione una categoría</option>
                                {categorias?.map((cat: CategoriaPapeleria) => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Unidad de Medida</label>
                            <select name="unidadMedida" value={formData.unidadMedida} onChange={handleChange} required>
                                <option value="">Seleccione unidad</option>
                                <option value="unidad">Unidad</option>
                                <option value="paquete">Paquete</option>
                                <option value="caja">Caja</option>
                                <option value="resma">Resma</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid-3">
                        <div className="form-group">
                            <label>Precio de Compra</label>
                            <input type="number" name="precioCompra" value={formData.precioCompra} onChange={handleChange} step="0.01" required />
                        </div>
                        <div className="form-group">
                            <label>Precio de Venta</label>
                            <input type="number" name="precioVenta" value={formData.precioVenta} onChange={handleChange} step="0.01" required />
                        </div>
                        <div className="form-group">
                            <label>Margen de Ganancia (%)</label>
                            <input type="number" name="margenGanancia" value={formData.margenGanancia} onChange={handleChange} step="0.01" required />
                        </div>
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>Stock Actual</label>
                            <input type="number" name="stockActual" value={formData.stockActual} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Stock Mínimo</label>
                            <input type="number" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} required />
                        </div>
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

export default ProductosPapeleria;
