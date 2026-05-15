import { NavLink } from 'react-router-dom';
import { HiClipboardDocumentList, HiHome, HiPlusCircle } from 'react-icons/hi2';

const navItems = [
  { to: '/home', icon: HiHome, label: 'Home' },
  { to: '/submit-report', icon: HiPlusCircle, label: 'Submit' },
  { to: '/my-reports', icon: HiClipboardDocumentList, label: 'Reports' }
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className="bottom-navigation__item">
          <item.icon aria-hidden="true" />
          <small>{item.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
