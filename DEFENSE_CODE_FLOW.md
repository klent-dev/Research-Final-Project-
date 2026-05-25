# CitizenWatch Defense Guide: Code and System Flow

Use this file as a quick speaking guide for the research defense. It explains what the system does, how the code is organized, and how data moves between the citizen app, admin dashboard, Firebase, maps, and local storage.

## 1. Project Summary

CitizenWatch is a web-based infrastructure reporting system for citizens and LGU administrators.

The project has two separate React + Vite applications:

- `citizenwatch-citizen`: the citizen-facing app for submitting, viewing, deleting from personal view, and tracking infrastructure reports.
- `citizenwatch-admin`: the admin dashboard for monitoring reports, reviewing reports, viewing GIS maps, filtering reports, updating report status, and deleting reports globally.

Both apps share the same main idea:

1. Citizens submit infrastructure issues with description, category, urgency, photo, and location.
2. Reports are saved to Firebase Firestore when Firebase is configured.
3. Uploaded photos are saved to Firebase Storage.
4. Admin reads the same Firestore `reports` collection.
5. Admin can review, filter, map, update, or delete reports.
6. Citizen sees report status updates from the admin side.

## 2. Technologies Used

- React: builds reusable UI components.
- Vite: fast development server and production build tool.
- React Router DOM: handles navigation between pages.
- Firebase Auth: intended for citizen and admin authentication.
- Firestore: stores report records.
- Firebase Storage: stores report images.
- Leaflet and React Leaflet: renders OpenStreetMap maps and report markers.
- localStorage and sessionStorage: used for demo fallback, drafts, and citizen-only hidden reports.
- CSS files: custom responsive styling for both citizen and admin apps.

## 3. Folder Structure

Root folder:

```text
Research-Final-Project--1/
|-- citizenwatch-citizen/
|-- citizenwatch-admin/
|-- README.md
|-- PROJECT_STRUCTURE.md
|-- PROJECT_STATUS.md
|-- FIREBASE_ENV_SETUP.md
|-- DEFENSE_CODE_FLOW.md
```

Each app follows a similar structure:

```text
src/
|-- App.jsx
|-- main.jsx
|-- routes/
|-- pages/
|-- components/
|-- services/
|-- hooks/
|-- context/
|-- firebase/
|-- utils/
|-- styles/
```

What each folder means:

- `pages/`: full screens connected to routes.
- `components/`: reusable UI parts.
- `services/`: business logic and Firebase operations.
- `hooks/`: reusable React logic like loading reports.
- `context/`: global app state like auth and report draft.
- `firebase/`: Firebase SDK initialization.
- `utils/`: helper functions for status, markers, validation, dates.
- `styles/`: CSS for layout and visual design.

## 4. Citizen App Flow

Main path: `citizenwatch-citizen`

Important citizen routes:

