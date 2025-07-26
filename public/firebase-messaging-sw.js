// Firebase service worker for background messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "demo-api-key",
  authDomain: "nextsignal-demo.firebaseapp.com",
  projectId: "nextsignal-demo",
  storageBucket: "nextsignal-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
});

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'NextSignal Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New alert in your area',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'nextsignal-notification',
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/logo192.png'
      }
    ],
    requireInteraction: payload.data?.severity === 'critical',
    silent: false,
    timestamp: Date.now()
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'view') {
    // Open the app to dashboard or specific event
    const urlToOpen = data.eventId 
      ? `${self.location.origin}/dashboard?event=${data.eventId}`
      : `${self.location.origin}/dashboard`;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data
            });
            return;
          }
        }
        // No window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    console.log('Notification dismissed');
  } else {
    // Default click action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(`${self.location.origin}/dashboard`);
        }
      })
    );
  }
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Update notification badge count
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(event.data.count);
    }
  }
}); 