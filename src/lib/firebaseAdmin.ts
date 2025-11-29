import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin with either JSON from env or GOOGLE_APPLICATION_CREDENTIALS file.
const serviceAccountJson = process.env.FIREBASE_ADMIN_SA;
const credential = serviceAccountJson
  ? cert(JSON.parse(serviceAccountJson))
  : applicationDefault();

const adminApp = getApps()[0] ?? initializeApp({ credential });

export const adminAuth = getAuth(adminApp);
export type { DecodedIdToken };
