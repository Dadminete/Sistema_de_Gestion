import React from 'react';
import { usePermission } from '../hooks/usePermission';

/**
 * Componente que renderiza contenido solo si el usuario tiene el permiso especificado
 */
interface PermissionGateProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const hasPermission = usePermission(permission);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

/**
 * Mapping de permisos a menú items
 * Usado para filtrar el menú lateral según los permisos del usuario
 */
export const menuPermissionMap: Record<string, string> = {
  // Averias
  'Dashboard Averias': 'averias.dashboard',
  'Crear Averia': 'averias.crear',
  'Listado Averias': 'averias.listado',
  'Cerrar Averias': 'averias.cerrar',

  // Banco
  'Dashboard Banco': 'banco.dashboard',
  'Gestión de Bancos': 'banco.gestion',

  // Cajas
  'Dashboard Cajas': 'cajas.dashboard',
  'Apertura & Cierre': 'cajas.apertura_cierre',
  'Listado Cajas': 'cajas.listado',
  'Configuración': 'cajas.configuracion',

  // Clientes
  'Dashboard Clientes': 'clientes.dashboard',
  'Crear Clientes': 'clientes.crear',
  'Equipos & Servicios': 'clientes.equipos_servicios',
  'Listado Clientes': 'clientes.listado',
  'Listado Inactivos': 'clientes.inactivos',
  'Suscripciones': 'clientes.suscripciones',

  // Contabilidad
  'Dash. Contabilidad': 'contabilidad.dashboard',
  'Categorias Cuentas': 'contabilidad.categorias_cuentas',
  'Cuentas Contables': 'contabilidad.cuentas_contables',
  'CXP': 'contabilidad.cxp',
  'Ingresos & Gastos': 'contabilidad.ingresos_gastos',
  'Cuentas por Pagar': 'contabilidad.cxp',
  'Traspasos': 'contabilidad.traspasos',

  // Facturas
  'Dashboard Facturas': 'facturas.dashboard',
  'Crear Facturas': 'facturas.crear',
  'Facturas Anuladas': 'facturas.anuladas',
  'Facturas Pendientes': 'facturas.pendientes',
  'Pagar Facturas': 'facturas.pagar',
  'Facturas Pagas': 'facturas.pagas',
  'Pagos x Mes': 'facturas.pagos_mes',

  // Listados
  'Lista Ingresos': 'listados.ingresos',
  'Lista Gastos': 'listados.gastos',

  // Papelería
  'Dashboard Papeleria': 'papeleria.dashboard',
  'Papeleria': 'papeleria.papeleria',
  'Clientes': 'papeleria.clientes',
  'Productos': 'papeleria.productos',
  'Categorias': 'papeleria.categorias',
  'Listado Papeleria': 'papeleria.listado',

  // Base de Datos
  'Crear Backup': 'base_datos.backup_crear',
  'Listado de Backups': 'base_datos.backup_listado',

  // Chat
  'Chat': 'chat.acceso',

  // Calendario
  'Calendario': 'calendario.acceso',

  // RRHH
  'Empleados': 'rrhh.empleados',
  'Nómina': 'rrhh.nomina',
  'Préstamos': 'rrhh.prestamos',
  'Comisiones': 'rrhh.comisiones',

  // Servicios
  'Categorias Servicios': 'servicios.categorias',
  'Servicios': 'servicios.servicios',
  'Planes': 'servicios.planes',

  // Sistema
  'Permisos': 'sistema.permisos',
  'Info': 'sistema.info',

  // Usuarios
  'Usuarios': 'usuarios.usuarios',
  'Roles': 'usuarios.roles',
  'Bitácora': 'usuarios.bitacora',
};

/**
 * Obtiene el permiso requerido para un item del menú
 * @param itemName - Nombre del item (ej: 'Crear Clientes')
 * @returns Nombre del permiso o undefined si no está mapeado
 */
export const getPermissionForMenuItem = (itemName: string): string | undefined => {
  return menuPermissionMap[itemName];
};
