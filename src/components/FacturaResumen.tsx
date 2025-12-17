import React from 'react';
import { DollarSign } from 'lucide-react';
import { formatearMoneda } from '../utils/facturaUtils';
import './FacturaResumen.css';

interface FacturaResumenProps {
  subtotal: number;
  descuento: number;
  itbis: number;
  onItbisChange: (value: number) => void;
}

const FacturaResumen: React.FC<FacturaResumenProps> = ({
  subtotal,
  descuento,
  itbis,
  onItbisChange
}) => {
  const total = subtotal - descuento + itbis;

  return (
    <div className="factura-resumen">
      <div className="resumen-header">
        <DollarSign size={20} />
        <h3>Resumen Financiero</h3>
      </div>

      <div className="resumen-content">
        <div className="resumen-row">
          <label>Subtotal:</label>
          <span className="monto">{formatearMoneda(subtotal)}</span>
        </div>

        <div className="resumen-row">
          <label>Descuento:</label>
          <span className="monto descuento">-{formatearMoneda(descuento)}</span>
        </div>

        <div className="resumen-row itbis-row">
          <label>ITBIS (18%):</label>
          <div className="itbis-input-wrapper">
            <span className="currency">RD$</span>
            <input
              type="number"
              value={itbis}
              onChange={(e) => onItbisChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="itbis-input"
            />
          </div>
        </div>

        <div className="resumen-divider"></div>

        <div className="resumen-row total-row">
          <label>TOTAL:</label>
          <span className="monto total">{formatearMoneda(total)}</span>
        </div>
      </div>


    </div>
  );
};

export default FacturaResumen;
