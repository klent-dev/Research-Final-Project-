# CitizenWatch Defense Guide

This document explains the CitizenWatch project structure, code flow, current progress, and scale-test readiness for thesis defense.

CitizenWatch is separated into two React + Vite applications that connect to the same Firebase project:

- `citizenwatch-citizen` - citizen-facing PWA for submitting and tracking infrastructure reports.
- `citizenwatch-admin` - LGU/admin console for monitoring, validating, and updating reports.

Both apps use:

- React + Vite
- React Router DOM
- Firebase Authentication, Firestore, and Storage
- Leaflet + OpenStreetMap
- Plain CSS

The citizen app also uses:

- `exifr` for EXIF GPS metadata extraction
- Browser Geolocation API for GPS validation

---

## 1. High-Level System Architecture

CitizenWatch follows a two-client architecture:

```text
Citizen PWA
  -> uploads report photo
  -> extracts EXIF GPS if available
  -> requests browser GPS
  -> validates photo GPS vs device GPS
  -> saves report to Firebase Firestore
  -> uploads photo to Firebase Storage

Firebase Backend
  -> Authentication
  -> Firestore reports collection
  -> Firebase Storage report images

Admin Console
  -> listens to Firestore reports
  -> displays reports in dashboard/table/map
  -> reviews EXIF/GPS validation result
  -> updates report status
```

The main Firestore collection is:

```text
reports
```

Expected report document structure:

```js
{
  id,
  trackingId,
  issueType,
  urgency,
  description,
  status,
  createdAt,
  updatedAt,
  createdBy,
  location: {
    lat,
    lng,
    address,
    accuracy,
    source
  },
  exif: {
    hasGps,
    lat,
    lng,
    timestamp
  },
  deviceLocation: {
    lat,
    lng,
    accuracy
  },
  locationValidation: {
    status,
    tone,
    label,
    message,
    helper,
    distanceMeters,
    source,
    checkedAt
  },
  photoUrl,
  photoPreview
}
```

---

## 2. Root Project Structure

```text
Research-Final-Project-/
├── citizenwatch-citizen/
├── citizenwatch-admin/
├── FIREBASE_ENV_SETUP.md
├── PROJECT_STATUS.md
├── PROJECT_STRUCTURE.md
├── README.md
└── CITIZENWATCH_DEFENSE_GUIDE.md
```

Purpose of root files:

- `PROJECT_STRUCTURE.md` - original folder structure planning.
- `PROJECT_STATUS.md` - current progress summary.
- `FIREBASE_ENV_SETUP.md` - Firebase environment setup instructions.
- `CITIZENWATCH_DEFENSE_GUIDE.md` - this defense-focused technical explanation.

---

## 3. Citizen App Structure

Path:

```text
citizenwatch-citizen/
```

Important folders:

```text
src/
├── assets/
├── components/
├── context/
├── firebase/
├── hooks/
├── pages/
├── routes/
├── services/
├── styles/
└── utils/
```

### `src/pages`

Contains full page screens.

Important citizen pages:

```text
pages/auth/LoginPage.jsx
pages/auth/RegisterPage.jsx
pages/dashboard/CitizenHomePage.jsx
pages/reports/CreateReportPage.jsx
pages/reports/CreateReportLocationPage.jsx
pages/reports/CreateReportDetailsPage.jsx
pages/reports/CreateReportSuccessPage.jsx
pages/reports/ReportsPage.jsx
pages/reports/ReportDetailsPage.jsx
pages/map/MapPage.jsx
pages/alerts/AlertsPage.jsx
pages/profile/ProfilePage.jsx
```

Route aliases also exist through wrapper files like `Login.jsx`, `Register.jsx`, and `Home.jsx`.

### `src/components`

Reusable UI components:

```text
BottomNavigation.jsx
TopHeader.jsx
PageContainer.jsx
PrimaryButton.jsx
ReportCard.jsx
StatusBadge.jsx
SeverityBadge.jsx
StatCard.jsx
SearchBar.jsx
EmptyState.jsx
MapPreview.jsx
```

Purpose:

- Keeps repeated UI consistent.
- Reduces duplicated markup.
- Makes pages easier to maintain.

### `src/context`

Important files:

```text
AuthContext.jsx
ReportDraftContext.jsx
```

`ReportDraftContext.jsx` is important for the multi-step report flow. It keeps the report draft while the user moves between:

```text
/reports/create
/reports/create/location
/reports/create/details
/reports/create/success
```

It stores:

- selected photo preview
- file name
- file size
- EXIF GPS result
- browser GPS result
- final selected location
- issue type
- urgency
- description
- validation result

It uses `sessionStorage` so refreshes during the current session do not immediately lose the draft.

### `src/firebase`

Firebase setup files:

```text
firebase.js
config.js
auth.js
firestore.js
storage.js
```

Purpose:

- Reads `.env` values.
- Initializes Firebase app.
- Exports Auth, Firestore, and Storage instances.
- Keeps Firebase configuration reusable and separate from page code.

### `src/services`

Business/data logic lives here.

Important files:

```text
reportService.js
localReportService.js
authService.js
storageService.js
mapService.js
exifValidationService.js
```

`reportService.js`:

- Creates infrastructure reports.
- Uploads photo to Firebase Storage.
- Saves report document to Firestore.
- Returns report ID and tracking ID.

`localReportService.js`:

- Local fallback/testing service.
- Uses `localStorage`.
- Useful for demo/testing if Firebase is unavailable.

`exifValidationService.js`:

- Reads EXIF metadata from uploaded images.
- Helps determine whether the image has GPS metadata.

### `src/utils`

Reusable helper logic.

Important files:

```text
locationValidation.js
gpsValidation.js
severity.js
mapMarkers.js
dateFormat.js
validators.js
```

`locationValidation.js` is the core EXIF/GPS validation logic.

It compares:

```text
Photo EXIF GPS location
vs
Browser/device GPS location
```

Validation rules:

```text
0m - 50m       -> Verified
51m - 200m     -> Needs Review
Above 200m     -> Location Mismatch
Only EXIF GPS   -> Photo GPS Detected
Only device GPS -> Device GPS
Manual location -> Manual Location
No location     -> Location Unavailable
```

This is important for defending the credibility of submitted reports.

---

## 4. Citizen App Routes

Defined in:

```text
citizenwatch-citizen/src/routes/AppRoutes.jsx
```

Main routes:

```text
/login
/register
/home
/dashboard
/reports
/reports/:id
/reports/create
/reports/create/location
/reports/create/details
/reports/create/success
/map
/alerts
/profile
```

Protected UI routes currently pass through `ProtectedRoute`. For research testing, auth may be bypassed depending on the current setup.

---

## 5. Citizen Report Submission Flow

### Step 1: Evidence Upload

Route:

```text
/reports/create
```

File:

```text
CreateReportPage.jsx
```

Responsibilities:

- Let citizen upload/capture a photo.
- Validate file type.
- Show preview, file name, and file size.
- Extract EXIF GPS metadata using `exifr`.
- Save photo and metadata into `ReportDraftContext`.
- Continue to Step 2.

Important behavior:

- If the uploaded image has GPS metadata, it is saved.
- If the image has no GPS metadata, the app still allows testing and continues to device GPS fallback.

### Step 2: Location Verification

Route:

```text
/reports/create/location
```

File:

```text
CreateReportLocationPage.jsx
```

Responsibilities:

- Show Leaflet/OpenStreetMap map.
- Use EXIF GPS if available.
- Request browser GPS as fallback.
- Compare EXIF GPS and browser GPS.
- Show validation result.
- Save final location and validation result.

Validation output examples:

```text
Photo GPS Detected
Location Verified
Needs Review
Location Mismatch
Device GPS
Manual Location
Location Unavailable
```

### Step 3: Issue Details

