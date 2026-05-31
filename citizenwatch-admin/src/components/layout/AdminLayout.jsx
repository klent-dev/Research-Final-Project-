import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { logoutAdmin } from '../../services/adminAuthService.js';
import { ADMIN_NAVIGATION } from '../../utils/constants.js';

function SidebarIcon({ name }) {
  if (name === 'dashboard') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
      </svg>
    );
  }

  if (name === 'infrastructure') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 21V5h10v4h6v12H4Zm3-3h2v-2H7v2Zm0-4h2v-2H7v2Zm0-4h2V8H7v2Zm4 8h2v-2h-2v2Zm0-4h2v-2h-2v2Zm0-4h2V8h-2v2Zm4 8h2v-2h-2v2Zm0-4h2v-2h-2v2Z" />
      </svg>
    );
  }

  if (name === 'gis') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 5.2 8.8 3l6.4 2.2L21 3v15.8L15.2 21l-6.4-2.2L3 21V5.2Zm4 1.6-2 .8v10.5l2-.8V6.8Zm2-.1v10.4l5 1.7V8.4L9 6.7Zm7 1.1v10.5l3-1.1V6.7l-3 1.1Z" />
      </svg>
    );
  }

  if (name === 'reports') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 2 1.4 7.1 6-4-4 6 7.1 1.4-7.1 1.4 4 6-6-4L12 23l-1.4-7.1-6 4 4-6L1.5 12.5l7.1-1.4-4-6 6 4L12 2Z" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.2 2h3.6l.7 3.1c.5.2 1 .4 1.5.7l2.7-1.7 2.5 2.5-1.7 2.7c.3.5.5 1 .7 1.5l3.1.7v3.6l-3.1.7c-.2.5-.4 1-.7 1.5l1.7 2.7-2.5 2.5-2.7-1.7c-.5.3-1 .5-1.5.7l-.7 3.1h-3.6l-.7-3.1c-.5-.2-1-.4-1.5-.7l-2.7 1.7-2.5-2.5 1.7-2.7c-.3-.5-.5-1-.7-1.5l-3.1-.7v-3.6l3.1-.7c.2-.5.4-1 .7-1.5L2.8 6.6l2.5-2.5L8 5.8c.5-.3 1-.5 1.5-.7L10.2 2Zm1.8 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    );
  }

  if (name === 'help') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a8 8 0 0 0-8 8h2a6 6 0 1 1 8.9 5.2L14 17.7V21h-4v-4.3l2.9-1.7A4 4 0 1 0 8 11H6a6 6 0 1 1 6 6v2h.1l.4-.7 3.4-2A8 8 0 0 0 12 3Zm-1 16h2v2h-2v-2Z" />
      </svg>
    );
  }

  if (name === 'signout') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h9v2H6v12h7v2H4V4Zm12.6 4.6L20 12l-3.4 3.4-1.4-1.4 1-1H10v-2h6.2l-1-1 1.4-1.4Z" />
      </svg>
    );
  }

  if (name === 'collapse') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15.4 6 1.4 1.4L12.2 12l4.6 4.6-1.4 1.4-6-6 6-6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 5.4v6.1c0 5 3.4 9.6 8 10.5 4.6-.9 8-5.5 8-10.5V5.4L12 2Zm-3 8h6v2H9v-2Zm0 4h6v2H9v-2Zm0-8h6v2H9V6Z" />
    </svg>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  async function handleSignOut() {
    await logoutAdmin();
    navigate('/login', { replace: true });
  }

  return (
    <div className={isSidebarCollapsed ? 'admin-layout admin-layout--sidebar-collapsed' : 'admin-layout'}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true"><SidebarIcon name="brand" /></span>
          <div>
            <h1>CitizenWatch</h1>
            <p>LGU Admin Console</p>
          </div>
          <button
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="sidebar-collapse"
            onClick={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
            type="button"
          >
            <SidebarIcon name="collapse" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {ADMIN_NAVIGATION.map((item) => (
            <NavLink aria-label={item.label} key={item.path} to={item.path} end>
              <span className={`sidebar-icon sidebar-icon--${item.icon}`} aria-hidden="true"><SidebarIcon name={item.icon} /></span>
              <strong>{item.label}</strong>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-secondary">
          <button className="sidebar-account" type="button">
            <span className="sidebar-icon sidebar-icon--help" aria-hidden="true"><SidebarIcon name="help" /></span>
            <div>
              <strong>Help Center</strong>
              <p>Support desk</p>
            </div>
          </button>

          <button className="sidebar-signout" onClick={handleSignOut} type="button">
            <span className="sidebar-icon sidebar-icon--signout" aria-hidden="true"><SidebarIcon name="signout" /></span>
            <strong>Sign out</strong>
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <Outlet />
      </section>
    </div>
  );
}

