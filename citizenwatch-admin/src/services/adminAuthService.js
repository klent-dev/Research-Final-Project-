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
const isAdminAuthBypassed = import.meta.env.VITE_ADMIN_AUTH_BYPASS !== 'false';

export const localAdmin = {
  uid: 'local-admin',
  email: 'admin@citizenwatch.local',
  displayName: 'Local Admin',
  role: allowedRole
};

export function listenToAdminAuthChanges(callback) {
  // TODO: Set VITE_ADMIN_AUTH_BYPASS=false when real admin credentials are ready.
  if (isAdminAuthBypassed || !isFirebaseConfigured || !auth || !db) {
    callback(localAdmin);
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
  // TODO: Set VITE_ADMIN_AUTH_BYPASS=false when real admin credentials are ready.
  if (isAdminAuthBypassed || !isFirebaseConfigured || !auth) {
    return { ...localAdmin, email };
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export function logoutAdmin() {
  if (isAdminAuthBypassed || !isFirebaseConfigured || !auth) {
    return Promise.resolve();
  }

  return signOut(auth);
}

