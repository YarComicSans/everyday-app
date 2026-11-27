import {
  formatMinutesFromNow,
  formatServiceMinute,
  stopTimes,
  tripMinutes,
  type Departure,
  type MissingDirection,
  type Route,
} from '@/services/gspns';

import { detailsHeight, ROW_HEIGHT, SUMMARY_HEIGHT } from '@/components/departure-row/styles';
import type { NowSummary, StopDetails } from '@/components/departure-row/types';

export const missingText = (m: MissingDirection) =>
  m.terminal
    ? `Line ${m.lineNumber} doesn't start from ${m.terminal} today.`
    : `Line ${m.lineNumber} doesn't run today.`;

/** Estimate line of the NOW row. `nowMinute` is fractional for second-level accuracy. */
export function nowSummary(d: Departure, route: Route | undefined, nowMinute: number): NowSummary {
  const arrival = d.serviceMinute + tripMinutes(route);
  return {
    nextStop: route ? stopTimes(d, route).find((s) => s.serviceMinute > nowMinute)?.name : undefined,
    arrival: formatServiceMinute(arrival),
    fromNow: formatMinutesFromNow(arrival, nowMinute),
  };
}

/** Expanded content: remaining stops for the bus on the road, all stops for one that hasn't left. */
export function stopDetails(
  d: Departure,
  route: Route | undefined,
  { onRoad, nowMinute, loading }: { onRoad: boolean; nowMinute: number; loading: boolean },
): StopDetails {
  if (!route) return { kind: loading ? 'loading' : 'unavailable' };
  const times = stopTimes(d, route).filter((s) => !onRoad || s.serviceMinute > nowMinute);
  return { kind: 'stops', stops: times.map((s) => ({ name: s.name, time: formatServiceMinute(s.serviceMinute) })) };
}

/** Row offsets for getItemLayout: fixed rows plus the NOW summary and at most one expanded row. */
export function rowLayout(
  index: number,
  { now, expanded, expandedLines }: { now: number; expanded: number; expandedLines: number },
) {
  const extra = (i: number) =>
    (i === now ? SUMMARY_HEIGHT : 0) + (i === expanded ? detailsHeight(expandedLines) : 0);
  const before = (i: number) =>
    (now !== -1 && now < i ? SUMMARY_HEIGHT : 0) +
    (expanded !== -1 && expanded < i ? detailsHeight(expandedLines) : 0);
  return { length: ROW_HEIGHT + extra(index), offset: ROW_HEIGHT * index + before(index), index };
}
