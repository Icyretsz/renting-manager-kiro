import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAntNotification } from './useAntNotification';
import { NavigateFunction } from 'react-router-dom';
import { Notification } from '@/types';
import { queryClient } from '@/services/queryClient';
import { meterReadingKeys } from './useMeterReadings';

export const useWebSocketNotifications = (navigate: NavigateFunction) => {
  const { socket, isConnected } = useSocket();
  const { addNotification, markAsRead, markAllAsRead, updateNotification } = useNotificationStore();
  const { showNotification, contextHolder } = useAntNotification(navigate);

  useEffect(() => {

    if (!socket || !isConnected) {
      console.log('Socket not ready, skipping listener setup');
      return;
    }

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {

      // Add to notification store
      addNotification(notification);

      // Show Ant Design notification
      showNotification(notification);

      if (notification.data) {
        const notificationData = notification.data
          switch (notificationData.type) {
            case 'reading_submitted':
              console.log('submitted')
              queryClient.invalidateQueries({ queryKey: [...meterReadingKeys.all, 'admin-all'] })
              break
            case 'reading_updated':
              console.log('updated')
              queryClient.invalidateQueries({ queryKey: [meterReadingKeys.byRoom(Number(notificationData.roomNumber))]})
              queryClient.invalidateQueries({ queryKey: [...meterReadingKeys.all, 'admin-all'] })
              break
            case 'reading_approved':
              queryClient.invalidateQueries({ queryKey: [meterReadingKeys.byRoom(Number(notificationData.roomNumber))]})
              queryClient.invalidateQueries({ queryKey: [...meterReadingKeys.all, 'admin-all'] })
              break
          }
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