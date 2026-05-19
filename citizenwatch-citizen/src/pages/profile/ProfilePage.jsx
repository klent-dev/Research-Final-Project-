import { Link, useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaChevronRight,
  FaCheck,
  FaCheckCircle,
  FaEdit,
  FaFileAlt,
  FaInfoCircle,
  FaQuestionCircle,
  FaRegChartBar,
  FaRegCheckCircle,
  FaRegFileAlt,
  FaRegFolderOpen,
  FaShieldAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import { HiOutlineBadgeCheck } from 'react-icons/hi';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import responseImage from '../../assets/images/Response.png';
import { formatReportDate, formatStatusLabel, getReports, getStatusColor } from '../../services/localReportService.js';

const citizenName = 'Klent Ian Ca\u00f1ada';
const maskedPassword = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
const membershipText = 'Barangay Lahug \u2022 Member since: 2026';

const accountRows = [
  ['Full Name', citizenName],
  ['Email', 'klent.canada@example.com'],
  ['Phone', '+63 912 345 6789'],
  ['Barangay', 'Lahug'],
  ['Password', maskedPassword]
];

const securityRows = ['Verified Citizen', 'GPS Reporting Enabled', 'EXIF Data Validation'];

const settings = [
  { label: 'Notifications', icon: FaBell },
  { label: 'Privacy', icon: FaShieldAlt },
  { label: 'Help Center', icon: FaQuestionCircle },
  { label: 'Terms & Conditions', icon: FaFileAlt },
  { label: 'About CitizenWatch', icon: FaInfoCircle }
];

export default function ProfilePage() {
  const navigate = useNavigate();
  // TODO: Replace localStorage with Firestore backend
  const reports = getReports();
  const stats = [
    { label: 'Submitted', value: reports.length.toString(), icon: FaRegFileAlt, tone: 'green' },
    {
      label: 'Verified',
      value: reports.filter((report) => report.status.toUpperCase().includes('VERIFIED')).length.toString(),
      icon: HiOutlineBadgeCheck,
      tone: 'purple'
    },
    {
      label: 'Resolved',
      value: reports.filter((report) => report.status.toUpperCase().includes('RESOLVED')).length.toString(),
      icon: FaRegCheckCircle,
      tone: 'green'
    },
    { label: 'Accuracy', value: reports.length > 0 ? '100%' : '--', icon: FaRegChartBar, tone: 'purple' }
  ];

  function handleLogout() {
    // TODO: Re-enable Firebase authentication after UI is completed
    navigate('/login', { replace: true });
  }

  return (
    <PageContainer className="profile-page">
      <section className="profile-hero-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring">
            <img src={communityImage} alt={`${citizenName} profile`} />
          </div>
          <span className="profile-verified-dot" aria-label="Verified citizen">
            <FaCheck aria-hidden="true" />
          </span>
        </div>

        <h1>{citizenName}</h1>
        <span className="profile-reporter-badge">
          <FaShieldAlt aria-hidden="true" />
          Verified Citizen Reporter
        </span>
        <p>{membershipText}</p>
        <Link className="profile-edit-button" to="/profile/edit">
          <FaEdit aria-hidden="true" />
          Edit Profile
        </Link>
      </section>

      <section className="profile-stats-grid" aria-label="Citizen reporting statistics">
        {stats.map((stat) => (
          <article className={`profile-stat-card profile-stat-card--${stat.tone}`} key={stat.label}>
            <stat.icon aria-hidden="true" />
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="profile-section">
        <h2>Account Information</h2>
        <div className="profile-info-card">
          {accountRows.map(([label, value]) => (
            <div className="profile-info-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2>Verification &amp; Security</h2>
        <div className="profile-check-card">
          {securityRows.map((item) => (
            <div className="profile-check-row" key={item}>
              <FaCheckCircle aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2>Recent Reports</h2>
        <div className="profile-reports-card">
          {reports.length > 0 ? (
            reports.slice(0, 3).map((report) => (
              <article className="profile-report-item" key={report.id}>
                <img src={report.photoPreview || responseImage} alt="" />
                <div>
                  <h3>{report.title}</h3>
                  <time>{formatReportDate(report.createdAt)}</time>
                </div>
                <span className={`profile-status-pill profile-status-pill--${getStatusColor(report.status)}`}>
                  {formatStatusLabel(report.status)}
                </span>
              </article>
            ))
          ) : (
            <div className="profile-empty-reports">
              <FaRegFolderOpen aria-hidden="true" />
              <h3>No recent reports.</h3>
              <p>Your latest infrastructure reports will appear here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="profile-section">
        <h2>Settings</h2>
        <div className="profile-settings-card">
          {settings.map((item) => (
            <button className="profile-setting-row" key={item.label} type="button">
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
              <FaChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <button className="profile-logout-button" onClick={handleLogout} type="button">
        <FaSignOutAlt aria-hidden="true" />
        Log Out Account
      </button>

      <span className="profile-bottom-spacer" aria-hidden="true" />
    </PageContainer>
  );
}
