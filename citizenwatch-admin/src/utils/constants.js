export const REPORT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
};

export const ADMIN_NAVIGATION = [
  { icon: 'dashboard', label: 'Dashboard', path: '/' },
  { icon: 'infrastructure', label: 'Infrastructure', path: '/reports' },
  { icon: 'gis', label: 'GIS Tracking', path: '/reports/map' },
  { icon: 'reports', label: 'Reports', path: '/analytics' },
  { icon: 'settings', label: 'Settings', path: '/users' }
];