```text
/login
/register
/home
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

### Citizen report creation flow

The guided report flow is split into pages:

1. `CreateReportPage.jsx`
   - Citizen selects or captures a photo.
   - The app prepares photo evidence.
   - EXIF/GPS metadata can be checked.

2. `CreateReportLocationPage.jsx`
   - Citizen confirms location on a Leaflet map.
   - Browser geolocation can provide coordinates.
   - Manual fallback is available when GPS is unavailable.

3. `CreateReportDetailsPage.jsx`
   - Citizen enters issue type, urgency, and description.
   - The report draft is completed.

4. `CreateReportSuccessPage.jsx`
   - Shows confirmation and tracking ID.

Draft data is managed by:

```text
citizenwatch-citizen/src/context/ReportDraftContext.jsx
```

Local draft storage:

```text
sessionStorage: citizenwatch_report_draft
```

### Citizen report saving

Main service:

```text
citizenwatch-citizen/src/services/reportService.js
```

When Firebase is configured:

1. The report payload is normalized.
2. Photo is uploaded to Firebase Storage.
3. A Firestore document is written to the `reports` collection.
4. The report gets fields such as:

```text
id
trackingId
title
category / issueType
description
urgency / severity
status
location
createdBy / reporterId
createdAt
photoUrl
```

When Firebase is not configured, the app can still use localStorage demo data through:

```text
citizenwatch-citizen/src/services/localReportService.js
```

Local report storage:

```text
localStorage: citizenwatch_reports
```

### Citizen report list and details

Main files:

```text
citizenwatch-citizen/src/pages/reports/ReportsPage.jsx
citizenwatch-citizen/src/pages/reports/ReportDetailsPage.jsx
citizenwatch-citizen/src/hooks/useReports.js
```

`useReports.js` is responsible for loading reports:

- If Firebase is configured, it subscribes to reports from Firestore for the current user.
- It merges visible Firebase reports with unsynced local reports.
- It hides citizen-hidden reports from the citizen view.

### Citizen delete behavior

Important requirement:

Citizen-side delete should not affect the admin report log.

Current behavior:

- Citizen delete does not delete the Firestore document.
- It only hides the report from the citizen app using localStorage.
- Admin still sees the report.

Implemented in:

```text
citizenwatch-citizen/src/services/localReportService.js
citizenwatch-citizen/src/pages/reports/ReportsPage.jsx
citizenwatch-citizen/src/hooks/useReports.js
```

Hidden report storage:

```text
localStorage: citizenwatch_hidden_report_ids
```

Defense explanation:

> We separated citizen deletion from admin deletion. A citizen may remove a report from their personal view, but this does not erase the official LGU record. Only admin deletion removes the report globally from Firebase.

## 5. Citizen Map Flow

Main file:

```text
citizenwatch-citizen/src/pages/map/MapPage.jsx
```

Supporting files:

```text
citizenwatch-citizen/src/services/mapService.js
citizenwatch-citizen/src/utils/mapMarkers.js
citizenwatch-citizen/src/styles/map.css
```

Map behavior:

- Uses `MapContainer`, `TileLayer`, `Marker`, and `Popup` from React Leaflet.
- Uses OpenStreetMap tiles.
- Filters reports by category.
- Shows markers only for reports with valid latitude and longitude.
- Supports scroll zoom.
- Can fly to the user's current location.

Marker colors:

- Low: green.
- Medium: orange.
- Critical or high: red.

## 6. Admin App Flow

Main path: `citizenwatch-admin`

Important admin routes:

```text
/login
/
/reports
/reports/map
/reports/:reportId
/analytics
/users
```

Main route file:

```text
citizenwatch-admin/src/routes/AppRoutes.jsx
```

Main layout:

```text
citizenwatch-admin/src/components/layout/AdminLayout.jsx
```

The admin sidebar contains navigation to dashboard, reports, GIS tracking, analytics, and user settings.

## 7. Admin Authentication and Protection

Important files:

```text
citizenwatch-admin/src/context/AdminAuthContext.jsx
citizenwatch-admin/src/hooks/useAdminAuth.js
citizenwatch-admin/src/components/common/ProtectedAdminRoute.jsx
citizenwatch-admin/src/services/adminAuthService.js
```

Purpose:

- Keep admin login state.
- Protect admin-only routes.
- Redirect unauthenticated users to admin login.

Defense explanation:

> Admin pages are wrapped in protected route logic, so the dashboard is separated from the public citizen side.

## 8. Admin Report Data Flow

Main service:

```text
citizenwatch-admin/src/services/adminReportService.js
```

This service handles:

- Reading reports from Firestore.
- Subscribing to real-time report updates.
- Normalizing report fields for admin UI.
- Updating status and remarks.
- Deleting reports globally.

Important functions:

```text
subscribeReportsForModeration()
getReportsForModeration()
updateReportStatus()
deleteReport()
deleteReports()
normalizeAdminReport()
getReportCoordinates()
```

Admin report loading:

1. Admin page calls `subscribeReportsForModeration`.
2. Firestore `reports` collection is observed with `onSnapshot`.
3. Each report document is normalized.
4. UI updates automatically when Firestore changes.

Admin global delete:

- Admin delete calls `deleteReports`.
- `deleteReports` calls `deleteReport`.
- `deleteReport` uses Firestore `deleteDoc`.
- Once deleted from Firestore, both admin and citizen subscribers stop seeing the report.

Defense explanation:

> Admin deletion is treated as an official record deletion, so it removes the document from Firebase and affects all connected clients.

## 9. Admin Dashboard

Main file:

```text
citizenwatch-admin/src/pages/dashboard/DashboardPage.jsx
```

Purpose:

- Shows command overview metrics.
- Shows total reports, critical priority, in-progress reports, and resolved reports.
- Shows a live incident map.
- Shows urgent action list.

Dashboard map:

- Uses React Leaflet.
- Reads reports from Firestore.
- Filters actionable reports.
- Uses custom CitizenWatch markers from:

```text
citizenwatch-admin/src/utils/mapMarkers.js
```

## 10. Admin GIS Map

Main file:

```text
citizenwatch-admin/src/pages/reports/ReportMapPage.jsx
```

Purpose:

- Full GIS tracking map for LGU monitoring.
- Shows reports with valid coordinates.
- Supports scroll zoom.
- Shows report detail side panel when a marker is selected.
- Displays report summary, description, source type, evidence thumbnail, and location.

Map filters:

- Category filters:
  - All
  - Drainage
  - Street Lighting
  - Flooding
  - Road Maintenance
  - Waste Management
  - Others

- Status filters:
  - Actionable Reports
  - Completed / Closed Reports

Actionable Reports includes:

```text
pending
submitted
under_review
under review
in_progress
in progress
```

Completed / Closed Reports includes:

```text
verified
resolved
rejected
completed
closed
```

Filter behavior:

- If no status filter is selected, all reports are shown.
- If one filter is selected, only that group is shown.
- If both filters are selected, both groups are shown.

Defense explanation:

> The GIS map helps administrators visually locate infrastructure issues. We added category and status filters so LGU users can quickly separate actionable reports from completed or closed reports.

## 11. Admin Analytics and Report Management

Main file:

```text
citizenwatch-admin/src/pages/analytics/AnalyticsPage.jsx
```

Purpose:

- Shows report management table.
- Supports category, severity, and status filters.
- Opens a detail drawer for selected reports.
- Allows report status updates.
- Allows selected reports to be deleted globally from Firebase.

Important behavior:

- Delete selected reports removes documents from Firestore.
- If Firebase deletion fails, the UI restores the reports and shows an error.

Defense explanation:

> The admin report management module is responsible for official moderation actions. This is why delete actions here affect Firebase and all clients.

## 12. Admin User Management

Main file:

```text
citizenwatch-admin/src/pages/users/UserManagementPage.jsx
```

Purpose:

- Account settings.
- Notification preferences.
- Dashboard preferences.
- Map behavior settings.
- Security and roles management.

Some settings are local/demo settings saved in:

```text
localStorage: citizenwatch_admin_settings
```

## 13. Firebase Configuration

Firebase config files:

Citizen:

```text
citizenwatch-citizen/src/firebase/config.js
citizenwatch-citizen/src/firebase/auth.js
citizenwatch-citizen/src/firebase/firestore.js
citizenwatch-citizen/src/firebase/storage.js
```

Admin:

```text
citizenwatch-admin/src/firebase/config.js
citizenwatch-admin/src/firebase/auth.js
citizenwatch-admin/src/firebase/firestore.js
citizenwatch-admin/src/firebase/storage.js
```

Environment files:

```text
citizenwatch-citizen/.env
citizenwatch-admin/.env
```

Common Firebase env variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Defense explanation:

> We use Vite environment variables so Firebase credentials are not hard-coded inside source files.

## 14. Main Data Model

Firestore collection:

```text
reports
```

Typical report document:

```js
{
  id: "report-id",
  trackingId: "#INF-1234",
  title: "Drainage Report",
  category: "Drainage",
  issueType: "Drainage",
  description: "Detailed citizen description",
  urgency: "High",
  severity: "High",
  status: "submitted",
  location: {
    lat: 10.3157,
    lng: 123.8854,
    address: "Detected address"
  },
  createdBy: "citizen-user-id",
  reporterId: "citizen-user-id",
  createdAt: "timestamp",
  updatedAt: "timestamp",
  photoUrl: "firebase-storage-url",
  adminNotes: "",
  remarks: ""
}
```

Status values used by the system:

```text
submitted
pending
under_review
verified
in_progress
resolved
rejected
completed
closed
```

## 15. Report Lifecycle

Full report lifecycle:

1. Citizen creates report.
2. Citizen app validates photo, location, and details.
3. Report is saved to Firestore.
4. Admin dashboard receives report through Firestore subscription.
5. Admin views report in queue, analytics table, dashboard, or GIS map.
6. Admin updates status or remarks.
7. Citizen app receives updated status from Firestore.
8. Citizen can hide the report from personal view.
9. Admin can delete the report globally if needed.

## 16. Important Design Decisions

### Why two separate apps?

Citizen users and LGU admins have different workflows. Separating the apps makes the UI cleaner and improves role separation.

### Why Firebase?

Firebase provides authentication, database, storage, and real-time updates without needing a custom backend server.

### Why Leaflet/OpenStreetMap?

Leaflet is lightweight, open source, and works well with OpenStreetMap, which is suitable for GIS-style infrastructure reporting.

### Why keep localStorage?

localStorage is used for fallback demo behavior, drafts, settings, and citizen-only hidden report IDs. It helps the prototype remain usable even if Firebase is not available.

### Why citizen delete and admin delete are different?

Citizen delete is personal. Admin delete is official.

This protects the administrative record from being removed by a citizen while still letting citizens clean up their own report list.

## 17. How To Run The Apps

Citizen app:

```bash
cd citizenwatch-citizen
npm run dev
```

Default local URL:

```text
http://127.0.0.1:5173
```

Admin app:

```bash
cd citizenwatch-admin
npm run dev
```

Default local URL:

```text
http://127.0.0.1:5174
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

