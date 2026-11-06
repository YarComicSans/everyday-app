import type { DayType } from './types';

/** GSP's service day runs past midnight; departures until ~03:00 belong to the previous day. */
export const SERVICE_DAY_START_HOUR = 3;

export type ServiceDay = {
  /** Local calendar date of the service day, `YYYY-MM-DD`. */
  date: string;
  /** True between 00:00 and 03:00, when the service day is yesterday's. */
  afterMidnight: boolean;
  /** Minutes since 00:00 of the service day (00–02h → 24–26h). */
  minute: number;
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function getServiceDay(now: Date): ServiceDay {
  const afterMidnight = now.getHours() < SERVICE_DAY_START_HOUR;
  const day = new Date(now);
  if (afterMidnight) day.setDate(day.getDate() - 1);
  return {
    date: iso(day),
    afterMidnight,
    minute: (afterMidnight ? now.getHours() + 24 : now.getHours()) * 60 + now.getMinutes(),
  };
}

/**
 * Day type to request. GSP's header describes today's calendar date, so it's used
 * as-is during the day. After midnight the service day is yesterday's, whose type
 * is derived from the weekday — holidays are missed there (accepted trade-off).
 */
export function resolveDayType(todayType: DayType, now: Date): DayType {
  const service = getServiceDay(now);
  if (!service.afterMidnight) return todayType;
  const weekday = new Date(`${service.date}T12:00:00`).getDay();
  return weekday === 6 ? 'S' : weekday === 0 ? 'N' : 'R';
}

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  R: 'Workday',
  S: 'Saturday',
  N: 'Sunday',
  P: 'Holiday',
};
