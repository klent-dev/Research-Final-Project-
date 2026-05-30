import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/auth.js';
import { createCitizenUserProfile } from './userService.js';

export function listenToAuthChanges(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function registerCitizen({
  email,
  password,
  displayName,
  fullName,
  phoneNumber,
  barangay = ''
}) {
  if (!auth) throw new Error('Firebase Auth is not configured.');

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const resolvedName = fullName || displayName || '';

  if (resolvedName) {
    await updateProfile(credential.user, { displayName: resolvedName });
  }

  await createCitizenUserProfile(credential.user.uid, {
    fullName: resolvedName,
    email,
    phoneNumber,
    address: barangay,
    photoURL: credential.user.photoURL || ''
  });

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
