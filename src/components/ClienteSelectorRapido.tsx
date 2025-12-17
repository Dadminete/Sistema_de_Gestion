import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User, Phone, Hash, CheckCircle, Calendar } from 'lucide-react';
import { clientService } from '../services/clientService';
import './ClienteSelector.css';

interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  codigoCliente: string;
  telefono?: string;
  email?: string;
  estado?: string;
  suscripciones?: Array<{
    id: string;
    diaFacturacion: number;
    estado: string;
    servicio?: {
      nombre: string;
    };
  }>;
}

interface ClienteSelectorRapidoProps {
  onClienteSelect: (cliente: Cliente | null) => void;
  clienteId?: string;
  placeholder?: string;
  disabled?: boolean;
}

const ClienteSelectorRapido: React.FC<ClienteSelectorRapidoProps> = ({ 
  onClienteSelect, 
  clienteId, 
  placeholder = "Buscar cliente por nombre, código o teléfono...",
  disabled = false
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Refs para timeout y debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Función de búsqueda optimizada
  const buscarClientes = useCallback(async (query: string) => {
    try {
      // Cancelar búsqueda anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setSearching(true);
      setSearchError(null);

      console.log('🔍 Iniciando búsqueda rápida:', query);

      // Usar el nuevo endpoint de búsqueda rápida
      const response = await clientService.searchClients(query, {
        status: 'activo',
        limit: 50
      });

      // Verificar si la búsqueda fue cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const data: Cliente[] = Array.isArray(response) ? response : (response.data || []);
      console.log('✅ Resultados de búsqueda rápida:', data.length);

      setClientes(data);
      setShowDropdown(data.length > 0);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log('🚫 Búsqueda cancelada');
        return;
      }

      console.error('❌ Error en búsqueda rápida:', error);
      setSearchError(error.message || 'Error al buscar clientes');
      setClientes([]);
      setShowDropdown(true); // Mostrar dropdown con error
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSearchError(null);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    console.log('🔍 Término de búsqueda:', value);

    // Si la búsqueda está vacía, limpiar resultados
    if (value.trim() === '') {
      setClientes([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }

    // Validar longitud mínima de búsqueda
    if (value.trim().length < 2) {
      setClientes([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }

    // Implementar debounce
    searchTimeoutRef.current = setTimeout(() => {
      buscarClientes(value.trim());
    }, 300);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    console.log('🎯 Cliente seleccionado:', cliente.nombre, cliente.apellidos);
    setSelectedCliente(cliente);
    setSearchTerm(`${cliente.nombre} ${cliente.apellidos}`);
    setShowDropdown(false);
    setClientes([]);
    onClienteSelect(cliente);
  };

  const handleClear = () => {
    // Cancelar búsqueda en curso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSelectedCliente(null);
    setSearchTerm('');
    setClientes([]);
    setShowDropdown(false);
    setSearching(false);
    setSearchError(null);
    onClienteSelect(null);
  };

  const handleBlur = () => {
    // Delay para permitir click en dropdown
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // Cargar cliente inicial si se proporciona ID
  useEffect(() => {
    if (clienteId && !selectedCliente) {
      const loadInitialClient = async () => {
        try {
          setLoading(true);
          const client = await clientService.getClientById(clienteId);
          if (client) {
            setSelectedCliente(client);
            setSearchTerm(`${client.nombre} ${client.apellidos}`);
          }
        } catch (error) {
          console.error('Error cargando cliente inicial:', error);
        } finally {
          setLoading(false);
        }
      };

      loadInitialClient();
    }
  }, [clienteId, selectedCliente]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getClienteDiaFacturacion = (cliente: Cliente): number[] => {
    if (!cliente.suscripciones) return [];
    return cliente.suscripciones
      .filter(s => s.estado?.toLowerCase() === 'activo')
      .map(s => s.diaFacturacion)
      .filter((dia, index, array) => array.indexOf(dia) === index)
      .sort((a, b) => a - b);
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
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
            onBlur={handleBlur}
            className={`search-input ${searching ? 'searching' : ''}`}
            disabled={disabled || loading}
          />
          {searching && (
            <div className="search-spinner" style={{
              position: 'absolute',
              right: selectedCliente ? '35px' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              border: '2px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}>
            </div>
          )}
          {selectedCliente && (
            <button onClick={handleClear} className="clear-btn" disabled={disabled}>
              ✕
            </button>
          )}
        </div>

        {showDropdown && clientes.length > 0 && (
          <div className="dropdown-list">
            {clientes.slice(0, 10).map(cliente => {
              const diasFacturacion = getClienteDiaFacturacion(cliente);
              return (
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
                      {diasFacturacion.length > 0 && (
                        <span className="dia-facturacion">
                          <Calendar size={14} />
                          Paga día {diasFacturacion.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {clientes.length > 10 && (
              <div className="dropdown-item no-results">
                +{clientes.length - 10} resultados más. Refine su búsqueda.
              </div>
            )}
          </div>
        )}

        {showDropdown && clientes.length === 0 && !searching && (
          <div className="dropdown-list">
            <div className="dropdown-item no-results">
              {searchError ? (
                <span style={{ color: '#ef4444' }}>
                  ⚠️ {searchError}
                </span>
              ) : searchTerm.trim().length < 2 ? (
                'Escriba al menos 2 caracteres para buscar'
              ) : (
                'No se encontraron clientes'
              )}
            </div>
          </div>
        )}

        {showDropdown && searching && (
          <div className="dropdown-list">
            <div className="dropdown-item no-results">
              <span style={{ color: '#6b7280' }}>
                🔍 Buscando clientes...
              </span>
            </div>
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
            {getClienteDiaFacturacion(selectedCliente).length > 0 && (
              <div className="info-row">
                <label>Días de Pago:</label>
                <span>{getClienteDiaFacturacion(selectedCliente).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <span>Cargando cliente...</span>
        </div>
      )}
    </div>
  );
};

export default ClienteSelectorRapido;