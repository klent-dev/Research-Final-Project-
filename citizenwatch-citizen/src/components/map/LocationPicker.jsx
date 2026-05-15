export function LocationPicker({ location, onUseCurrentLocation, isLocating }) {
  return (
    <section className="panel">
      <h2>Report Location</h2>
      <div className="map-frame">
        <p>
          {location
            ? `Latitude ${location.latitude}, Longitude ${location.longitude}`
            : 'No location selected yet.'}
        </p>
      </div>
      <button className="button" type="button" onClick={onUseCurrentLocation} disabled={isLocating}>
        {isLocating ? 'Locating...' : 'Use current GPS location'}
      </button>
    </section>
  );
}

