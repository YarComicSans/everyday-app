import { GspError } from './errors';
import { ParseError, parseDepartures, parseLineList, parseTimetableInfo } from './parse';
import { resolveDayType } from './service-day';
import type { DayType, LineDirections, LineInfo, LineSelection, TimetableInfo } from './types';

const BASE = 'https://www.gspns.rs/red-voznje';
/** Urban ("gradski") timetable only. */
const RV = 'rvg';

async function request<T>(step: string, url: string, parse: (html: string) => T): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new GspError({ kind: 'network', step, url, body: String(e) });
  }
  const body = await res.text();
  if (!res.ok) throw new GspError({ kind: 'http', step, url, status: res.status, body });
  try {
    return parse(body);
  } catch (e) {
    if (!(e instanceof ParseError)) throw e;
    throw new GspError({ kind: 'parse', step, url, status: res.status, body, detail: e.message });
  }
}

export const fetchTimetableInfo = () =>
  request('Timetable info', `${BASE}/gradski`, parseTimetableInfo);

export const fetchLineList = (validFrom: string, dayType: DayType) =>
  request(
    'Line list',
    `${BASE}/lista-linija?rv=${RV}&vaziod=${encodeURIComponent(validFrom)}&dan=${dayType}`,
    parseLineList,
  );

export const fetchDepartures = (validFrom: string, dayType: DayType, values: string[]) =>
  request(
    'Departures',
    `${BASE}/ispis-polazaka?rv=${RV}&vaziod=${encodeURIComponent(validFrom)}&dan=${dayType}&` +
      values.map((v) => `linija[]=${encodeURIComponent(v)}`).join('&'),
    parseDepartures,
  );

export type DayContext = TimetableInfo & { dayType: DayType };

async function loadDayContext(now: Date): Promise<DayContext> {
  const info = await fetchTimetableInfo();
  return { ...info, dayType: resolveDayType(info.todayType, now) };
}

/** Pick lines screen: what runs on the current service day. */
export async function loadLines(now: Date): Promise<{ day: DayContext; lines: LineInfo[] }> {
  const day = await loadDayContext(now);
  return { day, lines: await fetchLineList(day.validFrom, day.dayType) };
}

/** Timetable screen: departures of the selected lines only, in a single request. */
export async function loadTimetable(
  selection: LineSelection[],
  now: Date,
): Promise<{ day: DayContext; lines: LineDirections[] }> {
  const day = await loadDayContext(now);
  const values = [...new Set(selection.map((s) => s.value))];
  if (values.length === 0) return { day, lines: [] };
  return { day, lines: await fetchDepartures(day.validFrom, day.dayType, values) };
}
