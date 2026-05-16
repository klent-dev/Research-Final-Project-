import { getStorage } from 'firebase/storage';
import { firebaseApp } from './config.js';

export const storage = firebaseApp ? getStorage(firebaseApp) : null;
