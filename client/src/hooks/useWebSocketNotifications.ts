import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useNotificationStore } from '@/stores/notificationStore';

export const useWebSocketNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { addNotification, markAsRead, markAllAsRead, updateNotification } = useNotificationStore();

  useEffect(() => {
    console.log('useWebSocketNotifications effect running:', { socket: !!socket, isConnected });
    
    if (!socket || !isConnected) {
      console.log('Socket not ready, skipping listener setup');
      return;
    }

    console.log('Setting up WebSocket notification listeners...');

    // Listen for new notifications
    const handleNewNotification = (notification: any) => {
      console.log('🔔 New notification received via WebSocket:', notification);
      addNotification(notification);
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }
    };

    // Listen for notification updates
    const handleNotificationUpdate = (update: any) => {
      console.log('Notification update received via WebSocket:', update);
      if (update.type === 'read') {
        markAsRead(update.notificationId);
      }
    };

    // Listen for bulk notification updates
    const handleBulkUpdate = (update: any) => {
      console.log('Bulk notification update received via WebSocket:', update);
      if (update.type === 'mark_all_read') {
        markAllAsRead();
      }
    };

    // Set up event listeners
    console.log('📡 Registering WebSocket event listeners...');
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:update', handleNotificationUpdate);
    socket.on('notification:bulk_update', handleBulkUpdate);

    console.log('✅ WebSocket notification listeners registered successfully');

    // Cleanup listeners on unmount or socket change
    return () => {
      console.log('🧹 Cleaning up WebSocket notification listeners');
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:update', handleNotificationUpdate);
      socket.off('notification:bulk_update', handleBulkUpdate);
    };
  }, [socket, isConnected, addNotification, markAsRead, markAllAsRead, updateNotification]);

  return {
    isConnected,
  };
};