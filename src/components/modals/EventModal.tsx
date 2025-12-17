import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { createEvento, updateEvento, deleteEvento, type Evento } from '@/services/eventService';
import type { EventInput } from '@fullcalendar/core';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventInput) => void;
  onDelete: (eventId: string) => void;
  eventData: EventInput | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, eventData }) => {
  const [formData, setFormData] = useState<Partial<Evento>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (eventData) {
      const start = eventData.start ? new Date(eventData.start as string) : new Date();
      const end = eventData.end ? new Date(eventData.end as string) : new Date(start.getTime() + 60 * 60 * 1000);

      setFormData({
        id: eventData.id,
        titulo: eventData.title || '',
        descripcion: eventData.extendedProps?.description || '',
        fechaInicio: start.toISOString().substring(0, 16),
        fechaFin: end.toISOString().substring(0, 16),
        todoElDia: eventData.allDay || false,
        color: eventData.color || '#3788d8',
        ubicacion: eventData.extendedProps?.location || '',
      });
    } else {
      setFormData({});
    }
  }, [eventData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!user || !formData.titulo) return;

    const eventToSave: Partial<Evento> = {
      ...formData,
      creadoPorId: user.id,
      fechaInicio: new Date(formData.fechaInicio || '').toISOString(),
      fechaFin: new Date(formData.fechaFin || '').toISOString(),
    };

    try {
      let savedEvent: Evento;
      if (formData.id) {
        savedEvent = await updateEvento(formData.id, eventToSave);
      } else {
        savedEvent = await createEvento(eventToSave as Omit<Evento, 'id'>);
      }

      onSave({
        id: savedEvent.id,
        title: savedEvent.titulo,
        start: savedEvent.fechaInicio,
        end: savedEvent.fechaFin,
        allDay: savedEvent.todoElDia,
        color: savedEvent.color,
        extendedProps: {
          description: savedEvent.descripcion,
          location: savedEvent.ubicacion,
        }
      });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) {
      console.log('❌ No event ID found in formData');
      return;
    }

    console.log('🗑️ Modal: Attempting to delete event with ID:', formData.id);

    try {
      await deleteEvento(formData.id);
      console.log('✅ Modal: Event deleted successfully, calling onDelete callback');
      onDelete(formData.id);
    } catch (error) {
      console.error('❌ Modal: Error deleting event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-500">
            {formData.id ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide text-xs">Título</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo || ''}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
              placeholder="Nombre del evento"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide text-xs">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:shadow-md resize-none"
              placeholder="Detalles del evento..."
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide text-xs">Inicio</label>
              <input
                type="datetime-local"
                name="fechaInicio"
                value={formData.fechaInicio || ''}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide text-xs">Fin</label>
              <input
                type="datetime-local"
                name="fechaFin"
                value={formData.fechaFin || ''}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide text-xs">Ubicación</label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion || ''}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
              placeholder="Lugar del evento"
            />
          </div>

          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide text-xs">Color</label>
              <div className="relative">
                <input
                  type="color"
                  name="color"
                  value={formData.color || '#3788d8'}
                  onChange={handleChange}
                  className="h-12 w-20 p-1 border-3 border-gray-400 dark:border-gray-500 rounded-lg cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="todoElDia"
                name="todoElDia"
                checked={formData.todoElDia || false}
                onChange={handleChange}
                className="h-6 w-6 rounded accent-blue-600 cursor-pointer border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700 shadow-sm"
              />
              <label htmlFor="todoElDia" className="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer select-none">Todo el día</label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '4px solid #2563eb' }}>
          {formData.id && (
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={handleDelete}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  width: '100%',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                  lineHeight: '28px',
                  minHeight: '28px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)';
                }}
              >
                Eliminar
              </button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                cursor: 'pointer',
                border: 'none',
                fontSize: '13px',
                transition: 'all 0.3s ease',
                lineHeight: '28px',
                minHeight: '28px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
              }}
            >
              Guardar
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.2)',
                cursor: 'pointer',
                border: 'none',
                fontSize: '13px',
                transition: 'all 0.3s ease',
                lineHeight: '28px',
                minHeight: '28px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4b5563';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(107, 114, 128, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.2)';
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
