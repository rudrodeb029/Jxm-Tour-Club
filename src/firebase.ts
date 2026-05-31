import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

// TODO: Replace with your Firebase project's config object
// You can find this in Firebase Console -> Project Settings -> General -> Web Apps
const firebaseConfig = {
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  databaseURL: "https://jxmtourclub-1747c-default-rtdb.firebaseio.com",
  projectId: "jxmtourclub-1747c",
  storageBucket: "jxmtourclub-1747c.firebasestorage.app",
  messagingSenderId: "194765747449",
  appId: "1:194765747449:web:36de7e15e228703d651e28"
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
