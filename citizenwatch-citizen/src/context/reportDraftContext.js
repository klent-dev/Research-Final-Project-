import { createContext } from 'react';

export const ReportDraftContext = createContext({
  draft: {},
  updateDraft: () => {},
  resetDraft: () => {}
});
