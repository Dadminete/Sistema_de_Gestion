import React from 'react';
import './DashboardCard.css';

interface DashboardCardProps {
  title: string;
  icon: string; // Material icon name
  value: string;
  percentage: string;
  trend: 'up' | 'down';
  description: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  value,
  percentage,
  trend,
  description,
}) => {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <span className="material-icons">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="card-content">
        <p className="card-value">{value}</p>
        <p className={`card-percentage ${trend === 'up' ? 'up' : 'down'}`}>
          {trend === 'up' ? '↑' : '↓'} {percentage}
        </p>
      </div>
      <p className="card-description">{description}</p>
    </div>
  );
};

export default DashboardCard;
