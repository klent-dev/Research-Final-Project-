import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="admin-main">
      <h1>Page not found</h1>
      <Link to="/">Return to dashboard</Link>
    </main>
  );
}

