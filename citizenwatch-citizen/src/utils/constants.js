export const REPORT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
};

export const REPORT_CATEGORIES = [
  'Road Damage',
  'Streetlight Issue',
  'Drainage Problem',
  'Garbage Collection',
  'Public Safety',
  'Other'
];

export const DEFAULT_GPS_RADIUS_METERS = Number(import.meta.env.VITE_REPORT_GPS_RADIUS_METERS ?? 100);

