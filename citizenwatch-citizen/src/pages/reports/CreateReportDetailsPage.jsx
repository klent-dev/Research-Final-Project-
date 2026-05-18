import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaMapMarkerAlt,
  FaPlus,
  FaRoad,
  FaTimes,
  FaTint,
  FaTrashAlt,
  FaLightbulb
} from 'react-icons/fa';
import responseImage from '../../assets/images/Response.png';
import { useReportDraft } from '../../context/ReportDraftContext.jsx';
import { buildReportFromDraft, saveReport } from '../../services/localReportService.js';

const issueTypes = [
  { label: 'Road Damage', icon: FaRoad },
  { label: 'Drainage', icon: FaTint },
  { label: 'Street Light', icon: FaLightbulb },
  { label: 'Waste', icon: FaTrashAlt },
  { label: 'Other', icon: FaPlus }
];

const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];

export default function CreateReportDetailsPage() {
  const { draft, resetDraft, updateIssueDetails } = useReportDraft();
  const [selectedIssueType, setSelectedIssueType] = useState(draft.issueType || 'Road Damage');
  const [selectedUrgency, setSelectedUrgency] = useState(draft.urgency || 'Medium');
  const [description, setDescription] = useState(draft.description || '');
  const [stepError, setStepError] = useState('');
  const navigate = useNavigate();
  const photoPreview = draft.photoPreview || responseImage;
  const locationLabel = draft.location?.address || 'Location pending';

  function handleSaveDraft() {
    // TODO: Re-enable Firebase draft persistence after UI is completed
    updateIssueDetails({
      issueType: selectedIssueType,
      urgency: selectedUrgency,
      description
    });
    console.log('Save Draft clicked');
  }

  function handleNextStep() {
    if (!selectedIssueType || !selectedUrgency || !description.trim()) {
      setStepError('Please complete the issue type, urgency, and description before submitting.');
      return;
    }

    const nextDraft = {
      ...draft,
      issueType: selectedIssueType,
      urgency: selectedUrgency,
      description: description.trim()
    };
    updateIssueDetails(nextDraft);
    const savedReport = saveReport(buildReportFromDraft(nextDraft));

    resetDraft();
    console.log('Report saved locally:', savedReport.trackingId);
    navigate('/reports/create/success');
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
        <button className="details-next-button" onClick={handleNextStep} type="button">
          Submit Report
          <FaArrowRight aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
