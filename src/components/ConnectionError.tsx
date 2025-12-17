import React from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ConnectionErrorProps {
  error: Error;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ConnectionError: React.FC<ConnectionErrorProps> = ({ 
  error, 
  onRetry, 
  isRetrying = false 
}) => {
  const isTimeout = error.message.includes('Timeout') || error.message.includes('timeout');
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  
  const getErrorInfo = () => {
    if (isTimeout) {
      return {
        icon: <AlertCircle size={48} color="#f39c12" />,
        title: 'Conexión Lenta',
        message: 'La solicitud está tomando más tiempo del esperado.',
        suggestion: 'Esto puede deberse a alta carga del servidor o problemas de red.'
      };
    }
    
    if (isNetworkError) {
      return {
        icon: <WifiOff size={48} color="#e74c3c" />,
        title: 'Error de Conexión',
        message: 'No se pudo conectar con el servidor.',
        suggestion: 'Verifica tu conexión a internet o que el servidor esté funcionando.'
      };
    }
    
    return {
      icon: <AlertCircle size={48} color="#e74c3c" />,
      title: 'Error del Servidor',
      message: error.message,
      suggestion: 'Intenta nuevamente en unos momentos.'
    };
  };
  
  const errorInfo = getErrorInfo();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'var(--colors-background-paper)',
      borderRadius: '8px',
      border: '1px solid var(--colors-divider)',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      {errorInfo.icon}
      
      <h3 style={{
        margin: '16px 0 8px 0',
        color: 'var(--colors-text-primary)',
        fontSize: '18px'
      }}>
        {errorInfo.title}
      </h3>
      
      <p style={{
        margin: '0 0 8px 0',
        color: 'var(--colors-text-secondary)',
        fontSize: '14px'
      }}>
        {errorInfo.message}
      </p>
      
      <small style={{
        color: 'var(--colors-text-secondary)',
        fontSize: '12px',
        marginBottom: '20px',
        display: 'block'
      }}>
        {errorInfo.suggestion}
      </small>
      
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: isRetrying ? 'var(--colors-divider)' : 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
        >
          <RefreshCw 
            size={16} 
            style={{ 
              animation: isRetrying ? 'spin 1s linear infinite' : 'none' 
            }} 
          />
          {isRetrying ? 'Reintentando...' : 'Reintentar'}
        </button>
      )}
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Hook para manejar estados de carga con reintentos
export const useApiRequest = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const executeRequest = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [...dependencies, retryCount]);

  React.useEffect(() => {
    executeRequest();
  }, [executeRequest]);

  const retry = () => {
    setRetryCount(prev => prev + 1);
  };

  return { data, loading, error, retry };
};

export default ConnectionError;