import React, { useState, useEffect, useMemo } from 'react';
import { clientService } from '../services/clientService';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import type { ClienteWithRelations, SuscripcionWithRelations } from '../types/database';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import ClienteForm, { type ClientFormData } from '../components/feature/ClienteForm';
import { formatearMonto } from '../utils/montoUtils';
import { isoToDDMMYYYY } from '../utils/dateUtils';
import './Users.css';
import Swal from 'sweetalert2';

interface ClientDetails {
  cliente: ClienteWithRelations;
  suscripciones: SuscripcionWithRelations[];
  equipos: any[];
}

interface ClienteDisplayData extends ClienteWithRelations {
  precioMensualCalculado?: number;
}

const ClientesInactivos: React.FC = () => {
  const [clients, setClients] = useState<ClienteWithRelations[]>([]);
  const [displayData, setDisplayData] = useState<ClienteDisplayData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClienteWithRelations | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<ClientDetails | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [formInitialData, setFormInitialData] = useState<Partial<ClientFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch clientes with status 'inactivo' or 'suspendido' (separated by comma)
      const response = await clientService.getClients({ status: 'inactivo,suspendido' });
      const sortedClients = response.data.sort((a: any, b: any) => {
        const nameA = `${a.nombre || ''} ${a.apellidos || ''}`.toLowerCase().trim();
        const nameB = `${b.nombre || ''} ${b.apellidos || ''}`.toLowerCase().trim();
        return nameA.localeCompare(nameB, 'es');
      });
      setClients(sortedClients);

      // Fetch suscripciones for price calculation
      const getAPIBaseURL = () => {
        const envUrl = import.meta.env.VITE_API_BASE_URL;
        if (envUrl && envUrl.trim()) {
          return envUrl.replace(/\/$/, '');
        }
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol.replace(':', '');
        return `${protocol}://${hostname}${port}/api`;
      };
      const baseUrl = getAPIBaseURL();
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const susRes = await fetch(`${baseUrl}/suscripciones`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (susRes.ok) {
        const allSuscripciones = await susRes.json();
        const susMap = new Map<string, any[]>();
        allSuscripciones.forEach((sus: any) => {
          const clienteId = sus.cliente?.id;
          if (clienteId) {
            if (!susMap.has(clienteId)) {
              susMap.set(clienteId, []);
            }
            susMap.get(clienteId)!.push(sus);
          }
        });

        // Calculate prices and create display data
        const displayDataWithPrices: ClienteDisplayData[] = sortedClients.map((client: any) => {
          const suscripciones = susMap.get(client.id) || [];
          const totalPrecio = suscripciones.reduce((sum: number, s: any) => sum + Number(s.precioMensual || 0), 0);
          return { ...client, precioMensualCalculado: totalPrecio };
        });

        setDisplayData(displayDataWithPrices);
      } else {
        setDisplayData(sortedClients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRealTimeUpdate = React.useCallback(() => {
    fetchData();
  }, []);

  useRealTimeUpdates(handleRealTimeUpdate);

  const handleViewDetails = async (client: ClienteWithRelations) => {
    try {
      setLoading(true);
      setError(null);

      const getAPIBaseURL = () => {
        const envUrl = import.meta.env.VITE_API_BASE_URL;
        if (envUrl && envUrl.trim()) {
          return envUrl.replace(/\/$/, '');
        }
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol.replace(':', '');
        return `${protocol}://${hostname}${port}/api`;
      };
      const baseUrl = getAPIBaseURL();
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const [suscripcionesResponse, equiposResponse] = await Promise.all([
        fetch(`${baseUrl}/suscripciones?clienteId=${client.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : []),
        fetch(`${baseUrl}/equipos-cliente?clienteId=${client.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : [])
      ]);

      setSelectedClientDetails({
        cliente: client,
        suscripciones: suscripcionesResponse,
        equipos: equiposResponse,
      });

      setActiveTab('personal');
      setShowDetailsModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar detalles del cliente';
      setError(errorMessage);
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: ClienteWithRelations) => {
    setEditingClient(client);
    const initialData: Partial<ClientFormData> = {
      nombre: client.nombre || '',
      apellidos: client.apellidos || '',
      cedula: client.cedula || '',
      fecha_ingreso: client.fecha_ingreso ? isoToDDMMYYYY(client.fecha_ingreso.toString()) : '',
      sexo: client.sexo || '',
      telefono: client.telefono || '',
      telefono_secundario: client.telefonoSecundario || '',
      email: client.email || '',
      contacto: client.contacto || '',
      contacto_emergencia: client.contactoEmergencia || '',
      telefono_emergencia: client.telefonoEmergencia || '',
      direccion: client.direccion || '',
      sector_barrio: client.sector_barrio || '',
      ciudad: client.ciudad || '',
      provincia: client.provincia || '',
      codigo_postal: client.codigoPostal || '',
      coordenadas_lat: client.coordenadasLat ? client.coordenadasLat.toString() : '',
      coordenadas_lng: client.coordenadasLng ? client.coordenadasLng.toString() : '',
      referencia_direccion: client.referenciaDireccion || '',
      tipo_cliente: client.tipoCliente || 'residencial',
      categoria_cliente: (client.categoria_cliente as 'NUEVO' | 'VIEJO' | 'VIP' | 'INACTIVO') || 'NUEVO',
      estado: client.estado || 'activo',
      limite_crediticio: client.limiteCrediticio ? Number(client.limiteCrediticio) : 0,
      dias_credito: client.diasCredito || 0,
      descuento_porcentaje: client.descuentoPorcentaje ? Number(client.descuentoPorcentaje) : 0,
      referido_por: client.referidoPorId || '',
      notas: client.notas || '',
      foto_url: client.fotoUrl || '',
    };
    setFormInitialData(initialData);
    setShowModal(true);
  };

  const handleReactivate = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea reactivar este cliente?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await clientService.updateClient(id, { estado: 'ACTIVO' });
      await fetchData();
      Swal.fire('Reactivado', 'El cliente ha sido reactivado exitosamente.', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo reactivar el cliente.';
      setError(errorMessage);
      console.error('Error reactivating client:', err);
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      setLoading(true);
      if (editingClient) {
        await clientService.updateClient(editingClient.id, data);
      } else {
        await clientService.createClient(data);
      }
      await fetchData();
      setShowModal(false);
      setEditingClient(null);
    } catch (err) {
      const errorMessage = editingClient ? 'Error al actualizar el cliente' : 'Error al crear el cliente';
      setError(errorMessage);
      console.error('Error saving client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<ClienteDisplayData>[] = useMemo(() => [
    {
      accessorKey: 'fotoUrl',
      header: 'Foto',
      cell: ({ row }) => (
        row.original.fotoUrl ? (
          <img
            src={row.original.fotoUrl}
            alt={`${row.original.nombre} ${row.original.apellidos}`}
            style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--colors-border)' }}
          />
        ) : (
          <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: 'var(--colors-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--colors-border)' }}>
            <span className="material-icons" style={{ fontSize: '1.5rem', color: 'var(--colors-text-secondary)' }}>person</span>
          </div>
        )
      ),
    },
    { accessorKey: 'nombre', header: 'Nombre' },
    { accessorKey: 'apellidos', header: 'Apellidos' },
    { accessorKey: 'telefono', header: 'Teléfono' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`status-badge status-${row.original.estado?.toLowerCase()}`}>
          {row.original.estado}
        </span>
      ),
    },
    {
      accessorKey: 'fecha_ingreso',
      header: 'Fecha de Ingreso',
      cell: ({ row }) => (
        <span>{row.original.fecha_ingreso ? new Date(row.original.fecha_ingreso).toLocaleDateString('es-ES') : 'N/A'}</span>
      ),
    },
    {
      id: 'precioMensual',
      header: 'Deuda/Servicios',
      accessorKey: 'precioMensualCalculado',
      cell: ({ row }) => {
        const totalPrecio = row.original.precioMensualCalculado || 0;
        return (
          <span style={{ fontWeight: '600', color: totalPrecio > 0 ? 'var(--colors-error-main)' : 'var(--colors-text-secondary)' }}>
            {formatearMonto(totalPrecio)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="table-actions">
          <button className="action-btn view-btn" onClick={() => handleViewDetails(row.original)} title="Ver Detalles">
            <span className="material-icons">visibility</span>
          </button>
          <button className="action-btn edit-btn" onClick={() => handleEdit(row.original)} title="Editar">
            <span className="material-icons">edit</span>
          </button>
          <button className="action-btn reactivate-btn" onClick={() => handleReactivate(row.original.id)} title="Reactivar Cliente">
            <span className="material-icons">restore</span>
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb"><h1>Clientes Inactivos</h1></div>
          <p>Administra los clientes inactivos, suspendidos y cancelados.</p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ backgroundColor: 'var(--colors-error-main)', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={displayData}
      />

      {showModal && (
        <Modal
          title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          size="xlarge"
        >
          <ClienteForm
            initialData={formInitialData}
            onSubmit={handleSave}
            onCancel={() => setShowModal(false)}
            isEditing={!!editingClient}
          />
        </Modal>
      )}

      {showDetailsModal && selectedClientDetails && (
        <Modal
          title={`Detalles del Cliente: ${selectedClientDetails.cliente.nombre} ${selectedClientDetails.cliente.apellidos}`}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          size="xxxlarge"
        >
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              {selectedClientDetails.cliente.fotoUrl ? (
                <img
                  src={selectedClientDetails.cliente.fotoUrl}
                  alt={`${selectedClientDetails.cliente.nombre} ${selectedClientDetails.cliente.apellidos}`}
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    border: '3px solid var(--colors-primary-main)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--colors-background-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid var(--colors-primary-main)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '4rem', color: 'var(--colors-text-secondary)' }}>person</span>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 1rem 0', color: 'var(--colors-text-primary)' }}>
                {selectedClientDetails.cliente.nombre} {selectedClientDetails.cliente.apellidos}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong>Código Cliente:</strong> {selectedClientDetails.cliente.codigoCliente}
                </div>
                <div>
                  <strong>Cédula:</strong> {selectedClientDetails.cliente.cedula || 'No especificada'}
                </div>
                <div>
                  <strong>Tipo Cliente:</strong> {selectedClientDetails.cliente.tipoCliente === 'residencial' ? 'Residencial' : 'Empresarial'}
                </div>
                <div>
                  <strong>Categoría:</strong> <span className={`status-badge ${selectedClientDetails.cliente.categoria_cliente === 'VIP' ? 'success' : 'secondary'}`}>{selectedClientDetails.cliente.categoria_cliente}</span>
                </div>
                <div>
                  <strong>Estado:</strong> <span className={`status-badge status-${selectedClientDetails.cliente.estado?.toLowerCase()}`}>{selectedClientDetails.cliente.estado}</span>
                </div>
                <div>
                  <strong>Fecha de Ingreso:</strong> {selectedClientDetails.cliente.fecha_ingreso ? new Date(selectedClientDetails.cliente.fecha_ingreso).toLocaleDateString('es-ES') : 'No especificada'}
                </div>
              </div>
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--colors-border)' }} />

          <div style={{ borderBottom: '1px solid var(--colors-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'min-content' }}>
              {[
                { id: 'personal', label: 'Información Personal', icon: 'person' },
                { id: 'contacto', label: 'Contacto', icon: 'contact_phone' },
                { id: 'direccion', label: 'Dirección', icon: 'location_on' },
                { id: 'financiero', label: 'Financiero', icon: 'account_balance_wallet' },
                { id: 'servicios', label: 'Servicios', icon: 'subscriptions' },
                { id: 'equipos', label: 'Equipos', icon: 'devices' },
                { id: 'notas', label: 'Notas', icon: 'notes' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    backgroundColor: activeTab === tab.id ? 'var(--colors-primary-main)' : 'var(--colors-background-secondary)',
                    color: activeTab === tab.id ? 'white' : 'var(--colors-text-primary)',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '1rem' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '1rem', minHeight: '300px' }}>
            Contenido de la pestaña: {activeTab}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientesInactivos;