import { useEffect, useCallback, useRef } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAntNotification } from './useAntNotification';
import { NavigateFunction } from 'react-router-dom';
import { WebsocketNotification } from '@/types';
import { queryClient } from '@/services/queryClient';
import { meterReadingKeys } from './useMeterReadings';
import { billingKeys } from './useBilling';
import { curfewKeys } from './useCurfew';
import { requestKeys } from './useRequests';

export const useWebSocketNotifications = (navigate: NavigateFunction) => {
  const socket = useSocketStore(state => state.socket);
  const isConnected = useSocketStore(state => state.isConnected);
  const addNotification = useNotificationStore(state => state.addNotification);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const { showNotification, contextHolder } = useAntNotification(navigate);
  const listenersRegistered = useRef(false);

  // Memoize the notification handler to prevent recreating it on every render
  const handleNewNotification = useCallback((notification: WebsocketNotification) => {
    console.log('🔔 WebSocket notification received:', notification);
    console.log('🔍 Notification type:', notification.type);
    console.log('🔍 Notification data:', notification.data);
    
    // Add to notification store
    addNotification(notification);

    // Show Ant Design notification
    if (document.visibilityState === 'visible') {
      console.log('📱 Showing in-app notification');
      showNotification(notification);
    } else {
      console.log('📱 Page not visible, skipping in-app notification');
    }

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
          // Invalidate all meter reading queries for admin view
          queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
          if (notificationData.roomNumber) {
            const roomQueryKey = meterReadingKeys.byRoom(Number(notificationData.roomNumber));
            queryClient.invalidateQueries({ queryKey: roomQueryKey });
            const roomQueryKeyBilling = billingKeys.byRoom(Number(notificationData.roomNumber))
            queryClient.invalidateQueries({ queryKey: roomQueryKeyBilling })
            queryClient.invalidateQueries({ queryKey: billingKeys.lists() })
          }
          break;

        case 'reading_modified':
          if (notificationData.roomNumber) {
            console.log('modified')
            const roomQueryKey = meterReadingKeys.byRoom(Number(notificationData.roomNumber));
            queryClient.invalidateQueries({ queryKey: roomQueryKey });
            const roomQueryKeyBilling = billingKeys.byRoom(Number(notificationData.roomNumber))
            queryClient.invalidateQueries({ queryKey: roomQueryKeyBilling })
            queryClient.invalidateQueries({ queryKey: billingKeys.lists() })
          }
          break;

        case 'reading_approved':
          console.log('approved')
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

        case 'curfew_request':
          // Admin receives notification - invalidate pending curfew requests
          queryClient.invalidateQueries({ queryKey: [...curfewKeys.all, 'pending'] });
          queryClient.invalidateQueries({ queryKey: curfewKeys.all });
          break;

        case 'curfew_approved':
          // User receives notification - invalidate room tenants and user data
          queryClient.invalidateQueries({ queryKey: curfewKeys.roomTenants() });
          queryClient.invalidateQueries({ queryKey: curfewKeys.all });
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          break;

        case 'curfew_rejected':
          // User receives notification - invalidate room tenants and user data
          queryClient.invalidateQueries({ queryKey: curfewKeys.roomTenants() });
          queryClient.invalidateQueries({ queryKey: curfewKeys.all });
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          break;

        case 'request_submitted':
          // Admin receives notification - invalidate pending requests
          queryClient.invalidateQueries({ queryKey: requestKeys.pending() });
          queryClient.invalidateQueries({ queryKey: requestKeys.all });
          break;

        case 'request_approved':
        case 'request_rejected':
          // User receives notification - invalidate user's requests
          queryClient.invalidateQueries({ queryKey: requestKeys.myRequests() });
          queryClient.invalidateQueries({ queryKey: requestKeys.all });
          queryClient.invalidateQueries({ queryKey: ['allUserRequests'] });
          break;

        default:
          // Fallback: invalidate all meter reading queries for unknown types
          queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
      }
    } else {
      // Fallback: if no specific data, invalidate all meter reading queries
      queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
    }
  }, [addNotification, showNotification]);

  // Memoize other handlers
  const handleNotificationUpdate = useCallback((update: any) => {
    if (update.type === 'read') {
      markAsRead(update.notificationId);
    }
  }, [markAsRead]);

  const handleBulkUpdate = useCallback((update: any) => {
    if (update.type === 'mark_all_read') {
      markAllAsRead();
    }
  }, [markAllAsRead]);

  // Set up Firebase foreground message listener with in-app notification callback
  // useEffect(() => {
  //   const handleFirebaseNotification = (notification: WebsocketNotification) => {
  //     // Add to store and show in-app notification
  //     console.log('Firebase notification received!')
  //     addNotification(notification);
  //     showNotification(notification);
  //   };
  //
  //   setupForegroundMessageListener(handleFirebaseNotification);
  // }, [addNotification, showNotification]);

  // Listen for messages from service worker (when Firebase background notification is clicked)
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        const { notificationType, notificationData } = event.data;
        
        // Navigate to appropriate page based on notification type
        let targetPath = '/';
        switch (notificationType) {
          case 'reading_submitted':
          case 'reading_updated':
          case 'curfew_request':
            targetPath = '/approvals';
            break;
          
          case 'reading_approved':
          case 'bill_generated':
            targetPath = '/billing';
            break;
          
          case 'reading_rejected':
          case 'reading_modified':
            targetPath = '/meter-readings';
            break;
          
          case 'bill_payed':
            targetPath = '/financial-dashboard';
            break;
          
          case 'curfew_approved':
          case 'curfew_rejected':
            targetPath = '/profile';
            break;
          
          case 'request_submitted':
            targetPath = '/approvals';
            break;
          
          case 'request_approved':
          case 'request_rejected':
            targetPath = '/requests';
            break;
        }
        
        // Navigate to the target path
        navigate(targetPath);
        
        // Invalidate queries based on notification type (same logic as WebSocket notifications)
        switch (notificationType) {
          case 'reading_submitted':
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
            queryClient.invalidateQueries({ queryKey: [...meterReadingKeys.all, 'admin-all'] });
            break;

          case 'reading_updated':
          case 'reading_modified':
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
            if (notificationData?.roomNumber) {
              queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(Number(notificationData.roomNumber)) });
              queryClient.invalidateQueries({ queryKey: billingKeys.byRoom(Number(notificationData.roomNumber)) });
              queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
            }
            break;

          case 'reading_approved':
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
            if (notificationData?.roomNumber) {
              queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(Number(notificationData.roomNumber)) });
              queryClient.invalidateQueries({ queryKey: billingKeys.byRoom(Number(notificationData.roomNumber)) });
              queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
            }
            break;

          case 'reading_rejected':
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
            if (notificationData?.roomNumber) {
              queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(Number(notificationData.roomNumber)) });
            }
            break;

          case 'bill_payed':
            queryClient.invalidateQueries({ queryKey: billingKeys.all });
            if (notificationData?.roomNumber) {
              queryClient.invalidateQueries({ queryKey: billingKeys.byRoom(Number(notificationData.roomNumber)) });
              queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
            }
            break;

          case 'curfew_request':
            queryClient.invalidateQueries({ queryKey: [...curfewKeys.all, 'pending'] });
            queryClient.invalidateQueries({ queryKey: curfewKeys.all });
            break;

          case 'curfew_approved':
          case 'curfew_rejected':
            queryClient.invalidateQueries({ queryKey: curfewKeys.roomTenants() });
            queryClient.invalidateQueries({ queryKey: curfewKeys.all });
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            break;

          case 'request_submitted':
            // Admin receives notification - invalidate pending requests
            queryClient.invalidateQueries({ queryKey: requestKeys.pending() });
            queryClient.invalidateQueries({ queryKey: requestKeys.all });
            break;

          case 'request_approved':
          case 'request_rejected':
            // User receives notification - invalidate user's requests
            queryClient.invalidateQueries({ queryKey: requestKeys.myRequests() });
            queryClient.invalidateQueries({ queryKey: requestKeys.all });
            queryClient.invalidateQueries({ queryKey: ['allUserRequests'] });
            break;

          default:
            queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [navigate]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('🔌 WebSocket not connected, skipping notification listeners');
      listenersRegistered.current = false;
      return;
    }

    // Prevent re-registering listeners if they're already set up for this socket
    if (listenersRegistered.current) {
      console.log('🔌 WebSocket listeners already registered, skipping');
      return;
    }

    console.log('🔌 Setting up WebSocket notification listeners');

    // Set up event listeners
    console.log('🔧 Registering WebSocket event listeners');
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:update', handleNotificationUpdate);
    socket.on('notification:bulk_update', handleBulkUpdate);

    listenersRegistered.current = true;

    // Test connection
    socket.emit('ping', (response: string) => {
      console.log('🏓 WebSocket ping test:', response);
    });

    // Cleanup listeners on unmount or socket change
    return () => {
      console.log('🧹 Cleaning up WebSocket event listeners');
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:update', handleNotificationUpdate);
      socket.off('notification:bulk_update', handleBulkUpdate);
      listenersRegistered.current = false;
    };
  }, [socket, isConnected, handleNewNotification, handleNotificationUpdate, handleBulkUpdate]);

  return {
    isConnected,
    contextHolder, // This needs to be rendered in the component tree
  };
};