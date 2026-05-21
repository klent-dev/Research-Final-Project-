import { Link, useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaChevronRight,
  FaCheck,
  FaEdit,
  FaPlusCircle,
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
import { useReports } from '../../hooks/useReports.js';
import { formatReportDate, formatStatusLabel, getStatusColor } from '../../services/localReportService.js';

const citizenProfile = {
  // TODO: Replace with Firebase Auth user profile after authentication is re-enabled
  fullName: 'Klent Ian Ca\u00f1ada',
  email: 'klent.canada@example.com',
  phone: '+63 912 345 6789',
  barangay: 'Lahug',
  memberSince: '2026'
};

const accountRows = [
  ['Full Name', citizenProfile.fullName],
  ['Email', citizenProfile.email],
  ['Phone', citizenProfile.phone],
  ['Barangay', citizenProfile.barangay]
];

const quickActions = [
  { label: 'My Reports', icon: FaRegFileAlt, to: '/reports' },
  { label: 'Create New Report', icon: FaPlusCircle, to: '/reports/create' },
  { label: 'Alerts', icon: FaBell, to: '/alerts' }
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { reports } = useReports();
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
    }
  ];

  function handleLogout() {
    // TODO: Reconnect Firebase signOut after authentication is re-enabled
    navigate('/login', { replace: true });
  }

  return (
    <PageContainer className="profile-page">
      <section className="profile-hero-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring">
            <img src={communityImage} alt={`${citizenProfile.fullName} profile`} />
          </div>
          <span className="profile-verified-dot" aria-label="Citizen reporter">
            <FaCheck aria-hidden="true" />
          </span>
        </div>

        <h1>{citizenProfile.fullName}</h1>
        <span className="profile-reporter-badge">
          <FaShieldAlt aria-hidden="true" />
          Citizen Reporter
        </span>
        <p>Barangay {citizenProfile.barangay} &bull; Member since: {citizenProfile.memberSince}</p>
        <button className="profile-edit-button" disabled type="button" title="Profile editing will be enabled later">
          <FaEdit aria-hidden="true" />
          Edit Profile
        </button>
      </section>

      <section className="profile-stats-grid profile-stats-grid--three" aria-label="Citizen reporting statistics">
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
        <h2>Recent Reports</h2>
        <div className="profile-reports-card">
          {reports.length > 0 ? (
            reports.slice(0, 3).map((report) => (
              <button
                className="profile-report-item"
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                type="button"
              >
                <img src={report.photoPreview || report.photoUrl || report.imageUrl || responseImage} alt="" />
                <div>
                  <h3>{report.title}</h3>
                  <time>{formatReportDate(report.createdAt)}</time>
                </div>
                <span className={`profile-status-pill profile-status-pill--${getStatusColor(report.status)}`}>
                  {formatStatusLabel(report.status)}
                </span>
              </button>
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
        <h2>Quick Actions</h2>
        <div className="profile-settings-card">
          {quickActions.map((item) => (
            <Link className="profile-setting-row" key={item.label} to={item.to}>
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
              <FaChevronRight aria-hidden="true" />
            </Link>
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
