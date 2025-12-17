export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
  captcha?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export interface User {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
}

export interface SessionInfo {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

class AuthenticationService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  // Get API base URL (auto-detected based on current window location)
  private getAPIBaseURL(): string {
    // If explicit VITE_API_BASE_URL is set, use it
    if (import.meta.env.VITE_API_BASE_URL) {
      const url = import.meta.env.VITE_API_BASE_URL as string;
      return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
    }
    
    // Auto-detect: use current window hostname/IP
    try {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol.replace(':', '');
      const baseURL = `${protocol}://${hostname}${port}/api`;
      return baseURL;
    } catch (e) {
      // Fallback if something goes wrong
      console.error('Error detecting API URL:', e);
      return '/api';
    }
  }

  /**
   * Real login using backend API
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const API_BASE_URL = this.getAPIBaseURL();
      console.log('🔐 Auth API URL:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe,
          captcha: credentials.captcha
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return {
          success: false,
          error: `Respuesta no válida del servidor (${response.status})`
        };
      }

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        const storage = credentials.rememberMe ? localStorage : sessionStorage;
        // Store authentication data
        storage.setItem(this.TOKEN_KEY, data.token);
        storage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
        storage.setItem(this.USER_KEY, JSON.stringify(data.user));

        console.log('✅ Login exitoso');
        console.log('🔐 User data:', data.user);
        console.log('📋 Permisos en respuesta:', data.user?.permissions);

        return {
          success: true,
          token: data.token,
          refreshToken: data.refreshToken,
          user: data.user
        };
      } else {
        return {
          success: false,
          error: data.error || 'Credenciales inválidas'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Capture user and dispatch logout event immediately to close SSE connections
    // This prevents race conditions where SSE might try to reconnect while the logout API call is in progress
    const currentUser = this.getCurrentUser();
    window.dispatchEvent(new CustomEvent('auth-logout', { detail: { user: currentUser } }));

    try {
      const token = this.getToken();
      const API_BASE_URL = this.getAPIBaseURL();
      if (token) {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        // Log errors only if they are not 401/403, as these are expected for expired tokens on logout
        if (!response.ok && response.status !== 401 && response.status !== 403) {
          console.error('Logout API error:', response.status, response.statusText);
        }
      }
    } catch (error) {
      // Network errors or other unexpected issues
      console.error('Logout network error:', error);
    } finally {
      // Always clear storage
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem('csrf_token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      const API_BASE_URL = this.getAPIBaseURL();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.token) {
        const storage = this.getStorage();
        storage.setItem(this.TOKEN_KEY, data.token);
        
        // Update user data with new token info if provided
        if (data.user) {
          storage.setItem(this.USER_KEY, JSON.stringify(data.user));
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const storage = this.getStorage();
    let userData = storage.getItem(this.USER_KEY);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Also check token for permisos (JWT payload)
        const token = this.getToken();
        if (token) {
          try {
            const decoded = this.decodeToken(token);
            console.log('📋 JWT Decoded:', decoded);
            
            if (decoded && decoded.permisos && Array.isArray(decoded.permisos)) {
              // Extract permission names from permisos array
              const permissionNames = decoded.permisos.map((p: any) => 
                typeof p === 'string' ? p : p.nombrePermiso
              );
              user.permissions = permissionNames;
              console.log('✅ Permisos from JWT:', permissionNames);
            } else if (user.permissions && Array.isArray(user.permissions)) {
              console.log('✅ Permisos from stored user:', user.permissions);
            } else {
              console.warn('⚠️  No permisos found in JWT or user data');
              user.permissions = [];
            }
          } catch (e) {
            console.debug('Could not decode token for permisos:', e);
            if (!user.permissions) {
              user.permissions = [];
            }
          }
        } else {
          if (!user.permissions) {
            user.permissions = [];
          }
        }
        
        return user;
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Decode JWT token (client-side only, for reading payload)
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      throw error;
    }
  }

  /**
   * Check if token is expired or will expire soon
   * @param bufferMinutes - Minutes before expiration to consider token as "expiring soon"
   */
  isTokenExpiringSoon(bufferMinutes: number = 30): boolean {
    try {
      const token = this.getToken();
      if (!token) return true;

      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;

      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = bufferMinutes * 60 * 1000;

      return (expirationTime - currentTime) <= bufferTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): Date | null {
    try {
      const token = this.getToken();
      if (!token) return null;

      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && token !== 'undefined';
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Debe tener al menos 8 caracteres');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Debe incluir letras minúsculas');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Debe incluir letras mayúsculas');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Debe incluir números');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Debe incluir caracteres especiales');

    if (password.length >= 12) score += 1;

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  private getStorage(): Storage {
    return localStorage.getItem(this.TOKEN_KEY) ? localStorage : sessionStorage;
  }

  public getToken(): string | null { // Made public
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
}

export const AuthService = new AuthenticationService();
