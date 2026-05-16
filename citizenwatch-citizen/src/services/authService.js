import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/auth.js';

export function listenToAuthChanges(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function registerCitizen({ email, password, displayName }) {
  if (!auth) throw new Error('Firebase Auth is not configured.');

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
}

export async function loginCitizen({ email, password }) {
  if (!auth) throw new Error('Firebase Auth is not configured.');

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export function logoutCitizen() {
  if (!auth) return Promise.resolve();

  return signOut(auth);
}
