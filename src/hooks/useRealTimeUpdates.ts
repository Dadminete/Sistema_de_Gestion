import { useEffect, useCallback, useRef, useState } from 'react';

interface EntityChangeEvent {
  entityType: string;
  action: 'create' | 'update' | 'delete';
  entityId: string;
  [key: string]: any;
}

interface UserConnectedEvent {
  userId: string;
  username: string;
  nombre: string;
  apellido: string;
  connectedAt: string;
}

interface UserDisconnectedEvent {
  userId: string;
  username: string;
  nombre: string;
  apellido: string;
  disconnectedAt: string;
}

interface NewMessageEvent {
  chatId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface ConnectedUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  role?: string; // Add role
  connectedAt: string;
  sessionCount: number;
}

interface ConnectedEvent {
  type: 'connected';
  id: string;
  connectedUsers: ConnectedUser[];
}

/**
 * Hook para escuchar cambios en tiempo real del servidor
 * Se conecta al endpoint /api/events vía SSE (Server-Sent Events)
 *
 * @param onEntityChange - Callback que se ejecuta cuando hay un cambio de entidad
 * @param onUserConnected - Callback que se ejecuta cuando un usuario se conecta
 * @param onUserDisconnected - Callback que se ejecuta cuando un usuario se desconecta
 * @param onConnected - Callback que se ejecuta cuando se establece la conexión inicial
 * @param entityTypes - Array de tipos de entidades para filtrar (ej: ['cliente', 'suscripcion'])
 * @param isAuthenticated - Si el usuario está autenticado (para evitar conexiones en login)
 * @returns Objeto con estado de conexión, usuarios conectados y función para desconectar
 */
