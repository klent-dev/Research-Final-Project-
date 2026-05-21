import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/storage.js';

export async function uploadReportPhoto({ file, reportId, userId }) {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  const fileName = file?.name || 'report-photo.jpg';
  const fileType = file?.type || 'image/jpeg';
  const safeName = fileName.replaceAll(' ', '-').toLowerCase();
  const photoRef = ref(storage, `reports/${userId}/${reportId}/${Date.now()}-${safeName}`);
  const snapshot = await uploadBytes(photoRef, file, {
    contentType: fileType
  });

  return getDownloadURL(snapshot.ref);
}

export async function deleteReportPhotoByUrl(photoUrl) {
  if (!photoUrl) {
    return;
  }

  if (!storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  const photoRef = ref(storage, photoUrl);
  await deleteObject(photoRef);
}

