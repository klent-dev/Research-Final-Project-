/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { REPORT_DRAFT_STORAGE_KEY } from '../services/localReportService.js';

const ReportDraftContext = createContext(null);

const initialDraft = {
  selectedFile: null,
  photoPreview: '',
  fileName: '',
  fileSize: '',
  metadataPreview: null,
  exif: null,
  exifLat: null,
  exifLng: null,
  exifTimestamp: '',
  hasExifGps: false,
  captureSource: '',
  directCameraCapture: false,
  location: {
    lat: null,
    lng: null,
    accuracy: null,
    address: '',
    subAddress: '',
    source: null
  },
  deviceLocation: null,
  locationValidation: {
    status: '',
    tone: '',
    label: '',
    message: '',
    helper: '',
    distanceMeters: null,
    source: '',
    checkedAt: ''
  },
  issueType: '',
  urgency: '',
  description: ''
};

function canUseSessionStorage() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return Boolean(window.sessionStorage);
  } catch (error) {
    console.warn('Session storage is unavailable.', error);
    return false;
  }
}

function getSessionStorage() {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch (error) {
    console.warn('Unable to access session storage.', error);
    return null;
  }
}

function sanitizeDraft(draft = {}) {
  return {
    ...initialDraft,
    ...draft,
    selectedFile: draft.selectedFile || null,
    location: {
      ...initialDraft.location,
      ...(draft.location || {})
    },
    locationValidation: {
      ...initialDraft.locationValidation,
      ...(draft.locationValidation || {})
    }
  };
}

function readStoredDraft() {
  if (!canUseSessionStorage()) {
    return initialDraft;
  }

  try {
    const sessionStorage = getSessionStorage();
    const rawDraft = sessionStorage?.getItem(REPORT_DRAFT_STORAGE_KEY);
    return rawDraft ? sanitizeDraft(JSON.parse(rawDraft)) : initialDraft;
  } catch (error) {
    console.warn('Unable to read report draft. Resetting corrupted draft.', error);
    getSessionStorage()?.removeItem(REPORT_DRAFT_STORAGE_KEY);
    return initialDraft;
  }
}

function persistDraft(draft) {
  if (!canUseSessionStorage()) {
    return;
  }

  const safeDraft = {
    ...draft,
    selectedFile: undefined
  };

  try {
    // TODO: Replace draft persistence with Firestore draft saving if needed
    getSessionStorage()?.setItem(REPORT_DRAFT_STORAGE_KEY, JSON.stringify(safeDraft));
  } catch (error) {
    console.warn('Unable to save report draft.', error);
  }
}

export function ReportDraftProvider({ children }) {
  const [draft, setDraft] = useState(readStoredDraft);

  const updateDraft = useCallback((updates) => {
    setDraft((currentDraft) => {
      const nextDraft = sanitizeDraft({
        ...currentDraft,
        ...updates,
        updatedAt: new Date().toISOString()
      });

      persistDraft(nextDraft);
      return nextDraft;
    });
  }, []);

  const updatePhoto = useCallback((file, previewUrl) => {
    updateDraft({
      selectedFile: file || null,
      photoPreview: previewUrl || '',
      fileName: file?.name || '',
      fileSize: file?.size ? formatFileSize(file.size) : '',
      metadataPreview: null,
      exif: null,
      exifLat: null,
      exifLng: null,
      exifTimestamp: '',
      hasExifGps: false,
      captureSource: '',
      directCameraCapture: false,
      evidenceCapturedAt: previewUrl ? new Date().toISOString() : ''
    });
  }, [updateDraft]);

  const updateLocation = useCallback((locationData) => {
    updateDraft({
      location: {
        ...initialDraft.location,
        ...(locationData || {})
      }
    });
  }, [updateDraft]);

  const updateIssueDetails = useCallback((details) => {
    updateDraft(details);
  }, [updateDraft]);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft);

    if (canUseSessionStorage()) {
      getSessionStorage()?.removeItem(REPORT_DRAFT_STORAGE_KEY);
    }
  }, []);

  const getDraft = useCallback(() => draft, [draft]);

  const value = useMemo(() => ({
    draft,
    updateDraft,
    updatePhoto,
    updateLocation,
    updateIssueDetails,
    resetDraft,
    getDraft
  }), [draft, getDraft, resetDraft, updateDraft, updateIssueDetails, updateLocation, updatePhoto]);

  return (
    <ReportDraftContext.Provider value={value}>
      {children}
    </ReportDraftContext.Provider>
  );
}

export function useReportDraft() {
  const context = useContext(ReportDraftContext);

  if (!context) {
    console.warn('ReportDraftProvider was not found. Using sessionStorage report draft fallback.');

    return {
      draft: readStoredDraft(),
      updateDraft: (updates) => {
        const nextDraft = sanitizeDraft({
          ...readStoredDraft(),
          ...updates,
          updatedAt: new Date().toISOString()
        });
        persistDraft(nextDraft);
      },
      updatePhoto: (file, previewUrl) => {
        const nextDraft = sanitizeDraft({
          ...readStoredDraft(),
          selectedFile: file || null,
          photoPreview: previewUrl || '',
          fileName: file?.name || '',
          fileSize: file?.size ? formatFileSize(file.size) : '',
          metadataPreview: null,
          exif: null,
          exifLat: null,
          exifLng: null,
          exifTimestamp: '',
          hasExifGps: false,
          captureSource: '',
          directCameraCapture: false,
          evidenceCapturedAt: previewUrl ? new Date().toISOString() : ''
        });
        persistDraft(nextDraft);
      },
      updateLocation: (locationData) => {
        const nextDraft = sanitizeDraft({
          ...readStoredDraft(),
          location: {
            ...initialDraft.location,
            ...(locationData || {})
          },
          updatedAt: new Date().toISOString()
        });
        persistDraft(nextDraft);
      },
      updateIssueDetails: (details) => {
        const nextDraft = sanitizeDraft({
          ...readStoredDraft(),
          ...details,
          updatedAt: new Date().toISOString()
        });
        persistDraft(nextDraft);
      },
      resetDraft: () => {
        if (canUseSessionStorage()) {
          getSessionStorage()?.removeItem(REPORT_DRAFT_STORAGE_KEY);
        }
      },
      getDraft: readStoredDraft
    };
  }

  return context;
}

function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
