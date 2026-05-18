import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/auth.js';
import { db } from '../firebase/firestore.js';
import { isFirebaseConfigured } from '../firebase/config.js';

const allowedRole = import.meta.env.VITE_ADMIN_ALLOWED_ROLE ?? 'lgu_admin';

export const demoAdmin = {
  uid: 'demo-admin',
  email: 'admin@citizenwatch.local',
  displayName: 'Demo Admin',
  role: allowedRole
};

export function listenToAdminAuthChanges(callback) {
  if (!isFirebaseConfigured || !auth || !db) {
    callback(demoAdmin);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    const profile = await getDoc(doc(db, 'users', user.uid));
    const role = profile.data()?.role;
    callback(role === allowedRole ? { ...user, role } : null);
  });
}

export async function loginAdmin({ email, password }) {
  if (!isFirebaseConfigured || !auth) {
    return { ...demoAdmin, email };
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export function logoutAdmin() {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve();
  }

  return signOut(auth);
}

