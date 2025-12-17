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

const API_BASE_URL = getAPIBaseURL();

export interface RolePermiso {
  rolId: string;
  permisoId: string;
  activo: boolean;
  permiso: {
    id: string;
    nombrePermiso: string;
    descripcion?: string;
  };
}

export interface Role {
  id: string;
  nombreRol: string;
  descripcion?: string;
  activo: boolean;
  esSistema: boolean;
  prioridad: number;
  createdAt: Date;
  updatedAt: Date;
  rolesPermisos?: RolePermiso[];
}

export interface CreateRoleData {
  nombreRol: string;
  descripcion?: string;
  prioridad?: number;
  esSistema?: boolean;
  permisos?: string[];
}

export interface UpdateRoleData {
  nombreRol?: string;
  descripcion?: string;
  activo?: boolean;
  prioridad?: number;
  permisos?: string[];
}

export class RoleService {
  // Obtener todos los roles
  static async getRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/roles`);
    if (!response.ok) {
      throw new Error('Error al obtener roles');
    }
    return response.json();
  }

  // Obtener rol por ID
  static async getRoleById(id: string): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener rol');
    }
    return response.json();
  }

  // Crear rol
  static async createRole(data: CreateRoleData): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Error al crear rol');
    }
    return response.json();
  }

  // Actualizar rol
  static async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar rol');
    }
    return response.json();
  }

  // Eliminar rol
  static async deleteRole(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar rol');
    }
  }
}
