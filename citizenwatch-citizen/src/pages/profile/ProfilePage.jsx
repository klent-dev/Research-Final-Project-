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
  FaShieldAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import { HiOutlineBadgeCheck } from 'react-icons/hi';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import infrastructureImage from '../../assets/images/Infrastructure.png';
import responseImage from '../../assets/images/Response.png';

const citizenName = 'Klent Ian Ca\u00f1ada';
const maskedPassword = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
const membershipText = 'Barangay Lahug \u2022 Member since: 2026';

const stats = [
  { label: 'Submitted', value: '12', icon: FaRegFileAlt, tone: 'green' },
  { label: 'Verified', value: '08', icon: HiOutlineBadgeCheck, tone: 'purple' },
  { label: 'Resolved', value: '05', icon: FaRegCheckCircle, tone: 'green' },
  { label: 'Accuracy', value: '92%', icon: FaRegChartBar, tone: 'purple' }
];

const accountRows = [
  ['Full Name', citizenName],
  ['Email', 'klent.canada@example.com'],
  ['Phone', '+63 912 345 6789'],
  ['Barangay', 'Lahug'],
  ['Password', maskedPassword]
];

const securityRows = ['Verified Citizen', 'GPS Reporting Enabled', 'EXIF Data Validation'];

const reports = [
  {
    title: 'Road Damage on Escario St.',
    date: 'Oct 12, 2026',
    status: 'RESOLVED',
    image: responseImage,
    tone: 'resolved'
  },
  {
    title: 'Sudden Flooding near JY',
    date: 'Oct 10, 2026',
    status: 'VERIFIED',
    image: infrastructureImage,
    tone: 'verified'
  },
  {
    title: 'Street Light Issue (Blink)',
    date: 'Oct 08, 2026',
    status: 'UNDER REVIEW',
    image: communityImage,
    tone: 'review'
  }
];

const settings = [
  { label: 'Notifications', icon: FaBell },
  { label: 'Privacy', icon: FaShieldAlt },
  { label: 'Help Center', icon: FaQuestionCircle },
  { label: 'Terms & Conditions', icon: FaFileAlt },
  { label: 'About CitizenWatch', icon: FaInfoCircle }
];

export default function ProfilePage() {
  const navigate = useNavigate();

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
          {reports.map((report) => (
            <article className="profile-report-item" key={report.title}>
              <img src={report.image} alt="" />
              <div>
                <h3>{report.title}</h3>
                <time>{report.date}</time>
              </div>
              <span className={`profile-status-pill profile-status-pill--${report.tone}`}>
                {report.status}
              </span>
            </article>
          ))}
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
