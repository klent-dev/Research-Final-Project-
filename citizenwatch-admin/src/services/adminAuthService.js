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
const isAdminAuthBypassed = import.meta.env.VITE_ADMIN_AUTH_BYPASS === 'true';

export const localAdmin = {
  uid: 'local-admin',
  email: 'admin@citizenwatch.local',
  displayName: 'Local Admin',
  role: allowedRole
};

export function listenToAdminAuthChanges(callback) {
  if (isAdminAuthBypassed || !isFirebaseConfigured || !auth || !db) {
    callback(localAdmin);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      const profile = await getDoc(doc(db, 'users', user.uid));
      const role = profile.data()?.role;

      if (role === allowedRole) {
        callback({ ...user, ...profile.data(), role });
        return;
      }

      await signOut(auth);
      callback(null);
    } catch (error) {
      console.error('Unable to verify admin role.', error);
      callback(null);
    }
  });
}

export async function loginAdmin({ email, password }) {
  if (isAdminAuthBypassed || !isFirebaseConfigured || !auth) {
    return { ...localAdmin, email };
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getDoc(doc(db, 'users', credential.user.uid));
  const role = profile.data()?.role;

  if (role !== allowedRole) {
    await signOut(auth);
    throw new Error('This account is not authorized for the LGU admin portal.');
  }

  return {
    ...credential.user,
    ...profile.data(),
    role
  };
}

export function logoutAdmin() {
  if (isAdminAuthBypassed || !isFirebaseConfigured || !auth) {
    return Promise.resolve();
  }

  return signOut(auth);
}