## 18. Defense Talking Points

Use these sentences if asked to explain the system quickly.

### Short system explanation

CitizenWatch is a two-sided reporting platform. Citizens submit infrastructure issues with photo evidence and location. The admin dashboard receives those reports, displays them in tables and GIS maps, and allows LGU staff to review, update, filter, and manage them.

### Data flow explanation

The citizen app writes reports to Firebase Firestore and uploads photos to Firebase Storage. The admin app subscribes to the same Firestore reports collection, so updates appear in real time. When admins update report status, citizens can see the new status in their report tracking screens.

### GIS explanation

The GIS map uses Leaflet with OpenStreetMap tiles. Each report with valid latitude and longitude becomes a marker. Markers are colored by severity, and admins can filter reports by category and status.

### Delete behavior explanation

Citizen deletion only hides the report from the citizen's personal view using localStorage. It does not remove the official Firebase record. Admin deletion removes the Firestore document, so it affects both the admin and citizen sides.

### Security explanation

The current structure separates citizen and admin apps, uses protected admin routes, and keeps Firebase configuration in environment variables. In production, Firestore security rules and role-based validation should enforce that only admins can moderate or delete official reports.

## 19. Possible Panel Questions and Answers

### Q: What problem does CitizenWatch solve?

It provides a structured way for citizens to report infrastructure problems and for LGU staff to monitor and respond using a centralized dashboard and GIS map.

