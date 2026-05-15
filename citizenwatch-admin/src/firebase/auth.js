import { getAuth } from 'firebase/auth';
import { firebaseApp } from './config.js';

export const auth = getAuth(firebaseApp);

