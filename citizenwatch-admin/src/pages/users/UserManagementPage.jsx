import { useEffect, useMemo, useState } from 'react';
import { subscribeReportsForModeration } from '../../services/adminReportService.js';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';

const SETTINGS_STORAGE_KEY = 'citizenwatch_admin_settings';

const tabs = [
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'map', label: 'Map' },
  { id: 'system', label: 'System & Data' },
  { id: 'security', label: 'Security & Roles' }
];

const defaultSettings = {
  account: {
    fullName: 'Local Admin',
    email: 'admin@citizenwatch.local',
    avatarUrl: '',
    twoFactorEnabled: false
  },
  notifications: {
    newReportAlert: true,
    criticalReportAlert: true,
    statusChangeAlert: true,
    deliveryEmail: true,
    deliveryInApp: true
  },
  dashboard: {
    theme: 'system',
    defaultCategory: 'All Categories',
    defaultStatus: 'All Statuses',
    defaultDistrict: 'All Districts',
    showMetricCards: true,
    reorderCards: false
  },
  map: {
    showLowPriorityMarkers: true,
    markerClustering: true,
    realtimeUpdates: true,
    zoomLevel: 13
  }
};

const roleOptions = ['citizen', 'lgu_admin'];
const categoryOptions = ['All Categories', 'Roads', 'Drainage', 'Streetlights', 'Bridges', 'Waste Management', 'Others'];
const statusOptions = ['All Statuses', 'Pending', 'Under Review', 'Verified', 'In Progress', 'Resolved', 'Rejected'];
const districtOptions = [
  'All Districts',
  'Cebu Province - 1st District',
  'Cebu Province - 2nd District',
  'Cebu Province - 3rd District',
  'Cebu Province - 4th District',
  'Cebu Province - 5th District',
  'Cebu Province - 6th District',
  'Cebu Province - 7th District',
  'Cebu City - North District',
  'Cebu City - South District',
  'Lapu-Lapu City - Lone District',
  'Mandaue City - Lone District'
];

function readSettings() {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const savedSettings = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY));
    return {
      account: { ...defaultSettings.account, ...savedSettings?.account },
      notifications: { ...defaultSettings.notifications, ...savedSettings?.notifications },
      dashboard: { ...defaultSettings.dashboard, ...savedSettings?.dashboard },
      map: { ...defaultSettings.map, ...savedSettings?.map }
    };
  } catch {
    return defaultSettings;
  }
}