Route:

```text
/reports/create/details
```

File:

```text
CreateReportDetailsPage.jsx
```

Responsibilities:

- Select issue type.
- Select urgency.
- Enter description.
- Validate required fields.
- Generate tracking ID.
- Upload image to Firebase Storage.
- Save report to Firestore.
- Save submitted report reference for success page.

Current urgency labels:

```text
Minor
Moderate
Critical
```

### Step 4: Success

Route:

```text
/reports/create/success
```

File:

```text
CreateReportSuccessPage.jsx
```

Responsibilities:

- Show success message.
- Show generated tracking ID.
- Provide navigation to:
  - View My Report
  - Back to Home

---

## 6. Citizen Map System

Citizen map pages use:

```text
Leaflet + OpenStreetMap
```

No paid API key is required.

Important pages:

```text
pages/map/MapPage.jsx
pages/dashboard/CitizenHomePage.jsx
pages/reports/ReportDetailsPage.jsx
pages/reports/CreateReportLocationPage.jsx
```

Map behavior:

- Shows report markers from available report data.
- Marker colors are based on urgency:

```text
Minor    -> Green
Moderate -> Orange
Critical -> Red
```

The map is ready for more advanced scaling features later, such as marker clustering or barangay/district filtering.

---

## 7. Admin App Structure

Path:

```text
citizenwatch-admin/
```

Important folders:

```text
src/
├── components/
├── context/
├── firebase/
├── hooks/
├── pages/
├── routes/
├── services/
├── styles/
└── utils/
```

### `src/pages`

Important admin pages:

```text
pages/auth/AdminLoginPage.jsx
pages/dashboard/DashboardPage.jsx
pages/analytics/AnalyticsPage.jsx
pages/reports/ReportQueuePage.jsx
pages/reports/ReportMapPage.jsx
pages/reports/ReportReviewPage.jsx
pages/users/UserManagementPage.jsx
```

### `src/services`

Important files:

```text
adminReportService.js
analyticsService.js
adminAuthService.js
mapService.js
```

`adminReportService.js`:

- Subscribes to Firestore reports.
- Normalizes category, status, severity, and location validation.
- Updates report status.
- Deletes reports.

### `src/context`

Important file:

```text
AdminAuthContext.jsx
```

Purpose:

- Manages admin authentication state.
- Supports protected admin routes.

### `src/firebase`

Admin Firebase setup:

```text
firebase.js
config.js
auth.js
firestore.js
storage.js
```

Admin and Citizen use the same Firebase project but different Firebase Web App IDs.

---

## 8. Admin App Routes

Defined in:

```text
citizenwatch-admin/src/routes/AppRoutes.jsx
```

Main routes:

```text
/login
/
/reports
/reports/map
/reports/:reportId
/analytics
/users
```

Admin route meaning:

- `/` - dashboard overview.
- `/analytics` - Reports Management table.
- `/reports` - report progress monitoring.
- `/reports/map` - GIS/map tracking.
- `/reports/:reportId` - individual report review page.
- `/users` - user management placeholder/admin area.

---

## 9. Admin Report Management Flow

When a citizen submits a report:

1. The citizen app saves it to Firestore.
2. The admin app subscribes to Firestore reports.
3. The report appears in:
   - dashboard
   - reports management
   - progress monitoring
   - map tracking
4. Admin can inspect:
   - tracking ID
   - category
   - urgency
   - status
   - evidence image
   - location
   - EXIF/GPS validation result
5. Admin can update status:
   - Under Review
   - Verified
   - Resolved
   - Rejected

The admin status update is saved back to Firestore so citizen-facing pages can reflect it.

---

## 10. EXIF and GPS Validation Explanation

This is one of the most important technical features of the project.

The system checks location credibility using two sources:

```text
1. Photo GPS from EXIF metadata
2. Current browser/device GPS
```

The app calculates the distance between the two GPS points using the Haversine formula.

Validation rules:

