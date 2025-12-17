import React, { useState, useEffect } from 'react';
import InfoCard from '@/components/ui/InfoCard';
import { getProductos, type ProductoPapeleria } from '@/services/papeleriaApi';
import './LowStockCard.css';

const LowStockCard: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<ProductoPapeleria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        setLoading(true);
        const response = await getProductos();
        // Filter products with low stock (stockActual < stockMinimo)
        const lowStock = response.data
          .filter(product => product.activo && product.stockActual < product.stockMinimo)
          .sort((a, b) => a.stockActual - b.stockActual) // Sort by stock level (lowest first)
          .slice(0, 5); // Top 5 low stock products

        setLowStockProducts(lowStock);
        setError(null);
      } catch (err) {
        setError('No se pudo cargar el inventario con stock bajo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockProducts();
  }, []);

  if (loading) {
    return (
      <InfoCard title="Stock Bajo">
        <div className="p-4 text-slate-400">Cargando...</div>
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard title="Stock Bajo">
        <div className="p-4 text-red-400">{error}</div>
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Stock Bajo">
      <ul className="divide-y divide-slate-800">
        {lowStockProducts.map((product) => (
          <li key={product.id} className="py-3 flex justify-between items-center hover:bg-slate-800/50 px-2 rounded transition-colors">
            <span className="text-slate-200 font-medium">{product.nombre}</span>
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold">Stock: {product.stockActual}</span>
              <span className="text-slate-500 text-sm">(Mín: {product.stockMinimo})</span>
            </div>
          </li>
        ))}
        {lowStockProducts.length === 0 && (
          <li className="py-4 text-center text-slate-500">
            No hay productos con stock bajo.
          </li>
        )}
      </ul>
    </InfoCard>
  );
};

export default LowStockCard;
