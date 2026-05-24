# CitizenWatch System Documentation

Defense and skill-test guide for the CitizenWatch research project.

CitizenWatch is a two-application reporting system for community infrastructure issues. It has a citizen-facing mobile PWA for submitting reports and an admin-facing LGU dashboard for monitoring, validating, and updating those reports.

Live deployments:

- Citizen app: https://citizenwatch-citizen.web.app
- Admin app: https://citizenwatch-admin.web.app

Firebase project:

- Project ID: `citizenwatch-7ccb2`
- Hosting targets: `citizen`, `admin`
- Main Firestore collection: `reports`

---

## 1. System Overview

CitizenWatch solves a common LGU reporting problem: citizens can report damaged infrastructure, but reports are often hard to verify because photos may be reused, locations may be wrong, or metadata may be missing.

The system addresses this by combining:

- Evidence photo upload
- EXIF metadata extraction
- Browser/device GPS sampling
- Manual map pin placement
- Reverse geocoding for readable addresses
- EXIF GPS vs device GPS distance validation
- Firebase Storage for evidence photos
- Firestore for report records
- Admin moderation and status updates

High-level flow:

```text
Citizen user
  -> captures/uploads photo
  -> app reads EXIF metadata
  -> app samples device GPS
  -> user confirms location or taps map pin
  -> user enters issue details
  -> app uploads photo to Firebase Storage
  -> app saves report to Firestore

Admin user
  -> opens admin dashboard
  -> reads reports from Firestore
  -> checks photo, location, validation score, and metadata
  -> updates status or marks not verified
```

---

## 2. Technology Stack

Frontend:

- React 18
- Vite
- React Router DOM
- Plain CSS
- React Icons

Mapping:

- Leaflet
- React Leaflet
- OpenStreetMap tiles
- Nominatim geocoding/reverse geocoding

Backend and hosting:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting

Metadata and validation:

- `exifr` for image EXIF metadata
- Browser Geolocation API
- Haversine distance calculation

---

## 3. Root Folder Structure

```text
Research-Final-Project-/
|-- .firebaserc
|-- firebase.json
|-- firestore.rules
|-- storage.rules
|-- README.md
|-- PROJECT_STRUCTURE.md
|-- PROJECT_STATUS.md
|-- CITIZENWATCH_DEFENSE_GUIDE.md
|-- SYSTEM_DOCUMENTATION.md
|-- citizenwatch-citizen/
`-- citizenwatch-admin/
```

Root file responsibilities:

- `.firebaserc` maps Firebase hosting targets to Firebase sites.
- `firebase.json` defines hosting configuration for the citizen and admin builds.
- `firestore.rules` defines Firestore security rules.
- `storage.rules` defines Firebase Storage security rules.
- `README.md` gives the shortest project introduction.
- `PROJECT_STRUCTURE.md` gives the planned folder structure.
- `PROJECT_STATUS.md` contains a progress snapshot.
- `CITIZENWATCH_DEFENSE_GUIDE.md` is the earlier defense guide.
- `SYSTEM_DOCUMENTATION.md` is the current complete system guide.

Firebase hosting configuration:

```text
hosting:citizen -> citizenwatch-citizen/dist
hosting:admin   -> citizenwatch-admin/dist
```

Deploy command:

```bash
firebase deploy --only hosting:citizen,hosting:admin
```

---

## 4. Citizen App Folder Structure

Path:

```text
citizenwatch-citizen/
```

Main folders:

```text
citizenwatch-citizen/
|-- index.html
|-- package.json
|-- vite.config.js
|-- public/
|   |-- manifest.webmanifest
|   `-- icons/
`-- src/
    |-- App.jsx
    |-- main.jsx
    |-- assets/
    |-- components/
    |-- context/
    |-- firebase/
    |-- hooks/
    |-- pages/
    |-- routes/
    |-- services/
    |-- styles/
    `-- utils/
```

### `src/App.jsx`

