import { Link } from 'react-router-dom';
import {
  FaBars,
  FaBullhorn,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaGavel
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import infrastructureImage from '../../assets/images/Infrastructure.png';
import responseImage from '../../assets/images/Response.png';

const reports = [
  {
    title: 'Road Damage on Escario St.',
    description: 'Pothole reported near the intersection...',
    date: 'Oct 12, 2026',
    status: 'RESOLVED',
    tone: 'resolved',
    image: responseImage
  },
  {
    title: 'Sudden Flooding near JY',
    description: 'Drainage blockage causing water spill...',
    date: 'Oct 10, 2026',
    status: 'VERIFIED',
    tone: 'verified',
    image: infrastructureImage
  },
  {
    title: 'Street Light Issue',
    description: 'Flickering light on the main walk...',
    date: 'Oct 08, 2026',
    status: 'UNDER REVIEW',
    tone: 'review',
    image: communityImage
  }
];

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
        <h1>My Reports</h1>
        <p>Track your submitted infrastructure reports</p>
      </section>

      <section className="reports-summary-grid" aria-label="Report summary">
        <article className="reports-summary-card">
          <span>
            <FaClipboardList aria-hidden="true" />
          </span>
          <p>Total Reports</p>
          <strong>12</strong>
        </article>

        <article className="reports-summary-card">
          <span>
            <FaCheckCircle aria-hidden="true" />
          </span>
          <p>Resolved</p>
          <strong>05</strong>
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
          {reports.map((report) => (
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
                <time>
                  <FaCalendarAlt aria-hidden="true" />
                  {report.date}
                </time>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
