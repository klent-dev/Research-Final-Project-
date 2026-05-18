import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.2 2h3.6l.7 3.1c.5.2 1 .4 1.5.7l2.7-1.7 2.5 2.5-1.7 2.7c.3.5.5 1 .7 1.5l3.1.7v3.6l-3.1.7c-.2.5-.4 1-.7 1.5l1.7 2.7-2.5 2.5-2.7-1.7c-.5.3-1 .5-1.5.7l-.7 3.1h-3.6l-.7-3.1c-.5-.2-1-.4-1.5-.7l-2.7 1.7-2.5-2.5 1.7-2.7c-.3-.5-.5-1-.7-1.5l-3.1-.7v-3.6l3.1-.7c.2-.5.4-1 .7-1.5L2.8 6.6l2.5-2.5L8 5.8c.5-.3 1-.5 1.5-.7L10.2 2Zm1.8 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await logoutAdmin();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div>
            <h1>CitizenWatch</h1>
            <p>LGU Admin Consule</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {ADMIN_NAVIGATION.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}>
              <span aria-hidden="true"><SidebarIcon name={item.icon} /></span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-new-report" type="button">New Report</button>

        <div className="sidebar-account">
          <span aria-hidden="true">?</span>
          <div>
            <strong>Help Center</strong>
            <p>Support desk</p>
          </div>
        </div>

        <button className="button sidebar-signout" onClick={handleSignOut} type="button">Sign out</button>
      </aside>
      <section className="admin-main">
        <Outlet />
      </section>
    </div>
  );
}

