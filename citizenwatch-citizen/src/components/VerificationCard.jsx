export default function VerificationCard({ icon: Icon, title, description, status, tone = 'ready' }) {
  return (
    <article className={`verification-card verification-card--${tone}`}>
      <div className="verification-card__icon">
        <Icon aria-hidden="true" />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <span>{status}</span>
      </div>
    </article>
  );
}

