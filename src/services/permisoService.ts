import { apiClient } from '../utils/apiClient';

export interface RolePermisoRelation {
  rolId: string;
  permisoId: string;
  activo: boolean;
  rol: {
    id: string;
    nombreRol: string;
    activo: boolean;
  };
}

export interface Permiso {
  id: string;
  nombrePermiso: string;
  descripcion?: string;
  activo: boolean;
  esSistema: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolesPermisos?: RolePermisoRelation[];
}

export interface CreatePermisoData {
  nombrePermiso: string;
  descripcion?: string;
  esSistema?: boolean;
}

export interface UpdatePermisoData {
  nombrePermiso?: string;
  descripcion?: string;
  esSistema?: boolean;
  activo?: boolean;
}

export class PermisoService {
  // Obtener todos los permisos
  static async getPermisos(): Promise<Permiso[]> {
    // apiClient ya normaliza /api y adjunta Authorization
    return apiClient.get('/permisos');
  }

  // Obtener permiso por ID
  static async getPermisoById(id: string): Promise<Permiso> {
    return apiClient.get(`/permisos/${id}`);
  }

  // Crear permiso
  static async createPermiso(data: CreatePermisoData): Promise<Permiso> {
    return apiClient.post('/permisos', data);
  }

  // Actualizar permiso
  static async updatePermiso(id: string, data: UpdatePermisoData): Promise<Permiso> {
    return apiClient.put(`/permisos/${id}`, data);
  }

  // Eliminar permiso
  static async deletePermiso(id: string): Promise<void> {
    await apiClient.delete(`/permisos/${id}`);
  }
}
