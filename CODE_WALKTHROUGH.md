# CitizenWatch Code Walkthrough

Use this guide when explaining the system during defense or a skill test. The source code now has short comments in the complex parts, and this document explains the important files and function roles in plain language.

## Main Idea

CitizenWatch has two React apps that share one Firestore `reports` collection.

- `citizenwatch-citizen` lets a citizen create a report, attach a photo, capture GPS, validate metadata, and submit the report.
- `citizenwatch-admin` lets LGU/admin users review, map, filter, update, reject, and monitor submitted reports.

The most important technical flow is:

1. Citizen uploads or captures a photo.
2. The app reads EXIF metadata from the original image file.
3. The app samples device GPS using `watchPosition()`.
4. The app compares photo GPS, device GPS, and manual map/address location.
5. The app stores a normalized report in Firestore.
6. The admin dashboard reads the same report, normalizes it for display, and lets staff act on it.

## Folder Structure

### Root

- `README.md` gives the short project overview.
- `SYSTEM_DOCUMENTATION.md` explains the complete system architecture and defense notes.
- `CODE_WALKTHROUGH.md` explains the important code functions.
- `firebase.json` defines Firebase hosting targets for citizen and admin apps.
- `.firebaserc` maps Firebase project aliases and hosting targets.

### Citizen App

- `citizenwatch-citizen/src/pages/` contains full application screens.
- `citizenwatch-citizen/src/pages/reports/` contains the multi-step report creation flow.
- `citizenwatch-citizen/src/services/` contains Firebase, EXIF, geocoding, storage, and report data functions.
- `citizenwatch-citizen/src/utils/` contains reusable logic such as GPS validation and map marker helpers.
- `citizenwatch-citizen/src/context/` stores shared state such as the report draft and authentication state.
- `citizenwatch-citizen/src/styles/` contains app styling.

### Admin App

- `citizenwatch-admin/src/pages/` contains admin dashboard screens.
- `citizenwatch-admin/src/pages/reports/` contains report queue, report details, and report map screens.
- `citizenwatch-admin/src/pages/analytics/` contains analytics dashboard logic.
- `citizenwatch-admin/src/services/` contains Firestore report services for moderation.
- `citizenwatch-admin/src/context/` contains admin authentication context.
- `citizenwatch-admin/src/styles/` contains dashboard styling.

## Citizen Report Creation Flow

### `CreateReportPage.jsx`

This is Step 1: photo evidence upload.

- `handleUseCamera()` opens the camera input and marks the photo source as camera.
- `handleChooseFile()` opens the file picker and marks the photo source as gallery.
- `handleFileChange()` validates the selected file, creates a preview URL, and starts photo processing.
- `processSelectedPhoto()` creates a compressed preview, saves the original file in draft state, extracts EXIF, and starts device GPS sampling.
- `extractPhotoMetadata()` reads EXIF GPS, timestamp, camera, and image information from the original uploaded file.
- `captureStepOneDeviceLocation()` gets the best device GPS reading early so the app still has a fallback when the photo has no GPS EXIF.
- `handleRemovePhoto()` clears the selected image and metadata from the draft.
- `handleNextStep()` blocks the user from continuing until a photo is available.

### `CreateReportLocationPage.jsx`

This is Step 2: location verification.

- `LocationMapBridge()` connects the Leaflet map instance to React state and moves the map when the location changes.
- `ManualPinMapEvents()` listens for map clicks so the citizen can manually drop a pin.
- `SafeCreateLocationMap()` renders the Leaflet map and catches map rendering failures.
- `hasValidLocation()` checks if coordinates are real and not invalid `0,0`.
- `normalizeSelectedLocation()` converts EXIF, device, or manual coordinates into one shared location shape.
- `createExifLocation()` builds a map location from Step 1 photo GPS.
- `updateLocationValidationState()` recalculates validation whenever EXIF, device, or manual location changes.
- `applySelectedLocation()` saves the selected location to draft state and moves the map.
- `requestUserLocation()` samples device GPS and falls back to photo GPS if device GPS fails.
- `handleManualMapPin()` converts a map click into a manual report location.
- `handleManualLocationSubmit()` converts a typed address into coordinates.
- `handleConfirmLocation()` saves the final selected location and moves to report details.

