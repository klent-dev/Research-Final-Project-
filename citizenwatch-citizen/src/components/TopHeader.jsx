import { Link } from 'react-router-dom';
import { FaGavel, FaSearch } from 'react-icons/fa';

export default function TopHeader() {
  return (
    <header className="top-header">
      <Link className="app-brand" to="/home" aria-label="CitizenWatch home">
        <span className="app-logo"><FaGavel aria-hidden="true" /></span>
        <span>
          <strong>CitizenWatch</strong>
        </span>
      </Link>

      <div className="top-header__actions">
        <button type="button" aria-label="Search reports">
          <FaSearch aria-hidden="true" />
        </button>
        <span className="citizen-avatar" aria-label="Citizen profile">C</span>
      </div>
    </header>
  );
}
