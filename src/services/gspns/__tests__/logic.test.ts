import { readFileSync } from 'fs';
import { join } from 'path';

import { parseDepartures, parseLineList } from '../parse';
import { buildPickerLines, decodeSelection, encodeSelection } from '../picker-lines';
import { getServiceDay, resolveDayType } from '../service-day';
import { combineDepartures, nextDepartureIndex } from '../timetable';

const fixture = (name: string) => readFileSync(join(__dirname, '../__fixtures__', name), 'utf8');

describe('buildPickerLines', () => {
  const picker = buildPickerLines(parseLineList(fixture('l_rvgR.html')));
  const byId = (id: string) => picker.find((p) => p.id === id);

  it('labels regular directions by their end stops', () => {
    expect(byId('4')?.directions.map((d) => d.label)).toEqual([
      'LIMAN IV → Z.STANICA (RUMEN.PUT)',
      'Z.STANICA (RUMEN.PUT) → LIMAN IV',
    ]);
  });

  it('merges circular pairs into one chip', () => {
    expect(picker.map((p) => p.id)).not.toContain('7A');
    expect(picker.map((p) => p.id)).not.toContain('7B');
    const seven = byId('7')!;
    expect(seven.directions.map((d) => d.selection)).toEqual([
      { value: '7A.', lineNumber: '7A', direction: 'A' },
      { value: '7B.', lineNumber: '7B', direction: 'B' },
    ]);
    expect(seven.directions[0].label).toBe('7A · N.NASELJE via Z.STAN');
    expect(byId('11')).toBeDefined();
    expect(byId('18')).toBeDefined();
  });

  it('keeps non-circular A/B lines separate', () => {
    expect(byId('3A')).toBeDefined();
    expect(byId('3B')).toBeDefined();
    expect(byId('6A')).toBeDefined();
  });
});

describe('selection param', () => {
  it('round-trips opaque values', () => {
    const sel = [
      { value: '4*', lineNumber: '4', direction: 'B' as const },
      { value: '3A.', lineNumber: '3A', direction: 'A' as const },
    ];
    expect(encodeSelection(sel)).toBe('4*:B:4,3A.:A:3A');
    expect(decodeSelection(encodeSelection(sel))).toEqual(sel);
    expect(decodeSelection(undefined)).toEqual([]);
  });
});

describe('service day', () => {
  it('treats 00:00–02:59 as the previous day', () => {
    const sat0130 = new Date(2026, 10, 7, 1, 30); // Saturday 7 Nov 2026, 01:30
    expect(getServiceDay(sat0130)).toEqual({ date: '2026-11-06', afterMidnight: true, minute: 25 * 60 + 30 });
    // Friday night service → workday, whatever GSP says about Saturday
    expect(resolveDayType('S', sat0130)).toBe('R');
  });

  it('uses GSP’s day type during the day (catches holidays)', () => {
    expect(resolveDayType('P', new Date(2026, 10, 11, 9, 0))).toBe('P');
  });

  it('derives Sunday for Sunday-night service on Monday 01:00', () => {
    expect(resolveDayType('R', new Date(2026, 10, 9, 1, 0))).toBe('N');
  });
});

describe('combineDepartures', () => {
  const lines = parseDepartures(fixture('all_rvg_R.html'));

  it('merges selected directions chronologically', () => {
    const { departures, missing } = combineDepartures(
      [
        { value: '4*', lineNumber: '4', direction: 'A' },
        { value: '9.', lineNumber: '9', direction: 'B' },
      ],
      lines,
    );
    expect(missing).toEqual([]);
    expect(new Set(departures.map((d) => d.lineNumber))).toEqual(new Set(['4', '9']));
    expect(departures.every((d, i) => i === 0 || departures[i - 1].serviceMinute <= d.serviceMinute)).toBe(true);
    expect(departures.filter((d) => d.lineNumber === '4').every((d) => d.terminal === 'LIMAN IV')).toBe(true);
  });

  it('matches one-way lines by starting stop, not GSP letter', () => {
    // Picker shows 3A "A" as ZEL.STANICA → POBEDA; GSP files that run under B.
    const { departures, missing } = combineDepartures([{ value: '3A.', lineNumber: '3A', direction: 'A' }], lines);
    expect(missing).toEqual([]);
    expect(departures.length).toBeGreaterThan(0);
    expect(departures.every((d) => d.terminal === 'ZEL.STANICA')).toBe(true);
  });

  it('reports directions and lines that do not run', () => {
    const { missing } = combineDepartures(
      [
        { value: '3A.', lineNumber: '3A', direction: 'B' },
        { value: '5N.', lineNumber: '5N', direction: 'A' },
      ],
      lines,
    );
    expect(missing).toEqual([{ lineNumber: '3A', terminal: 'POBEDA' }, { lineNumber: '5N' }]);
  });

  it('picks the circular variant the user chose', () => {
    const { departures } = combineDepartures([{ value: '7B.', lineNumber: '7B', direction: 'B' }], lines);
    expect(departures.length).toBeGreaterThan(0);
    expect(departures.every((d) => d.lineNumber === '7B')).toBe(true);
  });

  it('finds the next departure', () => {
    const { departures } = combineDepartures([{ value: '4*', lineNumber: '4', direction: 'A' }], lines);
    const i = nextDepartureIndex(departures, 4 * 60 + 31);
    expect(departures[i]).toMatchObject({ hour: 4, minute: 50 });
    expect(nextDepartureIndex(departures, 27 * 60)).toBe(-1);
  });
});
