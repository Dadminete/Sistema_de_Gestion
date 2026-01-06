import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Dashboard from './Dashboard';
import Users from './Users';
import PermisosUsuario from './PermisosUsuario';
import Roles from './Roles';
import Permisos from './Permisos';
import Bitacora from './Bitacora';
import SessionHistory from './SessionHistory';
import Info from './Info';
import Login from './Login';
import LockScreen from './LockScreen';
import NewCalendar from './NewCalendar'; // Import the new Calendario component
import Chat from './Chat/Chat'; // Import the new Chat component
import Categorias from './Categorias'; // Import the new Categorias component
import Servicios from './Servicios'; // Import the new Servicios component
import Planes from './Planes'; // Import the new Planes component
import ClientsDashboard from './ClientsDashboard'; // Import the new ClientsDashboard component
import ClientesListado from './ClientesListado'; // Import the new ClientesListado component
import ClienteNuevo from './ClienteNuevo'; // Import the new ClienteNuevo component
import ClientesEquiposServicios from './ClientesEquiposServicios'; // Import the new ClientesEquiposServicios component
import ClientesInactivos from './ClientesInactivos'; // Import the new ClientesInactivos component
import Suscripciones from './Suscripciones'; // Import the new Suscripciones component
import TareasListado from './TareasListado';
import EventosListado from './EventosListado';

