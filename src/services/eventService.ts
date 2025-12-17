import { apiClient } from '../utils/apiClient';

const API_URL = '/eventos';

// Interfaz para un evento del calendario
export interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: string; // ISO 8601 string
  fechaFin: string;    // ISO 8601 string
  todoElDia: boolean;
  color?: string;
  ubicacion?: string;
  creadoPorId: string;
  creadoPor?: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Obtener todos los eventos (con posible filtro por rango de fechas)
export const getEventos = async (start?: string, end?: string): Promise<Evento[]> => {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  const query = params.toString();
  const response = await apiClient.get(`${API_URL}${query ? `?${query}` : ''}`);
  return response;
};

// Crear un nuevo evento
export const createEvento = async (eventoData: Omit<Evento, 'id'>): Promise<Evento> => {
  const response = await apiClient.post(API_URL, eventoData);
  return response;
};

// Actualizar un evento existente
export const updateEvento = async (id: string, eventoData: Partial<Omit<Evento, 'id'>>): Promise<Evento> => {
  const response = await apiClient.put(`${API_URL}/${id}`, eventoData);
  return response;
};

// Eliminar un evento
export const deleteEvento = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