Top-level citizen app component. It loads the routing layer and app providers.

### `src/main.jsx`

React entry point. It mounts the citizen app into `index.html`.

### `src/routes/AppRoutes.jsx`

Defines citizen routes:

```text
/login
/register
/home
/dashboard -> redirects to /home
/reports/create
/reports/create/location
/reports/create/details
/reports/create/success
/reports
/reports/:id
/map
/alerts
/profile
```

Most citizen routes are wrapped by `ProtectedRoute`.

### `src/pages/`

Route-level screens. These are the pages users directly navigate to.

Important citizen pages:

- `Login.jsx` - login screen.
- `Register.jsx` - registration screen.
- `Home.jsx` - wrapper for citizen home.
- `dashboard/CitizenHomePage.jsx` - dashboard/home content.
- `reports/CreateReportPage.jsx` - Step 1, evidence upload and metadata preview.
- `reports/CreateReportLocationPage.jsx` - Step 2, GPS/map/manual pin verification.
- `reports/CreateReportDetailsPage.jsx` - Step 3, issue details and final submit.
- `reports/CreateReportSuccessPage.jsx` - success/tracking ID screen.
- `reports/ReportsPage.jsx` - citizen report list.
- `reports/ReportDetailsPage.jsx` - single report details.
- `map/MapPage.jsx` - map of reports.
- `alerts/AlertsPage.jsx` - alerts based on reports.
- `profile/ProfilePage.jsx` - profile and report summary.

### `src/components/`

Reusable UI pieces.

Important components:

- `BottomNavigation.jsx` - mobile bottom navigation.
- `TopHeader.jsx` - reusable top header.
- `ReportCard.jsx` - report summary card.
- `StatusBadge.jsx` - report status display.
- `SeverityBadge.jsx` - urgency/severity display.
- `PrimaryButton.jsx` - main button style.
- `EmptyState.jsx` - empty list state.
- `LoadingSkeleton.jsx` - loading placeholder.
- `map/ReportMap.jsx` - reusable report map.
- `common/ProtectedRoute.jsx` - route protection wrapper.

### `src/context/`

Global/shared React state.

Important files:

- `AuthContext.jsx`
- `authContext.js`
- `ReportDraftContext.jsx`

`ReportDraftContext.jsx` is very important because the create-report process has multiple pages. It stores the temporary report draft while the user moves through Step 1, Step 2, and Step 3.

Draft fields include:

```js
{
  selectedFile,
  photoPreview,
  fileName,
  fileSize,
  metadataPreview,
  exif,
  exifLat,
  exifLng,
  exifTimestamp,
  hasExifGps,
  captureSource,
  directCameraCapture,
  location,
  deviceLocation,
  locationValidation,
  issueType,
  urgency,
  description
}
```

Why it matters for defense:

- It prevents losing data when users move between report steps.
- It centralizes report draft state instead of passing props through many pages.
- It persists the draft in `sessionStorage`.

### `src/firebase/`

Firebase setup modules:

- `config.js` - reads Vite environment variables and checks if Firebase is configured.
- `firebase.js` - app initialization.
- `auth.js` - exports Firebase Auth instance.
- `firestore.js` - exports Firestore instance.
- `storage.js` - exports Storage instance.
- `firebaseConfig.js` - compatibility/config helper.

This separation keeps Firebase SDK setup away from UI pages.

### `src/services/`

Business and data operations. Pages call services instead of directly writing all data logic.

Important service files:

- `reportService.js`
- `storageService.js`
- `exifValidationService.js`
- `geocodingService.js`
- `localReportService.js`
- `mapService.js`
- `authService.js`
- `userService.js`

### `src/utils/`

Pure helper functions and constants.

Important utility files:

- `deviceLocation.js`
- `locationValidation.js`
- `gpsValidation.js`
- `severity.js`
- `mapMarkers.js`
- `dateFormat.js`
- `validators.js`
- `constants.js`

### `src/styles/`

Styling files:

