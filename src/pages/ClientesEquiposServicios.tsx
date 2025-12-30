import React, { useState, useEffect, useMemo } from 'react';
import { clientService } from '../services/clientService';
import { servicioService } from '../services/servicioService';
import { planService } from '../services/planService';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import type { ClienteWithRelations } from '../types/database';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { formatearMonto } from '../utils/montoUtils';
import './ClientesEquiposServicios.css';
import Swal from 'sweetalert2';

// Get dynamic API base URL
const getAPIBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, '');
  }
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  return `${protocol}://${hostname}${port}`;
};

const RAW_API_BASE = getAPIBaseURL();
const API_BASE = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : `${RAW_API_BASE.replace(/\/$/, '')}/api`;

interface ServicioFormData {
  numeroContrato: string;
  contratoId: string;
  servicioId: string;
  planId?: string;
  usuarioRegistroId: string;
  fechaInicio: Date;
  fechaVencimiento?: Date;
  fechaInstalacion?: Date;
  estado: string;
  prioridad?: string;
  precioMensual: number;
  precioInstalacion: number;
  descuentoAplicado: number;
  costoAdicional: number;
  diaFacturacion: number;
  fechaProximoPago?: Date;
  metodoFacturacion?: string;
  velocidadContratada?: string;
  ipEstatica?: string;
  macAddressCliente?: string;
  notasInstalacion?: string;
  notasServicio?: string;
  notasCancelacion?: string;
  motivoSuspension?: string;
}

interface EquipoFormData {
  datosClienteId: string;
  suscripcionId?: string;
  contratoId?: string;
  tipoEquipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  macAddress?: string;
  ipAsignada?: string;
  estado: string;
  fechaInstalacion?: Date;
  fechaRetiro?: Date;
  ubicacion?: string;
  notas?: string;
}

interface SuscripcionDisplay {
  id: string;
  numeroContrato: string;
  precioMensual: number;
  fechaInicio: string;
  estado?: string;
  descuentoAplicado?: number;
  diaFacturacion?: number;
  notasInstalacion?: string;
  notasServicio?: string;
  cliente?: {
    id?: string;
    nombre?: string;
    apellidos?: string;
    codigoCliente?: string;
    fechaSuscripcion?: string;
  };
  servicio?: {
    id?: string;
    nombre?: string;
    precio?: number;
  };
  plan?: {
    id?: string;
    nombre?: string;
  };
}

interface EquipoDisplay {
  id: string;
  tipoEquipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  macAddress?: string;
  ipAsignada?: string;
  estado: string;
  fechaInstalacion?: string;
  ubicacion?: string;
  cliente?: {
    id?: string;
    nombre?: string;
    apellidos?: string;
    codigoCliente?: string;
  };
  suscripcion?: {
    id?: string;
    numeroContrato?: string;
  };
}

