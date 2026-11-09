import {
  formatMinutesFromNow,
  formatServiceMinute,
  nowDepartureIndex,
  stopTimes,
  tripMinutes,
} from "../estimate";
import { ParseError } from "../parse";
import {
  buildRoute,
  MAP_LINE_OVERRIDES,
  matchMapLine,
  parseMapLines,
  parseMapPath,
  parseMapStops,
  sameStop,
  type DirectionRef,
  type LatLon,
  type MapStop,
} from "../route";
import type { Departure, MapLine, Route } from "../types";

/*
 * Handwritten geometry: a straight 2 km east–west road. `at(x, y)` is x metres east and
 * y metres north of its west end. Traffic drives on the right, so for eastbound buses
 * stops sit south of the road (y < 0), for westbound ones north (y > 0).
 */
const LAT = 45.25;
const at = (x: number, y: number): LatLon => ({
  lat: LAT + y / 110_540,
  lon: 19.8 + x / (111_320 * Math.cos((LAT * Math.PI) / 180)),
});
const EASTWARD = [at(0, 0), at(1000, 0), at(2000, 0)];
const WESTWARD = [...EASTWARD].reverse();
const stop = (name: string, x: number, y: number): MapStop => ({
  name,
  ...at(x, y),
});
const SOUTH = -10;
const NORTH = 10;
const summary = (r: Route | undefined) =>
  r?.stops.map((s) => [s.name, s.offset]);

describe("map parsers", () => {
  it("reads city line buttons only", () => {
    const html = `
      <a id="7" class="button-linija grad ablin7" title="LIMAN 4 - CENTAR -  ÐURE JAKŠIĆA">4A</a>
      <a id="8" class="button-linija grad ablin8" title="X - Y"> 4B </a>
      <a id="90" class="button-linija prigrad" title="CENTAR - FUTOG">61A</a>
      <a id="x" class="button-linija grad" title="broken">5A</a>`;
    expect(parseMapLines(html)).toEqual([
      { id: 7, code: "4A", title: "LIMAN 4 - CENTAR - ĐURE JAKŠIĆA" },
      { id: 8, code: "4B", title: "X - Y" },
    ]);
    expect(() => parseMapLines("<html></html>")).toThrow(ParseError);
  });

  it("reads stops, skipping malformed entries", () => {
    const body = JSON.stringify([
      "[4A],[7B]|19.8276|45.2373|NARODNOG  FRONTA|foto.jpg|1",
      "[4A]|x|y|BAD",
      "[4A]|1|2|",
    ]);
    expect(parseMapStops(body)).toEqual([
      { name: "NARODNOG FRONTA", lat: 45.2373, lon: 19.8276 },
    ]);
  });

  it("reads polyline points, skipping blank ones", () => {
    const body = JSON.stringify([
      "45.27, 19.80",
      "\r\n45.28, 19.81",
      "",
      "nonsense",
    ]);
    expect(parseMapPath(body)).toEqual([
      { lat: 45.27, lon: 19.8 },
      { lat: 45.28, lon: 19.81 },
    ]);
  });

  it("rejects bodies that are not JSON arrays", () => {
    expect(() => parseMapStops("<html>error</html>")).toThrow(
      new ParseError("not JSON"),
    );
    expect(() => parseMapPath('{"a":1}')).toThrow(
      new ParseError("expected a JSON array"),
    );
  });
});

