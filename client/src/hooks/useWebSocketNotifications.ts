import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAntNotification } from './useAntNotification';
import { NavigateFunction } from 'react-router-dom';

export const useWebSocketNotifications = (navigate: NavigateFunction) => {
  const { socket, isConnected } = useSocket();
  const { addNotification, markAsRead, markAllAsRead, updateNotification } = useNotificationStore();
  const { showNotification, contextHolder } = useAntNotification(navigate);

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
      
      // Add to notification store
      addNotification(notification);
      
      // Show Ant Design notification
      showNotification(notification);
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
    contextHolder, // This needs to be rendered in the component tree
  };
};