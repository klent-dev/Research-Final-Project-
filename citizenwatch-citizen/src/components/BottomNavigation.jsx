import { NavLink } from 'react-router-dom';
import { FiBell, FiClipboard, FiHome, FiMap, FiUser } from 'react-icons/fi';

const navItems = [
  { to: '/home', icon: FiHome, label: 'Home' },
  { to: '/reports', icon: FiClipboard, label: 'Reports' },
  { to: '/map', icon: FiMap, label: 'Map' },
  { to: '/alerts', icon: FiBell, label: 'Alerts' },
  { to: '/profile', icon: FiUser, label: 'Profile' }
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation citizen-bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/home' || item.to === '/map' || item.to === '/alerts' || item.to === '/profile'}
          className={({ isActive }) =>
            `bottom-navigation__item bottom-nav-item bottom-nav-link${isActive ? ' active' : ''}`
          }
        >
          <item.icon aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