describe("buildRoute", () => {
  it("orders stops along a polyline stored in the direction of travel", () => {
    const r = buildRoute(EASTWARD, [
      stop("C", 1500, SOUTH),
      stop("A", 100, SOUTH),
      stop("B", 800, SOUTH),
    ]);
    expect(summary(r)).toEqual([
      ["A", 0],
      ["B", 700],
      ["C", 1400],
    ]);
  });

  it("flips a polyline stored against the direction of travel", () => {
    // Stored westward, but the stops are on the eastbound side: the bus drives east.
    const stops = [
      stop("A", 100, SOUTH),
      stop("B", 600, SOUTH),
      stop("C", 1100, SOUTH),
      stop("D", 1600, SOUTH),
    ];
    expect(summary(buildRoute(WESTWARD, stops))).toEqual([
      ["A", 0],
      ["B", 500],
      ["C", 1000],
      ["D", 1500],
    ]);
  });

  it("keeps a westward polyline whose stops are on the westbound side", () => {
    const stops = [
      stop("A", 100, NORTH),
      stop("B", 600, NORTH),
      stop("C", 1100, NORTH),
      stop("D", 1600, NORTH),
    ];
    expect(buildRoute(WESTWARD, stops)?.stops.map((s) => s.name)).toEqual([
      "D",
      "C",
      "B",
      "A",
    ]);
  });

  it("keeps the stored direction on a close call", () => {
    // Two wrong-side stops are not a clear enough majority to flip.
    const r = buildRoute(WESTWARD, [
      stop("A", 100, SOUTH),
      stop("B", 600, SOUTH),
    ]);
    expect(r?.stops.map((s) => s.name)).toEqual(["B", "A"]);
  });

  it("drops nearby duplicates but keeps a terminal revisited by a circular line", () => {
    const stops = [
      stop("T", 100, SOUTH),
      stop("T", 120, SOUTH),
      stop("M", 1000, SOUTH),
      stop("T", 1900, SOUTH),
    ];
    expect(summary(buildRoute(EASTWARD, stops))).toEqual([
      ["T", 0],
      ["M", 900],
      ["T", 1800],
    ]);
  });

  it("ignores stops far from the polyline", () => {
    const r = buildRoute(EASTWARD, [
      stop("A", 100, SOUTH),
      stop("FAR", 500, -300),
      stop("B", 900, SOUTH),
    ]);
    expect(r?.stops.map((s) => s.name)).toEqual(["A", "B"]);
  });

  it("gives up without a polyline or with fewer than two stops on it", () => {
    expect(
      buildRoute([], [stop("A", 100, SOUTH), stop("B", 900, SOUTH)]),
    ).toBeUndefined();
    expect(
      buildRoute(EASTWARD, [stop("A", 100, SOUTH), stop("FAR", 900, -300)]),
    ).toBeUndefined();
  });
});

describe("matchMapLine", () => {
  const mapLines: MapLine[] = [
    { id: 1, code: "4A", title: "LIMAN 4 - CENTAR - ŽELEZNIČKA STANICA" },
    { id: 2, code: "4B", title: "ŽELEZNIČKA STANICA - CENTAR - LIMAN 4" },
    { id: 3, code: "3AA", title: "ŽELEZNIČKA STANICA - POBEDA" },
    { id: 4, code: "3AB", title: "POBEDA - ŽELEZNIČKA STANICA" },
    { id: 5, code: "6A", title: "PODBARA - CENTAR - ADICE" },
    { id: 6, code: "6AA", title: "PODBARA - CENTAR - ADICE (VIA LIMAN)" },
    {
      id: 7,
      code: "7A",
      title: "NOVO NASELJE – ŽELEZNIČKA STANICA – LIMAN 4 – NOVO NASELJE",
    },
    { id: 8, code: "9A", title: "LIMAN 4 - PETROVARADIN" },
    { id: 9, code: "9B", title: "LIMAN 4 - SREMSKA KAMENICA" },
  ];
  const dir = (
    lineNumber: string,
    direction: "A" | "B",
    terminal: string,
    destination: string,
  ): DirectionRef => ({
    lineNumber,
    direction,
    terminal,
    destination,
  });
  const idOf = (d: DirectionRef) => matchMapLine(mapLines, d)?.id;

  it("matches a regular line by its abbreviated starting terminal", () => {
    expect(idOf(dir("4", "A", "LIMAN IV", "Z.STANICA (RUMEN.PUT)"))).toBe(1);
    expect(idOf(dir("4", "B", "Z.STANICA (RUMEN.PUT)", "LIMAN IV"))).toBe(2);
  });

  it("follows the terminal when the direction letters disagree", () => {
    expect(idOf(dir("3A", "B", "ZEL.STANICA", "POBEDA"))).toBe(3);
  });

  it("prefers the lettered codes of a line over a same-named other line", () => {
    expect(idOf(dir("6A", "A", "PODBARA", "ADICE"))).toBe(6); // 6A on the map is line 6
  });

  it("uses the bare code for circular lines", () => {
    expect(idOf(dir("7A", "A", "N.NASELJE", "N.NASELJE"))).toBe(7);
  });

  it("prefers the matching destination over the matching letter", () => {
    expect(idOf(dir("9", "A", "LIMAN IV", "S.KAMENICA"))).toBe(9);
  });

  it("leaves a direction unmatched when no map line starts at its terminal", () => {
    expect(idOf(dir("4", "A", "KLISA", "LIMAN IV"))).toBeUndefined();
    expect(idOf(dir("99", "A", "LIMAN IV", "CENTAR"))).toBeUndefined();
  });

  it("applies manual overrides", () => {
    MAP_LINE_OVERRIDES["4:A"] = 2;
    try {
      expect(idOf(dir("4", "A", "LIMAN IV", "Z.STANICA"))).toBe(2);
    } finally {
      delete MAP_LINE_OVERRIDES["4:A"];
    }
  });
});

