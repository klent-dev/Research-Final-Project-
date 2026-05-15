import { createContext, useMemo, useState } from 'react';

export const ReportDraftContext = createContext({
  draft: {},
  updateDraft: () => {},
  resetDraft: () => {}
});

export function ReportDraftProvider({ children }) {
  const [draft, setDraft] = useState({});

  const value = useMemo(
    () => ({
      draft,
      updateDraft: (patch) => setDraft((current) => ({ ...current, ...patch })),
      resetDraft: () => setDraft({})
    }),
    [draft]
  );

  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

