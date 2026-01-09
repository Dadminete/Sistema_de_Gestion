import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Only show loading spinner for protected routes
  if (isLoading && location.pathname !== fallbackPath) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--colors-divider)',
          borderTop: '4px solid var(--colors-primary-main)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--colors-text-secondary)' }}>
          Verificando autenticación...
        </p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && location.pathname !== fallbackPath) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check for required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="access-denied" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
      }}>
        <span className="material-icons" style={{
          fontSize: '4rem',
          color: 'var(--colors-error-main)'
        }}>
          block
        </span>
        <h2 style={{ color: 'var(--colors-text-primary)', margin: 0 }}>
          Acceso Denegado
        </h2>
        <p style={{ 
          color: 'var(--colors-text-secondary)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          No tienes los permisos necesarios para acceder a esta página.
          Permiso requerido: <strong>{requiredPermission}</strong>
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--colors-primary-main)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>
    );
  }

  // Check for required role
  if (requiredRole) {
    // Si el rol empieza con '!', significa que NO debe tener ese rol
    const isNegativeRole = requiredRole.startsWith('!');
    const roleToCheck = isNegativeRole ? requiredRole.slice(1) : requiredRole;
    const userHasRole = hasRole(roleToCheck);
    
    // Si es rol negativo (!Tecnico) y el usuario tiene ese rol, bloquear
    // Si es rol positivo (Tecnico) y el usuario NO tiene ese rol, bloquear
    const shouldBlock = isNegativeRole ? userHasRole : !userHasRole;
    
    if (shouldBlock) {
      // Si es técnico intentando acceder al dashboard principal, redirigir a averías
      if (isNegativeRole && hasRole(roleToCheck)) {
        return <Navigate to="/averias/dashboard" replace />;
      }
      
      return (
        <div className="access-denied" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem'
        }}>
          <span className="material-icons" style={{
            fontSize: '4rem',
            color: 'var(--colors-error-main)'
          }}>
            block
          </span>
          <h2 style={{ color: 'var(--colors-text-primary)', margin: 0 }}>
            Acceso Denegado
          </h2>
          <p style={{ 
            color: 'var(--colors-text-secondary)',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            No tienes el rol necesario para acceder a esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--colors-primary-main)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span className="material-icons">arrow_back</span>
            Volver
          </button>
        </div>
      );
    }
  }

  // Render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
