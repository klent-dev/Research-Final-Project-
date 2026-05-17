import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBars,
  FaFilter,
  FaGavel,
  FaLayerGroup,
  FaLightbulb,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaRoad,
  FaTint,
  FaTools,
  FaWater
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import '../../styles/map.css';

const filters = ['All', 'Road Damage', 'Drainage', 'Street Light', 'Flooding', 'Resolved'];

const nearbyReports = [
  {
    title: 'Road Damage on Escario St.',
    meta: '0.8 km away • 2h ago',
    status: 'UNDER REVIEW',
    category: 'Road Damage',
    tone: 'review',
    icon: FaTools
  },
  {
    title: 'Flooding near JY',
    meta: '1.2 km away • 5h ago',
    status: 'VERIFIED',
    category: 'Flooding',
    tone: 'verified',
    icon: FaWater
  },
  {
    title: 'Street Light Issue',
    meta: '2.0 km away • 1d ago',
    status: 'RESOLVED',
    category: 'Street Light',
    tone: 'resolved',
    icon: FaLightbulb
  }
];

const mapPins = [
  { label: 'Road damage pin', className: 'community-pin--road', icon: FaRoad },
  { label: 'Flooding pin', className: 'community-pin--flood', icon: FaWater },
  { label: 'Street light pin', className: 'community-pin--light', icon: FaLightbulb },
  { label: 'Drainage pin', className: 'community-pin--drainage', icon: FaTint }
];

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredReports = useMemo(() => {
    if (activeFilter === 'All') {
      return nearbyReports;
    }

    if (activeFilter === 'Resolved') {
      return nearbyReports.filter((report) => report.status === 'RESOLVED');
    }

    return nearbyReports.filter((report) => report.category === activeFilter);
  }, [activeFilter]);

  return (
    <PageContainer className="community-map-page">
      <header className="community-map-topbar">
        <div className="community-map-brand">
          <FaBars aria-hidden="true" />
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </div>
        <img src={communityImage} alt="Citizen profile" />
      </header>

      <section className="community-map-title">
        <h1>Community Map</h1>
        <p>View nearby infrastructure reports and hazard locations</p>
      </section>

      <section className="community-map-filters" aria-label="Map report filters">
        {filters.map((filter) => (
          <button
            className={activeFilter === filter ? 'community-filter-chip active' : 'community-filter-chip'}
            key={filter}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </section>

      <section className="community-map-card" aria-label="Static community map preview">
        {/* TODO: Replace static map with Leaflet layers and live report coordinates after UI is completed */}
        <div className="community-map-grid" aria-hidden="true" />
        <div className="community-map-river" aria-hidden="true" />
        <div className="community-map-park" aria-hidden="true" />

        {mapPins.map((pin) => {
          const Icon = pin.icon;

          return (
            <span className={`community-map-pin ${pin.className}`} aria-label={pin.label} key={pin.label}>
              <Icon aria-hidden="true" />
            </span>
          );
        })}

        <article className="community-map-popup">
          <div>
            <h2>Road Damage</h2>
            <span className="community-status-pill community-status-pill--review">Under Review</span>
          </div>
          <strong>Escario St.</strong>
          <p>Severe road damage reported</p>
          <span>
            <FaMapMarkerAlt aria-hidden="true" />
          </span>
        </article>

        <div className="community-map-controls" aria-label="Map controls">
          <button type="button" aria-label="Zoom in">
            <FaPlus aria-hidden="true" />
          </button>
          <button type="button" aria-label="Zoom out">
            <FaMinus aria-hidden="true" />
          </button>
          <button type="button" aria-label="Map layers">
            <FaLayerGroup aria-hidden="true" />
          </button>
          <button type="button" aria-label="Filter map reports">
            <FaFilter aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="community-nearby-section">
        <header>
          <h2>Nearby Reports</h2>
          <button type="button">See All</button>
        </header>

        <div className="community-nearby-list">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const Icon = report.icon;

              return (
                <article className="community-report-card" key={report.title}>
                  <span className={`community-report-icon community-report-icon--${report.tone}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{report.title}</h3>
                    <p>
                      <FaMapMarkerAlt aria-hidden="true" />
                      {report.meta}
                    </p>
                  </div>
                  <span className={`community-status-pill community-status-pill--${report.tone}`}>
                    {report.status}
                  </span>
                </article>
              );
            })
          ) : (
            <div className="community-map-empty">
              <FaMapMarkerAlt aria-hidden="true" />
              <h3>No nearby reports found</h3>
              <p>Try adjusting map filters.</p>
            </div>
          )}
        </div>
      </section>

      <Link className="community-map-add-button" to="/reports/create" aria-label="Create new report">
        <FaPlus aria-hidden="true" />
      </Link>
    </PageContainer>
  );
}
