import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/auth.js';
import { db } from '../firebase/firestore.js';

const allowedRole = import.meta.env.VITE_ADMIN_ALLOWED_ROLE ?? 'lgu_admin';

export function listenToAdminAuthChanges(callback) {
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
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export function logoutAdmin() {
  return signOut(auth);
}

