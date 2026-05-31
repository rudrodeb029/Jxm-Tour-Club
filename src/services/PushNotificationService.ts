import { PushNotifications } from '@capacitor/push-notifications';
import type { Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export class PushNotificationService {
  static async initialize(userId: string) {
    if (Capacitor.isNativePlatform()) {
      await this.initNative(userId);
    } else {
      await this.initWeb(userId);
    }
  }

  private static async initNative(userId: string) {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.error('User denied push notification permissions');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      await this.saveTokenToFirestore(userId, token.value, 'android');
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  }

  private static async initWeb(userId: string) {
    if (!messaging) return;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // You'll need a VAPID key from your Firebase Console (Cloud Messaging tab)
        const currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' });
        if (currentToken) {
          console.log('Web Push token: ' + currentToken);
          await this.saveTokenToFirestore(userId, currentToken, 'web');
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }

        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          // Customize notification here
          new Notification(payload.notification?.title || 'New Message', {
            body: payload.notification?.body,
            icon: '/firebase-logo.png'
          });
        });
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
    }
  }

  private static async saveTokenToFirestore(userId: string, token: string, platform: 'web' | 'android' | 'ios') {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        fcmTokens: {
          [token]: platform
        }
      }, { merge: true });
    } catch (e) {
      console.error("Error saving FCM token", e);
    }
  }
}
