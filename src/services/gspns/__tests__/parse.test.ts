import { readFileSync } from 'fs';
import { join } from 'path';

import { parseDepartures, parseLineList, parseTimetableInfo, ParseError } from '../parse';

const fixture = (name: string) => readFileSync(join(__dirname, '../__fixtures__', name), 'utf8');

describe('parseTimetableInfo', () => {
  it('reads the valid-from date and today’s day type', () => {
    expect(parseTimetableInfo(fixture('gradski.html'))).toEqual({
      validFrom: '2026-10-01',
      todayType: 'R',
      todayLabel: 'RADNI DAN',
    });
  });

  it('names what is missing on unexpected HTML', () => {
    expect(() => parseTimetableInfo('<html><body>Maintenance</body></html>')).toThrow(
      new ParseError('no #vaziod select'),
    );
  });
});

describe('parseLineList', () => {
  it('keeps the opaque option values and splits number from name', () => {
    const lines = parseLineList(fixture('l_rvgR.html'));
    expect(lines).toHaveLength(25);
    expect(lines[0]).toEqual({ value: '1*', number: '1', name: 'KLISA-CENTAR-LIMAN I' });
    expect(lines.find((l) => l.number === '3A')?.value).toBe('3A.');
    expect(lines.find((l) => l.number === '5')?.value).toBe('5');
  });

  it('lists 5N on Sundays', () => {
    expect(parseLineList(fixture('l_rvgN.html')).map((l) => l.number)).toContain('5N');
  });
});

describe('parseDepartures', () => {
  it('parses a two-direction line', () => {
    const [line4] = parseDepartures(fixture('p4.html'));
    expect(line4.lineNumber).toBe('4');
    expect(line4.lineName).toBe('LIMAN IV - CENTAR - Z.STANICA (RUMEN.PUT)');
    expect(line4.directions.map((d) => [d.direction, d.terminal, d.destination])).toEqual([
      ['A', 'LIMAN IV', 'Z.STANICA (RUMEN.PUT)'],
      ['B', 'Z.STANICA (RUMEN.PUT)', 'LIMAN IV'],
    ]);
    const first = line4.directions[0].departures[0];
    expect(first).toMatchObject({ hour: 4, minute: 30, serviceMinute: 270, lowFloor: true, codes: [] });
  });

  it('marks high-floor departures', () => {
    const [line4] = parseDepartures(fixture('p4.html'));
    // 05:50 is the first departure in the sample without the low-floor ramp class
    const d = line4.directions[0].departures.find((x) => x.hour === 5 && x.minute === 50);
    expect(d?.lowFloor).toBe(false);
  });

  it('counts after-midnight departures into the same service day', () => {
    const all = parseDepartures(fixture('all_rvg_R.html'));
    const midnight = all
      .flatMap((l) => l.directions.flatMap((d) => d.departures))
      .filter((d) => d.hour === 0);
    expect(midnight.length).toBeGreaterThan(0);
    expect(midnight.every((d) => d.serviceMinute >= 24 * 60)).toBe(true);
  });

  it('handles single-direction lines (3A runs B only, circular 7A/7B)', () => {
    const all = parseDepartures(fixture('all_rvg_R.html'));
    const dirs = (n: string) => all.find((l) => l.lineNumber === n)?.directions.map((d) => d.direction);
    expect(all).toHaveLength(25);
    expect(dirs('3A')).toEqual(['B']);
    expect(dirs('7A')).toEqual(['A']);
    expect(dirs('7B')).toEqual(['B']);
    expect(all.find((l) => l.lineNumber === '3A')?.directions[0].departures.length).toBeGreaterThan(0);
  });

  it('attaches variant codes with their legend meaning', () => {
    const all = parseDepartures(fixture('all_rvg_R.html'));
    const line1 = all.find((l) => l.lineNumber === '1')!;
    const coded = line1.directions.flatMap((d) => d.departures).filter((d) => d.codes.length);
    expect(coded.length).toBeGreaterThan(0);
    expect(coded.find((d) => d.codes[0].code === 'NRG')?.codes[0]).toEqual({
      code: 'NRG',
      meaning: 'NISKOPODNI SA RAMPOM GORNJE LIVADE',
      school: false,
    });
  });

  it('parses every day type sample without errors', () => {
    for (const day of ['R', 'S', 'N', 'P']) {
      const all = parseDepartures(fixture(`all_rvg_${day}.html`));
      expect(all.length).toBeGreaterThan(15);
      for (const line of all) {
        for (const dir of line.directions) {
          for (const d of dir.departures) {
            expect(d.minute).toBeGreaterThanOrEqual(0);
            expect(d.minute).toBeLessThan(60);
            expect(d.hour).toBeLessThan(24);
          }
        }
      }
    }
  });
});
