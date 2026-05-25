import exifr from 'exifr';
import { haversineDistanceMeters, isWithinRadius } from '../utils/gpsValidation.js';

// Reads image metadata and normalizes it into a compact EXIF object that is safe to store.
const EXIF_PARSE_OPTIONS = {
  gps: true,
  exif: true,
  ifd0: true,
  xmp: true,
  iptc: true,
  tiff: true
};

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toStringValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function normalizeDms(value, ref = '') {
  if (typeof value === 'number') {
    return value;
  }

  if (Array.isArray(value) && value.length >= 3) {
    const degrees = toNumber(value[0]) ?? 0;
    const minutes = toNumber(value[1]) ?? 0;
    const seconds = toNumber(value[2]) ?? 0;
    const decimal = degrees + minutes / 60 + seconds / 3600;
    return ['S', 'W'].includes(String(ref).toUpperCase()) ? -decimal : decimal;
  }

  return toNumber(value);
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

// Android and iPhone cameras may store GPS as decimal coordinates or DMS arrays; this accepts both.
function normalizeGps(metadata = {}, fallbackGps = {}) {
  const latitude = normalizeDms(
    pickFirst(
      metadata.latitude,
      metadata.Latitude,
      metadata.GPSLatitude,
      metadata.GPSDestLatitude,
      fallbackGps?.latitude,
      fallbackGps?.GPSLatitude
    ),
    pickFirst(metadata.GPSLatitudeRef, metadata.GPSDestLatitudeRef, fallbackGps?.GPSLatitudeRef)
  );
  const longitude = normalizeDms(
    pickFirst(
      metadata.longitude,
      metadata.Longitude,
      metadata.GPSLongitude,
      metadata.GPSDestLongitude,
      fallbackGps?.longitude,
      fallbackGps?.GPSLongitude
    ),
    pickFirst(metadata.GPSLongitudeRef, metadata.GPSDestLongitudeRef, fallbackGps?.GPSLongitudeRef)
  );
  const altitude = toNumber(pickFirst(metadata.altitude, metadata.GPSAltitude, fallbackGps?.altitude));
  const altitudeRef = toNumber(pickFirst(metadata.GPSAltitudeRef, fallbackGps?.GPSAltitudeRef));
  const accuracy = toNumber(pickFirst(
    metadata.GPSHPositioningError,
    metadata.hPositioningError,
    fallbackGps?.GPSHPositioningError
  ));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
    altitude,
    altitudeRef,
    accuracy,
    dop: toNumber(pickFirst(metadata.GPSDOP, fallbackGps?.GPSDOP)),
    speed: toNumber(pickFirst(metadata.GPSSpeed, fallbackGps?.GPSSpeed)),
    speedRef: toStringValue(pickFirst(metadata.GPSSpeedRef, fallbackGps?.GPSSpeedRef)),
    imgDirection: toNumber(pickFirst(metadata.GPSImgDirection, fallbackGps?.GPSImgDirection)),
    mapDatum: toStringValue(pickFirst(metadata.GPSMapDatum, fallbackGps?.GPSMapDatum)),
    dateStamp: toStringValue(pickFirst(metadata.GPSDateStamp, fallbackGps?.GPSDateStamp)),
    timeStamp: toStringValue(pickFirst(metadata.GPSTimeStamp, fallbackGps?.GPSTimeStamp))
  };
}

