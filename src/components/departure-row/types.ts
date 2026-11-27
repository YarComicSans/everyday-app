import type { Departure } from '@/services/gspns';

/** `now` is the bus on the road; `next` and `upcoming` haven't left yet. */
export type RowStatus = 'past' | 'now' | 'next' | 'upcoming';

/** Collapsed NOW row's estimate line. */
export type NowSummary = {
  /** First stop the bus hasn't reached; absent without stop data. */
  nextStop?: string;
  /** Arrival at the last stop, `HH:MM`. */
  arrival: string;
  /** `in 7 min` / `arriving`. */
  fromNow: string;
};

/** Content of an expanded row. */
export type StopDetails =
  | { kind: 'stops'; stops: { name: string; time: string }[] }
  | { kind: 'loading' }
  | { kind: 'unavailable' };

export type DepartureRowProps = {
  departure: Departure;
  index: number;
  status: RowStatus;
  /** Only for the NOW row. */
  summary?: NowSummary;
  /** Present when the row is expanded. */
  details?: StopDetails;
  /** Present when the row can be expanded. */
  onToggle?: (index: number) => void;
};
