import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance;
try {
  // Try to reuse existing auth if already initialized.
  authInstance = getAuth(app);
} catch {
  // Lazy-require RN persistence helper; fall back to memory if unavailable.
  let rnPersistence: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rnAuth = require('firebase/auth/react-native');
    rnPersistence = rnAuth.getReactNativePersistence
      ? rnAuth.getReactNativePersistence(AsyncStorage)
      : undefined;
  } catch {
    rnPersistence = undefined;
  }

  authInstance = rnPersistence
    ? initializeAuth(app, { persistence: rnPersistence })
    : initializeAuth(app);
}

export const auth = authInstance;
