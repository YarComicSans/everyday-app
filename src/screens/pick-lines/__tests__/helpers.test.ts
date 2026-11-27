import type { Departure, LineDirections } from '@/services/gspns';

import { favoriteNextBuses } from '../helpers';

const dep = (lineNumber: string, terminal: string, hour: number, minute: number): Departure => ({
  lineNumber,
  direction: 'A',
  terminal,
  destination: '',
  hour,
  minute,
  serviceMinute: hour * 60 + minute,
  lowFloor: false,
  codes: [],
});

const line = (lineNumber: string, from: string, to: string, times: [number, number][]): LineDirections => ({
  lineNumber,
  lineName: `${from} - ${to}`,
  directions: [{ direction: 'A', terminal: from, destination: to, departures: times.map(([h, m]) => dep(lineNumber, from, h, m)) }],
});

const lines = [
  line('4', 'LIMAN IV', 'CENTAR', [[8, 0], [8, 30]]),
  line('7A', 'NOVO NASELJE', 'CENTAR', [[8, 5], [8, 20]]),
  line('9', 'PETROVARADIN', 'CENTAR', [[7, 0]]),
];
const sel = (lineNumber: string) => ({ value: lineNumber, lineNumber, direction: 'A' as const });

describe('favoriteNextBuses', () => {
  it('gives each Line its NEXT bus, soonest first', () => {
    const result = favoriteNextBuses([sel('4'), sel('7A')], lines, 8 * 60 + 10);
    expect(result.map((r) => r.kind === 'next' && `${r.departure.lineNumber} ${r.departure.hour}:${r.departure.minute}`)).toEqual([
      '7A 8:20',
      '4 8:30',
    ]);
  });

  it('puts Lines done for the day or not running today after the ones still running', () => {
    const result = favoriteNextBuses([sel('9'), sel('3A'), sel('4')], lines, 8 * 60);
    expect(result).toEqual([
      { kind: 'next', departure: lines[0].directions[0].departures[0] },
      { kind: 'done', lineNumber: '9' },
      { kind: 'notRunning', lineNumber: '3A' },
    ]);
  });
});
