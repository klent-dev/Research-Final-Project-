import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/storage.js';

export async function uploadReportPhoto({ file, reportId, userId }) {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  const safeName = file.name.replaceAll(' ', '-').toLowerCase();
  const photoRef = ref(storage, `reports/${userId}/${reportId}/${Date.now()}-${safeName}`);
  const snapshot = await uploadBytes(photoRef, file, {
    contentType: file.type
  });

  return getDownloadURL(snapshot.ref);
}

