import { DomUtils, parseDocument } from 'htmlparser2';

import { ParseError } from './parse';
import type { Departure, Direction, MapLine, Route, RouteStop } from './types';

/*
 * Stop order per line direction, built from the two endpoints behind GSP's network map:
 * - `/mreza-get-stajalista-tacke` lists the stops of a direction, unordered and with duplicates;
 * - `/mreza-get-linija-tacke` is the route as an ordered polyline — but some are stored
 *   end-to-start (e.g. 4A Liman → station starts at the station).
 * Stops are projected onto the polyline and sorted by distance along it; the polyline's
 * orientation is checked from which side of the road the stops are on (traffic drives right).
 */

/** Stops further than this from the polyline belong to another route variant. */
const MAX_STOP_DISTANCE_M = 150;
/** Same-named stops closer than this are duplicates. */
const DUPLICATE_DISTANCE_M = 50;

/** Hand-made links for timetable lines the name matching gets wrong: `line:direction` → map id. */
export const MAP_LINE_OVERRIDES: Record<string, number> = {};

// ── Parsing ────────────────────────────────────────────────────────────────────

const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/Ð/g, 'Đ').trim();

/** City-line buttons of `GET /mreza`. */
export function parseMapLines(html: string): MapLine[] {
  const doc = parseDocument(html);
  const buttons = DomUtils.findAll((e) => {
    const cls = (e.attribs.class ?? '').split(/\s+/);
    return e.name === 'a' && cls.includes('button-linija') && cls.includes('grad');
  }, doc.children);
  const lines = buttons
    .map((b) => ({
      id: Number(b.attribs.id),
      code: clean(DomUtils.textContent(b)),
      title: clean(b.attribs.title ?? ''),
    }))
    .filter((l) => Number.isInteger(l.id) && l.code);
  if (lines.length === 0) throw new ParseError('no city line buttons on the network map');
  return lines;
}

const parseJsonArray = (body: string): string[] => {
  let data: unknown;
  try {
    data = JSON.parse(body.trim());
  } catch {
    throw new ParseError('not JSON');
  }
  if (!Array.isArray(data)) throw new ParseError('expected a JSON array');
  return data.map(String);
};

export type MapStop = { name: string; lat: number; lon: number };
export type LatLon = { lat: number; lon: number };

/** `GET /mreza-get-stajalista-tacke`: `"[4A],[7B]|lon|lat|NAME|photo|zone"` per stop. */
export function parseMapStops(body: string): MapStop[] {
  return parseJsonArray(body).flatMap((entry) => {
    const [, lon, lat, name] = entry.split('|');
    const stop = { name: clean(name ?? ''), lat: Number(lat), lon: Number(lon) };
    return stop.name && Number.isFinite(stop.lat) && Number.isFinite(stop.lon) ? [stop] : [];
  });
}

/** `GET /mreza-get-linija-tacke`: `"lat, lon"` per point, some prefixed with `\r\n`. */
export function parseMapPath(body: string): LatLon[] {
  return parseJsonArray(body).flatMap((entry) => {
    const [lat, lon] = entry.trim().split(',').map(Number);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [{ lat, lon }] : [];
  });
}

// ── Geometry ───────────────────────────────────────────────────────────────────

type XY = { x: number; y: number };

/** Local flat projection in metres; plenty accurate at city scale. */
const projector = (refLat: number) => {
  const kx = 111_320 * Math.cos((refLat * Math.PI) / 180);
  const ky = 110_540;
  return (p: LatLon): XY => ({ x: p.lon * kx, y: p.lat * ky });
};

const dist = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);

type Projection = { along: number; distance: number; /** >0 left of travel, <0 right */ side: number };

function project(path: XY[], cumulative: number[], q: XY): Projection {
  let best: Projection = { along: 0, distance: Infinity, side: 0 };
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / len2));
    const p = { x: a.x + t * dx, y: a.y + t * dy };
    const d = dist(q, p);
    if (d < best.distance) {
      best = { along: cumulative[i] + t * Math.sqrt(len2), distance: d, side: dx * (q.y - a.y) - dy * (q.x - a.x) };
    }
  }
  return best;
}

/**
 * Orders a direction's stops along its polyline. Returns undefined when there is
 * nothing usable (no polyline, fewer than two stops on it).
 */
