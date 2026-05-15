import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from './config.js';

export const db = getFirestore(firebaseApp);