### `CreateReportDetailsPage.jsx`

This is Step 3: report description and category.

- It collects issue type, urgency, title, description, and other details.
- It keeps those details in `ReportDraftContext`.
- It prepares the draft for final review/submission.

### `ReportDraftContext.jsx`

This is the shared temporary state for the citizen report flow.

- `draft` stores the photo, location, EXIF, validation, and report details.
- `updateDraft()` merges new values into the current draft.
- `updatePhoto()` stores the original photo file and preview.
- `updateLocation()` stores the selected report location.
- `resetDraft()` clears the report flow after successful submission.

## Citizen Services And Utilities

### `exifValidationService.js`

This file reads and normalizes photo metadata.

- `normalizeGps()` accepts GPS from different camera formats, including decimal GPS and DMS GPS.
- `normalizeTimestamp()` standardizes EXIF date values.
- `normalizeGpsTimestamp()` combines GPS date and GPS time tags.
- `summarizeRawExif()` keeps only a compact raw EXIF summary to avoid large Firestore documents.
- `readImageExif()` is the main Step 1 EXIF reader.
- `validateExifGpsProximity()` compares EXIF GPS with browser/device GPS for radius validation.

Important defense point: if a photo has no GPS EXIF, the app cannot invent photo GPS. It uses device GPS or manual location as fallback.

### `deviceLocation.js`

This file improves Android/iPhone GPS capture.

- `geolocationErrorMessage()` converts browser GPS errors into user-friendly messages.
- `normalizePositionLocation()` converts browser GPS data into the app location format.
- `getBestDevicePosition()` uses `watchPosition()` for several seconds and returns the reading with the best accuracy.

Important defense point: `watchPosition()` is stronger than a single `getCurrentPosition()` call, especially indoors or on low-end Android phones.

### `locationValidation.js`

This file decides how trustworthy the location is.

- `calculateDistanceMeters()` calculates distance between two GPS points using the Haversine formula.
- `getGpsAccuracyLevel()` labels GPS accuracy as excellent, good, weak, or poor.
- `calculateVerificationScore()` creates a trust score based on EXIF GPS, direct camera capture, device GPS, distance, and accuracy.
- `validatePhotoLocation()` returns the final validation status, message, trust score, source, and review requirement.

Important defense point: the system does not automatically approve reports. It gives evidence and flags weak reports for admin review.

### `geocodingService.js`

This file converts between coordinates and readable addresses.

- `geocodeAddress()` turns a typed address into coordinates.
- `reverseGeocodeLocation()` turns coordinates into a readable address.

### `reportService.js`

This file saves and reads citizen reports.

- `sanitizeForFirestore()` removes `undefined` values that Firestore does not allow.
- `compactExifForStorage()` removes bulky raw EXIF while keeping useful summarized metadata.
- `normalizeReportPayload()` converts the draft into the final Firestore report shape.
- `createInfrastructureReport()` validates the draft, uploads the photo, and saves the report document.
- `getReportsByUser()` loads reports submitted by one citizen.
- `subscribeToReportsByUser()` listens to real-time report updates for one citizen.
- `updateReportStatus()` updates a report status.
- `deleteInfrastructureReport()` deletes a report and its photo.

### `storageService.js`

This file handles Firebase Storage photo uploads.

- `uploadReportPhoto()` uploads the evidence image and returns a public download URL.
- `deleteReportPhotoByUrl()` removes old evidence images when needed.

## Admin Report Flow

### `adminReportService.js`

This is the admin dashboard data layer.

