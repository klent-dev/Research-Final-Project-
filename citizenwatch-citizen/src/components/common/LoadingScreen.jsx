export function LoadingScreen({ label = 'Loading CitizenWatch...' }) {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <div className="loading-card">
        <span className="loading-spinner" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </main>
  );
}
