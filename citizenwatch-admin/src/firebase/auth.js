import { getAuth } from 'firebase/auth';
import { firebaseApp } from './config.js';

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

