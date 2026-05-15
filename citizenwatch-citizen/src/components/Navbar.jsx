import { Link, NavLink } from 'react-router-dom';
import { HiBell, HiClipboardDocumentList, HiHome, HiPlusCircle, HiShieldCheck } from 'react-icons/hi2';

export default function Navbar() {
  return (
    <header className="navbar">
      <Link className="navbar__brand" to="/home">
        <span className="brand-mark">CW</span>
        <span>
          <strong>CitizenWatch</strong>
          <small>Citizen Portal</small>
        </span>
      </Link>
      <nav className="navbar__links" aria-label="Primary navigation">
        <NavLink to="/home"><HiHome />Home</NavLink>
        <NavLink to="/submit-report"><HiPlusCircle />Submit</NavLink>
        <NavLink to="/my-reports"><HiClipboardDocumentList />Reports</NavLink>
      </nav>
      <div className="navbar__actions">
        <button type="button" aria-label="Notifications">
          <HiBell aria-hidden="true" />
        </button>
        <span className="trust-pill"><HiShieldCheck />Verified</span>
      </div>
    </header>
  );
}
