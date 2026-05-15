import { HiInbox } from 'react-icons/hi2';
import PrimaryButton from './PrimaryButton.jsx';

export default function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <section className="empty-state">
      <div className="empty-state__icon">
        <HiInbox aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionTo && <PrimaryButton to={actionTo}>{actionLabel}</PrimaryButton>}
    </section>
  );
}

