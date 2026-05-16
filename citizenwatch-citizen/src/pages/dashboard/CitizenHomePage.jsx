import { Link } from 'react-router-dom';
import {
  FaBullhorn,
  FaChartLine,
  FaCircle,
  FaExpandAlt,
  FaLightbulb,
  FaMapMarkerAlt,
  FaPlus,
  FaPlusCircle,
  FaRoad,
  FaTint,
  FaTrash
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';

const impactStats = [
  { label: 'Submitted', value: '12' },
  { label: 'Verified', value: '08' },
  { label: 'Resolved', value: '05' }
];

const categories = [
  { label: 'Road Damage', icon: FaRoad, active: true },
  { label: 'Drainage', icon: FaTint },
  { label: 'Street Light', icon: FaLightbulb },
  { label: 'Flooding', icon: FaTint },
  { label: 'Waste', icon: FaTrash }
];

export default function CitizenHomePage() {
  return (
    <PageContainer className="citizen-home">
      <section className="citizen-greeting">
        <h1>Good morning, Citizen</h1>
        <p>Your contribution keeps our neighborhood safe and functional.</p>
      </section>

      <section className="citizen-report-card">
        <div>
          <h2>Report Infrastructure Issue</h2>
          <p>Spot a problem? Help us fix it by submitting a detailed report with photos and location data.</p>
          <Link className="citizen-report-button" to="/reports/create">
            <FaPlusCircle aria-hidden="true" />
            Create Report
          </Link>
        </div>
        <FaBullhorn className="citizen-report-card__watermark" aria-hidden="true" />
      </section>

      <section className="citizen-impact-card">
        <header>
          <p>Your Impact</p>
          <FaChartLine aria-hidden="true" />
        </header>
        <div className="citizen-impact-list">
          {impactStats.map((item) => (
            <div className="citizen-impact-row" key={item.label}>
              <span>
                <FaCircle aria-hidden="true" />
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="citizen-category-strip" aria-label="Report categories">
        {categories.map((category) => (
          <button
            className={category.active ? 'citizen-category-chip active' : 'citizen-category-chip'}
            key={category.label}
            type="button"
          >
            <category.icon aria-hidden="true" />
            {category.label}
          </button>
        ))}
      </section>

      <section className="citizen-nearby-card">
        <header className="nearby-header">
          <div className="nearby-title-group">
            <h2>Nearby Reports</h2>
            <p>Live activity in your current district</p>
          </div>
          <Link className="expand-map-button" to="/map">
            <span className="expand-map-text">
              <span>Expand</span>
              <span>Map</span>
            </span>
            <FaExpandAlt aria-hidden="true" />
          </Link>
        </header>

        <div className="citizen-map-preview">
          <div className="citizen-map-board">
            <span className="citizen-map-pin citizen-map-pin--one"><FaMapMarkerAlt /></span>
            <span className="citizen-map-pin citizen-map-pin--two"><FaMapMarkerAlt /></span>
            <span className="citizen-map-pin citizen-map-pin--three"><FaMapMarkerAlt /></span>
            <span className="citizen-map-pin citizen-map-pin--four"><FaMapMarkerAlt /></span>
            <span className="citizen-map-label citizen-map-label--flood">
              <FaCircle aria-hidden="true" />
              Active Flooding
            </span>
            <span className="citizen-map-label citizen-map-label--pothole">
              <FaCircle aria-hidden="true" />
              Pothole Resolved
            </span>
          </div>
          <Link className="citizen-map-add" to="/reports/create" aria-label="Create report">
            <FaPlus aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
