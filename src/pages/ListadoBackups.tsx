import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Database, Download, Trash2, FileText, HardDrive, Clock, RefreshCw, PlusCircle } from 'lucide-react';

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

const ListadoBackups: React.FC = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/database/backups');
      const sortedBackups = (response || []).sort((a, b) => {
        // Sort by filename alphabetically
        return (a.filename || '').localeCompare(b.filename || '', 'es');
      });
      setBackups(sortedBackups);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los backups');
      toast.error('No se pudieron cargar los backups.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    toast.loading('Creando backup...', { id: 'creating-backup' });
    try {
      const response = await apiClient.post('/database/create-backup');
      toast.success(response.message || 'Backup creado exitosamente.', { id: 'creating-backup' });
      loadBackups(); // Recargar la lista
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear el backup.', { id: 'creating-backup' });
    } finally {
      setIsCreating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: es });
  };

  const handleDownload = async (filename: string) => {
    const toastId = toast.loading('Iniciando descarga...');
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/database/backups/${filename}/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Descarga completada.', { id: toastId });
    } catch (error) {
      toast.error('Error al descargar el archivo.', { id: toastId });
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el backup "${filename}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const toastId = toast.loading('Eliminando backup...');
    try {
      await apiClient.delete(`/database/backups/${filename}`);
      toast.success('Backup eliminado exitosamente.', { id: toastId });
      loadBackups();
    } catch (error) {
      toast.error('Error al eliminar el archivo.', { id: toastId });
    }
  };

  const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Administrador de Backups</h1>
              <p className="text-sm text-gray-500">Gestiona y resguarda la información de tu base de datos.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadBackups}
              disabled={isLoading || isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'Cargando...' : 'Actualizar'}</span>
            </button>
            <button
              onClick={handleCreateBackup}
              disabled={isCreating || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <PlusCircle size={16} />
              <span>{isCreating ? 'Creando...' : 'Crear Backup'}</span>
            </button>
          </div>
        </div>

        {error && !isLoading && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg shadow-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Resumen de Backups</h2>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{backups.length}</span> archivos • Total: <span className="font-medium">{formatFileSize(totalSize)}</span>
            </div>
          </div>
        </div>

        {/* Backup List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-10 w-10 text-blue-600 animate-spin" />
              <p className="mt-3 text-gray-600 font-medium">Cargando backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
              <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-800">No se encontraron backups</h3>
              <p className="mt-1 text-sm text-gray-500">Haz clic en "Crear Backup" para generar el primero.</p>
            </div>
          ) : (
            backups.map((backup) => (
              <div key={backup.name} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-grow">
                    <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800 break-all">{backup.name}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1.5"><HardDrive size={12} /> {formatFileSize(backup.size)}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(backup.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleDownload(backup.name)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <Download size={16} />
                      <span>Descargar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(backup.name)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ListadoBackups;
