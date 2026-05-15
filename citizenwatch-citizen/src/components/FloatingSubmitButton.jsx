import { Link } from 'react-router-dom';
import { HiPlus } from 'react-icons/hi2';

export default function FloatingSubmitButton() {
  return (
    <Link className="floating-submit" to="/submit-report" aria-label="Report issue">
      <HiPlus aria-hidden="true" />
      <span>Report Issue</span>
    </Link>
  );
}

