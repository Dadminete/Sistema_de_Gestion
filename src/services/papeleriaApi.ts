import axios from 'axios';
import { AuthService } from './authService';

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

const papeleriaApi = axios.create({
    baseURL: `${API_BASE_URL}/papeleria`,
});

papeleriaApi.interceptors.request.use(
    (config) => {
        const token = AuthService.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interfaces based on Prisma schema
export interface CategoriaPapeleria {
    id: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}

export interface ProductoPapeleria {
    id: number; // Corresponds to BigInt in Prisma, handled as number in frontend
    codigo: string;
    nombre: string;
    descripcion?: string;
    categoriaId: number | null; // Corresponds to BigInt in Prisma, handled as number or null in frontend
    marca?: string;
    modelo?: string;
    unidadMedida: string;
    precioCompra: number; // Corresponds to Decimal in Prisma, handled as number
    precioVenta: number; // Corresponds to Decimal in Prisma, handled as number
    margenGanancia: number; // Corresponds to Decimal in Prisma, handled as number
    stockActual: number;
    stockMinimo: number;
    ubicacion?: string;
    codigoBarras?: string;
    imagen?: string;
    activo: boolean;
    proveedorId?: string | null;
    categoria?: CategoriaPapeleria;
}

// --- Categorias --- //
export const getCategorias = () => papeleriaApi.get<CategoriaPapeleria[]>('/categorias');
export const createCategoria = (data: Omit<CategoriaPapeleria, 'id'>) => papeleriaApi.post<CategoriaPapeleria>('/categorias', data);
export const updateCategoria = (id: number, data: Partial<CategoriaPapeleria>) => papeleriaApi.put<CategoriaPapeleria>(`/categorias/${id}`, data);
export const deleteCategoria = (id: number) => papeleriaApi.delete(`/categorias/${id}`);

// --- Productos --- //
export const getProductos = () => papeleriaApi.get<ProductoPapeleria[]>('/productos');
export const getProductoById = (id: number) => papeleriaApi.get<ProductoPapeleria>(`/productos/${id}`);
export const createProducto = (data: Omit<ProductoPapeleria, 'id'>) => papeleriaApi.post<ProductoPapeleria>('/productos', data);
export const updateProducto = (id: number, data: Partial<ProductoPapeleria>) => papeleriaApi.put<ProductoPapeleria>(`/productos/${id}`, data);
export const deleteProducto = (id: number) => papeleriaApi.delete(`/productos/${id}`);

// --- Clientes --- //
// Assuming ClientePapeleria is a type of Usuario
export interface ClientePapeleria {
    id: string;
    nombre: string;
    apellido: string;
    email?: string;
    telefono?: string;
    cedula?: string;
}
export const getClientes = () => papeleriaApi.get<ClientePapeleria[]>('/clientes');
export const createCliente = (data: Omit<ClientePapeleria, 'id'>) => papeleriaApi.post<ClientePapeleria>('/clientes', data);
export const updateCliente = (id: string, data: Partial<ClientePapeleria>) => papeleriaApi.put<ClientePapeleria>(`/clientes/${id}`, data);
export const deleteCliente = (id: string) => papeleriaApi.delete(`/clientes/${id}`);

// --- Ventas --- //
export interface DetalleVenta {
    productoId: number;
    nombreProducto?: string; // Added for displaying product name in tickets
    cantidad: number;
    precioUnitario: number;
}

export interface VentaPapeleria {
    id: string;
    numeroVenta: string; // Added to match Prisma schema
    usuarioId: string;
    clienteNombre?: string;
    clienteCedula?: string;
    fechaVenta: string; // Added to match Prisma schema (DateTime in Prisma, string in API response)
    subtotal: number;
    descuentos?: number;
    total: number;
    metodoPago: string;
    detalles: DetalleVenta[];
}

export const getVentas = () => papeleriaApi.get<VentaPapeleria[]>('/ventas');
export const getVentaById = (id: string) => papeleriaApi.get<VentaPapeleria>(`/ventas/${id}`);
export const createVenta = (data: Omit<VentaPapeleria, 'id'>) => papeleriaApi.post<VentaPapeleria>('/ventas', data);
export const updateVenta = (id: string, data: Partial<VentaPapeleria>) => papeleriaApi.put<VentaPapeleria>(`/ventas/${id}`, data);
export const deleteVenta = (id: string) => papeleriaApi.delete(`/ventas/${id}`);
