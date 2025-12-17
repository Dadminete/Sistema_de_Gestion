import React from 'react';
import Card from './Card';
import './KpiWidget.css';
interface KpiWidgetProps {
  icon?: React.ReactNode;
  iconColor?: string; // Added for custom icon color
  title: string;
  value: string;
  percentage?: string;
  barColor?: string; // Added for the colored bar at the bottom
  percentageClass?: string; // Added for dynamic styling of percentage
  subtitle?: string;
  subtitleClass?: string; // Added for custom styling of subtitle
  customContent?: React.ReactNode; // Added for custom content below value
}

const KpiWidget: React.FC<KpiWidgetProps> = ({ icon, iconColor, title, value, percentage, barColor, percentageClass = '', subtitle, subtitleClass = '', customContent }) => {
  return (
    <Card className="kpi-widget">
      <div className="kpi-content">
        <div className="kpi-header">
          <h3 className="kpi-title">{title}</h3>
          {icon && (
            <div
              className="kpi-icon"
              style={iconColor ? { color: iconColor } : {}}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="kpi-value-container">
          <span className="kpi-value">{value}</span>
          {percentage && <span className={`kpi-percentage ${percentageClass}`}>{percentage}</span>}
        </div>
        {subtitle && <p className={`kpi-subtext ${subtitleClass}`}>{subtitle}</p>}
        {customContent && <div className="kpi-custom-content">{customContent}</div>}
      </div>
      {barColor && <div className="kpi-bar" style={{ backgroundColor: barColor }}></div>}
    </Card>
  );
};

export default KpiWidget;
