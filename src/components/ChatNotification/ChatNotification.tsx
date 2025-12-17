import React, { useEffect } from 'react';
import './ChatNotification.css';

interface ChatNotificationProps {
    message: string;
    senderName: string;
    onClose: () => void;
    onClick?: () => void;
    duration?: number;
}

const ChatNotification: React.FC<ChatNotificationProps> = ({
    message,
    senderName,
    onClose,
    onClick,
    duration = 4000
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking the close button
        if ((e.target as HTMLElement).classList.contains('notification-close')) {
            return;
        }

        if (onClick) {
            onClick();
        }
        onClose();
    };

    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <div className="chat-notification" onClick={handleClick}>
            <div className="notification-header">
                <span className="notification-sender">{senderName}</span>
                <button className="notification-close" onClick={handleCloseClick}>×</button>
            </div>
            <div className="notification-message">{message}</div>
        </div>
    );
};

export default ChatNotification;
