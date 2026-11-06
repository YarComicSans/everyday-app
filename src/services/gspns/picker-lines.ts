import type { Direction, LineInfo, LineSelection } from './types';

/** One way a picker line can be travelled; maps to exactly one GSP request entry. */
export type PickerDirection = {
  selection: LineSelection;
  /** GSP number for this option (`7A` for the circular pair "7"). */
  lineNumber: string;
  /** Human label made of real end stops, e.g. `LIMAN IV → Z.STANICA (RUMEN.PUT)`. */
  label: string;
};

/** A chip on the Pick lines screen. */
export type PickerLine = {
  /** Chip text: the GSP number, or the shared number for circular pairs (`7`). */
  id: string;
  name: string;
  directions: PickerDirection[];
};

/** Splits a GSP route name (`KLISA-CENTAR-LIMAN I`, `A - B`) into stops. */
export const stopsOf = (name: string) =>
  name
    .split(/\s*-\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Where a direction starts according to the route name: A as written, B reversed. */
export function startOf(lineName: string, direction: Direction): string {
  const stops = stopsOf(lineName);
  return (direction === 'A' ? stops[0] : stops[stops.length - 1]) ?? lineName;
}

const isCircular = (stops: string[]) => stops.length > 2 && stops[0] === stops[stops.length - 1];

/**
 * Builds the picker model from the GSP line list.
 * - Regular lines get two directions labelled by their end stops (A = as named, B = reversed).
 * - Circular pairs (`7A`/`7B`, `11A`/`11B`, `18A`/`18B`) merge into one chip; GSP lists
 *   `xA` only as direction A and `xB` only as direction B, so each variant is one direction.
 * - Direction availability per day isn't known up front (e.g. 3A runs B only); the timetable
 *   reports directions that have no departures.
 */
export function buildPickerLines(lines: LineInfo[]): PickerLine[] {
  const byNumber = new Map(lines.map((l) => [l.number, l]));
  const consumed = new Set<string>();
  const result: PickerLine[] = [];

  for (const line of lines) {
    if (consumed.has(line.number)) continue;
    const stops = stopsOf(line.name);

    const pair = line.number.match(/^(\d+)A$/);
    const partner = pair ? byNumber.get(`${pair[1]}B`) : undefined;
    if (pair && partner && isCircular(stops) && isCircular(stopsOf(partner.name))) {
      consumed.add(partner.number);
      const via = (l: LineInfo) => `${l.number} · ${stopsOf(l.name)[0]} via ${stopsOf(l.name)[1]}`;
      result.push({
        id: pair[1],
        name: `${stops[0]} circular`,
        directions: [
          { selection: { value: line.value, lineNumber: line.number, direction: 'A' }, lineNumber: line.number, label: via(line) },
          { selection: { value: partner.value, lineNumber: partner.number, direction: 'B' }, lineNumber: partner.number, label: via(partner) },
        ],
      });
      continue;
    }

    const first = stops[0] ?? line.name;
    const last = stops[stops.length - 1] ?? line.name;
    const dir = (direction: Direction, from: string, to: string): PickerDirection => ({
      selection: { value: line.value, lineNumber: line.number, direction },
      lineNumber: line.number,
      label: from === to ? `${from} (circular)` : `${from} → ${to}`,
    });
    result.push({
      id: line.number,
      name: line.name,
      directions: [dir('A', first, last), dir('B', last, first)],
    });
  }
  return result;
}

/** Route-param encoding: `4*:A:4,7B.:B:7B`. Option values never contain `,` or `:`. */
export function encodeSelection(selection: LineSelection[]): string {
  return selection.map((s) => `${s.value}:${s.direction}:${s.lineNumber}`).join(',');
}

export function decodeSelection(param: string | undefined): LineSelection[] {
  if (!param) return [];
  return param
    .split(',')
    .map((part): LineSelection => {
      const [value = '', direction, lineNumber] = part.split(':');
      return { value, direction: direction === 'B' ? 'B' : 'A', lineNumber: lineNumber || value };
    })
    .filter((s) => s.value);
}