- `normalizeReportStatus()` converts many possible status names into dashboard status groups.
- `getDisplayStatus()` converts internal status into readable text.
- `normalizeReportSeverity()` standardizes urgency/severity.
- `normalizeLocationValidation()` collects GPS, EXIF, camera, distance, review, and trust score metadata for admin display.
- `normalizeReportCategory()` groups reports into admin categories.
- `calculateReportProgress()` turns status into progress percentage.
- `getReportCoordinates()` extracts coordinates from the report.
- `normalizeAdminReport()` converts Firestore report data into one consistent admin report shape.
- `getReportsForModeration()` loads reports once.
- `subscribeReportsForModeration()` listens to report changes in real time.
- `updateReportStatus()` saves admin review actions.
- `markReportNotVerified()` rejects a report and stores the reason.
- `deleteReport()` removes one report.
- `deleteReports()` removes multiple reports.

### `ReportQueuePage.jsx`

This is the main admin moderation table.

- It subscribes to Firestore reports.
- It shows status, severity, trust score, review requirement, GPS source, and report details.
- It opens report details so the admin can inspect metadata and act on the report.

### `ReportMapPage.jsx`

This page shows reports on a map.

- It reads report coordinates from normalized admin reports.
- It places markers based on report location and severity.
- It helps admins visually monitor issue distribution.

### `AnalyticsPage.jsx`

This page summarizes report data.

- It computes totals, categories, status distribution, and operational metrics.
- It helps LGU staff understand trends from submitted reports.

### `AdminAuthContext.jsx`

This file manages admin sign-in state.

- It keeps the current admin user in context.
- It protects admin pages from unauthenticated access.

## Firestore Report Shape

The `reports` document contains the important fields used by both apps:

- `id` and `trackingId` identify the report.
- `issueType`, `category`, `title`, `urgency`, and `description` describe the issue.
- `location`, `latitude`, `longitude`, and `address` store the selected report location.
- `exif` stores summarized photo metadata.
- `deviceLocation` stores the browser/device GPS reading.
- `locationValidation` stores trust score, source, GPS accuracy, distance, and review status.
- `photoUrl`, `imageUrl`, and `evidenceImage` point to the uploaded photo.
- `status`, `createdAt`, and `updatedAt` track the workflow.
- `createdBy` and `reporterId` connect the report to the citizen account.

## Common Defense Questions

### Where does the system read photo GPS?

`citizenwatch-citizen/src/services/exifValidationService.js`, mainly `readImageExif()` and `normalizeGps()`.

### Why can some photos have no GPS?

Camera location tags may be off, location permission may be denied, the photo may be edited or downloaded from another app, or the phone may not get a GPS lock indoors. If GPS is not inside EXIF, the system cannot read it from the image.

### What is the fallback when photo GPS is missing?

The app uses `getBestDevicePosition()` in `deviceLocation.js`. If that also fails, the citizen can use manual address search or tap the map to drop a pin.

### Where is location accuracy checked?

`citizenwatch-citizen/src/utils/locationValidation.js`, mainly `validatePhotoLocation()`, `calculateDistanceMeters()`, and `calculateVerificationScore()`.

### Where is the report saved?

`citizenwatch-citizen/src/services/reportService.js`, mainly `createInfrastructureReport()`.

### Where does the admin dashboard get its metadata?

`citizenwatch-admin/src/services/adminReportService.js`, mainly `normalizeLocationValidation()` and `normalizeAdminReport()`.

### Why store summarized EXIF instead of full raw EXIF?

Full raw EXIF can be very large and may risk Firestore document size limits. The system keeps important metadata and a compact summary for debugging/research.

## Skill Test Focus

For a skill test, focus on these files first:

1. `CreateReportPage.jsx` for photo upload and EXIF extraction.
2. `CreateReportLocationPage.jsx` for GPS, map pin, and validation.
3. `exifValidationService.js` for metadata reading.
4. `deviceLocation.js` for stronger GPS capture.
5. `locationValidation.js` for trust score and review logic.
6. `reportService.js` for Firestore saving.
7. `adminReportService.js` for admin table/map metadata.

You do not need to memorize every component. Understand the flow, know where the core functions are, and explain how the citizen app and admin app share the same normalized Firestore report data.
