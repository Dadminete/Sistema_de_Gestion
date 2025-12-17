import React from 'react';
import { LucideIcon } from 'lucide-react';
import GlassCard from './GlassCard';
import './StatsCard.css';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'primary',
    subtitle
}) => {
    return (
        <GlassCard className={`stats-card ${color} fade-in-up`}>
            <div className="stats-card-header">
                <div className={`stats-icon gradient-${color}`}>
                    <Icon size={24} />
                </div>
                {trend !== undefined && (
                    <div className={`stats-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
                        <span>{trend >= 0 ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div className="stats-content">
                <h3 className="stats-title">{title}</h3>
                <div className="stats-value">{value}</div>
                {subtitle && <p className="stats-subtitle">{subtitle}</p>}
            </div>
        </GlassCard>
    );
};

export default StatsCard;
