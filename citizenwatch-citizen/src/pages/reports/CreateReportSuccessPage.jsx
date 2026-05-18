import { Link } from 'react-router-dom';
import {
  FaCheck,
  FaCopy,
  FaEye,
  FaGavel,
  FaHome,
  FaQuestionCircle
} from 'react-icons/fa';
import { getLastSubmittedReport } from '../../services/localReportService.js';

export default function CreateReportSuccessPage() {
  const submittedReport = getLastSubmittedReport();
  const trackingId = submittedReport?.trackingId || '#INF-0000';

  async function handleCopyTrackingId() {
    try {
      await navigator.clipboard?.writeText(trackingId);
    } catch {
      console.log('Tracking ID:', trackingId);
    }
  }

  return (
    <main className="create-success-page">
      <header className="create-success-topbar">
        <Link className="create-success-brand" to="/home" aria-label="CitizenWatch home">
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </Link>
        <button className="create-success-help" type="button" aria-label="Help">
          <FaQuestionCircle aria-hidden="true" />
        </button>
      </header>

      <section className="create-success-content">
        <div className="success-illustration" aria-hidden="true">
          <span className="success-orbit success-orbit--one" />
          <span className="success-orbit success-orbit--two" />
          <div>
            <span>
              <FaCheck aria-hidden="true" />
            </span>
          </div>
        </div>

        <section className="success-message">
          <h1>Report submitted successfully</h1>
          <p>
            Thank you for your contribution to the community. Your report has been logged and assigned to the relevant department.
          </p>
        </section>

        <section className="tracking-card">
          <span>Tracking ID</span>
          <button onClick={handleCopyTrackingId} type="button" aria-label="Copy tracking ID">
            <strong>{trackingId}</strong>
            <FaCopy aria-hidden="true" />
          </button>
          <div />
          <p>Estimated response time: 24-48 hours</p>
        </section>

        <section className="success-actions">
          <Link className="success-primary-action" to="/reports">
            View My Report
            <FaEye aria-hidden="true" />
          </Link>
          <Link className="success-secondary-action" to="/home">
            Back to Home
            <FaHome aria-hidden="true" />
          </Link>
        </section>
      </section>
    </main>
  );
}
