import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import ProtectedLayout from '../components/auth/ProtectedLayout'; // Import the new component
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
import NewCalendar from './NewCalendar';
import Chat from './Chat/Chat';
import Categorias from './Categorias';
import Servicios from './Servicios';
import Planes from './Planes';
import ClientsDashboard from './ClientsDashboard';
import ClientesListado from './ClientesListado';
import ClienteNuevo from './ClienteNuevo';
import ClientesEquiposServicios from './ClientesEquiposServicios';
import ClientesInactivos from './ClientesInactivos';
import Suscripciones from './Suscripciones';
import TareasListado from './TareasListado';
import EventosListado from './EventosListado';
import ProductosPapeleria from './ProductosPapeleria';
import ClientesPapeleria from './ClientesPapeleria';
import DashboardPapeleria from './DashboardPapeleria';
import Papeleria from './Papeleria';
import ListadoPapeleria from './ListadoPapeleria';
import CategoriasPapeleria from './CategoriasPapeleria';
import IngresosGastos from './IngresosGastos';
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
// import VacacionesDashboard from './rrhh/vacaciones/VacacionesDashboard'; // Temporarily disabled

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App" style={{ display: 'block', height: '100vh', position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/lock-screen" element={<LockScreen />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout requiredPermission="usuarios.gestionar"><Users /></ProtectedLayout>} />
          <Route path="/users/:usuarioId/permisos" element={<ProtectedLayout requiredPermission="usuarios.gestionar"><PermisosUsuario /></ProtectedLayout>} />
          <Route path="/roles" element={<ProtectedLayout requiredPermission="usuarios.roles"><Roles /></ProtectedLayout>} />
          <Route path="/permissions" element={<ProtectedLayout requiredPermission="sistema.permisos"><Permisos /></ProtectedLayout>} />
          <Route path="/bitacora" element={<ProtectedLayout requiredPermission="usuarios.bitacora"><Bitacora /></ProtectedLayout>} />
          <Route path="/sessions" element={<ProtectedLayout requiredPermission="usuarios.gestionar"><SessionHistory /></ProtectedLayout>} />
          <Route path="/categorias" element={<ProtectedLayout requiredPermission="servicios.categorias"><Categorias /></ProtectedLayout>} />
          <Route path="/servicios" element={<ProtectedLayout requiredPermission="servicios.listado"><Servicios /></ProtectedLayout>} />
          <Route path="/planes" element={<ProtectedLayout requiredPermission="servicios.planes"><Planes /></ProtectedLayout>} />
          <Route path="/info" element={<ProtectedLayout><Info /></ProtectedLayout>} />
          <Route path="/clients/dashboard" element={<ProtectedLayout requiredPermission="gestionar_clientes"><ClientsDashboard /></ProtectedLayout>} />
          <Route path="/clients/new" element={<ProtectedLayout requiredPermission="gestionar_clientes"><ClienteNuevo /></ProtectedLayout>} />
          <Route path="/clients/list" element={<ProtectedLayout requiredPermission="gestionar_clientes"><ClientesListado /></ProtectedLayout>} />
          <Route path="/clients/equipos-servicios" element={<ProtectedLayout requiredPermission="gestionar_clientes"><ClientesEquiposServicios /></ProtectedLayout>} />
          <Route path="/clients/suscripciones" element={<ProtectedLayout requiredPermission="gestionar_clientes"><Suscripciones /></ProtectedLayout>} />
          <Route path="/clients/inactivos" element={<ProtectedLayout requiredPermission="gestionar_clientes"><ClientesInactivos /></ProtectedLayout>} />
          <Route path="/averias/dashboard" element={<ProtectedLayout><AveriasDashboard /></ProtectedLayout>} />
          <Route path="/averias/crear" element={<ProtectedLayout><AveriasCrear /></ProtectedLayout>} />
          <Route path="/averias" element={<ProtectedLayout><AveriasListar /></ProtectedLayout>} />
          <Route path="/averias/:id" element={<ProtectedLayout><AveriasDetalle /></ProtectedLayout>} />
          <Route path="/averias/:id/editar" element={<ProtectedLayout><AveriasEditar /></ProtectedLayout>} />
          <Route path="/averias/cerrar" element={<ProtectedLayout><AveriasCerrar /></ProtectedLayout>} />
          <Route path="/averias/cerrar/:id" element={<ProtectedLayout><AveriasCerrar /></ProtectedLayout>} />
          <Route path="/calendario" element={<ProtectedLayout><NewCalendar /></ProtectedLayout>} />
          <Route path="/calendario/tareas" element={<ProtectedLayout><TareasListado /></ProtectedLayout>} />
          <Route path="/calendario/eventos" element={<ProtectedLayout><EventosListado /></ProtectedLayout>} />
          <Route path="/chat" element={<ProtectedLayout><Chat /></ProtectedLayout>} />

          {/* Papeleria Routes */}
          <Route path="/papeleria/dashboard" element={<ProtectedLayout><DashboardPapeleria /></ProtectedLayout>} />
          <Route path="/papeleria" element={<ProtectedLayout><Papeleria /></ProtectedLayout>} />
          <Route path="/papeleria/clientes" element={<ProtectedLayout><ClientesPapeleria /></ProtectedLayout>} />
          <Route path="/papeleria/productos" element={<ProtectedLayout><ProductosPapeleria /></ProtectedLayout>} />
          <Route path="/papeleria/categorias" element={<ProtectedLayout requiredPermission="gestionar_categorias_papeleria"><CategoriasPapeleria /></ProtectedLayout>} />
          <Route path="/papeleria/listado" element={<ProtectedLayout><ListadoPapeleria /></ProtectedLayout>} />

          {/* Listados Routes */}
          <Route path="/listados/ingresos" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><ListaIngresos /></ProtectedLayout>} />
          <Route path="/listados/gastos" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><ListaGastos /></ProtectedLayout>} />
          <Route path="/contabilidad/ingresos-gastos" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><IngresosGastos /></ProtectedLayout>} />
          <Route path="/contabilidad/categorias-cuentas" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><CategoriasCuentas /></ProtectedLayout>} />
          <Route path="/contabilidad/cuentas-contables" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><CuentasContables /></ProtectedLayout>} />
          <Route path="/contabilidad/cuentas-por-cobrar" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><CuentasPorCobrar /></ProtectedLayout>} />
          <Route path="/contabilidad/cuentas-por-pagar" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><CuentasPorPagar /></ProtectedLayout>} />
          <Route path="/contabilidad/traspasos" element={<ProtectedLayout requiredPermission="gestionar_contabilidad"><Traspasos /></ProtectedLayout>} />

          {/* Bank Routes */}
          <Route path="/banks/dashboard" element={<ProtectedLayout><BanksDashboard /></ProtectedLayout>} />
          <Route path="/banks/management" element={<ProtectedLayout><Banks /></ProtectedLayout>} />
          <Route path="/banks" element={<ProtectedLayout><BanksDashboard /></ProtectedLayout>} />
          <Route path="/banks/:bankId" element={<ProtectedLayout><BankDetail /></ProtectedLayout>} />

          {/* Cajas Chicas Routes */}
          <Route path="/cajas/dashboard" element={<ProtectedLayout><CajasDashboard /></ProtectedLayout>} />
          <Route path="/cajas/apertura-cierre" element={<ProtectedLayout><AperturaCierre /></ProtectedLayout>} />
          <Route path="/cajas/listado" element={<ProtectedLayout><ListadoCajas /></ProtectedLayout>} />
          <Route path="/cajas/configuracion" element={<ProtectedLayout><ConfiguracionCaja /></ProtectedLayout>} />

          {/* Database Backup Routes */}
          <Route path="/database/create-backup" element={<ProtectedLayout requiredPermission="gestionar_backups"><CrearBackup /></ProtectedLayout>} />
          <Route path="/database/list-backups" element={<ProtectedLayout requiredPermission="gestionar_backups"><ListadoBackups /></ProtectedLayout>} />

          {/* Facturas Routes */}
          <Route path="/facturas/dashboard" element={<ProtectedLayout><FacturasDashboard /></ProtectedLayout>} />
          <Route path="/facturas/crear" element={<ProtectedLayout><FacturasCrear /></ProtectedLayout>} />
          <Route path="/facturas/pendientes" element={<ProtectedLayout><FacturasPendientes /></ProtectedLayout>} />
          <Route path="/facturas/:id" element={<ProtectedLayout><FacturaDetalle /></ProtectedLayout>} />
          <Route path="/facturas/pagar" element={<ProtectedLayout><FacturasPagar /></ProtectedLayout>} />
          <Route path="/facturas/pagas" element={<ProtectedLayout><FacturasPagas /></ProtectedLayout>} />
          <Route path="/facturas/parciales" element={<ProtectedLayout><FacturasParciales /></ProtectedLayout>} />
          <Route path="/facturas/anuladas" element={<ProtectedLayout><FacturasAnuladas /></ProtectedLayout>} />
          <Route path="/facturas/pagos-mes" element={<ProtectedLayout><FacturasPagosMes /></ProtectedLayout>} />

          {/* HR Routes */}
          <Route path="/rrhh/dashboard" element={<ProtectedLayout><HRDashboard /></ProtectedLayout>} />
          <Route path="/rrhh/empleados" element={<ProtectedLayout><EmployeesList /></ProtectedLayout>} />
          <Route path="/rrhh/nomina" element={<ProtectedLayout><PayrollPage /></ProtectedLayout>} />
          <Route path="/rrhh/prestamos" element={<ProtectedLayout><LoansPage /></ProtectedLayout>} />
          <Route path="/rrhh/comisiones" element={<ProtectedLayout><CommissionsPage /></ProtectedLayout>} />
          {/* Temporarily disabled - VacacionesDashboard file removed
          <Route
            path="/rrhh/vacaciones"
            element={<ProtectedLayout><VacacionesDashboard /></ProtectedLayout>}
          />
          */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes >
      </div >
    </AuthProvider >
  );
}

export default App;