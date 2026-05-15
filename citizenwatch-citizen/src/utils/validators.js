export function required(value) {
  return value === undefined || value === null || value === '' ? 'This field is required.' : null;
}

export function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'));
}

