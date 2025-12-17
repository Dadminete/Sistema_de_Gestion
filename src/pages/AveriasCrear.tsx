import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import './AveriasCrear.css';
import Swal from 'sweetalert2';
import { clientService } from '../services/clientService';
import { averiasService } from '../services/averiasService';

const AveriasCrear: React.FC = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState('');
  const [categoria, setCategoria] = useState('Red');
  const [prioridad, setPrioridad] = useState('Baja');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [clientes, setClientes] = useState<{ id: string; nombre: string; apellidos?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total?: number; pendientes?: number; resueltos?: number }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await clientService.getClients({ page: 1, status: 'activo' });
        const items = (resp?.items || resp?.data || resp || []).map((c: any) => ({ id: c.id || c.uuid || c._id, nombre: c.nombre, apellidos: c.apellidos }));
        // Filtrar y ordenar alfabéticamente por nombre
        const filteredClientes = items.filter((c: any) => c.id);
        const sortedClientes = filteredClientes.sort((a: any, b: any) => {
          const nameA = `${a.nombre || ''} ${a.apellidos || ''}`.trim().toLowerCase();
          const nameB = `${b.nombre || ''} ${b.apellidos || ''}`.trim().toLowerCase();
          return nameA.localeCompare(nameB, 'es');
        });
        setClientes(sortedClientes);
      } catch (_) {
        // ignore
      }
      try {
        const s = await averiasService.statsMes(0);
        setStats({
          total: s?.total ?? 0,
          pendientes: s?.pendientes ?? 0,
          resueltos: s?.resueltos ?? 0,
        });
      } catch (_) {
        // ignore
      }
    };
    load();
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const fd = new FormData();
    fd.append('file', file);

    // Get dynamic API base URL
    const getAPIBaseURL = () => {
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      if (envUrl && envUrl.trim()) {
        const raw = envUrl.replace(/\/$/, '');
        return raw.endsWith('/api') ? raw : `${raw}/api`;
      }
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol.replace(':', '');
      return `${protocol}://${hostname}${port}/api`;
    };
    const API_BASE_URL = getAPIBaseURL();
    const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', headers, body: fd });
    if (!res.ok) throw new Error('Error al subir imagen');
    const data = await res.json();
    return data.filePath || data.url || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !categoria || !prioridad || !descripcion) return;
    setLoading(true);
    try {
      let imagenUrl: string | null = null;
      if (imagen) {
        imagenUrl = await uploadImage(imagen);
      }
      await averiasService.crear({
        clienteId: cliente,
        categoria,
        prioridad,
        tipo: tipo || undefined,
        descripcion,
        imagenUrl: imagenUrl || undefined,
      });
      // Limpia el formulario
      setCliente('');
      setCategoria('Red');
      setPrioridad('Baja');
      setTipo('');
      setDescripcion('');
      setImagen(null);
      // Notificar a cualquier listado que los datos cambiaron
      window.dispatchEvent(new CustomEvent('averias:updated'));
      Swal.fire('Éxito', 'Ticket creado correctamente', 'success');
      // Navegar al listado para ver el nuevo registro
      navigate('/averias');
    } catch (err: any) {
      Swal.fire('Error', err?.message || 'Error al crear la avería', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="page-title">AVERIAS / Crear Tickets Averías</h2>
          <p className="page-subtitle">Registra una nueva avería para seguimiento y resolución</p>
        </div>
      </div>

      <div className="grid two-columns">
        <div className="card">
          <h3 className="card-title">Crear Nuevo Ticket</h3>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Cliente <span className="req">*</span></label>
              <select value={cliente} onChange={(e) => setCliente(e.target.value)} required>
                <option value="">Seleccionar Cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}{c.apellidos ? ` ${c.apellidos}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría <span className="req">*</span></label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
                  <option>Red</option>
                  <option>Internet</option>
                  <option>Telefonía</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Prioridad <span className="req">*</span></label>
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} required>
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Tipo de Avería</label>
              <input type="text" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ej: Sin servicio, Lenta, Intermitente" />
            </div>

            <div className="form-group">
              <label>Descripción <span className="req">*</span></label>
              <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Imagen</label>
              <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files?.[0] || null)} />
            </div>

            <div className="actions">
              <Button type="submit" variant="primary" disabled={loading}><span className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>add</span>{loading ? 'Creando...' : 'Crear Ticket'}</Button>
            </div>
          </form>
        </div>

        <aside className="card side-info">
          <h3 className="card-title">Información del Ticket</h3>

          <div className="block">
            <h4>Prioridades:</h4>
            <div className="badges">
              <span className="badge critico">Crítica</span>
              <span className="badge alta">Alta</span>
              <span className="badge media">Media</span>
              <span className="badge baja">Baja</span>
            </div>
            <ul className="notes">
              <li><strong>Crítica:</strong> Requiere atención inmediata</li>
              <li><strong>Alta:</strong> Atender en las próximas horas</li>
              <li><strong>Media:</strong> Atender en el día</li>
              <li><strong>Baja:</strong> Puede esperar 24-48 horas</li>
            </ul>
          </div>

          <div className="block">
            <h4>Estadísticas del Mes:</h4>
            <ul className="stats">
              <li><span>Total Tickets:</span><b>{stats.total ?? 0}</b></li>
              <li><span>Pendientes:</span><b>{stats.pendientes ?? 0}</b></li>
              <li><span>Resueltos:</span><b>{stats.resueltos ?? 0}</b></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AveriasCrear;
