export const sampleCitizenReports = [
  {
    id: 'INC-3921',
    reportId: 'INC-3921',
    name: 'Water Main Burst',
    title: 'Water Main Burst',
    category: 'Drainage',
    issueType: 'Drainage',
    district: 'District 4',
    location: {
      lat: 10.314,
      lng: 123.911,
      address: 'Main Intersection - North Ave',
      district: 'District 4'
    },
    latitude: 10.314,
    longitude: 123.911,
    status: 'pending',
    severity: 'critical',
    progress: 0,
    description: 'Pipe burst reported near main intersection',
    sourceType: 'Citizen App',
    createdAt: '2026-05-20T11:05:00.000Z',
    updatedAt: '2026-05-20T11:05:00.000Z',
    subtasks: [
      { name: 'Assigned', done: false },
      { name: 'Inspection', done: false }
    ],
    isSample: true
  },
  {
    id: 'sample-cw-2026-001',
    trackingId: '#INC-2026-001',
    title: 'Drainage Report - Clogged roadside canal',
    category: 'Drainage',
    issueType: 'Drainage',
    status: 'pending',
    severity: 'High',
    urgency: 'High',
    description: 'Canal is clogged and water is overflowing near the road after heavy rain.',
    location: {
      lat: 10.3157,
      lng: 123.8854,
      address: 'Ramon Duterte Street, Cebu City',
      district: 'Cebu City - South District'
    },
    district: 'Cebu City - South District',
    sourceType: 'Citizen App',
    createdAt: '2026-05-20T10:30:00.000Z',
    isSample: true
  },
  {
    id: 'sample-cw-2026-002',
    trackingId: '#INC-2026-002',
    title: 'Street Lighting Report - Broken lamp post',
    category: 'Street Lighting',
    issueType: 'Street Lighting',
    status: 'in_progress',
    severity: 'Medium',
    urgency: 'Medium',
    description: 'Street light is not working near the pedestrian crossing.',
    location: {
      lat: 10.3248,
      lng: 123.8924,
      address: 'General Maxilom Avenue, Cebu City',
      district: 'Cebu City - North District'
    },
    district: 'Cebu City - North District',
    sourceType: 'Citizen App',
    createdAt: '2026-05-20T10:12:00.000Z',
    subtasks: [
      { name: 'Verify location', completed: true },
      { name: 'Assign repair crew', completed: false }
    ],
    isSample: true
  },
  {
    id: 'sample-cw-2026-003',
    trackingId: '#INC-2026-003',
    title: 'Waste Management Report - Uncollected garbage',
    category: 'Waste Management',
    issueType: 'Waste Management',
    status: 'resolved',
    severity: 'Low',
    urgency: 'Low',
    description: 'Garbage bags were left beside the road for several days.',
    location: {
      lat: 10.3194,
      lng: 123.8762,
      address: 'A. Soriano Avenue, Mandaue City',
      district: 'Mandaue City - Lone District'
    },
    district: 'Mandaue City - Lone District',
    sourceType: 'Citizen App',
    createdAt: '2026-05-20T09:44:00.000Z',
    isSample: true
  }
];
