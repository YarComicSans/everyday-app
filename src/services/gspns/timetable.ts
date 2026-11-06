import { startOf, stopsOf } from './picker-lines';
import type { Departure, LineDirections, LineSelection } from './types';

export type MissingDirection = {
  lineNumber: string;
  /** Where the user wanted to start from, when we know the line's other end. */
  terminal?: string;
};

/**
 * Picks the selected direction of every requested line and merges them into one
 * chronological list. Directions GSP doesn't run on this day are reported as missing.
 *
 * The picker labels directions by the route name (A = as written), but one-way lines
 * don't follow that: 3A "ZEL.STANICA - POBEDA" is GSP direction B. So a direction is
 * matched by its starting stop first and by letter only as a fallback.
 */
export function combineDepartures(
  selection: LineSelection[],
  lines: LineDirections[],
): { departures: Departure[]; missing: MissingDirection[] } {
  const departures: Departure[] = [];
  const missing: MissingDirection[] = [];

  for (const sel of selection) {
    const line = lines.find((l) => l.lineNumber === sel.lineNumber);
    if (!line) {
      missing.push({ lineNumber: sel.lineNumber });
      continue;
    }
    const start = startOf(line.lineName, sel.direction);
    const startsAt = (stop: string) => line.directions.filter((d) => stopsOf(d.terminal)[0] === stop);
    const byStart = startsAt(start);
    // Fall back to the letter only when GSP's headers don't match the route name at all.
    const namesAgree = byStart.length > 0 || startsAt(startOf(line.lineName, sel.direction === 'A' ? 'B' : 'A')).length > 0;
    const dir = namesAgree
      ? (byStart.find((d) => d.direction === sel.direction) ?? byStart[0])
      : line.directions.find((d) => d.direction === sel.direction);
    if (!dir || dir.departures.length === 0) {
      missing.push({ lineNumber: sel.lineNumber, terminal: start });
      continue;
    }
    departures.push(...dir.departures);
  }

  departures.sort(
    (a, b) =>
      a.serviceMinute - b.serviceMinute ||
      a.lineNumber.localeCompare(b.lineNumber, undefined, { numeric: true }),
  );
  return { departures, missing };
}

/** Index of the first departure at or after `serviceMinute`, or -1 when none are left. */
export const nextDepartureIndex = (departures: Departure[], serviceMinute: number) =>
  departures.findIndex((d) => d.serviceMinute >= serviceMinute);

export const formatTime = (d: Pick<Departure, 'hour' | 'minute'>) =>
  `${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')}`;
