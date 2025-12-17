import React, { useState, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/feature/DataTable';
import Modal from '../components/feature/Modal';
import Swal from 'sweetalert2';
import {
  CreditCard, AlertTriangle, Calendar, DollarSign, TrendingUp,
  Filter, Download, RefreshCw, Plus, Eye, Edit, Trash2,
  Clock, AlertCircle, CheckCircle, Users, FileText, Send,
  BarChart3, PieChart, Phone, Mail, MessageSquare
} from 'lucide-react';
import './CuentasPorCobrar.css';
import cuentasPorCobrarService, { 
  type CuentaPorCobrar, 
  type ResumenCuentasPorCobrar,
  type EdadCartera,
  type FiltrosCuentasPorCobrar 
} from '../services/cuentasPorCobrarService';

const CuentasPorCobrar: React.FC = () => {
  // Estados principales
  const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([]);
  const [resumen, setResumen] = useState<ResumenCuentasPorCobrar | null>(null);
  const [edadCartera, setEdadCartera] = useState<EdadCartera | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertas, setAlertas] = useState<any[]>([]);

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosCuentasPorCobrar>({ estado: 'vencida' });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de modales
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalRecordatorioOpen, setModalRecordatorioOpen] = useState(false);
  const [modalAnalyticsOpen, setModalAnalyticsOpen] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaPorCobrar | null>(null);

  // Estados de formularios
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
  }, [filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [cuentasData, resumenData, edadData, alertasData] = await Promise.all([
        cuentasPorCobrarService.getCuentasPorCobrar(filtros),
        cuentasPorCobrarService.getResumenCuentasPorCobrar(),
        cuentasPorCobrarService.getEdadCartera(),
        cuentasPorCobrarService.getAlertas()
      ]);

      setCuentas(cuentasData);
      setResumen(resumenData);
      setEdadCartera(edadData);
      setAlertas(alertasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire('Error', 'Error al cargar los datos de cuentas por cobrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de manejo de eventos
  const handleVerDetalle = (cuenta: CuentaPorCobrar) => {
    setCuentaSeleccionada(cuenta);
    setModalDetalleOpen(true);
  };

  const handleRegistrarPago = (cuenta: CuentaPorCobrar) => {
    setCuentaSeleccionada(cuenta);
    setFormPago(prev => ({ ...prev, monto: cuenta.montoPendiente.toString() }));
    setModalPagoOpen(true);
  };

  const handleEnviarRecordatorio = (cuenta: CuentaPorCobrar) => {
    setCuentaSeleccionada(cuenta);
    setModalRecordatorioOpen(true);
  };

  const handleAnalytics = () => {
    setModalAnalyticsOpen(true);
  };

  const submitPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaSeleccionada) return;

    try {
      await cuentasPorCobrarService.registrarPago(cuentaSeleccionada.id, {
        monto: parseFloat(formPago.monto),
        fechaPago: formPago.fechaPago,
        metodoPago: formPago.metodoPago,
        numeroReferencia: formPago.numeroReferencia || undefined,
        observaciones: formPago.observaciones || undefined
      });

      Swal.fire('¡Éxito!', 'Pago registrado correctamente', 'success');
      setModalPagoOpen(false);
      cargarDatos();
    } catch (error) {
      Swal.fire('Error', 'Error al registrar el pago', 'error');
    }
  };

  const enviarRecordatorio = async (tipo: 'email' | 'whatsapp' | 'sms') => {
    if (!cuentaSeleccionada) return;

    try {
      if (tipo === 'whatsapp') {
        // Función para WhatsApp
        const cliente = cuentaSeleccionada.cliente;
        if (!cliente?.telefono) {
          Swal.fire('Error', 'El cliente no tiene número de teléfono registrado', 'error');
          return;
        }

        const mensaje = `Estimado/a ${cliente.nombre} ${cliente.apellidos},

Le recordamos que tiene una cuenta pendiente de pago:

📄 Factura: ${cuentaSeleccionada.numeroDocumento}
💰 Monto: ${formatMoney(cuentaSeleccionada.montoPendiente, cuentaSeleccionada.moneda)}
📅 Fecha de vencimiento: ${new Date(cuentaSeleccionada.fechaVencimiento).toLocaleDateString('es-DO')}
⏰ Días vencidos: ${cuentaSeleccionada.diasVencido} días

Por favor, proceda con el pago a la brevedad posible.

Gracias por su atención.`;

        // Formatear número de teléfono (remover caracteres especiales y agregar código de país si es necesario)
        let telefono = cliente.telefono.replace(/\D/g, '');
        if (telefono.startsWith('1') && telefono.length === 11) {
          // Ya tiene código de país US/CA, no necesita modificación
        } else if (telefono.length === 10) {
          telefono = '1' + telefono; // Agregar código de país US/CA
        } else if (telefono.startsWith('809') || telefono.startsWith('829') || telefono.startsWith('849')) {
          telefono = '1' + telefono; // República Dominicana
        }

        const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
        
        // Registrar el envío en el backend
        await cuentasPorCobrarService.enviarRecordatorio(cuentaSeleccionada.id, tipo);
        Swal.fire('¡WhatsApp abierto!', 'Se ha abierto WhatsApp con el mensaje predefinido', 'success');
        setModalRecordatorioOpen(false);

      } else if (tipo === 'sms') {
        // Función para SMS
        const cliente = cuentaSeleccionada.cliente;
        if (!cliente?.telefono) {
          Swal.fire('Error', 'El cliente no tiene número de teléfono registrado', 'error');
          return;
        }

        const mensajeSMS = `Recordatorio de pago - Factura ${cuentaSeleccionada.numeroDocumento}: ${formatMoney(cuentaSeleccionada.montoPendiente, cuentaSeleccionada.moneda)}. Vencida hace ${cuentaSeleccionada.diasVencido} días. Favor realizar pago.`;

        // Formatear número de teléfono
        const telefono = cliente.telefono.replace(/\D/g, '');
        
        // Para SMS, usar el protocolo sms:
        const smsUrl = `sms:${telefono}?body=${encodeURIComponent(mensajeSMS)}`;
        
        // Intentar abrir la aplicación de SMS
        try {
          window.location.href = smsUrl;
          // Registrar el envío en el backend
          await cuentasPorCobrarService.enviarRecordatorio(cuentaSeleccionada.id, tipo);
          Swal.fire('¡SMS preparado!', 'Se ha abierto la aplicación de SMS con el mensaje', 'success');
          setModalRecordatorioOpen(false);
        } catch {
          // Fallback: copiar mensaje al portapapeles
          navigator.clipboard.writeText(mensajeSMS).then(() => {
            Swal.fire({
              title: '📱 Mensaje copiado',
              html: `<p>El mensaje ha sido copiado al portapapeles:</p>
                     <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                     <p><strong>Mensaje:</strong> ${mensajeSMS}</p>`,
              icon: 'info'
            });
          });
        }

      } else {
        // Para email, usar el servicio original
        await cuentasPorCobrarService.enviarRecordatorio(cuentaSeleccionada.id, tipo);
        Swal.fire('¡Enviado!', `Recordatorio enviado por ${tipo}`, 'success');
        setModalRecordatorioOpen(false);
      }
    } catch {
      Swal.fire('Error', 'Error al enviar recordatorio', 'error');
    }
  };

  // Función para formatear monedas
  const formatMoney = (amount: number, currency: string = 'DOP') => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Función para calcular clase de días vencidos
  const getDiasVencidoClass = (dias: number) => {
    if (dias <= 0) return 'al-dia';
    if (dias <= 30) return 'vencido-leve';
    if (dias <= 60) return 'vencido-moderado';
    return 'vencido-severo';
  };

  // Definición de columnas de la tabla
  const columns: ColumnDef<CuentaPorCobrar>[] = useMemo(() => [
    {
      accessorKey: 'numeroDocumento',
      header: 'Documento',
      cell: ({ row }) => (
        <div className="font-mono font-semibold text-slate-700">
          {row.original.numeroDocumento}
        </div>
      ),
    },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => {
        const cliente = row.original.cliente;
        return (
          <div>
            <div className="font-semibold text-slate-900">
              {cliente ? `${cliente.nombre} ${cliente.apellidos}` : 'N/A'}
            </div>
            {cliente?.telefono && (
              <div className="text-sm text-slate-500">{cliente.telefono}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'montoOriginal',
      header: 'Monto Original',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">
          {formatMoney(row.original.montoOriginal, row.original.moneda)}
        </span>
      ),
    },
    {
      accessorKey: 'montoPendiente',
      header: 'Pendiente',
      cell: ({ row }) => (
        <span className="font-bold text-lg text-red-600">
          {formatMoney(row.original.montoPendiente, row.original.moneda)}
        </span>
      ),
    },
    {
      accessorKey: 'fechaVencimiento',
      header: 'Vencimiento',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {new Date(row.original.fechaVencimiento).toLocaleDateString('es-DO')}
          </div>
          <div className={`dias-vencido ${getDiasVencidoClass(row.original.diasVencido)}`}>
            {row.original.diasVencido > 0 ? `${row.original.diasVencido} días` : 'Al día'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`estado-badge ${row.original.estado}`}>
          {row.original.estado === 'pendiente' && <Clock size={12} />}
          {row.original.estado === 'vencida' && <AlertCircle size={12} />}
          {row.original.estado === 'pagada' && <CheckCircle size={12} />}
          {row.original.estado === 'parcial' && <AlertTriangle size={12} />}
          {row.original.estado}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="acciones-inline">
          <button
            onClick={() => handleVerDetalle(row.original)}
            className="icon-btn icon-btn-view"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleRegistrarPago(row.original)}
            className="icon-btn icon-btn-pay"
            title="Registrar pago"
            disabled={row.original.estado === 'pagada'}
          >
            <DollarSign size={16} />
          </button>
          <button
            onClick={() => handleEnviarRecordatorio(row.original)}
            className="icon-btn icon-btn-send"
            title="Enviar recordatorio"
            disabled={row.original.estado === 'pagada'}
          >
            <Send size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="cuentas-por-cobrar-container">
      {/* Header */}
      <div className="cuentas-por-cobrar-header">
        <div className="header-content">
          <h1>
            <CreditCard size={40} />
            Cuentas por Cobrar
          </h1>
          <p>Gestión integral de cartera de clientes y cobros</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-accion btn-secondary"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            title="Filtros"
          >
            <Filter size={18} />
          </button>
          <button
            className="btn-accion btn-primary"
            onClick={() => cuentasPorCobrarService.exportarReporte('excel', filtros)}
            title="Exportar"
          >
            <Download size={18} />
          </button>
          <button
            className="btn-accion btn-success"
            onClick={cargarDatos}
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {resumen && (
        <div className="kpi-cards-grid">
          <div className="kpi-card total-por-cobrar">
            <div className="kpi-header">
              <div>
                <h3 className="kpi-title">Total por Cobrar</h3>
                <div className="kpi-value">{formatMoney(resumen.totalPorCobrar)}</div>
                <p className="kpi-subtitle">
                  <Users size={14} />
                  {resumen.cuentasPendientes} cuentas pendientes
                </p>
              </div>
              <div className="kpi-icon">
                <CreditCard size={24} />
              </div>
            </div>
          </div>

          <div className="kpi-card vencidas">
            <div className="kpi-header">
              <div>
                <h3 className="kpi-title">Vencidas</h3>
                <div className="kpi-value">{formatMoney(resumen.totalVencidas)}</div>
                <p className="kpi-subtitle">
                  <AlertTriangle size={14} />
                  {resumen.cuentasVencidas} cuentas vencidas
                </p>
              </div>
              <div className="kpi-icon">
                <AlertCircle size={24} />
              </div>
            </div>
          </div>

          <div className="kpi-card proximas-vencer">
            <div className="kpi-header">
              <div>
                <h3 className="kpi-title">Próximas a Vencer</h3>
                <div className="kpi-value">{formatMoney(resumen.totalProximasVencer)}</div>
                <p className="kpi-subtitle">
                  <Calendar size={14} />
                  Próximos 7 días
                </p>
              </div>
              <div className="kpi-icon">
                <Clock size={24} />
              </div>
            </div>
          </div>

          <div className="kpi-card cobradas">
            <div className="kpi-header">
              <div>
                <h3 className="kpi-title">Cobradas este Mes</h3>
                <div className="kpi-value">{formatMoney(resumen.totalCobradas)}</div>
                <p className="kpi-subtitle">
                  <TrendingUp size={14} />
                  Promedio: {resumen.promedioTiempoCobro} días
                </p>
              </div>
              <div className="kpi-icon">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="alertas-section">
          <div className="alertas-grid">
            {alertas.map((alerta, index) => (
              <div key={index} className={`alerta-card ${alerta.tipo}`}>
                <div className="alerta-header">
                  <h4 className="alerta-title">
                    {alerta.tipo === 'critica' && <AlertCircle size={16} />}
                    {alerta.tipo === 'advertencia' && <AlertTriangle size={16} />}
                    {alerta.tipo === 'info' && <FileText size={16} />}
                    {alerta.titulo}
                  </h4>
                  <span className="alerta-count">{alerta.cantidad}</span>
                </div>
                <p>{alerta.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Rápidos */}
      <div className="filtros-rapidos">
        <h3 className="filtros-rapidos-title">Filtros Rápidos:</h3>
        <div className="filtros-rapidos-buttons">
          <button 
            className={`filtro-rapido-btn ${!filtros.estado ? 'active' : ''}`}
            onClick={() => setFiltros({ ...filtros, estado: undefined })}
          >
            <Users size={16} />
            Todas
          </button>
          <button 
            className={`filtro-rapido-btn vencida ${filtros.estado === 'vencida' ? 'active' : ''}`}
            onClick={() => setFiltros({ ...filtros, estado: 'vencida' })}
          >
            <AlertCircle size={16} />
            Solo Vencidas
          </button>
          <button 
            className={`filtro-rapido-btn pendiente ${filtros.estado === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFiltros({ ...filtros, estado: 'pendiente' })}
          >
            <Clock size={16} />
            Solo Pendientes
          </button>
          <button 
            className={`filtro-rapido-btn pagada ${filtros.estado === 'pagada' ? 'active' : ''}`}
            onClick={() => setFiltros({ ...filtros, estado: 'pagada' })}
          >
            <CheckCircle size={16} />
            Solo Pagadas
          </button>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="filtros-container">
          <div className="filtros-header">
            <h3 className="filtros-title">
              <Filter size={20} />
              Filtros Avanzados
            </h3>
          </div>
          <div className="filtros-grid">
            <div className="filtro-grupo">
              <label className="filtro-label">Estado</label>
              <select
                className="filtro-select"
                value={filtros.estado || ''}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value || undefined })}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencida">Vencida</option>
                <option value="parcial">Parcial</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>
            <div className="filtro-grupo">
              <label className="filtro-label">Fecha Desde</label>
              <input
                type="date"
                className="filtro-input"
                value={filtros.fechaDesde || ''}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value || undefined })}
              />
            </div>
            <div className="filtro-grupo">
              <label className="filtro-label">Fecha Hasta</label>
              <input
                type="date"
                className="filtro-input"
                value={filtros.fechaHasta || ''}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value || undefined })}
              />
            </div>
            <div className="filtro-grupo">
              <label className="filtro-label">Monto Mínimo</label>
              <input
                type="number"
                className="filtro-input"
                placeholder="0.00"
                value={filtros.montoMinimo || ''}
                onChange={(e) => setFiltros({ ...filtros, montoMinimo: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div className="filtros-acciones">
            <button
              className="btn-accion btn-secondary"
              onClick={() => setFiltros({})}
            >
              Limpiar Filtros
            </button>
            <button
              className="btn-accion btn-primary"
              onClick={cargarDatos}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Cuentas */}
      <div className="tabla-cuentas-container">
        <div className="tabla-header">
          <h3 className="tabla-title">Listado de Cuentas por Cobrar</h3>
          <div className="tabla-acciones">
            <button 
              className="btn-accion btn-secondary"
              onClick={handleAnalytics}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <button className="btn-accion btn-primary">
              <Plus size={16} />
              Nueva Cuenta
            </button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={cuentas}
          isLoading={loading}
          tableName="cuentas-por-cobrar"
        />
      </div>

      {/* Modal Registrar Pago */}
      {modalPagoOpen && (
        <Modal
          isOpen={modalPagoOpen}
          onClose={() => setModalPagoOpen(false)}
          title="Registrar Pago"
        >
          <form onSubmit={submitPago}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Monto del Pago</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Pago</label>
                <input
                  type="date"
                  className="form-input"
                  value={formPago.fechaPago}
                  onChange={(e) => setFormPago({ ...formPago, fechaPago: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Método de Pago</label>
                <select
                  className="form-select"
                  value={formPago.metodoPago}
                  onChange={(e) => setFormPago({ ...formPago, metodoPago: e.target.value })}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Número de Referencia</label>
                <input
                  type="text"
                  className="form-input"
                  value={formPago.numeroReferencia}
                  onChange={(e) => setFormPago({ ...formPago, numeroReferencia: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-textarea"
                  value={formPago.observaciones}
                  onChange={(e) => setFormPago({ ...formPago, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-accion btn-secondary"
                onClick={() => setModalPagoOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-accion btn-success">
                <DollarSign size={16} />
                Registrar Pago
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Enviar Recordatorio */}
      {modalRecordatorioOpen && cuentaSeleccionada && (
        <Modal
          isOpen={modalRecordatorioOpen}
          onClose={() => setModalRecordatorioOpen(false)}
          title="Enviar Recordatorio de Pago"
        >
          <div className="modal-body">
            <p className="mb-6">
              Enviar recordatorio a <strong>{cuentaSeleccionada.cliente?.nombre} {cuentaSeleccionada.cliente?.apellidos}</strong>
              <br />
              Monto pendiente: <strong>{formatMoney(cuentaSeleccionada.montoPendiente)}</strong>
            </p>
            <div className="recordatorio-buttons-grid">
              <button
                className="recordatorio-btn email-btn"
                onClick={() => enviarRecordatorio('email')}
              >
                <div className="app-icon email-icon">
                  <Mail size={24} />
                </div>
                <div className="btn-content">
                  <span className="btn-title">Email</span>
                  <span className="btn-subtitle">Correo electrónico</span>
                </div>
              </button>
              <button
                className="recordatorio-btn whatsapp-btn"
                onClick={() => enviarRecordatorio('whatsapp')}
              >
                <div className="app-icon whatsapp-icon">
                  <MessageSquare size={24} />
                </div>
                <div className="btn-content">
                  <span className="btn-title">WhatsApp</span>
                  <span className="btn-subtitle">Mensaje instantáneo</span>
                </div>
              </button>
              <button
                className="recordatorio-btn sms-btn"
                onClick={() => enviarRecordatorio('sms')}
              >
                <div className="app-icon sms-icon">
                  <Phone size={24} />
                </div>
                <div className="btn-content">
                  <span className="btn-title">SMS</span>
                  <span className="btn-subtitle">Mensaje de texto</span>
                </div>
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn-accion btn-secondary"
              onClick={() => setModalRecordatorioOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Analytics */}
      {modalAnalyticsOpen && (
        <Modal
          isOpen={modalAnalyticsOpen}
          onClose={() => setModalAnalyticsOpen(false)}
          title="📊 Analytics & Reportes - Cuentas por Cobrar"
          size="full"
        >
          <div className="modal-body analytics-modal-body">
            <div className="analytics-content">
              {/* Resumen General Expandido */}
              {resumen && (
                <div className="analytics-section">
                  <h4 className="analytics-section-title">
                    <PieChart size={20} />
                    Resumen Ejecutivo de Cartera
                  </h4>
                  <div className="analytics-grid-horizontal">
                    <div className="analytics-card primary">
                      <div className="analytics-metric">
                        <span className="metric-label">💰 Total por Cobrar</span>
                        <span className="metric-value">{formatMoney(resumen.totalPorCobrar)}</span>
                        <span className="metric-subtitle">Monto total pendiente de cobro</span>
                      </div>
                    </div>
                    <div className="analytics-card danger">
                      <div className="analytics-metric">
                        <span className="metric-label">⚠️ Cuentas Vencidas</span>
                        <span className="metric-value text-red-600">{resumen.cuentasVencidas}</span>
                        <span className="metric-subtitle">Requieren atención inmediata</span>
                      </div>
                    </div>
                    <div className="analytics-card warning">
                      <div className="analytics-metric">
                        <span className="metric-label">⏳ Cuentas Pendientes</span>
                        <span className="metric-value text-amber-600">{resumen.cuentasPendientes}</span>
                        <span className="metric-subtitle">En proceso de cobro</span>
                      </div>
                    </div>
                    <div className="analytics-card success">
                      <div className="analytics-metric">
                        <span className="metric-label">✅ Tasa de Recuperación</span>
                        <span className="metric-value text-green-600">
                          {((resumen.totalCobradas / (resumen.totalPorCobrar + resumen.totalCobradas)) * 100).toFixed(1)}%
                        </span>
                        <span className="metric-subtitle">Eficiencia de cobranza</span>
                      </div>
                    </div>
                    <div className="analytics-card info">
                      <div className="analytics-metric">
                        <span className="metric-label">💵 Total Cobrado</span>
                        <span className="metric-value text-blue-600">{formatMoney(resumen.totalCobradas)}</span>
                        <span className="metric-subtitle">Monto ya recuperado</span>
                      </div>
                    </div>
                    <div className="analytics-card neutral">
                      <div className="analytics-metric">
                        <span className="metric-label">📊 Promedio por Cuenta</span>
                        <span className="metric-value text-purple-600">
                          {formatMoney(resumen.totalPorCobrar / (resumen.cuentasPendientes + resumen.cuentasVencidas || 1))}
                        </span>
                        <span className="metric-subtitle">Valor medio de cuentas</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Análisis Detallado de Edad de Cartera */}
              {edadCartera && (
                <div className="analytics-section">
                  <h4 className="analytics-section-title">
                    <BarChart3 size={20} />
                    Análisis de Antigüedad de Cartera
                  </h4>
                  <div className="edad-cartera-grid-horizontal">
                    <div className="edad-item-expanded al-dia">
                      <div className="edad-header">
                        <span className="edad-icon">✅</span>
                        <span className="edad-label">Al Día</span>
                        <span className="edad-badge good">SALUDABLE</span>
                      </div>
                      <div className="edad-metrics">
                        <div className="edad-metric">
                          <span className="edad-count">{edadCartera.alDia.count}</span>
                          <span className="edad-count-label">cuentas</span>
                        </div>
                        <div className="edad-metric">
                          <span className="edad-monto">{formatMoney(edadCartera.alDia.monto)}</span>
                          <span className="edad-percentage">
                            {resumen ? ((edadCartera.alDia.monto / resumen.totalPorCobrar) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="edad-item-expanded dias-1-30">
                      <div className="edad-header">
                        <span className="edad-icon">⚡</span>
                        <span className="edad-label">1-30 días</span>
                        <span className="edad-badge attention">SEGUIMIENTO</span>
                      </div>
                      <div className="edad-metrics">
                        <div className="edad-metric">
                          <span className="edad-count">{edadCartera.dias1a30.count}</span>
                          <span className="edad-count-label">cuentas</span>
                        </div>
                        <div className="edad-metric">
                          <span className="edad-monto">{formatMoney(edadCartera.dias1a30.monto)}</span>
                          <span className="edad-percentage">
                            {resumen ? ((edadCartera.dias1a30.monto / resumen.totalPorCobrar) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="edad-item-expanded dias-31-60">
                      <div className="edad-header">
                        <span className="edad-icon">⚠️</span>
                        <span className="edad-label">31-60 días</span>
                        <span className="edad-badge warning">CUIDADO</span>
                      </div>
                      <div className="edad-metrics">
                        <div className="edad-metric">
                          <span className="edad-count">{edadCartera.dias31a60.count}</span>
                          <span className="edad-count-label">cuentas</span>
                        </div>
                        <div className="edad-metric">
                          <span className="edad-monto">{formatMoney(edadCartera.dias31a60.monto)}</span>
                          <span className="edad-percentage">
                            {resumen ? ((edadCartera.dias31a60.monto / resumen.totalPorCobrar) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="edad-item-expanded dias-61-90">
                      <div className="edad-header">
                        <span className="edad-icon">🚨</span>
                        <span className="edad-label">61-90 días</span>
                        <span className="edad-badge danger">URGENTE</span>
                      </div>
                      <div className="edad-metrics">
                        <div className="edad-metric">
                          <span className="edad-count">{edadCartera.dias61a90.count}</span>
                          <span className="edad-count-label">cuentas</span>
                        </div>
                        <div className="edad-metric">
                          <span className="edad-monto">{formatMoney(edadCartera.dias61a90.monto)}</span>
                          <span className="edad-percentage">
                            {resumen ? ((edadCartera.dias61a90.monto / resumen.totalPorCobrar) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="edad-item-expanded mas-90-dias">
                      <div className="edad-header">
                        <span className="edad-icon">💀</span>
                        <span className="edad-label">+90 días</span>
                        <span className="edad-badge critical">CRÍTICO</span>
                      </div>
                      <div className="edad-metrics">
                        <div className="edad-metric">
                          <span className="edad-count">{edadCartera.mas90dias.count}</span>
                          <span className="edad-count-label">cuentas</span>
                        </div>
                        <div className="edad-metric">
                          <span className="edad-monto">{formatMoney(edadCartera.mas90dias.monto)}</span>
                          <span className="edad-percentage">
                            {resumen ? ((edadCartera.mas90dias.monto / resumen.totalPorCobrar) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recomendaciones basadas en análisis */}
                  <div className="analytics-recommendations">
                    <h5 className="recommendations-title">
                      <AlertTriangle size={16} />
                      Recomendaciones de Acción
                    </h5>
                    <div className="recommendations-grid">
                      {resumen && resumen.cuentasVencidas > 5 && (
                        <div className="recommendation urgent">
                          <span className="rec-icon">🚨</span>
                          <span className="rec-text">Priorizar cobro de {resumen.cuentasVencidas} cuentas vencidas</span>
                        </div>
                      )}
                      {edadCartera.mas90dias.count > 0 && (
                        <div className="recommendation critical">
                          <span className="rec-icon">⚖️</span>
                          <span className="rec-text">Evaluar proceso legal para {edadCartera.mas90dias.count} cuentas +90 días</span>
                        </div>
                      )}
                      {resumen && ((resumen.totalCobradas / (resumen.totalPorCobrar + resumen.totalCobradas)) * 100) < 70 && (
                        <div className="recommendation warning">
                          <span className="rec-icon">📈</span>
                          <span className="rec-text">Mejorar estrategias de cobranza (tasa actual bajo 70%)</span>
                        </div>
                      )}
                      <div className="recommendation info">
                        <span className="rec-icon">📞</span>
                        <span className="rec-text">Programar recordatorios para {edadCartera.dias1a30.count} cuentas 1-30 días</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!edadCartera && (
                <div className="analytics-loading">
                  <p>Cargando datos de analytics...</p>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer analytics-footer">
            <div className="footer-left">
              <button
                className="btn-accion btn-secondary"
                onClick={() => setModalAnalyticsOpen(false)}
              >
                <Eye size={16} />
                Cerrar Vista
              </button>
            </div>
            <div className="footer-right">
              <button
                className="btn-accion btn-success"
                onClick={cargarDatos}
              >
                <RefreshCw size={16} />
                Actualizar Datos
              </button>
              <button
                className="btn-accion btn-warning"
                onClick={() => cuentasPorCobrarService.exportarReporte('excel', filtros)}
              >
                <FileText size={16} />
                Excel
              </button>
              <button
                className="btn-accion btn-primary"
                onClick={() => cuentasPorCobrarService.exportarReporte('pdf', filtros)}
              >
                <Download size={16} />
                PDF Completo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CuentasPorCobrar;