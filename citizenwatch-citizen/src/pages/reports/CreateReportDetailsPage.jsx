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

const issueTypes = [
  { label: 'Road Damage', icon: FaRoad },
  { label: 'Drainage', icon: FaTint },
  { label: 'Street Light', icon: FaLightbulb },
  { label: 'Waste', icon: FaTrashAlt },
  { label: 'Other', icon: FaPlus }
];

const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];

export default function CreateReportDetailsPage() {
  const [selectedIssueType, setSelectedIssueType] = useState('Road Damage');
  const [selectedUrgency, setSelectedUrgency] = useState('Medium');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  function handleSaveDraft() {
    // TODO: Re-enable Firebase draft persistence after UI is completed
    console.log('Save Draft clicked');
  }

  function handleNextStep() {
    navigate('/reports/create/success');
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
          <img src={responseImage} alt="Road damage preview" />
          <span>
            <FaMapMarkerAlt aria-hidden="true" />
            Main St &amp; 4th Ave
          </span>
        </section>

        <section className="details-field-group">
          <h2>What type of issue is this?</h2>
          <div className="details-chip-grid details-chip-grid--issues">
            {issueTypes.map((item) => (
              <button
                className={selectedIssueType === item.label ? 'details-chip active' : 'details-chip'}
                key={item.label}
                onClick={() => setSelectedIssueType(item.label)}
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
                onClick={() => setSelectedUrgency(level)}
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
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Please provide details to help our team identify the problem..."
            rows="5"
            value={description}
          />
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