- `global.css` - main app-specific UI styles.
- `theme.css` - CSS variables/theme tokens.
- `index.css` - base styles.
- `map.css` - map-specific styles.
- `alerts.css` - alerts styles.
- `reportDetails.css` - report details styles.

---

## 5. Admin App Folder Structure

Path:

```text
citizenwatch-admin/
```

Main folders:

```text
citizenwatch-admin/
|-- index.html
|-- package.json
|-- vite.config.js
`-- src/
    |-- App.jsx
    |-- main.jsx
    |-- components/
    |-- context/
    |-- firebase/
    |-- hooks/
    |-- pages/
    |-- routes/
    |-- services/
    |-- styles/
    `-- utils/
```

### `src/routes/AppRoutes.jsx`

Defines admin routes:

```text
/login
/
/reports
/reports/map
/reports/:reportId
/analytics
/users
```

Protected routes are wrapped by:

```text
ProtectedAdminRoute
AdminLayout
```

### `src/pages/`

Important admin pages:

- `auth/AdminLoginPage.jsx` - admin login screen.
- `dashboard/DashboardPage.jsx` - KPI/dashboard overview.
- `analytics/AnalyticsPage.jsx` - reports management table and detailed drawer.
- `reports/ReportQueuePage.jsx` - progress monitoring and report workflow.
- `reports/ReportMapPage.jsx` - map-based report monitoring.
- `reports/ReportReviewPage.jsx` - individual review route.
- `users/UserManagementPage.jsx` - user/admin management area.

### `src/components/`

Important admin components:

- `layout/AdminLayout.jsx` - admin sidebar/top layout.
- `common/ProtectedAdminRoute.jsx` - admin route guard.
- `map/AdminReportMap.jsx` - admin map component.
- `analytics/KpiCard.jsx` - KPI card.
- `analytics/StatusSummary.jsx` - status summary widget.
- `reports/ReportTable.jsx` - report table component.
- `reports/ReportStatusBadge.jsx` - status badge.
- `reports/ReportReviewPanel.jsx` - review UI panel.

### `src/services/`

Important admin services:

- `adminReportService.js` - reads reports, normalizes data, updates statuses.
- `adminAuthService.js` - admin authentication logic.
- `analyticsService.js` - dashboard/analytics data.
- `mapService.js` - map report shaping.

### `src/context/`

Important file:

- `AdminAuthContext.jsx` - admin auth state and provider.

### `src/utils/`

Important utilities:

- `roleGuards.js` - admin role validation helpers.
- `constants.js` - status constants.
- `mapMarkers.js` - Leaflet marker helpers.
- `dateFormat.js` - date formatting.

---

## 6. Important Citizen Code Explained

### Evidence upload and Step 1 metadata

File:

```text
citizenwatch-citizen/src/pages/reports/CreateReportPage.jsx
```

Purpose:

- Allows camera capture or file selection.
- Creates a preview image.
- Reads EXIF metadata from the original selected image.
- Stores photo metadata in `ReportDraftContext`.
- Starts device GPS sampling for Step 1 metadata preview.

Important functions:

- `handleUseCamera()` - opens the camera input with `capture="environment"`.
- `handleChooseFile()` - opens file picker.
- `handleFileChange()` - validates selected file and starts processing.
- `createPreviewDataUrl()` - compresses/creates preview image.
- `extractPhotoMetadata()` - reads EXIF using `readImageExif()`.
- `captureStepOneDeviceLocation()` - samples browser GPS and stores best reading.

Important defense point:

The app reads EXIF from the original file, not from the compressed preview, because compression can remove metadata.

### EXIF metadata extraction

File:

```text
citizenwatch-citizen/src/services/exifValidationService.js
```

Purpose:

- Uses `exifr` to parse image metadata.
- Extracts GPS coordinates.
- Extracts timestamp fields.
- Extracts camera and lens fields.
- Extracts image width, height, orientation, file type, size, and last modified date.
- Stores a safe `rawExifSummary` instead of full raw EXIF.

