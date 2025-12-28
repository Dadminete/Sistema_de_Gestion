import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Pencil, Ban, User, Phone, MapPin, Wallet, PlayCircle, FileText, Cpu, StickyNote, Mail, Globe, Home, Landmark, CreditCard, Router, Wifi, RefreshCw, AlertCircle, IdCard, Clock } from 'lucide-react';
import { clientService } from '../services/clientService';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import type { ClienteWithRelations } from '../types/database';
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
  suscripciones: any[];
  equipos: any[];
  facturas: any[];
}

const ClientesListado: React.FC = () => {
  const [clients, setClients] = useState<ClienteWithRelations[]>([]);
  const [clientSuscripciones, setClientSuscripciones] = useState<Map<string, any[]>>(new Map());
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClienteWithRelations | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<ClientDetails | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [formInitialData, setFormInitialData] = useState<Partial<ClientFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await clientService.getClients({ status: 'activo' });
        // Ordenar alfabéticamente por nombre y apellidos
        const sortedClients = response.data.sort((a: any, b: any) => {
          const nameA = `${a.nombre || ''} ${a.apellidos || ''}`.toLowerCase().trim();
          const nameB = `${b.nombre || ''} ${b.apellidos || ''}`.toLowerCase().trim();
          return nameA.localeCompare(nameB, 'es');
        });
        setClients(sortedClients);

        // Fetch all suscripciones at once (more efficient)
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

        console.log('=== INICIANDO FETCH DE TODAS LAS SUSCRIPCIONES ===');
        console.log('API Base URL:', baseUrl);

        const susRes = await fetch(`${baseUrl}/suscripciones`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!susRes.ok) {
          console.warn(`Error fetching all subscriptions: ${susRes.status} ${susRes.statusText}`);
          setClientSuscripciones(new Map());
          setLoading(false);
          return;
        }

        const allSuscripciones = await susRes.json();
        console.log('Total suscripciones obtenidas:', allSuscripciones.length);
        console.log('Primeras 3 suscripciones:', allSuscripciones.slice(0, 3));

        // Create a map of suscripciones by cliente id
        const susMap = new Map<string, any[]>();
        allSuscripciones.forEach((sus: any) => {
          const clienteId = sus.cliente?.id;
          if (clienteId) {
            if (!susMap.has(clienteId)) {
              susMap.set(clienteId, []);
            }
            susMap.get(clienteId)!.push(sus);
            if (sus.cliente.nombre === 'Alberto' || sus.cliente.nombre.toLowerCase().includes('alberto')) {
              console.log(`🔍 ALBERTO - Agregada suscripción:`, {
                id: sus.id,
                numeroContrato: sus.numeroContrato,
                precioMensual: sus.precioMensual,
                servicio: sus.servicio?.nombre,
                plan: sus.plan?.nombre,
                estado: sus.estado
              });
            }
          }
        });

        console.log('=== MAPEO COMPLETADO ===');
        console.log('Clientes con suscripciones:', susMap.size);
        susMap.forEach((sus: any[], clienteId: string) => {
          const totalCliente = sus.reduce((sum: number, s: any) => sum + Number(s.precioMensual), 0);
          const clientName = sus[0]?.cliente?.nombre;
          if (clientName === 'Alberto' || clientName?.toLowerCase().includes('alberto')) {
            console.log(`🔍 ALBERTO TOTAL:`, {
              clientId: clienteId,
              totalSuscripciones: sus.length,
              detalles: sus.map((s: any) => ({
                id: s.id,
                numeroContrato: s.numeroContrato,
                precioMensual: Number(s.precioMensual),
                servicio: s.servicio?.nombre,
                plan: s.plan?.nombre
              })),
              totalCalculado: totalCliente
            });
          } else {
            console.log(`  ${clienteId}: ${sus.length} suscripciones = RD$ ${totalCliente}`);
          }
        });

        setClientSuscripciones(susMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Real-time updates hook
  const reloadClients = async () => {
    try {
      const response = await clientService.getClients({ status: 'activo' });
      // Ordenar alfabéticamente por nombre y apellidos
      const sortedClients = response.data.sort((a: any, b: any) => {
        const nameA = `${a.nombre || ''} ${a.apellidos || ''}`.toLowerCase().trim();
        const nameB = `${b.nombre || ''} ${b.apellidos || ''}`.toLowerCase().trim();
        return nameA.localeCompare(nameB, 'es');
      });
      setClients(sortedClients);

      // Re-fetch suscripciones
      // Get dynamic API base URL
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        setClientSuscripciones(susMap);
      }
    } catch (error) {
      console.error('Error reloading clients:', error);
    }
  };

  const handleRealTimeUpdate = React.useCallback((event: any) => {
    console.log('Real-time event received:', event);
    if (event.entityType === 'cliente' || event.entityType === 'suscripcion') {
      // Recargar datos cuando hay cambios en clientes o suscripciones
      reloadClients();
    }
  }, []); // reloadClients is defined inside component but doesn't change often if defined correctly, 
  // but here reloadClients is defined inside component without useCallback. 
  // Ideally reloadClients should also be wrapped in useCallback, but for now let's fix the immediate loop.
  // Actually, reloadClients IS defined inside component and depends on state setters. 
  // Let's wrap reloadClients in useCallback first or just suppress dependency warning if we want to be quick, 
  // but better to do it right. 
  // Wait, reloadClients is NOT wrapped in useCallback in the original code.
  // I will wrap reloadClients in useCallback as well in a separate edit or just leave it as is 
  // because the hook fix (using refs) already prevents the loop even if the callback changes.
  // However, passing a stable callback is still better.
  // For this step, I will just define the handler.

  useRealTimeUpdates(handleRealTimeUpdate, undefined, undefined, undefined, undefined, ['cliente', 'suscripcion']);

  const handleCreate = () => {
    setEditingClient(null);
    setFormInitialData(undefined);
    setShowModal(true);
  };

  const handleViewDetails = async (client: ClienteWithRelations) => {
    try {
      setLoading(true);
      setError(null);

      // Get dynamic API base URL
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

      // Fetch detailed client information
      const [suscripcionesResponse, equiposResponse, facturasResponse] = await Promise.all([
        fetch(`${baseUrl}/suscripciones`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
          },
        }).then(res => res.json()).catch(() => []),
        fetch(`${baseUrl}/equipos-cliente`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
          },
        }).then(res => res.json()).catch(() => []),
        fetch(`${baseUrl}/facturas?clienteId=${client.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
          },
        }).then(res => res.json()).catch(() => [])
      ]);

      // Filter data for this client
      const clientSuscripciones = suscripcionesResponse.filter((sus: any) => sus.cliente?.id === client.id);
      const clientEquipos = equiposResponse.filter((equipo: any) => equipo.clienteId === client.id);

      // Extract facturas array from response object
      const clientFacturas = Array.isArray(facturasResponse)
        ? facturasResponse
        : (facturasResponse?.facturas || []);

      setSelectedClientDetails({
        cliente: client,
        suscripciones: clientSuscripciones,
        equipos: clientEquipos,
        facturas: clientFacturas
      });

      setActiveTab('personal');
      setShowDetailsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalles del cliente');
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

  const handleDelete = async (id: string) => {
    const clientToUpdate = clients.find(client => client.id === id);
    if (!clientToUpdate) return;

    const { value: formValues } = await Swal.fire({
      title: 'Cambiar Estado del Cliente',
      html:
        `<div style="display: flex; flex-direction: column; gap: 1.5rem; padding: 0.5rem; text-align: left;">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label for="swal-status" style="font-weight: 600; color: var(--colors-text-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">
              <Info size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
              Nuevo Estado:
            </label>
            <select id="swal-status" class="swal2-select" style="
              width: 100%;
              padding: 0.75rem 1rem;
              border: 2px solid var(--colors-divider);
              border-radius: 8px;
              font-size: 1rem;
              background-color: var(--colors-background-default);
              color: var(--colors-text-primary);
              cursor: pointer;
              transition: all 0.2s ease;
            ">
              <option value="Inactivo">🔴 Inactivo</option>
              <option value="Cancelar">❌ Cancelar</option>
              <option value="Suspendido">⏸️ Suspendido</option>
            </select>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label for="swal-reason" style="font-weight: 600; color: var(--colors-text-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">
              <FileEdit size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
              Motivo del cambio:
            </label>
            <textarea id="swal-reason" class="swal2-textarea" placeholder="Escriba aquí el motivo del cambio de estado (mínimo 10 caracteres)..." style="
              width: 100%;
              min-height: 120px;
              padding: 0.75rem 1rem;
              border: 2px solid var(--colors-divider);
              border-radius: 8px;
              font-size: 0.95rem;
              background-color: var(--colors-background-default);
              color: var(--colors-text-primary);
              resize: vertical;
              font-family: inherit;
              line-height: 1.5;
              transition: all 0.2s ease;
            "></textarea>
            <small style="color: var(--colors-text-secondary); font-size: 0.85rem; margin-top: 0.25rem;">
              💡 Este motivo quedará registrado en las notas del cliente
            </small>
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '💾 Guardar Cambios',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#4a69bb',
      cancelButtonColor: '#6c757d',
      width: '600px',
      customClass: {
        container: 'swal-container-custom',
        popup: 'swal-popup-custom',
        title: 'swal-title-custom',
        htmlContainer: 'swal-html-custom'
      },
      didOpen: () => {
        // Agregar estilos de foco a los inputs
        const select = document.getElementById('swal-status') as HTMLSelectElement;
        const textarea = document.getElementById('swal-reason') as HTMLTextAreaElement;

        if (select) {
          select.addEventListener('focus', () => {
            select.style.borderColor = 'var(--colors-primary-main)';
            select.style.boxShadow = '0 0 0 3px rgba(74, 105, 187, 0.1)';
          });
          select.addEventListener('blur', () => {
            select.style.borderColor = 'var(--colors-divider)';
            select.style.boxShadow = 'none';
          });
        }

        if (textarea) {
          textarea.addEventListener('focus', () => {
            textarea.style.borderColor = 'var(--colors-primary-main)';
            textarea.style.boxShadow = '0 0 0 3px rgba(74, 105, 187, 0.1)';
          });
          textarea.addEventListener('blur', () => {
            textarea.style.borderColor = 'var(--colors-divider)';
            textarea.style.boxShadow = 'none';
          });
        }
      },
      preConfirm: () => {
        const status = (document.getElementById('swal-status') as HTMLSelectElement).value;
        const reason = (document.getElementById('swal-reason') as HTMLTextAreaElement).value;
        if (!reason || reason.trim().length < 10) {
          Swal.showValidationMessage('⚠️ El motivo es obligatorio y debe tener al menos 10 caracteres.');
          return false;
        }
        if (!status) {
          Swal.showValidationMessage('⚠️ Por favor, seleccione un estado.');
          return false;
        }
        return { status, reason: reason.trim() };
      }
    });

    if (formValues) {
      const { status, reason } = formValues;

      const newNote = `**Estado cambiado a: ${status}**
**Fecha:** ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
**Motivo:** ${reason}
---------------------------------
${clientToUpdate.notas || ''}`;

      try {
        setLoading(true);
        setError(null);

        // Here we assume `updateClient` can handle changing the status and adding notes.
        // This is more flexible than `deleteClient`.
        await clientService.updateClient(id, { estado: status, notas: newNote });

        // Remove the client from the list of active clients
        setClients(clients.filter((client) => client.id !== id));

        Swal.fire({
          title: '¡Actualizado!',
          text: `El cliente ha sido marcado como '${status}'.`,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

      } catch (err) {
        setError(`Error cambiando el estado del cliente a '${status}'`);
        console.error('Error updating client status:', err);
        Swal.fire(
          'Error Inesperado',
          'Hubo un problema al actualizar el estado del cliente. Por favor, intente de nuevo.',
          'error'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      if (editingClient) {
        const updatedClient = await clientService.updateClient(editingClient.id, data);
        setClients(clients.map((client) => (client.id === editingClient.id ? updatedClient : client)));
      } else {
        const createdClient = await clientService.createClient(data);
        setClients([...clients, createdClient]);
      }

      setShowModal(false);
      setEditingClient(null);
    } catch (err) {
      setError(editingClient ? 'Error updating client' : 'Error creating client');
      console.error('Error saving client:', err);
      // Re-throw error to be caught by the form component
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<ClienteWithRelations>[] = useMemo(() => [
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
            <User size={24} strokeWidth={2.5} style={{ color: 'var(--colors-text-secondary)' }} />
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
      cell: ({ row }) => {
        const suscripciones = clientSuscripciones.get(row.original.id) || [];
        let totalPrecio = 0;

        if (suscripciones.length === 0) {
          return (
            <span style={{ fontWeight: '600', color: 'var(--colors-text-secondary)' }}>
              {formatearMonto(0)}
            </span>
          );
        }

        suscripciones.forEach((sus: any) => {
          // Try different property names for price
          const precioMensual = Number(sus.precioMensual) || 0;
          const precio = Number(sus.precio) || 0;
          const precioPrecioMensual = precioMensual > 0 ? precioMensual : precio;

          totalPrecio += precioPrecioMensual;
        });

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
            <Eye size={18} strokeWidth={2.5} />
          </button>
          <button className="action-btn edit-btn" onClick={() => handleEdit(row.original)} title="Editar">
            <Pencil size={18} strokeWidth={2.5} />
          </button>
          <button className="action-btn delete-btn" onClick={() => handleDelete(row.original.id)} title="Suspender Cliente">
            <Ban size={18} strokeWidth={2.5} />
          </button>
        </div>
      ),
    },
  ], [clientSuscripciones]);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb"><h1>Gestión Clientes</h1></div>
          <p>Administra los clientes del sistema.</p>
        </div>
        <div className="header-right">
          {/* The create button is now part of the DataTable component */}
        </div>
      </div>

      {error && (
        <div className="error-message" style={{
          backgroundColor: 'var(--colors-error-main)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} strokeWidth={2.5} />
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message" style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--colors-text-secondary)'
        }}>
          <RefreshCw size={32} strokeWidth={2.5} className="rotating" />
          <p>Cargando...</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={clients}
        createAction={{
          label: 'Nuevo Cliente',
          onClick: handleCreate,
        }}
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
          {/* Header con Foto */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
            {/* Foto del Cliente */}
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
                  <User size={64} strokeWidth={2} style={{ color: 'var(--colors-text-secondary)' }} />
                </div>
              )}
            </div>

            {/* Información Básica */}
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
                  <strong>Estado:</strong> <span className={`status-badge ${selectedClientDetails.cliente.estado === 'activo' ? 'success' : 'danger'}`}>{selectedClientDetails.cliente.estado}</span>
                </div>
                <div>
                  <strong>Fecha de Ingreso:</strong> {selectedClientDetails.cliente.fecha_ingreso ? new Date(selectedClientDetails.cliente.fecha_ingreso).toLocaleDateString('es-ES') : 'No especificada'}
                </div>
              </div>
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--colors-border)' }} />

          {/* Tab Navigation */}
          <div style={{ borderBottom: '1px solid var(--colors-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'min-content' }}>
              {[
                { id: 'personal', label: 'Información Personal', icon: <User size={16} strokeWidth={2.5} /> },
                { id: 'contacto', label: 'Contacto', icon: <Phone size={16} strokeWidth={2.5} /> },
                { id: 'direccion', label: 'Dirección', icon: <MapPin size={16} strokeWidth={2.5} /> },
                { id: 'financiero', label: 'Financiero', icon: <Wallet size={16} strokeWidth={2.5} /> },
                { id: 'servicios', label: 'Servicios', icon: <PlayCircle size={16} strokeWidth={2.5} /> },
                { id: 'facturas', label: 'Facturas', icon: <FileText size={16} strokeWidth={2.5} /> },
                { id: 'equipos', label: 'Equipos', icon: <Cpu size={16} strokeWidth={2.5} /> },
                { id: 'notas', label: 'Notas', icon: <StickyNote size={16} strokeWidth={2.5} /> }
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
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '400px' }}>
            {activeTab === 'personal' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} strokeWidth={2.5} />
                  Información Personal
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <IdCard size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                      <h4 style={{ margin: 0, color: 'var(--colors-text-primary)' }}>Identificación</h4>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div><strong>Nombre Completo:</strong> {selectedClientDetails.cliente.nombre} {selectedClientDetails.cliente.apellidos}</div>
                      <div><strong>Código Cliente:</strong> {selectedClientDetails.cliente.codigoCliente}</div>
                      <div><strong>Cédula:</strong> {selectedClientDetails.cliente.cedula || 'No especificada'}</div>
                      <div><strong>Tipo Cliente:</strong> {selectedClientDetails.cliente.tipoCliente === 'residencial' ? 'Residencial' : 'Empresarial'}</div>
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <AlertCircle size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                      <h4 style={{ margin: 0, color: 'var(--colors-text-primary)' }}>Detalles Personales</h4>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div><strong>Fecha de Ingreso:</strong> {selectedClientDetails.cliente.fecha_ingreso ? new Date(selectedClientDetails.cliente.fecha_ingreso).toLocaleDateString('es-ES') : 'No especificada'}</div>
                      <div><strong>Sexo:</strong> {selectedClientDetails.cliente.sexo === 'MASCULINO' ? 'Masculino' : selectedClientDetails.cliente.sexo === 'FEMENINO' ? 'Femenino' : selectedClientDetails.cliente.sexo === 'OTRO' ? 'Otro' : 'No especificado'}</div>
                      <div><strong>Categoría:</strong> <span className={`status-badge ${selectedClientDetails.cliente.categoria_cliente === 'VIP' ? 'success' : 'secondary'}`}>{selectedClientDetails.cliente.categoria_cliente}</span></div>
                      <div><strong>Estado:</strong> <span className={`status-badge ${selectedClientDetails.cliente.estado === 'activo' ? 'success' : 'danger'}`}>{selectedClientDetails.cliente.estado}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contacto' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={20} strokeWidth={2.5} />
                  Información de Contacto
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '8px', border: '1px solid var(--colors-border)' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--colors-primary-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={18} strokeWidth={2.5} />
                      Teléfonos
                    </h4>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                      <div><span style={{ color: 'var(--colors-text-secondary)', fontWeight: '500' }}>Principal:</span> {selectedClientDetails.cliente.telefono || '-'}</div>
                      <div><span style={{ color: 'var(--colors-text-secondary)', fontWeight: '500' }}>Secundario:</span> {selectedClientDetails.cliente.telefonoSecundario || '-'}</div>
                      <div><span style={{ color: 'var(--colors-text-secondary)', fontWeight: '500' }}>Emergencia:</span> {selectedClientDetails.cliente.telefonoEmergencia || '-'}</div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '8px', border: '1px solid var(--colors-border)' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--colors-primary-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={18} strokeWidth={2.5} />
                      Email
                    </h4>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6', wordBreak: 'break-word' }}>
                      {selectedClientDetails.cliente.email || '-'}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '8px', border: '1px solid var(--colors-border)' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--colors-primary-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={18} strokeWidth={2.5} />
                      Contacto Principal
                    </h4>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                      {selectedClientDetails.cliente.contacto || '-'}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '8px', border: '1px solid var(--colors-border)' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--colors-primary-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={18} strokeWidth={2.5} />
                      Emergencia
                    </h4>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                      <div><span style={{ color: 'var(--colors-text-secondary)', fontWeight: '500' }}>Nombre:</span> {selectedClientDetails.cliente.contactoEmergencia || '-'}</div>
                      <div><span style={{ color: 'var(--colors-text-secondary)', fontWeight: '500' }}>Teléfono:</span> {selectedClientDetails.cliente.telefonoEmergencia || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'direccion' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={20} strokeWidth={2.5} />
                  Dirección y Ubicación
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Home size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                      <h4 style={{ margin: 0, color: 'var(--colors-text-primary)' }}>Dirección Completa</h4>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div><strong>Dirección:</strong> {selectedClientDetails.cliente.direccion || 'No especificada'}</div>
                      <div><strong>Sector/Barrio:</strong> {selectedClientDetails.cliente.sector_barrio || 'No especificado'}</div>
                      <div><strong>Referencia:</strong> {selectedClientDetails.cliente.referenciaDireccion || 'No especificada'}</div>
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Globe size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                      <h4 style={{ margin: 0, color: 'var(--colors-text-primary)' }}>Ubicación Geográfica</h4>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div><strong>Ciudad:</strong> {selectedClientDetails.cliente.ciudad || 'No especificada'}</div>
                      <div><strong>Provincia:</strong> {selectedClientDetails.cliente.provincia || 'No especificada'}</div>
                      <div><strong>Código Postal:</strong> {selectedClientDetails.cliente.codigoPostal || 'No especificado'}</div>
                      {selectedClientDetails.cliente.coordenadasLat && selectedClientDetails.cliente.coordenadasLng && (
                        <div><strong>Coordenadas:</strong> {Number(selectedClientDetails.cliente.coordenadasLat)}, {Number(selectedClientDetails.cliente.coordenadasLng)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financiero' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wallet size={20} strokeWidth={2.5} />
                  Información Financiera
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--colors-success-light)', borderRadius: '12px', border: '1px solid var(--colors-success-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <CreditCard size={20} strokeWidth={2.5} style={{ color: 'var(--colors-success-dark)' }} />
                      <h4 style={{ margin: 0, color: 'var(--colors-success-dark)' }}>Límite de Crédito</h4>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--colors-success-dark)' }}>
                      RD$ {formatearMonto(Number(selectedClientDetails.cliente.limiteCrediticio || 0))}
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--colors-primary-light)', borderRadius: '12px', border: '1px solid var(--colors-primary-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Landmark size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-dark)' }} />
                      <h4 style={{ margin: 0, color: 'var(--colors-primary-dark)' }}>Crédito Disponible</h4>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--colors-primary-dark)' }}>
                      RD$ {formatearMonto(Number(selectedClientDetails.cliente.creditoDisponible || 0))}
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Clock size={20} strokeWidth={2.5} style={{ color: 'var(--colors-text-secondary)' }} />
                      <h4 style={{ margin: 0, color: 'var(--colors-text-primary)' }}>Condiciones</h4>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div><strong>Días de Crédito:</strong> {selectedClientDetails.cliente.diasCredito || 0} días</div>
                      <div><strong>Descuento (%):</strong> {Number(selectedClientDetails.cliente.descuentoPorcentaje || 0).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'servicios' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlayCircle size={20} strokeWidth={2.5} />
                  Servicios Activos ({selectedClientDetails.suscripciones.length})
                </h3>
                {selectedClientDetails.suscripciones.length > 0 ? (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--colors-primary-main)', color: 'white' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Contrato</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Servicio</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Plan</th>
                          <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Precio Mensual</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Estado</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Fecha Inicio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientDetails.suscripciones.map((suscripcion: any) => (
                          <tr key={suscripcion.id} style={{ borderBottom: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-background-paper)' }}>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '600' }}>
                              {suscripcion.numeroContrato}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Wifi size={18} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                                {suscripcion.servicio?.nombre || 'N/A'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {suscripcion.plan?.nombre || 'N/A'}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'var(--colors-success-dark)' }}>
                              {formatearMonto(Number(suscripcion.precioMensual))}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`status-badge ${suscripcion.estado === 'activo' ? 'success' : 'secondary'}`}>
                                {suscripcion.estado}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {new Date(suscripcion.fechaInicio).toLocaleDateString('es-ES')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--colors-text-secondary)', border: '2px dashed var(--colors-border)', borderRadius: '12px', backgroundColor: 'var(--colors-background-secondary)' }}>
                    <PlayCircle size={64} strokeWidth={2} style={{ marginBottom: '1rem', display: 'block', color: 'var(--colors-text-secondary)', margin: '0 auto' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--colors-text-primary)' }}>No hay servicios activos</h4>
                    <p>Este cliente no tiene suscripciones activas actualmente.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'equipos' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={20} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                  Equipos Asignados ({selectedClientDetails.equipos.length})
                </h3>
                {selectedClientDetails.equipos.length > 0 ? (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--colors-primary-main)', color: 'white' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Tipo</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Marca</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Modelo</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Número de Serie</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>IP Asignada</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Estado</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Ubicación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientDetails.equipos.map((equipo: any) => (
                          <tr key={equipo.id} style={{ borderBottom: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-background-paper)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {equipo.tipoEquipo === 'router' ? (
                                  <Router size={18} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                                ) : equipo.tipoEquipo === 'modem' ? (
                                  <Wifi size={18} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                                ) : (
                                  <Cpu size={18} strokeWidth={2.5} style={{ color: 'var(--colors-primary-main)' }} />
                                )}
                                {equipo.tipoEquipo}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', fontWeight: '500' }}>{equipo.marca}</td>
                            <td style={{ padding: '1rem' }}>{equipo.modelo}</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '600' }}>
                              {equipo.numeroSerie}
                            </td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {equipo.ipAsignada || 'No asignada'}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`status-badge ${equipo.estado === 'instalado' ? 'success' : 'secondary'}`}>
                                {equipo.estado}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>{equipo.ubicacion || 'No especificada'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--colors-text-secondary)', border: '2px dashed var(--colors-border)', borderRadius: '12px', backgroundColor: 'var(--colors-background-secondary)' }}>
                    <Cpu size={48} strokeWidth={2} style={{ marginBottom: '1rem', color: 'var(--colors-text-secondary)' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--colors-text-primary)' }}>No hay equipos asignados</h4>
                    <p>Este cliente no tiene equipos asignados actualmente.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notas' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StickyNote size={20} strokeWidth={2.5} />
                  Notas y Observaciones
                </h3>
                {selectedClientDetails.cliente.notas ? (
                  <div style={{ padding: '2rem', backgroundColor: 'var(--colors-background-secondary)', borderRadius: '12px', border: '1px solid var(--colors-border)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <FileText size={20} strokeWidth={2} style={{ color: 'var(--colors-primary-main)', marginTop: '0.25rem' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--colors-text-primary)' }}>Observaciones del Cliente</h4>
                        <div style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>
                          {selectedClientDetails.cliente.notas}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--colors-text-secondary)', border: '2px dashed var(--colors-border)', borderRadius: '12px', backgroundColor: 'var(--colors-background-secondary)' }}>
                    <StickyNote size={48} strokeWidth={2} style={{ marginBottom: '1rem', color: 'var(--colors-text-secondary)' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--colors-text-primary)' }}>Sin notas</h4>
                    <p>Este cliente no tiene notas o observaciones registradas.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'facturas' && (
              <div>
                <h3 style={{ color: 'var(--colors-primary-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} strokeWidth={2.5} />
                  Facturas ({selectedClientDetails.facturas.length})
                </h3>
                {selectedClientDetails.facturas.length > 0 ? (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--colors-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--colors-primary-main)', color: 'white' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Número Factura</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Fecha</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Monto</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Estado</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Fecha Vencimiento</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Método de Pago</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Fecha de Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientDetails.facturas.map((factura: any) => (
                          <tr key={factura.id} style={{ borderBottom: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-background-paper)' }}>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '600' }}>
                              {factura.numeroFactura}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {factura.fechaFactura ? new Date(factura.fechaFactura).toLocaleDateString('es-ES') : '-'}
                            </td>
                            <td style={{ padding: '1rem', fontWeight: '500' }}>
                              {formatearMonto(Number(factura.total || 0))}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`status-badge ${factura.estado === 'pagada' ? 'success' :
                                factura.estado === 'pendiente' ? 'warning' :
                                  factura.estado === 'anulada' ? 'danger' : 'secondary'
                                }`}>
                                {factura.estado === 'pagada' ? 'Pagada' :
                                  factura.estado === 'pendiente' ? 'Pendiente' :
                                    factura.estado === 'anulada' ? 'Anulada' : factura.estado}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toLocaleDateString('es-ES') : '-'}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {factura.pagos && factura.pagos.length > 0 ? (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {factura.pagos.map((pago: any, idx: number) => (
                                    <span key={idx} style={{
                                      padding: '0.25rem 0.5rem',
                                      backgroundColor: 'var(--colors-background-secondary)',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      border: '1px solid var(--colors-border)'
                                    }}>
                                      {pago.metodoPago === 'caja' || pago.metodoPago === 'efectivo' ? '💰 Efectivo' :
                                        pago.metodoPago === 'transferencia' ? '🏦 Transferencia' :
                                          pago.metodoPago === 'cheque' ? '📋 Cheque' : pago.metodoPago}
                                    </span>
                                  ))}
                                </div>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {factura.pagos && factura.pagos.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                                  {factura.pagos.map((pago: any, idx: number) => (
                                    <div key={idx}>
                                      {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-ES') : '-'}
                                    </div>
                                  ))}
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--colors-text-secondary)', border: '2px dashed var(--colors-border)', borderRadius: '12px', backgroundColor: 'var(--colors-background-secondary)' }}>
                    <FileText size={48} strokeWidth={2} style={{ marginBottom: '1rem', color: 'var(--colors-text-secondary)' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--colors-text-primary)' }}>Sin facturas</h4>
                    <p>Este cliente no tiene facturas registradas.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientesListado;
