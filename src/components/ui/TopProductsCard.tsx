import React, { useState, useEffect } from 'react';
import InfoCard from '@/components/ui/InfoCard';
import { getVentas, getProductoById } from '@/services/papeleriaApi';
import './TopProductsCard.css';

interface TopProduct {
  id: number;
  name: string;
  sold: number;
}

const TopProductsCard: React.FC = () => {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        // Fetch all sales
        const ventasResponse = await getVentas();
        const ventas = ventasResponse.data;

        // Count product sales
        const productSales: Record<number, { name: string; count: number }> = {};

        // Process each sale
        for (const venta of ventas) {
          for (const detalle of venta.detalles) {
            const productId = Number(detalle.productoId); // Ensure number
            const quantity = detalle.cantidad;

            if (!productSales[productId]) {
              // Fetch product name if not already fetched
              try {
                const productResponse = await getProductoById(productId);
                const product = productResponse.data;
                productSales[productId] = { name: product.nombre, count: 0 };
              } catch (error) {
                // Fallback to name from detalle if available
                productSales[productId] = { name: detalle.nombreProducto || `Producto ${productId}`, count: 0 };
              }
            }

            productSales[productId].count += quantity;
          }
        }

        // Convert to array and sort by sold count
        const topProductsArray = Object.entries(productSales)
          .map(([id, data]) => ({
            id: parseInt(id),
            name: data.name,
            sold: data.count
          }))
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 5); // Top 5 products

        setTopProducts(topProductsArray);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar los productos más vendidos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  if (loading) {
    return (
      <InfoCard title="Top Productos Más Vendidos">
        <div className="p-4 text-slate-400">Cargando...</div>
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard title="Top Productos Más Vendidos">
        <div className="p-4 text-red-400">{error}</div>
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Top Productos Más Vendidos">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="p-3 font-medium">N°</th>
              <th className="p-3 font-medium">Producto</th>
              <th className="p-3 font-medium text-right">Vendidos</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => (
              <tr key={product.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="p-3 text-slate-400">{index + 1}</td>
                <td className="p-3 text-slate-200">{product.name}</td>
                <td className="p-3 text-right text-slate-200 font-medium">{product.sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
};

export default TopProductsCard;
