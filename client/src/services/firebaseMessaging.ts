import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/types';

// Firebase configuration (these should be environment variables)
const firebaseConfig = {
    apiKey: "AIzaSyBCT9T1cYnPuZXsnwyLVSjW_7W_OB_ngn0",
    authDomain: "phongtro-d674b.firebaseapp.com",
    projectId: "phongtro-d674b",
    storageBucket: "phongtro-d674b.firebasestorage.app",
    messagingSenderId: "370635142111",
    appId: "1:370635142111:web:8a3aa9ff7e77b0aa6b0a6a",
    measurementId: "G-0M7N34PPLZ"
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
      console.log('FCM Token:', token);
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
        const notification: Notification = {
          id: Date.now().toString(), // Temporary ID
          userId: '', // Will be set by the server
          title: payload.notification.title || 'New Notification',
          body: payload.notification.body || '',
          type: payload.data?.type || 'system',
          readStatus: false,
          createdAt: new Date(),
        };
        
        addNotification(notification);
        
        // Show browser notification if permission is granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
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

// Send FCM token to server
export const sendTokenToServer = async (token: string): Promise<boolean> => {
  try {
    // This would be an API call to save the token on the server
    // For now, we'll just store it in localStorage
    localStorage.setItem('fcm_token', token);
    
    // TODO: Implement API call to save token
    // await api.post('/notifications/register-token', { token });
    
    return true;
  } catch (error) {
    console.error('Error sending token to server:', error);
    return false;
  }
};

// Initialize push notifications
export const initializePushNotifications = async (): Promise<boolean> => {
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

    // Request permission and get token
    const token = await requestNotificationPermission();
    if (!token) {
      console.warn('Failed to get FCM token');
      return false;
    }

    // Send token to server
    await sendTokenToServer(token);

    // Set up message listener
    setupForegroundMessageListener();

    console.log('Push notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
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