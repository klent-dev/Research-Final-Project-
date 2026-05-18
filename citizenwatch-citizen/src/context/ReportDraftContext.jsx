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
  location: {
    lat: null,
    lng: null,
    accuracy: null,
    address: '',
    subAddress: '',
    source: null
  },
  issueType: '',
  urgency: '',
  description: ''
};

function canUseSessionStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

function sanitizeDraft(draft = {}) {
  return {
    ...initialDraft,
    ...draft,
    selectedFile: draft.selectedFile || null,
    location: {
      ...initialDraft.location,
      ...(draft.location || {})
    }
  };
}

function readStoredDraft() {
  if (!canUseSessionStorage()) {
    return initialDraft;
  }

  try {
    const rawDraft = window.sessionStorage.getItem(REPORT_DRAFT_STORAGE_KEY);
    return rawDraft ? sanitizeDraft(JSON.parse(rawDraft)) : initialDraft;
  } catch (error) {
    console.warn('Unable to read report draft. Resetting corrupted draft.', error);
    window.sessionStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
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
    window.sessionStorage.setItem(REPORT_DRAFT_STORAGE_KEY, JSON.stringify(safeDraft));
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
      window.sessionStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
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
    throw new Error('useReportDraft must be used within ReportDraftProvider.');
  }

  return context;
}

function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
