import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaCheck,
  FaCopy,
  FaEye,
  FaHome,
  FaQuestionCircle
} from 'react-icons/fa';
import { getLastSubmittedReport } from '../../services/localReportService.js';

export default function CreateReportSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const submittedReport = useMemo(() => (
    location.state?.trackingId
      ? {
          id: location.state.reportId,
          reportId: location.state.reportId,
          trackingId: location.state.trackingId
        }
      : getLastSubmittedReport()
  ), [location.state]);
  const trackingId = submittedReport?.trackingId || 'Pending';

  useEffect(() => {
    if (!submittedReport) {
      navigate('/reports/create', {
        replace: true,
        state: {
          validationError: 'Please complete the report form before viewing the success page.'
        }
      });
    }
  }, [navigate, submittedReport]);

  async function handleCopyTrackingId() {
    try {
      await navigator.clipboard?.writeText(trackingId);
    } catch {
      console.log('Tracking ID:', trackingId);
    }
  }

  if (!submittedReport) {
    return (
      <main className="create-success-page">
        <section className="create-success-content">
          <section className="success-message">
            <h1>Completing report setup</h1>
            <p>Please complete the report form before viewing the success page.</p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="create-success-page">
      <header className="create-success-topbar">
        <span aria-hidden="true" />
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
