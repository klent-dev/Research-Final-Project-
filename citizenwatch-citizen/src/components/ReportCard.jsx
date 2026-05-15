import StatusBadge from './StatusBadge.jsx';
import { HiCalendarDays, HiMapPin } from 'react-icons/hi2';
import SeverityBadge from './SeverityBadge.jsx';
import MapPreview from './MapPreview.jsx';

export default function ReportCard({ report }) {
  return (
    <article className={`report-card report-card--${report.priority ?? 'medium'}`}>
      <span className="report-card__priority" aria-hidden="true" />
      <div className="report-card__header">
        <div>
          <p className="eyebrow">{report.category}</p>
          <h3>{report.title}</h3>
        </div>
        <div className="report-card__badges">
          <SeverityBadge severity={report.severity ?? 'Medium'} />
          <StatusBadge status={report.status} />
        </div>
      </div>
      <div className="report-card__image">
        <span />
        <small>Image preview</small>
      </div>
      <p className="report-card__description">{report.description}</p>
      {report.progress && (
        <div className="progress-timeline" aria-label="Report progress">
          {report.progress.map((step) => (
            <span className={step.done ? 'done' : ''} key={step.label}>{step.label}</span>
          ))}
        </div>
      )}
      <MapPreview title={report.location} subtitle={report.mapHint ?? 'Location preview placeholder'} pins={1} compact />
      <div className="report-card__meta">
        <span aria-label="Report date"><HiCalendarDays />{report.date}</span>
        <span aria-label="Report location"><HiMapPin />{report.location}</span>
      </div>
    </article>
  );
}
