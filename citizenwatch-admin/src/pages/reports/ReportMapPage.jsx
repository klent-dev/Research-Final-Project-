import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

const GIS_CENTER = {
  lat: 10.3157,
  lng: 123.8854
};

const activeIncidents = [
  {
    id: 'inc-001',
    level: 'Critical',
    title: 'Water Main Burst',
    location: 'Quezon Ave, Brgy. Central',
    time: '2m ago'
  },
  {
    id: 'inc-002',
    level: 'Pending',
    title: 'Downed Power Line',
    location: 'St. Tobias St.',
    time: '14m ago'
  }
];

const mapIncidents = [
  {
    id: 'map-inc-001',
    category: 'Critical Infrastructure',
    position: [10.3157, 123.8854],
    title: 'Critical Infrastructure Failure'
  },
  {
    id: 'map-inc-002',
    category: 'Utility',
    position: [10.3248, 123.8924],
    title: 'Downed Power Line'
  },
  {
    id: 'map-inc-003',
    category: 'Road',
    position: [10.3062, 123.8788],
    title: 'Road Surface Hazard'
  }
];

const layerOptions = ['Density Heatmap', 'Report Clustering', 'Live Traffic Flow'];
const categories = ['Utility', 'Road', 'Waste', 'Safety'];

const criticalIncidentIcon = L.divIcon({
  className: 'gis-leaflet-marker gis-leaflet-marker--critical',
  html: '<span></span>',
  iconAnchor: [14, 14],
  iconSize: [28, 28]
});

const utilityIncidentIcon = L.divIcon({
  className: 'gis-leaflet-marker gis-leaflet-marker--utility',
  html: '<span></span>',
  iconAnchor: [12, 12],
  iconSize: [24, 24]
});

function Icon({ name }) {
  const paths = {
    search: 'M10 4a6 6 0 0 1 4.8 9.6l4.3 4.3-1.4 1.4-4.3-4.3A6 6 0 1 1 10 4Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    bell: 'M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z',
    refresh: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z',
    message: 'M4 5h16v11H8.2L4 19.2V5Zm2 2v8.1l1.5-1.1H18V7H6Z',
    close: 'm6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z',
    image: 'M5 5h14v14H5V5Zm2 2v8.6l3-3 2.2 2.2 3.4-4.2L17 12.4V7H7Zm0 10h10v-1.4l-1.5-2-3.1 3.8-2.4-2.4-3 3V17Z',
    phone: 'M7.4 4h3l1.1 4-1.8 1.2a10.8 10.8 0 0 0 5.1 5.1l1.2-1.8 4 1.1v3a2 2 0 0 1-2.1 2A14.5 14.5 0 0 1 5.4 6.1 2 2 0 0 1 7.4 4Z',
    layers: 'm12 3 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4v2l-8 4-8-4v-2Zm0 5 8 4 8-4v2l-8 4-8-4v-2Z'
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function GisMapBridge({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);

  return null;
}

function GisMap({ mapRef }) {
  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function handleCenterMap() {
    mapRef.current?.setView([GIS_CENTER.lat, GIS_CENTER.lng], 14);
  }

  return (
    <div className="gis-map-canvas" aria-label="Infrastructure monitoring map">
      <MapContainer
        attributionControl={false}
        center={[GIS_CENTER.lat, GIS_CENTER.lng]}
        className="gis-leaflet-map"
        dragging
        scrollWheelZoom={false}
        zoom={14}
        zoomControl={false}
      >
        <GisMapBridge mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapIncidents.map((incident, index) => (
          <Marker
            icon={index === 0 ? criticalIncidentIcon : utilityIncidentIcon}
            key={incident.id}
            position={incident.position}
          >
            <Popup>
              <strong>{incident.title}</strong>
              <br />
              {incident.category}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="gis-map-controls">
        <button onClick={handleZoomIn} type="button" aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} type="button" aria-label="Zoom out">-</button>
        <button onClick={handleCenterMap} type="button" aria-label="Center map">o</button>
      </div>
    </div>
  );
}

export default function ReportMapPage() {
  const mapRef = useRef(null);

  return (
    <main className="gis-tracking-page">
      <header className="gis-topbar">
        <div>
          <h1>Infrastructure</h1>
          <p>Monitoring</p>
        </div>
        <label className="gis-search">
          <Icon name="search" />
          <input placeholder="Search coordinates, street names, or asset ID..." type="search" />
        </label>
        <button className="gis-icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
        <button className="gis-icon-button" type="button" aria-label="Refresh map"><Icon name="refresh" /></button>
        <button className="gis-icon-button" type="button" aria-label="Messages"><Icon name="message" /></button>
        <button className="gis-emergency-button" type="button">Emergency Alert</button>
        <span className="gis-admin-avatar" aria-hidden="true">AU</span>
      </header>

      <section className="gis-shell">
        <section className="gis-map-area">
          <GisMap mapRef={mapRef} />

          <aside className="map-layers-panel">
            <header>
              <h2>Map Layers</h2>
              <Icon name="layers" />
            </header>
            <div className="layer-options">
              {layerOptions.map((layer, index) => (
                <label key={layer}>
                  <span>{layer}</span>
                  <input defaultChecked={index === 0} type="checkbox" />
                </label>
              ))}
            </div>
            <h3>Categories</h3>
            <div className="gis-category-grid">
              {categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          </aside>

          <aside className="active-incidents-panel">
            <header>
              <h2>Active Incidents</h2>
              <span>5 Live</span>
            </header>
            {activeIncidents.map((incident) => (
              <article key={incident.id}>
                <div>
                  <strong>{incident.level}</strong>
                  <time>{incident.time}</time>
                </div>
                <h3>{incident.title}</h3>
                <p>{incident.location}</p>
              </article>
            ))}
          </aside>
        </section>

        <aside className="incident-detail-panel">
          <button className="incident-close" type="button" aria-label="Close incident detail"><Icon name="close" /></button>
          <span className="incident-id">#INC-3921-CR</span>
          <h2>Critical Infrastructure Failure</h2>
          <p className="incident-location">District 4, Main Intersection - North Ave</p>

          <section className="incident-summary">
            <h3>Report Summary</h3>
            <div className="incident-summary-grid">
              <div>
                <span>Time Reported</span>
                <strong>14:22:05 PM</strong>
              </div>
              <div>
                <span>Source Type</span>
                <strong>Citizen App</strong>
              </div>
            </div>
            <p>
              Large scale pipe burst reported near the main intersection. High pressure water causing erosion on the sidewalk and minor flooding in the underpass. Public safety hazards identified.
            </p>
          </section>

          <section className="evidence-section">
            <h3>Evidence Thumbnail</h3>
            <div className="evidence-image">
              <span />
              <button type="button"><Icon name="image" />Enlarge</button>
            </div>
          </section>

          <section className="incident-actions">
            <button className="dispatch-button" type="button">Dispatch Rapid Response Team</button>
            <button className="contact-button" type="button"><Icon name="phone" />Contact Utility Provider</button>
          </section>
        </aside>
      </section>
    </main>
  );
}
