import { HiOutlineCheckCircle } from 'react-icons/hi2';

export default function ToastPlaceholder({ message = 'Draft saved locally. Backend integration pending.' }) {
  return (
    <aside className="toast-placeholder" aria-label="Notification placeholder">
      <HiOutlineCheckCircle aria-hidden="true" />
      <span>{message}</span>
    </aside>
  );
}