export function buildRoute(pathPoints: LatLon[], stops: MapStop[]): Route | undefined {
  if (pathPoints.length < 2 || stops.length === 0) return undefined;
  const toXY = projector(pathPoints[0].lat);
  const path = pathPoints.map(toXY);
  const cumulative = [0];
  for (let i = 1; i < path.length; i++) cumulative.push(cumulative[i - 1] + dist(path[i - 1], path[i]));
  const length = cumulative[cumulative.length - 1];

  const projected = stops
    .map((s) => ({ name: s.name, xy: toXY(s), ...project(path, cumulative, toXY(s)) }))
    .filter((s) => s.distance <= MAX_STOP_DISTANCE_M);

  // Stops sit on the right-hand side of the road. A clear left-hand majority means
  // the polyline runs against the direction of travel; on a close call keep it as stored.
  const offRoad = projected.filter((s) => s.distance > 1);
  const left = offRoad.filter((s) => s.side > 0).length;
  const right = offRoad.length - left;
  const reversed = left - right >= 3 && left >= 2 * right;

  const ordered = projected
    .map((s) => ({ ...s, along: reversed ? length - s.along : s.along }))
    .sort((a, b) => a.along - b.along);

  const kept: typeof ordered = [];
  for (const s of ordered) {
    if (kept.some((k) => k.name === s.name && dist(k.xy, s.xy) < DUPLICATE_DISTANCE_M)) continue;
    kept.push(s);
  }
  if (kept.length < 2) return undefined;

  const start = kept[0].along;
  return { stops: kept.map((s): RouteStop => ({ name: s.name, offset: Math.round(s.along - start) })) };
}

// ── Linking timetable lines to map lines ───────────────────────────────────────

const ROMAN: Record<string, string> = { I: '1', II: '2', III: '3', IV: '4' };

/** `Z.STANICA (RUMEN.PUT)` → `[Z, STANICA, RUMEN, PUT]`; diacritics and roman numerals normalised. */
export const nameTokens = (name: string) =>
  name
    .toUpperCase()
    .replace(/[ĐÐ]/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((t) => ROMAN[t] ?? t);

/**
 * Whether two stop names refer to the same place, allowing GSP's abbreviations:
 * `Z.STANICA` ~ `ŽELEZNIČKA STANICA`, `LIMAN IV` ~ `LIMAN 4`, `BIG TC` ~ `BIG`.
 * Words are compared in order as prefixes of each other, up to the shorter name.
 */
export function sameStop(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  const n = Math.min(ta.length, tb.length);
  if (n === 0) return false;
  for (let i = 0; i < n; i++) {
    if (!ta[i].startsWith(tb[i]) && !tb[i].startsWith(ta[i])) return false;
  }
  return true;
}

const titleStops = (title: string) =>
  title
    .split(/\s+[-–]\s+|\s*–\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

export type DirectionRef = Pick<Departure, 'lineNumber' | 'direction' | 'terminal' | 'destination'>;

/**
 * Finds the map button for a timetable line direction. Map codes are the line number plus
 * the direction letter (`4A`, `3AB`), or the bare number for circular lines (`7A`). GSP's
 * letters don't always agree between the two (3A runs B in the timetable, `3AA` on the map),
 * so the direction is chosen by the starting terminal, then the destination, then the letter.
 */
export function matchMapLine(mapLines: MapLine[], dir: DirectionRef): MapLine | undefined {
  const override = MAP_LINE_OVERRIDES[`${dir.lineNumber}:${dir.direction}`];
  if (override !== undefined) return mapLines.find((m) => m.id === override);

  const byCode = (code: string) => mapLines.filter((m) => m.code === code);
  const paired = [...byCode(`${dir.lineNumber}A`), ...byCode(`${dir.lineNumber}B`)];
  const candidates = paired.length > 0 ? paired : byCode(dir.lineNumber);

  let best: { line: MapLine; score: number } | undefined;
  for (const line of candidates) {
    const stops = titleStops(line.title);
    if (!stops.length || !sameStop(stops[0], dir.terminal)) continue;
    const letter: Direction | undefined = line.code === dir.lineNumber ? undefined : (line.code.slice(-1) as Direction);
    const score =
      (sameStop(stops[stops.length - 1], dir.destination) ? 2 : 0) + (letter === dir.direction ? 1 : 0);
    if (!best || score > best.score) best = { line, score };
  }
  return best?.line;
}