function writeSettings(settings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function getCitizenName(report) {
  return report.reporterName || report.createdByName || report.reporterId || report.createdBy || 'Citizen Reporter';
}

function FormField({ children, label }) {
  return (
    <label className="admin-settings-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, label, description, onChange }) {
  return (
    <label className="admin-settings-toggle">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <i aria-hidden="true" />
    </label>
  );
}

function SectionCard({ children, eyebrow, title }) {
  return (
    <section className="admin-settings-card">
      <header>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </header>
      {children}
    </section>
  );
}

function AccountSettings({ passwordForm, passwordMessage, settings, updatePassword, updateSection }) {
  return (
    <div className="admin-settings-section-grid">
      <SectionCard eyebrow="Admin only" title="Account Settings">
        <div className="admin-profile-row">
          <div className="admin-profile-avatar">
            {settings.account.avatarUrl ? <img src={settings.account.avatarUrl} alt="" /> : <span>AU</span>}
          </div>
          <div>
            <strong>{settings.account.fullName || 'Admin User'}</strong>
            <p>{settings.account.email}</p>
            <span className="admin-role-badge">lgu_admin</span>
          </div>
        </div>

        <div className="admin-settings-form-grid">
          <FormField label="Full Name">
            <input
              onChange={(event) => updateSection('account', { fullName: event.target.value })}
              value={settings.account.fullName}
            />
          </FormField>
          <FormField label="Email">
            <input
              onChange={(event) => updateSection('account', { email: event.target.value })}
              type="email"
              value={settings.account.email}
            />
          </FormField>
          <FormField label="Avatar URL">
            <input
              onChange={(event) => updateSection('account', { avatarUrl: event.target.value })}
              placeholder="https://example.com/avatar.jpg"
              value={settings.account.avatarUrl}
            />
          </FormField>
        </div>

        <Toggle
          checked={settings.account.twoFactorEnabled}
          description="Placeholder UI for future authentication hardening."
          label="Two-Factor Authentication"
          onChange={(value) => updateSection('account', { twoFactorEnabled: value })}
        />
      </SectionCard>

      <SectionCard eyebrow="Security" title="Change Password">
        <div className="admin-settings-form-grid">
          <FormField label="Current Password">
            <input
              onChange={(event) => updatePassword({ currentPassword: event.target.value })}
              type="password"
              value={passwordForm.currentPassword}
            />
          </FormField>
          <FormField label="New Password">
            <input
              onChange={(event) => updatePassword({ newPassword: event.target.value })}
              type="password"
              value={passwordForm.newPassword}
            />
          </FormField>
          <FormField label="Confirm Password">
            <input
              onChange={(event) => updatePassword({ confirmPassword: event.target.value })}
              type="password"
              value={passwordForm.confirmPassword}
            />
          </FormField>
        </div>
        {passwordMessage && <p className="admin-settings-validation">{passwordMessage}</p>}
      </SectionCard>
    </div>
  );
}

function NotificationSettings({ settings, updateSection }) {
  return (
    <SectionCard eyebrow="Alerts" title="Notification Settings">
      <div className="admin-settings-stack">
        <Toggle
          checked={settings.notifications.newReportAlert}
          description="Notify admins when a new citizen report arrives."
          label="New report alert"
          onChange={(value) => updateSection('notifications', { newReportAlert: value })}
        />
        <Toggle
          checked={settings.notifications.criticalReportAlert}
          description="Prioritize critical and urgent reports."
          label="Critical / urgent report alert"
          onChange={(value) => updateSection('notifications', { criticalReportAlert: value })}
        />
        <Toggle
          checked={settings.notifications.statusChangeAlert}
          description="Notify when report progress changes."
          label="Report status change alert"
          onChange={(value) => updateSection('notifications', { statusChangeAlert: value })}
        />
      </div>
      <div className="admin-settings-check-grid">
        <label>
          <input
            checked={settings.notifications.deliveryEmail}
            onChange={(event) => updateSection('notifications', { deliveryEmail: event.target.checked })}
            type="checkbox"
          />
          Email delivery
        </label>
        <label>
          <input
            checked={settings.notifications.deliveryInApp}
            onChange={(event) => updateSection('notifications', { deliveryInApp: event.target.checked })}
            type="checkbox"
          />
          In-app delivery
        </label>
      </div>
    </SectionCard>
  );
}

function DashboardPreferences({ settings, updateSection }) {
  return (
    <div className="admin-settings-section-grid">
      <SectionCard eyebrow="Display" title="Dashboard Preferences">
        <div className="admin-settings-form-grid">
          <FormField label="Theme">
            <select
              onChange={(event) => updateSection('dashboard', { theme: event.target.value })}
              value={settings.dashboard.theme}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </FormField>
          <FormField label="Default Category">
            <select
              onChange={(event) => updateSection('dashboard', { defaultCategory: event.target.value })}
              value={settings.dashboard.defaultCategory}
            >
              {categoryOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
          <FormField label="Default Status">
            <select
              onChange={(event) => updateSection('dashboard', { defaultStatus: event.target.value })}
              value={settings.dashboard.defaultStatus}
            >
              {statusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
          <FormField label="Default District">
            <select
              onChange={(event) => updateSection('dashboard', { defaultDistrict: event.target.value })}
              value={settings.dashboard.defaultDistrict}
            >
              {districtOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Layout" title="Metric Cards">
        <Toggle
          checked={settings.dashboard.showMetricCards}
          description="Show total, critical, in-progress, and resolved cards."
          label="Show metric cards"
          onChange={(value) => updateSection('dashboard', { showMetricCards: value })}
        />
        <Toggle
          checked={settings.dashboard.reorderCards}
          description="Placeholder for drag-and-drop ordering."
          label="Reorder cards"
          onChange={(value) => updateSection('dashboard', { reorderCards: value })}
        />
      </SectionCard>
    </div>
  );
}

function MapSettings({ settings, updateSection }) {
  return (
    <SectionCard eyebrow="GIS" title="Map Settings">
      <div className="admin-settings-stack">
        <Toggle
          checked={settings.map.showLowPriorityMarkers}
          label="Show low-priority markers"
          onChange={(value) => updateSection('map', { showLowPriorityMarkers: value })}
        />
        <Toggle
          checked={settings.map.markerClustering}
          label="Marker clustering"
          onChange={(value) => updateSection('map', { markerClustering: value })}
        />
        <Toggle
          checked={settings.map.realtimeUpdates}
          label="Auto real-time updates"
          onChange={(value) => updateSection('map', { realtimeUpdates: value })}
        />
      </div>
      <FormField label={`Default Zoom Level: ${settings.map.zoomLevel}`}>
        <input
          max="18"
          min="8"
          onChange={(event) => updateSection('map', { zoomLevel: Number(event.target.value) })}
          type="range"
          value={settings.map.zoomLevel}
        />
      </FormField>
    </SectionCard>
  );
}

function SystemDataSettings({ onClearLocalData }) {
  return (
    <div className="admin-settings-section-grid">
      <SectionCard eyebrow="Maintenance" title="System & Data">
        <div className="admin-settings-action-grid">
          <button onClick={onClearLocalData} type="button">Clear demo localStorage data</button>
          <button type="button">Export CSV</button>
          <button type="button">Export JSON</button>
        </div>
        <div className="admin-settings-about">
          <strong>App Version</strong>
          <span>CitizenWatch Admin v1.0.0</span>
        </div>
      </SectionCard>

      <SectionCard eyebrow="About" title="About CitizenWatch">
        <p className="admin-settings-copy">
          CitizenWatch helps LGU teams monitor citizen-submitted infrastructure reports,
          track response progress, and coordinate field action from one dashboard.
        </p>
      </SectionCard>
    </div>
  );
}

function SecurityRoles({ citizens, updateCitizenRole }) {
  return (
    <SectionCard eyebrow="Access" title="Security & Roles">
      <div className="admin-settings-users">
        {citizens.length > 0 ? (
          citizens.map((citizen) => (
            <article key={citizen.id}>
              <div>
                <strong>{citizen.name}</strong>
                <span>{citizen.id}</span>
              </div>
              <span className="admin-role-badge">{citizen.role}</span>
              <select
                aria-label={`Change role for ${citizen.name}`}
                onChange={(event) => updateCitizenRole(citizen.id, event.target.value)}
                value={citizen.role}
              >
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </article>
          ))
        ) : (
          <div className="reports-table-state">
            <h2>No users found.</h2>
            <p>Citizens will appear here after reports are submitted.</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState(readSettings);
  const [reports, setReports] = useState([]);
  const [roleOverrides, setRoleOverrides] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [feedback, setFeedback] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => subscribeReportsForModeration({ maxItems: 200 }, setReports), []);

  useEffect(() => {
    if (!admin) return;

    setSettings((currentSettings) => ({
      ...currentSettings,
      account: {
        ...currentSettings.account,
        fullName: currentSettings.account.fullName || admin.displayName || 'Local Admin',
        email: currentSettings.account.email || admin.email || 'admin@citizenwatch.local'
      }
    }));
  }, [admin]);

  const citizens = useMemo(() => {
    const citizenMap = new Map();

    reports.forEach((report) => {
      const id = report.reporterId || report.createdBy || 'citizen';
      const currentCitizen = citizenMap.get(id) || {
        id,
        name: getCitizenName(report),
        role: roleOverrides[id] || 'citizen',
        reportCount: 0
      };

      citizenMap.set(id, {
        ...currentCitizen,
        role: roleOverrides[id] || currentCitizen.role,
        reportCount: currentCitizen.reportCount + 1
      });
    });

    return Array.from(citizenMap.values());
  }, [reports, roleOverrides]);

  function updateSection(section, updates) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [section]: {
        ...currentSettings[section],
        ...updates
      }
    }));
    setFeedback('');
  }

  function updatePassword(updates) {
    setPasswordForm((currentForm) => ({ ...currentForm, ...updates }));
    setPasswordMessage('');
    setFeedback('');
  }

  function updateCitizenRole(citizenId, role) {
    setRoleOverrides((currentRoles) => ({ ...currentRoles, [citizenId]: role }));
    setFeedback('Role change saved as a UI placeholder.');
  }

  function handleSave() {
    if (passwordForm.newPassword || passwordForm.confirmPassword || passwordForm.currentPassword) {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordMessage('New password and confirm password do not match.');
        return;
      }

      if (passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 8) {
        setPasswordMessage('New password must be at least 8 characters.');
        return;
      }
    }

    writeSettings(settings);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordMessage('');
    setFeedback('Settings updated successfully.');
  }

  function handleClearLocalData() {
    [
      'citizenwatch_admin_settings',
      'citizenwatch_admin_reports',
      'citizenwatch_reports',
      'citizenwatch_alerts',
      'citizenwatch_saved_report_draft'
    ].forEach((key) => window.localStorage.removeItem(key));

    writeSettings(defaultSettings);
    setSettings(defaultSettings);
    setFeedback('Demo localStorage data cleared.');
  }

  function renderActiveTab() {
    if (activeTab === 'account') {
      return (
        <AccountSettings
          passwordForm={passwordForm}
          passwordMessage={passwordMessage}
          settings={settings}
          updatePassword={updatePassword}
          updateSection={updateSection}
        />
      );
    }

    if (activeTab === 'notifications') {
      return <NotificationSettings settings={settings} updateSection={updateSection} />;
    }

    if (activeTab === 'dashboard') {
      return <DashboardPreferences settings={settings} updateSection={updateSection} />;
    }

    if (activeTab === 'map') {
      return <MapSettings settings={settings} updateSection={updateSection} />;
    }

    if (activeTab === 'system') {
      return <SystemDataSettings onClearLocalData={handleClearLocalData} />;
    }

    return <SecurityRoles citizens={citizens} updateCitizenRole={updateCitizenRole} />;
  }

  return (
    <main className="settings-page admin-settings-page">
      <section className="settings-content admin-settings-content">
        <header className="settings-heading admin-settings-heading">
          <div>
            <span>Admin Console</span>
            <h2>Settings</h2>
            <p>Manage account details, notifications, dashboard preferences, map behavior, and access roles.</p>
          </div>
          <button onClick={handleSave} type="button">Save Settings</button>
        </header>

        {feedback && <p className="admin-settings-feedback">{feedback}</p>}

        <nav className="admin-settings-tabs" aria-label="Settings sections">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? 'active' : ''}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {renderActiveTab()}
      </section>
    </main>
  );
}
