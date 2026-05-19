import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaMapMarkerAlt,
  FaPlus,
  FaTimes,
  FaTint,
  FaTrashAlt,
  FaWater,
  FaLightbulb
} from 'react-icons/fa';
import responseImage from '../../assets/images/Response.png';
import { useReportDraft } from '../../context/ReportDraftContext.jsx';
import { buildReportFromDraft, saveReport } from '../../services/localReportService.js';
import { SEVERITY_LEVELS, normalizeUrgency } from '../../utils/severity.js';

const issueTypes = [
  { label: 'Drainage', icon: FaTint },
  { label: 'Street Light', icon: FaLightbulb },
  { label: 'Flooding', icon: FaWater },
  { label: 'Waste', icon: FaTrashAlt },
  { label: 'Others', icon: FaPlus }
];

const urgencyLevels = SEVERITY_LEVELS;
const SAVED_DRAFT_STORAGE_KEY = 'citizenwatch_saved_report_draft';

export default function CreateReportDetailsPage() {
  const { draft, resetDraft, updateIssueDetails } = useReportDraft();
  const [selectedIssueType, setSelectedIssueType] = useState(draft.issueType || 'Drainage');
  const [selectedUrgency, setSelectedUrgency] = useState(normalizeUrgency(draft.urgency));
  const [description, setDescription] = useState(draft.description || '');
  const [stepError, setStepError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const photoPreview = draft.photoPreview || responseImage;
  const hasPhoto = Boolean(draft.photoPreview);
  const locationLabel = draft.location?.address || 'Location pending';
  const hasLocation = Boolean(
    Number.isFinite(Number(draft.location?.lat)) &&
    Number.isFinite(Number(draft.location?.lng)) &&
    draft.location?.address
  );

  useEffect(() => {
    if (!hasPhoto) {
      navigate('/reports/create', {
        replace: true,
        state: {
          validationError: 'Please upload or capture a photo before continuing.'
        }
      });
      return;
    }

    if (!hasLocation) {
      navigate('/reports/create/location', { replace: true });
    }
  }, [hasLocation, hasPhoto, navigate]);

  function getDetailsValidationError() {
    if (!selectedIssueType) {
      return 'Please select an issue type.';
    }

    if (!selectedUrgency) {
      return 'Please select urgency.';
    }

    if (description.trim().length < 10) {
      return 'Please describe the issue with at least 10 characters.';
    }

    return '';
  }

  function handleSaveDraft() {
    // TODO: Re-enable Firebase draft persistence after UI is completed
    const savedDraft = {
      ...draft,
      issueType: selectedIssueType,
      urgency: selectedUrgency,
      description
    };

    updateIssueDetails({
      issueType: selectedIssueType,
      urgency: selectedUrgency,
      description
    });

    try {
      window.localStorage.setItem(
        SAVED_DRAFT_STORAGE_KEY,
        JSON.stringify({
          ...savedDraft,
          selectedFile: undefined
        })
      );
      setStepError('');
    } catch (error) {
      console.warn('Unable to save report draft locally.', error);
      setStepError('Unable to save draft right now. Please try again.');
    }
  }

  async function handleNextStep() {
    if (!hasPhoto) {
      navigate('/reports/create', {
        replace: true,
        state: {
          validationError: 'Please upload or capture a photo before continuing.'
        }
      });
      return;
    }

    if (!hasLocation) {
      navigate('/reports/create/location', { replace: true });
      return;
    }

    const validationError = getDetailsValidationError();
    if (validationError) {
      setStepError(validationError);
      return;
    }

    setIsSubmitting(true);
    setStepError('');

    const nextDraft = {
      ...draft,
      issueType: selectedIssueType,
      urgency: selectedUrgency,
      description: description.trim()
    };
    updateIssueDetails({
      issueType: selectedIssueType,
      urgency: selectedUrgency,
      description: description.trim()
    });

    const localReport = buildReportFromDraft({
      ...nextDraft,
      status: 'under_review',
      createdBy: 'local-citizen'
    });

    try {
      // TODO: Replace localStorage submission with Firebase/Firestore after UI is completed
      const savedReport = saveReport(localReport);
      resetDraft();
      console.log('Report saved locally:', savedReport.trackingId);
      navigate('/reports/create/success');
    } catch (error) {
      console.warn('Unable to save report locally.', error);
      setStepError('Unable to submit report right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleIssueTypeChange(issueType) {
    setSelectedIssueType(issueType);
    setStepError('');
    updateIssueDetails({ issueType, urgency: selectedUrgency, description });
  }

  function handleUrgencyChange(urgency) {
    setSelectedUrgency(urgency);
    setStepError('');
    updateIssueDetails({ issueType: selectedIssueType, urgency, description });
  }

  function handleDescriptionChange(event) {
    const nextDescription = event.target.value;
    setDescription(nextDescription);
    setStepError('');
    updateIssueDetails({
      issueType: selectedIssueType,
      urgency: selectedUrgency,
      description: nextDescription
    });
  }

  return (
    <main className="create-details-page">
      <header className="create-details-topbar">
        <Link className="create-details-icon-button" to="/reports/create/location" aria-label="Back to location verification">
          <FaArrowLeft aria-hidden="true" />
        </Link>
        <div>
          <h1>Issue Details</h1>
          <span>Step 3 of 4</span>
        </div>
        <Link className="create-details-icon-button" to="/home" aria-label="Close create report">
          <FaTimes aria-hidden="true" />
        </Link>
      </header>

      <div className="create-details-progress" aria-hidden="true">
        <span />
      </div>

      <section className="create-details-content">
        <section className="details-photo-card">
          <img src={photoPreview} alt="Report evidence preview" />
          <span>
            <FaMapMarkerAlt aria-hidden="true" />
            {locationLabel}
          </span>
        </section>

        <section className="details-field-group">
          <h2>What type of issue is this?</h2>
          <div className="details-chip-grid details-chip-grid--issues">
            {issueTypes.map((item) => (
              <button
                className={selectedIssueType === item.label ? 'details-chip active' : 'details-chip'}
                key={item.label}
                onClick={() => handleIssueTypeChange(item.label)}
                type="button"
              >
                <item.icon aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="details-field-group">
          <h2>How urgent is the situation?</h2>
          <div className="details-chip-grid details-chip-grid--urgency">
            {urgencyLevels.map((level) => (
              <button
                className={selectedUrgency === level ? 'details-chip active' : 'details-chip'}
                key={level}
                onClick={() => handleUrgencyChange(level)}
                type="button"
              >
                {level}
              </button>
            ))}
          </div>
        </section>

        <section className="details-field-group">
          <label htmlFor="issue-description">Describe the issue</label>
          <textarea
            id="issue-description"
            onChange={handleDescriptionChange}
            placeholder="Please provide details to help our team identify the problem..."
            rows="5"
            value={description}
          />
          {stepError && <p className="create-step-error">{stepError}</p>}
        </section>
      </section>

      <section className="create-details-action-bar">
        <button className="details-save-button" onClick={handleSaveDraft} type="button">
          Save Draft
        </button>
        <button className="details-next-button" disabled={isSubmitting} onClick={handleNextStep} type="button">
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
          <FaArrowRight aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
