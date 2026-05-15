import {
  HiBellAlert,
  HiArrowTrendingUp,
  HiCamera,
  HiCheckCircle,
  HiClock,
  HiClipboardDocumentList,
  HiExclamationTriangle,
  HiMapPin,
  HiPlusCircle,
  HiSignal
} from 'react-icons/hi2';
import ActivityTimeline from '../components/ActivityTimeline.jsx';
import CategoryChip from '../components/CategoryChip.jsx';
import MapPreview from '../components/MapPreview.jsx';
import PageContainer from '../components/PageContainer.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const timelineItems = [
  {
    title: 'Sidewalk report verified',
    description: 'LGU staff marked your sidewalk report for field review.',
    status: 'under_review',
    time: 'Today, 9:45 AM'
  },
  {
    title: 'Streetlight report submitted',
    description: 'Your photo and location placeholders were saved in demo mode.',
    status: 'submitted',
    time: 'Yesterday, 6:12 PM'
  }
];

const quickCategories = ['Road Damage', 'Drainage', 'Streetlight', 'Bridge', 'Flooding', 'Other'];

export default function Home() {
  return (
    <PageContainer>
      <section className="hero-card">
        <div>
          <p className="eyebrow">Citizen reporting portal</p>
          <h1>Help improve public infrastructure.</h1>
          <p>Submit clear, location-based reports for road damage, drainage issues, streetlights, bridges, flooding, and other civic concerns.</p>
        </div>
        <div className="hero-card__actions">
          <PrimaryButton to="/submit-report" icon={HiPlusCircle}>Report Infrastructure Issue</PrimaryButton>
          <PrimaryButton to="/submit-report" variant="danger" icon={HiBellAlert}>Critical Issue</PrimaryButton>
        </div>
      </section>

      <section className="quick-category-panel">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Quick report</p>
            <h2>Select an issue type</h2>
          </div>
        </div>
        <div className="category-chip-grid">
          {quickCategories.map((category, index) => (
            <CategoryChip active={index === 0} key={category} label={category} />
          ))}
        </div>
      </section>

      <section className="stats-grid" aria-label="Quick stats">
        <StatCard icon={HiCamera} label="Submitted" value="12" detail="+3 this week" />
        <StatCard icon={HiCheckCircle} label="Verified" value="7" detail="Evidence reviewed" tone="green" />
        <StatCard icon={HiClock} label="In Progress" value="4" detail="LGU action" tone="amber" />
        <StatCard icon={HiCheckCircle} label="Resolved" value="8" detail="Completed" tone="teal" />
      </section>

      <section className="status-overview glass-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Report status</p>
            <h2>Status overview</h2>
          </div>
          <HiArrowTrendingUp />
        </div>
        <div className="status-row">
          <StatusBadge status="submitted" />
          <StatusBadge status="under_review" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="resolved" />
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest activity</p>
            <h2>Recent Activity</h2>
          </div>
          <PrimaryButton to="/my-reports" variant="ghost" icon={HiClipboardDocumentList}>View all</PrimaryButton>
        </div>
        <ActivityTimeline items={timelineItems} />
      </section>

      <section className="nearby-card glass-card">
        <div>
          <p className="eyebrow">Nearby Infrastructure Issues</p>
          <h2>3 reports near your area</h2>
          <p>Map preview placeholder for clustered civic reports around your current location.</p>
        </div>
        <MapPreview title="Community map preview" subtitle="3 nearby reports detected" pins={3} />
      </section>

      <section className="quick-actions">
        <PrimaryButton to="/submit-report" icon={HiPlusCircle}>New Report</PrimaryButton>
        <PrimaryButton to="/submit-report" variant="warning" icon={HiExclamationTriangle}>Emergency</PrimaryButton>
        <PrimaryButton to="/my-reports" variant="secondary" icon={HiClipboardDocumentList}>Track Reports</PrimaryButton>
      </section>

      <section className="service-note glass-card">
        <HiMapPin />
        <p>GPS and EXIF validation will be enabled during backend integration.</p>
        <HiSignal />
      </section>
    </PageContainer>
  );
}