```text
Distance <= 50 meters
  -> Location Verified

Distance <= 200 meters
  -> Needs Review

Distance > 200 meters
  -> Location Mismatch

Only photo GPS exists
  -> Photo GPS Detected

Only browser GPS exists
  -> Device GPS

No GPS exists
  -> Location Unavailable
```

Why this matters:

- Helps reduce fake reports.
- Helps LGU responders trust location data.
- Gives admin a reason to approve, review, or question a report.
- Supports thesis defense because it shows validation beyond a basic report form.

Important limitation:

- Images from Messenger, Facebook, screenshots, or downloaded images often lose EXIF GPS metadata.
- This is normal because many platforms strip metadata for privacy.
- The fallback is browser GPS or manual location.

---

## 11. Firebase Setup

Both apps use `.env` files.

Citizen:

```text
citizenwatch-citizen/.env
```

Admin:

```text
citizenwatch-admin/.env
```

Both share:

```env
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

Each app has its own:

```env
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

This means:

- Same backend
- Separate web app identities
- Cleaner Firebase Analytics separation

---

## 12. Current Progress

### Citizen App Progress

Completed:

- Mobile-first UI
- Login and register pages
- Home dashboard
- Reports page
- Report details page
- Create report flow
- Image upload preview
- EXIF GPS extraction
- Browser GPS detection
- EXIF vs browser GPS validation
- Leaflet/OpenStreetMap maps
- Firebase report submission
- Firebase Storage image upload
- Alerts UI
- Profile UI
- Bottom navigation
- Responsive layout

In progress or future improvement:

- Full Firebase Authentication enforcement
- Real user profiles from Firestore
- Manual address geocoding
- Offline/PWA service worker
- Push notifications
- More advanced map clustering

### Admin App Progress

Completed:

- Admin login page
- Admin dashboard
- Reports management table
- Report progress monitoring
- GIS/map tracking
- Firestore report subscription
- Status update workflow
- Severity display
- EXIF/GPS validation display
- Evidence image preview
- Report deletion
- Responsive admin layout

In progress or future improvement:

- Strict admin role-based authentication
- Advanced analytics charts
- Export reports to CSV/PDF
- Bulk assignment to departments
- Audit logs
- Notification system

---

## 13. Scale Test Readiness

If panelists ask about scale testing, explain that CitizenWatch is designed to scale in layers.

### Frontend Scaling

Current frontend strengths:

- React component structure keeps pages modular.
- Services isolate Firebase and data logic.
- Pages do not directly contain all backend logic.
- Vite build produces optimized static assets.
- Firebase Hosting can serve static files globally through CDN.

Possible future frontend scaling:

- Code splitting with lazy routes.
- Virtualized tables for very large admin lists.
- Map marker clustering for thousands of reports.
- Pagination/infinite scroll.

### Firestore Scaling

Current Firestore model:

```text
reports/{reportId}
```

This is simple and good for prototype/research testing.

For larger scale, add indexes for:

```text
status
createdAt
category
urgency
createdBy
barangay/district
```

Recommended large-scale query patterns:

```text
reports ordered by createdAt desc
reports filtered by status
reports filtered by district/barangay
reports filtered by category
reports filtered by urgency
```

Avoid:

- Loading all reports at once.
- Client-side filtering only for very large datasets.
- Storing large base64 images in Firestore.

Correct approach:

- Store images in Firebase Storage.
- Store only `photoUrl` in Firestore.
- Use Firestore pagination with `limit()` and `startAfter()`.

### Map Scaling

Current:

- Leaflet renders report markers.
- Good for small to moderate data.

If panel tests many reports:

- Use marker clustering.
- Limit markers to current map bounds.
- Query reports by district or geohash.
- Load nearby reports only instead of all reports.

Future geospatial improvement:

- Store geohash for each report.
- Query nearby reports by geohash prefix.
- Use Firebase-compatible geospatial libraries if needed.

### Storage Scaling

Current:

