# CitizenWatch Project Status

## Project Overview

CitizenWatch is structured as two separate React + Vite applications:

- `citizenwatch-citizen`
- `citizenwatch-admin`

Both apps use:

- React + Vite
- React Router
- Firebase-ready services
- Leaflet/OpenStreetMap
- Plain CSS
- Modular folder structure

---

## Citizen App

Path: `citizenwatch-citizen`

Main purpose:

Citizen-facing mobile-first PWA where users can submit infrastructure reports, view reports, track status, see alerts, use maps, and manage their profile.

### Current Routes

```txt
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

### Completed Features

- Premium mobile-first Login page
- Register page with validation
- Firebase auth temporarily bypassed
- Login redirects directly to `/home`
- Logout redirects to `/login`
- Home dashboard UI
- Reports page using localStorage reports
- Report Details page `/reports/:id`
- Delete report functionality
- Create Report full flow:
  - Step 1: upload/camera image
  - Step 2: Leaflet map + GPS/manual location
  - Step 3: issue details
  - Success page with tracking ID
- EXIF metadata reading with `exifr`
- Photo GPS detection
- Device GPS fallback
- Manual location fallback
- localStorage report saving
- Map page with real OpenStreetMap
- Custom report markers by urgency:
  - Low = green
  - Medium = orange
  - Critical = red
- Alerts page connected to submitted reports
- Profile page cleaned up and connected to report flow
- Bottom navigation updated
- Responsive mobile-first UI
- Build and lint passing

### Current Data Behavior

```txt
Reports are saved in localStorage:
citizenwatch_reports

Drafts are saved in sessionStorage:
citizenwatch_report_draft
```

### Current Status

The Citizen app is functional as a local prototype. Users can submit reports and see them reflected in Reports, Map, Alerts, Home, and Profile.

### Still To Do

1. Re-enable Firebase Authentication.
2. Save reports to Firestore instead of localStorage.
3. Upload images to Firebase Storage.
4. Store EXIF/GPS validation results in Firestore.
5. Add real user profile data from Firebase Auth.
6. Add report status updates from Admin side.
7. Add notification system.
8. Add stronger validation before final submit.
9. Add PWA manifest/service worker if not yet added.
10. Add final thesis documentation/screenshots.

### Run Citizen App

```bash
cd citizenwatch-citizen
npm run dev
```

### Build Check

```bash
npm run lint
npm run build
```

---

## Admin App

Path: `citizenwatch-admin`

Main purpose:

LGU/Admin dashboard for reviewing submitted reports, viewing maps, analytics, and managing users.

### Current Routes

```txt
/login
/
/reports
/reports/map
/reports/:reportId
/analytics
/users
```

### Current Admin Structure

```txt
src/pages/auth/AdminLoginPage.jsx
src/pages/dashboard/DashboardPage.jsx
src/pages/reports/ReportQueuePage.jsx
src/pages/reports/ReportReviewPage.jsx
src/pages/reports/ReportMapPage.jsx
src/pages/analytics/AnalyticsPage.jsx
src/pages/users/UserManagementPage.jsx
```

### Current Admin Features

- Admin login page UI
- Protected admin route structure
- Admin layout
- Dashboard page
- KPI/analytics components
- Report queue page
- Report review page
- Report map page
- User management page
- Leaflet map support
- Firebase-ready admin services
- Report moderation service
- Analytics service structure

### Admin Services Prepared

```txt
adminAuthService.js
adminReportService.js
analyticsService.js
mapService.js
```

### Admin Report Service Supports

- Fetching reports from Firestore
- Subscribing to reports
- Updating report status
- Adding admin notes/remarks
- Tracking `reviewedBy` / `updatedBy`

### Current Admin Limitation

The Admin app is more structural and Firebase-dependent. It is not yet fully connected to the Citizen localStorage prototype.

Since Citizen currently saves reports locally, Admin will not see those reports until both apps use Firestore.

### Still To Do

1. Finish Firebase admin login.
2. Add admin role validation.
3. Connect dashboard metrics to Firestore.
4. Connect report queue to real Firestore reports.
5. Connect report review page to update citizen report status.
6. Add status actions:
   - Verify
   - Reject
   - In Progress
   - Resolved
7. Add admin notes/remarks UI.
8. Add map filtering by category/status/urgency.
9. Add analytics charts.
10. Add user management from Firestore `users` collection.
11. Add audit logs for thesis-level credibility.

### Run Admin App

```bash
cd citizenwatch-admin
npm run dev
```

---

## Current Progress Summary

Citizen app: around 75-80% frontend/prototype complete.

Admin app: around 40-50% complete.

Backend/Firebase integration: around 20-30% complete.

Thesis defense UI readiness:

The Citizen app is already strong visually and functionally for demo using localStorage. The Admin app needs more functional polish before client/thesis presentation.

---

## Recommended Next Development Order

1. Finish Admin report review flow.
2. Connect both Citizen and Admin to Firestore.
3. Replace localStorage reports with Firestore reports.
4. Upload report photos to Firebase Storage.
5. Store report status updates from Admin.
6. Show updated statuses in Citizen Reports/Profile/Alerts.
7. Add Firebase Auth roles:
   - citizen
   - admin
8. Add Firestore security rules.
9. Add analytics dashboard.
10. Final testing, screenshots, and thesis documentation.

---

## Most Important Next Step

Connect Citizen report submission to Firestore, then make Admin read the same `reports` collection.

That will turn the project from a local prototype into a real full-stack system.
