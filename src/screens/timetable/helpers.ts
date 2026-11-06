import type { MissingDirection } from '@/services/gspns';

export const missingText = (m: MissingDirection) =>
  m.terminal
    ? `Line ${m.lineNumber} doesn't start from ${m.terminal} today.`
    : `Line ${m.lineNumber} doesn't run today.`;
