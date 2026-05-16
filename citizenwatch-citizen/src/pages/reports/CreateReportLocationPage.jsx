import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaGavel,
  FaInfoCircle,
  FaLocationArrow,
  FaMapMarkerAlt
} from 'react-icons/fa';

export default function CreateReportLocationPage() {
  const navigate = useNavigate();

  function handleConfirmLocation() {
    // TODO: Connect real GPS verification and map coordinates after UI is completed
    navigate('/reports/create/details');
  }

  function handleEditAddress() {
    // TODO: Add manual address edit form after UI is completed
    console.log('Edit Address Manually clicked');
  }

  return (
    <main className="create-location-page">
      <header className="create-location-topbar">
        <Link className="create-location-back" to="/reports/create" aria-label="Back to evidence upload">
          <FaArrowLeft aria-hidden="true" />
        </Link>
        <Link className="create-location-brand" to="/home" aria-label="CitizenWatch home">
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </Link>
        <span aria-hidden="true" />
      </header>

      <section className="create-location-step" aria-label="Report creation progress">
        <div>
          <span>Step 2 of 4</span>
          <strong>Location Verification</strong>
        </div>
        <div className="create-location-progress" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="location-map-preview" aria-label="Static location map preview">
        <div className="gps-verified-pill">
          <FaCheckCircle aria-hidden="true" />
          <span>GPS Verified</span>
          <strong>&plusmn; 2.4m</strong>
        </div>

        <div className="location-map-water location-map-water--top" />
        <div className="location-map-water location-map-water--bottom" />
        <div className="location-map-park" />
        <span className="location-map-dot location-map-dot--one" />
        <span className="location-map-dot location-map-dot--two" />

        <div className="location-pin-anchor">
          <span>
            <FaMapMarkerAlt aria-hidden="true" />
          </span>
        </div>
      </section>

      <section className="detected-location-card">
        <p className="detected-eyebrow">Detected Location</p>

        <div className="detected-address">
          <span>
            <FaLocationArrow aria-hidden="true" />
          </span>
          <div>
            <h1>452 Market Street</h1>
            <p>San Francisco, CA 94104</p>
          </div>
        </div>

        <div className="location-accuracy-box">
          <FaInfoCircle aria-hidden="true" />
          <p>
            Exact location data helps municipal authorities identify and respond to infrastructure issues 30% faster.
          </p>
        </div>

        <button className="confirm-location-button" onClick={handleConfirmLocation} type="button">
          Confirm Location
          <FaArrowRight aria-hidden="true" />
        </button>

        <button className="edit-address-button" onClick={handleEditAddress} type="button">
          Edit Address Manually
        </button>
      </section>
    </main>
  );
}
