import { useState } from 'react';

const loginHistory = [
  ['192.168.1.45 (Quezon City)', 'Just now'],
  ['10.0.0.12 (Command Center)', '2h ago']
];

const notificationOptions = [
  ['System Critical Alerts', 'Immediate push and desktop notifications', true],
  ['Email Report Summaries', 'Daily infrastructure health digests', true],
  ['Emergency Broadcasts', 'External siren and public alert integration', false]
];

const teamMembers = [
  ['John Doe', 'Supervisor', 'JD'],
  ['Alice Moore', 'Dispatcher', 'AM'],
  ['Robert King', 'Analyst', 'RK']
];

function Icon({ name }) {
  const paths = {
    search: 'M10 4a6 6 0 0 1 4.8 9.6l4.3 4.3-1.4 1.4-4.3-4.3A6 6 0 1 1 10 4Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    bell: 'M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z',
    refresh: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z',
    message: 'M4 5h16v11H8.2L4 19.2V5Zm2 2v8.1l1.5-1.1H18V7H6Z',
    security: 'M12 2 20 5v6c0 5-3.2 8.7-8 11-4.8-2.3-8-6-8-11V5l8-3Zm0 3.2L6 7.4V11c0 3.5 2 6.2 6 8.2 4-2 6-4.7 6-8.2V7.4l-6-2.2Z',
    notifications: 'M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z',
    team: 'M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM3 19a5 5 0 0 1 10 0v1H3v-1Zm10.5 1v-1a6.5 6.5 0 0 0-1.2-3.8A4.5 4.5 0 0 1 21 17.5V20h-7.5Z',
    config: 'M10.2 2h3.6l.7 3.1c.5.2 1 .4 1.5.7l2.7-1.7 2.5 2.5-1.7 2.7c.3.5.5 1 .7 1.5l3.1.7v3.6l-3.1.7c-.2.5-.4 1-.7 1.5l1.7 2.7-2.5 2.5-2.7-1.7c-.5.3-1 .5-1.5.7l-.7 3.1h-3.6l-.7-3.1c-.5-.2-1-.4-1.5-.7l-2.7 1.7-2.5-2.5 1.7-2.7c-.3-.5-.5-1-.7-1.5l-3.1-.7v-3.6l3.1-.7c.2-.5.4-1 .7-1.5L2.8 6.6l2.5-2.5L8 5.8c.5-.3 1-.5 1.5-.7L10.2 2Zm1.8 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    addUser: 'M9 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm-7 9a7 7 0 0 1 14 0v1H2v-1Zm16-11V6h2v3h3v2h-3v3h-2v-3h-3V9h3Z'
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export default function UserManagementPage() {
  const [activePanel, setActivePanel] = useState('settings');

  if (activePanel === 'password') {
    return (
      <main className="settings-page password-page">
        <section className="password-content">
          <nav className="password-breadcrumb" aria-label="Breadcrumb">
            <button onClick={() => setActivePanel('settings')} type="button">Settings</button>
            <span>›</span>
            <strong>Change Password</strong>
          </nav>

          <header className="password-heading">
            <h1>Security &amp; Password</h1>
            <p>Manage your account security and update your login credentials.</p>
          </header>

          <form className="password-card">
            <header>
              <span aria-hidden="true">↻</span>
              <div>
                <h2>Update Password</h2>
                <p>Secure your account with a unique password</p>
              </div>
            </header>

            <label>
              <span>Current Password</span>
              <div>
                <input defaultValue="currentpass" type="password" />
                <button type="button" aria-label="Show current password">⊘</button>
              </div>
            </label>

            <label>
              <span>New Password</span>
              <div>
                <input placeholder="Enter new password" type="password" />
                <button type="button" aria-label="Show new password">⊙</button>
              </div>
            </label>

            <label>
              <span>Confirm New Password</span>
              <input placeholder="Repeat new password" type="password" />
            </label>

            <section className="password-standards">
              <h3>Security Standards</h3>
              <div>
                <span className="complete">At least 12 characters</span>
                <span>Include at least one number</span>
                <span>Special character (!@#$%^&amp;*)</span>
                <span>Mixed case (Aa)</span>
              </div>
            </section>

            <footer>
              <button type="submit">Update Password</button>
              <button onClick={() => setActivePanel('settings')} type="button">Cancel</button>
            </footer>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <header className="settings-topbar">
        <h1>Infrastructure Monitoring</h1>
        <label className="settings-search">
          <Icon name="search" />
          <input placeholder="Search parameters..." type="search" />
        </label>
        <button className="settings-emergency" type="button">Emergency Alert</button>
        <button type="button" aria-label="Notifications"><Icon name="bell" /></button>
        <button type="button" aria-label="Refresh"><Icon name="refresh" /></button>
        <button type="button" aria-label="Messages"><Icon name="message" /></button>
        <section className="settings-user-chip">
          <span aria-hidden="true">AU</span>
          <div>
            <strong>Admin User</strong>
            <small>LGU Level 4</small>
          </div>
        </section>
      </header>

      <section className="settings-content">
        <header className="settings-heading">
          <h2>Console Settings</h2>
          <p>Manage your account preferences, team permissions, and system configurations.</p>
        </header>

        <section className="settings-grid">
          <article className="settings-card profile-card">
            <div className="profile-avatar">
              <span>AD</span>
              <i aria-hidden="true">✓</i>
            </div>
            <div>
              <h3>Administrator</h3>
              <p>admin.console@lgu.gov.ph</p>
              <span>Super Admin</span>
            </div>
            <footer>
              <button onClick={() => setActivePanel('password')} type="button">Change Password</button>
              <button type="button">Update Contact Info</button>
            </footer>
          </article>

          <article className="settings-card system-card">
            <header>
              <Icon name="config" />
              <h3>System Configuration</h3>
            </header>
            <section className="refresh-card">
              <div>
                <span>GIS Refresh Interval</span>
                <strong>Every 5m</strong>
              </div>
              <div className="settings-slider"><i /></div>
            </section>
            <section className="gateway-card">
              <span aria-hidden="true">◆</span>
              <div>
                <strong>API Gateway Status</strong>
                <p>Connected & Secure</p>
              </div>
              <i aria-hidden="true" />
            </section>
          </article>

          <article className="settings-card security-card">
            <header>
              <Icon name="security" />
              <h3>Security</h3>
            </header>
            <div className="settings-toggle-row">
              <div>
                <strong>Two-Factor Authentication</strong>
                <p>Required for all admins</p>
              </div>
              <label className="toggle-switch">
                <input defaultChecked type="checkbox" />
                <span />
              </label>
            </div>
            <h4>Recent Login History</h4>
            {loginHistory.map(([address, time]) => (
              <div className="login-row" key={address}>
                <span>{address}</span>
                <strong>{time}</strong>
              </div>
            ))}
            <button className="text-action" type="button">Manage All Sessions</button>
          </article>

          <article className="settings-card notifications-card">
            <header>
              <Icon name="notifications" />
              <h3>Notifications</h3>
            </header>
            {notificationOptions.map(([title, description, checked]) => (
              <label className="notification-option" key={title}>
                <input defaultChecked={checked} type="checkbox" />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </article>

          <article className="settings-card team-card">
            <header>
              <div>
                <Icon name="team" />
                <h3>Team Management</h3>
              </div>
              <button type="button" aria-label="Add user"><Icon name="addUser" /></button>
            </header>
            {teamMembers.map(([name, role, initials]) => (
              <article className="team-member" key={name}>
                <span aria-hidden="true">{initials}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{role}</small>
                </div>
                <button type="button" aria-label={`More actions for ${name}`}>⋮</button>
              </article>
            ))}
            <button className="view-admins-button" type="button">View All 12 Admins</button>
          </article>
        </section>
      </section>
    </main>
  );
}