export const useRealTimeUpdates = (
  onEntityChange?: (event: EntityChangeEvent) => void,
  onUserConnected?: (event: UserConnectedEvent) => void,
  onUserDisconnected?: (event: UserDisconnectedEvent) => void,
  onConnected?: (event: ConnectedEvent) => void,
  onNewMessage?: (event: NewMessageEvent) => void,
  entityTypes?: string[],
  isAuthenticated: boolean = true // Default to true for backward compatibility
) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectedUsersRef = useRef<ConnectedUser[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  // Use refs to store the latest callbacks
  const onEntityChangeRef = useRef(onEntityChange);
  const onUserConnectedRef = useRef(onUserConnected);
  const onUserDisconnectedRef = useRef(onUserDisconnected);
  const onConnectedRef = useRef(onConnected);
  const onNewMessageRef = useRef(onNewMessage);
  const entityTypesRef = useRef(entityTypes);

  useEffect(() => {
    onEntityChangeRef.current = onEntityChange;
    onUserConnectedRef.current = onUserConnected;
    onUserDisconnectedRef.current = onUserDisconnected;
    onConnectedRef.current = onConnected;
    onNewMessageRef.current = onNewMessage;
    entityTypesRef.current = entityTypes;
  }, [onEntityChange, onUserConnected, onUserDisconnected, onConnected, onNewMessage, entityTypes]);

  // Compute API base URL - use dynamic detection based on current location
  const API_BASE_URL = (() => {
    // First, try to use the environment variable if it's set
    const envUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined);
    if (envUrl && envUrl.trim()) {
      const trimmed = envUrl.replace(/\/$/, '');
      return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
    }

    // Fallback to dynamic detection based on current browser location
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol.replace(':', '');
    
    // Construct the base URL dynamically
    const baseURL = `${protocol}://${hostname}${port}/api`;
    console.log('🔧 SSE: Using dynamic API_BASE_URL:', baseURL, '(hostname:', hostname, ', port:', port, ')');
    return baseURL;
  })();

  const connect = useCallback(() => {
    // Evitar múltiples conexiones
    if (eventSourceRef.current) {
      console.log('SSE: Connection already exists, skipping');
      return;
    }

    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      console.log('SSE: Token found:', !!token, token ? token.substring(0, 20) + '...' : 'none');

      if (!token) {
        console.warn('SSE: No auth token found for SSE connection');
        return;
      }

      // Check for bad/bloated token (e.g. containing avatar) which causes 431 errors
      // Increasing limit to 15000 to allow for extensive permission lists
      if (token.length > 15000) {
        console.error('❌ SSE: Token is too large (likely contains avatar). Clearing to fix 431 error.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_data');
        
        // Force reload to reset auth state
        window.location.reload();
        return;
      }

      // Don't connect if user is not authenticated (e.g., on login page)
      if (!isAuthenticated) {
        console.log('SSE: User not authenticated, skipping connection');
        return;
      }

      // Crear la URL con el token en query parameter
      const eventUrl = `${API_BASE_URL}/events?token=${encodeURIComponent(token)}`;

      const eventSource = new EventSource(eventUrl);
      eventSourceRef.current = eventSource;

      // CRITICAL: Set up ALL event listeners BEFORE the connection fully opens
      // This ensures the 'connected' event sent immediately by the backend is captured

      // 1. Handle 'connected' event (sent immediately upon connection)
      eventSource.addEventListener('connected', (event: Event) => {
        console.log('🔵 SSE: Received "connected" event');
        try {
          const messageEvent = event as any;
          console.log('🔵 SSE: Raw event data:', messageEvent.data);
          const data: ConnectedEvent = JSON.parse(messageEvent.data);
          console.log('🔵 SSE: Parsed connected event data:', data);
          console.log('🔵 SSE: Number of users in event:', data.connectedUsers?.length || 0);

          // Set initial connected users
          connectedUsersRef.current = data.connectedUsers || [];
          console.log('🔵 SSE: Updated connectedUsersRef.current:', connectedUsersRef.current);
          console.log('🔵 SSE: connectedUsersRef.current length:', connectedUsersRef.current.length);
          
          // Force state update
          const newUsers = [...connectedUsersRef.current];
          console.log('🔵 SSE: About to call setConnectedUsers with:', newUsers);
          setConnectedUsers(newUsers);
          console.log('🔵 SSE: setConnectedUsers called successfully');

          if (onConnectedRef.current && typeof onConnectedRef.current === 'function') {
            onConnectedRef.current(data);
          }
        } catch (error) {
          console.error('❌ SSE: Error parsing connected event:', error);
        }
      });

      // Clear existing timeout on successful connection
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Add a general event listener to catch all events
      eventSource.addEventListener('message', (event) => {
        console.log('SSE: Received generic message event:', event);
      });

      // Add a listener for all possible events
      eventSource.onmessage = (event) => {
        console.log('SSE: Received onmessage event:', event);
      };

      // Add open listener to confirm connection
      eventSource.onopen = async () => {
        console.log('✅ SSE: Connection opened successfully');
        // Clear any pending reconnection timeouts
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // Fetch the initial list of online users via API
        try {
          console.log('🔵 SSE: Fetching online users via API...');
          const axios = (await import('axios')).default;
          const response = await axios.get(`${API_BASE_URL}/users/online`);
          console.log('🔵 SSE: Online users API response:', response.data);
          
          if (response.data.success && response.data.users) {
            connectedUsersRef.current = response.data.users;
            console.log('🔵 SSE: Updated connectedUsers from API:', connectedUsersRef.current);
            setConnectedUsers([...connectedUsersRef.current]);
          }
        } catch (error) {
          console.error('❌ SSE: Error fetching online users:', error);
        }
      };

      eventSource.addEventListener('entity-change', (event: Event) => {
        try {
          const messageEvent = event as any;
          const parsedData = JSON.parse(messageEvent.data);
          const data: EntityChangeEvent = parsedData.data || parsedData;

          // Filtrar por tipos de entidad si se especificaron
          const currentEntityTypes = entityTypesRef.current;
          if (currentEntityTypes && currentEntityTypes.length > 0) {
            if (!currentEntityTypes.includes(data.entityType)) {
              return;
            }
          }

          // Llamar al callback con los datos del evento
          if (onEntityChangeRef.current && typeof onEntityChangeRef.current === 'function') {
            onEntityChangeRef.current(data);
          }
        } catch (error) {
          console.error('Error parsing SSE entity-change event:', error);
        }
      });

      eventSource.addEventListener('user-connected', (event: Event) => {
        try {
          const messageEvent = event as any;
          const parsedData = JSON.parse(messageEvent.data);
          const data: UserConnectedEvent = parsedData.data || parsedData;
          console.log('SSE: User connected event:', data);

          // Update connected users list
          connectedUsersRef.current = connectedUsersRef.current.filter(u => u.id !== data.userId);
          connectedUsersRef.current.push({
            id: data.userId,
            username: data.username,
            nombre: data.nombre,
            apellido: data.apellido,
            role: (data as any).role, // Handle role
            connectedAt: data.connectedAt,
            sessionCount: 1 // Will be updated if multiple sessions
          });
          console.log('SSE: Updated connected users after user-connected:', connectedUsersRef.current);
          setConnectedUsers([...connectedUsersRef.current]);

          // Only call callback if it exists and is a function
          if (onUserConnectedRef.current && typeof onUserConnectedRef.current === 'function') {
            onUserConnectedRef.current(data);
          }
        } catch (error) {
          console.error('Error parsing SSE user-connected event:', error);
        }
      });

      eventSource.addEventListener('user-disconnected', (event: Event) => {
        try {
          const messageEvent = event as any;
          const parsedData = JSON.parse(messageEvent.data);
          const data: UserDisconnectedEvent = parsedData.data || parsedData;
          console.log('SSE: User disconnected event:', data);

          // Remove from connected users list
          connectedUsersRef.current = connectedUsersRef.current.filter(u => u.id !== data.userId);
          console.log('SSE: Updated connected users after user-disconnected:', connectedUsersRef.current);
          setConnectedUsers([...connectedUsersRef.current]);

          if (onUserDisconnectedRef.current && typeof onUserDisconnectedRef.current === 'function') {
            onUserDisconnectedRef.current(data);
          }
        } catch (error) {
          console.error('Error parsing SSE user-disconnected event:', error);
        }
      });

      eventSource.addEventListener('new-message', (event: Event) => {
        console.log('📬 SSE: Received new-message event (raw):', event);
        try {
          const messageEvent = event as any;
          console.log('📬 SSE: Message event data (raw):', messageEvent.data);
          const parsedData = JSON.parse(messageEvent.data);
          console.log('📬 SSE: Parsed data:', parsedData);
          
          // Extract the actual data from the wrapper
          const data: NewMessageEvent = parsedData.data || parsedData;
          console.log('📬 SSE: New message event (final):', data);

          if (onNewMessageRef.current && typeof onNewMessageRef.current === 'function') {
            console.log('📬 SSE: Calling onNewMessage callback');
            onNewMessageRef.current(data);
          } else {
            console.log('⚠️ SSE: onNewMessage callback is not defined');
          }
        } catch (error) {
          console.error('❌ Error parsing SSE new-message event:', error);
        }
      });

      // DUPLICATE REMOVED - connected listener now at line ~161
      eventSource.addEventListener('error', (error) => {
        console.error('❌ SSE connection error:', error);
        // Close the connection to allow proper cleanup
        eventSourceRef.current = null;
        
        // Intentar reconectar después de 5 segundos (más tiempo para evitar spam)
        if (!connectionTimeoutRef.current) {
          console.log('⏳ SSE: Scheduling reconnection in 5 seconds...');
          connectionTimeoutRef.current = setTimeout(() => {
            connectionTimeoutRef.current = null;
            console.log('🔄 SSE: Attempting to reconnect...');
            disconnect();
            connect();
          }, 5000);
        }
      });

      console.log('SSE connection established to:', eventUrl);
    } catch (error) {
      console.error('Error establishing SSE connection:', error);
    }
  }, [API_BASE_URL]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log('SSE connection closed');
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    // Only connect if authenticated
    if (isAuthenticated) {
      connect();
    } else {
      console.log('SSE: Not authenticated, skipping auto-connect');
      disconnect();
    }

    // Limpiar la conexión cuando el componente se desmonta
    return () => {
      disconnect();
    };
  }, [connect, disconnect, isAuthenticated]);

  // Efecto adicional para desconectar cuando el usuario cambie (logout)
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token && eventSourceRef.current) {
        console.log('SSE: No token found, disconnecting...');
        disconnect();
      }
    };

    // Verificar cada 5 segundos si el token sigue existiendo
    const interval = setInterval(checkToken, 5000);

    // Escuchar cambios en localStorage (para logout inmediato)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && !e.newValue) {
        console.log('SSE: Token removed from storage, disconnecting immediately...');
        disconnect();
      }
    };

    // Escuchar evento personalizado de logout
    const handleLogout = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('SSE: Logout event detected, disconnecting immediately...');
      const user = customEvent.detail?.user;
      disconnect();
      if (user) {
        connectedUsersRef.current = connectedUsersRef.current.filter(u => u.id !== user.id);
        console.log('SSE: Removed user from connectedUsers after logout:', user.username);
        setConnectedUsers([...connectedUsersRef.current]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-logout', handleLogout);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  return {
    isConnected: eventSourceRef.current !== null,
    connectedUsers: connectedUsers,
    disconnect
  };
};
