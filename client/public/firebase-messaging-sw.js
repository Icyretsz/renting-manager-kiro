// Firebase messaging service worker for handling background notifications

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBCT9T1cYnPuZXsnwyLVSjW_7W_OB_ngn0",
    authDomain: "phongtro-d674b.firebaseapp.com",
    projectId: "phongtro-d674b",
    storageBucket: "phongtro-d674b.firebasestorage.app",
    messagingSenderId: "370635142111",
    appId: "1:370635142111:web:8a3aa9ff7e77b0aa6b0a6a",
    measurementId: "G-0M7N34PPLZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Get notification data
  const notificationData = event.notification.data;
  
  if (event.action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Try to focus existing window or open new one
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          // Send message to the React app to handle navigation and query invalidation
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notificationType: notificationData?.type,
            notificationData: notificationData
          });
          
          // Focus the existing window (React app will handle navigation)
          return client.focus();
        }
      }
      // If no window is open, open a new one at the home page
      // The React app will handle navigation once it loads
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});