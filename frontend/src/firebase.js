import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDCDgcMIB_-OtDq14dTtX9BN6_DDB6xOMM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "carrr-c4bc0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "carrr-c4bc0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "carrr-c4bc0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "452080257709",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:452080257709:web:374bafd2649c8fb1c51424",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z69VWEWTQ0"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics initialized safely for browser runtime
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    analytics = null;
  });
}

export { analytics };
export default app;