Important normalized output:

```js
{
  hasExif,
  hasGps,
  hasTimestamp,
  hasCameraInfo,
  gps: {
    lat,
    lng,
    altitude,
    accuracy,
    dop,
    speed,
    imgDirection,
    mapDatum,
    dateStamp,
    timeStamp
  },
  timestamp,
  timestamps: {
    original,
    created,
    modified,
    gps,
    primary
  },
  camera: {
    make,
    model,
    software,
    lensMake,
    lensModel
  },
  image,
  rawExifSummary,
  warnings,
  validationStatus
}
```

Important defense point:

The system does not depend only on GPS. It also collects timestamps and camera metadata when available, then flags missing metadata for admin review.

### Device GPS sampling

File:

```text
citizenwatch-citizen/src/utils/deviceLocation.js
```

Purpose:

- Improves Android GPS accuracy by using `watchPosition()`.
- Samples GPS for a short time.
- Chooses the best reading based on lowest accuracy value.
- Stops early if target accuracy is reached.

Important function:

```js
getBestDevicePosition()
```

Why this matters:

`getCurrentPosition()` can return one weak reading. On low-end Android phones, a short `watchPosition()` sampling window often gets a stronger GPS lock.

### Location verification and manual map pin

File:

```text
citizenwatch-citizen/src/pages/reports/CreateReportLocationPage.jsx
```

Purpose:

- Shows a Leaflet map.
- Displays EXIF GPS or device GPS.
- Lets the citizen tap the map to place a manual pin.
- Reverse geocodes coordinates to a readable address.
- Compares EXIF GPS with device GPS.
- Stores final selected location.

Important parts:

- `ManualPinMapEvents` uses `useMapEvents()` to listen for map clicks.
- `handleManualMapPin()` creates a manual location from clicked coordinates.
- `requestUserLocation()` uses `getBestDevicePosition()`.
- `applySelectedLocation()` updates report location and validation state.

Location sources:

```text
exif   -> photo GPS metadata
gps    -> browser/device GPS
manual -> address geocoding or tapped map pin
```

### Geocoding and reverse geocoding

File:

```text
citizenwatch-citizen/src/services/geocodingService.js
```

Purpose:

- `geocodeAddress(address)` turns a text address into coordinates.
- `reverseGeocodeLocation(location)` turns coordinates into readable address text.

Provider:

```text
OpenStreetMap Nominatim
```

Defense point:

The system stores actual coordinates even if readable address lookup fails, so dispatch accuracy is not blocked by reverse geocoding.

### Location validation algorithm

File:

```text
citizenwatch-citizen/src/utils/locationValidation.js
```

Purpose:

- Calculates distance between EXIF GPS and device GPS.
- Creates validation labels and status.
- Calculates a verification score.
- Determines if admin review is required.

Important status results:

```text
verified        -> photo GPS and device GPS match very closely
good            -> photo GPS and device GPS are close
needs_review    -> GPS difference is noticeable
suspicious      -> GPS difference is too large
device_gps      -> no photo GPS, using device GPS
manual_location -> manual address or map pin selected
unavailable     -> no usable location
```

Important fields generated:

```js
{
  status,
  tone,
  label,
  message,
  helper,
  distanceMeters,
  photoGps,
  deviceGps,
  gpsAccuracy,
  gpsAccuracyLabel,
  verificationScore,
  requiresReview,
  hasExifGps,
  hasDeviceGps,
  hasTimestamp,
  checkedAt
}
```

Defense explanation:

The system is not claiming every report is automatically true. It assigns confidence signals and shows admins what needs review.

### Report submission to Firestore

File:

```text
citizenwatch-citizen/src/services/reportService.js
```

Purpose:

- Validates report location.
- Resolves the photo file.
- Uploads photo to Firebase Storage.
- Normalizes report payload.
- Saves report document to Firestore.
- Sanitizes nested `undefined` values for Firestore.
- Compacts raw EXIF before storage.

