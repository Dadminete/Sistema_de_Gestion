import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User, Phone, Hash, CheckCircle, Calendar, Filter, FileText, AlertTriangle, Clock, DollarSign } from 'lucide-react';
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

interface FacturaInfo {
  ultimaFactura?: {
    id: string;
    numeroFactura: string;
    fechaFactura: string;
    fechaVencimiento: string;
    total: number;
    estado: string;
    estadoReal?: string;
    montoPagado: number;
    montoPendiente?: number;
  };
  facturasPendientes: Array<{
    id: string;
    numeroFactura: string;
    fechaFactura: string;
    fechaVencimiento: string;
    total: number;
    estado: string;
    estadoReal?: string;
    montoPagado: number;
    montoPendiente: number;
    diasVencida?: number;
  }>;
  resumen: {
    totalFacturas?: number;
    totalFacturasPendientes: number;
    totalMontoPendiente: number;
    facturasVencidas?: number;
    totalMontoVencido?: number;
  };
}

interface ClienteSelectorConFiltroProps {
  onClienteSelect: (cliente: Cliente | null) => void;
  clienteId?: string;
}

const ClienteSelectorConFiltro: React.FC<ClienteSelectorConFiltroProps> = ({ onClienteSelect, clienteId }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Refs para timeout y debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtros
  const [diaFacturacion, setDiaFacturacion] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Información de facturas del cliente seleccionado
  const [facturaInfo, setFacturaInfo] = useState<FacturaInfo | null>(null);
  const [loadingFacturas, setLoadingFacturas] = useState(false);

  // Opciones comunes de días de facturación
  const diasComunes = [1, 5, 10, 15, 20, 25, 30];

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      setSearchError(null);
      
      // Limpiar timeout anterior si existe
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      const options = {
        status: 'activo' as string,
        ...(diaFacturacion && { diaFacturacion: parseInt(diaFacturacion) })
      };

      console.log('🔍 Cargando clientes con opciones:', options);
      
      // Crear promesa con timeout
      const timeoutPromise = new Promise((_, reject) => {
        loadTimeoutRef.current = setTimeout(() => {
          reject(new Error('Timeout: La consulta tardó demasiado'));
        }, 10000); // 10 segundos timeout
      });
      
      const clientsPromise = clientService.getClients(options);
      
      const response = await Promise.race([clientsPromise, timeoutPromise]);
      
      // Limpiar timeout si la consulta fue exitosa
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      // Handle response format (array or object with clients property)
      const data: Cliente[] = Array.isArray(response) ? response : (response.clients || response.data || []);
      console.log('📊 Total clientes recibidos:', data.length);

      // Filtrar solo clientes activos (por si acaso el backend no filtró correctamente)
      const clientesActivos = data.filter((c: Cliente) => c.estado?.toLowerCase() === 'activo');
      console.log('✅ Clientes activos:', clientesActivos.length);

      // Ordenar alfabéticamente por nombre y apellidos
      const clientesOrdenados = clientesActivos.sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellidos}`.toLowerCase();
        const nombreB = `${b.nombre} ${b.apellidos}`.toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
      });

      console.log('🔤 Clientes finales ordenados:', clientesOrdenados.length);

      setClientes(clientesOrdenados);
      setFilteredClientes(clientesOrdenados);
    } catch (error: any) {
      console.error('❌ Error al cargar clientes:', error);
      setSearchError(error.message || 'Error al cargar clientes');
      // En caso de error, mantener los datos anteriores si existen
      if (clientes.length === 0) {
        setFilteredClientes([]);
      }
    } finally {
      setLoading(false);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    }
  }, [diaFacturacion, clientes.length]);

  useEffect(() => {
    cargarClientes();
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [cargarClientes]);

  useEffect(() => {
    if (clienteId && clientes.length > 0) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setSelectedCliente(cliente);
        setSearchTerm(`${cliente.nombre} ${cliente.apellidos}`);
      }
    }
  }, [clienteId, clientes]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(true);
    setSearchError(null);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    console.log('🔍 Buscando:', value, 'en', clientes.length, 'clientes');

    // Si la búsqueda está vacía, mostrar todos los clientes inmediatamente
    if (value.trim() === '') {
      console.log('🔄 Restaurando todos los clientes:', clientes.length);
      setFilteredClientes(clientes);
      setSearching(false);
      return;
    }

    // Validar longitud mínima de búsqueda
    if (value.trim().length < 2) {
      console.log('⚠️ Búsqueda muy corta, esperando más caracteres...');
      setFilteredClientes([]);
      setSearching(false);
      return;
    }

    // Implementar debounce para evitar búsquedas excesivas
    setSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      try {
        const searchValue = value.toLowerCase().trim();
        
        // Verificar que aún tenemos clientes para buscar
        if (clientes.length === 0) {
          console.log('⚠️ No hay clientes cargados para buscar');
          setFilteredClientes([]);
          setSearching(false);
          return;
        }

        const filtered = clientes.filter(cliente => {
          try {
            const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellidos || ''}`.toLowerCase();
            const codigo = (cliente.codigoCliente || '').toLowerCase();
            const telefono = (cliente.telefono || '').toLowerCase();

            const match = nombreCompleto.includes(searchValue) ||
              codigo.includes(searchValue) ||
              telefono.includes(searchValue);

            return match;
          } catch (filterError) {
            console.error('Error filtrando cliente:', cliente.id, filterError);
            return false;
          }
        });

        console.log('✅ Filtrados:', filtered.length, 'clientes encontrados');
        setFilteredClientes(filtered);
        setSearching(false);
      } catch (error) {
        console.error('❌ Error durante la búsqueda:', error);
        setSearchError('Error durante la búsqueda');
        setFilteredClientes([]);
        setSearching(false);
      }
    }, 300); // Debounce de 300ms
  };

  const cargarFacturasCliente = async (clienteId: string) => {
    try {
      console.log('🔄 Cargando información de facturas para cliente:', clienteId);
      setLoadingFacturas(true);
      const info = await clientService.getClientInvoiceInfo(clienteId);
      console.log('✅ Información de facturas recibida:', info);
      setFacturaInfo(info);
    } catch (error) {
      console.error('❌ Error al cargar información de facturas:', error);
      setFacturaInfo(null);
    } finally {
      setLoadingFacturas(false);
    }
  };

  const handleSelectCliente = (cliente: Cliente) => {
    console.log('🎯 Cliente seleccionado:', cliente.nombre, cliente.apellidos, 'ID:', cliente.id);
    setSelectedCliente(cliente);
    setSearchTerm(`${cliente.nombre} ${cliente.apellidos}`);
    setShowDropdown(false);
    onClienteSelect(cliente);

    // Cargar información de facturas
    console.log('📞 Llamando cargarFacturasCliente...');
    cargarFacturasCliente(cliente.id);
  };

  const handleClear = () => {
    setSelectedCliente(null);
    setSearchTerm('');
    setFilteredClientes(clientes);
    setFacturaInfo(null);
    onClienteSelect(null);
  };

  const handleDiaFacturacionChange = (dia: string) => {
    console.log('📅 Día de facturación seleccionado:', dia);
    setDiaFacturacion(dia);

    // Siempre limpiar búsqueda y selección para mostrar todos los resultados del filtro
    setSearchTerm('');
    setSelectedCliente(null);
    setFacturaInfo(null);
    onClienteSelect(null);
    setFilteredClientes([]); // Limpiar para evitar mostrar datos anteriores mientras carga

    // Abrir dropdown automáticamente para mostrar resultados
    setShowDropdown(true);
  };

  const clearFilters = () => {
    console.log('🧹 Limpiando filtros...');
    setDiaFacturacion('');
    if (selectedCliente) {
      handleClear();
    }
  };

  const getClienteDiaFacturacion = (cliente: Cliente): number[] => {
    if (!cliente.suscripciones) return [];
    return cliente.suscripciones
      .filter(s => s.estado?.toLowerCase() === 'activo')
      .map(s => s.diaFacturacion)
      .filter((dia, index, array) => array.indexOf(dia) === index) // Únicos
      .sort((a, b) => a - b);
  };

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(monto);
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const obtenerColorEstado = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'pagada': return '#10b981';
      case 'pendiente': return '#f59e0b';
      case 'pendiente_parcial': return '#f59e0b';
      case 'vencida': return '#ef4444';
      case 'vencida_parcial': return '#dc2626';
      case 'cancelada': return '#6b7280';
      default: return '#64748b';
    }
  };

  const obtenerTextoEstado = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'pagada': return 'PAGADA';
      case 'pendiente': return 'PENDIENTE';
      case 'pendiente_parcial': return 'PAGO PARCIAL';
      case 'vencida': return 'VENCIDA';
      case 'vencida_parcial': return 'VENCIDA PARCIAL';
      case 'cancelada': return 'CANCELADA';
      default: return estado.toUpperCase();
    }
  };

  return (
    <div className="cliente-selector">
      <div className="selector-header">
        <User size={20} />
        <h3>Seleccionar Cliente</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          title="Mostrar filtros"
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="filters-section">
          <div className="filter-group">
            <label>
              <Calendar size={16} />
              Día de Facturación
            </label>
            <div className="day-filter-container">
              <select
                value={diaFacturacion}
                onChange={(e) => handleDiaFacturacionChange(e.target.value)}
                className="day-select"
              >
                <option value="">Todos los días</option>
                {diasComunes.map(dia => (
                  <option key={dia} value={dia.toString()}>
                    Día {dia}
                  </option>
                ))}
              </select>
              {diaFacturacion && (
                <button onClick={clearFilters} className="clear-filter-btn" title="Limpiar filtro">
                  ✕
                </button>
              )}
            </div>
          </div>

          {diaFacturacion && (
            <div className="filter-info">
              <span className="filter-count">
                Mostrando clientes que pagan el día {diaFacturacion} ({filteredClientes.length} encontrados)
              </span>
            </div>
          )}
        </div>
      )}

      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, código o teléfono..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className={`search-input ${searching ? 'searching' : ''}`}
            disabled={loading}
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
            <button onClick={handleClear} className="clear-btn">
              ✕
            </button>
          )}
        </div>

        {showDropdown && filteredClientes.length > 0 && (
          <div className="dropdown-list">
            {filteredClientes.map(cliente => {
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
          </div>
        )}

        {showDropdown && filteredClientes.length === 0 && !loading && !searching && (
          <div className="dropdown-list">
            <div className="dropdown-item no-results">
              {searchError ? (
                <span style={{ color: '#ef4444' }}>
                  ⚠️ {searchError}
                </span>
              ) : searchTerm.trim().length > 0 && searchTerm.trim().length < 2 ? (
                'Escriba al menos 2 caracteres para buscar'
              ) : diaFacturacion ? (
                `No hay clientes que paguen el día ${diaFacturacion}`
              ) : searchTerm.trim().length > 0 ? (
                'No se encontraron clientes con ese criterio'
              ) : (
                'No hay clientes disponibles'
              )}
            </div>
          </div>
        )}
        
        {showDropdown && (loading || searching) && (
          <div className="dropdown-list">
            <div className="dropdown-item no-results">
              <span style={{ color: '#6b7280' }}>
                🔍 {searching ? 'Buscando...' : 'Cargando clientes...'}
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

      {selectedCliente && (
        <>
          {/* Información de Facturas */}
          {loadingFacturas && (
            <div className="facturas-info loading">
              <div className="facturas-header">
                <FileText size={18} />
                <span>Información de Facturas</span>
              </div>
              <div className="loading-content">
                <span>Cargando información de facturas...</span>
              </div>
            </div>
          )}

          {facturaInfo && !loadingFacturas && (
            <div className="facturas-info">
              <div className="facturas-header">
                <FileText size={18} />
                <span>Información de Facturas</span>
              </div>
              {/* Debug info removed to fix lint error */}

              {/* Última Factura */}
              {facturaInfo.ultimaFactura && (
                <div className="ultima-factura">
                  <div className="factura-item-header">
                    <Clock size={16} />
                    <span>Última Factura</span>
                  </div>
                  <div className="factura-item">
                    <div className="factura-info-row">
                      <span className="factura-numero">#{facturaInfo.ultimaFactura.numeroFactura}</span>
                      <span
                        className="factura-estado"
                        style={{
                          color: obtenerColorEstado(facturaInfo.ultimaFactura.estadoReal || facturaInfo.ultimaFactura.estado),
                          backgroundColor: obtenerColorEstado(facturaInfo.ultimaFactura.estadoReal || facturaInfo.ultimaFactura.estado) + '20'
                        }}
                      >
                        {obtenerTextoEstado(facturaInfo.ultimaFactura.estadoReal || facturaInfo.ultimaFactura.estado)}
                      </span>
                    </div>
                    <div className="factura-info-row">
                      <span className="factura-fecha">
                        {formatearFecha(facturaInfo.ultimaFactura.fechaFactura)}
                      </span>
                      <span className="factura-monto">
                        {formatearMoneda(facturaInfo.ultimaFactura.total)}
                      </span>
                    </div>
                    {facturaInfo.ultimaFactura.montoPagado < facturaInfo.ultimaFactura.total && (
                      <div className="factura-info-row pendiente">
                        <span>Pendiente:</span>
                        <span className="monto-pendiente">
                          {formatearMoneda(facturaInfo.ultimaFactura.total - facturaInfo.ultimaFactura.montoPagado)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resumen de Facturas Pendientes */}
              {facturaInfo.resumen.totalFacturasPendientes > 0 && (
                <div className="facturas-pendientes-resumen">
                  <div className="factura-item-header warning">
                    <AlertTriangle size={16} />
                    <span>Facturas Pendientes</span>
                  </div>
                  <div className="resumen-item">
                    <div className="resumen-info">
                      <div className="resumen-left">
                        <span className="resumen-count">
                          {facturaInfo.resumen.totalFacturasPendientes} factura{facturaInfo.resumen.totalFacturasPendientes !== 1 ? 's' : ''} pendiente{facturaInfo.resumen.totalFacturasPendientes !== 1 ? 's' : ''}
                        </span>
                        {facturaInfo.resumen.facturasVencidas && facturaInfo.resumen.facturasVencidas > 0 && (
                          <span className="resumen-vencidas">
                            {facturaInfo.resumen.facturasVencidas} vencida{facturaInfo.resumen.facturasVencidas !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="resumen-right">
                        <span className="resumen-total">
                          <DollarSign size={16} />
                          {formatearMoneda(facturaInfo.resumen.totalMontoPendiente)}
                        </span>
                        {facturaInfo.resumen.totalMontoVencido && facturaInfo.resumen.totalMontoVencido > 0 && (
                          <span className="resumen-vencido">
                            Vencido: {formatearMoneda(facturaInfo.resumen.totalMontoVencido)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Facturas Pendientes (máximo 3) */}
              {facturaInfo.facturasPendientes.length > 0 && (
                <div className="facturas-pendientes-detalle">
                  <div className="facturas-pendientes-lista">
                    {facturaInfo.facturasPendientes.slice(0, 3).map(factura => (
                      <div key={factura.id} className={`factura-pendiente-item ${factura.diasVencida && factura.diasVencida > 0 ? 'vencida' : ''}`}>
                        <div className="factura-info-row">
                          <span className="factura-numero">#{factura.numeroFactura}</span>
                          <span
                            className="factura-estado-small"
                            style={{ color: obtenerColorEstado(factura.estadoReal || factura.estado) }}
                          >
                            {obtenerTextoEstado(factura.estadoReal || factura.estado)}
                          </span>
                        </div>
                        <div className="factura-info-row">
                          <span className="factura-vencimiento">
                            {factura.fechaVencimiento ? (
                              factura.diasVencida && factura.diasVencida > 0 ?
                                `Vencida hace ${factura.diasVencida} día${factura.diasVencida !== 1 ? 's' : ''}` :
                                `Vence: ${formatearFecha(factura.fechaVencimiento)}`
                            ) : 'Sin fecha límite'}
                          </span>
                          <span className="monto-pendiente">
                            {formatearMoneda(factura.montoPendiente)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {facturaInfo.facturasPendientes.length > 3 && (
                      <div className="mas-facturas">
                        +{facturaInfo.facturasPendientes.length - 3} facturas más...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="loading-indicator">
          <span>Cargando clientes...</span>
        </div>
      )}
    </div>
  );
};

export default ClienteSelectorConFiltro;