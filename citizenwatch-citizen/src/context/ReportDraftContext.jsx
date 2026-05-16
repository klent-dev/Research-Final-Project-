import { useMemo, useState } from 'react';
import { ReportDraftContext } from './reportDraftContext.js';

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