Important function:

```js
createInfrastructureReport(reportDraft)
```

Firestore document includes:

```js
{
  id,
  trackingId,
  issueType,
  category,
  title,
  urgency,
  severity,
  description,
  status,
  location,
  latitude,
  longitude,
  exif,
  hasExifGps,
  exifLat,
  exifLng,
  exifTimestamp,
  deviceLocation,
  locationValidation,
  photoUrl,
  imageUrl,
  evidenceImage,
  createdBy,
  reporterId,
  reporterName,
  createdAt,
  updatedAt
}
```

Why compact raw EXIF:

Firestore documents have size limits. Full EXIF metadata can become large, so the system stores normalized fields plus a summary instead of full raw metadata.

### Firebase Storage upload

File:

```text
citizenwatch-citizen/src/services/storageService.js
```

Purpose:

- Uploads report evidence images.
- Returns public/download URL.
- Deletes photos when reports are deleted if needed.

Defense point:

Images are not stored as base64 inside Firestore. Firestore stores URLs only, which is the correct production approach.

---

## 7. Important Admin Code Explained

### Admin report service

File:

```text
citizenwatch-admin/src/services/adminReportService.js
```

Purpose:

- Subscribes to Firestore reports.
- Normalizes reports for admin screens.
- Converts raw report fields into display-ready fields.
- Normalizes status, severity, category, and GPS validation.
- Updates report status and admin remarks.
- Marks reports as not verified.

Important functions:

- `subscribeReportsForModeration()` - real-time Firestore subscription.
- `normalizeAdminReport()` - prepares raw Firestore reports for UI.
- `normalizeLocationValidation()` - extracts metadata and validation fields.
- `updateReportStatus()` - writes status/remarks updates.
- `markReportNotVerified()` - rejects a report with reason.

Admin metadata shown:

```text
Photo GPS
Device GPS
Distance Difference
Accuracy
Trust Score
Review Required
GPS Source
EXIF Timestamp
Camera Metadata
```

### Reports Management

File:

```text
citizenwatch-admin/src/pages/analytics/AnalyticsPage.jsx
```

Purpose:

- Main report management table.
- Shows category, severity, status, validation, trust score, review requirement, GPS source, date, and actions.
- Opens report detail drawer.
- Allows status updates.
- Supports marking selected reports as not verified.

Important UI columns:

```text
Report ID
Thumbnail
Category
Severity
Status
Validation
Trust Score
Review
GPS Source
Reported Date
Actions
```

### Report Progress Monitoring

File:

```text
citizenwatch-admin/src/pages/reports/ReportQueuePage.jsx
```

Purpose:

- Shows report progress by category/status.
- Displays selected report details.
- Shows validation metadata, trust score, review status, timestamp, and camera metadata.
- Provides quick status actions.

### Admin Map

File:

```text
citizenwatch-admin/src/pages/reports/ReportMapPage.jsx
```

Purpose:

- Shows submitted reports geographically.
- Allows admins to see report distribution on a map.
- Uses report coordinates from Firestore.

---

## 8. Data Model

Main Firestore collection:

```text
reports
```

Example report structure:

```js
{
  id: "report-id",
  trackingId: "#INF-1234",
  issueType: "Drainage",
  category: "Drainage",
  title: "Drainage Report",
  urgency: "Moderate",
  severity: "Moderate",
  description: "Canal is clogged near the street.",
  status: "under_review",

  location: {
    lat: 10.3403,
    lng: 123.9065,
    latitude: 10.3403,
    longitude: 123.9065,
    accuracy: 18,
    address: "Readable address",
    subAddress: "Lat: 10.34030, Lng: 123.90650",
    source: "gps"
  },

  exif: {
    hasExif: true,
    hasGps: true,
    hasTimestamp: true,
    hasCameraInfo: true,
    gps: {
      lat: 10.34031,
      lng: 123.90648,
      altitude: null,
      accuracy: null
    },
    lat: 10.34031,
    lng: 123.90648,
    timestamp: "2026-05-24T...",
    camera: {
      make: "Samsung",
      model: "SM-A...",
      software: "...",
      lensMake: "",
      lensModel: ""
    },
    image: {
      width: 4032,
      height: 3024,
      orientation: 1
    },
    rawExif: null,
    rawExifSummary: {
      keyCount: 30,
      keys: ["Make", "Model", "..."],
      values: {}
    }
  },

  locationValidation: {
    status: "verified",
    tone: "success",
    label: "Location Verified",
    message: "Photo GPS matches current device location.",
    helper: "Photo GPS and device GPS are 12m apart.",
    distanceMeters: 12,
    verificationScore: 90,
    requiresReview: false,
    hasExifGps: true,
    hasDeviceGps: true,
    hasTimestamp: true,
    source: "exif_device_comparison",
    checkedAt: "2026-05-24T..."
  },

  deviceLocation: {
    lat: 10.3403,
    lng: 123.9065,
    accuracy: 18,
    source: "gps",
    capturedAt: "2026-05-24T..."
  },

  photoUrl: "https://...",
  imageUrl: "https://...",
  evidenceImage: "https://...",
  createdBy: "firebase-user-id",
  reporterId: "firebase-user-id",
  reporterName: "Citizen Reporter",
  createdAt: "2026-05-24T...",
  updatedAt: "2026-05-24T..."
}
```

Status values:

```text
submitted
under_review
verified
in_progress
resolved
rejected
voided_by_citizen
```

Location source values:

```text
exif
gps
manual
```

Validation source values:

```text
exif_device_comparison
exif_only
device_only
manual
none
```

---

## 9. Full Report Creation Flow

### Step 1: Evidence Upload

Route:

```text
/reports/create
```

Main file:

```text
CreateReportPage.jsx
```

Flow:

```text
User taps Use Camera or Choose File
  -> file is validated as image/*
  -> preview is generated
  -> EXIF metadata is extracted
  -> Step 1 samples device GPS
  -> draft is stored in ReportDraftContext
```

### Step 2: Location Verification

Route:

```text
/reports/create/location
```

Main file:

```text
CreateReportLocationPage.jsx
```

Flow:

```text
If photo has EXIF GPS:
  -> use photo GPS as report location
  -> sample device GPS for comparison

If photo has no EXIF GPS:
  -> use best device GPS reading

If GPS is unavailable:
  -> user can geocode manual address
  -> user can tap map to place manual pin
```

The map pin is important for field use because some devices cannot provide GPS indoors or when permissions are blocked.

### Step 3: Issue Details and Submit

Route:

```text
/reports/create/details
```

Main file:

```text
CreateReportDetailsPage.jsx
```

Flow:

```text
User selects issue type
User selects urgency
User writes description
System validates required fields
System builds report payload
System uploads image to Firebase Storage
System creates report document in Firestore
System redirects to success page
```

### Step 4: Success

Route:

```text
/reports/create/success
```

Main file:

```text
CreateReportSuccessPage.jsx
```

Shows tracking ID and report submission confirmation.

---

## 10. EXIF, GPS, and Trust Score

The system uses evidence metadata to help admins decide whether a report is credible.

Inputs:

```text
Photo EXIF GPS
Photo EXIF timestamp
Camera metadata
Device GPS
Manual pin/address
```

Distance calculation:

- The system uses the Haversine formula to calculate distance between two coordinates.
- This is implemented in `locationValidation.js`.

Validation bands:

```text
0m to 20m       -> verified
21m to 100m     -> good
101m to 500m    -> needs_review
above 500m      -> suspicious
```

Trust score logic:

```text
+40 if photo EXIF GPS exists
+20 if photo was captured directly from camera
+20 if device GPS exists
+10 if EXIF/device GPS distance is under 20m
+10 if device GPS accuracy is under 15m
```

Maximum score:

```text
100
```

Why this is defendable:

