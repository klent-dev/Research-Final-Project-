import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import exifr from 'exifr';
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

function getMetadataStatus({ draft, hasLocation, hasSelectedPhoto }) {
  if (!hasSelectedPhoto) {
    return {
      tone: 'waiting',
      badge: 'Waiting',
      icon: FaInfo,
      title: 'Waiting for photo upload',
      helper: 'Photos taken directly from your camera usually contain GPS metadata.'
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

export default function CreateReportPage() {
  const { draft, updateDraft, updatePhoto } = useReportDraft();
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState(() => draft.selectedFile || null);
  const [previewUrl, setPreviewUrl] = useState(() => draft.photoPreview || '');
  const [stepError, setStepError] = useState(() => location.state?.validationError || '');
  // TODO: Replace with real EXIF/GPS metadata after report submission
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
  const autoAdvanceRef = useRef(false);
  const navigate = useNavigate();
  const selectedFileName = selectedFile?.name || draft.fileName || '';
  const selectedFileSize = selectedFile ? formatFileSize(selectedFile) : draft.fileSize || '';
  const metadataStatus = getMetadataStatus({ draft, hasLocation, hasSelectedPhoto });
  const MetadataStatusIcon = metadataStatus.icon;

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  function handleUseCamera() {
    // TODO: Connect camera capture, Firebase Storage, EXIF, and GPS validation after UI is completed
    scrollPositionRef.current = window.scrollY;
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    cameraInputRef.current?.click();
  }

  function handleChooseFile() {
    scrollPositionRef.current = window.scrollY;
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
    autoAdvanceRef.current = false;

    const reader = new FileReader();
    reader.onload = () => {
      const photoPreview = typeof reader.result === 'string' ? reader.result : '';
      updatePhoto(file, photoPreview);
      void extractPhotoMetadata(file, photoPreview);
    };
    reader.readAsDataURL(file);
  }

  async function extractPhotoMetadata(file, photoPreview = '') {
    try {
      const [gpsData, parsedMetadata] = await Promise.all([
        exifr.gps(file).catch(() => null),
        exifr.parse(file, {
          pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate']
        }).catch(() => null)
      ]);
      const exifTimestamp =
        parsedMetadata?.DateTimeOriginal ||
        parsedMetadata?.CreateDate ||
        parsedMetadata?.ModifyDate ||
        '';
      const exifLat = Number(gpsData?.latitude);
      const exifLng = Number(gpsData?.longitude);
      const hasExifGps = Number.isFinite(exifLat) && Number.isFinite(exifLng);
      const exifLocation = hasExifGps
        ? {
            lat: exifLat,
            lng: exifLng,
            accuracy: null,
            address: 'Photo location detected',
            source: 'exif',
            subAddress: `Lat: ${exifLat.toFixed(5)}, Lng: ${exifLng.toFixed(5)}`
          }
        : null;

      updateDraft({
        selectedFile: file || null,
        photoPreview: photoPreview || draft.photoPreview || '',
        fileName: file?.name || draft.fileName || '',
        fileSize: file?.size ? formatFileSize(file) : draft.fileSize || '',
        exifLat: hasExifGps ? exifLat : null,
        exifLng: hasExifGps ? exifLng : null,
        exifTimestamp: toIsoTimestamp(exifTimestamp),
        hasExifGps,
        ...(exifLocation ? { location: exifLocation } : {}),
        metadataPreview: {
          location: hasExifGps ? 'Photo GPS detected' : 'Metadata pending validation'
        }
      });

      if (hasExifGps && !autoAdvanceRef.current) {
        autoAdvanceRef.current = true;
        window.setTimeout(() => {
          navigate('/reports/create/details');
        }, 650);
      }
    } catch (error) {
      console.warn('Unable to read image EXIF metadata.', error);
      updateDraft({
        exifLat: null,
        exifLng: null,
        exifTimestamp: '',
        hasExifGps: false,
        metadataPreview: {
          location: 'Metadata pending validation'
        }
      });
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
    autoAdvanceRef.current = false;

    updateDraft({
      selectedFile: null,
      fileName: '',
      fileSize: '',
      photoPreview: '',
      evidenceCapturedAt: '',
      metadataPreview: null,
      exifLat: null,
      exifLng: null,
      exifTimestamp: '',
      hasExifGps: false
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

          <p className="metadata-note">
            * GPS data will be automatically embedded into your report for precision dispatching.
            Screenshots and downloaded images may not contain location data.
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
