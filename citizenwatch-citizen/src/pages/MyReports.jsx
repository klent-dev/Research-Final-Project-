import { HiClipboardDocumentList } from 'react-icons/hi2';
import EmptyState from '../components/EmptyState.jsx';
import FilterTabs from '../components/FilterTabs.jsx';
import PageContainer from '../components/PageContainer.jsx';
import ReportCard from '../components/ReportCard.jsx';
import SearchBar from '../components/SearchBar.jsx';

const reports = [
  {
    title: 'Pothole near elementary school',
    category: 'Road damage',
    description: 'Large pothole affecting tricycle and pedestrian movement.',
    status: 'in_progress',
    severity: 'High',
    date: 'May 12, 2026',
    location: 'School Zone',
    priority: 'high',
    mapHint: 'Outside north gate',
    progress: [
      { label: 'Submitted', done: true },
      { label: 'Verified', done: true },
      { label: 'Action', done: true },
      { label: 'Closed', done: false }
    ]
  },
  {
    title: 'Blocked drainage canal',
    category: 'Drainage problem',
    description: 'Water buildup after rainfall; drainage cover needs clearing.',
    status: 'under_review',
    severity: 'Medium',
    date: 'May 10, 2026',
    location: 'Riverside Street',
    priority: 'medium',
    mapHint: 'Near bridge approach',
    progress: [
      { label: 'Submitted', done: true },
      { label: 'Verified', done: false },
      { label: 'Action', done: false },
      { label: 'Closed', done: false }
    ]
  },
  {
    title: 'Resolved streetlight outage',
    category: 'Streetlight issue',
    description: 'Lamp replacement completed by maintenance team.',
    status: 'resolved',
    severity: 'Low',
    date: 'May 8, 2026',
    location: 'Public Market',
    priority: 'low',
    mapHint: 'Market entrance',
    progress: [
      { label: 'Submitted', done: true },
      { label: 'Verified', done: true },
      { label: 'Action', done: true },
      { label: 'Closed', done: true }
    ]
  }
];

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
