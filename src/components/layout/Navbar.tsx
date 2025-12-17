import { getEventos, type Evento } from '../../services/eventService';




import React, { useContext, useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeProvider';
import { useAuth } from '../../context/AuthProvider';
import Swal from 'sweetalert2';
import OnlineUsersIndicator from './OnlineUsersIndicator';
import DatabaseStatusModal from '../modals/DatabaseStatusModal';
import './Navbar.css';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout, lockScreen } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Evento[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasEventToday, setHasEventToday] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const events = await getEventos();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        const pendingEvents = events.filter(event => {
          const eventDate = new Date(event.fechaInicio);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today && eventDate < dayAfterTomorrow;
        });

        setNotifications(pendingEvents);

        const eventToday = pendingEvents.some(event => {
          const eventDate = new Date(event.fechaInicio);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === today.getTime();
        });

        setHasEventToday(eventToday);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Poll every minute to keep updated
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);
  // Check if we're on mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      // Not used, but can be used for responsive logic if needed
    };

    // Check on initial load
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup event listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);



  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres cerrar tu sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await logout();
        navigate('/login');
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch {
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al cerrar la sesión.',
          icon: 'error'
        });
      }
    }
  };

  const handleLockScreen = () => {
    lockScreen();
    navigate('/lock-screen');
  };

  // Get avatar URL or fallback to default
  const getAvatarUrl = (): string | null => {
    if (user && (user as any).avatar) {
      return (user as any).avatar as string;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button onClick={onToggleSidebar} className="menu-btn">
          <span className="material-icons">menu</span>
        </button>
        <div className="search-bar">
          <span className="material-icons">search</span>
          <input type="text" placeholder="Ingresa palabra busqueda" />
        </div>
      </div>
      <div className="navbar-right">
        <OnlineUsersIndicator />
        {notifications.length > 0 && (
          <div className="notifications-container">
            <button
              className={`icon-btn ${hasEventToday ? 'blink-animation' : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="material-icons" style={{ color: hasEventToday ? '#f59e0b' : 'inherit' }}>notifications</span>
              <span className="notification-badge">{notifications.length}</span>
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notificaciones</h3>
                </div>
                <div className="notification-list">
                  {notifications.map(event => {
                    const eventDate = new Date(event.fechaInicio);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    return (
                      <div key={event.id} className={`notification-item ${isToday ? 'urgent' : ''}`}>
                        <div className="notification-icon">
                          <span className="material-icons">{isToday ? 'event_available' : 'event'}</span>
                        </div>
                        <div className="notification-content">
                          <p className="notification-title">{event.titulo}</p>
                          <p className="notification-time">
                            {isToday ? 'Hoy' : 'Mañana'} - {new Date(event.fechaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <button className="icon-btn">
          <span className="material-icons">fullscreen</span>
        </button>
        <button
          className="icon-btn db-icon"
          onClick={() => setIsDbModalOpen(true)}
        >
          <span className="material-icons">dns</span>
        </button>
        <button className="icon-btn" onClick={toggleTheme}>
          <span className="material-icons">
            {theme === 'light' ? 'brightness_6' : 'brightness_3'}
          </span>
        </button>
        <div className="user-menu-container">
          <button
            className="icon-btn user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="user-avatar" />
            ) : (
              <span className="material-icons">account_circle</span>
            )}
          </button>
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="user-info-avatar" />
                ) : (
                  <span className="material-icons">person</span>
                )}
                <div>
                  <div className="user-full-name">
                    {user?.nombre} {user?.apellido}
                  </div>
                </div>
              </div>
              <hr />
              <button className="dropdown-item custom-menu-text" onClick={() => setShowUserMenu(false)}>
                <span className="material-icons">person</span>
                Perfil
              </button>
              <button className="dropdown-item custom-menu-text" onClick={() => setShowUserMenu(false)}>
                <span className="material-icons">receipt_long</span>
                Mis Tickets
              </button>
              <button className="dropdown-item custom-menu-text" onClick={() => setShowUserMenu(false)}>
                <span className="material-icons">assignment</span>
                Asignaciones
              </button>
              <button className="dropdown-item custom-menu-text" onClick={handleLockScreen}>
                <span className="material-icons">lock</span>
                Lock Screen
              </button>
              <hr />
              <button className="dropdown-item logout-btn" onClick={handleLogout}>
                <span className="material-icons">logout</span>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
      <DatabaseStatusModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
