import { Link } from 'react-router-dom';
import { HiPlus } from 'react-icons/hi2';

export default function FloatingActionButton() {
  return (
    <Link className="fab" to="/submit-report" aria-label="Report an issue">
      <HiPlus aria-hidden="true" />
      <span>Report</span>
    </Link>
  );
}

