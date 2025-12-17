import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProductos, type ProductoPapeleria } from '@/services/papeleriaApi';
import './ProductSearchModal.css';

interface ProductSearchModalProps {
  onSelectProduct: (product: ProductoPapeleria) => void;
  onClose: () => void;
}

const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ onSelectProduct, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['productos'],
    queryFn: () => getProductos().then(res => res.data),
  });

  const filteredProducts = products?.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Buscar Producto</h3>
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="product-list">
          {isLoading && <p>Cargando productos...</p>}
          {error && <p>Error al cargar productos.</p>}
          {filteredProducts?.map(product => (
            <div key={product.id} className="product-list-item" onClick={() => onSelectProduct(product)}>
              <span className="product-name">{product.nombre}</span>
              <span className="product-price">${Number(product.precioVenta).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
