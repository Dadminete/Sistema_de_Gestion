import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { AuthService } from '../services/authService';
import './UserProfile.css';

interface UserProfileData {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  posicion: string;
  salario: number;
  avatar?: string;
  roles: string[];
  permissions: string[];
  comisiones: {
    total: number;
    pendientes: number;
    pagadas: number;
  };
  prestamos: {
    total: number;
    pendiente: number;
    pagado: number;
  };
  pagosQuincenales: {
    ultimoPago: string;
    monto: number;
    proximoPago: string;
  };
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'permissions'>('info');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = AuthService.getToken();
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
      
      const response = await fetch(`${API_BASE_URL}/users/profile/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        // Si falla la llamada API, usar datos básicos del usuario
        setProfileData({
          id: user?.id || '',
          username: user?.username || '',
          nombre: user?.nombre || '',
          apellido: user?.apellido || '',
          email: '',
          telefono: '',
          direccion: '',
          posicion: '',
          salario: 0,
          avatar: user?.avatar,
          roles: user?.roles || [],
          permissions: user?.permissions || [],
          comisiones: { total: 0, pendientes: 0, pagadas: 0 },
          prestamos: { total: 0, pendiente: 0, pagado: 0 },
          pagosQuincenales: { ultimoPago: '', monto: 0, proximoPago: '' }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Usar datos básicos en caso de error
      setProfileData({
        id: user?.id || '',
        username: user?.username || '',
        nombre: user?.nombre || '',
        apellido: user?.apellido || '',
        email: '',
        telefono: '',
        direccion: '',
        posicion: '',
        salario: 0,
        avatar: user?.avatar,
        roles: user?.roles || [],
        permissions: user?.permissions || [],
        comisiones: { total: 0, pendientes: 0, pagadas: 0 },
        prestamos: { total: 0, pendiente: 0, pagado: 0 },
        pagosQuincenales: { ultimoPago: '', monto: 0, proximoPago: '' }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-spinner">
          <span className="material-icons rotating">refresh</span>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="user-profile-container">
        <div className="error-message">
          <span className="material-icons">error_outline</span>
          <p>No se pudo cargar el perfil del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      {/* Header with Avatar and Basic Info */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          {profileData.avatar ? (
            <img src={profileData.avatar} alt="Avatar" className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-placeholder">
              <span className="material-icons">person</span>
            </div>
          )}
          <div className="profile-header-info">
            <h1>{profileData.nombre} {profileData.apellido}</h1>
            <p className="profile-username">@{profileData.username}</p>
            {profileData.posicion && <p className="profile-position">{profileData.posicion}</p>}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <span className="material-icons">person</span>
          Información Personal
        </button>
        <button
          className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <span className="material-icons">account_balance_wallet</span>
          Información Financiera
        </button>
        <button
          className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <span className="material-icons">security</span>
          Privilegios del Sistema
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'info' && (
          <div className="tab-panel">
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">
                  <span className="material-icons">badge</span>
                </div>
                <div className="info-details">
                  <label>Nombre Completo</label>
                  <p>{profileData.nombre} {profileData.apellido}</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <span className="material-icons">alternate_email</span>
                </div>
                <div className="info-details">
                  <label>Usuario</label>
                  <p>{profileData.username}</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <span className="material-icons">email</span>
                </div>
                <div className="info-details">
                  <label>Correo Electrónico</label>
                  <p>{profileData.email || 'No registrado'}</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <span className="material-icons">phone</span>
                </div>
                <div className="info-details">
                  <label>Teléfono</label>
                  <p>{profileData.telefono || 'No registrado'}</p>
                </div>
              </div>

              <div className="info-card full-width">
                <div className="info-icon">
                  <span className="material-icons">home</span>
                </div>
                <div className="info-details">
                  <label>Dirección</label>
                  <p>{profileData.direccion || 'No registrada'}</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <span className="material-icons">work</span>
                </div>
                <div className="info-details">
                  <label>Posición</label>
                  <p>{profileData.posicion || 'No especificada'}</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <span className="material-icons">attach_money</span>
                </div>
                <div className="info-details">
                  <label>Salario Base</label>
                  <p className="salary-amount">{formatCurrency(profileData.salario)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="tab-panel">
            <div className="financial-grid">
              {/* Comisiones */}
              <div className="financial-section">
                <h3>
                  <span className="material-icons">trending_up</span>
                  Comisiones
                </h3>
                <div className="financial-cards">
                  <div className="financial-card total">
                    <label>Total Comisiones</label>
                    <p className="amount">{formatCurrency(profileData.comisiones.total)}</p>
                  </div>
                  <div className="financial-card pending">
                    <label>Pendientes</label>
                    <p className="amount">{formatCurrency(profileData.comisiones.pendientes)}</p>
                  </div>
                  <div className="financial-card paid">
                    <label>Pagadas</label>
                    <p className="amount">{formatCurrency(profileData.comisiones.pagadas)}</p>
                  </div>
                </div>
              </div>

              {/* Préstamos */}
              <div className="financial-section">
                <h3>
                  <span className="material-icons">account_balance</span>
                  Préstamos
                </h3>
                <div className="financial-cards">
                  <div className="financial-card total">
                    <label>Total Préstamos</label>
                    <p className="amount">{formatCurrency(profileData.prestamos.total)}</p>
                  </div>
                  <div className="financial-card pending">
                    <label>Saldo Pendiente</label>
                    <p className="amount">{formatCurrency(profileData.prestamos.pendiente)}</p>
                  </div>
                  <div className="financial-card paid">
                    <label>Pagado</label>
                    <p className="amount">{formatCurrency(profileData.prestamos.pagado)}</p>
                  </div>
                </div>
              </div>

              {/* Pagos Quincenales */}
              <div className="financial-section full-width">
                <h3>
                  <span className="material-icons">payment</span>
                  Pagos Quincenales
                </h3>
                <div className="financial-cards">
                  <div className="financial-card">
                    <label>Último Pago</label>
                    <p className="date">{formatDate(profileData.pagosQuincenales.ultimoPago)}</p>
                    <p className="amount">{formatCurrency(profileData.pagosQuincenales.monto)}</p>
                  </div>
                  <div className="financial-card">
                    <label>Próximo Pago</label>
                    <p className="date">{formatDate(profileData.pagosQuincenales.proximoPago)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="tab-panel">
            <div className="permissions-grid">
              {/* Roles */}
              <div className="permissions-section">
                <h3>
                  <span className="material-icons">admin_panel_settings</span>
                  Roles Asignados
                </h3>
                <div className="roles-list">
                  {profileData.roles && profileData.roles.length > 0 ? (
                    profileData.roles.map((role, index) => (
                      <div key={index} className="role-badge">
                        <span className="material-icons">verified_user</span>
                        {role}
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No hay roles asignados</p>
                  )}
                </div>
              </div>

              {/* Permisos */}
              <div className="permissions-section">
                <h3>
                  <span className="material-icons">key</span>
                  Permisos del Sistema
                </h3>
                <div className="permissions-list">
                  {profileData.permissions && profileData.permissions.length > 0 ? (
                    profileData.permissions.map((permission, index) => (
                      <div key={index} className="permission-item">
                        <span className="material-icons">check_circle</span>
                        <span>{permission}</span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No hay permisos asignados</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
