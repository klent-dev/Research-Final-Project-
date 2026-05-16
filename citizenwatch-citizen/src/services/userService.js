import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore.js';

export async function createCitizenUserProfile(uid, { fullName, email, phoneNumber }) {
  if (!db) throw new Error('Firestore is not configured.');

  const userRef = doc(db, 'users', uid);

  await setDoc(userRef, {
    fullName,
    email,
    phoneNumber,
    role: 'citizen',
    createdAt: serverTimestamp()
  });
}
