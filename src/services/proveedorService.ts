import api from '../lib/api';

export interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
  razonSocial?: string;
  rnc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  tipoProveedor: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProveedorData {
  nombre: string;
  razonSocial?: string;
  rnc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  tipoProveedor?: string;
}

export interface UpdateProveedorData extends Partial<CreateProveedorData> {
  activo?: boolean;
}

class ProveedorService {
  // Obtener todos los proveedores
  async getProveedores(filtros?: { activo?: boolean; tipoProveedor?: string }): Promise<Proveedor[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.activo !== undefined) {
        params.append('activo', filtros.activo.toString());
      }
      if (filtros?.tipoProveedor) {
        params.append('tipoProveedor', filtros.tipoProveedor);
      }

      const url = params.toString() ? `/proveedores?${params.toString()}` : '/proveedores';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw error;
    }
  }

  // Obtener un proveedor por ID
  async getProveedorById(id: string): Promise<Proveedor> {
    try {
      const response = await api.get(`/proveedores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      throw error;
    }
  }

  // Crear un nuevo proveedor
  async createProveedor(data: CreateProveedorData): Promise<Proveedor> {
    try {
      const response = await api.post('/proveedores', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw error;
    }
  }

  // Actualizar un proveedor
  async updateProveedor(id: string, data: UpdateProveedorData): Promise<Proveedor> {
    try {
      const response = await api.put(`/proveedores/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      throw error;
    }
  }

  // Eliminar un proveedor
  async deleteProveedor(id: string): Promise<void> {
    try {
      await api.delete(`/proveedores/${id}`);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      throw error;
    }
  }

  // Obtener solo proveedores activos (método de conveniencia)
  async getProveedoresActivos(): Promise<Proveedor[]> {
    return this.getProveedores({ activo: true });
  }
}

export default new ProveedorService();