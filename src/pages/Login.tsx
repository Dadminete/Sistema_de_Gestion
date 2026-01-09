import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Ban, AlertCircle, User, Lock, Eye, EyeOff, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import './Login.css';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
  captcha?: string;
}

interface LoginAttempt {
  timestamp: number;
  ip: string;
}

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');

  // Security constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  const CAPTCHA_THRESHOLD = 3;

  useEffect(() => {
    // Check for existing login attempts in localStorage
    const storedAttempts = localStorage.getItem('loginAttempts');
    if (storedAttempts) {
      const attempts: LoginAttempt[] = JSON.parse(storedAttempts);
      const now = Date.now();
      const recentAttempts = attempts.filter(
        attempt => now - attempt.timestamp < BLOCK_DURATION
      );

      setLoginAttempts(recentAttempts);

      if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
        setIsBlocked(true);
        const oldestAttempt = recentAttempts[0];
        const timeRemaining = BLOCK_DURATION - (now - oldestAttempt.timestamp);
        setBlockTimeRemaining(Math.max(0, timeRemaining));
      }

      if (recentAttempts.length >= CAPTCHA_THRESHOLD) {
        setShowCaptcha(true);
        generateCaptcha();
      }
    }
  }, []);

  useEffect(() => {
    // Update block timer
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1000) {
            setIsBlocked(false);
            setLoginAttempts([]);
            localStorage.removeItem('loginAttempts');
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(result);
  };

  const recordLoginAttempt = () => {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      ip: 'client', // In a real app, get from server
    };

    const updatedAttempts = [...loginAttempts, attempt];
    setLoginAttempts(updatedAttempts);
    localStorage.setItem('loginAttempts', JSON.stringify(updatedAttempts));

    if (updatedAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      setIsBlocked(true);
      setBlockTimeRemaining(BLOCK_DURATION);
    } else if (updatedAttempts.length >= CAPTCHA_THRESHOLD) {
      setShowCaptcha(true);
      generateCaptcha();
    }
  };

  const validateInput = (input: string): string => {
    // Basic XSS prevention
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  };

  const validateForm = (): boolean => {
    if (!formData.username || !formData.password) {
      setError('Usuario y contraseña son requeridos');
      return false;
    }

    if (formData.username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (showCaptcha && captchaCode !== generatedCaptcha) {
      setError('Código de verificación incorrecto');
      return false;
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      const sanitizedValue = validateInput(value);
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    }

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      setError(`Cuenta bloqueada. Intenta en ${Math.ceil(blockTimeRemaining / 60000)} minutos`);
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const loginData = {
        username: formData.username,
        password: formData.password,
        rememberMe: formData.rememberMe,
        captcha: showCaptcha ? captchaCode : undefined,
      };

      const result = await login(loginData);

      if (result.success) {
        // Clear login attempts on successful login
        localStorage.removeItem('loginAttempts');
        setLoginAttempts([]);

        // Redirect based on user role
        const userRoles = result.user?.roles || [];
        let redirectPath = '/';
        
        if (userRoles.includes('Técnico') || userRoles.includes('Tecnico')) {
          // Técnicos van directo al dashboard de averías
          redirectPath = '/averias/dashboard';
        } else {
          // Otros usuarios van al dashboard principal o a la página que intentaban acceder
          redirectPath = (location.state as LocationState)?.from?.pathname || '/';
        }
        
        navigate(redirectPath, { replace: true });
      } else {
        recordLoginAttempt();
        setError(result.error || 'Credenciales inválidas');

        if (showCaptcha) {
          generateCaptcha();
          setCaptchaCode('');
        }
      }
    } catch (err) {
      recordLoginAttempt();
      setError('Error de conexión. Intenta nuevamente.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-left">
          <div className="background-overlay"></div>
          <div className="brand-content">
            <div className="logo-container">
              <img src="/src/assets/images/logo2.png" alt="Logo" className="brand-logo" />
            </div>
            <h1>Sistema de Gestión v2.0</h1>
            <p>Potenciando el futuro de tu empresa</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-content">
            <div className="form-header">
              <h2>Iniciar Sesión</h2>
              <p>Ingresa tus credenciales para acceder</p>
            </div>

            {isBlocked && (
              <div className="alert alert-error">
                <Ban size={20} strokeWidth={2.5} />
                <div>
                  <strong>Cuenta Bloqueada</strong>
                  <p>Intenta nuevamente en {formatTime(blockTimeRemaining)}</p>
                </div>
              </div>
            )}

            {error && !isBlocked && (
              <div className="alert alert-error">
                <AlertCircle size={20} strokeWidth={2.5} />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Usuario</label>
                <div className="input-group">
                  <User size={20} strokeWidth={2.5} className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu usuario"
                    disabled={loading || isBlocked}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <div className="input-group">
                  <Lock size={20} strokeWidth={2.5} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu contraseña"
                    disabled={loading || isBlocked}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              {showCaptcha && (
                <div className="form-group captcha-section">
                  <label>Verificación de Seguridad</label>
                  <div className="captcha-container">
                    <div className="captcha-box">
                      <span className="captcha-text">{generatedCaptcha}</span>
                      <button
                        type="button"
                        className="refresh-captcha"
                        onClick={generateCaptcha}
                        title="Generar nuevo código"
                      >
                        <RefreshCw size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                    <input
                      type="text"
                      name="captcha"
                      value={captchaCode}
                      onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                      placeholder="INGRESA EL CÓDIGO"
                      className="captcha-input"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={loading || isBlocked}
                  />
                  <span className="checkmark"></span>
                  <span>Recuérdame</span>
                </label>

                <a href="#" className="forgot-password" onClick={(e) => {
                  e.preventDefault();
                  navigate('/forgot-password');
                }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading || isBlocked}
              >
                {loading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>© 2025 Empresa Tecnológica del Este. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
