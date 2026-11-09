import { GspError } from './errors';
import { ParseError, parseDepartures, parseLineList, parseTimetableInfo } from './parse';
import { buildRoute, matchMapLine, parseMapLines, parseMapPath, parseMapStops, type DirectionRef } from './route';
import { readRouteCache, writeRouteCache } from './route-cache';
import { resolveDayType } from './service-day';
import type { DayType, LineDirections, LineInfo, LineSelection, Route, TimetableInfo } from './types';

const SITE = 'https://www.gspns.rs';
const BASE = `${SITE}/red-voznje`;
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

export const fetchMapLines = () => request('Network map', `${SITE}/mreza`, parseMapLines);

const fetchRoute = async (id: number) => {
  const [stops, path] = await Promise.all([
    request('Map stops', `${SITE}/mreza-get-stajalista-tacke?linija=${id}`, parseMapStops),
    request('Map route', `${SITE}/mreza-get-linija-tacke?linija=${id}`, parseMapPath),
  ]);
  return buildRoute(path, stops);
};

export const routeKey = (d: Pick<DirectionRef, 'lineNumber' | 'direction'>) => `${d.lineNumber}:${d.direction}`;

/**
 * Ordered stops for each given line direction, keyed by `routeKey`. Network-map data is
 * cached per timetable version, so only directions not seen before cost a request.
 * Never throws: directions that can't be matched or fetched are simply missing.
 */
export async function loadRoutes(validFrom: string, directions: DirectionRef[]): Promise<Record<string, Route>> {
  const cache = await readRouteCache(validFrom);
  let changed = false;
  try {
    if (!cache.mapLines) {
      cache.mapLines = await fetchMapLines();
      changed = true;
    }
  } catch {
    return {};
  }
  const mapLines = cache.mapLines;

  const matched = directions.flatMap((d) => {
    const line = matchMapLine(mapLines, d);
    return line ? [{ key: routeKey(d), id: line.id }] : [];
  });
  const missing = [...new Set(matched.map((m) => m.id))].filter((id) => !cache.routes[id]);
  const fetched = await Promise.all(missing.map((id) => fetchRoute(id).catch(() => undefined)));
  missing.forEach((id, i) => {
    const route = fetched[i];
    if (route) {
      cache.routes[id] = route;
      changed = true;
    }
  });
  if (changed) await writeRouteCache(cache);

  const result: Record<string, Route> = {};
  for (const m of matched) if (cache.routes[m.id]) result[m.key] = cache.routes[m.id];
  return result;
}

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
