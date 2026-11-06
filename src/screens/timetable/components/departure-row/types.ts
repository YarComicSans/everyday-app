import type { Departure } from '@/services/gspns';

export type DepartureRowProps = {
  departure: Departure;
  past: boolean;
  next: boolean;
};
