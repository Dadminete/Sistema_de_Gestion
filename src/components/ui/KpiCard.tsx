import React from 'react';
import './KpiCard.css';

interface KpiCardProps {
  title: string;
  value: string;
  percentage: string;
  increase: boolean;
  icon: string;
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, percentage, increase, icon, color }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <p className="kpi-title">{title}</p>
        <span className="material-icons kpi-icon-header">more_horiz</span>
      </div>
      <div className="kpi-card-body">
        <div className="kpi-value-section">
          <h2 className="kpi-value">{value}</h2>
          <p className={`kpi-percentage ${increase ? 'increase' : 'decrease'}`}>
            <span className="material-icons">{increase ? 'arrow_upward' : 'arrow_downward'}</span>
            {percentage}
          </p>
        </div>
        <div className="kpi-icon-container">
          <span className="material-icons">{icon}</span>
        </div>
      </div>
      <p className="kpi-footer-text">Analytics for last week</p>
      <div className="kpi-progress-bar-container">
        <div className="kpi-progress-bar" style={{ width: `${percentage}`, backgroundColor: color }}></div>
      </div>
    </div>
  );
};

export default KpiCard;
