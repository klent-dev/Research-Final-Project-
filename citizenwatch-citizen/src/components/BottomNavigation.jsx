import { NavLink } from 'react-router-dom';
import { FaBell, FaClipboardList, FaHome, FaMap, FaUser } from 'react-icons/fa';

const navItems = [
  { to: '/home', icon: FaHome, label: 'Home' },
  { to: '/reports', icon: FaClipboardList, label: 'Reports' },
  { to: '/map', icon: FaMap, label: 'Map' },
  { to: '/alerts', icon: FaBell, label: 'Alerts' },
  { to: '/profile', icon: FaUser, label: 'Profile' }
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation citizen-bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className="bottom-navigation__item bottom-nav-item">
          <item.icon aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
