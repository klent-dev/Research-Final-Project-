import { Link } from 'react-router-dom';
import { HiBell, HiShieldCheck, HiSignal } from 'react-icons/hi2';

export default function TopHeader() {
  return (
    <header className="top-header">
      <Link className="app-brand" to="/home" aria-label="CitizenWatch home">
        <span className="app-logo">CW</span>
        <span>
          <strong>CitizenWatch</strong>
          <small>Report. Verify. Resolve.</small>
        </span>
      </Link>

      <div className="top-header__actions">
        <span className="network-chip">
          <HiSignal aria-hidden="true" />
          Live
        </span>
        <button type="button" aria-label="Notifications">
          <HiBell aria-hidden="true" />
        </button>
        <span className="verified-chip">
          <HiShieldCheck aria-hidden="true" />
          Verified
        </span>
      </div>
    </header>
  );
}

