export function geolocationErrorMessage(error) {
  if (error?.code === 1) {
    return 'Location permission is blocked for this browser. Please allow location access in your phone settings or enter the address manually.';
  }

  if (error?.code === 2) {
    return 'GPS signal is unavailable. Move near a window or outdoors, then try again.';
  }

  if (error?.code === 3) {
    return 'GPS is taking too long to respond. Move near a window or outdoors, then try again.';
  }

  return 'GPS unavailable. Please allow location access or enter the address manually.';
}

export function normalizePositionLocation(position, source = 'gps') {
  const coords = position?.coords || {};
  const lat = Number(coords.latitude);
  const lng = Number(coords.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  const accuracy = Number(coords.accuracy);

  return {
    lat,
    lng,
    accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
    altitude: Number.isFinite(Number(coords.altitude)) ? Number(coords.altitude) : null,
    altitudeAccuracy: Number.isFinite(Number(coords.altitudeAccuracy)) ? Number(coords.altitudeAccuracy) : null,
    heading: Number.isFinite(Number(coords.heading)) ? Number(coords.heading) : null,
    speed: Number.isFinite(Number(coords.speed)) ? Number(coords.speed) : null,
    address: 'Location detected',
    source,
    subAddress: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
    capturedAt: new Date(position.timestamp || Date.now()).toISOString()
  };
}

function isBetterPosition(candidate, currentBest) {
  if (!currentBest) {
    return true;
  }

  const candidateAccuracy = Number(candidate?.coords?.accuracy);
  const currentAccuracy = Number(currentBest?.coords?.accuracy);

  if (!Number.isFinite(candidateAccuracy)) {
    return false;
  }

  if (!Number.isFinite(currentAccuracy)) {
    return true;
  }

  return candidateAccuracy < currentAccuracy;
}

export function getBestDevicePosition({
  sampleMs = 7500,
  timeout = 15000,
  maximumAge = 0,
  targetAccuracy = 25
} = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS is not supported by this browser.'));
      return;
    }

    let bestPosition = null;
    let settled = false;
    let watchId = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const finish = (position, error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (position) {
        resolve(position);
      } else {
        reject(error || new Error('No GPS reading received.'));
      }
    };

    const timerId = window.setTimeout(() => {
      finish(bestPosition, new Error('No GPS reading received before timeout.'));
    }, sampleMs);

    const finishWithPosition = (position) => {
      window.clearTimeout(timerId);
      finish(position);
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (isBetterPosition(position, bestPosition)) {
          bestPosition = position;
        }

        if (Number(position.coords?.accuracy) <= targetAccuracy) {
          finishWithPosition(position);
        }
      },
      (error) => {
        window.clearTimeout(timerId);
        finish(bestPosition, error);
      },
      {
        enableHighAccuracy: true,
        maximumAge,
        timeout
      }
    );
  });
}
