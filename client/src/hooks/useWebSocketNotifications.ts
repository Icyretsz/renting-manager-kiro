import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAntNotification } from './useAntNotification';
import { NavigateFunction } from 'react-router-dom';
import { Notification } from '@/types';
import { queryClient } from '@/services/queryClient';
import { meterReadingKeys } from './useMeterReadings';
import { billingKeys } from './useBilling';

export const useWebSocketNotifications = (navigate: NavigateFunction) => {
  const { socket, isConnected } = useSocket();
  const { addNotification, markAsRead, markAllAsRead, updateNotification } = useNotificationStore();
  const { showNotification, contextHolder } = useAntNotification(navigate);

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      // Add to notification store
      addNotification(notification);

      // Show Ant Design notification
      showNotification(notification);

      if (notification.data) {
        const notificationData = notification.data;

        switch (notification.type) {
          case 'reading_submitted':
            // Invalidate all meter reading queries
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
            // Specifically invalidate admin-all query
            queryClient.invalidateQueries({ queryKey: [...meterReadingKeys.all, 'admin-all'] });
            break;

          case 'reading_updated':
            if (notificationData.roomNumber) {
              const roomQueryKey = meterReadingKeys.byRoom(Number(notificationData.roomNumber));
              queryClient.invalidateQueries({ queryKey: roomQueryKey });
            }
            break;

          case 'reading_modified':
            if (notificationData.roomNumber) {
              const roomQueryKey = meterReadingKeys.byRoom(Number(notificationData.roomNumber));
              queryClient.invalidateQueries({ queryKey: roomQueryKey });
            }
            break;

          case 'reading_approved':
            // Invalidate all meter reading queries
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
            // Specifically invalidate the room's readings if roomNumber is available
            if (notificationData.roomNumber) {
              const roomQueryKeyReadings = meterReadingKeys.byRoom(Number(notificationData.roomNumber));
              queryClient.invalidateQueries({ queryKey: roomQueryKeyReadings });
              const roomQueryKeyBilling = billingKeys.byRoom(Number(notificationData.roomNumber))
              queryClient.invalidateQueries({ queryKey: roomQueryKeyBilling })
              queryClient.invalidateQueries({ queryKey: billingKeys.lists() })
            }
            break;

          case 'reading_rejected':
            // Invalidate all meter reading queries
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
            // Specifically invalidate the room's readings if roomNumber is available
            if (notificationData.roomNumber) {
              queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(Number(notificationData.roomNumber)) });
            }
            break;

          case 'bill_payed':
            // Invalidate all billing queries
            queryClient.invalidateQueries({ queryKey: billingKeys.all });
            // Specifically invalidate the room's billing if roomNumber is available
            if (notificationData.roomNumber) {
              const roomQueryKeyBilling = billingKeys.byRoom(Number(notificationData.roomNumber))
              queryClient.invalidateQueries({ queryKey: roomQueryKeyBilling })
              queryClient.invalidateQueries({ queryKey: billingKeys.lists() })
            }
            break;

          default:
            // Fallback: invalidate all meter reading queries for unknown types
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
        }
      } else {
        // Fallback: if no specific data, invalidate all meter reading queries
        queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
      }
    };

    // Listen for notification updates
    const handleNotificationUpdate = (update: any) => {
      if (update.type === 'read') {
        markAsRead(update.notificationId);
      }
    };

    // Listen for bulk notification updates
    const handleBulkUpdate = (update: any) => {
      if (update.type === 'mark_all_read') {
        markAllAsRead();
      }
    };

    // Set up event listeners
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:update', handleNotificationUpdate);
    socket.on('notification:bulk_update', handleBulkUpdate);

    // Cleanup listeners on unmount or socket change
    return () => {
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