- Uploaded photos go to Firebase Storage.
- Firestore stores URL/reference.

Good practice:

- Compress images before upload.
- Limit file size.
- Store images under:

```text
reports/{reportId}/evidence.jpg
```

Security rule idea:

- Citizens can upload their own report evidence.
- Admins can read all report evidence.

---

## 14. What To Say During Defense

### If asked: Why two apps?

Answer:

CitizenWatch separates the citizen experience from LGU administration. Citizens need a fast mobile reporting flow, while LGU staff need monitoring, validation, filtering, and status management. Separating them improves security, maintainability, and user experience.

### If asked: Why Firebase?

Answer:

Firebase provides fast backend setup for authentication, real-time Firestore updates, and secure image storage. It is suitable for a thesis prototype because it supports real-time reporting without building a custom server from scratch.

### If asked: Why Leaflet instead of Google Maps or Mapbox?

Answer:

Leaflet with OpenStreetMap avoids paid API dependency and is enough for report visualization, map previews, and location validation. It is practical for research testing and community reporting.

### If asked: How do you prevent fake reports?

Answer:

The system validates location using EXIF GPS from the uploaded photo and compares it with browser GPS. If both are close, the report is marked verified. If they are far apart, it is flagged as a location mismatch. If metadata is missing, the system uses browser GPS fallback and marks it for review.

### If asked: What happens if Messenger removes EXIF metadata?

Answer:

That is expected. Many platforms remove EXIF metadata for privacy. CitizenWatch handles this by falling back to browser GPS and showing the admin that no photo GPS was found.

### If asked: Can this scale to many users?

Answer:

Yes, but the next scale improvements would be Firestore pagination, map marker clustering, geohash-based nearby queries, stricter security rules, and image compression. The current architecture already separates UI, services, context, and Firebase logic, so these upgrades can be added without rewriting the app.

---

## 15. Known Limitations

Current limitations:

- Authentication may still be partially bypassed for testing.
- Admin role enforcement needs final security hardening.
- Manual address input does not yet use reverse geocoding.
- Push notifications are UI-ready but not fully backend-connected.
- Large-scale map clustering is not yet implemented.
- Some pages use fallback handling for research testing.

These are acceptable for a prototype/research phase but should be addressed before production deployment.

---

## 16. Recommended Next Steps

Priority 1:

- Finalize Firebase Auth for citizen and admin.
- Add admin role checks using Firestore user roles.
- Lock Firestore and Storage security rules.

Priority 2:

- Add Firestore pagination.
- Add report status sync to every citizen page.
- Add admin audit logs.

Priority 3:

- Add map clustering.
- Add image compression.
- Add CSV/PDF export.
- Add notification delivery.

Priority 4:

- Deploy both apps to Firebase Hosting.
- Run defense demo with:
  - one valid GPS photo
  - one image with no EXIF metadata
  - one admin status update

---

## 17. Commands For Testing

Citizen app:

```bash
cd citizenwatch-citizen
npm install
npm run dev
npm run lint
npm run build
```

Admin app:

```bash
cd citizenwatch-admin
npm install
npm run dev
npm run lint
npm run build
```

Typical local ports:

```text
Citizen: http://127.0.0.1:5173
Admin:   http://127.0.0.1:5174
```

---

## 18. Defense Demo Script

Use this flow during presentation:

1. Open Citizen app.
2. Login or bypass login if testing mode is enabled.
3. Go to Create Report.
4. Upload a photo.
5. Show Metadata Preview.
6. Continue to Location Verification.
7. Show EXIF/device GPS validation result.
8. Enter issue details.
9. Submit report.
10. Show success tracking ID.
11. Open Admin app.
12. Show the report in Reports Management.
13. Open View Details.
14. Show:
    - evidence image
    - tracking ID
    - severity
    - status
    - location
    - EXIF/GPS validation
15. Update status to Verified or Resolved.
16. Return to citizen app and show updated report status.

This demonstrates the full end-to-end system.

