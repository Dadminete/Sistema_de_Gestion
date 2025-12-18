import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import Layout from '../layout/Layout';
import './ProtectedLayout.css';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--colors-text-secondary)' }}>
          Verificando autenticación...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Layout>
        <div className="access-denied">
          <span className="material-icons">block</span>
          <h2>Acceso Denegado</h2>
          <p>
            No tienes los permisos necesarios para acceder a esta página.
            Permiso requerido: <strong>{requiredPermission}</strong>
          </p>
          <button onClick={() => window.history.back()}>
            <span className="material-icons">arrow_back</span>
            Volver
          </button>
        </div>
      </Layout>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Layout>
        <div className="access-denied">
          <span className="material-icons">block</span>
          <h2>Acceso Denegado</h2>
          <p>
            No tienes el rol necesario para acceder a esta página.
            Rol requerido: <strong>{requiredRole}</strong>
          </p>
          <button onClick={() => window.history.back()}>
            <span className="material-icons">arrow_back</span>
            Volver
          </button>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedLayout;
