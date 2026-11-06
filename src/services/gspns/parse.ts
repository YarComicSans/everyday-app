import { DomUtils, parseDocument } from 'htmlparser2';
import type { Element } from 'domhandler';

import type {
  DayType,
  Departure,
  DepartureCode,
  Direction,
  LineDirections,
  LineInfo,
  TimetableInfo,
} from './types';

/** Thrown by the parsers; the client wraps it into a GspError with step + URL + body. */
export class ParseError extends Error {}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const text = (node: Element) => clean(DomUtils.textContent(node));
const hasClass = (el: Element, cls: string) =>
  (DomUtils.getAttributeValue(el, 'class') ?? '').split(/\s+/).includes(cls);

const DAY_LABELS: [RegExp, DayType][] = [
  [/RADNI/, 'R'],
  [/SUBOT/, 'S'],
  [/NEDELJ/, 'N'],
  [/PRAZNI/, 'P'],
];

/** `GET /red-voznje/gradski` */
export function parseTimetableInfo(html: string): TimetableInfo {
  const doc = parseDocument(html);

  const select = DomUtils.findOne((e) => e.name === 'select' && e.attribs.id === 'vaziod', doc.children);
  if (!select) throw new ParseError('no #vaziod select');
  const options = DomUtils.getElementsByTagName('option', select);
  const option = options.find((o) => 'selected' in o.attribs) ?? options[0];
  const validFrom = option?.attribs.value;
  if (!validFrom) throw new ParseError('#vaziod has no options');

  const TODAY = /данас возе по реду вожње за\s+(.+)$/;
  const para = DomUtils.findOne((e) => e.name === 'p' && TODAY.test(text(e)), doc.children);
  const match = para && text(para).match(TODAY);
  if (!match) throw new ParseError('no "today runs by" header');
  const todayLabel = match[1].trim();
  const todayType = DAY_LABELS.find(([re]) => re.test(todayLabel.toUpperCase()))?.[1];
  if (!todayType) throw new ParseError(`unknown day label "${todayLabel}"`);

  return { validFrom, todayType, todayLabel };
}

/** `GET /red-voznje/lista-linija` */
export function parseLineList(html: string): LineInfo[] {
  const doc = parseDocument(html);
  const select = DomUtils.findOne((e) => e.name === 'select' && e.attribs.id === 'linija', doc.children);
  if (!select) throw new ParseError('no #linija select');

  return DomUtils.getElementsByTagName('option', select).map((o) => {
    const label = text(o);
    const space = label.indexOf(' ');
    return {
      value: o.attribs.value,
      number: space === -1 ? label : label.slice(0, space),
      name: space === -1 ? '' : label.slice(space + 1).trim(),
    };
  });
}

const SCHOOL_CODE = /DJ|ĐK|ĐAČ|DJAC/i;

function parseLegend(footer: Element | null): Record<string, string> {
  const legend: Record<string, string> = {};
  if (!footer) return legend;
  for (const m of text(footer).matchAll(/([A-ZČĆŽŠĐ0-9]+)=([^,]+)/g)) {
    legend[m[1]] = m[2].trim();
  }
  return legend;
}

function parseCell(
  td: Element,
  meta: { lineNumber: string; direction: Direction; terminal: string; destination: string },
  legend: Record<string, string>,
): Departure[] {
  const out: Departure[] = [];
  let hour: number | null = null;

  // Hours are <b>HH</b> directly in the cell; each minute is a <sup> whose span
  // holds the digits, the low-floor class and an inner <b> with an optional code.
  const tokens = DomUtils.findAll((e) => e.name === 'sup' || (e.name === 'b' && e.parent === td), [td]);
  for (const el of tokens) {
    if (el.name === 'b') {
      hour = Number(text(el));
      continue;
    }
    const span = DomUtils.findOne((e) => e.name === 'span', el.children);
    if (!span) continue;
    const codeEl = DomUtils.findOne((e) => e.name === 'b', span.children);
    const code = codeEl ? text(codeEl) : '';
    const minuteText = clean(
      span.children
        .filter((c) => c.type === 'text')
        .map((c) => DomUtils.textContent(c))
        .join(''),
    );
    const minute = Number(minuteText);
    if (hour === null || !/^\d{1,2}$/.test(minuteText) || Number.isNaN(hour)) {
      throw new ParseError(`line ${meta.lineNumber}${meta.direction}: bad time "${hour}:${minuteText}"`);
    }
    const codes: DepartureCode[] = code
      ? [{ code, meaning: legend[code], school: SCHOOL_CODE.test(code) }]
      : [];
    out.push({
      ...meta,
      hour,
      minute,
      serviceMinute: (hour < 3 ? hour + 24 : hour) * 60 + minute,
      lowFloor: hasClass(span, 'niskopodni-rampa'),
      codes,
    });
  }
  return out;
}

/** `GET /red-voznje/ispis-polazaka` — one block per requested line, 1–2 direction columns each. */
export function parseDepartures(html: string): LineDirections[] {
  const doc = parseDocument(html);
  const titles = DomUtils.findAll((e) => e.name === 'div' && hasClass(e, 'table-title'), doc.children);
  const tables = DomUtils.findAll((e) => e.name === 'table' && hasClass(e, 'tabela-polasci'), doc.children);
  if (titles.length !== tables.length) {
    throw new ParseError(`${titles.length} line titles but ${tables.length} tables`);
  }

  return titles.map((titleEl, i) => {
    const title = text(titleEl).replace(/^Линија\s*:\s*/, '');
    const space = title.indexOf(' ');
    const lineNumber = space === -1 ? title : title.slice(0, space);
    const lineName = space === -1 ? '' : title.slice(space + 1).trim();

    const table = tables[i];
    const headers = DomUtils.getElementsByTagName('th', table);
    const cells = DomUtils.getElementsByTagName('td', table).filter(
      (td) => !hasClass(td, 'tabelapolascifooter'),
    );
    const footer = DomUtils.findOne((e) => e.name === 'td' && hasClass(e, 'tabelapolascifooter'), [table]);
    if (headers.length !== cells.length) {
      throw new ParseError(`line ${lineNumber}: ${headers.length} directions but ${cells.length} columns`);
    }
    const legend = parseLegend(footer);

    const directions = headers.map((th, j) => {
      const m = text(th).match(/Смер\s*([AB])\s*:\s*(.*)$/);
      if (!m) throw new ParseError(`line ${lineNumber}: bad direction header "${text(th)}"`);
      const direction = m[1] as Direction;
      const stops = m[2].split(/\s+-\s+/).map((s) => s.trim()).filter(Boolean);
      const terminal = stops[0] ?? '';
      const destination = stops[stops.length - 1] ?? '';
      return {
        direction,
        terminal,
        destination,
        departures: parseCell(cells[j], { lineNumber, direction, terminal, destination }, legend),
      };
    });

    return { lineNumber, lineName, directions };
  });
}
