import { collection, doc, setDoc, query, where, onSnapshot, orderBy, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface GameNotification {
  id: string;
  userId: string;
  matchId: string;
  cardId: string;
  matchName: string;
  cardName: string;
  gameId: string;
  gamePassword: string;
  type: 'game_id_ready';
  read: boolean;
  timestamp: any;
}

// ─── Request Notification Permission ────────────────────────────────────────
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('Notifications have been blocked by the user');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// ─── Register Service Worker ────────────────────────────────────────────────
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// ─── Save FCM Token ────────────────────────────────────────────────────────
export const saveFcmToken = async (userId: string): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return null;
  }

  try {
    // Note: For FCM web push, a VAPID key is needed.
    // If not configured, getToken will still work for foreground messages.
    const token = await getToken(messaging, {
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
    }).catch(() => null);

    if (token) {
      await setDoc(doc(db, 'fcm_tokens', userId), {
        token,
        userId,
        updatedAt: serverTimestamp(),
        platform: 'web'
      }, { merge: true });
      console.log('FCM token saved for user:', userId);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// ─── Write Notification Documents for Participants ──────────────────────────
export const sendGameIdNotifications = async (
  participantIds: string[],
  matchId: string,
  cardId: string,
  matchName: string,
  cardName: string,
  gameId: string,
  gamePassword: string
): Promise<void> => {
  if (!participantIds || participantIds.length === 0) return;

  const batch: Promise<void>[] = [];

  for (const userId of participantIds) {
    const notifId = `${cardId}_${userId}_${Date.now()}`;
    const notifRef = doc(db, 'notifications', notifId);
    
    batch.push(
      setDoc(notifRef, {
        userId,
        matchId,
        cardId,
        matchName: matchName || 'Match',
        cardName: cardName || 'Card',
        gameId,
        gamePassword,
        type: 'game_id_ready',
        read: false,
        timestamp: serverTimestamp()
      })
    );
  }

  try {
    await Promise.all(batch);
    console.log(`Notifications sent to ${participantIds.length} participants`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

// ─── Listen for New Notifications ───────────────────────────────────────────
export const listenForNotifications = (
  userId: string,
  onNewNotification: (notification: GameNotification) => void
): (() => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        const notification: GameNotification = {
          id: change.doc.id,
          userId: data.userId,
          matchId: data.matchId,
          cardId: data.cardId,
          matchName: data.matchName,
          cardName: data.cardName,
          gameId: data.gameId,
          gamePassword: data.gamePassword,
          type: data.type,
          read: data.read,
          timestamp: data.timestamp
        };
        onNewNotification(notification);
      }
    });
  });

  return unsubscribe;
};

// ─── Mark Notification as Read ──────────────────────────────────────────────
export const markNotificationRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// ─── Show Native Browser Notification ───────────────────────────────────────
export const showBrowserNotification = (
  title: string,
  body: string,
  data?: { matchId?: string; cardId?: string }
): void => {
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/icon.png',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200, 100, 200],
      tag: `game-id-${data?.cardId || 'default'}`,
      renotify: true,
      data
    } as NotificationOptions);

    notification.onclick = () => {
      window.focus();
      if (data?.matchId && data?.cardId) {
        window.location.href = `/match/${data.matchId}/card/${data.cardId}`;
      }
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  } catch (error) {
    // Fallback: use service worker notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon.png',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200, 100, 200],
          tag: `game-id-${data?.cardId || 'default'}`,
          renotify: true,
          data
        });
      });
    }
  }
};

// ─── Setup Foreground Message Handler ───────────────────────────────────────
export const setupForegroundMessaging = (
  onNotification: (payload: any) => void
): (() => void) | null => {
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      onNotification(payload);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground messaging:', error);
    return null;
  }
};
