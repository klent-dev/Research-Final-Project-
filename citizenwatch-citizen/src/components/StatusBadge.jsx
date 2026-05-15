const statusLabels = {
  submitted: 'Submitted',
  pending: 'Pending',
  validating: 'Validating',
  verified: 'Verified',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved'
};

export default function StatusBadge({ status = 'submitted' }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {statusLabels[status] ?? status}
    </span>
  );
}
