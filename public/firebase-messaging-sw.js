// Firebase Messaging Service Worker
// This handles background push notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  projectId: "jxmtourclub-1747c",
  storageBucket: "jxmtourclub-1747c.firebasestorage.app",
  messagingSenderId: "194765747449",
  appId: "1:194765747449:web:36de7e15e228703d651e28"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || '🎮 JXM Tour Club';
  const notificationOptions = {
    body: payload.notification?.body || 'Game ID & Password are ready!',
    icon: '/icon.png',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'game-id-notification',
    renotify: true,
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open Match' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const matchId = event.notification.data?.matchId;
  const cardId = event.notification.data?.cardId;
  let url = '/';
  
  if (matchId && cardId) {
    url = `/match/${matchId}/card/${cardId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
