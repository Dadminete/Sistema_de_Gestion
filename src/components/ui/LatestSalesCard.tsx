import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InfoCard from '@/components/ui/InfoCard';
import { getVentas, type VentaPapeleria } from '@/services/papeleriaApi';
import './LatestSalesCard.css';

const LatestSalesCard: React.FC = () => {
  const [latestSales, setLatestSales] = useState<VentaPapeleria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestSales = async () => {
      try {
        setLoading(true);
        const response = await getVentas();
        // Sort sales by date in descending order and take the top 5
        const sortedSales = response.data.sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime());
        setLatestSales(sortedSales.slice(0, 5));
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar las últimas ventas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestSales();
  }, []);

  const handleRowClick = (ventaId: string) => {
    navigate(`/papeleria/listado?edit=${ventaId}`);
  };

  if (loading) {
    return (
      <InfoCard title="Últimas Ventas">
        <div className="p-4 text-slate-400">Cargando...</div>
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard title="Últimas Ventas">
        <div className="p-4 text-red-400">{error}</div>
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Últimas Ventas">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="p-3 font-medium">N° Venta</th>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {latestSales.map((sale) => (
              <tr
                key={sale.id}
                onClick={() => handleRowClick(sale.id)}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <td className="p-3 text-slate-400">{sale.numeroVenta}</td>
                <td className="p-3 text-slate-200">{sale.clienteNombre || 'N/A'}</td>
                <td className="p-3 text-right text-slate-200 font-medium">${Number(sale.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
};

export default LatestSalesCard;
