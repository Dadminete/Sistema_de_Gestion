import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { useAuth } from '../../context/AuthProvider';
import './OnlineUsersIndicator.css';

interface ConnectedUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  role?: string;
  connectedAt: string;
  sessionCount: number;
}

const OnlineUsersIndicator: React.FC = () => {
  const [showUsersList, setShowUsersList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { connectedUsers, isConnected } = useRealTimeUpdates(
    undefined, // onEntityChange
    undefined, // onUserConnected  
    undefined, // onUserDisconnected
    undefined, // onConnected
    undefined, // onNewMessage
    undefined, // entityTypes
    isAuthenticated // Pass authentication status
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUsersList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = (userId: string) => {
    navigate(`/chat?userId=${userId}`);
    setShowUsersList(false);
  };

  const getDisplayName = (user: ConnectedUser) => {
    if (user.nombre && user.apellido) {
      return `${user.nombre} ${user.apellido}`.trim();
    }
    return user.username || 'Usuario';
  };

  const getInitials = (user: ConnectedUser) => {
    if (user.nombre && user.apellido) {
      return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getTimeConnected = (connectedAt: string) => {
    if (!connectedAt) return 'Desconocido';
    
    const connected = new Date(connectedAt);
    
    // Verificar si la fecha es válida
    if (isNaN(connected.getTime())) {
      return 'Desconocido';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - connected.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} d`;
  };

  const getRoleBadgeClass = (role?: string) => {
    const r = role?.toLowerCase() || '';
    if (r.includes('admin')) return 'role-badge admin';
    if (r.includes('soporte') || r.includes('support')) return 'role-badge support';
    if (r.includes('venta')) return 'role-badge sales';
    return 'role-badge user';
  };

  // Filtrar y deduplicar usuarios
  const uniqueValidUsers = connectedUsers.filter((user, index, array) => {
    // Filtrar usuarios con datos inválidos
    if (!user.id || (!user.username && !user.nombre)) {
      return false;
    }
    
    // Mantener solo la primera ocurrencia de cada usuario único
    return array.findIndex(u => u.id === user.id) === index;
  });

  return (
    <div className="online-users-container" ref={dropdownRef}>
      <button
        className={`online-users-trigger ${isConnected ? 'connected' : 'disconnected'} ${showUsersList ? 'active' : ''}`}
        onClick={() => setShowUsersList(!showUsersList)}
        title={`${uniqueValidUsers.length} usuario(s) en línea`}
      >
        <div className="trigger-icon-wrapper">
          <span className="material-icons">group</span>
          {isConnected && <span className="status-dot-pulse"></span>}
        </div>

        {uniqueValidUsers.length > 0 && (
          <span className="online-count-badge">{uniqueValidUsers.length}</span>
        )}
      </button>

      {showUsersList && (
        <div className="online-users-dropdown-premium">
          <div className="dropdown-header">
            <div className="header-title">
              <h3>Usuarios en Línea</h3>
              <span className="live-indicator">
                <span className="dot"></span> LIVE
              </span>
            </div>
            <div className="header-stats">
              <span className="stat-number">{uniqueValidUsers.length}</span>
              <span className="stat-label">conectados</span>
            </div>
          </div>

          <div className="dropdown-content">
            {uniqueValidUsers.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons">person_off</span>
                <p>No hay usuarios conectados</p>
              </div>
            ) : (
              <div className="users-list-premium">
                {uniqueValidUsers.map((user, index) => (
                  <div key={`${user.id}-${index}`} className="user-card-premium clickable" onClick={() => handleUserClick(user.id)}>
                    <div className="user-avatar-wrapper">
                      <div className={`user-avatar-initials ${getRoleBadgeClass(user.role).split(' ')[1]}`}>
                        {getInitials(user)}
                      </div>
                      <div className="user-status-indicator online"></div>
                    </div>

                    <div className="user-info-premium">
                      <div className="user-main-row">
                        <span className="user-name">{getDisplayName(user)}</span>
                        {user.role && (
                          <span key={`role-${user.id}`} className={getRoleBadgeClass(user.role)}>
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="user-meta-row">
                        <span key={`icon-${user.id}`} className="material-icons tiny">schedule</span>
                        <span key={`time-${user.id}`} className="time-text">{getTimeConnected(user.connectedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown-footer">
            <span>Sistema v2.0</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersIndicator;