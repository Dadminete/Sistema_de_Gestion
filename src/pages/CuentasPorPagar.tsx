import React, { useState, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/feature/DataTable';
import Modal from '../components/feature/Modal';
import Swal from 'sweetalert2';
import {
  Receipt, Filter, RefreshCw, Plus, Eye, Edit, Trash2, CreditCard
} from 'lucide-react';
import cuentasPorPagarService, { 
  type CuentaPorPagar, 
  type ResumenCuentasPorPagar,
  type FiltrosCuentasPorPagar 
} from '../services/cuentasPorPagarService';
import proveedorService, { type Proveedor } from '../services/proveedorService';
import KpiWidget from '../components/ui/KpiWidget';
import '../pages/Banks.css';

const CuentasPorPagar: React.FC = () => {
  // Estados principales
  const [cuentas, setCuentas] = useState<CuentaPorPagar[]>([]);
  const [resumen, setResumen] = useState<ResumenCuentasPorPagar | null>(null);
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosCuentasPorPagar>({ estado: 'vencida' });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaPorPagar | null>(null);
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
    moneda: 'DOP',
    observaciones: ''
  });

  const [formPago, setFormPago] = useState({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    metodoPago: 'efectivo',
    numeroReferencia: '',
    observaciones: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
    cargarProveedores();
  }, [filtros]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modoEdicion && cuentaSeleccionada) {
        await cuentasPorPagarService.updateCuentaPorPagar(cuentaSeleccionada.id, formData);
        Swal.fire('Éxito', 'Cuenta por pagar actualizada correctamente', 'success');
      } else {
        await cuentasPorPagarService.createCuentaPorPagar(formData as any);
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
        monto: parseFloat(formPago.monto)
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
      moneda: cuenta.moneda,
      observaciones: cuenta.observaciones || ''
    });
    setCuentaSeleccionada(cuenta);
    setModoEdicion(true);
    setModalFormOpen(true);
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
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {row.original.numeroDocumento}
        </div>
      ),
    },
    {
      accessorKey: 'proveedor.nombre',
      header: 'Proveedor',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.original.proveedor?.nombre || 'Sin proveedor'}
          </div>
          {row.original.proveedor?.razonSocial && (
            <div className="text-sm text-gray-500">
              {row.original.proveedor.razonSocial}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'concepto',
      header: 'Concepto',
      cell: ({ getValue }) => (
        <div className="max-w-xs truncate">
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'fechaVencimiento',
      header: 'Vencimiento',
      cell: ({ getValue }) => (
        <div className="text-sm">
          {new Date(getValue() as string).toLocaleDateString('es-DO')}
        </div>
      ),
    },
    {
      accessorKey: 'montoOriginal',
      header: 'Monto Original',
      cell: ({ getValue }) => (
        <div className="font-medium">
          {formatCurrency(getValue() as number)}
        </div>
      ),
    },
    {
      accessorKey: 'montoPendiente',
      header: 'Monto Pendiente',
      cell: ({ getValue }) => (
        <div className="font-medium text-red-600">
          {formatCurrency(getValue() as number)}
        </div>
      ),
    },
    {
      accessorKey: 'diasVencido',
      header: 'Días Vencido',
      cell: ({ getValue }) => {
        const dias = getValue() as number;
        return (
          <div className={`text-sm ${dias > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {dias > 0 ? `+${dias}` : dias}
          </div>
        );
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
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
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setCuentaSeleccionada(row.original);
              setModalDetalleOpen(true);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row.original)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          {row.original.estado !== 'pagada' && (
            <button
              onClick={() => openPaymentModal(row.original)}
              className="text-green-600 hover:text-green-900"
              title="Registrar pago"
            >
              <CreditCard className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.original.id)}
            className="text-red-600 hover:text-red-900"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], []);

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
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        resetForm();
                        setModalFormOpen(true);
                      }}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nueva Cuenta
                    </button>
                    <button
                      onClick={() => setMostrarFiltros(!mostrarFiltros)}
                      className={`inline-flex items-center justify-center px-6 py-3 border-2 rounded-lg shadow-lg text-sm font-semibold transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        mostrarFiltros 
                          ? 'border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Filtros
                    </button>
                    <button
                      onClick={cargarDatos}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-lg shadow-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
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
                title="TOTAL POR PAGAR"
                value={formatCurrency(resumen.totalPorPagar)}
                percentage={`${resumen.cuentasPendientes} cuentas pendientes`}
                percentageClass="neutral"
                icon={<span className="material-icons">monetization_on</span>}
                barColor="#00BFA5"
              />

              <KpiWidget
                title="TOTAL VENCIDAS"
                value={formatCurrency(resumen.totalVencidas)}
                percentage={`${resumen.cuentasVencidas} cuentas vencidas`}
                percentageClass={resumen.totalVencidas > 0 ? "negative" : "neutral"}
                icon={<span className="material-icons">warning</span>}
                barColor="#F44336"
              />

              <KpiWidget
                title="PRÓXIMAS A VENCER"
                value={formatCurrency(resumen.totalProximasVencer)}
                percentage={"Próximos 7 días"}
                percentageClass={resumen.totalProximasVencer > 0 ? "warning" : "neutral"}
                icon={<span className="material-icons">schedule</span>}
                barColor="#FF9800"
              />

              <KpiWidget
                title="CUENTAS PENDIENTES"
                value={resumen.cuentasPendientes.toString()}
                percentage={`De ${resumen.cuentasPendientes + resumen.cuentasVencidas} total`}
                percentageClass="positive"
                icon={<span className="material-icons">receipt_long</span>}
                barColor="#2196F3"
              />
              <KpiWidget
                title="CUENTAS VENCIDAS"
                value={resumen.cuentasVencidas.toString()}
                percentage={resumen.cuentasVencidas > 0 ? "Requieren atención" : "Al día"}
                percentageClass={resumen.cuentasVencidas > 0 ? "negative" : "positive"}
                icon={<span className="material-icons">error_outline</span>}
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
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Formulario */}
      <Modal
        open={modalFormOpen}
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
                Proveedor
              </label>
              <select
                value={formData.proveedorId}
                onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Sin proveedor específico</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      </Modal>

      {/* Modal Pago */}
      <Modal
        open={modalPagoOpen}
        onClose={() => {
          setModalPagoOpen(false);
          setFormPago({
            monto: '',
            fechaPago: new Date().toISOString().split('T')[0],
            metodoPago: 'efectivo',
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
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

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
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      </Modal>

      {/* Modal Detalles */}
      <Modal
        open={modalDetalleOpen}
        onClose={() => {
          setModalDetalleOpen(false);
          setCuentaSeleccionada(null);
        }}
        title="Detalles de la Cuenta"
      >
        {cuentaSeleccionada && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  No. Documento
                </label>
                <p className="text-sm text-gray-900">{cuentaSeleccionada.numeroDocumento}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Tipo de Documento
                </label>
                <p className="text-sm text-gray-900">{cuentaSeleccionada.tipoDocumento}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Proveedor
                </label>
                <p className="text-sm text-gray-900">
                  {cuentaSeleccionada.proveedor?.nombre || 'Sin proveedor'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Concepto
                </label>
                <p className="text-sm text-gray-900">{cuentaSeleccionada.concepto}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Fecha de Emisión
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(cuentaSeleccionada.fechaEmision).toLocaleDateString('es-DO')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Fecha de Vencimiento
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(cuentaSeleccionada.fechaVencimiento).toLocaleDateString('es-DO')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Monto Original
                </label>
                <p className="text-sm text-gray-900">
                  {formatCurrency(cuentaSeleccionada.montoOriginal)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Monto Pendiente
                </label>
                <p className="text-sm text-red-600 font-medium">
                  {formatCurrency(cuentaSeleccionada.montoPendiente)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Estado
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(cuentaSeleccionada.estado)}`}>
                  {cuentaSeleccionada.estado.charAt(0).toUpperCase() + cuentaSeleccionada.estado.slice(1)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Días Vencido
                </label>
                <p className={`text-sm ${cuentaSeleccionada.diasVencido > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {cuentaSeleccionada.diasVencido > 0 ? `+${cuentaSeleccionada.diasVencido}` : cuentaSeleccionada.diasVencido}
                </p>
              </div>
            </div>
            {cuentaSeleccionada.observaciones && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Observaciones
                </label>
                <p className="text-sm text-gray-900">{cuentaSeleccionada.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CuentasPorPagar;