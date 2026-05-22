import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['manifest.webmanifest'],
      manifest: {
        name: 'CitizenWatch',
        short_name: 'CitizenWatch',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#14532d',
        icons: [
          {
            src: '/icons/citizenwatch-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/citizenwatch-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, '/');

          if (
            moduleId.includes('node_modules/react/') ||
            moduleId.includes('node_modules/react-dom/') ||
            moduleId.includes('node_modules/react-router-dom/') ||
            moduleId.includes('node_modules/@remix-run/router/') ||
            moduleId.includes('node_modules/scheduler/')
          ) {
            return 'react';
          }

          if (
            moduleId.includes('node_modules/@firebase/firestore') ||
            moduleId.includes('node_modules/firebase/firestore')
          ) {
            return 'firebase-firestore';
          }

          if (
            moduleId.includes('node_modules/@firebase/auth') ||
            moduleId.includes('node_modules/firebase/auth')
          ) {
            return 'firebase-auth';
          }

          if (
            moduleId.includes('node_modules/@firebase/storage') ||
            moduleId.includes('node_modules/firebase/storage')
          ) {
            return 'firebase-storage';
          }

          if (moduleId.includes('node_modules/firebase') || moduleId.includes('node_modules/@firebase')) {
            return 'firebase-core';
          }

          if (
            moduleId.includes('node_modules/leaflet') ||
            moduleId.includes('node_modules/react-leaflet')
          ) {
            return 'maps';
          }

          if (moduleId.includes('node_modules/react-icons')) {
            return 'icons';
          }

          if (moduleId.includes('node_modules/exifr')) {
            return 'exif';
          }

          if (moduleId.includes('node_modules/workbox')) {
            return 'pwa';
          }

          return undefined;
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
