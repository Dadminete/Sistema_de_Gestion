import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Hash, CheckCircle } from 'lucide-react';
import { clientService } from '../services/clientService';
import './ClienteSelector.css';

interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  codigoCliente: string;
  telefono?: string;
  email?: string;
}

interface ClienteSelectorProps {
  onClienteSelect: (cliente: Cliente | null) => void;
  clienteId?: string;
}

const ClienteSelector: React.FC<ClienteSelectorProps> = ({ onClienteSelect, clienteId }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (clienteId && clientes.length > 0) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setSelectedCliente(cliente);
        setSearchTerm(`${cliente.nombre} ${cliente.apellidos}`);
      }
    }
  }, [clienteId, clientes]);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response: any = await clientService.getClients({ limit: 1000 });
      // Handle response format (array or object with clients property)
      const data = Array.isArray(response) ? response : (response.clients || response.data || []);

      // Filtrar solo clientes activos
      const clientesActivos = data.filter((c: any) => c.estado === 'activo');
      setClientes(clientesActivos);
      setFilteredClientes(clientesActivos);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(true);

    if (value.trim() === '') {
      setFilteredClientes(clientes);
      return;
    }

    const filtered = clientes.filter(cliente =>
      `${cliente.nombre} ${cliente.apellidos}`.toLowerCase().includes(value.toLowerCase()) ||
      cliente.codigoCliente.toLowerCase().includes(value.toLowerCase()) ||
      cliente.telefono?.includes(value)
    );

    setFilteredClientes(filtered);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setSearchTerm(`${cliente.nombre} ${cliente.apellidos}`);
    setShowDropdown(false);
    onClienteSelect(cliente);
  };

  const handleClear = () => {
    setSelectedCliente(null);
    setSearchTerm('');
    setFilteredClientes(clientes);
    onClienteSelect(null);
  };

  return (
    <div className="cliente-selector">
      <div className="selector-header">
        <User size={20} />
        <h3>Seleccionar Cliente</h3>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, código o teléfono..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="search-input"
          />
          {selectedCliente && (
            <button onClick={handleClear} className="clear-btn">
              ✕
            </button>
          )}
        </div>

        {showDropdown && filteredClientes.length > 0 && (
          <div className="dropdown-list">
            {filteredClientes.slice(0, 10).map(cliente => (
              <div
                key={cliente.id}
                className="dropdown-item"
                onClick={() => handleSelectCliente(cliente)}
              >
                <div className="cliente-info">
                  <div className="cliente-nombre">
                    {cliente.nombre} {cliente.apellidos}
                  </div>
                  <div className="cliente-detalles">
                    <span className="codigo">
                      <Hash size={14} />
                      {cliente.codigoCliente}
                    </span>
                    {cliente.telefono && (
                      <span className="telefono">
                        <Phone size={14} />
                        {cliente.telefono}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCliente && (
        <div className="cliente-seleccionado">
          <div className="seleccionado-header">
            <CheckCircle size={18} color="#10b981" />
            <span>Cliente Seleccionado</span>
          </div>
          <div className="seleccionado-info">
            <div className="info-row">
              <label>Nombre:</label>
              <span>{selectedCliente.nombre} {selectedCliente.apellidos}</span>
            </div>
            <div className="info-row">
              <label>Código:</label>
              <span>{selectedCliente.codigoCliente}</span>
            </div>
            {selectedCliente.telefono && (
              <div className="info-row">
                <label>Teléfono:</label>
                <span>{selectedCliente.telefono}</span>
              </div>
            )}
            {selectedCliente.email && (
              <div className="info-row">
                <label>Email:</label>
                <span>{selectedCliente.email}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteSelector;
