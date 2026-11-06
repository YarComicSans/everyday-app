/** GSP day type: R workday, S Saturday, N Sunday, P holiday. */
export type DayType = 'R' | 'S' | 'N' | 'P';

/** GSP direction column. Neither letter consistently means "towards the centre". */
export type Direction = 'A' | 'B';

/** The `gradski` landing page: which timetable is valid and what runs today. */
export type TimetableInfo = {
  /** `vaziod` value, e.g. `2026-10-01`. */
  validFrom: string;
  /** Day type GSP says applies to today's calendar date. */
  todayType: DayType;
  /** Raw label from the page, e.g. `RADNI DAN`. */
  todayLabel: string;
};

/** One entry of the `lista-linija` select. */
export type LineInfo = {
  /** Opaque option value (`4*`, `3A.`, `5`); must be sent back exactly. */
  value: string;
  /** Public line number, e.g. `4`, `3A`. */
  number: string;
  /** Route name as GSP writes it, e.g. `LIMAN IV - CENTAR - Z.STANICA (RUMEN.PUT)`. */
  name: string;
};

export type LineSelection = {
  /** GSP option value, sent back as-is. */
  value: string;
  /** Public number, kept to label lines that don't run on the requested day. */
  lineNumber: string;
  direction: Direction;
};

export type DepartureCode = {
  code: string;
  /** Meaning from the line's footer legend, when GSP gives one. */
  meaning?: string;
  /** School-day ("đački") variant. */
  school: boolean;
};

export type Departure = {
  lineNumber: string;
  direction: Direction;
  /** Starting terminal the time refers to. */
  terminal: string;
  destination: string;
  hour: number;
  minute: number;
  /** Minutes since 00:00 of the service day; 00–02h count as 24–26h. */
  serviceMinute: number;
  lowFloor: boolean;
  codes: DepartureCode[];
};

export type LineDirections = {
  lineNumber: string;
  lineName: string;
  directions: {
    direction: Direction;
    terminal: string;
    destination: string;
    departures: Departure[];
  }[];
};
