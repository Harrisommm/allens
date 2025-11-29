import admin from 'firebase-admin';

// Initialize Firebase Admin with env JSON or GOOGLE_APPLICATION_CREDENTIALS.
const serviceAccountJson = process.env.FIREBASE_ADMIN_SA;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccountJson
      ? admin.credential.cert(JSON.parse(serviceAccountJson))
      : admin.credential.applicationDefault(),
  });
}

export default admin;
