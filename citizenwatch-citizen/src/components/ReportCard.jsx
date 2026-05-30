import StatusBadge from './StatusBadge.jsx';
import { HiCalendarDays, HiMapPin } from 'react-icons/hi2';
import SeverityBadge from './SeverityBadge.jsx';
import MapPreview from './MapPreview.jsx';
import { toDisplayText } from '../utils/displayText.js';

export default function ReportCard({ report }) {
  return (
    <article className={`report-card report-card--${report.priority ?? 'moderate'}`}>
      <span className="report-card__priority" aria-hidden="true" />
      <div className="report-card__header">
        <div>
          <p className="eyebrow">{toDisplayText(report.category, 'Report')}</p>
          <h3>{toDisplayText(report.title, 'Infrastructure Report')}</h3>
        </div>
        <div className="report-card__badges">
          <SeverityBadge severity={report.severity ?? 'Moderate'} />
          <StatusBadge status={report.status} />
        </div>
      </div>
      <div className="report-card__image">
        <span />
        <small>Image preview</small>
      </div>
      <p className="report-card__description">{toDisplayText(report.description, 'No description provided.')}</p>
      {report.progress && (
        <div className="progress-timeline" aria-label="Report progress">
          {report.progress.map((step) => (
            <span className={step.done ? 'done' : ''} key={toDisplayText(step.label)}>{toDisplayText(step.label)}</span>
          ))}
        </div>
      )}
      <MapPreview title={toDisplayText(report.location, 'Location')} subtitle={toDisplayText(report.mapHint, 'Location preview placeholder')} pins={1} compact />
      <div className="report-card__meta">
        <span aria-label="Report date"><HiCalendarDays />{toDisplayText(report.date, 'Recently')}</span>
        <span aria-label="Report location"><HiMapPin />{toDisplayText(report.location, 'Location')}</span>
      </div>
    </article>
  );
}
