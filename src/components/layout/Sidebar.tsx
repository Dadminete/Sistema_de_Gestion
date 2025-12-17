import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBanks } from '../../services/bankService';
import type { Bank } from '../../services/bankService';
import { useAuth } from '../../context/AuthProvider';
import './Sidebar.css';

// Define types for menu items
interface SubMenuItem {
  name: string;
  path?: string;
  permission?: string; // Optional permission required to see this item
}

interface MenuItem {
  name: string;
  icon: string;
  path?: string;
  submenu?: SubMenuItem[];
  permission?: string; // Optional permission required to see this item
}

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoaded, setBanksLoaded] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const sidebarNavRef = React.useRef<HTMLDivElement>(null);
  const menuItemRefs = React.useRef<{ [key: string]: HTMLLIElement | null }>({});

  // Helper function to check permission
  const hasPermission = (permission: string): boolean => {
    // For checking any permission, we need to check against user's permissions directly
    // Admin sees everything
    if (user?.roles?.includes('Administrador')) {
      return true;
    }

    // No permission requirement = show always
    if (!permission) {
      return true;
    }

    // Check against user permissions
    return user?.permissions?.some(p => p === permission) ?? false;
  };

  // Debug: Log user and permissions on mount
  useEffect(() => {
    console.log('🔍 Sidebar - User:', user);
    console.log('🔍 Sidebar - User roles:', user?.roles);
    console.log('🔍 Sidebar - User permissions:', user?.permissions);
  }, [user]);

  useEffect(() => {
    // Fetch banks for dynamic menu only if user is authenticated and not already loaded
    const fetchBanks = async () => {
      // Skip if already loaded or no token
      if (banksLoaded) return;

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) return;

      // Check cache first (valid for 5 minutes)
      const cachedBanks = localStorage.getItem('sidebar_banks_cache');
      const cacheTimestamp = localStorage.getItem('sidebar_banks_timestamp');

      if (cachedBanks && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const cacheValidTime = 5 * 60 * 1000; // 5 minutes

        if (cacheAge < cacheValidTime) {
          try {
            const parsedBanks = JSON.parse(cachedBanks);
            setBanks(parsedBanks);
            setBanksLoaded(true);
            return;
          } catch {
            // Invalid cache, continue to fetch
          }
        }
      }

      try {
        const banksData = await getBanks();
        setBanks(banksData);
        setBanksLoaded(true);

        // Cache the result
        localStorage.setItem('sidebar_banks_cache', JSON.stringify(banksData));
        localStorage.setItem('sidebar_banks_timestamp', Date.now().toString());
      } catch (error) {
        console.error('Error fetching banks for sidebar:', error);
        // Don't show error to user, just don't load banks
      }
    };

    fetchBanks();
  }, [banksLoaded]);

  useEffect(() => {
    // Function to check if a submenu should be open based on the current path
    const checkAndOpenSubmenus = () => {
      const newOpenSubmenus: { [key: string]: boolean } = {};
      [...getMenuItems(), ...secondaryMenuItems].forEach(item => {
        if (item.submenu) {
          const isActiveSubmenu = item.submenu.some(subItem => subItem.path === location.pathname);
          if (isActiveSubmenu) {
            newOpenSubmenus[item.name] = true;
          }
        }
      });
      setOpenSubmenus(newOpenSubmenus);

      // Scroll the active submenu into view if it was just opened by path change
      const activeParentMenuItem = [...getMenuItems(), ...secondaryMenuItems].find(item =>
        item.submenu?.some(subItem => subItem.path === location.pathname)
      );
      if (activeParentMenuItem && menuItemRefs.current[activeParentMenuItem.name]) {
        setTimeout(() => {
          const menuItemElement = menuItemRefs.current[activeParentMenuItem.name];
          if (menuItemElement) {
            menuItemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    };

    checkAndOpenSubmenus();
  }, [location.pathname, banks]); // Re-run when the path changes or banks are loaded

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus(prev => {
      const newState = { ...prev, [name]: !prev[name] };
      // If the submenu is being opened, scroll it into view
      if (newState[name] && menuItemRefs.current[name]) {
        // Use a single, slightly longer timeout to ensure the DOM has updated before scrolling
        setTimeout(() => {
          const menuItemElement = menuItemRefs.current[name];
          const sidebarNavElement = sidebarNavRef.current;

          if (menuItemElement && sidebarNavElement) {
            // First, scroll the parent menu item into view
            menuItemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Then, after a short delay, check the submenu's visibility and adjust
            setTimeout(() => {
              const submenuElement = menuItemElement.querySelector('.submenu') as HTMLElement | null;
              if (submenuElement) {
                const submenuRect = submenuElement.getBoundingClientRect();
                const navRect = sidebarNavElement.getBoundingClientRect();

                // If the bottom of the submenu is below the bottom of the nav, scroll down
                if (submenuRect.bottom > navRect.bottom) {
                  sidebarNavElement.scrollBy({
                    top: submenuRect.bottom - navRect.bottom + 10, // Add a small buffer
                    behavior: 'smooth',
                  });
                }
                // If the top of the submenu is above the top of the nav, scroll up
                else if (submenuRect.top < navRect.top) {
                  sidebarNavElement.scrollBy({
                    top: submenuRect.top - navRect.top - 10, // Add a small buffer
                    behavior: 'smooth',
                  });
                }
              }
            }, 150); // Slightly longer timeout for the second check
          }
        }, 250); // Increased timeout to allow DOM to render and submenu to expand fully
      }
      return newState;
    });
  };

  const isActive = (path?: string) => {
    return path === location.pathname;
  };

  const getMenuItems = (): MenuItem[] => [
    { name: 'Dashboard', icon: 'dashboard', path: '/', permission: 'dashboard.ver' },
    {
      name: 'Averias',
      icon: 'build',
      permission: 'averias.acceso',
      submenu: [
        { name: 'Dashboard Averias', path: '/averias/dashboard', permission: 'averias.dashboard' },
        { name: 'Crear Averia', path: '/averias/crear', permission: 'averias.crear' },
        { name: 'Listado Averias', path: '/averias', permission: 'averias.listado' },
        { name: 'Cerrar Averias', path: '/averias/cerrar', permission: 'averias.cerrar' },
      ],
    },
    {
      name: 'Banco',
      icon: 'account_balance',
      permission: 'banco.acceso',
      submenu: [
        { name: 'Dashboard Banco', path: '/banks/dashboard', permission: 'banco.dashboard' },
        { name: 'Gestión de Bancos', path: '/banks/management', permission: 'banco.gestionar' },
        ...banks.map(bank => ({
          name: bank.nombre,
          path: `/banks/${bank.id}`,
          permission: 'banco.ver' // Generic permission for viewing bank details
        }))
      ],
    },
    {
      name: 'Cajas Chicas',
      icon: 'all_inbox',
      permission: 'cajas.acceso',
      submenu: [
        { name: 'Dashboard Cajas', path: '/cajas/dashboard', permission: 'cajas.dashboard' },
        { name: 'Apertura & Cierre', path: '/cajas/apertura-cierre', permission: 'cajas.apertura_cierre' },
        { name: 'Listado Cajas', path: '/cajas/listado', permission: 'cajas.listado' },
        { name: 'Configuración', path: '/cajas/configuracion', permission: 'cajas.configurar' },
      ],
    },
    {
      name: 'Clientes',
      icon: 'people',
      permission: 'clientes.acceso',
      submenu: [
        { name: 'Dashboard Clientes', path: '/clients/dashboard', permission: 'clientes.dashboard' },
        { name: 'Crear Clientes', path: '/clients/new', permission: 'clientes.crear' },
        { name: 'Equipos & Servicios', path: '/clients/equipos-servicios', permission: 'clientes.equipos_servicios' },
        { name: 'Listado Clientes', path: '/clients/list', permission: 'clientes.listado' },
        { name: 'Listado Inactivos', path: '/clients/inactivos', permission: 'clientes.inactivos' },
        { name: 'Suscripciones', path: '/clients/suscripciones', permission: 'clientes.suscripciones' },
      ],
    },
    {
      name: 'Contabilidad',
      icon: 'assessment',
      permission: 'contabilidad.acceso',
      submenu: [
        { name: 'Dash. Contabilidad', path: '#', permission: 'contabilidad.dashboard' },
        { name: 'Categorias Cuentas', path: '/contabilidad/categorias-cuentas', permission: 'contabilidad.categorias' },
        { name: 'Cuentas Contables', path: '/contabilidad/cuentas-contables', permission: 'contabilidad.cuentas' },
        { name: 'Cuentas por Cobrar', path: '/contabilidad/cuentas-por-cobrar', permission: 'contabilidad.cxc' },
        { name: 'Ingresos & Gastos', path: '/contabilidad/ingresos-gastos', permission: 'contabilidad.ingresos_gastos' },
        { name: 'Cuentas por Pagar', path: '/contabilidad/cuentas-por-pagar', permission: 'contabilidad.cxp' },
        { name: 'Traspasos', path: '/contabilidad/traspasos', permission: 'contabilidad.traspasos' },
      ],
    },
    {
      name: 'Facturas',
      icon: 'receipt',
      permission: 'facturas.acceso',
      submenu: [
        { name: 'Dashboard Facturas', path: '/facturas/dashboard', permission: 'facturas.dashboard' },
        { name: 'Crear Facturas', path: '/facturas/crear', permission: 'facturas.crear' },
        { name: 'Pagar Facturas', path: '/facturas/pagar', permission: 'facturas.pagar' },
        { name: 'Facturas Anuladas', path: '/facturas/anuladas', permission: 'facturas.anuladas' },
        { name: 'Facturas Pendientes', path: '/facturas/pendientes', permission: 'facturas.pendientes' },
        { name: 'Facturas Pagas', path: '/facturas/pagas', permission: 'facturas.pagas' },
        { name: 'Pagos Parciales', path: '/facturas/parciales', permission: 'facturas.parciales' },
        { name: 'Pagos x Mes', path: '/facturas/pagos-mes', permission: 'facturas.pagos_mes' },
      ],
    },
    {
      name: 'Listados',
      icon: 'list_alt',
      permission: 'listados.acceso',
      submenu: [
        { name: 'Lista Ingresos', path: '/listados/ingresos', permission: 'listados.ingresos' },
        { name: 'Lista Gastos', path: '/listados/gastos', permission: 'listados.gastos' },
      ],
    },
    {
      name: 'Papeleria',
      icon: 'folder',
      permission: 'papeleria.acceso',
      submenu: [
        { name: 'Dashboard Papeleria', path: '/papeleria/dashboard', permission: 'papeleria.dashboard' },
        { name: 'Papeleria', path: '/papeleria', permission: 'papeleria.listado' },
        { name: 'Clientes', path: '/papeleria/clientes', permission: 'papeleria.clientes' },
        { name: 'Productos', path: '/papeleria/productos', permission: 'papeleria.productos' },
        { name: 'Categorias', path: '/papeleria/categorias', permission: 'papeleria.categorias' },
        { name: 'Listado Papeleria', path: '/papeleria/listado', permission: 'papeleria.listado' },
      ],
    },
  ];

  const secondaryMenuItems: MenuItem[] = [
    { name: 'Area Tecnica', icon: 'computer', path: '#', permission: 'area_tecnica.acceso' },
    {
      name: 'Base de Datos',
      icon: 'storage',
      permission: 'base_datos.acceso',
      submenu: [
        { name: 'Crear Backup', path: '/database/create-backup', permission: 'base_datos.crear_backup' },
        { name: 'Listado de Backups', path: '/database/list-backups', permission: 'base_datos.ver_backups' },
      ],
    },
    { name: 'Chat', icon: 'chat', path: '/chat', permission: 'chat.acceso' },
    {
      name: 'Calendario',
      icon: 'event',
      permission: 'calendario.acceso',
      submenu: [
        { name: 'Calendario', path: '/calendario', permission: 'calendario.acceso' },
        { name: 'Eventos', path: '/calendario/eventos', permission: 'calendario.acceso' },
        { name: 'Tareas', path: '/calendario/tareas', permission: 'calendario.acceso' },
      ],
    },
    { name: 'Equipos', icon: 'devices', path: '#', permission: 'equipos.acceso' },
    { name: 'Herramientas', icon: 'build_circle', path: '#', permission: 'herramientas.acceso' },
    {
      name: 'RR.HH.',
      icon: 'group_work',
      permission: 'rrhh.acceso',
      submenu: [
        { name: 'Dashboard RR.HH.', path: '/rrhh/dashboard', permission: 'rrhh.dashboard' },
        { name: 'Empleados', path: '/rrhh/empleados', permission: 'rrhh.empleados' },
        { name: 'Nómina', path: '/rrhh/nomina', permission: 'rrhh.nomina' },
        { name: 'Préstamos', path: '/rrhh/prestamos', permission: 'rrhh.prestamos' },
        { name: 'Comisiones', path: '/rrhh/comisiones', permission: 'rrhh.comisiones' },
        { name: 'Vacaciones', path: '/rrhh/vacaciones', permission: 'rrhh.vacaciones' },
      ],
    },
    {
      name: 'Servicios',
      icon: 'miscellaneous_services',
      permission: 'servicios.acceso',
      submenu: [
        { name: 'Categorias', path: '/categorias', permission: 'servicios.categorias' },
        { name: 'Servicios', path: '/servicios', permission: 'servicios.listado' },
        { name: 'Planes', path: '/planes', permission: 'servicios.planes' },
      ],
    },
    {
      name: 'Sistema',
      icon: 'settings_system_daydream',
      permission: 'sistema.acceso',
      submenu: [
        { name: 'Permisos', path: '/permissions', permission: 'sistema.permisos' },
        { name: 'Info', path: '/info', permission: 'sistema.info' },
      ],
    },
    {
      name: 'Usuarios',
      icon: 'manage_accounts',
      permission: 'usuarios.acceso',
      submenu: [
        { name: 'Bitácora', path: '/bitacora', permission: 'usuarios.bitacora' },
        { name: 'Historial Sesiones', path: '/sessions', permission: 'usuarios.gestionar' },
        { name: 'Permisos', path: '/permissions', permission: 'usuarios.permisos' },
        { name: 'Roles', path: '/roles', permission: 'usuarios.roles' },
        { name: 'Usuarios', path: '/users', permission: 'usuarios.gestionar' },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem) => {
    // TEMPORARY: If user is Admin, show everything
    const isAdmin = user?.roles?.includes('Administrador');

    // Helper: check if user should see item
    // If no permission required, show it
    // If permission required, only show if user has it OR is Admin
    const shouldShowItem = (permission?: string): boolean => {
      // Admin sees everything
      if (isAdmin) {
        return true;
      }

      // No permission requirement = show always
      if (!permission) {
        return true;
      }

      // Has permission requirement = check it
      return hasPermission(permission);
    };

    // For items with submenu:
    // - Check if ANY submenu item is visible (if so, show parent even if parent permission fails)
    // For items without submenu:
    // - Check the item permission directly

    let visibleSubmenu = item.submenu;
    if (item.submenu) {
      visibleSubmenu = item.submenu.filter(subItem => {
        return shouldShowItem(subItem.permission);
      });

      // If no visible submenu items, don't show the parent menu
      if (visibleSubmenu.length === 0) {
        return null;
      }
      // If we have visible submenu items, show the parent regardless of parent permission
      // (parent permission only acts as override if explicitly set)
    } else {
      // No submenu - check parent permission directly
      if (!shouldShowItem(item.permission)) {
        return null;
      }
    }

    const activeClass = isActive(item.path) ? 'active' : '';
    const hasSubmenuClass = visibleSubmenu ? 'has-submenu' : '';
    const openSubmenuClass = openSubmenus[item.name] ? 'open' : '';

    return (
      <li
        key={item.name}
        ref={el => {
          menuItemRefs.current[item.name] = el;
        }}
        className={`${hasSubmenuClass} ${openSubmenuClass}`}
      >
        <Link
          to={item.path || '#'}
          className={`sidebar-nav-item ${activeClass}`}
          onClick={(e) => {
            if (visibleSubmenu) {
              e.preventDefault();
              toggleSubmenu(item.name);
            }
          }}
        >
          <span className="material-icons">{item.icon}</span>
          {!isCollapsed && <span>{item.name}</span>}
          {!isCollapsed && visibleSubmenu && <span className="material-icons submenu-arrow">{openSubmenus[item.name] ? 'expand_less' : 'expand_more'}</span>}
        </Link>
        {!isCollapsed && visibleSubmenu && openSubmenus[item.name] && (
          <ul className="submenu">
            {visibleSubmenu.map((subItem) => (
              <li key={subItem.name}>
                <Link to={subItem.path || '#'} className={`sidebar-nav-item ${isActive(subItem.path) ? 'active' : ''}`}>
                  <span>{subItem.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <span className="material-icons logo-icon">album</span>
        {!isCollapsed && <h1>TECNOLOGICA</h1>}
      </div>

      <nav ref={sidebarNavRef} className="sidebar-nav">
        <div className="nav-section">
          <ul className="sidebar-menu">
            {getMenuItems().map(renderMenuItem)}
          </ul>
        </div>

        <div className="nav-section">
          <ul className="sidebar-menu">
            {secondaryMenuItems.map(renderMenuItem)}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <Link to="#" className="sidebar-nav-item"><span className="material-icons">settings</span></Link>
        <Link to="#" className="sidebar-nav-item"><span className="material-icons">help_outline</span></Link>
        <Link to="#" className="sidebar-nav-item"><span className="material-icons">power_settings_new</span></Link>
      </div>
    </aside>
  );
};

export default Sidebar;
