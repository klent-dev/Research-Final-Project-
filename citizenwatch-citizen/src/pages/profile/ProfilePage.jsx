import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
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
import { useAuth } from '../../hooks/useAuth.js';
import { logoutCitizen } from '../../services/authService.js';
import { formatReportDate, formatStatusLabel, getStatusColor } from '../../services/localReportService.js';
import { getUserProfile, updateCitizenUserProfile } from '../../services/userService.js';
import { toDisplayText } from '../../utils/displayText.js';

const quickActions = [
  { label: 'My Reports', icon: FaRegFileAlt, to: '/reports' },
  { label: 'Create New Report', icon: FaPlusCircle, to: '/reports/create' },
  { label: 'Alerts', icon: FaBell, to: '/alerts' }
];

const emptyProfileForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  address: '',
  photoURL: ''
};

function normalizeProfileForm(user, profile = {}) {
  const safeProfile = profile || {};

  return {
    fullName: toDisplayText(safeProfile.fullName || user?.displayName),
    email: toDisplayText(user?.email || safeProfile.email),
    phoneNumber: toDisplayText(safeProfile.phoneNumber),
    address: toDisplayText(safeProfile.address || safeProfile.barangay),
    photoURL: toDisplayText(safeProfile.photoURL || user?.photoURL)
  };
}

