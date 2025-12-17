import React from 'react';
import './InfoCardPapeleria.css';

interface InfoCardPapeleriaProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  iconColor?: string;
  cardClass?: string; // Nueva prop para especificar la clase del card
}

const InfoCardPapeleria: React.FC<InfoCardPapeleriaProps> = ({ title, icon, children, iconColor, cardClass = '' }) => {
  return (
    <div className={`card ${cardClass}`}>
      <div className="card-inner">
        <div className="card-header">
          <h3>{title}</h3>
          <div className="card-icon" style={{ color: iconColor }}>{icon}</div>
        </div>
        <div className="card-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfoCardPapeleria;
