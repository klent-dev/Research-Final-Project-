import exifr from 'exifr';
import { haversineDistanceMeters, isWithinRadius } from '../utils/gpsValidation.js';

export async function readImageExif(file) {
  return exifr.parse(file, {
    gps: true,
    xmp: true,
    exif: true,
    tiff: true
  });
}

export async function validateExifGpsProximity({ file, browserLocation, radiusMeters }) {
  const metadata = await readImageExif(file);
  const exifLocation = metadata?.latitude && metadata?.longitude
    ? { latitude: metadata.latitude, longitude: metadata.longitude }
    : null;

  if (!exifLocation) {
    return {
      isValid: false,
      reason: 'The image does not include GPS EXIF metadata.',
      metadata
    };
  }

  const distanceMeters = haversineDistanceMeters(exifLocation, browserLocation);

  return {
    isValid: isWithinRadius(distanceMeters, radiusMeters),
    distanceMeters,
    exifLocation,
    metadata,
    reason: distanceMeters > radiusMeters ? 'The image GPS metadata is too far from the browser GPS location.' : null
  };
}

