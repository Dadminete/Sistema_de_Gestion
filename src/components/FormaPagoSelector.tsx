import React, { useState, useEffect } from 'react';
import { CreditCard, Building2 } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import './FormaPagoSelector.css';

interface CuentaBancaria {
  id: string;
  numeroCuenta: string;
  tipoCuenta: string;
  bank: {
    nombre: string;
  };
}

interface Caja {
  id: string;
  nombre: string;
}

interface FormaPagoSelectorProps {
  formaPago: string;
  cuentaId?: string;
  cajaId?: string;
  onChange: (formaPago: string, cuentaId?: string, cajaId?: string) => void;
}

const FormaPagoSelector: React.FC<FormaPagoSelectorProps> = ({
  formaPago,
  cuentaId,
  onChange
}) => {
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(false);
  const [cajaPrincipal, setCajaPrincipal] = useState<string | undefined>();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Cargar cuentas bancarias
      const cuentasResponse: any = await apiClient.get('/contabilidad/cuentas-bancarias');
      const cuentasData = Array.isArray(cuentasResponse) ? cuentasResponse : (cuentasResponse.data || []);
      setCuentasBancarias(cuentasData.filter((c: any) => c.activo));

      // Cargar cajas
      const cajasResponse: any = await apiClient.get('/cajas');
      const cajasData = Array.isArray(cajasResponse) ? cajasResponse : (cajasResponse.data || []);
      setCajas(cajasData.filter((c: any) => c.activa));

      // Buscar la Caja Principal
      const principal = cajasData.find((c: any) => c.nombre === 'Caja Principal' || c.tipo === 'general');
      if (principal) {
        setCajaPrincipal(principal.id);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormaPagoChange = (tipo: string) => {
    if (tipo === 'caja') {
      onChange(tipo, undefined, cajaPrincipal);
    } else {
      onChange(tipo, undefined, undefined);
    }
  };

  const handleCuentaChange = (cuentaIdSeleccionada: string) => {
    onChange('transferencia', cuentaIdSeleccionada, undefined);
  };

  return (
    <div className="forma-pago-selector">
      <div className="selector-header">
        <CreditCard size={20} />
        <h3>Forma de Pago</h3>
      </div>

      <div className="forma-pago-options">
        <div
          className={`pago-option ${formaPago === 'caja' ? 'selected' : ''}`}
          onClick={() => handleFormaPagoChange('caja')}
        >
          <input
            type="radio"
            name="formaPago"
            value="caja"
            checked={formaPago === 'caja'}
            onChange={() => handleFormaPagoChange('caja')}
          />
          <div className="option-content">
            <CreditCard size={24} />
            <div className="option-text">
              <div className="option-title">Caja Principal</div>
              <div className="option-description">Pago en efectivo</div>
            </div>
          </div>
        </div>

        <div
          className={`pago-option ${formaPago === 'transferencia' ? 'selected' : ''}`}
          onClick={() => handleFormaPagoChange('transferencia')}
        >
          <input
            type="radio"
            name="formaPago"
            value="transferencia"
            checked={formaPago === 'transferencia'}
            onChange={() => handleFormaPagoChange('transferencia')}
          />
          <div className="option-content">
            <Building2 size={24} />
            <div className="option-text">
              <div className="option-title">Transferencia Bancaria</div>
              <div className="option-description">Pago por banco</div>
            </div>
          </div>
        </div>
      </div>

      {formaPago === 'transferencia' && (
        <div className="cuenta-selector">
          <label>Seleccionar Cuenta Bancaria:</label>
          <select
            value={cuentaId || ''}
            onChange={(e) => handleCuentaChange(e.target.value)}
            className="cuenta-select"
            disabled={loading}
          >
            <option value="">-- Seleccione una cuenta --</option>
            {cuentasBancarias.map(cuenta => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.bank.nombre} - {cuenta.numeroCuenta} ({cuenta.tipoCuenta})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default FormaPagoSelector;
