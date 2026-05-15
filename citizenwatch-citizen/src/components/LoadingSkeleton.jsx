export default function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} className={`skeleton-line skeleton-line--${index + 1}`} />
      ))}
    </div>
  );
}

