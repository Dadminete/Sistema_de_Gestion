import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import companyLogo from '../assets/images/logo2.png';
import './LockScreen.css';

const LockScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // This is where you would add logic to verify the password
    // For now, we'll just simulate a successful unlock
    setLoading(true);
    setTimeout(() => {
      // On successful unlock:
      // 1. Clear the locked state in AuthProvider (to be implemented)
      // 2. Navigate back to the dashboard or last page
      navigate('/dashboard');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="lock-screen-container">
      <div className="lock-screen-left">
        <img src={companyLogo} alt="Company Logo" className="company-logo" />
        <div className="lock-screen-logo"><h1>EMPRESA TECNOLOGICA DEL ESTE</h1>
        <h2>La sesión esta Bloqueada:</h2></div>
        <div className="features-list">
          <div className="feature-item">
            <h3>Sistema de Gestion</h3>
            <p>Ver. 2.0</p>
          </div>
        </div>
      </div>
      <div className="lock-screen-right">
        <div className="unlock-form-wrapper">
          <img src={user?.avatar || 'default-avatar.png'} alt="User Avatar" className="user-avatar-large" />
          <h2 className="user-full-name-lock">{user?.nombre} {user?.apellido}</h2>
          <form onSubmit={handleUnlock}>
            <label htmlFor="password">ingresa tu Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="************"
              required
            />
            {error && <p className="unlock-error">{error}</p>}
            <button type="submit" className="unlock-button" disabled={loading}>
              {loading ? 'UNLOCKING...' : 'DESBLOQUEAR'}
            </button>
          </form>
          <p className="switch-user-link">
            Si no eres tu? <a href="/login">cambia de cuenta</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
