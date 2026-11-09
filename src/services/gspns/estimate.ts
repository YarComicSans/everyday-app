import type { Departure, Route } from './types';

/*
 * GSP publishes departures from the starting terminal only. Everything after that is an
 * estimate: the bus is assumed to move at a fixed average speed along its route.
 */

/** Average bus speed including stops and traffic. Tune against real buses. */
export const AVERAGE_SPEED_KMH = 18;
/** Trip length used when a line's stop data is unavailable. */
export const DEFAULT_TRIP_MINUTES = 30;

const METRES_PER_MINUTE = (AVERAGE_SPEED_KMH * 1000) / 60;

/** Estimated minutes from the first to the last stop. */
export const tripMinutes = (route: Route | undefined) =>
  route ? route.stops[route.stops.length - 1].offset / METRES_PER_MINUTE : DEFAULT_TRIP_MINUTES;

export type StopTime = {
  name: string;
  /** Estimated service-day minute the bus is at this stop (fractional). */
  serviceMinute: number;
};

export const stopTimes = (departure: Departure, route: Route): StopTime[] =>
  route.stops.map((s) => ({ name: s.name, serviceMinute: departure.serviceMinute + s.offset / METRES_PER_MINUTE }));

/**
 * The bus on the road now: the latest departure before `nowMinute` whose estimated
 * arrival is still ahead. -1 when no bus is on its route.
 */
export function nowDepartureIndex(
  departures: Departure[],
  nowMinute: number,
  duration: (d: Departure) => number,
): number {
  for (let i = departures.length - 1; i >= 0; i--) {
    const d = departures[i];
    if (d.serviceMinute >= nowMinute) continue;
    if (d.serviceMinute + duration(d) > nowMinute) return i;
  }
  return -1;
}

/** `HH:MM` of a (possibly fractional, possibly ≥ 24h) service-day minute. */
export function formatServiceMinute(serviceMinute: number): string {
  const total = Math.round(serviceMinute);
  const h = Math.floor(total / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** `in 7 min`, or `arriving` under a minute. */
export function formatMinutesFromNow(serviceMinute: number, nowMinute: number): string {
  const minutes = serviceMinute - nowMinute;
  return minutes < 1 ? 'arriving' : `in ${Math.round(minutes)} min`;
}
