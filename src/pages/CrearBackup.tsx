import React, { useState, useEffect, useMemo } from 'react';
import {
  Database, Search, Download, Trash2, Clock,
  FileText, CheckCircle, AlertTriangle, RefreshCw,
  HardDrive, Shield, Server, Activity, PieChart,
  ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import KpiWidget from '../components/ui/KpiWidget';
import DataTable from '../components/ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import '../styles/DashboardOptimizations.css';
import '../pages/Categorias.css';
import '../App.css';

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

const CrearBackup: React.FC = () => {
  const [backupType, setBackupType] = useState<'full' | 'tables'>('full');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentBackups, setRecentBackups] = useState<BackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Columnas para el DataTable
  const columns: ColumnDef<BackupFile>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre del Archivo',
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
          >
            <FileText size={18} className="text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate text-slate-800" title={row.original.name}>
              {row.original.name.replace('.sql', '')}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Archivo SQL
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha de Creación',
      cell: ({ row }) => (
        <div className="py-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">
              {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: es })}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={12} className="text-slate-400" />
              <span className="text-xs text-slate-500">
                {format(new Date(row.original.createdAt), 'HH:mm:ss', { locale: es })}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Tamaño',
      cell: ({ row }) => (
        <div className="py-2">
          <div 
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
            }}
          >
            <HardDrive size={14} />
            {formatSize(row.original.size)}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(row.original.name);
            }}
            className="inline-flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
            title="Descargar"
            style={{
              border: '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 1px 2px rgba(59, 130, 246, 0.1)'
            }}
          >
            <Download size={14} strokeWidth={2} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original.name);
            }}
            className="inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
            title="Eliminar"
            style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              boxShadow: '0 1px 2px rgba(239, 68, 68, 0.1)'
            }}
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      ),
    },
  ];

  // Available tables for backup
  const availableTables = [
    'usuario', 'role', 'permiso', 'bitacora', 'empresa',
    'categoria', 'servicio', 'plan', 'cliente', 'suscripcion',
    'equipo_cliente', 'factura', 'detalle_factura_cliente',
    'tarea', 'evento', 'chat', 'mensaje_chat', 'participante_chat',
    'producto_papeleria', 'categoria_papeleria', 'venta_papeleria',
    'detalle_venta_papeleria', 'cliente_papeleria', 'banco',
    'cuenta_contable', 'categoria_cuenta', 'movimiento_contable',
    'caja_chica', 'movimiento_caja'
  ];

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await apiClient.get('/database/backups');

      // Robust response handling
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && Array.isArray(response.data)) {
        data = response.data;
      }

      const sorted = data.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentBackups(sorted);
    } catch (error) {
      console.error('Error fetching backups:', error);
      setRecentBackups([]);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const payload = {
        tables: backupType === 'tables' ? selectedTables : null,
        isFullBackup: backupType === 'full'
      };

      const response = await apiClient.post('/database/backup', payload);

      Swal.fire({
        title: '¡Backup Creado!',
        text: `El archivo ${response.data?.backupPath?.split('\\').pop() || 'generado'} se ha creado correctamente.`,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        background: '#ffffff',
        customClass: { popup: 'rounded-2xl' }
      });

      setSelectedTables([]);
      setBackupType('full');
      fetchBackups();

    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al crear el backup',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      // Construir la URL completa del endpoint de descarga
      const baseURL = apiClient.defaults?.baseURL || window.location.origin;
      const downloadUrl = `${baseURL}/api/database/backups/${encodeURIComponent(filename)}/download`;
      
      // Crear enlace de descarga directo
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank'; // Abrir en nueva pestaña como fallback
      link.style.display = 'none';
      
      // Agregar headers de autenticación si existen
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (authToken) {
        // Para descargas directas con autenticación, usar fetch
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/octet-stream'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        // Convertir a blob y descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL después de un delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        
      } else {
        // Si no hay autenticación, usar descarga directa
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (error: any) {
      console.error('Error downloading backup:', error);
      Swal.fire({
        title: 'Error de descarga',
        text: error.message || 'No se pudo descargar el archivo de respaldo',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleDelete = async (filename: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar Backup?',
      text: "Esta acción es irreversible",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      customClass: { popup: 'rounded-2xl' }
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/database/backups/${filename}`);
        fetchBackups();
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Backup eliminado' });
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el archivo', 'error');
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredTables = availableTables.filter(table =>
    table.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats Calculations
  const stats = useMemo(() => {
    const totalBackups = recentBackups.length;
    const totalSize = recentBackups.reduce((acc, curr) => acc + curr.size, 0);
    const lastBackup = recentBackups.length > 0 ? new Date(recentBackups[0].createdAt) : null;

    // Calculate growth (mock logic for demo, comparing first half vs second half if enough data)
    const growth = totalBackups > 1 ? '+12%' : '0%';

    return { totalBackups, totalSize, lastBackup, growth };
  }, [recentBackups]);

  // Chart Data
  const chartData = useMemo(() => {
    return recentBackups
      .slice(0, 7) // Last 7 backups
      .reverse()
      .map(backup => ({
        name: format(new Date(backup.createdAt), 'dd MMM', { locale: es }),
        size: parseFloat((backup.size / (1024 * 1024)).toFixed(2)), // MB
        rawSize: backup.size
      }));
  }, [recentBackups]);

  return (
    <div className="dashboard-layout">{/* Usar el mismo layout que el dashboard */}

        {/* Header */}
        <div className="dashboard-header" style={{ marginBottom: '24px' }}>
          <div className="header-left">
            <div className="breadcrumb">
              <h1>Base de Datos</h1>
              <p>Gestión de respaldos y seguridad del sistema</p>
            </div>
          </div>
          <div className="header-right">
            <div className="date-range-picker">
              Última actualización: {new Date().toLocaleTimeString('es-ES')}
              {loadingBackups && <span style={{ color: '#666', marginLeft: '8px' }}>• Cargando...</span>}
            </div>
            <div className="header-actions">
              <button
                title="Actualizar respaldos"
                onClick={fetchBackups}
                disabled={loadingBackups}
                style={{ opacity: loadingBackups ? 0.6 : 1 }}
              >
                <span className={`material-icons ${loadingBackups ? 'rotating' : ''}`}>refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className="dashboard-kpis" style={{ marginBottom: '32px' }}>
          <KpiWidget
            title="TOTAL RESPALDOS"
            value={stats.totalBackups.toString()}
            percentage="Archivos generados"
            percentageClass="neutral"
            icon={<span className="material-icons">storage</span>}
            barColor="#2196F3"
          />
          
          <KpiWidget
            title="TAMAÑO TOTAL"
            value={formatSize(stats.totalSize)}
            percentage="Espacio utilizado"
            percentageClass="neutral"
            icon={<span className="material-icons">folder</span>}
            barColor="#00BFA5"
          />
          
          <KpiWidget
            title="ÚLTIMO RESPALDO"
            value={stats.lastBackup ? format(stats.lastBackup, 'dd MMM, HH:mm', { locale: es }) : 'N/A'}
            percentage="Fecha y hora"
            percentageClass="neutral"
            icon={<span className="material-icons">schedule</span>}
            barColor="#FF9800"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column: Create Backup Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Nuevo Respaldo
                </h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Neon DB Ready</span>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Type Selection Tabs */}
                <div 
                  className="flex p-1 rounded-xl w-fit" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: '4px',
                    backgroundColor: 'var(--colors-background-paper-secondary, #f8f9fa)',
                    border: '1px solid var(--colors-divider, #e9ecef)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <button
                    onClick={() => setBackupType('full')}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex-shrink-0"
                    style={{ 
                      minWidth: '120px', 
                      textAlign: 'center',
                      backgroundColor: backupType === 'full' ? 'var(--colors-background-paper, #ffffff)' : 'transparent',
                      color: backupType === 'full' ? 'var(--colors-primary-main, #2196f3)' : 'var(--colors-text-secondary, #666666)',
                      border: backupType === 'full' ? '1px solid var(--colors-primary-light, #64b5f6)' : '1px solid transparent',
                      boxShadow: backupType === 'full' ? '0 2px 8px rgba(33, 150, 243, 0.15)' : 'none',
                      transform: backupType === 'full' ? 'scale(1.02)' : 'scale(1)',
                      fontWeight: backupType === 'full' ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (backupType !== 'full') {
                        e.currentTarget.style.backgroundColor = 'var(--colors-background-paper-secondary, rgba(0,0,0,0.05))';
                        e.currentTarget.style.color = 'var(--colors-text-primary, #333333)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (backupType !== 'full') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--colors-text-secondary, #666666)';
                      }
                    }}
                  >
                    Completo
                  </button>
                  <button
                    onClick={() => setBackupType('tables')}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex-shrink-0"
                    style={{ 
                      minWidth: '120px', 
                      textAlign: 'center',
                      backgroundColor: backupType === 'tables' ? 'var(--colors-background-paper, #ffffff)' : 'transparent',
                      color: backupType === 'tables' ? 'var(--colors-secondary-main, #9c27b0)' : 'var(--colors-text-secondary, #666666)',
                      border: backupType === 'tables' ? '1px solid var(--colors-secondary-light, #ba68c8)' : '1px solid transparent',
                      boxShadow: backupType === 'tables' ? '0 2px 8px rgba(156, 39, 176, 0.15)' : 'none',
                      transform: backupType === 'tables' ? 'scale(1.02)' : 'scale(1)',
                      fontWeight: backupType === 'tables' ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (backupType !== 'tables') {
                        e.currentTarget.style.backgroundColor = 'var(--colors-background-paper-secondary, rgba(0,0,0,0.05))';
                        e.currentTarget.style.color = 'var(--colors-text-primary, #333333)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (backupType !== 'tables') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--colors-text-secondary, #666666)';
                      }
                    }}
                  >
                    Personalizado
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {backupType === 'full' ? (
                    <motion.div
                      key="full"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4"
                    >
                      <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                        <Database size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900">Respaldo Completo del Sistema</h3>
                        <p className="text-blue-700/80 text-sm mt-1 leading-relaxed">
                          Se generará una copia de seguridad de todas las tablas, registros y configuraciones actuales.
                          Este proceso puede tomar unos momentos dependiendo del tamaño de la base de datos.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tables"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar tablas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTables(availableTables)}
                            className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                          >
                            Seleccionar Todo
                          </button>
                          <button
                            onClick={() => setSelectedTables([])}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                        {filteredTables.map(table => (
                          <motion.label
                            key={table}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all duration-200 ${selectedTables.includes(table)
                                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                : 'bg-white border-slate-100 hover:border-slate-300'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${selectedTables.includes(table)
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-slate-300 bg-white'
                              }`}>
                              {selectedTables.includes(table) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-sm font-medium truncate ${selectedTables.includes(table) ? 'text-indigo-900' : 'text-slate-600'
                              }`}>
                              {table}
                            </span>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={selectedTables.includes(table)}
                              onChange={() => handleTableToggle(table)}
                            />
                          </motion.label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={handleCreateBackup}
                    disabled={isLoading || (backupType === 'tables' && selectedTables.length === 0)}
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-3 ${isLoading || (backupType === 'tables' && selectedTables.length === 0)
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-5 h-5" />
                        Iniciar Respaldo {backupType === 'tables' && selectedTables.length > 0 && `(${selectedTables.length})`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: History & Charts */}
          <div className="space-y-6">

            {/* Chart Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Tendencia de Tamaño
                </h3>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  Últimos 7 días
                </span>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="size"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSize)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* DataTable CRUD para Historial */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Historial de Respaldos
                </h3>
                <button
                  onClick={fetchBackups}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                  disabled={loadingBackups}
                >
                  <RefreshCw size={16} className={loadingBackups ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="p-6">
                <div style={{
                  background: 'var(--colors-background-paper, #ffffff)',
                  borderRadius: '16px',
                  border: '1px solid var(--colors-divider, #e5e7eb)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden'
                }}>
                  <DataTable
                    columns={columns}
                    data={recentBackups}
                    disablePagination={false}
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
    </div>
  );
};

export default CrearBackup;
