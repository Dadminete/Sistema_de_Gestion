import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AuthService } from '../services/authService';

export interface User {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocked: boolean;
  login: (credentials: any) => Promise<any>;
  logout: () => Promise<void>;
  lockScreen: () => void;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Auto-refresh token timer
  useEffect(() => {
    if (!user) return;

    // Refresh token every 7 hours (before the 8-hour expiration)
    const REFRESH_INTERVAL = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

    const refreshTimer = setInterval(async () => {
      console.log('🔄 Auto-refreshing token...');
      const success = await refreshToken();
      if (!success) {
        console.error('❌ Auto-refresh failed, logging out');
        await logout();
        window.location.href = '/login';
      } else {
        console.log('✅ Token auto-refreshed successfully');
      }
    }, REFRESH_INTERVAL);

    // Also check if token is expiring soon on mount
    if (AuthService.isTokenExpiringSoon(30)) {
      console.log('⚠️ Token expiring soon, refreshing...');
      refreshToken();
    }

    return () => {
      clearInterval(refreshTimer);
    };
  }, [user]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if user is already authenticated
      if (AuthService.isAuthenticated()) {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Try to refresh token
          const refreshed = await AuthService.refreshToken();
          if (refreshed) {
            const refreshedUser = AuthService.getCurrentUser();
            setUser(refreshedUser);
          } else {
            // Clear invalid session
            await AuthService.logout();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await AuthService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: any) => {
    try {
      setIsLoading(true);
      const result = await AuthService.login(credentials);

      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('user_id', result.user.id);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const lockScreen = () => {
    setIsLocked(true);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const success = await AuthService.refreshToken();
      if (success) {
        const refreshedUser = AuthService.getCurrentUser();
        setUser(refreshedUser);
      }
      return success;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isLocked,
    login,
    logout,
    lockScreen,
    refreshToken,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
