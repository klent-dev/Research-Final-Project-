import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const requiredFirebaseEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

function isConfiguredValue(value) {
  return Boolean(value) && !String(value).startsWith('YOUR_');
}

export const missingFirebaseEnvKeys = requiredFirebaseEnvKeys.filter(
  (key) => !isConfiguredValue(import.meta.env[key])
);

export const isFirebaseConfigured = missingFirebaseEnvKeys.length === 0;

export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const analytics =
  firebaseApp && isConfiguredValue(firebaseConfig.measurementId) && typeof window !== 'undefined'
    ? getAnalytics(firebaseApp)
    : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;

if (!isFirebaseConfigured) {
  console.warn(
    `Firebase is not configured. Replace placeholder VITE_FIREBASE_* values in .env. Missing: ${missingFirebaseEnvKeys.join(', ')}`
  );
}

export default firebaseApp;
