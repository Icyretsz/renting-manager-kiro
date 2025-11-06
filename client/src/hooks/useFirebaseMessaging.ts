import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateFCMTokenMutation } from '@/hooks/useNotifications';
import {
  initializePushNotifications,
  isNotificationSupported,
  getNotificationPermission,
} from '@/services/firebaseMessaging';

interface FirebaseMessagingState {
  isSupported: boolean;
  permission: NotificationPermission;
  isInitialized: boolean;
  error: string | null;
}

export const useFirebaseMessaging = () => {
  const { isAuthenticated } = useAuth0();
  const { token, user } = useAuthStore();
  const fcmTokenMutation = useUpdateFCMTokenMutation();
  
  const [state, setState] = useState<FirebaseMessagingState>({
    isSupported: false,
    permission: 'default',
    isInitialized: false,
    error: null,
  });

  useEffect(() => {
    // Only initialize if user is authenticated and we have both token and user data
    if (!isAuthenticated || !token || !user) {
      return;
    }

    let isMounted = true;

    const initializeMessaging = async () => {
      try {
        // Check if notifications are supported
        const supported = isNotificationSupported();
        const permission = getNotificationPermission();

        if (!isMounted) return;

        setState(prev => ({
          ...prev,
          isSupported: supported,
          permission,
        }));

        if (!supported) {
          setState(prev => ({
            ...prev,
            error: 'Push notifications are not supported in this browser',
          }));
          return;
        }

        // Only initialize if permission is granted or default (to avoid unnecessary calls)
        if (permission === 'granted' || permission === 'default') {
          const initialized = await initializePushNotifications(fcmTokenMutation);
          
          if (!isMounted) return;

          setState(prev => ({
            ...prev,
            isInitialized: initialized,
            permission: getNotificationPermission(),
            error: initialized ? null : 'Failed to initialize push notifications',
          }));
        }
      } catch (error) {
        console.error('Error initializing Firebase messaging:', error);
        if (!isMounted) return;
        
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize push notifications',
        }));
      }
    };

    initializeMessaging();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token, user]); // Removed fcmTokenMutation from deps to avoid re-init

  const requestPermission = async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        // Re-initialize if permission was just granted
        const initialized = await initializePushNotifications(fcmTokenMutation);
        setState(prev => ({ ...prev, isInitialized: initialized }));
        return initialized;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
  };
};