import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

// TODO: Replace with your Firebase project's config object
// You can find this in Firebase Console -> Project Settings -> General -> Web Apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  projectId: "jxmtourclub-1747c",
  storageBucket: "jxmtourclub-1747c.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics & Messaging only if supported (browser environments)
export let analytics: any = null;
export let messaging: any = null;

if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Firebase Analytics/Messaging error:", error);
  }
}