function parseExifDateString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{4})[:-](\d{2})[:-](\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function normalizeTimestamp(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const exifDate = parseExifDateString(value);

  if (exifDate) {
    return exifDate.toISOString();
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString();
}

function normalizeGpsTimeValue(value) {
  if (Array.isArray(value)) {
    return value.map((part) => String(Math.trunc(Number(part) || 0)).padStart(2, '0')).join(':');
  }

  return String(value || '').trim();
}

function normalizeGpsTimestamp(dateStamp, timeStamp) {
  if (!dateStamp || !timeStamp) {
    return '';
  }

  const normalizedDate = String(dateStamp).trim().replaceAll(':', '-');
  const normalizedTime = normalizeGpsTimeValue(timeStamp);

  return normalizeTimestamp(`${normalizedDate}T${normalizedTime}Z`);
}

function getImageDimension(metadata, ...keys) {
  return toNumber(pickFirst(...keys.map((key) => metadata?.[key])));
}

// Keep a compact raw summary for research/debugging without risking Firestore document size.
function summarizeRawExif(metadata = {}) {
  const keys = Object.keys(metadata);
  const selectedKeys = [
    'Make',
    'Model',
    'Software',
    'LensMake',
    'LensModel',
    'DateTimeOriginal',
    'CreateDate',
    'ModifyDate',
    'GPSLatitude',
    'GPSLatitudeRef',
    'GPSLongitude',
    'GPSLongitudeRef',
    'GPSAltitude',
    'GPSAltitudeRef',
    'GPSHPositioningError',
    'GPSDateStamp',
    'GPSTimeStamp',
    'ImageWidth',
    'ImageHeight',
    'ExifImageWidth',
    'ExifImageHeight',
    'Orientation'
  ];

  return {
    keyCount: keys.length,
    keys: keys.slice(0, 80),
    values: Object.fromEntries(
      selectedKeys
        .filter((key) => metadata[key] !== undefined && metadata[key] !== null)
        .map((key) => [key, metadata[key]])
    )
  };
}

function buildTimestampMetadata(metadata = {}, fallbackGps = {}) {
  const original = normalizeTimestamp(metadata.DateTimeOriginal);
  const created = normalizeTimestamp(metadata.CreateDate);
  const modified = normalizeTimestamp(pickFirst(metadata.ModifyDate, metadata.DateTime));
  const gps = normalizeGpsTimestamp(
    pickFirst(metadata.GPSDateStamp, fallbackGps?.GPSDateStamp),
    pickFirst(metadata.GPSTimeStamp, fallbackGps?.GPSTimeStamp)
  );

  return {
    original,
    created,
    modified,
    gps,
    primary: pickFirst(original, created, modified, gps, '')
  };
}

// Main EXIF reader used in Step 1 before the preview image is compressed.
export async function readImageExif(file) {
  const warnings = [];

  if (!file) {
    return {
      hasExif: false,
      hasGps: false,
      hasTimestamp: false,
      hasCameraInfo: false,
      gps: null,
      timestamp: '',
      timestamps: { original: '', created: '', modified: '', gps: '', primary: '' },
      camera: { make: '', model: '', software: '', lensMake: '', lensModel: '' },
      image: { width: null, height: null, orientation: null, name: '', type: '', size: null, lastModified: '' },
      rawExif: null,
      rawExifSummary: { keyCount: 0, keys: [], values: {} },
      warnings: ['No image file was provided.'],
      validationStatus: 'unavailable'
    };
  }

  try {
    const [metadata, fallbackGps] = await Promise.all([
      exifr.parse(file, EXIF_PARSE_OPTIONS).catch((error) => {
        warnings.push('Full EXIF metadata could not be read.');
        console.warn('Full EXIF parsing failed.', error);
        return null;
      }),
      exifr.gps(file).catch((error) => {
        warnings.push('GPS metadata fallback could not be read.');
        console.warn('EXIF GPS fallback failed.', error);
        return null;
      })
    ]);

    const safeMetadata = metadata || {};
    const gps = normalizeGps(safeMetadata, fallbackGps);
    const timestamps = buildTimestampMetadata(safeMetadata, fallbackGps);
    const timestamp = timestamps.primary;
    const camera = {
      make: toStringValue(pickFirst(safeMetadata.Make, safeMetadata.make)),
      model: toStringValue(pickFirst(safeMetadata.Model, safeMetadata.model)),
      software: toStringValue(pickFirst(safeMetadata.Software, safeMetadata.software)),
      lensMake: toStringValue(pickFirst(safeMetadata.LensMake, safeMetadata.lensMake)),
      lensModel: toStringValue(pickFirst(safeMetadata.LensModel, safeMetadata.lensModel))
    };
    const image = {
      width: getImageDimension(safeMetadata, 'ImageWidth', 'ExifImageWidth', 'PixelXDimension'),
      height: getImageDimension(safeMetadata, 'ImageHeight', 'ExifImageHeight', 'PixelYDimension'),
      orientation: pickFirst(safeMetadata.Orientation, safeMetadata.orientation, null),
      name: file.name || '',
      type: file.type || '',
      size: file.size || null,
      lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : ''
    };
    const hasExif = Boolean(metadata && Object.keys(metadata).length > 0);
    const hasGps = Boolean(gps);
    const hasTimestamp = Boolean(timestamp);
    const hasCameraInfo = Boolean(camera.make || camera.model || camera.software || camera.lensMake || camera.lensModel);

    if (!hasExif) {
      warnings.push('No readable EXIF metadata was found.');
    }

    if (!hasGps) {
      warnings.push('No GPS metadata found in photo.');
    }

    return {
      hasExif,
      hasGps,
      hasTimestamp,
      hasCameraInfo,
      gps,
      timestamp,
      timestamps,
      camera,
      image,
      rawExif: null,
      rawExifSummary: summarizeRawExif(safeMetadata),
      warnings,
      validationStatus: hasGps ? 'photo_gps_detected' : 'no_gps_data'
    };
  } catch (error) {
    console.warn('Unable to read image EXIF metadata.', error);
    return {
      hasExif: false,
      hasGps: false,
      hasTimestamp: false,
      hasCameraInfo: false,
      gps: null,
      timestamp: '',
      timestamps: { original: '', created: '', modified: '', gps: '', primary: '' },
      camera: { make: '', model: '', software: '', lensMake: '', lensModel: '' },
      image: { width: null, height: null, orientation: null, name: '', type: '', size: null, lastModified: '' },
      rawExif: null,
      rawExifSummary: { keyCount: 0, keys: [], values: {} },
      warnings: ['Unable to read image metadata safely.'],
      validationStatus: 'unavailable'
    };
  }
}

export async function validateExifGpsProximity({ file, browserLocation, radiusMeters }) {
  const metadata = await readImageExif(file);
  const exifLocation = metadata.gps
    ? { latitude: metadata.gps.lat, longitude: metadata.gps.lng }
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