import ProductosPapeleria from './ProductosPapeleria';
import ClientesPapeleria from './ClientesPapeleria';
import DashboardPapeleria from './DashboardPapeleria';
import Papeleria from './Papeleria';
import ListadoPapeleria from './ListadoPapeleria';
import CategoriasPapeleria from './CategoriasPapeleria'; // Import the new CategoriasPapeleria component
import IngresosGastos from './IngresosGastos'; // Import the new IngresosGastos component
import CategoriasCuentas from './CategoriasCuentas';
import CuentasContables from './CuentasContables';
import CuentasPorCobrar from './CuentasPorCobrar';
import CuentasPorPagar from './CuentasPorPagar';
import Traspasos from './Traspasos';
import Banks from './Banks';
import BanksDashboard from './BanksDashboard';
import BankDetail from './BankDetail';
import '../App.css';
import ListaIngresos from './Listados/ListaIngresos';
import ListaGastos from './Listados/ListaGastos';
import AveriasCrear from './AveriasCrear';
import AveriasListar from './AveriasListar';
import AveriasDetalle from './AveriasDetalle';
import AveriasEditar from './AveriasEditar';
import AveriasCerrar from './AveriasCerrar';
import AveriasDashboard from './AveriasDashboard';
import CajasDashboard from './CajasDashboard';
import AperturaCierre from './AperturaCierre';
import ListadoCajas from './ListadoCajas';
import ConfiguracionCaja from './ConfiguracionCaja';
import CrearBackup from './CrearBackup';
import ListadoBackups from './ListadoBackups';
import FacturasDashboard from './FacturasDashboard';
import FacturasCrear from './FacturasCrear';
import FacturasPendientes from './FacturasPendientes';
import FacturasPagar from './FacturasPagar';
import FacturasPagas from './FacturasPagas';
import FacturasParciales from './FacturasParciales';
import FacturasAnuladas from './FacturasAnuladas';
import FacturasPagosMes from './FacturasPagosMes';
import FacturaDetalle from './FacturaDetalle';
import HRDashboard from './HR/HRDashboard';
import EmployeesList from './HR/Employees/EmployeesList';
import PayrollPage from './HR/Payroll/PayrollPage';
import LoansPage from './HR/Loans/LoansPage';
import CommissionsPage from './HR/Commissions/CommissionsPage';
import UserProfile from './UserProfile';
// import VacacionesDashboard from './rrhh/vacaciones/VacacionesDashboard'; // Temporarily disabled

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App" style={{ display: 'block', height: '100vh', position: 'relative', zIndex: 1 }}> {/* Modified temporary style for debugging */}
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/lock-screen" element={<LockScreen />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout><UserProfile /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredPermission="usuarios.gestionar">
                <Layout><Users /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:usuarioId/permisos"
            element={
              <ProtectedRoute requiredPermission="usuarios.gestionar">
                <Layout><PermisosUsuario /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute requiredPermission="usuarios.roles">
                <Layout><Roles /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/permissions"
            element={
              <ProtectedRoute requiredPermission="sistema.permisos">
                <Layout><Permisos /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bitacora"
            element={
              <ProtectedRoute requiredPermission="usuarios.bitacora">
                <Layout><Bitacora /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute requiredPermission="usuarios.gestionar">
                <Layout><SessionHistory /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categorias"
            element={
              <ProtectedRoute requiredPermission="servicios.categorias">
                <Layout><Categorias /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicios"
            element={
              <ProtectedRoute requiredPermission="servicios.listado">
                <Layout><Servicios /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/planes"
            element={
              <ProtectedRoute requiredPermission="servicios.planes">
                <Layout><Planes /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/info"
            element={
              <ProtectedRoute>
                <Layout><Info /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/dashboard"
            element={
              <ProtectedRoute requiredPermission="gestionar_clientes">
                <Layout><ClientsDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/new"
            element={
              <ProtectedRoute requiredPermission="gestionar_clientes">
                <Layout><ClienteNuevo /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/list"
            element={
              <ProtectedRoute requiredPermission="gestionar_clientes">
                <Layout><ClientesListado /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/equipos-servicios"
            element={
              <ProtectedRoute requiredPermission="gestionar_clientes">
                <Layout><ClientesEquiposServicios /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/suscripciones"
            element={
              <ProtectedRoute requiredPermission="gestionar_clientes">
                <Layout><Suscripciones /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/inactivos"
            element={
              <ProtectedRoute requiredPermission="gestionar_clientes">
                <Layout><ClientesInactivos /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/averias/dashboard"
            element={
              <ProtectedRoute>
                <Layout><AveriasDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/averias/crear"
            element={
              <ProtectedRoute>
                <Layout><AveriasCrear /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/averias"
            element={
              <ProtectedRoute>
                <Layout><AveriasListar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/averias/:id"
            element={
              <ProtectedRoute>
                <Layout><AveriasDetalle /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/averias/:id/editar"
            element={
              <ProtectedRoute>
                <Layout><AveriasEditar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/averias/cerrar"
            element={
              <ProtectedRoute>
                <Layout><AveriasCerrar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/averias/cerrar/:id"
            element={
              <ProtectedRoute>
                <Layout><AveriasCerrar /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendario"
            element={
              <ProtectedRoute>
                <Layout><NewCalendar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario/tareas"
            element={
              <ProtectedRoute>
                <Layout><TareasListado /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario/eventos"
            element={
              <ProtectedRoute>
                <Layout><EventosListado /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout><Chat /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Papeleria Routes */}
          <Route
            path="/papeleria/dashboard"
            element={<ProtectedRoute><Layout><DashboardPapeleria /></Layout></ProtectedRoute>}
          />
          <Route
            path="/papeleria"
            element={<ProtectedRoute><Layout><Papeleria /></Layout></ProtectedRoute>}
          />
          <Route
            path="/papeleria/clientes"
            element={<ProtectedRoute><Layout><ClientesPapeleria /></Layout></ProtectedRoute>}
          />
          <Route
            path="/papeleria/productos"
            element={<ProtectedRoute><Layout><ProductosPapeleria /></Layout></ProtectedRoute>}
          />
          <Route
            path="/papeleria/categorias"
            element={
              <ProtectedRoute requiredPermission="gestionar_categorias_papeleria">
                <Layout><CategoriasPapeleria /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/papeleria/listado"
            element={<ProtectedRoute><Layout><ListadoPapeleria /></Layout></ProtectedRoute>}
          />
          {/* Listados Routes */}
          <Route
            path="/listados/ingresos"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad">
                <Layout><ListaIngresos /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/listados/gastos"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad">
                <Layout><ListaGastos /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/ingresos-gastos"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad"> {/* Assuming a permission for accounting management */}
                <Layout><IngresosGastos /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/categorias-cuentas"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad"> {/* Assuming a permission for accounting management */}
                <Layout><CategoriasCuentas /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/cuentas-contables"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad">
                <Layout><CuentasContables /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/cuentas-por-cobrar"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad">
                <Layout><CuentasPorCobrar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/cuentas-por-pagar"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad">
                <Layout><CuentasPorPagar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/traspasos"
            element={
              <ProtectedRoute requiredPermission="gestionar_contabilidad">
                <Layout><Traspasos /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Bank Routes */}
          <Route
            path="/banks/dashboard"
            element={
              <ProtectedRoute>
                <Layout><BanksDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/banks/management"
            element={
              <ProtectedRoute>
                <Layout><Banks /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/banks"
            element={
              <ProtectedRoute>
                <Layout><BanksDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/banks/:bankId"
            element={
              <ProtectedRoute>
                <Layout><BankDetail /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Cajas Chicas Routes */}
          <Route
            path="/cajas/dashboard"
            element={
              <ProtectedRoute>
                <Layout><CajasDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cajas/apertura-cierre"
            element={
              <ProtectedRoute>
                <Layout><AperturaCierre /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cajas/listado"
            element={
              <ProtectedRoute>
                <Layout><ListadoCajas /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cajas/configuracion"
            element={
              <ProtectedRoute>
                <Layout><ConfiguracionCaja /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Database Backup Routes */}
          <Route
            path="/database/create-backup"
            element={
              <ProtectedRoute requiredPermission="gestionar_backups">
                <Layout><CrearBackup /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/database/list-backups"
            element={
              <ProtectedRoute requiredPermission="gestionar_backups">
                <Layout><ListadoBackups /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Facturas Routes */}
          <Route
            path="/facturas/dashboard"
            element={
              <ProtectedRoute>
                <Layout><FacturasDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/crear"
            element={
              <ProtectedRoute>
                <Layout><FacturasCrear /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/pendientes"
            element={
              <ProtectedRoute>
                <Layout><FacturasPendientes /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/:id"
            element={
              <ProtectedRoute>
                <Layout><FacturaDetalle /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/pagar"
            element={
              <ProtectedRoute>
                <Layout><FacturasPagar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/pagas"
            element={
              <ProtectedRoute>
                <Layout><FacturasPagas /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/parciales"
            element={
              <ProtectedRoute>
                <Layout><FacturasParciales /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/anuladas"
            element={
              <ProtectedRoute>
                <Layout><FacturasAnuladas /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/pagos-mes"
            element={
              <ProtectedRoute>
                <Layout><FacturasPagosMes /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/facturas/pagos-mes"
            element={
              <ProtectedRoute>
                <Layout><FacturasPagosMes /></Layout>
              </ProtectedRoute>
            }
          />

          {/* HR Routes */}
          <Route
            path="/rrhh/dashboard"
            element={
              <ProtectedRoute>
                <Layout><HRDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/empleados"
            element={
              <ProtectedRoute>
                <Layout><EmployeesList /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/nomina"
            element={
              <ProtectedRoute>
                <Layout><PayrollPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/prestamos"
            element={
              <ProtectedRoute>
                <Layout><LoansPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/comisiones"
            element={
              <ProtectedRoute>
                <Layout><CommissionsPage /></Layout>
              </ProtectedRoute>
            }
          />
          {/* Temporarily disabled - VacacionesDashboard file removed
          <Route
            path="/rrhh/vacaciones"
            element={
              <ProtectedRoute>
                <Layout><VacacionesDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes >
      </div >
    </AuthProvider >
  );
}

export default App;
