import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { averiasService } from '../services/averiasService';
import './AveriasDetalle.css';

// Get dynamic API base URL (remove /api suffix for static assets like /uploads)
const getAPIBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, '').replace(/\/api$/, '');
  }
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  return `${protocol}://${hostname}${port}`;
};

const RAW_API_BASE = getAPIBaseURL();
const API_BASE = RAW_API_BASE;

interface Averia {
  id: string;
  numeroTicket: string;
  clienteId: string;
  asunto: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  createdAt: string;
  notas?: string | null;
}

const AveriasDetalle: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Averia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const resp = await averiasService.getById(id);
      setData(resp);
    } catch (e) {
      setError('No se pudo cargar la avería');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleClose = () => {
    if (!id) return;
    navigate(`/averias/cerrar/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('¿Eliminar esta avería definitivamente?')) return;
    await averiasService.delete(id);
    navigate('/averias');
  };

  if (loading) return <div className="page-container"><p>Cargando...</p></div>;
  if (error || !data) return <div className="page-container"><p className="error-message">{error || 'No encontrado'}</p></div>;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="page-title">AVERIAS / Detalle Ticket</h2>
          <p className="page-subtitle">Visualiza la información del ticket</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">{data.numeroTicket}</h3>
        <div className="grid two-columns">
          <div>
            <p><b>Cliente:</b> {data.clienteId}</p>
            <p><b>Asunto:</b> {data.asunto}</p>
            <p><b>Categoría:</b> {data.categoria}</p>
            <p><b>Prioridad:</b> {data.prioridad}</p>
          </div>
          <div>
            <p><b>Estado:</b> {data.estado}</p>
            <p><b>Creado:</b> {new Date(data.createdAt).toLocaleString()}</p>
            {data.notas ? <p><b>Notas:</b> {data.notas}</p> : null}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <p><b>Descripción:</b></p>
          <p>{data.descripcion}</p>
        </div>
        {(() => {
          // Intentar extraer una URL de imagen de notas (p. ej. "Imagen adjunta: /uploads/xxx.jpg")
          const text = data.notas || '';
          const match = text.match(/https?:[^\s]+\.(?:png|jpg|jpeg|gif|webp)|\/uploads\/[^\s]+/i);
          const found = match ? match[0] : null;
          // Prefer same-origin proxied path when it's an /uploads URL
          let relUrl: string | null = null;
          let absUrl: string | null = null;
          if (found) {
            if (/^https?:/i.test(found)) {
              try {
                const u = new URL(found);
                if (u.pathname.startsWith('/uploads/')) {
                  relUrl = u.pathname; // same-origin via Vite proxy
                  absUrl = found;      // fallback
                } else {
                  absUrl = found;
                }
              } catch {
                absUrl = found;
              }
            } else if (/^\/uploads\//i.test(found)) {
              relUrl = found;
              absUrl = `${API_BASE}${found}`;
            } else {
              absUrl = found;
            }
          }

          const url = relUrl || absUrl || null;
          const handleImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
            // Fallback to absolute if relative fails
            if (relUrl && absUrl && (e.currentTarget as HTMLImageElement).src !== absUrl) {
              (e.currentTarget as HTMLImageElement).src = absUrl;
            }
          };

          return url ? (
            <div style={{ marginTop: 16 }}>
              <p><b>Imagen adjunta:</b></p>
              <img src={url} onError={handleImgError} crossOrigin="anonymous" alt="Adjunto" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
          ) : null;
        })()}
        <div className="actions" style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="action-button" onClick={() => navigate('/averias')}><span className="material-icons">arrow_back</span>Volver</button>
          <button className="action-button" onClick={() => navigate(`/averias/${data.id}/editar`)}><span className="material-icons">edit</span>Editar</button>
          <button className="action-button info" onClick={handleClose}><span className="material-icons">task_alt</span>Cerrar</button>
          <button className="action-button danger" onClick={handleDelete}><span className="material-icons">delete</span>Eliminar</button>
        </div>
      </div>
    </div>
  );
};

export default AveriasDetalle;