function formatMemberSince(value) {
  if (!value) {
    return new Date().getFullYear().toString();
  }

  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().getFullYear().toString() : date.getFullYear().toString();
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { reports } = useReports();
  const profileReports = Array.isArray(reports) ? reports.filter(Boolean) : [];
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const displayProfile = useMemo(() => normalizeProfileForm(user, profile), [profile, user]);
  const displayName = displayProfile.fullName || 'Citizen Reporter';
  const email = displayProfile.email || 'Email unavailable';
  const phoneNumber = displayProfile.phoneNumber || 'Not provided';
  const address = displayProfile.address || 'Not provided';
  const profilePhoto = displayProfile.photoURL || communityImage;
  const memberSince = formatMemberSince(profile?.createdAt || user?.metadata?.creationTime);
  const stats = [
    { label: 'Submitted', value: profileReports.length.toString(), icon: FaRegFileAlt, tone: 'green' },
    {
      label: 'Verified',
      value: profileReports.filter((report) => String(report.status || '').toUpperCase().includes('VERIFIED')).length.toString(),
      icon: HiOutlineBadgeCheck,
      tone: 'purple'
    },
    {
      label: 'Resolved',
      value: profileReports.filter((report) => String(report.status || '').toUpperCase().includes('RESOLVED')).length.toString(),
      icon: FaRegCheckCircle,
      tone: 'green'
    }
  ];

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!user?.uid) {
        setProfile(null);
        setProfileForm(emptyProfileForm);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      setProfileError('');

      try {
        const nextProfile = await getUserProfile(user.uid);

        if (!ignore) {
          setProfile(nextProfile);
          setProfileForm(normalizeProfileForm(user, nextProfile || {}));
        }
      } catch (error) {
        console.error('Unable to load citizen profile:', error);

        if (!ignore) {
          setProfile(null);
          setProfileForm(normalizeProfileForm(user, {}));
          setProfileError('Unable to load your profile details right now.');
        }
      } finally {
        if (!ignore) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/profile/edit') {
      setIsEditing(true);
    }
  }, [location.pathname]);

  function handleEditProfile() {
    setProfileForm(displayProfile);
    setProfileMessage('');
    setProfileError('');
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setProfileForm(displayProfile);
    setProfileMessage('');
    setProfileError('');
    setIsEditing(false);
  }

  function handleProfileFieldChange(event) {
    const { name, value } = event.target;
    setProfileForm((currentProfile) => ({ ...currentProfile, [name]: value }));
    setProfileMessage('');
    setProfileError('');
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!user?.uid) {
      setProfileError('Please sign in before updating your profile.');
      return;
    }

    const fullName = profileForm.fullName.trim();

    if (!fullName) {
      setProfileError('Full name is required.');
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage('');
    setProfileError('');

    const nextProfile = {
      fullName,
      email: user.email || profileForm.email,
      phoneNumber: profileForm.phoneNumber.trim(),
      address: profileForm.address.trim(),
      photoURL: profileForm.photoURL.trim()
    };

    try {
      if (user.displayName !== nextProfile.fullName || (user.photoURL || '') !== nextProfile.photoURL) {
        await updateProfile(user, {
          displayName: nextProfile.fullName,
          photoURL: nextProfile.photoURL || null
        });
      }

      await updateCitizenUserProfile(user.uid, nextProfile);

      setProfile((currentProfile) => ({
        ...(currentProfile || {}),
        ...nextProfile,
        uid: user.uid,
        role: currentProfile?.role || 'citizen',
        updatedAt: new Date().toISOString()
      }));
      setProfileForm(nextProfile);
      setIsEditing(false);
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      console.error('Unable to update citizen profile:', error);
      setProfileError('Unable to save your profile. Please check your connection and try again.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutCitizen();
    } catch (error) {
      console.error('Citizen logout failed:', error);
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <PageContainer className="profile-page">
      <section className="profile-hero-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring">
            <img src={profilePhoto} alt={`${displayName} profile`} />
          </div>
          <span className="profile-verified-dot" aria-label="Citizen reporter">
            <FaCheck aria-hidden="true" />
          </span>
        </div>

        <h1>{displayName}</h1>
        <span className="profile-reporter-badge">
          <FaShieldAlt aria-hidden="true" />
          Citizen Reporter
        </span>
        <p>{address} &bull; Member since: {memberSince}</p>
        <button
          className="profile-edit-button"
          disabled={isProfileLoading || isSavingProfile}
          onClick={isEditing ? handleCancelEdit : handleEditProfile}
          type="button"
        >
          <FaEdit aria-hidden="true" />
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
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
        {profileError && <p className="form-error">{profileError}</p>}
        {profileMessage && <p className="form-success">{profileMessage}</p>}

        {isEditing ? (
          <form className="profile-info-card" onSubmit={handleSaveProfile}>
            <label className="profile-info-row" htmlFor="profile-full-name">
              <span>Full Name</span>
              <input
                id="profile-full-name"
                name="fullName"
                onChange={handleProfileFieldChange}
                type="text"
                value={profileForm.fullName}
              />
            </label>
            <div className="profile-info-row">
              <span>Email</span>
              <strong>{email}</strong>
            </div>
            <label className="profile-info-row" htmlFor="profile-phone-number">
              <span>Phone</span>
              <input
                id="profile-phone-number"
                name="phoneNumber"
                onChange={handleProfileFieldChange}
                type="tel"
                value={profileForm.phoneNumber}
              />
            </label>
            <label className="profile-info-row" htmlFor="profile-address">
              <span>Address</span>
              <input
                id="profile-address"
                name="address"
                onChange={handleProfileFieldChange}
                type="text"
                value={profileForm.address}
              />
            </label>
            <label className="profile-info-row" htmlFor="profile-photo-url">
              <span>Photo URL</span>
              <input
                id="profile-photo-url"
                name="photoURL"
                onChange={handleProfileFieldChange}
                type="url"
                value={profileForm.photoURL}
              />
            </label>
            <div className="profile-info-row">
              <span>Save Changes</span>
              <button className="profile-edit-button" disabled={isSavingProfile} type="submit">
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info-card">
            <div className="profile-info-row">
              <span>Full Name</span>
              <strong>{displayName}</strong>
            </div>
            <div className="profile-info-row">
              <span>Email</span>
              <strong>{email}</strong>
            </div>
            <div className="profile-info-row">
              <span>Phone</span>
              <strong>{phoneNumber}</strong>
            </div>
            <div className="profile-info-row">
              <span>Address</span>
              <strong>{address}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="profile-section">
        <h2>Recent Reports</h2>
        <div className="profile-reports-card">
          {profileReports.length > 0 ? (
            profileReports.slice(0, 3).map((report) => (
              <button
                className="profile-report-item"
                key={report.id || report.reportId || report.trackingId}
                onClick={() => navigate(`/reports/${report.id || report.reportId || report.trackingId}`)}
                type="button"
              >
                <img src={report.photoPreview || report.photoUrl || report.imageUrl || responseImage} alt="" />
                <div>
                  <h3>{toDisplayText(report.title || report.issueType, 'Infrastructure Report')}</h3>
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
