import {
  combineDepartures,
  nextDepartureIndex,
  type Departure,
  type LineDirections,
  type LineSelection,
  type PickerLine,
} from '@/services/gspns';

/** Selected line id → chosen direction index, in the order the user picked them. */
export type PickedLines = Record<string, number>;

export function toggleLine(picked: PickedLines, id: string): PickedLines {
  if (id in picked) {
    const { [id]: _removed, ...rest } = picked;
    return rest;
  }
  return { ...picked, [id]: 0 };
}

export function pickedSelection(picked: PickedLines, lines: PickerLine[]) {
  return Object.entries(picked).flatMap(([id, index]) => {
    const dir = lines.find((l) => l.id === id)?.directions[index];
    return dir ? [dir.selection] : [];
  });
}

/** What a Favorite card shows for one of its Lines. */
export type LineNext =
  | { kind: 'next'; departure: Departure }
  | { kind: 'done'; lineNumber: string }
  | { kind: 'notRunning'; lineNumber: string };

/**
 * The NEXT bus of each Line of a Favorite, soonest first; Lines without one follow,
 * either because they're done for the day or don't run today in that Direction.
 */
export function favoriteNextBuses(
  selection: LineSelection[],
  lines: LineDirections[],
  serviceMinute: number,
): LineNext[] {
  const result = selection.map((sel): LineNext => {
    const { departures } = combineDepartures([sel], lines);
    if (departures.length === 0) return { kind: 'notRunning', lineNumber: sel.lineNumber };
    const next = departures[nextDepartureIndex(departures, serviceMinute)];
    return next ? { kind: 'next', departure: next } : { kind: 'done', lineNumber: sel.lineNumber };
  });
  const minute = (l: LineNext) => (l.kind === 'next' ? l.departure.serviceMinute : Infinity);
  return result.sort((a, b) => minute(a) - minute(b));
}
