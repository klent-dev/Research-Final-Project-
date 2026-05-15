# CitizenWatch Project Structure

CitizenWatch is split into two independent React + Vite applications:

- `citizenwatch-citizen`: Citizen PWA for submitting verified infrastructure reports.
- `citizenwatch-admin`: LGU dashboard for report review, mapping, analytics, and user management.

## Complete Folder Tree

```text
CitizenWatch/
|-- .gitignore
|-- README.md
|-- PROJECT_STRUCTURE.md
|-- citizenwatch-citizen/
|   |-- .env.example
|   |-- eslint.config.js
|   |-- index.html
|   |-- package.json
|   |-- vite.config.js
|   |-- public/
|   |   `-- manifest.webmanifest
|   `-- src/
|       |-- App.jsx
|       |-- main.jsx
|       |-- assets/
|       |   |-- icons/
|       |   `-- images/
|       |-- components/
|       |   |-- common/
|       |   |-- layout/
|       |   |-- map/
|       |   `-- reports/
|       |-- context/
|       |-- firebase/
|       |-- hooks/
|       |-- pages/
|       |   |-- auth/
|       |   `-- reports/
|       |-- routes/
|       |-- services/
|       |-- styles/
|       `-- utils/
`-- citizenwatch-admin/
    |-- .env.example
    |-- eslint.config.js
    |-- index.html
    |-- package.json
    |-- vite.config.js
    |-- public/
    `-- src/
        |-- App.jsx
        |-- main.jsx
        |-- assets/
        |   |-- icons/
        |   `-- images/
        |-- components/
        |   |-- analytics/
        |   |-- common/
        |   |-- layout/
        |   |-- map/
        |   `-- reports/
        |-- context/
        |-- firebase/
        |-- hooks/
        |-- pages/
        |   |-- analytics/
        |   |-- auth/
        |   |-- dashboard/
        |   |-- reports/
        |   `-- users/
        |-- routes/
        |-- services/
        |-- styles/
        `-- utils/
```

## Folder Responsibilities

`pages/` contains route-level screens. Keep page components focused on orchestration, not business logic.

`components/` contains reusable UI grouped by domain: common primitives, layout shells, reports, maps, and analytics.

`services/` contains Firebase-facing and domain-facing operations such as authentication, report creation, storage upload, admin moderation, EXIF validation, analytics, and map marker shaping.

`firebase/` isolates Firebase app initialization and SDK exports for Auth, Firestore, and Storage.

`hooks/` contains reusable React state logic such as auth state, geolocation, reports, and analytics loading.

`context/` contains app-wide state providers such as citizen authentication, admin authentication, and citizen report drafts.

`routes/` contains React Router route composition and route constants.

`utils/` contains pure helpers, constants, GPS validation, role guards, validators, and date formatting.

`styles/` contains global CSS and theme variables.

`assets/` contains app-owned static images and icon files that are imported by React components.

`public/` contains files served directly by Vite, including the citizen PWA manifest.

## Naming Conventions

- Components and pages use `PascalCase`: `ReportTable.jsx`, `CreateReportPage.jsx`.
- Hooks use `useCamelCase`: `useAuth.js`, `useAdminReports.js`.
- Services use `camelCaseService`: `reportService.js`, `analyticsService.js`.
- Utilities use descriptive camel case: `gpsValidation.js`, `dateFormat.js`.
- Firebase modules are short and SDK-specific: `auth.js`, `firestore.js`, `storage.js`.
- Route constants are centralized in `routeConfig.js`.
- Firestore collection names should use lowercase plural nouns: `reports`, `users`, `auditLogs`.
- Firestore document fields should use camel case: `createdBy`, `createdAt`, `photoUrl`, `adminNotes`.
- Report status values should use lowercase snake case: `under_review`, `in_progress`.

## Recommended Development Order

1. Configure Firebase project, environment variables, Firestore rules, Storage rules, and Auth providers.
2. Build citizen authentication: register, login, logout, protected routes, and profile document creation.
3. Build citizen report creation: form validation, browser GPS capture, EXIF GPS validation, Storage upload, and Firestore report creation.
4. Build citizen report views: report list, report details, report status timeline, and Leaflet report map.
5. Build admin authentication and role enforcement with `users/{uid}.role`.
6. Build admin report queue: filtering, report review, status transitions, notes, and reviewer audit data.
7. Build admin map view with Leaflet markers, clustering if needed, and status/category filters.
8. Build analytics: total reports, pending reports, resolved reports, category breakdown, response time, and barangay/location summaries.
9. Harden production quality: security rules, indexes, error boundaries, loading states, empty states, accessibility, and responsive layout.
10. Prepare thesis artifacts: architecture diagram, database schema, validation flow diagram, testing screenshots, and deployment notes.

