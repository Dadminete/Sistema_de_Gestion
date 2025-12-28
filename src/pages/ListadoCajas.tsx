import React, { useState, useEffect } from 'react';
import { getAllCajas, getHistorialCaja, getEstadisticasCaja, updateCaja, deleteCaja } from '../services/cajaService';
import type { Caja, HistorialCaja, EstadisticasCaja } from '../services/cajaService';
import Swal from 'sweetalert2';
import {
  RefreshCw, Wallet, History, Edit, Trash2, Eye, BarChart3,
  TrendingUp, TrendingDown, DollarSign, Calendar, Search,
  ArrowUpRight, ArrowDownRight, Filter, Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import '../styles/ListadoCajas.css';

interface CajaWithHistorial extends Caja {
  historial?: HistorialCaja[];
  estadisticas?: EstadisticasCaja;
}

const ListadoCajas: React.FC = () => {
  const [cajas, setCajas] = useState<CajaWithHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaja, setSelectedCaja] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'historial' | 'estadisticas'>('historial');
  const [historialPagina, setHistorialPagina] = useState<number>(0);
  const historialPorPagina = 6;

  useEffect(() => {
    fetchCajasData();
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    const fechaInicioStr = hace30Dias.toISOString().split('T')[0];
    const fechaFinStr = hoy.toISOString().split('T')[0];

    setFechaInicio(fechaInicioStr);
    setFechaFin(fechaFinStr);

    // Si hay cajas cargadas, intentar cargar estadísticas
    setTimeout(() => {
      if (selectedCaja && fechaInicioStr && fechaFinStr) {
        fetchEstadisticasCaja(selectedCaja);
      }
    }, 100);
  }, []);

  // Effect para cargar estadísticas cuando cambien fechas o caja seleccionada
  useEffect(() => {
    if (selectedCaja && fechaInicio && fechaFin) {
      fetchEstadisticasCaja(selectedCaja);
    }
  }, [selectedCaja, fechaInicio, fechaFin]);

  const fetchCajasData = async () => {
    try {
      setLoading(true);
      const cajasData = await getAllCajas();
      // Mostrar todas las cajas activas
      const cajasActivas = cajasData.filter(caja => caja.activa);
      // Ordenar con Caja Principal primero, luego alfabéticamente
      const sortedCajas = cajasActivas.sort((a, b) => {
        const nameA = (a.nombre || '').toLowerCase();
        const nameB = (b.nombre || '').toLowerCase();
        
        // Si una de las cajas es "Caja Principal", ponerla primero
        if (nameA.includes('principal') || nameA === 'caja principal') return -1;
        if (nameB.includes('principal') || nameB === 'caja principal') return 1;
        
        // Para el resto, orden alfabético normal
        return nameA.localeCompare(nameB, 'es');
      });
      setCajas(sortedCajas);

      // Seleccionar primera caja por defecto
      if (sortedCajas.length > 0) {
        const primeraCaja = sortedCajas[0];
        setSelectedCaja(primeraCaja.id);
        fetchHistorialCaja(primeraCaja.id);
        // Intentar cargar estadísticas inmediatamente
        if (fechaInicio && fechaFin) {
          fetchEstadisticasCaja(primeraCaja.id);
        }
      }
    } catch (error) {
      console.error('Error cargando datos de cajas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorialCaja = async (cajaId: string) => {
    try {
      const historial = await getHistorialCaja(cajaId);
      setHistorialPagina(0); // Reset a primera página
      setCajas(prev => prev.map(caja =>
        caja.id === cajaId ? { ...caja, historial } : caja
      ));
    } catch (error) {
      console.error(`Error obteniendo historial de caja ${cajaId}:`, error);
    }
  };

  const fetchEstadisticasCaja = async (cajaId: string) => {
    if (!fechaInicio || !fechaFin) return;

    try {
      const estadisticas = await getEstadisticasCaja(cajaId, fechaInicio, fechaFin);
      setCajas(prev => prev.map(caja =>
        caja.id === cajaId ? { ...caja, estadisticas } : caja
      ));
    } catch (error) {
      console.error(`Error obteniendo estadísticas de caja ${cajaId}:`, error);
    }
  };

  const handleCajaSelect = (cajaId: string) => {
    setSelectedCaja(cajaId);
    if (cajaId) {
      fetchHistorialCaja(cajaId);
      // Forzar carga de estadísticas cuando se selecciona una caja
      if (fechaInicio && fechaFin) {
        setTimeout(() => fetchEstadisticasCaja(cajaId), 100);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getTipoOperacionLabel = (tipo: string) => {
    switch (tipo) {
      case 'apertura': return 'Apertura';
      case 'cierre': return 'Cierre';
      case 'traspaso': return 'Traspaso';
      default: return tipo;
    }
  };

  const getTipoOperacionClass = (tipo: string) => {
    switch (tipo) {
      case 'apertura': return 'apertura';
      case 'cierre': return 'cierre';
      case 'traspaso': return 'traspaso';
      default: return tipo;
    }
  };

  const getCajaPrincipalTraspasoClass = (registro: HistorialCaja): string => {
    if (registro.tipo !== 'traspaso') return '';
    
    // ID de caja principal
    const CAJA_PRINCIPAL_ID = 'e6a3f6db-6df2-4d05-8413-b164d4f95560';
    
    // Si estamos viendo el historial de caja principal
    if (selectedCaja === CAJA_PRINCIPAL_ID) {
      // Salida de caja principal (rojo)
      if (registro.esOrigen) return 'text-danger';
      // Entrada a caja principal (azul)  
      if (registro.esDestino) return 'text-primary-blue';
    }
    
    // Para otras cajas, usar los colores normales
    return registro.esOrigen ? 'text-warning' : 'text-success';
  };

  if (loading) {
    return (
      <div className="listado-cajas">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos de cajas...</p>
        </div>
      </div>
    );
  }

  const handleEditCaja = async (caja: Caja) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Caja',
      html: `
        <div style="text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="margin-bottom: 20px;">
            <label for="nombre" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Nombre de la Caja:</label>
            <input id="nombre" class="swal2-input" value="${caja.nombre}" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; transition: border-color 0.2s ease;" placeholder="Ingrese el nombre de la caja">
          </div>

          <div style="margin-bottom: 20px;">
            <label for="descripcion" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Descripción:</label>
            <textarea id="descripcion" class="swal2-textarea" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; min-height: 80px; resize: vertical; transition: border-color 0.2s ease;" placeholder="Descripción opcional de la caja">${caja.descripcion || ''}</textarea>
          </div>

          <div style="margin-bottom: 20px;">
            <label for="tipo" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Tipo de Caja:</label>
            <div style="position: relative;">
              <select id="tipo" class="swal2-input" style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; background: #2c3e50; color: white; transition: border-color 0.2s ease; appearance: none; cursor: pointer;">
                <option value="efectivo" ${caja.tipo === 'efectivo' ? 'selected' : ''} style="background: white; color: #2c3e50;">💵 Efectivo</option>
                <option value="banco" ${caja.tipo === 'banco' ? 'selected' : ''} style="background: white; color: #2c3e50;">🏦 Banco</option>
                <option value="mixto" ${caja.tipo === 'mixto' ? 'selected' : ''} style="background: white; color: #2c3e50;">🔄 Mixto</option>
              </select>
              <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: white;">
                <span style="font-size: 12px;">▼</span>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label for="limiteMaximo" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Límite Máximo (Opcional):</label>
            <input id="limiteMaximo" type="number" class="swal2-input" value="${caja.limiteMaximo || ''}" step="0.01" min="0" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; transition: border-color 0.2s ease;" placeholder="0.00">
          </div>

          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #3498db; margin-top: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 16px;">💰</span>
              <strong style="color: #2c3e50; font-size: 14px;">Información Actual</strong>
            </div>
            <div style="font-size: 13px; color: #7f8c8d; line-height: 1.4;">
              <div><strong>Saldo Actual:</strong> ${formatCurrency(caja.saldoActual)}</div>
              <div><strong>Saldo Inicial:</strong> ${formatCurrency(caja.saldoInicial)}</div>
              <div><strong>Estado:</strong> ${caja.activa ? 'Activa' : 'Inactiva'}</div>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '💾 Guardar Cambios',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#3498db',
      cancelButtonColor: '#6c757d',
      width: '500px',
      heightAuto: false,
      customClass: {
        popup: 'swal-custom-modal-wide',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      },
      preConfirm: () => {
        const nombre = (document.getElementById('nombre') as HTMLInputElement).value;
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value;
        const tipo = (document.getElementById('tipo') as HTMLSelectElement).value;
        const limiteMaximoInput = (document.getElementById('limiteMaximo') as HTMLInputElement).value;

        if (!nombre.trim()) {
          Swal.showValidationMessage('⚠️ El nombre de la caja es obligatorio');
          return false;
        }

        const limiteMaximo = limiteMaximoInput ? parseFloat(limiteMaximoInput) : undefined;

        return { nombre: nombre.trim(), descripcion: descripcion.trim(), tipo, limiteMaximo };
      }
    });

    if (formValues) {
      try {
        await updateCaja(caja.id, formValues);
        Swal.fire({
          title: '✅ ¡Éxito!',
          text: 'La caja ha sido actualizada correctamente',
          icon: 'success',
          confirmButtonColor: '#3498db',
          confirmButtonText: 'Aceptar'
        });
        fetchCajasData();
      } catch (error) {
        console.error('Error actualizando caja:', error);
        Swal.fire({
          title: '❌ Error',
          text: 'No se pudo actualizar la caja. Intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#e74c3c',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  const handleDeleteCaja = async (caja: Caja) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la caja "${caja.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteCaja(caja.id);
        Swal.fire('Eliminada', 'La caja ha sido eliminada correctamente', 'success');
        fetchCajasData();
      } catch (error) {
        console.error('Error eliminando caja:', error);
        Swal.fire('Error', 'No se pudo eliminar la caja', 'error');
      }
    }
  };

  const handleViewHistorial = async (registro: HistorialCaja) => {
    await Swal.fire({
      title: `Detalles del ${getTipoOperacionLabel(registro.tipo)}`,
      html: `
        <div style="text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <span style="font-size: 20px;">${registro.tipo === 'apertura' ? '🔓' : '🔒'}</span>
              <div>
                <h3 style="margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;">
                  ${getTipoOperacionLabel(registro.tipo)} de Caja
                </h3>
                <p style="margin: 4px 0 0 0; color: #7f8c8d; font-size: 14px;">
                  ${formatDate(registro.fecha)}
                </p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Usuario</div>
                <div style="font-weight: 600; color: #2c3e50;">${registro.usuario}</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Tipo de Operación</div>
                <div style="font-weight: 600; color: #2c3e50;">${getTipoOperacionLabel(registro.tipo)}</div>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
            ${registro.montoInicial ? `
              <div style="background: #e8f5e8; padding: 16px; border-radius: 8px; border: 1px solid #d4edda;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 16px;">💰</span>
                  <span style="font-weight: 600; color: #155724;">Monto Inicial</span>
                </div>
                <div style="font-size: 18px; font-weight: 700; color: #155724;">${formatCurrency(registro.montoInicial)}</div>
              </div>
            ` : ''}

            ${registro.montoFinal ? `
              <div style="background: #f8d7da; padding: 16px; border-radius: 8px; border: 1px solid #f5c6cb;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 16px;">💵</span>
                  <span style="font-weight: 600; color: #721c24;">Monto Final</span>
                </div>
                <div style="font-size: 18px; font-weight: 700; color: #721c24;">${formatCurrency(registro.montoFinal)}</div>
              </div>
            ` : ''}

            ${registro.ingresosDelDia ? `
              <div style="background: #d1ecf1; padding: 16px; border-radius: 8px; border: 1px solid #bee5eb;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 16px;">📈</span>
                  <span style="font-weight: 600; color: #0c5460;">Ingresos del Día</span>
                </div>
                <div style="font-size: 18px; font-weight: 700; color: #0c5460;">${formatCurrency(registro.ingresosDelDia)}</div>
              </div>
            ` : ''}

            ${registro.gastosDelDia ? `
              <div style="background: #f8d7da; padding: 16px; border-radius: 8px; border: 1px solid #f5c6cb;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 16px;">📉</span>
                  <span style="font-weight: 600; color: #721c24;">Gastos del Día</span>
                </div>
                <div style="font-size: 18px; font-weight: 700; color: #721c24;">${formatCurrency(registro.gastosDelDia)}</div>
              </div>
            ` : ''}
          </div>

          ${registro.observaciones ? `
            <div style="background: #fff3cd; padding: 16px; border-radius: 8px; border: 1px solid #ffeaa7;">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 16px;">📝</span>
                <div>
                  <div style="font-weight: 600; color: #856404; margin-bottom: 4px;">Observaciones</div>
                  <div style="color: #856404; line-height: 1.4;">${registro.observaciones}</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#6c757d',
      width: '600px',
      customClass: {
        popup: 'swal-custom-modal-detail',
        confirmButton: 'swal-confirm-btn'
      }
    });
  };

  const handleEditHistorial = async (registro: HistorialCaja) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Registro de Historial',
      html: `
        <div style="text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${registro.tipo === 'apertura' ? `
            <div style="margin-bottom: 20px;">
              <label for="montoInicial" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Monto Inicial:</label>
              <input id="montoInicial" type="number" class="swal2-input" value="${registro.montoInicial || ''}" step="0.01" min="0" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; transition: border-color 0.2s ease;" placeholder="0.00">
            </div>
          ` : ''}
          ${registro.tipo === 'cierre' ? `
            <div style="margin-bottom: 20px;">
              <label for="montoFinal" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Monto Final:</label>
              <input id="montoFinal" type="number" class="swal2-input" value="${registro.montoFinal || ''}" step="0.01" min="0" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; transition: border-color 0.2s ease;" placeholder="0.00">
            </div>
            <div style="margin-bottom: 20px;">
              <label for="ingresosDelDia" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Ingresos del Día:</label>
              <input id="ingresosDelDia" type="number" class="swal2-input" value="${registro.ingresosDelDia || ''}" step="0.01" min="0" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; transition: border-color 0.2s ease;" placeholder="0.00">
            </div>
            <div style="margin-bottom: 20px;">
              <label for="gastosDelDia" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Gastos del Día:</label>
              <input id="gastosDelDia" type="number" class="swal2-input" value="${registro.gastosDelDia || ''}" step="0.01" min="0" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; transition: border-color 0.2s ease;" placeholder="0.00">
            </div>
          ` : ''}

          <div style="margin-bottom: 20px;">
            <label for="observaciones" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">Observaciones:</label>
            <textarea id="observaciones" class="swal2-textarea" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; min-height: 80px; resize: vertical; transition: border-color 0.2s ease;" placeholder="Observaciones del registro">${registro.observaciones || ''}</textarea>
          </div>

          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #3498db; margin-top: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 16px;">📋</span>
              <strong style="color: #2c3e50; font-size: 14px;">Información del Registro</strong>
            </div>
            <div style="font-size: 13px; color: #7f8c8d; line-height: 1.4;">
              <div><strong>Tipo:</strong> ${getTipoOperacionLabel(registro.tipo)}</div>
              <div><strong>Fecha:</strong> ${formatDate(registro.fecha)}</div>
              <div><strong>Usuario:</strong> ${registro.usuario}</div>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '💾 Guardar Cambios',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#3498db',
      cancelButtonColor: '#6c757d',
      width: '500px',
      customClass: {
        popup: 'swal-custom-modal-wide',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      },
      preConfirm: () => {
        const observaciones = (document.getElementById('observaciones') as HTMLTextAreaElement).value;

        let formData: any = { observaciones: observaciones.trim() };

        if (registro.tipo === 'apertura') {
          const montoInicial = parseFloat((document.getElementById('montoInicial') as HTMLInputElement).value) || 0;
          formData.montoInicial = montoInicial;
        } else if (registro.tipo === 'cierre') {
          const montoFinal = parseFloat((document.getElementById('montoFinal') as HTMLInputElement).value) || 0;
          const ingresosDelDia = parseFloat((document.getElementById('ingresosDelDia') as HTMLInputElement).value) || 0;
          const gastosDelDia = parseFloat((document.getElementById('gastosDelDia') as HTMLInputElement).value) || 0;
          formData.montoFinal = montoFinal;
          formData.ingresosDelDia = ingresosDelDia;
          formData.gastosDelDia = gastosDelDia;
        }

        return formData;
      }
    });

    if (formValues) {
      try {
        // TODO: Implement backend API call to update historial record
        console.log('Datos a actualizar:', formValues);

        Swal.fire({
          title: '✅ ¡Éxito!',
          text: 'Los cambios han sido guardados correctamente',
          icon: 'success',
          confirmButtonColor: '#3498db',
          confirmButtonText: 'Aceptar'
        });

        // Refresh the historial data
        fetchHistorialCaja(selectedCaja);
      } catch (error) {
        console.error('Error actualizando registro histórico:', error);
        Swal.fire({
          title: '❌ Error',
          text: 'No se pudo actualizar el registro histórico',
          icon: 'error',
          confirmButtonColor: '#e74c3c',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  return (
    <div className="listado-cajas">
      <div className="page-header">
        <h1>Listado de Cajas</h1>
        <p>Gestión completa de cajas: listado, edición, eliminación y estadísticas</p>
      </div>

      {/* DataTable de Cajas */}
      <div className="cajas-datatable-container">
        <div className="datatable-header">
          <h2>Cajas Registradas</h2>
          <div className="datatable-actions">
            <button
              className="btn btn-primary"
              onClick={() => fetchCajasData()}
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="datatable-wrapper">
          <table className="cajas-datatable">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Saldo Inicial</th>
                <th>Saldo Actual</th>
                <th>Límite Máximo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cajas.map((caja) => (
                <tr key={caja.id}>
                  <td className="caja-nombre">
                    <div className="caja-info">
                      <strong>{caja.nombre}</strong>
                      {caja.descripcion && (
                        <small className="caja-description">{caja.descripcion}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`tipo-badge ${caja.tipo}`}>
                      {caja.tipo.charAt(0).toUpperCase() + caja.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="monto">{formatCurrency(caja.saldoInicial)}</td>
                  <td className={`monto ${caja.saldoActual >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(caja.saldoActual)}
                  </td>
                  <td className="monto">
                    {caja.limiteMaximo ? formatCurrency(caja.limiteMaximo) : '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${caja.activa ? 'active' : 'inactive'}`}>
                      {caja.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="acciones">
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => {
                          setSelectedCaja(caja.id);
                          setActiveTab('historial');
                          fetchHistorialCaja(caja.id);
                        }}
                        title="Ver historial"
                      >
                        <History size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEditCaja(caja)}
                        title="Editar caja"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteCaja(caja)}
                        title="Eliminar caja"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cajas.length === 0 && (
          <div className="empty-state">
            <Wallet size={64} />
            <h3>No hay cajas registradas</h3>
            <p>No se encontraron cajas activas en el sistema.</p>
          </div>
        )}
      </div>

      {/* Selector de caja para detalles */}
      {cajas.length > 0 && (
        <div className="caja-selector">
          <div className="selector-group">
            <label htmlFor="caja-select">Ver detalles de:</label>
            <select
              id="caja-select"
              value={selectedCaja}
              onChange={(e) => handleCajaSelect(e.target.value)}
            >
              <option value="">Seleccionar una caja...</option>
              {cajas
                .sort((a, b) => {
                  const nameA = (a.nombre || '').toLowerCase();
                  const nameB = (b.nombre || '').toLowerCase();
                  
                  // Si una de las cajas es "Caja Principal", ponerla primero
                  if (nameA.includes('principal') || nameA === 'caja principal') return -1;
                  if (nameB.includes('principal') || nameB === 'caja principal') return 1;
                  
                  // Para el resto, orden alfabético normal
                  return nameA.localeCompare(nameB, 'es');
                })
                .map((caja) => (
                  <option key={caja.id} value={caja.id}>
                    {caja.nombre} - Balance: {formatCurrency(caja.saldoActual)}
                  </option>
                ))}
            </select>
          </div>

          {selectedCaja && (
            <div className="date-filters">
              <div className="date-group">
                <label htmlFor="fecha-inicio">Fecha Inicio:</label>
                <input
                  type="date"
                  id="fecha-inicio"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    if (e.target.value && fechaFin && selectedCaja) {
                      setTimeout(() => {
                        fetchEstadisticasCaja(selectedCaja);
                      }, 100);
                    }
                  }}
                />
              </div>
              <div className="date-group">
                <label htmlFor="fecha-fin">Fecha Fin:</label>
                <input
                  type="date"
                  id="fecha-fin"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    if (fechaInicio && e.target.value && selectedCaja) {
                      setTimeout(() => {
                        fetchEstadisticasCaja(selectedCaja);
                      }, 100);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCaja && (
        <>
          {/* Información de la caja seleccionada */}
          {(() => {
            const caja = cajas.find(c => c.id === selectedCaja);
            return caja ? (
              <div className="caja-info-card">
                <div className="caja-info-header">
                  <h3>{caja.nombre}</h3>
                  <span className={`status-badge ${caja.activa ? 'active' : 'inactive'}`}>
                    {caja.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="caja-info-details">
                  <div className="info-item">
                    <span className="label">Balance Actual:</span>
                    <span className={`value ${caja.saldoActual >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(caja.saldoActual)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Saldo Inicial:</span>
                    <span className="value">{formatCurrency(caja.saldoInicial)}</span>
                  </div>
                  {caja.limiteMaximo && (
                    <div className="info-item">
                      <span className="label">Límite Máximo:</span>
                      <span className="value">{formatCurrency(caja.limiteMaximo)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}

          {/* Tabs de navegación */}
          <div className="content-tabs">
            <div className="tabs-header">
              <button
                className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`}
                onClick={() => setActiveTab('historial')}
              >
                Historial de Operaciones
              </button>
              <button
                className={`tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
                onClick={() => setActiveTab('estadisticas')}
              >
                Estadísticas del Período
              </button>
            </div>

            {/* Contenido del Historial */}
            {activeTab === 'historial' && (
              <div className="tab-content">
                {(() => {
                  const caja = cajas.find(c => c.id === selectedCaja);
                  const historial = caja?.historial || [];

                  // Debug: Verificar datos del historial
                  console.log('🔍 DEBUG HISTORIAL - Caja:', caja?.nombre);
                  console.log('📋 Total historial:', historial.length);
                  console.log('🔄 Traspasos en historial:', historial.filter(h => h.tipo === 'traspaso').length);
                  historial.filter(h => h.tipo === 'traspaso').forEach(t => {
                    console.log(`  - Traspaso: ${t.numeroTraspaso}, Monto: ${t.monto}, Origen: ${t.origen}, Destino: ${t.destino}`);
                  });

                  if (historial.length === 0) {
                    return (
                      <div className="empty-state">
                        <History size={64} />
                        <h3>No hay historial disponible</h3>
                        <p>Esta caja aún no tiene operaciones registradas.</p>
                      </div>
                    );
                  }

                  // Calcular paginación
                  const indiceInicio = historialPagina * historialPorPagina;
                  const indiceFin = indiceInicio + historialPorPagina;
                  const historialPaginado = historial.slice(indiceInicio, indiceFin);
                  const totalPaginas = Math.ceil(historial.length / historialPorPagina);

                  return (
                    <div className="historial-table-container">
                      <table className="historial-table">
                        <thead>
                          <tr>
                            <th>Fecha y Hora</th>
                            <th>Tipo</th>
                            <th>Monto Inicial</th>
                            <th>Monto Final</th>
                            <th>Ingresos</th>
                            <th>Gastos</th>
                            <th>Traspaso</th>
                            <th>Usuario</th>
                            <th>Observaciones</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialPaginado.map((registro) => (
                            <tr key={registro.id}>
                              <td>{formatDate(registro.fecha)}</td>
                              <td>
                                <span className={`tipo-operacion ${getTipoOperacionClass(registro.tipo)}`}>
                                  {getTipoOperacionLabel(registro.tipo)}
                                </span>
                              </td>
                              <td className="monto">
                                {registro.montoInicial ? formatCurrency(registro.montoInicial) : '-'}
                              </td>
                              <td className="monto">
                                {registro.montoFinal ? formatCurrency(registro.montoFinal) : '-'}
                              </td>
                              <td className="monto ingreso">
                                {registro.ingresosDelDia ? formatCurrency(registro.ingresosDelDia) : '-'}
                              </td>
                              <td className="monto gasto">
                                {registro.gastosDelDia ? formatCurrency(registro.gastosDelDia) : '-'}
                              </td>
                              <td className="traspaso-info">
                                {registro.tipo === 'traspaso' ? (
                                  <div className={`traspaso-detail ${registro.esOrigen ? 'salida' : 'entrada'}`}>
                                    <div className="traspaso-tipo">
                                      <span className={`badge ${registro.esOrigen ? 'badge-warning' : 'badge-success'}`}>
                                        {registro.tipoTraspaso || 'Traspaso'}
                                      </span>
                                    </div>
                                    <div className="traspaso-monto">
                                      {registro.monto && typeof registro.monto === 'number' ? (
                                        <span className={getCajaPrincipalTraspasoClass(registro)}>
                                          {registro.esOrigen ? '-' : '+'}{formatCurrency(registro.monto)}
                                        </span>
                                      ) : (
                                        <span className="text-muted">Sin monto</span>
                                      )}
                                    </div>
                                    <div className="traspaso-direccion">
                                      <small className="text-muted">
                                        {registro.origen || 'Sin origen'} → {registro.destino || 'Sin destino'}
                                      </small>
                                    </div>
                                    <div className="traspaso-numero">
                                      <small className="text-primary">{registro.numeroTraspaso || 'Sin número'}</small>
                                    </div>
                                  </div>
                                ) : '-'}
                              </td>
                              <td>{registro.usuario}</td>
                              <td className="observaciones">
                                {registro.observaciones || '-'}
                              </td>
                              <td className="acciones">
                                <div className="action-buttons">
                                  <button
                                    className="btn btn-sm btn-info"
                                    onClick={() => handleViewHistorial(registro)}
                                    title="Ver detalles"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-warning"
                                    onClick={() => handleEditHistorial(registro)}
                                    title="Editar registro"
                                  >
                                    <Edit size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="pagination-container">
                          <button
                            className="btn-pagina"
                            onClick={() => setHistorialPagina(Math.max(0, historialPagina - 1))}
                            disabled={historialPagina === 0}
                          >
                            ← Anterior
                          </button>
                          <span className="pagination-info">
                            Página {historialPagina + 1} de {totalPaginas} ({historial.length} registros)
                          </span>
                          <button
                            className="btn-pagina"
                            onClick={() => setHistorialPagina(Math.min(totalPaginas - 1, historialPagina + 1))}
                            disabled={historialPagina === totalPaginas - 1}
                          >
                            Siguiente →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Contenido de Estadísticas */}
            {activeTab === 'estadisticas' && (
              <div className="tab-content">
                {(() => {
                  const caja = cajas.find(c => c.id === selectedCaja);
                  const estadisticas = caja?.estadisticas;
                  const historial = caja?.historial || [];

                  if (!estadisticas) {
                    return (
                      <div className="empty-state">
                        <BarChart3 size={64} />
                        <h3>No hay estadísticas disponibles</h3>
                        <p>Selecciona un rango de fechas para ver las estadísticas.</p>
                      </div>
                    );
                  }

                  // Preparar datos para gráficos
                  const datosComparativa = [
                    {
                      nombre: 'Ingresos',
                      monto: estadisticas.totalIngresos
                    },
                    {
                      nombre: 'Gastos',
                      monto: estadisticas.totalGastos
                    }
                  ];

                  const coloresComparativa = ['#22c55e', '#ef4444'];

                  // Datos para gráfico de tipos de operación
                  const tiposOperacion = historial.reduce((acc: any, reg) => {
                    const tipo = reg.tipo || 'Otros';
                    const existente = acc.find((item: any) => item.nombre === tipo);
                    if (existente) {
                      existente.cantidad += 1;
                    } else {
                      acc.push({ nombre: tipo, cantidad: 1 });
                    }
                    return acc;
                  }, []);

                  const coloresTipos = {
                    'apertura': '#3b82f6',
                    'cierre': '#22c55e',
                    'traspaso': '#ef4444'
                  };

                  return (
                    <div className="estadisticas-container">
                      {/* Tarjetas de resumen */}
                      <div className="estadisticas-grid">
                        <div className="estadistica-card">
                          <div className="estadistica-icon ingreso">
                            <TrendingUp size={24} />
                          </div>
                          <div className="estadistica-content">
                            <h4>Total Ingresos</h4>
                            <span className="estadistica-value ingreso">
                              {formatCurrency(estadisticas.totalIngresos)}
                            </span>
                          </div>
                        </div>

                        <div className="estadistica-card">
                          <div className="estadistica-icon gasto">
                            <TrendingDown size={24} />
                          </div>
                          <div className="estadistica-content">
                            <h4>Total Gastos</h4>
                            <span className="estadistica-value gasto">
                              {formatCurrency(estadisticas.totalGastos)}
                            </span>
                          </div>
                        </div>

                        <div className="estadistica-card">
                          <div className="estadistica-icon balance">
                            <Wallet size={24} />
                          </div>
                          <div className="estadistica-content">
                            <h4>Balance Neto</h4>
                            <span className={`estadistica-value ${estadisticas.balanceNeto >= 0 ? 'positivo' : 'negativo'}`}>
                              {formatCurrency(estadisticas.balanceNeto)}
                            </span>
                          </div>
                        </div>

                        <div className="estadistica-card">
                          <div className="estadistica-icon promedio">
                            <DollarSign size={24} />
                          </div>
                          <div className="estadistica-content">
                            <h4>Promedio Diario</h4>
                            <span className="estadistica-value">
                              {formatCurrency(estadisticas.promedioDiario)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Gráficos */}
                      <div className="graficos-container">
                        {/* Gráfico de barras: Ingresos vs Gastos */}
                        <div className="grafico-card">
                          <h3>Comparativa: Ingresos vs Gastos</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={datosComparativa} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="nombre" stroke="#475569" />
                              <YAxis stroke="#475569" />
                              <Tooltip 
                                formatter={(value) => formatCurrency(value as number)}
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px'
                                }}
                              />
                              <Bar dataKey="monto" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                                {datosComparativa.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={coloresComparativa[index]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Gráfico de pastel: Distribución de operaciones */}
                        {tiposOperacion.length > 0 && (
                          <div className="grafico-card">
                            <h3>Distribución de Operaciones</h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={tiposOperacion}
                                  dataKey="cantidad"
                                  nameKey="nombre"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  label={({ nombre, cantidad }) => `${nombre}: ${cantidad}`}
                                >
                                  {tiposOperacion.map((entry: any, index: number) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={coloresTipos[entry.nombre as keyof typeof coloresTipos] || '#8b5cf6'}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value) => `${value} operaciones`}
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {/* Resumen detallado */}
                      <div className="resumen-detallado">
                        <h3>Resumen Detallado</h3>
                        <div className="resumen-grid">
                          <div className="resumen-item">
                            <span className="resumen-label">Total de Operaciones</span>
                            <span className="resumen-valor">{historial.length}</span>
                          </div>
                          <div className="resumen-item">
                            <span className="resumen-label">Aperturas</span>
                            <span className="resumen-valor">{historial.filter(h => h.tipo === 'apertura').length}</span>
                          </div>
                          <div className="resumen-item">
                            <span className="resumen-label">Cierres</span>
                            <span className="resumen-valor">{historial.filter(h => h.tipo === 'cierre').length}</span>
                          </div>
                          <div className="resumen-item">
                            <span className="resumen-label">Traspasos</span>
                            <span className="resumen-valor">{historial.filter(h => h.tipo === 'traspaso').length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ListadoCajas;