describe("sameStop", () => {
  it("matches abbreviated terminal names", () => {
    expect(sameStop("Z.STANICA (RUMEN.PUT)", "ŽELEZNIČKA STANICA")).toBe(true);
    expect(sameStop("LIMAN IV", "LIMAN 4")).toBe(true);
    expect(
      sameStop(
        'PETROVARADIN (O.S."J.DUCIC")',
        "PETROVARADIN (OSNOVNA ŠKOLA JOVAN DUČIĆ)",
      ),
    ).toBe(true);
    expect(sameStop("LIMAN I", "KLISA")).toBe(false);
  });
});

describe("estimates", () => {
  const dep = (serviceMinute: number, lineNumber = "4"): Departure => ({
    lineNumber,
    direction: "A",
    terminal: "LIMAN IV",
    destination: "Z.STANICA",
    hour: Math.floor(serviceMinute / 60),
    minute: serviceMinute % 60,
    serviceMinute,
    lowFloor: false,
    codes: [],
  });
  const r: Route = {
    stops: [
      { name: "A", offset: 0 },
      { name: "B", offset: 1500 },
      { name: "C", offset: 6000 },
    ],
  };

  it("times stops at 18 km/h", () => {
    expect(tripMinutes(r)).toBe(20);
    expect(tripMinutes(undefined)).toBe(30);
    expect(
      stopTimes(dep(14 * 60 + 35), r).map((s) =>
        formatServiceMinute(s.serviceMinute),
      ),
    ).toEqual(["14:35", "14:40", "14:55"]);
  });

  it("picks the latest departure still on its route", () => {
    const deps = [dep(860), dep(875), dep(890)]; // 14:20, 14:35, 14:50
    const twenty = () => 20;
    expect(nowDepartureIndex(deps, 876, twenty)).toBe(1); // 14:36 → 14:35 is NOW
    expect(nowDepartureIndex(deps, 875, twenty)).toBe(0); // 14:35 departs now → it's NEXT, not NOW
    expect(nowDepartureIndex(deps, 920, twenty)).toBe(-1); // 15:20: 14:50 arrived at 15:10
  });

  it("skips a later bus that already finished a shorter route", () => {
    const deps = [dep(860, "4"), dep(870, "3A")];
    const duration = (d: Departure) => (d.lineNumber === "3A" ? 5 : 40);
    expect(nowDepartureIndex(deps, 880, duration)).toBe(0);
  });

  it("formats times", () => {
    expect(formatServiceMinute(25 * 60 + 5.4)).toBe("01:05");
    expect(formatMinutesFromNow(880.6, 880)).toBe("arriving");
    expect(formatMinutesFromNow(887.2, 880)).toBe("in 7 min");
  });
});
