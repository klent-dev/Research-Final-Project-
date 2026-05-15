import { HiArrowUpRight, HiMapPin } from 'react-icons/hi2';

export default function MapPreview({
  title = 'Nearby reports',
  subtitle = 'Location preview placeholder',
  pins = 3,
  compact = false
}) {
  return (
    <div className={compact ? 'map-preview map-preview--compact' : 'map-preview'}>
      <div className="map-preview__grid" aria-hidden="true">
        {Array.from({ length: pins }).map((_, index) => (
          <span className={`map-preview__pin map-preview__pin--${index + 1}`} key={index}>
            <HiMapPin />
          </span>
        ))}
        <span className="map-preview__route" />
      </div>
      <div className="map-preview__sheet">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <button type="button" aria-label="Center map">
          <HiArrowUpRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
