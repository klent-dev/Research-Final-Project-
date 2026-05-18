import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from './config.js';

export const db = firebaseApp ? getFirestore(firebaseApp) : null;

