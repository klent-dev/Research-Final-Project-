import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaCamera,
  FaCameraRetro,
  FaCalendarAlt,
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

export default function CreateReportPage() {
  const { draft, updateDraft, updatePhoto } = useReportDraft();
  const [selectedFile, setSelectedFile] = useState(() => draft.selectedFile || null);
  const [previewUrl, setPreviewUrl] = useState(() => draft.photoPreview || '');
  const [stepError, setStepError] = useState('');
  // TODO: Replace with real EXIF/GPS metadata after report submission
  const hasMetadata = Boolean(draft?.location || draft?.evidenceCapturedAt);
  const currentLocation = hasMetadata && draft?.location?.address
    ? draft.location.address
    : 'Location not available yet';
  const timestamp = hasMetadata && draft?.evidenceCapturedAt
    ? new Date(draft.evidenceCapturedAt).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : 'Waiting for report submission';
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef('');
  const scrollPositionRef = useRef(0);
  const navigate = useNavigate();
  const selectedFileName = selectedFile?.name || draft.fileName || '';
  const selectedFileSize = selectedFile ? formatFileSize(selectedFile) : draft.fileSize || '';

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  function handleUseCamera() {
    // TODO: Connect camera capture, Firebase Storage, EXIF, and GPS validation after UI is completed
    console.log('Use Camera clicked');
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

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current, left: 0, behavior: 'auto' });
    });

    if (!file) {
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

    const reader = new FileReader();
    reader.onload = () => {
      updatePhoto(file, typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
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

    setSelectedFile(null);
    setPreviewUrl('');

    updateDraft({
      selectedFile: null,
      fileName: '',
      fileSize: '',
      photoPreview: '',
      evidenceCapturedAt: ''
    });
  }

  function handleNextStep() {
    if (!draft.photoPreview && !previewUrl) {
      setStepError('Please choose or capture a photo before continuing.');
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
