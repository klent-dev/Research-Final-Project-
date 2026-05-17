import { HiClipboardDocumentList } from 'react-icons/hi2';
import EmptyState from '../components/EmptyState.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import PageContainer from '../components/PageContainer.jsx';
import ReportCard from '../components/ReportCard.jsx';
import SearchBar from '../components/SearchBar.jsx';

// TODO: Load reports from Firestore
const reports = [];

export default function MyReports() {
  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">Citizen records</p>
        <h1>My Reports</h1>
        <p>Search, filter, and monitor your submitted reports with status, severity, location, and progress details.</p>
      </section>

      <SearchBar placeholder="Search reports by title or location" />

      <FilterTabs />

      <section className="summary-strip">
        <div>
          <HiClipboardDocumentList />
          <span>{reports.length} active records</span>
        </div>
        <span>Updated today</span>
      </section>

      <section className="report-list">
        {reports.map((report) => (
          <ReportCard key={report.title} report={report} />
        ))}
      </section>

      {reports.length === 0 && (
        <EmptyState
          title="No reports yet"
          description="Once you submit an issue, your report history and LGU progress will appear here."
          actionLabel="Submit first report"
          actionTo="/submit-report"
        />
      )}
    </PageContainer>
  );
}
