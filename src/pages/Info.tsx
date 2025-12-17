import React, { useState, useEffect } from 'react';
import Modal from '../components/ui/Modal';
import { empresaService, type Empresa, type CreateEmpresaData } from '../services/empresaService';

const Info: React.FC = () => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateEmpresaData>({
    nombre: '',
    razonSocial: '',
    rnc: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    logoUrl: '',
    sitioWeb: '',
    monedaPrincipal: 'DOP'
  });

  useEffect(() => {
    loadEmpresa();
  }, []);

  const loadEmpresa = async () => {
    try {
      setLoading(true);
      const data = await empresaService.getAllEmpresas();
      // Get the first company or null if none exists
      setEmpresa(data.length > 0 ? data[0] : null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar información de empresa');
      console.error('Error loading empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (empresa && isEditing) {
        await empresaService.updateEmpresa(empresa.id, formData);
      } else {
        await empresaService.createEmpresa(formData);
      }
      await loadEmpresa();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar empresa');
    }
  };

  const handleEdit = () => {
    if (empresa) {
      setFormData({
        nombre: empresa.nombre,
        razonSocial: empresa.razonSocial || '',
        rnc: empresa.rnc || '',
        telefono: empresa.telefono || '',
        email: empresa.email || '',
        direccion: empresa.direccion || '',
        ciudad: empresa.ciudad || '',
        provincia: empresa.provincia || '',
        codigoPostal: empresa.codigoPostal || '',
        logoUrl: empresa.logoUrl || '',
        sitioWeb: empresa.sitioWeb || '',
        monedaPrincipal: empresa.monedaPrincipal
      });
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const handleCreate = () => {
    setFormData({
      nombre: '',
      razonSocial: '',
      rnc: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      logoUrl: '',
      sitioWeb: '',
      monedaPrincipal: 'DOP'
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({
      nombre: '',
      razonSocial: '',
      rnc: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      logoUrl: '',
      sitioWeb: '',
      monedaPrincipal: 'DOP'
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div>
            <h1>Información de Empresa</h1>
            <p>Perfil corporativo y configuración empresarial</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div>
          <h1>Información de Empresa</h1>
          <p>Perfil corporativo y configuración empresarial</p>
        </div>
        <div className="flex space-x-2">
          {empresa ? (
            <button
              onClick={handleEdit}
              className="data-table-button data-table-button-primary"
            >
              <span className="mr-2">✏️</span>
              Editar Empresa
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="data-table-button data-table-button-primary"
            >
              <span className="mr-2">➕</span>
              Crear Empresa
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {empresa ? (
        <div className="max-w-6xl mx-auto">
          {/* Company Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="p-6">
              <div className="flex items-start space-x-6">
                {/* Company Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    {empresa.logoUrl ? (
                      <img 
                        src={empresa.logoUrl} 
                        alt={empresa.nombre}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {empresa.nombre.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {empresa.nombre}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Activa
                    </span>
                  </div>
                  
                  {empresa.razonSocial && (
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {empresa.razonSocial}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {empresa.rnc && (
                      <div className="flex items-center space-x-1">
                        <span>🏛️</span>
                        <span>RNC: {empresa.rnc}</span>
                      </div>
                    )}
                    {empresa.ciudad && (
                      <div className="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{empresa.ciudad}{empresa.provincia && `, ${empresa.provincia}`}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <span>💳</span>
                      <span>Moneda: {empresa.monedaPrincipal}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex space-x-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Date().getFullYear() - new Date(empresa.createdAt).getFullYear()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Años</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">Activa</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Estado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información de Contacto
                  </h3>
                  
                  <div className="space-y-4">
                    {empresa.email && (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400">📧</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                          <div className="text-gray-900 dark:text-white font-medium">{empresa.email}</div>
                        </div>
                      </div>
                    )}

                    {empresa.telefono && (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400">📞</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Teléfono</div>
                          <div className="text-gray-900 dark:text-white font-medium">{empresa.telefono}</div>
                        </div>
                      </div>
                    )}

                    {empresa.sitioWeb && (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400">🌐</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Sitio Web</div>
                          <a 
                            href={empresa.sitioWeb.startsWith('http') ? empresa.sitioWeb : `https://${empresa.sitioWeb}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {empresa.sitioWeb}
                          </a>
                        </div>
                      </div>
                    )}

                    {empresa.direccion && (
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 dark:text-orange-400">📍</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Dirección</div>
                          <div className="text-gray-900 dark:text-white font-medium">{empresa.direccion}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-6">
              {/* Company Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información Adicional
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Código Postal</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {empresa.codigoPostal || 'No especificado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Moneda Principal</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                        {empresa.monedaPrincipal}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Creada</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {new Date(empresa.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Actualizada</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {new Date(empresa.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏢</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay información de empresa
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Crea el perfil de tu empresa para comenzar.
          </p>
          <button
            onClick={handleCreate}
            className="data-table-button data-table-button-primary"
          >
            <span className="mr-2">➕</span>
            Crear Empresa
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Editar Empresa' : 'Nueva Empresa'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={formData.razonSocial}
                onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RNC
              </label>
              <input
                type="text"
                value={formData.rnc}
                onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                value={formData.sitioWeb}
                onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <input
                type="text"
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={formData.codigoPostal}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda Principal
              </label>
              <select
                value={formData.monedaPrincipal}
                onChange={(e) => setFormData({ ...formData, monedaPrincipal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DOP">DOP - Peso Dominicano</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Logo
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="data-table-button data-table-button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="data-table-button data-table-button-primary"
            >
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Info;
