import { useRef, useState } from 'react';
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
  FaTimes
} from 'react-icons/fa';
import { getReportDraft, saveReportDraft } from '../../services/localReportService.js';

const tips = [
  'Capture both a close-up and a wide shot for context.',
  'Ensure there is enough natural light for clarity.',
  'Avoid blurry shots; hold the device steady.'
];

export default function CreateReportPage() {
  const [draft, setDraft] = useState(() => getReportDraft());
  const [selectedFileName, setSelectedFileName] = useState(() => getReportDraft().fileName || '');
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
  const navigate = useNavigate();

  function handleUseCamera() {
    // TODO: Connect camera capture, Firebase Storage, EXIF, and GPS validation after UI is completed
    console.log('Use Camera clicked');
  }

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const [file] = event.target.files;
    setSelectedFileName(file ? file.name : '');

    if (!file) {
      const nextDraft = saveReportDraft({
        fileName: '',
        photoPreview: '',
        evidenceCapturedAt: ''
      });
      setDraft(nextDraft);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextDraft = saveReportDraft({
        fileName: file.name,
        photoPreview: typeof reader.result === 'string' ? reader.result : '',
        evidenceCapturedAt: new Date().toISOString()
      });
      setDraft(nextDraft);
    };
    reader.readAsDataURL(file);
  }

  function handleNextStep() {
    saveReportDraft({
      fileName: selectedFileName
    });
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

            {selectedFileName && <p className="selected-file-name">Selected: {selectedFileName}</p>}
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