const ClientesEquiposServicios: React.FC = () => {
  const [clients, setClients] = useState<ClienteWithRelations[]>([]);
  const [servicios, setServicios] = useState<{ id: string; nombre: string; precioBase?: number }[]>([]);
  const [planes, setPlanes] = useState<{ id: string; nombre: string; precio: number; bajadaMbps?: number }[]>([]);
  const [suscripciones, setSuscripciones] = useState<SuscripcionDisplay[]>([]);
  const [equipos, setEquipos] = useState<EquipoDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [editingSuscripcionId, setEditingSuscripcionId] = useState<string | null>(null);
  const [editingEquipoId, setEditingEquipoId] = useState<string | null>(null);

  // Form states
  const [servicioForm, setServicioForm] = useState<ServicioFormData>({
    numeroContrato: '',
    contratoId: '',
    servicioId: '',
    planId: '',
    usuarioRegistroId: '',
    fechaInicio: new Date(),
    estado: 'pendiente',
    precioMensual: 0,
    precioInstalacion: 0,
    descuentoAplicado: 0,
    costoAdicional: 0,
    diaFacturacion: 1,
    notasInstalacion: '',
    notasServicio: '',
  });
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<{ id: string; nombre: string; precio: number }[]>([]);

  const [equipoForm, setEquipoForm] = useState<EquipoFormData>({
    datosClienteId: '',
    tipoEquipo: 'router',
    marca: '',
    modelo: '',
    numeroSerie: '',
    macAddress: '',
    ipAsignada: '',
    estado: 'instalado',
    ubicacion: '',
    notas: '',
  });

  // Estado para suscripciones seleccionadas (checkbox)
  const [suscripcionesSeleccionadasIds, setSuscripcionesSeleccionadasIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clientsResponse, serviciosResponse, planesResponse, suscripcionesData, equiposData] = await Promise.all([
          clientService.getClients().catch(() => {
            console.error('Error loading clients');
            return { data: [] };
          }),
          servicioService.getServicios().then(res => {
            console.log('Servicios response:', res);
            return res.data || res;
          }).catch((err) => {
            console.error('Error loading servicios:', err);
            return [];
          }),
          planService.getPlanes().then(res => {
            console.log('Planes response:', res);
            return res.data || res;
          }).catch((err) => {
            console.error('Error loading planes:', err);
            return [];
          }),
          fetch(`${API_BASE}/suscripciones`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
            },
          }).then(res => res.json()).catch((err) => {
            console.error('Error loading suscripciones:', err);
            return [];
          }),
          fetch(`${API_BASE}/equipos-cliente`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
            },
          }).then(res => res.json()).catch((err) => {
            console.error('Error loading equipos:', err);
            return [];
          })
        ]);

        console.log('Final data:', {
          clients: clientsResponse.data?.length || 0,
          servicios: serviciosResponse?.length || 0,
          planes: planesResponse?.length || 0,
          suscripciones: suscripcionesData?.length || 0,
          equipos: equiposData?.length || 0
        });

        const clientsData = ((clientsResponse.data as ClienteWithRelations[]) || []).filter(client => {
          // Only include active clients - exclude: inactivo, cancelado, suspendido
          const estado = (client.estado || '').toLowerCase();
          return estado === 'activo';
        });
        const activeClientIds = new Set(clientsData.map(c => c.id));

        setClients(clientsData.sort((a, b) => `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`, 'es')));
        setServicios((serviciosResponse || []).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')));
        setPlanes((planesResponse || []).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')));

        // Filter suscripciones to only include those from active clients
        const activeSuscripciones = (suscripcionesData || []).filter((sus: any) => {
          const isActive = sus.cliente?.id && activeClientIds.has(sus.cliente.id);
          if (!isActive) {
            console.log('Filtering out suscripcion for inactive client:', sus.cliente?.nombre, sus.cliente?.apellidos, 'estado:', sus.cliente?.estado);
          }
          return isActive;
        });
        setSuscripciones(activeSuscripciones.sort((a: SuscripcionDisplay, b: SuscripcionDisplay) => `${a.cliente?.nombre || ''} ${a.cliente?.apellidos || ''}`.localeCompare(`${b.cliente?.nombre || ''} ${b.cliente?.apellidos || ''}`, 'es')));

        // Filter equipos to only include those from active clients
        const activeEquipos = (equiposData || []).filter((equipo: EquipoDisplay) => {
          const isActive = equipo.cliente?.id && activeClientIds.has(equipo.cliente.id);
          return isActive;
        });
        setEquipos(activeEquipos.sort((a: any, b: any) => `${a.cliente?.nombre || ''} ${a.cliente?.apellidos || ''}`.localeCompare(`${b.cliente?.nombre || ''} ${b.cliente?.apellidos || ''}`, 'es')));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRealTimeUpdate = React.useCallback(() => {
    // Fetch data is defined inside useEffect, so we need to refetch manually
    window.location.reload();
  }, []);

  useRealTimeUpdates(handleRealTimeUpdate);

  // Function to calculate monthly price
  const calculateMonthlyPrice = (servicioId: string, planId: string): number => {
    let total = 0;

    // Add service price if selected
    if (servicioId && servicioId.trim()) {
      const selectedService = servicios.find(s => s.id === servicioId);
      if (selectedService) {
        total += Number(selectedService.precioBase) || 0;
      }
    }

    // Add plan price if selected
    if (planId && planId.trim()) {
      const selectedPlan = planes.find(p => p.id === planId);
      if (selectedPlan) {
        total += Number(selectedPlan.precio) || 0;
      }
    }

    return isNaN(total) ? 0 : total;
  };

  // Update precioMensual whenever the selected services, plan or discount change
  useEffect(() => {
    // Get plan price as a number, ensure it's always a number
    let planPrice = 0;
    if (servicioForm.planId && servicioForm.planId.trim()) {
      const plan = planes.find(p => p.id === servicioForm.planId);
      if (plan) {
        planPrice = Number(plan.precio) || 0;
      }
    }

    // Get services total - ensure all prices are converted to numbers
    let servicesTotal = 0;
    for (const servicio of serviciosSeleccionados) {
      const precio = Number(servicio.precio);
      if (!isNaN(precio)) {
        servicesTotal += precio;
      }
    }

    // Sum both prices (number + number = number)
    const rawTotal = planPrice + servicesTotal;

    // Apply discount
    const discountPercentage = Number(servicioForm.descuentoAplicado) || 0;
    const discounted = rawTotal * (1 - (discountPercentage / 100));

    // Convert to fixed 2 decimals and then to number
    const finalPrice = Number(discounted.toFixed(2));

    setServicioForm(prev => ({
      ...prev,
      precioMensual: isNaN(finalPrice) ? 0 : finalPrice
    }));
  }, [serviciosSeleccionados, servicioForm.planId, servicioForm.descuentoAplicado, planes]);

  // Date formatting helper: dd/mm/yyyy
  const formatDateDDMMYYYY = (date?: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const parseDDMMYYYYToDate = (value: string) => {
    const parts = value.split('/').map(p => parseInt(p, 10));
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const handleServicioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (!servicioForm.contratoId) {
        throw new Error('Debe seleccionar un cliente');
      }

      if (!servicioForm.fechaInicio) {
        throw new Error('La fecha de inicio es requerida');
      }

      if (serviciosSeleccionados.length === 0 && !servicioForm.planId) {
        throw new Error('Debe seleccionar al menos un servicio o un plan');
      }

      // Get current user ID from token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      let usuarioRegistroId = '';

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          usuarioRegistroId = payload.id || '';
        } catch (err) {
          console.warn('Could not extract user ID from token');
        }
      }

      // CHECK: Verificar si el cliente ya tiene una suscripción activa
      const clienteId = servicioForm.contratoId;
      const suscripcionesExistentes = suscripciones.filter(
        sus => sus.cliente?.id === clienteId && sus.estado !== 'cancelada' && sus.estado !== 'suspendida'
      );

      console.log(`Cliente ${clienteId}: ${suscripcionesExistentes.length} suscripción(es) existente(s)`, suscripcionesExistentes);

      // Si hay suscripción existente y NO estamos en modo edición, preguntar si actualizar
      if (suscripcionesExistentes.length > 0 && !editingSuscripcionId) {
        const result = await Swal.fire({
          title: '¿Actualizar suscripción existente?',
          text: `⚠️ Este cliente ya tiene ${suscripcionesExistentes.length} suscripción(es) activa(s).\n\n¿Desea actualizar la suscripción existente en lugar de crear una nueva?\n\nOpciones:\n- OK: Actualizar la suscripción existente\n- Cancelar: Crear una nueva suscripción`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Actualizar existente',
          cancelButtonText: 'Crear nueva'
        });

        if (result.isConfirmed) {
          // Actualizar la primera suscripción existente
          setEditingSuscripcionId(suscripcionesExistentes[0].id);
          console.log('Modo: Actualizar suscripción existente', suscripcionesExistentes[0].id);
          // Return para que se recalcule y se use el modo edición
          setLoading(false);
          return;
        }
      }

      // Prepare data for server - usar el precio calculado correctamente del formulario
      const submissionDataList = [];

      // Usar el precioMensual ya calculado en el useEffect que suma todos los servicios + plan
      // y aplica el descuento correctamente
      const precioMensualFinal = Number(servicioForm.precioMensual.toFixed(2));

      // Si hay servicios seleccionados Y/O plan, crear UNA sola suscripción con el precio total
      if (serviciosSeleccionados.length > 0 || servicioForm.planId) {
        // Determinar el servicioId principal (el primero si hay múltiples)
        const servicioIdPrincipal = serviciosSeleccionados.length > 0 ? serviciosSeleccionados[0].id : null;

        submissionDataList.push({
          clienteId: servicioForm.contratoId,
          servicioId: servicioIdPrincipal,
          planId: servicioForm.planId || null,
          fechaInicio: servicioForm.fechaInicio.toISOString().split('T')[0],
          precioMensual: precioMensualFinal,
          descuentoAplicado: servicioForm.descuentoAplicado,
          diaFacturacion: servicioForm.diaFacturacion,
          notasInstalacion: servicioForm.notasInstalacion || null,
          notasServicio: servicioForm.notasServicio || null,
          usuarioRegistroId: usuarioRegistroId || '',
        });
      }

      console.log('Sending data to server:', submissionDataList);

      const isEditing = !!editingSuscripcionId;

      if (isEditing) {
        // Si estamos editando, actualizar la suscripción existente
        const method = 'PUT';
        const url = `${API_BASE}/suscripciones/${editingSuscripcionId}`;

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(submissionDataList[0]),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          throw new Error(errorData.error || 'Error al actualizar suscripción');
        }

        const result = await response.json();
        console.log('Suscripción actualizada:', result);
      } else {
        // Si estamos creando, crear múltiples suscripciones en paralelo
        const responses = await Promise.all(
          submissionDataList.map(data =>
            fetch(`${API_BASE}/suscripciones`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(data),
            })
          )
        );

        // Verificar que todas las respuestas fueron exitosas
        for (const response of responses) {
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error response:', errorData);
            throw new Error(errorData.error || 'Error al crear suscripciones');
          }
        }

        const results = await Promise.all(responses.map(r => r.json()));
        console.log('Suscripciones creadas:', results);
      }

      // Refresh subscriptions list
      const suscripcionesData = await fetch(`${API_BASE}/suscripciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(res => res.json());
      const activeClientIds = new Set(clients.map(c => c.id));
      const filteredSuscripciones = (suscripcionesData || []).filter((sus: any) =>
        sus.cliente?.id && activeClientIds.has(sus.cliente.id)
      );
      setSuscripciones(filteredSuscripciones);

      setShowServicioModal(false);
      setEditingSuscripcionId(null);
      setServiciosSeleccionados([]);
      setServicioForm({
        numeroContrato: '',
        contratoId: '',
        servicioId: '',
        planId: '',
        usuarioRegistroId: '',
        fechaInicio: new Date(),
        estado: 'pendiente',
        precioMensual: 0,
        precioInstalacion: 0,
        descuentoAplicado: 0,
        costoAdicional: 0,
        diaFacturacion: 1,
        notasInstalacion: '',
        notasServicio: '',
      });

      // Show success message
      Swal.fire('Éxito', `${serviciosSeleccionados.length > 1 ? `${serviciosSeleccionados.length} Suscripciones creadas` : 'Suscripción ' + (isEditing ? 'actualizada' : 'creada')} exitosamente`, 'success');
    } catch (err) {
      console.error(`Error ${editingSuscripcionId ? 'updating' : 'creating'} subscription:`, err);
      setError(err instanceof Error ? err.message : `Error al ${editingSuscripcionId ? 'actualizar' : 'crear'} suscripción`);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (!equipoForm.datosClienteId) {
        throw new Error('Debe seleccionar un cliente');
      }

      if (!equipoForm.tipoEquipo || !equipoForm.marca || !equipoForm.modelo || !equipoForm.numeroSerie) {
        throw new Error('Tipo de equipo, marca, modelo y número de serie son requeridos');
      }

      // Prepare data for server
      const submissionData = {
        clienteId: equipoForm.datosClienteId,
        tipoEquipo: equipoForm.tipoEquipo,
        marca: equipoForm.marca,
        modelo: equipoForm.modelo,
        numeroSerie: equipoForm.numeroSerie,
        macAddress: equipoForm.macAddress || null,
        ipAsignada: equipoForm.ipAsignada || null,
        estado: equipoForm.estado,
        ubicacion: equipoForm.ubicacion || null,
        notas: equipoForm.notas || null,
      };

      console.log('Sending equipment data to server:', submissionData);

      const isEditing = !!editingEquipoId;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${API_BASE}/equipos-cliente/${editingEquipoId}`
        : `${API_BASE}/equipos-cliente`;

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || `Error al ${isEditing ? 'actualizar' : 'asignar'} equipo`);
      }

      const result = await response.json();
      console.log(`Equipo ${isEditing ? 'actualizado' : 'asignado'}:`, result);

      // Refresh equipment list
      const equiposData = await fetch(`${API_BASE}/equipos-cliente`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(res => res.json());
      const activeClientIds = new Set(clients.map(c => c.id));
      const filteredEquipos = (equiposData || []).filter((equipo: any) =>
        equipo.cliente?.id && activeClientIds.has(equipo.cliente.id)
      );
      setEquipos(filteredEquipos);

      setShowEquipoModal(false);
      setEditingEquipoId(null);
      setEquipoForm({
        datosClienteId: '',
        tipoEquipo: 'router',
        marca: '',
        modelo: '',
        numeroSerie: '',
        macAddress: '',
        ipAsignada: '',
        estado: 'instalado',
        ubicacion: '',
        notas: '',
      });

      // Show success message
      Swal.fire('Éxito', `Equipo ${isEditing ? 'actualizado' : 'asignado'} exitosamente`, 'success');
    } catch (err) {
      console.error(`Error ${editingEquipoId ? 'updating' : 'assigning'} equipment:`, err);
      setError(err instanceof Error ? err.message : `Error al ${editingEquipoId ? 'actualizar' : 'asignar'} equipo`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuscripcion = async (suscripcion: SuscripcionDisplay) => {
    // For now, we'll populate the form and let the user modify and submit
    // In a future enhancement, we could create a separate edit modal

    // Usar fechaSuscripcion del cliente si está disponible, sino usar fechaInicio de la suscripción
    const fechaInicioToUse = suscripcion.cliente?.fechaSuscripcion
      ? new Date(suscripcion.cliente.fechaSuscripcion)
      : new Date(suscripcion.fechaInicio);

    setServicioForm({
      numeroContrato: suscripcion.numeroContrato,
      contratoId: suscripcion.cliente?.id || '',
      servicioId: suscripcion.servicio?.id || '',
      planId: suscripcion.plan?.id || '',
      usuarioRegistroId: '',
      fechaInicio: fechaInicioToUse,
      estado: suscripcion.estado || 'pendiente',
      precioMensual: suscripcion.precioMensual,
      precioInstalacion: 0,
      descuentoAplicado: suscripcion.descuentoAplicado || 0,
      costoAdicional: 0,
      diaFacturacion: suscripcion.diaFacturacion || 1,
      notasInstalacion: suscripcion.notasInstalacion || '',
      notasServicio: suscripcion.notasServicio || '',
    });
    // populate selected services to reflect the one being edited
    if (suscripcion.servicio?.id) {
      setServiciosSeleccionados([{
        id: suscripcion.servicio.id,
        nombre: suscripcion.servicio.nombre || '',
        precio: Number(suscripcion.servicio.precio || suscripcion.precioMensual || 0)
      }]);
    } else {
      setServiciosSeleccionados([]);
    }
    setEditingSuscripcionId(suscripcion.id);
    setShowServicioModal(true);
  };

  const handleDeleteSuscripcion = async (suscripcionId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar esta suscripción? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/suscripciones/${suscripcionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar suscripción');
        }

        // Refresh subscriptions list
        const suscripcionesData = await fetch(`${API_BASE}/suscripciones`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json());
        const activeClientIds = new Set(clients.map(c => c.id));
        const filteredSuscripciones = (suscripcionesData || []).filter((sus: any) =>
          sus.cliente?.id && activeClientIds.has(sus.cliente.id)
        );
        setSuscripciones(filteredSuscripciones);

        Swal.fire('Eliminado', 'Suscripción eliminada exitosamente', 'success');
      } catch (err) {
        console.error('Error deleting subscription:', err);
        setError(err instanceof Error ? err.message : 'Error al eliminar suscripción');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditEquipo = async (equipo: EquipoDisplay) => {
    // Populate the form with existing equipment data
    setEquipoForm({
      datosClienteId: equipo.cliente?.id || '',
      tipoEquipo: equipo.tipoEquipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      numeroSerie: equipo.numeroSerie,
      macAddress: equipo.macAddress || '',
      ipAsignada: equipo.ipAsignada || '',
      estado: equipo.estado,
      ubicacion: equipo.ubicacion || '',
      notas: '',
    });
    setEditingEquipoId(equipo.id);
    setShowEquipoModal(true);
  };

  const handleDeleteEquipo = async (equipoId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar este equipo? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/equipos-cliente/${equipoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar equipo');
        }

        // Refresh equipment list
        const equiposData = await fetch(`${API_BASE}/equipos-cliente`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json());
        const activeClientIds = new Set(clients.map(c => c.id));
        const filteredEquipos = (equiposData || []).filter((equipo: any) =>
          equipo.cliente?.id && activeClientIds.has(equipo.cliente.id)
        );
        setEquipos(filteredEquipos);

        Swal.fire('Eliminado', 'Equipo eliminado exitosamente', 'success');
      } catch (err) {
        console.error('Error deleting equipment:', err);
        setError(err instanceof Error ? err.message : 'Error al eliminar equipo');
      } finally {
        setLoading(false);
      }
    }
  };

  // Column definitions for Suscripciones table
  const suscripcionesColumns: ColumnDef<SuscripcionDisplay>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => {
        const isAllSelected = table.getIsAllRowsSelected();
        const isSomeSelected = table.getIsSomeRowsSelected();

        return (
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = !isAllSelected && isSomeSelected;
              }
            }}
            onChange={(e) => {
              const isChecked = e.target.checked;
              if (isChecked) {
                const allIds = new Set(suscripciones.map(s => s.id));
                setSuscripcionesSeleccionadasIds(allIds);
              } else {
                setSuscripcionesSeleccionadasIds(new Set());
              }
            }}
            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
          />
        );
      },
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={suscripcionesSeleccionadasIds.has(row.original.id)}
          onChange={(e) => {
            const newSet = new Set(suscripcionesSeleccionadasIds);
            if (e.target.checked) {
              newSet.add(row.original.id);
            } else {
              newSet.delete(row.original.id);
            }
            setSuscripcionesSeleccionadasIds(newSet);
          }}
          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
        />
      ),
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      id: 'cliente',
      header: 'Cliente',
      accessorFn: (row) => `${row.cliente?.nombre || ''} ${row.cliente?.apellidos || ''} ${row.cliente?.codigoCliente || ''}`,
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--colors-primary-main)', fontSize: '1.1rem' }}>person</span>
          <div>
            <div style={{ fontWeight: '500' }}>
              {row.original.cliente?.nombre || 'N/A'} {row.original.cliente?.apellidos || 'N/A'}
            </div>
            <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>
              {row.original.cliente?.codigoCliente || 'N/A'}
            </small>
          </div>
        </div>
      ),
    },
    {
      id: 'servicio',
      header: 'Servicio',
      accessorFn: (row) => row.servicio?.nombre || '',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>wifi</span>
          {row.original.servicio ? (
            <span style={{ fontWeight: '500' }}>{row.original.servicio.nombre}</span>
          ) : (
            <span style={{ color: 'var(--colors-text-secondary)', fontStyle: 'italic' }}>Sin servicio</span>
          )}
        </div>
      ),
    },
    {
      id: 'plan',
      header: 'Plan',
      accessorFn: (row) => row.plan?.nombre || '',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>router</span>
          {row.original.plan ? (
            <span style={{ fontWeight: '500' }}>{row.original.plan.nombre}</span>
          ) : (
            <span style={{ color: 'var(--colors-text-secondary)', fontStyle: 'italic' }}>Sin plan</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'precioMensual',
      header: 'Precio Mensual',
      cell: ({ row }) => (
        <div style={{ fontWeight: '600', color: 'var(--colors-success-dark)', fontSize: '1rem' }}>
          {formatearMonto(Number(row.original.precioMensual))}
        </div>
      ),
    },
    {
      accessorKey: 'fechaInicio',
      header: 'Fecha Inicio',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>calendar_today</span>
          <span>{new Date(row.original.fechaInicio).toLocaleDateString('es-ES')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'diaFacturacion',
      header: 'Día de Facturación',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>event</span>
          <div style={{
            backgroundColor: 'var(--colors-info-light)',
            color: 'var(--colors-info-dark)',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: '600',
            minWidth: '40px',
            textAlign: 'center'
          }}>
            {row.original.diaFacturacion || 1}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'numeroContrato',
      header: 'Contrato',
      cell: ({ row }) => (
        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '600', color: 'var(--colors-primary-main)', backgroundColor: 'var(--colors-background-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
          {row.original.numeroContrato}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => handleEditSuscripcion(row.original)}
            className="action-btn edit-btn"
            title="Editar suscripción"
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            onClick={() => handleDeleteSuscripcion(row.original.id)}
            className="action-btn delete-btn"
            title="Eliminar suscripción"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      ),
    },
  ], [handleEditSuscripcion, handleDeleteSuscripcion]);

  // Column definitions for Equipos table
  const equiposColumns: ColumnDef<EquipoDisplay>[] = useMemo(() => [
    {
      id: 'cliente',
      header: 'Cliente',
      accessorFn: (row) => `${row.cliente?.nombre || ''} ${row.cliente?.apellidos || ''} ${row.cliente?.codigoCliente || ''}`,
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--colors-info-main)', fontSize: '1.1rem' }}>person</span>
          <div>
            <div style={{ fontWeight: '500' }}>
              {row.original.cliente?.nombre || 'N/A'} {row.original.cliente?.apellidos || 'N/A'}
            </div>
            <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>
              {row.original.cliente?.codigoCliente || 'N/A'}
            </small>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tipoEquipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>
            {row.original.tipoEquipo === 'router' ? 'router' :
              row.original.tipoEquipo === 'modem' ? 'settings_input_antenna' :
                row.original.tipoEquipo === 'antena' ? 'satellite_alt' :
                  row.original.tipoEquipo === 'cable' ? 'cable' :
                    row.original.tipoEquipo === 'switch' ? 'hub' :
                      row.original.tipoEquipo === 'access_point' ? 'wifi' : 'devices_other'}
          </span>
          <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
            {row.original.tipoEquipo.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      id: 'equipo',
      header: 'Equipo',
      accessorFn: (row) => `${row.marca} ${row.modelo} ${row.macAddress || ''}`,
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: '500' }}>
            {row.original.marca} {row.original.modelo}
          </div>
          {row.original.macAddress && (
            <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              MAC: {row.original.macAddress}
            </small>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'numeroSerie',
      header: 'Número Serie',
      cell: ({ row }) => (
        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '600', color: 'var(--colors-primary-main)', backgroundColor: 'var(--colors-background-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
          {row.original.numeroSerie}
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          backgroundColor: row.original.estado === 'instalado' ? 'var(--colors-success-main)' :
            row.original.estado === 'retirado' ? 'var(--colors-error-main)' :
              'var(--colors-warning-main)',
          color: 'white'
        }}>
          {row.original.estado}
        </span>
      ),
    },
    {
      accessorKey: 'ubicacion',
      header: 'Ubicación',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--colors-text-secondary)', fontSize: '1rem' }}>location_on</span>
          <span>{row.original.ubicacion || 'No especificada'}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => handleEditEquipo(row.original)}
            className="action-btn edit-btn"
            title="Editar equipo"
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            onClick={() => handleDeleteEquipo(row.original.id)}
            className="action-btn delete-btn"
            title="Eliminar equipo"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      ),
    },
  ], [handleEditEquipo, handleDeleteEquipo]);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">
            <h1>Equipos & Servicios</h1>
          </div>
          <p>Gestiona los servicios y equipos asignados a los clientes.</p>
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
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="equipos-servicios-container">
        {/* Servicios Section */}
        <div className="form-control">
          <h3>Asignar Servicios a Clientes</h3>
          <p>Crea suscripciones de servicios para clientes existentes.</p>

          <div className="action-buttons">
            <Button onClick={() => setShowServicioModal(true)}>
              <span className="material-icons mr-2">add</span>
              Nuevo Servicio
            </Button>
          </div>
        </div>

        {/* Equipos Section */}
        <div className="form-control">
          <h3>Asignar Equipos a Clientes</h3>
          <p>Registra y asigna equipos de red a clientes existentes.</p>

          <div className="action-buttons">
            <Button onClick={() => setShowEquipoModal(true)}>
              <span className="material-icons mr-2">add</span>
              Nuevo Equipo
            </Button>
          </div>
        </div>
      </div>

      {/* Suscripciones Activas Section */}
      <div className="form-control">
        <h3>Suscripciones Activas</h3>
        <p>Lista de todas las suscripciones activas con sus precios mensuales.</p>

        {suscripciones.length > 0 && (
          <div className="total-summary" style={{
            backgroundColor: 'var(--colors-primary-main)',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: 0 }}>
              Total Mensual: {formatearMonto(suscripciones.reduce((sum, sub) => sum + Number(sub.precioMensual), 0))}
            </h4>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              {suscripciones.length} suscripción{suscripciones.length !== 1 ? 'es' : ''}
            </p>
          </div>
        )}

        <DataTable
          columns={suscripcionesColumns}
          data={suscripciones}
        />
      </div>

      {/* Equipos Asignados Section */}
      <div className="form-control">
        <h3>Equipos Asignados</h3>
        <p>Lista de todos los equipos asignados a clientes con su información técnica.</p>

        {equipos.length > 0 && (
          <div className="total-summary" style={{
            backgroundColor: 'var(--colors-info-main)',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: 0 }}>
              Total de Equipos: {equipos.length}
            </h4>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              {equipos.filter(e => e.estado === 'instalado').length} instalados, {equipos.filter(e => e.estado === 'retirado').length} retirados
            </p>
          </div>
        )}

        <DataTable
          columns={equiposColumns}
          data={equipos}
        />
      </div>

      {/* Servicio Modal */}
      {showServicioModal && (
        <Modal
          title={editingSuscripcionId ? "Editar Suscripción" : "Asignar Servicio a Cliente"}
          size="xxxlarge"
          isOpen={showServicioModal}
          onClose={() => {
            setShowServicioModal(false);
            setEditingSuscripcionId(null);
            setServiciosSeleccionados([]);
            setServicioForm({
              numeroContrato: '',
              contratoId: '',
              servicioId: '',
              planId: '',
              usuarioRegistroId: '',
              fechaInicio: new Date(),
              estado: 'pendiente',
              precioMensual: 0,
              precioInstalacion: 0,
              descuentoAplicado: 0,
              costoAdicional: 0,
              diaFacturacion: 1,
              notasInstalacion: '',
              notasServicio: '',
            });
          }}
        >
          <form onSubmit={handleServicioSubmit}>
            {/* Banner de Edición */}
            {editingSuscripcionId && (
              <div style={{
                backgroundColor: '#FFF3CD',
                border: '2px solid #FFC107',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span className="material-icons" style={{ color: '#FF9800', fontSize: '1.5rem' }}>
                  edit
                </span>
                <div>
                  <strong style={{ color: '#FF6F00', fontSize: '0.95rem' }}>MODO EDICIÓN</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#F57F17', fontSize: '0.85rem' }}>
                    Está modificando una suscripción existente. Cambios se aplicarán a la suscripción actual.
                  </p>
                </div>
              </div>
            )}

            {/* Layout de 2 columnas */}
            <div className="modal-two-columns">
              {/* Columna Izquierda */}
              <div className="modal-column-left">
                {/* Cliente */}
                <div className="form-group">
                  <label>Cliente *</label>
                  <select
                    value={servicioForm.contratoId}
                    onChange={(e) => setServicioForm({ ...servicioForm, contratoId: e.target.value })}
                    className="compact-input"
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.nombre} {client.apellidos}
                      </option>
                    ))}
                  </select>

                  {/* Advertencia si el cliente ya tiene suscripciones activas */}
                  {servicioForm.contratoId && !editingSuscripcionId && (
                    (() => {
                      const suscripcionesActivas = suscripciones.filter(
                        sus => sus.cliente?.id === servicioForm.contratoId &&
                          sus.estado !== 'cancelada' &&
                          sus.estado !== 'suspendida'
                      );
                      return suscripcionesActivas.length > 0 ? (
                        <div style={{
                          backgroundColor: '#E3F2FD',
                          border: '1px solid #2196F3',
                          borderRadius: '6px',
                          padding: '0.75rem',
                          marginTop: '0.5rem',
                          fontSize: '0.85rem',
                          color: '#1565C0'
                        }}>
                          <strong>ℹ️ Información:</strong> Este cliente ya tiene {suscripcionesActivas.length} suscripción(es) activa(s).
                          <br />Si continúa, se creará una nueva suscripción. Para editar la existente, haga clic en ella.
                        </div>
                      ) : null;
                    })()
                  )}
                </div>

                {/* Plan de Internet */}
                <div className="form-group">
                  <label>Plan de Internet (Opcional)</label>
                  <div className="plan-panel">
                    <select
                      value={servicioForm.planId}
                      onChange={(e) => setServicioForm({ ...servicioForm, planId: e.target.value })}
                      className="compact-input"
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccionar plan...</option>
                      {planes.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre} - {plan.bajadaMbps || 0}Mbps - DOP {plan.precio}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notas de Instalación */}
                <div className="form-group">
                  <label>Notas de Instalación</label>
                  <textarea
                    value={servicioForm.notasInstalacion}
                    onChange={(e) => setServicioForm({ ...servicioForm, notasInstalacion: e.target.value })}
                    className="compact-input narrow-textarea"
                    rows={3}
                    placeholder="Detalles de la instalación..."
                  />
                </div>

                {/* Notas del Servicio */}
                <div className="form-group">
                  <label>Notas del Servicio</label>
                  <textarea
                    value={servicioForm.notasServicio}
                    onChange={(e) => setServicioForm({ ...servicioForm, notasServicio: e.target.value })}
                    className="compact-input narrow-textarea"
                    rows={3}
                    placeholder="Notas adicionales del servicio..."
                  />
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="modal-column-right">
                {/* Descuento Aplicado */}
                <div className="form-group">
                  <label>Descuento Aplicado (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={servicioForm.descuentoAplicado}
                    onChange={(e) => setServicioForm({ ...servicioForm, descuentoAplicado: parseFloat(e.target.value) || 0 })}
                    className="compact-input narrow-input"
                    placeholder="0.00"
                  />
                </div>

                {/* Día de Facturación */}
                <div className="form-group">
                  <label>Día de Facturación</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={servicioForm.diaFacturacion}
                    onChange={(e) => setServicioForm({ ...servicioForm, diaFacturacion: parseInt(e.target.value) || 1 })}
                    className="compact-input narrow-input"
                    placeholder="1"
                  />
                </div>

                {/* Fecha de Inicio */}
                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <div className="date-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-icons" style={{ color: 'var(--colors-text-secondary)' }}>calendar_today</span>
                    <input
                      type="text"
                      value={formatDateDDMMYYYY(servicioForm.fechaInicio)}
                      onChange={(e) => {
                        const parsed = parseDDMMYYYYToDate(e.target.value);
                        if (parsed) setServicioForm({ ...servicioForm, fechaInicio: parsed });
                      }}
                      className="compact-input narrow-input"
                      placeholder="dd/mm/yyyy"
                      required
                    />
                  </div>
                </div>

                {/* Precio Mensual */}
                <div className="form-group">
                  <label>Precio Mensual (DOP)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={isNaN(servicioForm.precioMensual) ? 0 : servicioForm.precioMensual}
                    className="compact-input narrow-input"
                    placeholder="Se calcula automáticamente"
                    readOnly
                  />
                  <small style={{ color: 'var(--colors-text-secondary)', fontSize: '0.8rem' }}>
                    Se calcula automáticamente basado en el servicio y plan seleccionados
                  </small>
                </div>
              </div>
            </div>

            {/* Servicios Adicionales */}
            <div className="servicios-section form-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--colors-border)' }}>
              <label>Servicios Adicionales</label>
              <div className="servicios-grid">
                {servicios.length ? (
                  servicios.map((servicio) => {
                    const isSelected = serviciosSeleccionados.some(s => s.id === servicio.id);
                    return (
                      <label key={servicio.id} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setServiciosSeleccionados([...serviciosSeleccionados, { id: servicio.id, nombre: servicio.nombre, precio: Number(servicio.precioBase || 0) }]);
                              } else {
                                setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.id !== servicio.id));
                              }
                            }}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{servicio.nombre}</div>
                            <small style={{ color: 'var(--colors-text-secondary)', display: 'block', fontSize: '0.8rem', marginTop: '0.25rem' }}>RD$ {servicio.precioBase || 0}</small>
                          </div>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div style={{ color: 'var(--colors-text-secondary)', gridColumn: '1 / -1' }}>No hay servicios disponibles</div>
                )}
              </div>
              {serviciosSeleccionados.length > 0 && (
                <div className="servicios-summary-pills">
                  {serviciosSeleccionados.map((s) => (
                    <span key={s.id}>
                      {s.nombre}
                      <button type="button" onClick={() => setServiciosSeleccionados(serviciosSeleccionados.filter(x => x.id !== s.id))}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <Button onClick={() => {
                setShowServicioModal(false);
                setEditingSuscripcionId(null);
                setServiciosSeleccionados([]);
                setServicioForm({
                  numeroContrato: '',
                  contratoId: '',
                  servicioId: '',
                  planId: '',
                  usuarioRegistroId: '',
                  fechaInicio: new Date(),
                  estado: 'pendiente',
                  precioMensual: 0,
                  precioInstalacion: 0,
                  descuentoAplicado: 0,
                  costoAdicional: 0,
                  diaFacturacion: 1,
                  notasInstalacion: '',
                  notasServicio: '',
                });
              }} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? (editingSuscripcionId ? 'Actualizando...' : 'Creando...') : (editingSuscripcionId ? 'Actualizar Suscripción' : 'Crear Suscripción')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Equipo Modal */}
      {showEquipoModal && (
        <Modal
          title={editingEquipoId ? "Editar Equipo" : "Asignar Equipo a Cliente"}
          isOpen={showEquipoModal}
          onClose={() => {
            setShowEquipoModal(false);
            setEditingEquipoId(null);
            setEquipoForm({
              datosClienteId: '',
              tipoEquipo: 'router',
              marca: '',
              modelo: '',
              numeroSerie: '',
              macAddress: '',
              ipAsignada: '',
              estado: 'instalado',
              ubicacion: '',
              notas: '',
            });
          }}
        >
          <form onSubmit={handleEquipoSubmit}>
            <div className="form-group">
              <label>Cliente *</label>
              <select
                value={equipoForm.datosClienteId}
                onChange={(e) => setEquipoForm({ ...equipoForm, datosClienteId: e.target.value })}
                className="compact-input"
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nombre} {client.apellidos} - {client.codigoCliente}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Equipo *</label>
              <select
                value={equipoForm.tipoEquipo}
                onChange={(e) => setEquipoForm({ ...equipoForm, tipoEquipo: e.target.value })}
                className="compact-input"
                required
              >
                <option value="router">Router</option>
                <option value="modem">Módem</option>
                <option value="antena">Antena</option>
                <option value="cable">Cable</option>
                <option value="switch">Switch</option>
                <option value="access_point">Punto de Acceso</option>
              </select>
            </div>

            <div className="form-group">
              <label>Marca *</label>
              <input
                type="text"
                value={equipoForm.marca}
                onChange={(e) => setEquipoForm({ ...equipoForm, marca: e.target.value })}
                className="compact-input"
                placeholder="TP-Link, Ubiquiti, etc."
                required
              />
            </div>

            <div className="form-group">
              <label>Modelo *</label>
              <input
                type="text"
                value={equipoForm.modelo}
                onChange={(e) => setEquipoForm({ ...equipoForm, modelo: e.target.value })}
                className="compact-input"
                placeholder="Archer C6, NanoStation, etc."
                required
              />
            </div>

            <div className="form-group">
              <label>Número de Serie *</label>
              <input
                type="text"
                value={equipoForm.numeroSerie}
                onChange={(e) => setEquipoForm({ ...equipoForm, numeroSerie: e.target.value })}
                className="compact-input"
                placeholder="SN123456789"
                required
              />
            </div>

            <div className="form-group">
              <label>Dirección MAC</label>
              <input
                type="text"
                value={equipoForm.macAddress}
                onChange={(e) => setEquipoForm({ ...equipoForm, macAddress: e.target.value })}
                className="compact-input"
                placeholder="00:11:22:33:44:55"
              />
            </div>

            <div className="form-group">
              <label>IP Asignada</label>
              <input
                type="text"
                value={equipoForm.ipAsignada}
                onChange={(e) => setEquipoForm({ ...equipoForm, ipAsignada: e.target.value })}
                className="compact-input"
                placeholder="192.168.1.100"
              />
            </div>

            <div className="form-group">
              <label>Ubicación</label>
              <input
                type="text"
                value={equipoForm.ubicacion}
                onChange={(e) => setEquipoForm({ ...equipoForm, ubicacion: e.target.value })}
                className="compact-input"
                placeholder="Sala, Techo, Poste, etc."
              />
            </div>

            <div className="form-group">
              <label>Notas</label>
              <textarea
                value={equipoForm.notas}
                onChange={(e) => setEquipoForm({ ...equipoForm, notas: e.target.value })}
                className="compact-input"
                rows={3}
                placeholder="Notas adicionales del equipo..."
              />
            </div>

            <div className="form-actions">
              <Button onClick={() => {
                setShowEquipoModal(false);
                setEditingEquipoId(null);
                setEquipoForm({
                  datosClienteId: '',
                  tipoEquipo: 'router',
                  marca: '',
                  modelo: '',
                  numeroSerie: '',
                  macAddress: '',
                  ipAsignada: '',
                  estado: 'instalado',
                  ubicacion: '',
                  notas: '',
                });
              }} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? (editingEquipoId ? 'Actualizando...' : 'Asignando...') : (editingEquipoId ? 'Actualizar Equipo' : 'Asignar Equipo')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ClientesEquiposServicios;
