import { Link } from 'react-router-dom';
import {
  FaBars,
  FaBullhorn,
  FaCheckCircle,
  FaClipboardList,
  FaGavel,
  FaRegFileAlt
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';

// TODO: Load reports from Firestore
const reports = [];

export default function ReportsPage() {
  return (
    <PageContainer className="reports-page">
      <header className="reports-topbar">
        <div className="reports-brand">
          <FaBars aria-hidden="true" />
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </div>
        <img src={communityImage} alt="Citizen profile" />
      </header>

      <section className="reports-title">
        <span className="reports-title__chip">Report Center</span>
        <h1>My Reports</h1>
        <p>Track your submitted infrastructure reports</p>
      </section>

      <section className="reports-summary-grid" aria-label="Report summary">
        <article className="reports-summary-card">
          <span>
            <FaClipboardList aria-hidden="true" />
          </span>
          <p>Total Reports</p>
          <strong>0</strong>
        </article>

        <article className="reports-summary-card">
          <span>
            <FaCheckCircle aria-hidden="true" />
          </span>
          <p>Resolved</p>
          <strong>0</strong>
        </article>
      </section>

      <section className="reports-cta-card">
        <div>
          <h2>Spotted a new issue?</h2>
          <p>Your reports help us build a better city for everyone.</p>
          <Link to="/reports/create">File New Report</Link>
        </div>
        <FaBullhorn className="reports-cta-card__icon" aria-hidden="true" />
      </section>

      <section className="reports-submissions">
        <header>
          <h2>Recent Submissions</h2>
          <button type="button">View All</button>
        </header>

        <div className="reports-list">
          {reports.length > 0 ? (
            reports.map((report) => (
              <article className="reports-list-card" key={report.title}>
                <img src={report.image} alt="" />
                <div className="reports-list-card__body">
                  <div>
                    <h3>{report.title}</h3>
                    <span className={`reports-status-pill reports-status-pill--${report.tone}`}>
                      {report.status}
                    </span>
                  </div>
                  <p>{report.description}</p>
                  <time>{report.date}</time>
                </div>
              </article>
            ))
          ) : (
            <div className="reports-empty-state">
              <FaRegFileAlt aria-hidden="true" />
              <h3>No reports submitted yet.</h3>
              <p>Your submitted infrastructure reports will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
