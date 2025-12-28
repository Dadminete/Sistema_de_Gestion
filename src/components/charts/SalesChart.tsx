import React from 'react';
import './SalesChart.css';
import type { EarlyPayer } from '@/services/cajaService';

interface SalesChartProps {
  data: EarlyPayer[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  };

  return (
    <div className="sales-chart-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--colors-text-primary)' }}>
        Top Clientes Cumplidos
        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 400, color: 'var(--colors-text-secondary)' }}>
          Pagos realizados antes de su día de facturación
        </span>
      </h3>

      <div className="early-payers-list" style={{ flex: 1, overflowY: 'auto' }}>
        {data.length > 0 ? (
          data.map((payer, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: index < data.length - 1 ? '1px solid var(--colors-divider)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--colors-primary-light)',
                  color: index < 3 ? '#fff' : 'var(--colors-primary-contrast)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  marginRight: '10px'
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{payer.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--colors-text-secondary)' }}>
                    {payer.count} facturas pagadas anticipadamente
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--colors-success-main)' }}>
                {formatCurrency(payer.total)}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--colors-text-secondary)' }}>
            No hay datos disponibles este año.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesChart;