- It does not automatically approve every report.
- It gives admins evidence-based signals.
- It still supports reports where metadata is missing.
- It explicitly flags reports for review when GPS or timestamp is missing.

---

## 11. Manual Location and Reverse Geocoding

Manual location support has two modes:

1. Manual address input
2. Tap map to drop a pin

Files:

```text
CreateReportLocationPage.jsx
geocodingService.js
```

Address geocoding:

```text
Text address -> latitude/longitude
```

Reverse geocoding:

```text
Latitude/longitude -> readable address
```

Important fallback:

If reverse geocoding fails, the system still keeps coordinates. This matters because coordinates are more important than human-readable address text for dispatching.

---

## 12. Admin Review Workflow

Admin app reads from Firestore in real time.

Core admin service:

```text
adminReportService.js
```

Admin can see:

- Report ID/tracking ID
- Evidence image
- Category
- Severity
- Status
- Validation label
- Trust score
- Requires review
- GPS source
- GPS distance
- EXIF timestamp
- Camera metadata
- Report location
- Reporter information

Admin can update status:

```text
under_review
verified
resolved
rejected
```

Admin can mark reports not verified:

```text
This report is either fake, not traceable, or no problem was found after review.
```

---

## 13. Firebase Integration

### Firebase Authentication

Used for:

- Citizen user identity
- Admin login identity
- `createdBy` / `reporterId`
- Admin update tracking

### Firestore

Used for:

- Report records
- Report status updates
- Admin monitoring

Main collection:

```text
reports
```

### Firebase Storage

Used for:

- Uploaded report evidence photos

Important design decision:

Photos are stored in Storage, not Firestore. Firestore only stores URLs and metadata.

### Firebase Hosting

Used for:

- Citizen PWA hosting
- Admin dashboard hosting

---

## 14. Deployment and Commands

Install dependencies:

```bash
cd citizenwatch-citizen
npm install

cd ../citizenwatch-admin
npm install
```

Run citizen locally:

```bash
cd citizenwatch-citizen
npm run dev
```

Run admin locally:

```bash
cd citizenwatch-admin
npm run dev
```

Build citizen:

```bash
cd citizenwatch-citizen
npm run build
```

Build admin:

```bash
cd citizenwatch-admin
npm run build
```

Lint:

```bash
npm run lint
```

Deploy both apps:

```bash
firebase deploy --only hosting:citizen,hosting:admin
```

Deploy citizen only:

```bash
firebase deploy --only hosting:citizen
```

Deploy admin only:

```bash
firebase deploy --only hosting:admin
```

---

## 15. Skill-Test Code Areas To Study

If you are asked to explain or modify code during a skill test, study these files first.

Citizen:

```text
citizenwatch-citizen/src/pages/reports/CreateReportPage.jsx
citizenwatch-citizen/src/pages/reports/CreateReportLocationPage.jsx
citizenwatch-citizen/src/pages/reports/CreateReportDetailsPage.jsx
citizenwatch-citizen/src/context/ReportDraftContext.jsx
citizenwatch-citizen/src/services/exifValidationService.js
citizenwatch-citizen/src/services/reportService.js
citizenwatch-citizen/src/services/storageService.js
citizenwatch-citizen/src/services/geocodingService.js
citizenwatch-citizen/src/utils/deviceLocation.js
citizenwatch-citizen/src/utils/locationValidation.js
```

Admin:

```text
citizenwatch-admin/src/pages/analytics/AnalyticsPage.jsx
citizenwatch-admin/src/pages/reports/ReportQueuePage.jsx
citizenwatch-admin/src/pages/reports/ReportMapPage.jsx
citizenwatch-admin/src/services/adminReportService.js
citizenwatch-admin/src/context/AdminAuthContext.jsx
citizenwatch-admin/src/components/common/ProtectedAdminRoute.jsx
```

Firebase:

```text
firebase.json
.firebaserc
firestore.rules
storage.rules
citizenwatch-citizen/src/firebase/config.js
citizenwatch-admin/src/firebase/config.js
```

