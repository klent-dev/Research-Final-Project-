export function toReportMarker(report) {
  const latitude = report.latitude ?? report.location?.latitude ?? report.location?.lat;
  const longitude = report.longitude ?? report.location?.longitude ?? report.location?.lng;

  return {
    id: report.id,
    title: report.title,
    status: report.status,
    position: Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      ? [Number(latitude), Number(longitude)]
      : null
  };
}

