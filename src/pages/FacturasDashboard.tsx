import React, { useState, useEffect, useMemo } from 'react';
import { FileText, DollarSign, Clock, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import KpiWidget from '../components/ui/KpiWidget';
import InfoCard from '../components/ui/InfoCard';
import DataTable from '../components/ui/DataTable';
import FacturasChart from '../components/charts/FacturasChart';
import facturaService from '../services/facturaService';
import { formatearMoneda, obtenerTextoEstado } from '../utils/facturaUtils';
import { ColumnDef } from '@tanstack/react-table';
import '../styles/invoices-theme.css';
import './FacturasDashboard.css';

interface Estadisticas {
  totalFacturado: number;
  totalPendiente: number;
  totalPagado: number;
  facturasPendientes: number;
  facturasPagadas: number;
  facturasAnuladas: number;
  facturasParciales: number;
}

const FacturasDashboard: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [ultimasFacturas, setUltimasFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [año, setAño] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(0); // 0 = Todos

  useEffect(() => {
    cargarDatos();
  }, [año, mes]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const filtros: any = { año };
      if (mes > 0) {
        filtros.mes = mes;
      }

      const [stats, facturas] = await Promise.all([
        facturaService.obtenerEstadisticas(filtros),
        facturaService.obtenerFacturas({ limit: 50 }) // Increased limit for datatable
      ]);
      setEstadisticas(stats);
      
      // Ordenar facturas por último pago realizado (descendente)
      const facturasOrdenadas = (facturas.facturas || []).sort((a: any, b: any) => {
        const pagosA = a.pagos?.filter((pago: any) => pago.estado === 'confirmado') || [];
        const pagosB = b.pagos?.filter((pago: any) => pago.estado === 'confirmado') || [];
        
        // Facturas sin pagos van al final
        if (pagosA.length === 0 && pagosB.length === 0) {
          // Si ambas no tienen pagos, ordenar por fecha de factura descendente
          return new Date(b.fechaFactura).getTime() - new Date(a.fechaFactura).getTime();
        }
        if (pagosA.length === 0) return 1;  // a va después
        if (pagosB.length === 0) return -1; // b va después
        
        const getUltimaFechaPago = (pagos: any[]) => {
          return pagos.reduce((ultimaFecha, pago) => {
            const fechaPago = new Date(pago.fechaPago || pago.fechaCreacion || pago.createdAt || pago.fecha);
            return fechaPago > ultimaFecha ? fechaPago : ultimaFecha;
          }, new Date(0));
        };
        
        const fechaUltimaA = getUltimaFechaPago(pagosA);
        const fechaUltimaB = getUltimaFechaPago(pagosB);
        
        // Ordenar descendente: más reciente primero
        return fechaUltimaB.getTime() - fechaUltimaA.getTime();
      });
      
      setUltimasFacturas(facturasOrdenadas);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'numeroFactura',
        header: 'Número',
        cell: (info) => <span className="text-slate-300 font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'cliente',
        header: 'Cliente',
        cell: (info) => {
          const cliente = info.getValue() as any;
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                {cliente.nombre.charAt(0)}
                {cliente.apellidos.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-slate-200 text-sm font-medium">
                  {cliente.nombre} {cliente.apellidos}
                </span>
                <span className="text-slate-500 text-xs">
                  {cliente.codigoCliente || 'N/A'}
                </span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'fechaFactura',
        header: 'Fecha',
        cell: (info) => <span className="text-slate-400 text-sm">{new Date(info.getValue() as string).toLocaleDateString('es-DO')}</span>,
      },
      {
        accessorKey: 'fechaVencimiento',
        header: 'Vencimiento',
        cell: (info) => <span className="text-slate-400 text-sm">{new Date(info.getValue() as string).toLocaleDateString('es-DO')}</span>,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: (info) => <span className="text-slate-200 font-medium text-right block">{formatearMoneda(info.getValue() as number)}</span>,
      },
      {
        id: 'pagado',
        header: 'Pagado',
        cell: (info) => {
          const factura = info.row.original;
          const totalPagado = factura.pagos?.reduce((sum: number, pago: any) => {
            return pago.estado === 'confirmado' ? sum + parseFloat(pago.monto) : sum;
          }, 0) || 0;
          return <span className="text-emerald-400 font-medium text-right block">{formatearMoneda(totalPagado)}</span>;
        }
      },
      {
        id: 'ultimoPago',
        header: 'Último Pago',
        cell: (info) => {
          const factura = info.row.original;
          const pagosConfirmados = factura.pagos?.filter((pago: any) => pago.estado === 'confirmado') || [];
          if (pagosConfirmados.length === 0) {
            return <span className="text-slate-500 text-sm text-center block">Sin pagos</span>;
          }
          
          // Obtener la fecha más reciente de todos los pagos
          const fechaUltimoPago = pagosConfirmados.reduce((ultimaFecha, pago) => {
            const fechaPago = new Date(pago.fechaPago || pago.fechaCreacion || pago.createdAt || pago.fecha);
            return fechaPago > ultimaFecha ? fechaPago : ultimaFecha;
          }, new Date(0));
          
          return <span className="text-emerald-400 text-sm text-center block">{fechaUltimoPago.toLocaleDateString('es-DO')}</span>;
        },
        sortingFn: (rowA, rowB) => {
          const facturaA = rowA.original;
          const facturaB = rowB.original;
          const pagosA = facturaA.pagos?.filter((pago: any) => pago.estado === 'confirmado') || [];
          const pagosB = facturaB.pagos?.filter((pago: any) => pago.estado === 'confirmado') || [];
          
          // Si ninguna tiene pagos, mantener orden original
          if (pagosA.length === 0 && pagosB.length === 0) return 0;
          // Las facturas sin pagos van al final
          if (pagosA.length === 0) return 1;
          if (pagosB.length === 0) return -1;
          
          // Obtener fecha del último pago de cada factura
          const getUltimaFechaPago = (pagos: any[]) => {
            return pagos.reduce((ultimaFecha, pago) => {
              const fechaPago = new Date(pago.fechaPago || pago.fechaCreacion || pago.createdAt || pago.fecha);
              return fechaPago > ultimaFecha ? fechaPago : ultimaFecha;
            }, new Date(0));
          };
          
          const fechaUltimaA = getUltimaFechaPago(pagosA);
          const fechaUltimaB = getUltimaFechaPago(pagosB);
          
          // Orden descendente: más reciente primero
          return fechaUltimaB.getTime() - fechaUltimaA.getTime();
        }
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: (info) => (
          <div className="text-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium status-${info.getValue()}`}>
              {obtenerTextoEstado(info.getValue() as string)}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout fade-in">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">
            <h1>Dashboard de Facturas</h1>
            <p>Resumen y estadísticas de facturación</p>
          </div>
        </div>
        <div className="header-right">
          <div className="flex gap-2">
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={año}
              onChange={(e) => setAño(parseInt(e.target.value))}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <div className="header-actions">
            <button title="Refresh" onClick={() => cargarDatos()}>
              <span className="material-icons">refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-kpis">
        <KpiWidget
          title="TOTAL FACTURADO"
          value={formatearMoneda(estadisticas?.totalFacturado || 0)}
          percentage="Mes actual"
          percentageClass="text-slate-400"
          icon={<DollarSign className="w-5 h-5" />}
          barColor="#3b82f6" // Blue
        />

        <KpiWidget
          title="Facturas Pendientes"
          value={formatearMoneda(estadisticas?.totalPendiente || 0)}
          percentage={(estadisticas?.facturasPendientes || 0).toString()}
          percentageClass="text-yellow-500"
          icon={<Clock className="w-5 h-5" />}
          barColor="#f59e0b" // Amber
        />

        <KpiWidget
          title="PAGADAS"
          value={(estadisticas?.facturasPagadas || 0).toString()}
          percentage={formatearMoneda(estadisticas?.totalPagado || 0)}
          percentageClass="positive"
          icon={<TrendingUp className="w-5 h-5" />}
          barColor="#10b981" // Emerald
        />

        <KpiWidget
          title="ANULADAS"
          value={(estadisticas?.facturasAnuladas || 0).toString()}
          percentage="Este mes"
          percentageClass="negative"
          icon={<AlertCircle className="w-5 h-5" />}
          barColor="#ef4444" // Red
        />
      </div>

      <div className="dashboard-main-content">
        <div className="dashboard-row">
          <div style={{ gridColumn: 'span 12' }}>
            <InfoCard title="Facturación Mensual">
              <FacturasChart />
            </InfoCard>
          </div>
        </div>

        <div className="dashboard-row">
          <div style={{ gridColumn: 'span 12' }}>
            <InfoCard title="Últimas Facturas">
              <DataTable
                columns={columns}
                data={ultimasFacturas}
                sorting={[{ id: 'ultimoPago', desc: true }]}
              />
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacturasDashboard;
