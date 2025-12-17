import { apiClient } from '../utils/apiClient';

const API_URL = '/tareas';

// Interfaz para una tarea arrastrable
export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string | null;
  color: string;
  completada: boolean;
  creadoPorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Obtener todas las tareas de un usuario
export const getTareas = async (userId: string): Promise<Tarea[]> => {
  const response = await apiClient.get(`${API_URL}/${userId}`);
  return response;
};

// Obtener tareas del mes actual
export const getTareasDelMes = async (userId: string): Promise<Tarea[]> => {
  const tareas = await getTareas(userId);
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anoActual = ahora.getFullYear();
  
  return tareas.filter(tarea => {
    if (!tarea.createdAt) return false;
    const fecha = new Date(tarea.createdAt);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual;
  });
};

// Crear una nueva tarea
export const createTarea = async (tareaData: Omit<Tarea, 'id' | 'createdAt' | 'updatedAt' | 'completada'>): Promise<Tarea> => {
  const response = await apiClient.post(API_URL, tareaData);
  return response;
};

// Actualizar una tarea
export const updateTarea = async (id: string, tareaData: Partial<Omit<Tarea, 'id'>>): Promise<Tarea> => {
  const response = await apiClient.put(`${API_URL}/${id}`, tareaData);
  return response;
};

// Toggle task completion status
export const toggleTareaCompletada = async (id: string, completada: boolean): Promise<Tarea> => {
  const response = await apiClient.patch(`${API_URL}/${id}/completar`, { completada });
  return response;
};

// Eliminar una tarea
export const deleteTarea = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

