import React from 'react';
import './InfoCard.css';

interface InfoCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  showMenu?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children, className, showMenu = true }) => {
  return (
    <div className={`info-card ${className || ''}`}>
      {title && (
        <div className="info-card-header">
          <h3 className="info-card-title">{title}</h3>
          {showMenu && <span className="material-icons">more_horiz</span>}
        </div>
      )}
      <div className="info-card-content">
        {children}
      </div>
    </div>
  );
};

export default InfoCard;
