import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { averiasService } from '../services/averiasService';
import './AveriasEditar.css';
import Swal from 'sweetalert2';

interface AveriaForm {
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  notas?: string | null;
  tipo?: string;
  clienteId?: string;
}

const AveriasEditar: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<AveriaForm>({
    descripcion: '',
    categoria: 'Red',
    prioridad: 'Baja',
    estado: 'abierto',
    notas: '',
    tipo: '',
  });
  const [imagen, setImagen] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await averiasService.getById(id);
        // intentar inferir 'tipo' desde notas si existe
        const initialTipo = '';
        setForm({
          descripcion: data?.descripcion ?? '',
          categoria: data?.categoria ?? 'Red',
          prioridad: (data?.prioridad as string) ?? 'Baja',
          estado: (data?.estado as string) ?? 'abierto',
          notas: data?.notas ?? '',
          tipo: initialTipo,
          clienteId: (data as any)?.clienteId,
        });
      } catch (e) {
        setError('No se pudo cargar la avería');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, { method: 'POST', headers, body: fd });
    if (!res.ok) throw new Error('Error al subir imagen');
    const data = await res.json();
    return data.filePath || data.url || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      let notas = form.notas ?? '';
      if (imagen) {
        const imagenUrl = await uploadImage(imagen);
        if (imagenUrl) {
          notas = imagenUrl; // almacenar la ruta para que detalle la renderice
        }
      }
      const payload: any = {
        descripcion: form.descripcion,
        categoria: form.categoria,
        prioridad: form.prioridad,
        estado: form.estado,
        notas: notas || undefined,
      };
      await averiasService.update(id, payload);
      // Notificar cambios
      window.dispatchEvent(new CustomEvent('averias:updated'));
      navigate(`/averias/${id}`);
    } catch (e: any) {
      Swal.fire('Error', e?.message || 'No se pudo guardar la avería', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    
    const result = await Swal.fire({
      title: '¿Cerrar avería?',
      text: '¿Quieres cerrar esta avería como resuelta?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await averiasService.close(id);
      // Notificar cambios
      window.dispatchEvent(new CustomEvent('averias:updated'));
      navigate(`/averias/${id}`);
    }
  };

  if (loading) return <div className="page-container"><p>Cargando...</p></div>;
  if (error) return <div className="page-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="page-title">AVERIAS / Editar Tickets Averías</h2>
          <p className="page-subtitle">Modifica los campos del ticket con el mismo formato de creación</p>
        </div>
      </div>

      <div className="grid two-columns">
        <div className="card">
          <h3 className="card-title">Editar Ticket</h3>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Cliente</label>
              <input value={form.clienteId || ''} disabled />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría <span className="req">*</span></label>
                <select name="categoria" value={form.categoria} onChange={handleChange} required>
                  <option>Red</option>
                  <option>Internet</option>
                  <option>Telefonía</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Prioridad <span className="req">*</span></label>
                <select name="prioridad" value={form.prioridad} onChange={handleChange} required>
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Tipo de Avería</label>
              <input name="tipo" value={form.tipo || ''} onChange={handleChange} placeholder="Ej: Sin servicio, Lenta, Intermitente" />
            </div>

            <div className="form-group">
              <label>Descripción <span className="req">*</span></label>
              <textarea name="descripcion" rows={4} value={form.descripcion} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Imagen</label>
              <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files?.[0] || null)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}>
                  <option value="abierto">Abierto</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input name="notas" value={form.notas ?? ''} onChange={handleChange} />
              </div>
            </div>

            <div className="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="action-button" onClick={() => navigate(-1)}>
                <span className="material-icons">arrow_back</span>Volver
              </button>
              <button type="submit" className="action-button primary" disabled={saving}>
                <span className="material-icons">save</span>{saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" className="action-button info" onClick={handleClose}>
                <span className="material-icons">task_alt</span>Cerrar Avería
              </button>
            </div>
          </form>
        </div>
        <aside className="card side-info">
          <h3 className="card-title">Información</h3>
          <p>Usa este formulario con el mismo formato que la creación para mantener consistencia.</p>
        </aside>
      </div>
    </div>
  );
};

export default AveriasEditar;
