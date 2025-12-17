import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    gradient?: string;
    onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    hover = true,
    gradient,
    onClick
}) => {
    const baseClass = 'glass-card';
    const hoverClass = hover ? 'glass-card-hover' : '';
    const gradientClass = gradient ? `gradient-${gradient}` : '';

    return (
        <div
            className={`${baseClass} ${hoverClass} ${gradientClass} ${className}`}
            onClick={onClick}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            {children}
        </div>
    );
};

export default GlassCard;
