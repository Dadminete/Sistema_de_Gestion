import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVentaById, updateVenta, getProductos, type VentaPapeleria, type ProductoPapeleria, type DetalleVenta } from '@/services/papeleriaApi';
import ProductSearchModal from './ProductSearchModal';
import toast from 'react-hot-toast';
import './VentaEditModal.css';

interface VentaEditModalProps {
  ventaId: string;
  onClose: () => void;
}

const VentaEditModal: React.FC<VentaEditModalProps> = ({ ventaId, onClose }) => {
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState<Partial<VentaPapeleria>>({ clienteNombre: '', metodoPago: '', detalles: [] });

  const { data: venta, isLoading, error } = useQuery({
    queryKey: ['venta', ventaId],
    queryFn: () => getVentaById(ventaId).then(res => res.data),
    enabled: !!ventaId,
  });

  useEffect(() => {
    if (venta) {
      setFormData({
        clienteNombre: venta.clienteNombre || '',
        metodoPago: venta.metodoPago || '',
        detalles: venta.detalles || [],
      });
    }
  }, [venta]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: { id: string; data: Partial<VentaPapeleria> }) => 
      updateVenta(updatedData.id, updatedData.data),
    onSuccess: () => {
      toast.success('Venta actualizada con éxito');
      queryClient.invalidateQueries({ queryKey: ['ventasPapeleria'] });
      queryClient.invalidateQueries({ queryKey: ['venta', ventaId] });
      onClose();
    },
    onError: (err) => {
      toast.error(`Error al actualizar la venta: ${err.message}`);
    },
  });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (index: number, newQuantity: number) => {
    const updatedDetalles = [...(formData.detalles || [])];
    const detalle = updatedDetalles[index];

    // Update quantity
    detalle.cantidad = newQuantity;

    // Recalculate totals
    const subtotal = updatedDetalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);
    const total = subtotal - (formData.descuentos || 0);

    setFormData(prev => ({
      ...prev,
      detalles: updatedDetalles,
      subtotal,
      total,
    }));
  };

  const handleAddProduct = (product: ProductoPapeleria) => {
    const newDetail: DetalleVenta = {
      productoId: product.id,
      nombreProducto: product.nombre,
      cantidad: 1, // Default quantity
      precioUnitario: product.precioVenta,
    };

    const updatedDetalles = [...(formData.detalles || []), newDetail];
    const subtotal = updatedDetalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);
    const total = subtotal - (formData.descuentos || 0);

    setFormData(prev => ({
      ...prev,
      detalles: updatedDetalles,
      subtotal,
      total,
    }));

    setIsSearching(false); // Close search modal after adding
  };

  const handleDeleteItem = (index: number) => {
    const updatedDetalles = [...(formData.detalles || [])].filter((_, i) => i !== index);

    // Recalculate totals
    const subtotal = updatedDetalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);
    const total = subtotal - (formData.descuentos || 0);

    setFormData(prev => ({
      ...prev,
      detalles: updatedDetalles,
      subtotal,
      total,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ id: ventaId, data: formData });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isSearching && <ProductSearchModal onSelectProduct={handleAddProduct} onClose={() => setIsSearching(false)} />}
        <h2>Editar Venta #{venta?.numeroVenta}</h2>
        {isLoading && <p>Cargando datos de la venta...</p>}
        {error && <p className="error-message">No se pudieron cargar los datos.</p>}
        {venta && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="clienteNombre">Nombre del Cliente</label>
              <input
                type="text"
                id="clienteNombre"
                name="clienteNombre"
                value={formData.clienteNombre}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="metodoPago">Método de Pago</label>
              <select
                id="metodoPago"
                name="metodoPago"
                value={formData.metodoPago}
                onChange={handleChange}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <h4>Artículos de la Venta</h4>
              <div className="sale-details-editor">
                {formData.detalles?.map((detalle, index) => (
                  <div key={index} className="sale-detail-item">
                    <span className="item-name">{detalle.nombreProducto || `Producto ID: ${detalle.productoId}`}</span>
                    <input
                      type="number"
                      min="1"
                      value={detalle.cantidad}
                      onChange={(e) => handleDetailChange(index, parseInt(e.target.value, 10) || 1)}
                      className="item-quantity"
                    />
                    <button type="button" onClick={() => handleDeleteItem(index)} className="btn-delete-item">
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-add-item" onClick={() => setIsSearching(true)}>
                  <span className="material-icons">add</span> Agregar Artículo
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
              <button type="submit" className="btn-save" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VentaEditModal;
