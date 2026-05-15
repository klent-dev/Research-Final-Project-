import { NavLink, Outlet } from 'react-router-dom';
import { logoutAdmin } from '../../services/adminAuthService.js';
import { ADMIN_NAVIGATION } from '../../utils/constants.js';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <h1>CitizenWatch LGU</h1>
        {ADMIN_NAVIGATION.map((item) => (
          <NavLink key={item.path} to={item.path}>{item.label}</NavLink>
        ))}
        <button className="button" onClick={logoutAdmin}>Sign out</button>
      </aside>
      <section className="admin-main">
        <Outlet />
      </section>
    </div>
  );
}

