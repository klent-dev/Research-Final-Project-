import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaCamera,
  FaCameraRetro,
  FaCalendarAlt,
  FaCheckCircle,
  FaCrosshairs,
  FaExclamationTriangle,
  FaFileUpload,
  FaGavel,
  FaInfo,
  FaLightbulb,
  FaMapMarkerAlt,
  FaTrash,
  FaTimes
} from 'react-icons/fa';
import { useReportDraft } from '../../context/ReportDraftContext.jsx';
import { reverseGeocodeLocation } from '../../services/geocodingService.js';
import { readImageExif } from '../../services/exifValidationService.js';
import { geolocationErrorMessage, getBestDevicePosition, normalizePositionLocation } from '../../utils/deviceLocation.js';
import { getGpsAccuracyLevel } from '../../utils/locationValidation.js';

const tips = [
  'Capture both a close-up and a wide shot for context.',
  'Ensure there is enough natural light for clarity.',
  'Avoid blurry shots; hold the device steady.'
];

function formatFileSize(file) {
  if (!file?.size) {
    return '';
  }

  if (file.size < 1024 * 1024) {
    return `${Math.max(1, Math.round(file.size / 1024))} KB`;
  }

  return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMetadataTimestamp(value) {
  if (!value) {
    return 'Waiting for report submission';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Waiting for report submission';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toIsoTimestamp(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read selected photo.'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error('Unable to prepare selected photo preview.'));
    image.onload = () => resolve(image);
    image.src = dataUrl;
  });
}

