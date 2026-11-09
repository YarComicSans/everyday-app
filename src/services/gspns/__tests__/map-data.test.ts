/*
 * Checks that the downloaded network-map snapshots (see scripts/fetch-gspns-fixtures.mjs)
 * still parse into usable routes. Asserts no line-specific values, so refreshing the
 * snapshots needs no changes here; route-building logic is covered in route.test.ts.
 */
import { readFileSync } from "fs";
import { join } from "path";

import { parseDepartures } from "../parse";
import {
  buildRoute,
  matchMapLine,
  parseMapLines,
  parseMapPath,
  parseMapStops,
} from "../route";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../__fixtures__", name), "utf8");
/** Map lines the fetch script managed to download (the site fails to serve a few). */
const ids: number[] = JSON.parse(fixture("mreza/ids.json"));

describe("downloaded network map", () => {
  const mapLines = parseMapLines(fixture("mreza.html"));

  it("lists city lines", () => {
    expect(mapLines.length).toBeGreaterThan(0);
    for (const l of mapLines) {
      expect(l.code).not.toBe("");
      expect(l.title).not.toBe("");
    }
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => mapLines.some((l) => l.id === id))).toBe(true);
  });

  it.each(ids)("builds a usable route for map line %i", (id) => {
    const stops = parseMapStops(fixture(`mreza/stops-${id}.json`));
    const path = parseMapPath(fixture(`mreza/path-${id}.json`));
    expect(stops.length).toBeGreaterThan(1);
    expect(path.length).toBeGreaterThan(1);

    const route = buildRoute(path, stops);
    expect(route).toBeDefined();
    expect(route!.stops.length).toBeGreaterThan(1);
    expect(route!.stops[0].offset).toBe(0);
    expect(
      route!.stops.every(
        (s, i) => i === 0 || s.offset > route!.stops[i - 1].offset,
      ),
    ).toBe(true);
  });

  it("links most timetable directions to a map line", () => {
    // Some directions legitimately have no map line (variant-only runs), so this only
    // guards against matching breaking wholesale, e.g. after a change to map titles.
    const directions = ["R", "S", "N", "P"].flatMap((day) =>
      parseDepartures(fixture(`all_rvg_${day}.html`)).flatMap((l) =>
        l.directions.map((d) => ({ lineNumber: l.lineNumber, ...d })),
      ),
    );
    const matched = directions.filter((d) => matchMapLine(mapLines, d));
    expect(matched.length).toBeGreaterThan(directions.length / 2);
  });
});
