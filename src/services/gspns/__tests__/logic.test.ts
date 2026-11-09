import { decodeSelection, encodeSelection } from "../picker-lines";
import { getServiceDay, resolveDayType } from "../service-day";

describe("selection param", () => {
  it("round-trips opaque values", () => {
    const sel = [
      { value: "4*", lineNumber: "4", direction: "B" as const },
      { value: "3A.", lineNumber: "3A", direction: "A" as const },
    ];
    expect(encodeSelection(sel)).toBe("4*:B:4,3A.:A:3A");
    expect(decodeSelection(encodeSelection(sel))).toEqual(sel);
    expect(decodeSelection(undefined)).toEqual([]);
  });
});

describe("service day", () => {
  it("treats 00:00–02:59 as the previous day", () => {
    const sat0130 = new Date(2026, 10, 7, 1, 30); // Saturday 7 Nov 2026, 01:30
    expect(getServiceDay(sat0130)).toEqual({
      date: "2026-11-06",
      afterMidnight: true,
      minute: 25 * 60 + 30,
    });
    // Friday night service → workday, whatever GSP says about Saturday
    expect(resolveDayType("S", sat0130)).toBe("R");
  });

  it("uses GSP’s day type during the day (catches holidays)", () => {
    expect(resolveDayType("P", new Date(2026, 10, 11, 9, 0))).toBe("P");
  });

  it("derives Sunday for Sunday-night service on Monday 01:00", () => {
    expect(resolveDayType("R", new Date(2026, 10, 9, 1, 0))).toBe("N");
  });
});