### Q: Why did you use two apps?

Citizens and admins have different roles. The citizen app focuses on submitting and tracking reports, while the admin app focuses on monitoring, filtering, and managing reports.

### Q: How are reports located on the map?

Each report stores latitude and longitude in the `location` object. Leaflet reads those coordinates and places a marker on the OpenStreetMap map.

### Q: How does the admin see citizen reports?

Both apps use the same Firebase Firestore `reports` collection. The admin app subscribes to the collection and receives updates in real time.

### Q: Why does citizen delete not affect admin?

Because the citizen delete is only a personal hide action. It stores the hidden report ID locally so the official report remains available to admins.

### Q: Why does admin delete affect citizen?

Admin delete removes the Firestore document. Since Firestore is the shared source of truth, all connected clients stop receiving that report.

### Q: What happens if Firebase is unavailable?

The apps include localStorage fallback behavior for demo and development. Reports, drafts, settings, and hidden report IDs can be stored locally.

### Q: How do you validate reports?

The report flow checks required fields, photo evidence, GPS/browser location, and optional EXIF metadata. Admins can later review and update the report status.

### Q: What are the future improvements?

Important future work includes stronger Firebase security rules, stricter role validation, audit logs, push notifications, richer analytics charts, and deployment hardening.

## 20. Files To Mention During Defense

Citizen report creation:

```text
citizenwatch-citizen/src/pages/reports/CreateReportPage.jsx
citizenwatch-citizen/src/pages/reports/CreateReportLocationPage.jsx
citizenwatch-citizen/src/pages/reports/CreateReportDetailsPage.jsx
citizenwatch-citizen/src/context/ReportDraftContext.jsx
```

Citizen report loading:

```text
citizenwatch-citizen/src/hooks/useReports.js
citizenwatch-citizen/src/services/reportService.js
citizenwatch-citizen/src/services/localReportService.js
```

Citizen map:

```text
citizenwatch-citizen/src/pages/map/MapPage.jsx
citizenwatch-citizen/src/services/mapService.js
citizenwatch-citizen/src/utils/mapMarkers.js
```

Admin report service:

```text
citizenwatch-admin/src/services/adminReportService.js
```

Admin dashboard:

```text
citizenwatch-admin/src/pages/dashboard/DashboardPage.jsx
```

Admin GIS map:

```text
citizenwatch-admin/src/pages/reports/ReportMapPage.jsx
```

Admin report management:

```text
citizenwatch-admin/src/pages/analytics/AnalyticsPage.jsx
```

Admin layout and routes:

```text
citizenwatch-admin/src/components/layout/AdminLayout.jsx
citizenwatch-admin/src/routes/AppRoutes.jsx
```

## 21. Final One-Minute Script

CitizenWatch is our infrastructure reporting system with two React and Vite applications: one for citizens and one for LGU admins. Citizens can create reports with a photo, description, urgency, and map location. These reports are saved to Firebase Firestore, while images are uploaded to Firebase Storage. The admin dashboard reads the same Firestore reports collection, so administrators can monitor reports in real time, view them on a GIS map, filter by category or status, and manage reports through the dashboard.

The system uses Leaflet and OpenStreetMap for mapping. Reports with valid coordinates appear as markers, and marker colors represent severity. We also separated deletion behavior: if citizens delete a report, it is only hidden from their personal view, so the admin record is preserved. If admins delete a report, it is deleted from Firebase and disappears from both sides. This matches the idea that citizen deletion is personal, while admin deletion is official.

Overall, the system demonstrates report submission, geolocation, evidence handling, real-time admin monitoring, and clear separation between citizen and administrative responsibilities.
