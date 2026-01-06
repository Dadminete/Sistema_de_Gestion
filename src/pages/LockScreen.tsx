import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import './LockScreen.css';

const LockScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
      setLoading(false);
    }, 1000);
  };

  // Format time in 12-hour format with small AM/PM in Dominican Republic timezone (GMT-4)
  const renderTime = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Santo_Domingo'
    });

    const parts = formatter.formatToParts(date);
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value;

    return (
      <>
        {hour}:{minute}
        {dayPeriod && <span className="am-pm">{dayPeriod}</span>}
      </>
    );
  };

  // Format date as "DAYNAME, Month Day, Year" in Dominican Republic timezone
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Santo_Domingo'
    };
    return date.toLocaleDateString('es-DO', options).toUpperCase();
  };

  return (
    <div className="lock-screen-container">
      <div className="lock-screen-overlay"></div>

      <div className="lock-screen-content">
        {/* User Avatar */}
        <div className="user-avatar-container">
          <img
            src={user?.avatar || 'default-avatar.png'}
            alt="User Avatar"
            className="user-avatar-large"
          />
        </div>

        {/* Time Display */}
        <div className="time-display">
          <div className="time">{renderTime(currentTime)}</div>
          <div className="date">{formatDate(currentTime)}</div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="unlock-form">
          <div className="input-container">
            <input
              type="text"
              value={`${user?.nombre || ''} ${user?.apellido || ''}`}
              className="username-display"
              readOnly
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="password-input"
              required
            />
            <button
              type="submit"
              className="unlock-button"
              disabled={loading}
              aria-label="Unlock"
            >
              <ArrowRightIcon className="arrow-icon" />
            </button>
          </div>
          {error && <p className="unlock-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default LockScreen;