CSS/UI:

```text
citizenwatch-citizen/src/styles/global.css
citizenwatch-admin/src/styles/index.css
```

---

## 16. Common Defense Questions and Answers

### Why did you separate citizen and admin apps?

Citizens and admins have different workflows. Citizens need a fast mobile report flow, while admins need tables, filtering, maps, validation details, and status tools. Separate apps make the system easier to secure, maintain, and present.

### Why use Firebase?

Firebase provides Authentication, Firestore, Storage, and Hosting without building a custom backend server. This is suitable for a research prototype and still supports real deployments.

### Why use Leaflet and OpenStreetMap?

Leaflet and OpenStreetMap avoid paid map API requirements. They are enough for report markers, location selection, and admin map monitoring.

### How do you reduce fake reports?

The system extracts photo GPS from EXIF metadata and compares it with current device GPS. It also checks timestamp and camera metadata. If GPS values are far apart or metadata is missing, the report is flagged for admin review.

### What if a photo has no EXIF GPS?

That is common for screenshots, downloaded images, Messenger images, and social media images. The app falls back to device GPS or manual map pin placement and marks the report appropriately.

### Why not store full raw EXIF?

Full raw EXIF can be large. Firestore has document size limits, so the app stores normalized EXIF fields and a compact raw summary for research/debugging.

### What is the trust score?

The trust score is a metadata confidence score. It increases when photo GPS exists, the photo was captured directly by camera, device GPS exists, EXIF/device GPS are close, and device GPS accuracy is strong.

### Can this scale?

Yes, but future scale work should add pagination, map clustering, geohash querying, stricter Firestore indexes, audit logs, and image upload limits.

---

## 17. Known Limitations

Current limitations:

- Admin role enforcement should be hardened before production use.
- Nominatim reverse geocoding depends on network availability and rate limits.
- EXIF metadata depends on the original image. Social apps may strip it.
- Large admin tables should eventually use pagination.
- Map markers should eventually use clustering for very large report volumes.
- Push notifications are not fully implemented.
- Some auth and profile behavior may still be demo-oriented depending on Firebase setup.

---

## 18. Future Improvements

Recommended next improvements:

1. Add strict role-based security rules for citizen and admin.
2. Add Firestore pagination with `limit()` and `startAfter()`.
3. Add marker clustering for admin maps.
4. Add geohash fields for nearby report queries.
5. Add image size/type restrictions before upload.
6. Add admin audit logs for every status change.
7. Add CSV/PDF export.
8. Add push notifications for status updates.
9. Add department assignment and responder workflow.
10. Add automated tests for report submission and validation.

---

## 19. Suggested Defense Demo Script

Use this order in the defense:

1. Open Citizen app.
2. Login as a citizen.
3. Go to Create Report.
4. Tap Use Camera or Choose File.
5. Show Metadata Preview.
6. Explain EXIF GPS and Device GPS.
7. Continue to Location Verification.
8. Show map, validation status, and GPS accuracy.
9. Tap map to demonstrate manual pin placement.
10. Enter issue type, urgency, and description.
11. Submit report.
12. Show success page and tracking ID.
13. Open Admin app.
14. Show report in Reports Management table.
15. Point out Validation, Trust Score, Review, and GPS Source columns.
16. Open report details.
17. Explain EXIF/GPS validation metadata.
18. Update report status.
19. Return to citizen side and show report tracking/status.

---

## 20. Short Summary for Panel

CitizenWatch is a Firebase-backed infrastructure reporting system with two React applications. The citizen app lets users submit evidence photos, verifies location using EXIF GPS and device GPS, supports manual map pins, uploads photos to Firebase Storage, and saves report records to Firestore. The admin app reads those reports in real time, shows validation metadata, trust score, GPS source, evidence images, and allows LGU staff to update report status. The system is designed to improve report credibility while still supporting cases where metadata is missing.
