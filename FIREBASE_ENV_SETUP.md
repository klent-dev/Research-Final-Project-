# CitizenWatch Firebase Environment Setup

Do not commit real `.env` files to Git. Each developer should create their own local `.env` file after pulling the project.

## Citizen App

Create this file:

```text
citizenwatch-citizen/.env
```

Add the citizen Firebase app values:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_CITIZEN_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_CITIZEN_MEASUREMENT_ID
VITE_REPORT_GPS_RADIUS_METERS=100
```

## Admin App

Create this file:

```text
citizenwatch-admin/.env
```

Add the admin Firebase app values:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_ADMIN_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_ADMIN_MEASUREMENT_ID
VITE_ADMIN_ALLOWED_ROLE=lgu_admin
VITE_ADMIN_AUTH_BYPASS=true
```

`VITE_ADMIN_AUTH_BYPASS=true` is for local UI testing only. Set it to `false` before production or defense builds that require real admin authentication.

## After Creating `.env`

Run these commands in each app:

```bash
npm install
npm run dev
```

Citizen app:

```bash
cd citizenwatch-citizen
npm run dev
```

Admin app:

```bash
cd citizenwatch-admin
npm run dev
```

