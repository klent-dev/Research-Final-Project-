export function toReportMarker(report) {
  return {
    id: report.id,
    title: report.title,
    status: report.status,
    position: report.location
      ? [report.location.latitude, report.location.longitude]
      : null
  };
}

