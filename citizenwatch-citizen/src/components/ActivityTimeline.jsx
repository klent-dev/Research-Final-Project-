import StatusBadge from './StatusBadge.jsx';

export default function ActivityTimeline({ items = [] }) {
  return (
    <div className="activity-timeline">
      {items.map((item) => (
        <article className="timeline-item" key={`${item.title}-${item.time}`}>
          <span className="timeline-item__dot" />
          <div>
            <div className="timeline-item__header">
              <h3>{item.title}</h3>
              <StatusBadge status={item.status} />
            </div>
            <p>{item.description}</p>
            <small>{item.time}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

