import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { averiasService } from '../services/averiasService';
import './AveriasCommon.css';
import './AveriasEditar.css';

const AveriasCerrar: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [imagen, setImagen] = useState<File | null>(null);
  const [estado, setEstado] = useState<string>('resuelto');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const t = await averiasService.getById(id);
        setTicketInfo(t);
        if (t?.estado) setEstado(t.estado);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
    setLoading(true);
    try {
      let imagenUrl: string | undefined;
      if (imagen) {
        const url = await uploadImage(imagen);
        if (url) {
          imagenUrl = url;
        }
      }
      await averiasService.close(id, { mensaje, imagenUrl, estado });
      // Notificar listados y vistas
      window.dispatchEvent(new CustomEvent('averias:updated'));
      navigate('/averias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="page-title">AVERIAS / Cerrar Avería</h2>
          <p className="page-subtitle">Registra un mensaje de cierre para el ticket</p>
        </div>
      </div>

      <div className="card">
        {ticketInfo && (
          <div style={{ marginBottom: 12, display: 'grid', gap: 6 }}>
            <div>
              <b>Ticket:</b> {ticketInfo.numeroTicket}
            </div>
            <div>
              <b>Cliente:</b> {ticketInfo?.cliente?.nombre || ticketInfo?.clienteId || '-'}
            </div>
            <div>
              <b>Asunto:</b> {ticketInfo.asunto}
            </div>
            <div>
              <b>Prioridad:</b> <span className={`priority-badge ${String(ticketInfo.prioridad || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'')}`}>{ticketInfo.prioridad}</span>
            </div>
          </div>
        )}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mensaje de cierre</label>
            <textarea rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En proceso</option>
              <option value="resuelto">Resuelto</option>
            </select>
          </div>
          <div className="form-group">
            <label>Adjuntar imagen (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files?.[0] || null)} />
          </div>
          <div className="actions" style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="action-button" onClick={() => navigate(-1)}>
              <span className="material-icons">arrow_back</span>Volver
            </button>
            <button type="submit" className="action-button info" disabled={loading}>
              <span className="material-icons">task_alt</span>{loading ? 'Guardando...' : 'Guardar Estado / Cerrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AveriasCerrar;
