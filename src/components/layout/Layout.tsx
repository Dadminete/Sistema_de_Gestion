import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';
import { useAuth } from '../../context/AuthProvider';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import ChatNotification from '../ChatNotification/ChatNotification';

interface LayoutProps {
  children: React.ReactNode;
}

import { useNavigate } from 'react-router-dom';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const [notification, setNotification] = useState<{ message: string; senderName: string; senderId: string } | null>(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // Handle new message events for global notifications
  const handleNewMessage = (event: any) => {
    console.log('🔔 Global Layout: New message event received:', event);

    // Check if we are physically on the chat page
    const isChatPage = window.location.pathname.startsWith('/chat');

    // Check if sender is me (shouldn't happen with correct backend logic, but safe to check)
    const isMe = user?.id === event.senderId;

    console.log('📍 Layout Check - Page:', window.location.pathname, 'IsChatPage:', isChatPage, 'IsMe:', isMe);

    // Only show notification if NOT on chat page and NOT from me
    if (!isChatPage && !isMe) {
      console.log('✅ Global Notification Triggered!');
      setNotification({
        message: event.message,
        senderName: event.senderName,
        senderId: event.senderId
      });
    } else {
      console.log('❌ Global Notification Suppressed (On chat page or from self)');
    }
  };

  const handleNotificationClick = () => {
    if (notification && notification.senderId) {
      navigate(`/chat?userId=${notification.senderId}`);
      setNotification(null);
    }
  };

  // Subscribe to real-time updates globally
  // We don't need the connectedUsers list here, just the event listener
  useRealTimeUpdates(
    undefined, // onEntityChange
    undefined, // onUserConnected
    undefined, // onUserDisconnected
    undefined, // onConnected
    handleNewMessage // onNewMessage
  );

  return (
    <div className={`layout-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="main-container">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="content">
          {children}
        </main>
        {notification && (
          <ChatNotification
            message={notification.message}
            senderName={notification.senderName}
            onClick={handleNotificationClick}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Layout;
