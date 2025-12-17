import type { Usuario } from '@prisma/client';
import type { UserWithRoles } from '../types/database';

// Get dynamic API base URL
const getAPIBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  // Fallback to dynamic detection
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  return `${protocol}://${hostname}${port}/api`;
};

const API_BASE_URL = `${getAPIBaseURL()}/users`;

export const getUsers = async (): Promise<UserWithRoles[]> => {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  return response.json();
};

export const createUser = async (data: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'ultimoAcceso' | 'bloqueadoHasta'> & { roles?: string[] }): Promise<UserWithRoles> => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create user: ${response.statusText}`);
  }
  return response.json();
};

export const updateUser = async (id: string, data: Partial<Usuario> & { roles?: string[] }): Promise<UserWithRoles> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update user: ${response.statusText}`);
  }
  return response.json();
};

export const deleteUser = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
  }
};
