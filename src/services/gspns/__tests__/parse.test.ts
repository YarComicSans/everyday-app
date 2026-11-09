import { readFileSync } from "fs";
import { join } from "path";

import {
  parseDepartures,
  parseLineList,
  parseTimetableInfo,
  ParseError,
} from "../parse";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../__fixtures__", name), "utf8");

describe("parseTimetableInfo", () => {
  it("reads the valid-from date and today’s day type", () => {
    const info = parseTimetableInfo(fixture("gradski.html"));
    expect(info.validFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(["R", "S", "N", "P"]).toContain(info.todayType);
    expect(info.todayLabel).not.toBe("");
  });

  it("names what is missing on unexpected HTML", () => {
    expect(() =>
      parseTimetableInfo("<html><body>Maintenance</body></html>"),
    ).toThrow(new ParseError("no #vaziod select"));
  });
});

describe("parseLineList", () => {
  it.each(["R", "S", "N"])("reads the %s line list", (day) => {
    const lines = parseLineList(fixture(`l_rvg${day}.html`));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.value).not.toBe("");
      expect(line.number).not.toBe("");
      expect(line.name).not.toBe("");
    }
  });
});

describe("parseDepartures", () => {
  it("parses a two-direction line", () => {
    const [line4] = parseDepartures(fixture("p4.html"));
    expect(line4.lineNumber).toBe("4");
    expect(line4.directions.map((d) => d.direction)).toEqual(["A", "B"]);
    const [a, b] = line4.directions;
    expect(a.terminal).toBe(b.destination);
    expect(b.terminal).toBe(a.destination);
    expect(a.departures.length).toBeGreaterThan(0);
    expect(b.departures.length).toBeGreaterThan(0);
  });

  it("counts after-midnight departures into the same service day", () => {
    const all = parseDepartures(fixture("all_rvg_R.html"));
    const midnight = all
      .flatMap((l) => l.directions.flatMap((d) => d.departures))
      .filter((d) => d.hour === 0);
    expect(midnight.every((d) => d.serviceMinute >= 24 * 60)).toBe(true);
  });

  it("attaches legend meanings to variant codes", () => {
    const codes = parseDepartures(fixture("all_rvg_R.html")).flatMap((l) =>
      l.directions.flatMap((d) => d.departures.flatMap((x) => x.codes)),
    );
    expect(codes.every((c) => c.code !== "")).toBe(true);
    if (codes.length) expect(codes.some((c) => c.meaning)).toBe(true);
  });

  it.each(["R", "S", "N", "P"])(
    "parses the %s day type sample without errors",
    (day) => {
      const all = parseDepartures(fixture(`all_rvg_${day}.html`));
      expect(all.length).toBeGreaterThan(0);
      for (const line of all) {
        expect(line.directions.length).toBeGreaterThan(0);
        for (const dir of line.directions) {
          expect(dir.terminal).not.toBe("");
          for (const d of dir.departures) {
            expect(d.minute).toBeGreaterThanOrEqual(0);
            expect(d.minute).toBeLessThan(60);
            expect(d.hour).toBeLessThan(24);
          }
        }
      }
    },
  );
});
