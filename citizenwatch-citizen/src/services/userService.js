import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore.js';

export async function createCitizenUserProfile(uid, {
  fullName,
  email,
  phoneNumber,
  address = '',
  photoURL = ''
}) {
  if (!db) throw new Error('Firestore is not configured.');

  const userRef = doc(db, 'users', uid);
  const existingProfile = await getDoc(userRef);

  await setDoc(userRef, {
    uid,
    fullName,
    email,
    phoneNumber,
    address,
    role: 'citizen',
    photoURL,
    ...(!existingProfile.exists() ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function getUserProfile(uid) {
  if (!db || !uid) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function updateCitizenUserProfile(uid, profile) {
  if (!db || !uid) throw new Error('Firestore is not configured.');

  await setDoc(doc(db, 'users', uid), {
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber || '',
    address: profile.address || '',
    photoURL: profile.photoURL || '',
    email: profile.email,
    uid,
    updatedAt: serverTimestamp()
  }, {
    merge: true
  });
}