async function createPreviewDataUrl(file) {
  const originalDataUrl = await readFileAsDataUrl(file);

  if (!file?.type?.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return originalDataUrl;
  }

  try {
    const image = await loadImage(originalDataUrl);
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      return originalDataUrl;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (error) {
    console.warn('Unable to compress selected photo preview.', error);
    return originalDataUrl;
  }
}

function getMetadataStatus({ draft, hasLocation, hasSelectedPhoto }) {
  const validationStatus = draft.locationValidation?.status || '';

  if (!hasSelectedPhoto) {
    return {
      tone: 'waiting',
      badge: 'Waiting',
      icon: FaInfo,
      title: 'Waiting for photo upload',
      helper: 'Photos taken directly from your camera usually contain GPS metadata.'
    };
  }

  if (validationStatus === 'suspicious') {
    return {
      tone: 'warning',
      badge: 'Needs Review',
      icon: FaExclamationTriangle,
      title: 'Photo location differs from device location',
      helper: 'LGU staff will review the GPS difference during validation.'
    };
  }

  if (draft.hasExifGps) {
    return {
      tone: 'success',
      badge: 'Photo GPS Verified',
      icon: FaCheckCircle,
      title: 'Photo GPS metadata detected',
      helper: 'Location extracted from uploaded photo.'
    };
  }

  if (hasLocation && draft.location?.source === 'gps') {
    return {
      tone: 'fallback',
      badge: 'Device GPS',
      icon: FaCrosshairs,
      title: 'Using current device location',
      helper: 'No GPS metadata was found in the photo.'
    };
  }

  if (hasLocation && draft.location?.source === 'manual') {
    return {
      tone: 'fallback',
      badge: 'Manual Location',
      icon: FaMapMarkerAlt,
      title: 'Using manually entered location',
      helper: 'No GPS metadata was found in the photo.'
    };
  }

  if (draft.metadataPreview?.location === 'Metadata pending validation') {
    return {
      tone: 'warning',
      badge: 'No GPS Data',
      icon: FaExclamationTriangle,
      title: 'No GPS metadata found in photo',
      helper: 'Using device GPS instead.'
    };
  }

  return {
    tone: 'warning',
    badge: 'No GPS Data',
    icon: FaExclamationTriangle,
    title: 'Location unavailable',
    helper: 'Allow GPS or enter location manually.'
  };
}

function getDeviceGpsStatus(draft, isSamplingDeviceGps) {
  if (isSamplingDeviceGps) {
    return {
      label: 'Checking GPS',
      value: 'Finding best device GPS reading...'
    };
  }

  const deviceLocation = draft.deviceLocation;
  const accuracy = Number(deviceLocation?.accuracy);

  if (
    !Number.isFinite(Number(deviceLocation?.lat)) ||
    !Number.isFinite(Number(deviceLocation?.lng))
  ) {
    return {
      label: 'Device GPS',
      value: 'Not captured yet'
    };
  }

  const accuracyLevel = getGpsAccuracyLevel(accuracy);

  return {
    label: `Device GPS (${accuracyLevel.label})`,
    value: Number.isFinite(accuracy)
      ? `+/- ${Math.round(accuracy)}m`
      : 'Available'
  };
}

export default function CreateReportPage() {
  const { draft, updateDraft, updatePhoto } = useReportDraft();
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState(() => draft.selectedFile || null);
  const [previewUrl, setPreviewUrl] = useState(() => draft.photoPreview || '');
  const [stepError, setStepError] = useState(() => location.state?.validationError || '');
  const [isSamplingDeviceGps, setIsSamplingDeviceGps] = useState(false);
  const hasSelectedPhoto = Boolean(previewUrl || draft.photoPreview);
  const hasLocation = Boolean(
    Number.isFinite(Number(draft?.location?.lat)) &&
    Number.isFinite(Number(draft?.location?.lng))
  );
  const currentLocation = !hasSelectedPhoto
    ? 'Waiting for photo upload'
    : draft.hasExifGps
      ? 'Photo GPS detected'
      : hasLocation
        ? draft.location.address
        : draft?.metadataPreview?.location || 'Metadata pending validation';
  const timestamp = formatMetadataTimestamp(draft?.exifTimestamp);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const objectUrlRef = useRef('');
  const scrollPositionRef = useRef(0);
  const pendingCaptureSourceRef = useRef('gallery');
  const navigate = useNavigate();
  const selectedFileName = selectedFile?.name || draft.fileName || '';
  const selectedFileSize = selectedFile ? formatFileSize(selectedFile) : draft.fileSize || '';
  const metadataStatus = getMetadataStatus({ draft, hasLocation, hasSelectedPhoto });
  const MetadataStatusIcon = metadataStatus.icon;
  const deviceGpsStatus = getDeviceGpsStatus(draft, isSamplingDeviceGps);

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  function handleUseCamera() {
    scrollPositionRef.current = window.scrollY;
    pendingCaptureSourceRef.current = 'camera';
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    cameraInputRef.current?.click();
  }

  function handleChooseFile() {
    scrollPositionRef.current = window.scrollY;
    pendingCaptureSourceRef.current = 'gallery';
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const [file] = event.target.files;
    fileInputRef.current?.blur();
    cameraInputRef.current?.blur();

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current, left: 0, behavior: 'auto' });
    });

    if (!file) {
      return;
    }

    if (!file.type?.startsWith('image/')) {
      setStepError('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextPreviewUrl;
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setStepError('');

    void processSelectedPhoto(file);
  }

  // Step 1 photo pipeline: create a preview, extract EXIF, then sample device GPS as fallback.
  async function processSelectedPhoto(file) {
    try {
      const photoPreview = await createPreviewDataUrl(file);
      updatePhoto(file, photoPreview);
      const metadataResult = await extractPhotoMetadata(file, photoPreview);
      void captureStepOneDeviceLocation({
        useAsFallbackLocation: !metadataResult?.hasExifGps
      });
    } catch (error) {
      console.warn('Unable to prepare selected photo.', error);
      setStepError('Unable to prepare this image. Please choose another photo.');
    }
  }

  async function enrichLocationAddress(locationData) {
    try {
      return await reverseGeocodeLocation(locationData) || locationData;
    } catch (error) {
      console.warn('Unable to reverse geocode device GPS.', error);
      return locationData;
    }
  }

  // Captures early device GPS so Step 1 can already show accuracy when the photo has no GPS EXIF.
  async function captureStepOneDeviceLocation({ useAsFallbackLocation = false } = {}) {
    if (!navigator.geolocation) {
      return;
    }

    setIsSamplingDeviceGps(true);

    try {
      const position = await getBestDevicePosition({
        sampleMs: 6500,
        timeout: 14000,
        targetAccuracy: 30
      });
      const sampledLocation = normalizePositionLocation(position, 'gps');

      if (!sampledLocation) {
        return;
      }

      const nextDeviceLocation = await enrichLocationAddress(sampledLocation);

      updateDraft({
        deviceLocation: nextDeviceLocation,
        ...(useAsFallbackLocation ? { location: nextDeviceLocation } : {})
      });
    } catch (error) {
      console.warn('Step 1 device GPS sampling failed.', error);
      updateDraft({
        deviceLocationError: geolocationErrorMessage(error)
      });
    } finally {
      setIsSamplingDeviceGps(false);
    }
  }

  // Reads the original uploaded file, because compressed previews usually lose EXIF metadata.
  async function extractPhotoMetadata(file, photoPreview = '') {
    try {
      const exifMetadata = await readImageExif(file);
      const exifLat = Number(exifMetadata.gps?.lat);
      const exifLng = Number(exifMetadata.gps?.lng);
      const hasExifGps = Boolean(exifMetadata.hasGps && Number.isFinite(exifLat) && Number.isFinite(exifLng));
      const exifLocation = hasExifGps
        ? {
            lat: exifLat,
            lng: exifLng,
            accuracy: Number.isFinite(Number(exifMetadata.gps?.accuracy))
              ? Math.round(Number(exifMetadata.gps.accuracy))
              : null,
            address: 'Photo location detected',
            source: 'exif',
            subAddress: `Lat: ${exifLat.toFixed(5)}, Lng: ${exifLng.toFixed(5)}`
          }
        : null;
      const captureSource = pendingCaptureSourceRef.current || 'gallery';

      updateDraft({
        selectedFile: file || null,
        photoPreview: photoPreview || draft.photoPreview || '',
        fileName: file?.name || draft.fileName || '',
        fileSize: file?.size ? formatFileSize(file) : draft.fileSize || '',
        exifLat: hasExifGps ? exifLat : null,
        exifLng: hasExifGps ? exifLng : null,
        exifTimestamp: exifMetadata.timestamp || toIsoTimestamp(exifMetadata.timestamp),
        hasExifGps,
        captureSource,
        directCameraCapture: captureSource === 'camera',
        exif: exifMetadata,
        ...(exifLocation ? { location: exifLocation } : {}),
        metadataPreview: {
          location: hasExifGps ? 'Photo GPS detected' : 'Metadata pending validation',
          warnings: exifMetadata.warnings || []
        }
      });

      return { hasExifGps, exifLocation };
    } catch (error) {
      console.warn('Unable to read image EXIF metadata.', error);
      updateDraft({
        exifLat: null,
        exifLng: null,
        exifTimestamp: '',
        hasExifGps: false,
        exif: {
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
          warnings: ['Metadata pending validation.'],
          validationStatus: 'unavailable'
        },
        metadataPreview: {
          location: 'Metadata pending validation'
        }
      });

      return { hasExifGps: false, exifLocation: null };
    }
  }

  function handleRemovePhoto() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.blur();
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.blur();
    }

    setSelectedFile(null);
    setPreviewUrl('');

    updateDraft({
      selectedFile: null,
      fileName: '',
      fileSize: '',
      photoPreview: '',
      evidenceCapturedAt: '',
      metadataPreview: null,
      exif: null,
      exifLat: null,
      exifLng: null,
      exifTimestamp: '',
      hasExifGps: false,
      captureSource: '',
      directCameraCapture: false,
      deviceLocation: null,
      deviceLocationError: ''
    });
  }

  function handleNextStep() {
    if (!draft.photoPreview && !previewUrl) {
      setStepError('Please upload or capture a photo before continuing.');
      return;
    }

    navigate('/reports/create/location');
  }

  return (
    <main className="create-report-page">
      <header className="create-report-topbar">
        <Link className="create-report-brand" to="/home" aria-label="CitizenWatch home">
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </Link>
        <Link className="create-report-close" to="/home" aria-label="Close create report">
          <FaTimes aria-hidden="true" />
        </Link>
      </header>

      <section className="create-report-content">
        <section className="create-step-header" aria-label="Report creation progress">
          <div>
            <span>Step 1 of 4</span>
            <strong>Evidence Upload</strong>
          </div>
          <div className="create-progress-track" aria-hidden="true">
            <span />
          </div>
        </section>

        <section className="evidence-card">
          <div className="evidence-dropzone">
            <div className="evidence-camera-mark">
              <FaCamera aria-hidden="true" />
            </div>
            <h1>Capture a clear photo of the issue</h1>
            <p>High-resolution images help responders resolve issues 40% faster.</p>
            <p className="evidence-helper-text">
              For better GPS accuracy, take a new photo directly from your camera.
            </p>

            <div className="evidence-actions">
              <button className="camera-button" onClick={handleUseCamera} type="button">
                <FaCameraRetro aria-hidden="true" />
                Use Camera
              </button>

              <button className="file-button" onClick={handleChooseFile} type="button">
                <FaFileUpload aria-hidden="true" />
                Choose File
              </button>
            </div>

            <input
              accept="image/*"
              aria-label="Choose report evidence image"
              className="sr-only"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />

            <input
              accept="image/*"
              aria-label="Capture report evidence image"
              capture="environment"
              className="sr-only"
              onChange={handleFileChange}
              ref={cameraInputRef}
              type="file"
            />

            {stepError && <p className="create-step-error">{stepError}</p>}

            {selectedFileName && (
              <div className="selected-photo-card">
                {previewUrl && <img src={previewUrl} alt="Selected report evidence preview" />}
                <div className="selected-photo-card__details">
                  <span>Selected photo</span>
                  <strong title={selectedFileName}>{selectedFileName}</strong>
                  {selectedFileSize && <small>{selectedFileSize}</small>}
                </div>
                <div className="selected-photo-card__actions">
                  <button onClick={handleChooseFile} type="button">
                    Change Photo
                  </button>
                  <button
                    aria-label="Remove selected photo"
                    className="selected-photo-card__remove"
                    onClick={handleRemovePhoto}
                    type="button"
                  >
                    <FaTrash aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="metadata-card">
          <header>
            <span>
              <FaInfo aria-hidden="true" />
            </span>
            <h2>Metadata Preview</h2>
          </header>

          <div className={`metadata-status metadata-status--${metadataStatus.tone}`}>
            <MetadataStatusIcon aria-hidden="true" />
            <div>
              <span>{metadataStatus.badge}</span>
              <strong>{metadataStatus.title}</strong>
              <p>{metadataStatus.helper}</p>
            </div>
          </div>

          <div className="metadata-row">
            <FaMapMarkerAlt aria-hidden="true" />
            <div>
              <span>Current Location</span>
              <strong>{currentLocation}</strong>
            </div>
          </div>

          <div className="metadata-row">
            <FaCalendarAlt aria-hidden="true" />
            <div>
              <span>Timestamp</span>
              <strong>{timestamp}</strong>
            </div>
          </div>

          <div className="metadata-row">
            <FaCrosshairs aria-hidden="true" />
            <div>
              <span>{deviceGpsStatus.label}</span>
              <strong>{deviceGpsStatus.value}</strong>
            </div>
          </div>

          <p className="metadata-note">
            * GPS data will be automatically embedded into your report for precision dispatching.
            Screenshots and downloaded images may not contain location data.
            Gallery/shared photos may have removed GPS metadata.
          </p>
        </section>

        <section className="pro-tips-card">
          <header>
            <FaLightbulb aria-hidden="true" />
            <h2>Pro Tips</h2>
          </header>
          <ol>
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </section>
      </section>

      <section className="create-report-action-bar">
        <button onClick={handleNextStep} type="button">
          Next Step
          <FaArrowRight aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
