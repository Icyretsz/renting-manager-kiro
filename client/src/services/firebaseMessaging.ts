import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { useNotificationStore } from '@/stores/notificationStore';
import type { ApiResponse, Notification, NotificationDB } from '@/types';
import { UseMutationResult } from '@tanstack/react-query';

// Firebase configuration (these should be environment variables)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// VAPID key for web push notifications
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app: any = null;
let messaging: any = null;

// Initialize Firebase
export const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      messaging = getMessaging(app);
      
      // Register service worker for background notifications
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration);
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      }
    }
    return { app, messaging };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { app: null, messaging: null };
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const { messaging } = initializeFirebase();
    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey });
    if (token) {
      console.log('🔑 FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Get current FCM token (without requesting permission)
export const getCurrentFCMToken = async (): Promise<string | null> => {
  try {
    if (Notification.permission !== 'granted') {
      return null;
    }

    const { messaging } = initializeFirebase();
    if (!messaging) {
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (error) {
    console.error('Error getting current FCM token:', error);
    return null;
  }
};

// Set up foreground message listener
export const setupForegroundMessageListener = () => {
  try {
    const { messaging } = initializeFirebase();
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return;
    }

    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Foreground message received:', payload);
      
      // Handle the message and add to notification store
      const { addNotification } = useNotificationStore.getState();
      
      if (payload.notification) {
        const notification: NotificationDB = {
          id: Date.now().toString(), // Temporary ID
          userId: '', // Will be set by the server
          title: payload.notification.title || 'New Notification',
          message: payload.notification.body || '',
          type: payload.data?.type || 'system',
          readStatus: false,
          createdAt: new Date(),
        };
        
        addNotification(notification);
        
        // Show browser notification if permission is granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
  }
};

// Initialize push notifications
export const initializePushNotifications = async (fcmTokenMutation: UseMutationResult<ApiResponse<void>, Error, string, unknown>): Promise<boolean> => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers');
      return false;
    }

    // Initialize Firebase
    const { messaging } = initializeFirebase();
    if (!messaging) {
      console.error('Failed to initialize Firebase messaging');
      return false;
    }

    // Only proceed if permission is granted
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted, skipping token registration');
      return false;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey });
    if (!token) {
      console.warn('Failed to get FCM token');
      return false;
    }

    console.log('🔄 Registering FCM token with server...');
    
    // Send token to server with retry logic
    try {
      await fcmTokenMutation.mutateAsync(token);
      console.log('✅ FCM token registered successfully');
    } catch (error) {
      console.error('❌ Failed to register FCM token:', error);
      // Don't return false here - we still want to set up the listener
    }

    // Set up message listener
    setupForegroundMessageListener();

    // Set up token refresh listener (returns cleanup function)
    //const cleanupTokenListener = setupTokenRefreshListener(fcmTokenMutation);

    console.log('✅ Push notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
    return false;
  }
};

// Check if notifications are supported and enabled
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Check current notification permission status
export const getNotificationPermission = (): NotificationPermission => {
  return Notification.permission;
};

// Set up token refresh listener (Firebase v9+ doesn't have onTokenRefresh, tokens are more stable)
export const setupTokenRefreshListener = (fcmTokenMutation: UseMutationResult<ApiResponse<void>, Error, string, unknown>) => {
  // In Firebase v9+, tokens are more stable and refresh less frequently
  // We can implement a periodic check instead if needed
  console.log('Token refresh listener setup (tokens are stable in Firebase v9+)');
  
  // Optional: Set up periodic token validation (every 24 hours)
  const tokenValidationInterval = setInterval(async () => {
    try {
      const currentToken = await getCurrentFCMToken();
      if (currentToken) {
        // Optionally re-register token periodically
        console.log('🔄 Periodic token validation');
        await fcmTokenMutation.mutateAsync(currentToken);
      }
    } catch (error) {
      console.error('Error in periodic token validation:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours

  // Return cleanup function
  return () => {
    clearInterval(tokenValidationInterval);
  };
};