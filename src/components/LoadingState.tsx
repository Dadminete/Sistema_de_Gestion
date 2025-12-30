import React from 'react';
import { Loader, Clock, AlertTriangle } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  showTimeout?: boolean;
  onCancel?: () => void;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Cargando...',
  submessage = 'Por favor espera mientras se procesan los datos',
  showTimeout = false,
  onCancel
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      backgroundColor: 'var(--colors-background-paper)',
      borderRadius: '8px',
      border: '1px solid var(--colors-divider)',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      <div style={{
        position: 'relative',
        marginBottom: '20px'
      }}>
        <Loader 
          size={48} 
          color="var(--primary-color)" 
          style={{ 
            animation: 'spin 1s linear infinite' 
          }} 
        />
        
        {showTimeout && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#f39c12',
            borderRadius: '50%',
            padding: '4px'
          }}>
            <Clock size={16} color="white" />
          </div>
        )}
      </div>
      
      <h3 style={{
        margin: '0 0 8px 0',
        color: 'var(--colors-text-primary)',
        fontSize: '18px'
      }}>
        {message}
      </h3>
      
      <p style={{
        margin: '0 0 20px 0',
        color: 'var(--colors-text-secondary)',
        fontSize: '14px',
        maxWidth: '400px'
      }}>
        {submessage}
      </p>
      
      {showTimeout && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '12px 16px',
          borderRadius: '6px',
          border: '1px solid #ffeaa7',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          <span>La carga está tomando más tiempo del esperado</span>
        </div>
      )}
      
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: 'var(--colors-text-secondary)',
            border: '1px solid var(--colors-divider)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancelar
        </button>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Componente para páginas que están cargando datos
export const PageLoadingWrapper: React.FC<{
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
}> = ({ loading, error, onRetry, children, loadingMessage }) => {
  const [showTimeout, setShowTimeout] = React.useState(false);
  
  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
      }, 10000); // Mostrar advertencia después de 10 segundos
      
      return () => {
        clearTimeout(timer);
        setShowTimeout(false);
      };
    }
  }, [loading]);
  
  if (loading) {
    return (
      <LoadingState 
        message={loadingMessage || 'Cargando datos...'}
        showTimeout={showTimeout}
        onCancel={showTimeout ? onRetry : undefined}
      />
    );
  }
  
  if (error) {
    const { ConnectionError } = require('./ConnectionError');
    return (
      <ConnectionError 
        error={error} 
        onRetry={onRetry}
      />
    );
  }
  
  return <>{children}</>;
};

export default LoadingState;