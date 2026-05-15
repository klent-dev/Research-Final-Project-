import { Link, Outlet } from 'react-router-dom';
import { logoutCitizen } from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';

export function AppShell() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/">CitizenWatch</Link>
        <nav>
          <Link to="/reports/new">New Report</Link>{' '}
          <Link to="/reports">My Reports</Link>
        </nav>
        {user && <button className="button secondary" onClick={logoutCitizen}>Sign out</button>}
      </header>
      <Outlet />
    </div>
  );
}

