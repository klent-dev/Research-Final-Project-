import { Link } from 'react-router-dom';
import { ReportMap } from '../components/map/ReportMap.jsx';

export default function HomePage() {
  return (
    <main className="page">
      <h1>CitizenWatch</h1>
      <p>Report public infrastructure issues with verified photo and GPS evidence.</p>
      <Link className="button" to="/reports/new">Create report</Link>
      <ReportMap />
    </main>
  );
}

