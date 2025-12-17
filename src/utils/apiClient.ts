// Determine API base URL with smart port detection
const getAPIBaseURL = (): string => {
  // If explicit VITE_API_BASE_URL is set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL;
    return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
  }
  
  // Auto-detect: use current window hostname/IP with intelligent port detection
  try {
    const hostname = window.location.hostname;
    const currentPort = parseInt(window.location.port) || 80;
    
    // Map frontend ports to backend ports
    let backendPort;
    if (currentPort === 5174) {
      backendPort = 54116; // Primary mapping - servidor actual
    } else if (currentPort === 5173) {
      backendPort = 54116; // Secondary mapping - servidor actual
    } else {
      // Default fallback - usar puerto del servidor actual
      backendPort = 54116;
    }
    
    const protocol = window.location.protocol.replace(':', '');
    const baseURL = `${protocol}://${hostname}:${backendPort}/api`;
    
    console.log(`🔗 API URL detected: ${baseURL} (frontend port: ${currentPort})`);
    return baseURL;
  } catch (e) {
    // Fallback if something goes wrong
    console.error('Error detecting API URL:', e);
    return 'http://172.16.0.23:54116/api'; // Hardcoded fallback - puerto actual
  }
};

const API_BASE_URL = getAPIBaseURL();
console.log('✅ API_BASE_URL (auto-detected):', API_BASE_URL);

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Configuración de timeouts adaptativos según el tipo de endpoint
const getTimeout = (endpoint: string): number => {
  // Endpoints que pueden requerir más tiempo
  const slowEndpoints = ['/planes', '/eventos', '/notifications', '/clientes/equipos', '/suscripciones'];
  const isSlowEndpoint = slowEndpoints.some(slow => endpoint.includes(slow));
  
  if (isSlowEndpoint) {
    return 60000; // 60 segundos para endpoints lentos
  }
  
  return 15000; // 15 segundos para endpoints normales
};

// Sistema de reintentos
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error: any, attempt: number): boolean => {
  if (attempt >= 3) return false;
  
  // Reintentar en timeouts y errores de red
  if (error.name === 'AbortError' || 
      error.message?.includes('fetch') || 
      error.message?.includes('network') ||
      (error.status && error.status >= 500)) {
    return true;
  }
  
  return false;
};

const buildError = async (response: Response) => {
  let errorBody: any = undefined;
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      errorBody = await response.json();
    } else {
      const text = await response.text();
      errorBody = text || undefined;
    }
  } catch (_) {
    // ignore body parse errors
  }
  const serverMsg = typeof errorBody === 'string' ? errorBody : (errorBody?.message || errorBody?.error || errorBody?.detail);
  const err = new Error(`HTTP ${response.status}: ${response.statusText}${serverMsg ? ` - ${serverMsg}` : ''}`) as any;
  (err as any).status = response.status;
  (err as any).body = errorBody;
  return err;
};

const parseOkBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
  }
};

export const apiClient = {
  get: async (endpoint: string, options: { skipRetry?: boolean } = {}) => {
    const timeout = getTimeout(endpoint);
    let lastError: any;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw await buildError(response);
        }

        return parseOkBody(response);
      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error;
        
        if (error.name === 'AbortError') {
          lastError = new Error(`Timeout: La solicitud tardó más de ${timeout/1000} segundos en responder`);
        }
        
        // Si es el último intento o no debe reintentar, lanzar error
        if (options.skipRetry || !shouldRetry(lastError, attempt)) {
          break;
        }
        
        // Esperar antes del siguiente intento (backoff exponencial)
        if (attempt < 3) {
          await sleep(1000 * Math.pow(2, attempt - 1));
          console.log(`Reintentando solicitud GET ${endpoint} (intento ${attempt + 1}/3)`);
        }
      }
    }
    
    throw lastError;
  },

  post: async (endpoint: string, data?: any, options: { skipRetry?: boolean } = {}) => {
    const timeout = getTimeout(endpoint);
    let lastError: any;
    
    for (let attempt = 1; attempt <= 2; attempt++) { // Solo 2 intentos para POST para evitar duplicados
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw await buildError(response);
        }

        return parseOkBody(response);
      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error;
        
        if (error.name === 'AbortError') {
          lastError = new Error(`Timeout: La solicitud tardó más de ${timeout/1000} segundos en responder`);
        }
        
        // POST es más sensible, solo reintentar en casos específicos
        if (options.skipRetry || attempt >= 2 || 
            (lastError.status && lastError.status < 500)) {
          break;
        }
        
        if (attempt < 2) {
          await sleep(2000); // 2 segundos entre reintentos para POST
          console.log(`Reintentando solicitud POST ${endpoint} (intento ${attempt + 1}/2)`);
        }
      }
    }
    
    throw lastError;
  },

  put: async (endpoint: string, data?: any) => {
    const timeout = getTimeout(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await buildError(response);
      }

      return parseOkBody(response);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout: La solicitud tardó más de ${timeout/1000} segundos en responder`);
      }
      
      throw error;
    }
  },

  patch: async (endpoint: string, data?: any) => {
    const timeout = getTimeout(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await buildError(response);
      }

      return parseOkBody(response);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout: La solicitud tardó más de ${timeout/1000} segundos en responder`);
      }
      
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    const timeout = getTimeout(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await buildError(response);
      }

      // Handle empty or non-JSON response for delete operations
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout: La solicitud tardó más de ${timeout/1000} segundos en responder`);
      }
      
      throw error;
    }
  },
};
