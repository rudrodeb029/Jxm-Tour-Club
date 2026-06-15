import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  registerServiceWorker,
  requestNotificationPermission,
  saveFcmToken,
  listenForNotifications,
  setupForegroundMessaging,
  showBrowserNotification,
  type GameNotification
} from '../services/notificationService';
import NotificationToast from './NotificationToast';

/**
 * NotificationManager - Handles service worker registration, notification permissions,
 * FCM token management, and real-time notification listening.
 * 
 * Place this component inside the Router and Auth providers so it has access to
 * the current user and can navigate.
 */
const NotificationManager = () => {
  const { currentUser } = useAuth();
  const [activeNotification, setActiveNotification] = useState<GameNotification | null>(null);
  const notificationQueue = useRef<GameNotification[]>([]);
  const hasRequestedPermission = useRef(false);
  const swRegistered = useRef(false);

  // Register service worker once on mount
  useEffect(() => {
    if (swRegistered.current) return;
    swRegistered.current = true;

    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('✅ Service worker registered for notifications');
      }
    });
  }, []);

  // Request notification permission and save FCM token when user logs in
  useEffect(() => {
    if (!currentUser || hasRequestedPermission.current) return;
    hasRequestedPermission.current = true;

    const setupNotifications = async () => {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        // Try to save FCM token (may fail without VAPID key, that's OK)
        await saveFcmToken(currentUser.uid).catch(() => {});
      }
    };

    // Slight delay to not block initial render
    const timer = setTimeout(setupNotifications, 2000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  // Listen for new notifications from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = listenForNotifications(currentUser.uid, (notification) => {
      // Show browser notification (works even in background tab)
      showBrowserNotification(
        `🎮 ${notification.cardName} — Game ID Ready!`,
        `Room ID: ${notification.gameId} | Password: ${notification.gamePassword}`,
        { matchId: notification.matchId, cardId: notification.cardId }
      );

      // Queue the in-app toast
      if (activeNotification) {
        notificationQueue.current.push(notification);
      } else {
        setActiveNotification(notification);
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeNotification]);

  // Setup FCM foreground message handler
  useEffect(() => {
    const unsubscribe = setupForegroundMessaging((payload) => {
      console.log('FCM foreground message:', payload);
      // FCM foreground messages are handled by the Firestore listener above
    });
    return () => { unsubscribe?.(); };
  }, []);

  // Show next queued notification when current one is dismissed
  const handleDismiss = () => {
    setActiveNotification(null);
    setTimeout(() => {
      if (notificationQueue.current.length > 0) {
        setActiveNotification(notificationQueue.current.shift()!);
      }
    }, 400);
  };

  return (
    <NotificationToast
      notification={activeNotification}
      onDismiss={handleDismiss}
    />
  );
};

export default NotificationManager;
