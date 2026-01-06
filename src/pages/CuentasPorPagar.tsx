import React, { useState, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/feature/DataTable';
import Modal from '../components/feature/Modal';
import Swal from 'sweetalert2';
import {
  Receipt, Filter, RefreshCw, Plus, Eye, Edit, Trash2, CreditCard,
  TrendingUp, DollarSign, Calendar, HandCoins, AlertTriangle, Clock, FileText, AlertCircle, X, Search,
  Tag, Activity, CheckCircle, User, Phone, ChevronRight, CheckCircle2, Library, Briefcase, Check, Landmark
} from 'lucide-react';
import cuentasPorPagarService, {
  type CuentaPorPagar,
  type ResumenCuentasPorPagar,
  type FiltrosCuentasPorPagar
} from '../services/cuentasPorPagarService';
import proveedorService, { type Proveedor } from '../services/proveedorService';
import KpiWidget from '../components/ui/KpiWidget';
import { AuthService } from '../services/authService';
import { getSavingsAnalysis, type SavingsAnalysis } from '../services/cajaService';
import '../pages/Banks.css';

const CuentasPorPagar: React.FC = () => {
  // Estados principales
  const [cuentas, setCuentas] = useState<CuentaPorPagar[]>([]);
  const [resumen, setResumen] = useState<ResumenCuentasPorPagar | null>(null);
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosCuentasPorPagar>({ estado: 'pendiente' });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalCrearProveedorOpen, setModalCrearProveedorOpen] = useState(false); // New state
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaPorPagar | null>(null);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados de formularios
  const [formData, setFormData] = useState({
    numeroDocumento: '',
    proveedorId: '',
    tipoDocumento: 'factura',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    concepto: '',
    montoOriginal: '',
    cuotaMensual: '',
    moneda: 'DOP',
    observaciones: ''
  });

  const [formPago, setFormPago] = useState({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    metodoPago: 'caja',
    numeroReferencia: '',
    observaciones: ''
  });

  // Estados para bancos y cuentas bancarias
  const [banks, setBanks] = useState<{ id: string; nombre: string }[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [cuentasBancarias, setCuentasBancarias] = useState<{ id: string; nombre: string; saldo: number }[]>([]);
  const [selectedCuentaBancariaId, setSelectedCuentaBancariaId] = useState<string>('');

  // Estados para cajas y balances
  const [cajasDisponibles, setCajasDisponibles] = useState<{ id: string; nombre: string; tipo: string; saldoActual: number }[]>([]);
  const [selectedCajaId, setSelectedCajaId] = useState<string>('');
  const [saldoCajaActual, setSaldoCajaActual] = useState<number>(0);
  const [saldoPapeleriaActual, setSaldoPapeleriaActual] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [savingsAnalysis, setSavingsAnalysis] = useState<SavingsAnalysis | null>(null);
  const [montoNominaAbierta, setMontoNominaAbierta] = useState<number>(0);

  // Función para obtener headers de autenticación
  const getAuthHeaders = (contentType: string = 'application/json'): HeadersInit => {
    const token = AuthService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // State for new provider form
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    razonSocial: '',
    rnc: '',
    telefono: '',
    tipoProveedor: 'servicios' // Default
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
    cargarProveedores();
    cargarBancos();
    cargarCajas();
    cargarNominaAbierta();
    cargarBalances();
    cargarAnalisisAhorro();
  }, [filtros]);

  // Cargar cuentas bancarias cuando cambie el banco seleccionado
  useEffect(() => {
    if (selectedBankId) {
      cargarCuentasBancarias(selectedBankId);
    }
  }, [selectedBankId]);

  // Actualizar balance cuando cambia el método de pago
  useEffect(() => {
    if (formPago.metodoPago === 'caja' || formPago.metodoPago === 'papeleria') {
      cargarBalances();
    }
  }, [formPago.metodoPago]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [cuentasData, resumenData] = await Promise.all([
        cuentasPorPagarService.getCuentasPorPagar(filtros),
        cuentasPorPagarService.getResumenCuentasPorPagar()
      ]);

      setCuentas(cuentasData);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire('Error', 'Error al cargar las cuentas por pagar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarProveedores = async () => {
    try {
      const proveedoresData = await proveedorService.getProveedoresActivos();
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      Swal.fire('Error', 'Error al cargar la lista de proveedores', 'error');
    }
  };

  const cargarBancos = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/banks`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al cargar bancos');
      const data = await response.json();
      setBanks(data);
      if (data.length > 0) {
        setSelectedBankId(data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar bancos:', error);
    }
  };

  const cargarCuentasBancarias = async (bankId: string) => {
    if (!bankId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/banks/${bankId}/accounts`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al cargar cuentas bancarias');
      const data = await response.json();
      setCuentasBancarias(data);
      if (data.length > 0) {
        setSelectedCuentaBancariaId(data[0].id);
      } else {
        setSelectedCuentaBancariaId('');
      }
    } catch (error) {
      console.error('Error al cargar cuentas bancarias:', error);
      setCuentasBancarias([]);
      setSelectedCuentaBancariaId('');
    }
  };

  const cargarCajas = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cajas`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Error al cargar cajas');
      const data = await response.json();
      const cajasActivas = data.filter((caja: any) => caja.tipo !== 'banco');
      setCajasDisponibles(cajasActivas);
      if (cajasActivas.length > 0) {
        const cajaPrincipal = cajasActivas.find((caja: any) =>
          caja.nombre.toLowerCase().includes('principal') || caja.tipo === 'general'
        );
        setSelectedCajaId(cajaPrincipal ? cajaPrincipal.id : cajasActivas[0].id);
      }
    } catch (error) {
      console.error('Error al cargar cajas:', error);
    }
  };

  const cargarBalances = async () => {
    setLoadingBalance(true);
    try {
      const [cajaResponse, papeleriaResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/balance/caja`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/balance/papeleria`, {
          headers: getAuthHeaders(),
        })
      ]);

      const cajaData = cajaResponse.ok ? await cajaResponse.json() : { balance: 0 };
      const papeleriaData = papeleriaResponse.ok ? await papeleriaResponse.json() : { balance: 0 };

      setSaldoCajaActual(cajaData.balance || 0);
      setSaldoPapeleriaActual(papeleriaData.balance || 0);
    } catch (error) {
      console.error('Error al cargar balances:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const cargarAnalisisAhorro = async () => {
    try {
      const analysis = await getSavingsAnalysis();
      setSavingsAnalysis(analysis);
    } catch (error) {
      console.error('Error al cargar análisis de ahorro:', error);
    }
  };

  const cargarNominaAbierta = async () => {
    try {
      const response = await fetch('http://172.16.0.23:54116/api/rrhh/nomina/periods', {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      // Buscar periodo con estado ABIERTO
      const periodoAbierto = data.find((p: any) => p.estado === 'ABIERTO');

      if (periodoAbierto) {
        // Obtener las nóminas de ese periodo
        const nominasResponse = await fetch(`http://172.16.0.23:54116/api/rrhh/nomina/periods/${periodoAbierto.id}/payrolls`, {
          headers: getAuthHeaders()
        });
        const nominas = await nominasResponse.json();

        // Sumar todos los salarios netos
        const totalNomina = nominas.reduce((sum: number, nomina: any) => sum + Number(nomina.salarioNeto || 0), 0);
        setMontoNominaAbierta(totalNomina);
      } else {
        setMontoNominaAbierta(0);
      }
    } catch (error) {
      console.error('Error al cargar nómina abierta:', error);
      setMontoNominaAbierta(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modoEdicion && cuentaSeleccionada) {
        await cuentasPorPagarService.updateCuentaPorPagar(cuentaSeleccionada.id, {
          ...formData,
          montoOriginal: parseFloat(formData.montoOriginal),
          cuotaMensual: formData.cuotaMensual ? parseFloat(formData.cuotaMensual) : undefined
        });
        Swal.fire('Éxito', 'Cuenta por pagar actualizada correctamente', 'success');
      } else {
        await cuentasPorPagarService.createCuentaPorPagar({
          ...formData,
          montoOriginal: parseFloat(formData.montoOriginal),
          cuotaMensual: formData.cuotaMensual ? parseFloat(formData.cuotaMensual) : undefined
        } as any);
        Swal.fire('Éxito', 'Cuenta por pagar creada correctamente', 'success');
      }

      setModalFormOpen(false);
      resetForm();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al guardar cuenta:', error);
      Swal.fire('Error', error.response?.data?.message || 'Error al guardar la cuenta', 'error');
    }
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaSeleccionada) return;

    try {
      await cuentasPorPagarService.registrarPago(cuentaSeleccionada.id, {
        ...formPago,
        monto: parseFloat(formPago.monto),
        cajaId: selectedCajaId,
        cuentaBancariaId: selectedCuentaBancariaId
      });

      Swal.fire('Éxito', 'Pago registrado correctamente', 'success');
      setModalPagoOpen(false);
      setFormPago({
        monto: '',
        fechaPago: new Date().toISOString().split('T')[0],
        metodoPago: 'efectivo',
        numeroReferencia: '',
        observaciones: ''
      });
      cargarDatos();
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      Swal.fire('Error', error.response?.data?.message || 'Error al registrar el pago', 'error');
    }
  };

  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await proveedorService.createProveedor(nuevoProveedor);
      await cargarProveedores();

      // Find the new provider to select it (optional, or just reload)
      const nuevosProveedores = await proveedorService.getProveedoresActivos();
      const creado = nuevosProveedores.find(p => p.nombre === nuevoProveedor.nombre); // Simple match
      if (creado) {
        setFormData(prev => ({ ...prev, proveedorId: creado.id }));
      }

      setModalCrearProveedorOpen(false);
      setNuevoProveedor({ nombre: '', razonSocial: '', rnc: '', telefono: '', tipoProveedor: 'servicios' });
      Swal.fire('Éxito', 'Proveedor creado correctamente', 'success');
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      Swal.fire('Error', 'No se pudo crear el proveedor', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await cuentasPorPagarService.deleteCuentaPorPagar(id);
        Swal.fire('Eliminado', 'La cuenta por pagar ha sido eliminada', 'success');
        cargarDatos();
      } catch (error: any) {
        console.error('Error al eliminar cuenta:', error);
        Swal.fire('Error', error.response?.data?.message || 'Error al eliminar la cuenta', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      numeroDocumento: '',
      proveedorId: '',
      tipoDocumento: 'factura',
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      concepto: '',
      montoOriginal: '',
      cuotaMensual: '',
      moneda: 'DOP',
      observaciones: ''
    });
    setModoEdicion(false);
    setCuentaSeleccionada(null);
  };

  const openEditModal = (cuenta: CuentaPorPagar) => {
    setFormData({
      numeroDocumento: cuenta.numeroDocumento,
      proveedorId: cuenta.proveedorId || '',
      tipoDocumento: cuenta.tipoDocumento,
      fechaEmision: cuenta.fechaEmision.split('T')[0],
      fechaVencimiento: cuenta.fechaVencimiento.split('T')[0],
      concepto: cuenta.concepto,
      montoOriginal: cuenta.montoOriginal.toString(),
      cuotaMensual: cuenta.cuotaMensual ? cuenta.cuotaMensual.toString() : '',
      moneda: cuenta.moneda,
      observaciones: cuenta.observaciones || ''
    });
    setCuentaSeleccionada(cuenta);
    setModoEdicion(true);
    setModalFormOpen(true);
  };

  const openDetalleModal = async (cuenta: CuentaPorPagar) => {
    setCuentaSeleccionada(cuenta);
    setModalDetalleOpen(true);
    setLoadingPagos(true);
    try {
      const pagos = await cuentasPorPagarService.getPagos(cuenta.id);
      setHistorialPagos(pagos);
    } catch (error) {
      console.error('Error al cargar historial de pagos:', error);
      setHistorialPagos([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  const openPaymentModal = (cuenta: CuentaPorPagar) => {
    setCuentaSeleccionada(cuenta);
    setFormPago(prev => ({
      ...prev,
      monto: cuenta.montoPendiente.toString()
    }));
    setModalPagoOpen(true);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'vencida': 'bg-red-100 text-red-800',
      'pagada': 'bg-green-100 text-green-800'
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const columns: ColumnDef<CuentaPorPagar>[] = useMemo(() => [
    {
      accessorKey: 'numeroDocumento',
      header: 'No. Documento',
      size: 120,
      cell: ({ row }) => (
        <div className="font-medium text-gray-900" style={{ fontSize: '0.875rem' }}>
          {row.original.numeroDocumento}
        </div>
      ),
    },
    {
      accessorKey: 'proveedor.nombre',
      header: 'Proveedor',
      size: 150,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900" style={{ fontSize: '0.875rem' }}>
            {row.original.proveedor?.nombre || 'Sin proveedor'}
          </div>
          {row.original.proveedor?.razonSocial && (
            <div className="text-sm text-gray-500" style={{ fontSize: '0.75rem' }}>
              {row.original.proveedor.razonSocial}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'concepto',
      header: 'Concepto',
      size: 180,
      cell: ({ getValue }) => (
        <div className="max-w-xs truncate" style={{ fontSize: '0.875rem' }}>
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'fechaVencimiento',
      header: 'Vencimiento',
      size: 100,
      cell: ({ getValue }) => (
        <div className="text-sm" style={{ fontSize: '0.875rem' }}>
          {new Date(getValue() as string).toLocaleDateString('es-DO')}
        </div>
      ),
    },
    {
      accessorKey: 'montoOriginal',
      header: 'Monto Original',
      size: 110,
      cell: ({ getValue }) => (
        <div className="font-medium" style={{ fontSize: '0.875rem' }}>
          {formatCurrency(getValue() as number)}
        </div>
      ),
    },
    {
      accessorKey: 'montoPendiente',
      header: 'Monto Pendiente',
      size: 120,
      cell: ({ row }) => {
        const proveedor = row.original.proveedor?.nombre?.toLowerCase() || '';
        const esNomina = proveedor.includes('nomina') || proveedor.includes('nómina');

        return (
          <div className="font-medium text-red-600" style={{ fontSize: '0.875rem' }}>
            {esNomina && montoNominaAbierta > 0 ? (
              <span className="text-blue-600">{formatCurrency(montoNominaAbierta)}</span>
            ) : (
              <span>{formatCurrency(Number(row.original.montoPendiente))}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'cuotaMensual',
      header: 'Cuota Mensual',
      size: 110,
      cell: ({ getValue }) => (
        <div className="font-medium text-gray-700" style={{ fontSize: '0.875rem' }}>
          {getValue() ? formatCurrency(getValue() as number) : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'diasVencido',
      header: 'Días Vencido',
      size: 90,
      cell: ({ getValue }) => {
        const dias = getValue() as number;
        return (
          <div className={`text-sm ${dias > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`} style={{ fontSize: '0.875rem' }}>
            {dias > 0 ? `+${dias}` : dias}
          </div>
        );
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      size: 90,
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(estado)}`}>
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </span>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 150,
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
          <button
            onClick={() => openDetalleModal(row.original)}
            className="text-blue-600 hover:text-blue-900"
            title="Ver detalles"
            style={{ display: 'inline-flex', padding: '4px' }}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row.original)}
            className="hover:text-indigo-900"
            title="Editar"
            style={{ display: 'inline-flex', padding: '4px', color: '#4f46e5' }}
          >
            <Edit className="h-4 w-4" />
          </button>
          {row.original.estado !== 'pagada' && (
            <button
              onClick={() => openPaymentModal(row.original)}
              className="text-green-600 hover:text-green-900"
              title="Registrar pago"
              style={{ display: 'inline-flex', padding: '4px' }}
            >
              <CreditCard className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.original.id)}
            className="text-red-600 hover:text-red-900"
            title="Eliminar"
            style={{ display: 'inline-flex', padding: '4px' }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], [montoNominaAbierta]);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Receipt className="h-8 w-8 text-indigo-600 mr-3" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h1>
                      <p className="text-sm text-gray-500">
                        Gestiona las cuentas pendientes de pago a proveedores
                      </p>
                    </div>
                  </div>

                  {/* Botones principales - Mejorados */}
                  <div
                    className="flex flex-row flex-nowrap items-center gap-4"
                    style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', marginBottom: '24px', gap: '16px' }}
                  >
                    <button
                      onClick={() => {
                        resetForm();
                        setModalFormOpen(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 24px',
                        border: '2px solid #4f46e5',
                        background: '#4f46e5',
                        color: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4338ca';
                        e.currentTarget.style.borderColor = '#3730a3';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#4f46e5';
                        e.currentTarget.style.borderColor = '#4f46e5';
                      }}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nueva Cuenta
                    </button>

                    <button
                      onClick={() => setMostrarFiltros(!mostrarFiltros)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 24px',
                        border: mostrarFiltros ? '2px solid #2563eb' : '2px solid #60a5fa',
                        background: mostrarFiltros ? '#dbeafe' : 'var(--glass-bg, #ffffff)',
                        color: mostrarFiltros ? '#1e40af' : 'var(--av-text, #1f2937)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!mostrarFiltros) {
                          e.currentTarget.style.background = 'var(--glass-bg, #f9fafb)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!mostrarFiltros) {
                          e.currentTarget.style.background = 'var(--glass-bg, #ffffff)';
                          e.currentTarget.style.borderColor = '#60a5fa';
                        }
                      }}
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Filtros
                    </button>

                    <button
                      onClick={cargarDatos}
                      disabled={loading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 24px',
                        border: '2px solid #60a5fa',
                        background: 'var(--glass-bg, #ffffff)',
                        color: 'var(--av-text, #1f2937)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = 'var(--glass-bg, #f9fafb)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = 'var(--glass-bg, #ffffff)';
                          e.currentTarget.style.borderColor = '#60a5fa';
                        }
                      }}
                    >
                      <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Actualizar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          {resumen && (
            <div className="dashboard-kpis">
              <KpiWidget
                title="POTENCIAL AHORRO"
                value={savingsAnalysis ? formatCurrency(savingsAnalysis.proyectado.ahorro) : formatCurrency(0)}
                percentage={`Margen: ${savingsAnalysis?.proyectado.margenAhorro || '0'}%`}
                percentageClass="positive"
                icon={<TrendingUp size={24} strokeWidth={2.5} />}
                barColor="#4CAF50"
              />

              <KpiWidget
                title="TOTAL POR PAGAR"
                value={formatCurrency((Number(resumen.totalPorPagar) || 0) + (Number(montoNominaAbierta) || 0))}
                percentage={`${resumen.cuentasPendientes} cuentas${montoNominaAbierta > 0 ? ' + Nómina' : ''}`}
                percentageClass="neutral"
                icon={<DollarSign size={24} strokeWidth={2.5} />}
                barColor="#00BFA5"
              />

              <KpiWidget
                title="TOTAL CUOTA MENSUAL"
                value={formatCurrency(resumen.totalCuotasMensuales || 0)}
                percentage="Total a pagar mensual"
                percentageClass="neutral"
                icon={<Calendar size={24} strokeWidth={2.5} />}
                barColor="#3b82f6"
              />

              <KpiWidget
                title="TOTAL PAGADO MES"
                value={formatCurrency(resumen.totalPagadoMes || 0)}
                percentage="Pagos realizados este mes"
                percentageClass="positive"
                icon={<HandCoins size={24} strokeWidth={2.5} />}
                barColor="#10b981"
              />

              <KpiWidget
                title="TOTAL VENCIDAS"
                value={formatCurrency(resumen.totalVencidas)}
                percentage={`${resumen.cuentasVencidas} cuentas vencidas`}
                percentageClass={resumen.totalVencidas > 0 ? "negative" : "neutral"}
                icon={<AlertTriangle size={24} strokeWidth={2.5} />}
                barColor="#F44336"
              />

              <KpiWidget
                title="PRÓXIMAS A VENCER"
                value={formatCurrency(resumen.totalProximasVencer)}
                percentage={"Próximos 7 días"}
                percentageClass={resumen.totalProximasVencer > 0 ? "warning" : "neutral"}
                icon={<Clock size={24} strokeWidth={2.5} />}
                barColor="#FF9800"
              />

              <KpiWidget
                title="CUENTAS PENDIENTES"
                value={resumen.cuentasPendientes.toString()}
                percentage={`De ${resumen.cuentasPendientes + resumen.cuentasVencidas} total`}
                percentageClass="positive"
                icon={<FileText size={24} strokeWidth={2.5} />}
                barColor="#2196F3"
              />
              <KpiWidget
                title="CUENTAS VENCIDAS"
                value={resumen.cuentasVencidas.toString()}
                percentage={resumen.cuentasVencidas > 0 ? "Requieren atención" : "Al día"}
                percentageClass={resumen.cuentasVencidas > 0 ? "negative" : "positive"}
                icon={<AlertCircle size={24} strokeWidth={2.5} />}
                barColor={resumen.cuentasVencidas > 0 ? "#F44336" : "#4CAF50"}
              />
            </div>
          )}

          {/* Filtros */}
          {mostrarFiltros && (
            <div className="mx-4 sm:mx-6 lg:mx-8 mb-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={filtros.estado || ''}
                      onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as any })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Todos los estados</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="vencida">Vencida</option>
                      <option value="pagada">Pagada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor
                    </label>
                    <select
                      value={filtros.proveedorId || ''}
                      onChange={(e) => setFiltros({ ...filtros, proveedorId: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Todos los proveedores</option>
                      {proveedores.map((proveedor) => (
                        <option key={proveedor.id} value={proveedor.id}>
                          {proveedor.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Desde
                    </label>
                    <input
                      type="date"
                      value={filtros.fechaDesde || ''}
                      onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Hasta
                    </label>
                    <input
                      type="date"
                      value={filtros.fechaHasta || ''}
                      onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de datos */}
          <div className="mx-4 sm:mx-6 lg:mx-8 mb-6">
            <div className="bg-white shadow rounded-lg">
              <DataTable
                data={cuentas}
                columns={columns}
                isLoading={loading}
                tableName="cuentas-por-pagar"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Formulario */}
      <Modal
        isOpen={modalFormOpen}
        onClose={() => {
          setModalFormOpen(false);
          resetForm();
        }}
        title={modoEdicion ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Documento *
              </label>
              <input
                type="text"
                value={formData.numeroDocumento}
                onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento
              </label>
              <select
                value={formData.tipoDocumento}
                onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="factura">Factura</option>
                <option value="recibo">Recibo</option>
                <option value="nota_debito">Nota de Débito</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.proveedorId}
                  onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre} {proveedor.razonSocial ? `(${proveedor.razonSocial})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setModalCrearProveedorOpen(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Original *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.montoOriginal}
                onChange={(e) => setFormData({ ...formData, montoOriginal: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Emisión *
              </label>
              <input
                type="date"
                value={formData.fechaEmision}
                onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto *
            </label>
            <input
              type="text"
              value={formData.concepto}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              rows={3}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setModalFormOpen(false);
                resetForm();
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--glass-border, #d1d5db)',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--av-text, #1f2937)',
                background: 'var(--glass-bg, #ffffff)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg, #f9fafb)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg, #ffffff)';
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {modoEdicion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal >

      {/* Modal Pago */}
      < Modal
        isOpen={modalPagoOpen}
        onClose={() => {
          setModalPagoOpen(false);
          setFormPago({
            monto: '',
            fechaPago: new Date().toISOString().split('T')[0],
            metodoPago: 'caja',
            numeroReferencia: '',
            observaciones: ''
          });
        }}
        title="Registrar Pago"
      >
        {cuentaSeleccionada && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                Cuenta: {cuentaSeleccionada.numeroDocumento}
              </h4>
              <p className="text-sm text-gray-600">
                Monto pendiente: {formatCurrency(cuentaSeleccionada.montoPendiente)}
              </p>
              <p className="text-sm text-gray-600">
                Proveedor: {cuentaSeleccionada.proveedor?.nombre || 'Sin proveedor'}
              </p>
            </div>

            <form onSubmit={handlePago} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto del Pago *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={cuentaSeleccionada.montoPendiente}
                    value={formPago.monto}
                    onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del Pago *
                  </label>
                  <input
                    type="date"
                    value={formPago.fechaPago}
                    onChange={(e) => setFormPago({ ...formPago, fechaPago: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={formPago.metodoPago}
                    onChange={(e) => setFormPago({ ...formPago, metodoPago: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="caja">Caja</option>
                    <option value="banco">Banco</option>
                    <option value="papeleria">Papelería</option>
                  </select>
                  {(formPago.metodoPago === 'caja' || formPago.metodoPago === 'papeleria') && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#f0f9ff',
                      borderLeft: '4px solid #0ea5e9',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {loadingBalance ? (
                        <span style={{ color: '#6b7280' }}>Cargando saldo...</span>
                      ) : (
                        <span style={{ fontWeight: '500', color: '#1e40af' }}>
                          💰 Saldo actual: ${formPago.metodoPago === 'caja' ? saldoCajaActual.toFixed(2) : saldoPapeleriaActual.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {formPago.metodoPago === 'caja' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caja *
                    </label>
                    <select
                      value={selectedCajaId}
                      onChange={(e) => setSelectedCajaId(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Seleccione una caja</option>
                      {cajasDisponibles.map(caja => (
                        <option key={caja.id} value={caja.id}>
                          {caja.nombre} - {caja.tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formPago.metodoPago === 'banco' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Banco *
                      </label>
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Seleccione un banco</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cuenta Bancaria *
                      </label>
                      <select
                        value={selectedCuentaBancariaId}
                        onChange={(e) => setSelectedCuentaBancariaId(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Seleccione una cuenta</option>
                        {cuentasBancarias.map(cuenta => (
                          <option key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre} (Saldo: ${(typeof cuenta.saldo === 'string' ? parseFloat(cuenta.saldo) : cuenta.saldo).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formPago.metodoPago !== 'banco' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      No. Referencia
                    </label>
                    <input
                      type="text"
                      value={formPago.numeroReferencia}
                      onChange={(e) => setFormPago({ ...formPago, numeroReferencia: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {formPago.metodoPago === 'banco' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      No. Referencia
                    </label>
                    <input
                      type="text"
                      value={formPago.numeroReferencia}
                      onChange={(e) => setFormPago({ ...formPago, numeroReferencia: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuota Mensual
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cuotaMensual}
                  onChange={(e) => setFormData({ ...formData, cuotaMensual: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={formPago.observaciones}
                  onChange={(e) => setFormPago({ ...formPago, observaciones: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalPagoOpen(false);
                    setFormPago({
                      monto: '',
                      fechaPago: new Date().toISOString().split('T')[0],
                      metodoPago: 'efectivo',
                      numeroReferencia: '',
                      observaciones: ''
                    });
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--glass-border, #d1d5db)',
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--av-text, #1f2937)',
                    background: 'var(--glass-bg, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--glass-bg, #f9fafb)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--glass-bg, #ffffff)';
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal >

      {/* Modal Detalles */}
      <Modal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        title={
          <div className="flex items-center space-x-3 text-white">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-400/20 shadow-inner">
              <Library className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] leading-tight tracking-tight text-white/90">Detalles de Cuenta por Pagar</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Gestión de Comprobante</span>
            </div>
          </div>
        }
        size="lg"
        className="bg-[#1a1c2e] text-white p-0 overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] !max-w-[850px]"
        headerClassName="border-b border-white/5 bg-[#1a1c2e] px-8 py-5 !mb-0"
        bodyClassName="p-0"
      >
        {cuentaSeleccionada && (
          <div className="flex flex-col bg-[#1a1c2e]">
            {/* Header Summary Section */}
            <div className="px-8 py-8 bg-gradient-to-r from-[#2d325a] via-[#353a5f] to-[#2d325a] border-b border-white/5 relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>

              <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Document</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl font-bold text-white tracking-tight">#{cuentaSeleccionada.numeroDocumento}</span>
                    <div className="px-2 py-1 bg-white/10 rounded-md border border-white/10 text-[10px] font-bold text-slate-300 uppercase letter-spacing-1">Original</div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] block">PENDING AMOUNT</span>
                  <div className="flex items-center justify-end space-x-4">
                    <div className="flex flex-col items-end">
                      <span className="text-4xl font-black text-white tracking-tighter shadow-sm">
                        {formatCurrency(cuentaSeleccionada.montoPendiente)}
                      </span>
                    </div>
                    {cuentaSeleccionada.montoPendiente > 0 && (
                      <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Stats Grid - 5 Columns */}
            <div className="grid grid-cols-5 border-b border-white/10 bg-white/[0.02]">
              <div className="p-6 border-r border-white/10 space-y-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Briefcase size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-black uppercase tracking-widest">PROVIDER</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200 line-clamp-1 leading-tight">{cuentaSeleccionada.proveedor?.nombre || 'N/A'}</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 capitalize">{cuentaSeleccionada.proveedor?.tipoProveedor || 'Empresa'}</span>
                </div>
              </div>

              <div className="p-6 border-r border-white/10 space-y-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <FileText size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-black uppercase tracking-widest">CONCEPT</span>
                </div>
                <span className="text-sm font-bold text-slate-200 line-clamp-2 leading-tight uppercase text-[11px] tracking-tight">
                  {cuentaSeleccionada.concepto}
                </span>
              </div>

              <div className="p-6 border-r border-white/10 space-y-4">
                <div className="flex items-center space-x-2 text-slate-500 text-center justify-center">
                  <Calendar size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-[1.1]">FECHA DE <br /> EMISIÓN</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-200">
                    {new Date(cuentaSeleccionada.fechaEmision).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="p-6 border-r border-white/10 space-y-4">
                <div className="flex items-center space-x-2 text-slate-500 text-center justify-center">
                  <Calendar size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-[1.1]">FECHA DE <br /> VENCIM...</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-red-300">
                    {new Date(cuentaSeleccionada.fechaVencimiento).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-2 text-slate-500 text-center justify-center">
                  <DollarSign size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-[1.1]">ORIGINAL <br /> AMOUNT</span>
                </div>
                <div className="text-center">
                  <span className="text-base font-black text-white">
                    {formatCurrency(cuentaSeleccionada.montoOriginal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History Section */}
            <div className="p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-400/20">
                    <Clock size={18} className="text-amber-400" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-100 tracking-tight italic">Historial de Pagos</h4>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {historialPagos.length} Pagos Registrados
                </div>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] shadow-xl">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.05] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-white/10">
                    <tr>
                      <th className="px-6 py-5 border-r border-white/5">FECHA</th>
                      <th className="px-6 py-5 border-r border-white/5">MONTO</th>
                      <th className="px-6 py-5 border-r border-white/5 text-center">MÉTODO</th>
                      <th className="px-6 py-5">REGISTRADO POR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {loadingPagos ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-400 opacity-50" />
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando registros...</span>
                        </td>
                      </tr>
                    ) : historialPagos.length > 0 ? (
                      historialPagos.map((pago: any) => (
                        <tr key={pago.id} className="hover:bg-white/[0.03] transition-all group">
                          <td className="px-6 py-5 text-sm font-bold border-r border-white/5 text-slate-400">
                            {new Date(pago.fechaPago).toLocaleDateString('es-DO', { month: 'short', day: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-5 text-sm font-black text-white border-r border-white/5">
                            <span className="text-slate-500 mr-1">$</span>{formatCurrency(pago.monto).replace('$', '')}
                          </td>
                          <td className="px-6 py-5 text-[10px] font-black border-r border-white/5 text-center">
                            <span className={`px-3 py-1.5 rounded-lg border uppercase tracking-widest ${pago.metodoPago === 'caja'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                              {pago.metodoPago === 'caja' ? 'Caja' : pago.metodoPago === 'banco' ? 'Banco' : pago.metodoPago}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-2">
                              <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-[10px] font-black text-indigo-300">
                                {pago.creadoPor?.nombre?.charAt(0)}{pago.creadoPor?.apellido?.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-slate-200">
                                {pago.creadoPor?.nombre} {pago.creadoPor?.apellido}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs italic">
                          No se encontraron pagos para este documento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Premium Footer */}
            <div className="px-8 py-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative flex items-center space-x-4 px-6 py-3.5 bg-[#1e2238] border border-blue-400/30 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    <Check size={16} strokeWidth={4} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Total Pagado</span>
                    <span className="text-lg font-black text-white tracking-tighter">
                      {formatCurrency(Number(cuentaSeleccionada.montoOriginal) - Number(cuentaSeleccionada.montoPendiente))}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalDetalleOpen(false)}
                className="group flex items-center space-x-2 px-10 py-4 bg-slate-700/80 hover:bg-slate-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-white/10"
              >
                <span>Cerrar</span>
                <X size={16} className="text-slate-400 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Crear Proveedor */}
      <Modal
        isOpen={modalCrearProveedorOpen}
        onClose={() => setModalCrearProveedorOpen(false)}
        title="Nuevo Proveedor"
      >
        <form onSubmit={handleCrearProveedor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={nuevoProveedor.nombre}
              onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón Social
            </label>
            <input
              type="text"
              value={nuevoProveedor.razonSocial}
              onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, razonSocial: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RNC / Cédula
            </label>
            <input
              type="text"
              value={nuevoProveedor.rnc}
              onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, rnc: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              value={nuevoProveedor.telefono}
              onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Proveedor
            </label>
            <select
              value={nuevoProveedor.tipoProveedor}
              onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, tipoProveedor: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="servicios">Servicios</option>
              <option value="insumos">Insumos</option>
              <option value="productos">Productos</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setModalCrearProveedorOpen(false)}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--glass-border, #d1d5db)',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--av-text, #1f2937)',
                background: 'var(--glass-bg, #ffffff)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg, #f9fafb)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg, #ffffff)';
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Guardar Proveedor
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CuentasPorPagar;