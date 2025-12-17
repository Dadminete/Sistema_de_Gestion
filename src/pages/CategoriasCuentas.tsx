import React, { useState, useMemo, useEffect } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/feature/DataTable';
import Modal from '../components/feature/Modal';
import api from '../lib/api';
import './CategoriasCuentas.css';
import Swal from 'sweetalert2';
import {
  BookOpen, Plus, Search, Edit2, Trash2, Save, X,
  CheckCircle, FileText, Hash, Tag,
  Layers, ToggleLeft, ToggleRight, Filter, Download, RefreshCw
} from 'lucide-react';

interface CategoriaCuenta {
  id: string;
  nombre: string;
  codigo: string;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  subtipo?: string | null;
  esDetalle: boolean;
  activa: boolean;
}

const CategoriasCuentas: React.FC = () => {
  // Form States
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState<'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'>('ingreso');
  const [subtipo, setSubtipo] = useState('');
  const [esDetalle, setEsDetalle] = useState(true);
  const [activa, setActiva] = useState(true);
  const [descripcion, setDescripcion] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos'>('ingresos');
  const [filter, setFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageTypesModalOpen, setIsManageTypesModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data States
  const [allCategories, setAllCategories] = useState<CategoriaCuenta[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoriaCuenta | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CategoriaCuenta>>({});
  const [tiposDisponibles, setTiposDisponibles] = useState(['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto']);
  const [nuevoTipo, setNuevoTipo] = useState('');

  const generateCode = (selectedTipo: string): string => {
    const randomString = Math.random().toString(36).substr(2, 5).toUpperCase();
    let prefix = '';
    
    // Mapeo de prefijos para tipos predefinidos
    const prefixMap: Record<string, string> = {
      'activo': '1000',
      'pasivo': '2000',
      'patrimonio': '3000',
      'ingreso': '4000',
      'gasto': '5000',
    };
    
    // Si el tipo existe en el mapeo, usar su prefijo
    if (prefixMap[selectedTipo]) {
      prefix = prefixMap[selectedTipo];
    } else {
      // Para tipos personalizados, generar un prefijo basado en el hash del tipo
      const hash = selectedTipo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      prefix = String(6000 + (hash % 1000)).padStart(4, '0');
    }
    
    return `${prefix}-${randomString}`;
  };

  useEffect(() => {
    setCodigo(generateCode(tipo));
  }, [tipo]);

  useEffect(() => {
    // Permitir que el primer tipo disponible sea el seleccionado por defecto
    if (tiposDisponibles.length > 0 && !tiposDisponibles.includes(tipo)) {
      setTipo(tiposDisponibles[0] as any);
    }
  }, [tiposDisponibles]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contabilidad/categorias-cuentas');
      const sortedCategories = (response.data || []).sort((a: CategoriaCuenta, b: CategoriaCuenta) =>
        a.nombre.localeCompare(b.nombre, 'es')
      );
      setAllCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar las categorías.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddTipo = async () => {
    if (!nuevoTipo.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'El tipo de cuenta no puede estar vacío.',
        icon: 'warning'
      });
      return;
    }

    if (tiposDisponibles.includes(nuevoTipo.toLowerCase())) {
      Swal.fire({
        title: 'Error',
        text: 'Este tipo de cuenta ya existe.',
        icon: 'warning'
      });
      return;
    }

    setTiposDisponibles([...tiposDisponibles, nuevoTipo.toLowerCase()]);
    setNuevoTipo('');
    Swal.fire({
      title: '¡Agregado!',
      text: `Tipo "${nuevoTipo}" agregado exitosamente.`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDeleteTipo = (tipoAEliminar: string) => {
    const tiposBase = ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto'];
    if (tiposBase.includes(tipoAEliminar)) {
      Swal.fire({
        title: 'No permitido',
        text: 'No puedes eliminar los tipos de cuenta predeterminados.',
        icon: 'info'
      });
      return;
    }

    setTiposDisponibles(tiposDisponibles.filter(t => t !== tipoAEliminar));
    Swal.fire({
      title: 'Eliminado',
      text: `Tipo "${tipoAEliminar}" eliminado.`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCategory: Omit<CategoriaCuenta, 'id'> = {
      nombre,
      codigo,
      tipo,
      subtipo: subtipo === '' ? null : subtipo,
      esDetalle,
      activa,
    };

    try {
      const response = await api.post('/contabilidad/categorias-cuentas', newCategory);
      const createdCategory = response.data;
      setAllCategories(prev => [...prev, createdCategory]);

      Swal.fire({
        title: '¡Creado!',
        text: 'Categoría registrada exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setNombre('');
      setCodigo(generateCode(tipo));
      setSubtipo('');
      setDescripcion('');
      setEsDetalle(true);
      setActiva(true);
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error('Error creating category:', error);
      Swal.fire({
        title: 'Error',
        text: `Error al registrar la categoría: ${error.response?.data?.message || error.message}`,
        icon: 'error'
      });
    }
  };

  const handleEdit = (categoria: CategoriaCuenta) => {
    setEditingCategory(categoria);
    setEditFormData(categoria);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (categoria: CategoriaCuenta) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la categoría "${categoria.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/contabilidad/categorias-cuentas/${categoria.id}`);
        setAllCategories(prev => prev.filter(cat => cat.id !== categoria.id));
        Swal.fire({
          title: 'Eliminado',
          text: `Categoría "${categoria.nombre}" eliminada.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        console.error('Error deleting category:', error);
        Swal.fire({
          title: 'Error',
          text: `Error al eliminar: ${error.response?.data?.message || error.message}`,
          icon: 'error'
        });
      }
    }
  };

  const handleUpdateCategory = async () => {
    if (!editFormData || !editingCategory) return;

    try {
      // Solo actualizar los campos que realmente cambiaron
      const updateData = {
        nombre: editFormData.nombre || editingCategory.nombre,
        subtipo: editFormData.subtipo !== undefined ? editFormData.subtipo : editingCategory.subtipo,
        esDetalle: editFormData.esDetalle !== undefined ? editFormData.esDetalle : editingCategory.esDetalle,
        activa: editFormData.activa !== undefined ? editFormData.activa : editingCategory.activa,
        // No incluir tipo en la actualización si no cambió
        ...(editFormData.tipo && editFormData.tipo !== editingCategory.tipo ? { tipo: editFormData.tipo } : {}),
      };

      const response = await api.put(`/contabilidad/categorias-cuentas/${editingCategory.id}`, updateData);
      const updatedCategory = response.data;
      setAllCategories(prev =>
        prev.map(cat => (cat.id === updatedCategory.id ? updatedCategory : cat))
      );

      Swal.fire({
        title: 'Actualizado',
        text: 'Categoría actualizada exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setIsEditModalOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      console.error('Error updating category:', error);
      Swal.fire({
        title: 'Error',
        text: `Error al actualizar: ${error.response?.data?.message || error.message}`,
        icon: 'error'
      });
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setEditFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const filteredCategories = useMemo(() => {
    let categories = allCategories;

    // Filtrar por tab para mostrar categorías específicas según la pestaña seleccionada
    if (activeTab === 'ingresos') {
      categories = categories.filter(cat => ['ingreso', 'activo', 'patrimonio'].includes(cat.tipo));
    } else {
      categories = categories.filter(cat => ['gasto', 'pasivo'].includes(cat.tipo));
    }

    if (filter) {
      const lowerFilter = filter.toLowerCase();
      categories = categories.filter(cat =>
        cat.nombre.toLowerCase().includes(lowerFilter) ||
        cat.codigo.toLowerCase().includes(lowerFilter) ||
        cat.tipo.toLowerCase().includes(lowerFilter)
      );
    }

    return categories;
  }, [allCategories, activeTab, filter]);

  const columns: ColumnDef<CategoriaCuenta>[] = useMemo(() => [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: info => <span className="font-mono font-semibold text-slate-700">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: info => <span className="font-semibold text-slate-900">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: info => {
        const tipo = info.getValue() as string;
        const tipoConfig: Record<string, { bg: string; text: string; border: string }> = {
          activo: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
          pasivo: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
          patrimonio: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
          ingreso: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
          gasto: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
        };
        const config = tipoConfig[tipo] || tipoConfig.activo;
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border} uppercase tracking-wide`}>
            {tipo}
          </span>
        );
      },
    },
    {
      accessorKey: 'subtipo',
      header: 'Subtipo',
      cell: info => (
        <span className="text-slate-600 text-sm font-medium">
          {info.getValue() as string || <span className="text-gray-400 italic">—</span>}
        </span>
      ),
    },
    {
      accessorKey: 'esDetalle',
      header: 'Detalle',
      cell: info => (
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${info.getValue()
            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
            : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
          {info.getValue() ? '✓' : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'activa',
      header: 'Estado',
      cell: info => (
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${info.getValue()
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
          {info.getValue() ? <CheckCircle size={14} /> : <X size={14} />}
          {info.getValue() ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all hover:shadow-sm"
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-all hover:shadow-sm"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="categorias-cuentas-container">
      <div className="page-header">
        <div className="header-content">
          <h1><BookOpen className="icon" size={32} /> Categorías de Cuentas Contables</h1>
          <p>Gestiona el catálogo completo de cuentas para tu contabilidad</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsManageTypesModalOpen(true)}
            title="Gestionar tipos de cuenta"
          >
            <Tag size={18} />
            Gestionar Tipos
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            Nueva Categoría
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="controls-bar">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'ingresos' ? 'active' : ''}`}
              onClick={() => setActiveTab('ingresos')}
            >
              📈 Ingresos, Activos y Patrimonio
            </button>
            <button
              className={`tab-btn ${activeTab === 'gastos' ? 'active' : ''}`}
              onClick={() => setActiveTab('gastos')}
            >
              📉 Gastos y Pasivos
            </button>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={fetchCategories}
            title="Actualizar"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        <div className="datatable-wrapper">
          <DataTable
            key={`${activeTab}-${filteredCategories.length}`}
            columns={columns}
            data={filteredCategories}
            isLoading={loading}
            tableName={`categorias-${activeTab}`}
          />
        </div>
      </div>

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nueva Categoría de Cuenta">
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nombre">
                  <FileText size={14} /> Nombre de la Categoría
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Ingresos por Ventas"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="codigo">
                  <Hash size={14} /> Código (Auto-generado)
                </label>
                <input
                  type="text"
                  id="codigo"
                  value={codigo}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo">
                  <Layers size={14} /> Tipo de Cuenta
                </label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  required
                >
                  {tiposDisponibles.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subtipo">
                  <Tag size={14} /> Subtipo (Opcional)
                </label>
                <input
                  type="text"
                  id="subtipo"
                  value={subtipo}
                  onChange={(e) => setSubtipo(e.target.value)}
                  placeholder="Ej: Venta de Productos"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="descripcion">
                <FileText size={14} /> Descripción (Opcional)
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Proporciona detalles adicionales sobre esta categoría..."
              ></textarea>
            </div>

            <div className="modal-toggles">
              <label className={`toggle-label ${esDetalle ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={esDetalle}
                  onChange={(e) => setEsDetalle(e.target.checked)}
                />
                <span>Cuenta de Detalle</span>
              </label>

              <label className={`toggle-label ${activa ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                />
                <span>Activar Cuenta</span>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={16} />
                Crear Categoría
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Edición */}
      {isEditModalOpen && editingCategory && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Categoría">
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateCategory(); }} className="category-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit-nombre">Nombre</label>
                <input id="edit-nombre" name="nombre" type="text" value={editFormData.nombre || ''} onChange={handleEditFormChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="edit-codigo">Código</label>
                <input id="edit-codigo" name="codigo" type="text" value={editFormData.codigo || ''} readOnly />
              </div>
              <div className="form-group">
                <label htmlFor="edit-tipo">Tipo</label>
                <select id="edit-tipo" name="tipo" value={editFormData.tipo || ''} onChange={handleEditFormChange} required>
                  {tiposDisponibles.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-subtipo">Subtipo</label>
                <input id="edit-subtipo" name="subtipo" type="text" value={editFormData.subtipo || ''} onChange={handleEditFormChange} />
              </div>
            </div>

            <div className="modal-toggles">
              <label className="toggle-label">
                <input id="edit-esDetalle" name="esDetalle" type="checkbox" checked={editFormData.esDetalle || false} onChange={handleEditFormChange} />
                <span>Cuenta de Detalle</span>
              </label>
              <label className="toggle-label">
                <input id="edit-activa" name="activa" type="checkbox" checked={editFormData.activa || false} onChange={handleEditFormChange} />
                <span>Activa</span>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal para Gestionar Tipos de Cuenta */}
      {isManageTypesModalOpen && (
        <Modal isOpen={isManageTypesModalOpen} onClose={() => setIsManageTypesModalOpen(false)} title="Gestionar Tipos de Cuenta">
          <div className="category-form">
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="nuevo-tipo">
                <Tag size={14} /> Agregar Nuevo Tipo
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  id="nuevo-tipo"
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value)}
                  placeholder="Nombre del nuevo tipo..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTipo()}
                />
                <button
                  type="button"
                  onClick={handleAddTipo}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontWeight: '600' }}>Tipos de Cuenta Disponibles</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tiposDisponibles.map(tipo => {
                  const esBase = ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto'].includes(tipo);
                  return (
                    <div
                      key={tipo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: esBase ? '#e0e7ff' : '#f3e8ff',
                        border: `1px solid ${esBase ? '#c7d2fe' : '#e9d5ff'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      {!esBase && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTipo(tipo)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#dc2626',
                            fontSize: '16px',
                            padding: '0 4px',
                          }}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button type="button" onClick={() => setIsManageTypesModalOpen(false)} className="btn btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CategoriasCuentas;
