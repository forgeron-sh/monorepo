import { describe, expect, it } from "vitest";
import { matchesCron, parseCron, zoneFormatter } from "./cron";

const at = (expr: string, iso: string, zone = "UTC") =>
  matchesCron(parseCron(expr), new Date(iso), zoneFormatter(zone));

describe("parseCron", () => {
  it.each([
    "* * * * *",
    "0 2 * * *",
    "*/15 * * * *",
    "0 9-17 * * 1-5",
    "0,30 * * * *",
    "0 0 1 JAN *",
    "0 7 * * MON",
    "0 0 * * 7",
    "5/20 * * * *",
    "0 0 ? * *",
  ])("accepts %s", (expr) => {
    expect(() => parseCron(expr)).not.toThrow();
  });

  it.each([
    ["* * * *", /five fields/],
    ["* * * * * *", /five fields/],
    ["60 * * * *", /out of range \(0-59\)/],
    ["* 24 * * *", /out of range \(0-23\)/],
    ["* * 0 * *", /out of range \(1-31\)/],
    ["* * * 13 *", /out of range \(1-12\)/],
    ["* * * * 8", /out of range \(0-7\)/],
    ["*/0 * * * *", /positive integer/],
    ["10-5 * * * *", /runs backwards/],
    ["a * * * *", /out of range/],
    [", * * * *", /malformed/],
  ])("rejects %s", (expr, message) => {
    expect(() => parseCron(expr)).toThrow(message);
  });
});

describe("matchesCron", () => {
  // 2026-10-20 is a Tuesday.
  it("matches a fixed time", () => {
    expect(at("0 2 * * *", "2026-10-20T02:00:00Z")).toBe(true);
    expect(at("0 2 * * *", "2026-10-20T02:01:00Z")).toBe(false);
    expect(at("0 2 * * *", "2026-10-20T03:00:00Z")).toBe(false);
  });

  it("matches lists, ranges and steps", () => {
    expect(at("0,30 * * * *", "2026-10-20T08:30:00Z")).toBe(true);
    expect(at("0,30 * * * *", "2026-10-20T08:15:00Z")).toBe(false);
    expect(at("0 9-17 * * *", "2026-10-20T17:00:00Z")).toBe(true);
    expect(at("0 9-17 * * *", "2026-10-20T18:00:00Z")).toBe(false);
    expect(at("*/15 * * * *", "2026-10-20T08:45:00Z")).toBe(true);
    expect(at("*/15 * * * *", "2026-10-20T08:50:00Z")).toBe(false);
    expect(at("5/20 * * * *", "2026-10-20T08:45:00Z")).toBe(true);
  });

  it("matches names, and 0 and 7 are both Sunday", () => {
    expect(at("0 7 * * TUE", "2026-10-20T07:00:00Z")).toBe(true);
    expect(at("0 7 * * mon", "2026-10-20T07:00:00Z")).toBe(false);
    expect(at("0 0 * * 0", "2026-10-25T00:00:00Z")).toBe(true);
    expect(at("0 0 * * 7", "2026-10-25T00:00:00Z")).toBe(true);
    expect(at("0 0 1 OCT *", "2026-10-01T00:00:00Z")).toBe(true);
  });

  it("restricts to a weekday range", () => {
    expect(at("0 9 * * 1-5", "2026-10-20T09:00:00Z")).toBe(true);
    expect(at("0 9 * * 1-5", "2026-10-24T09:00:00Z")).toBe(false);
  });

  it("takes either the day of the month or of the week when both are restricted", () => {
    // The 20th, or a Monday: Tuesday the 20th matches by its date, Monday the 19th by its weekday.
    expect(at("0 0 20 * 1", "2026-10-20T00:00:00Z")).toBe(true);
    expect(at("0 0 20 * 1", "2026-10-19T00:00:00Z")).toBe(true);
    expect(at("0 0 20 * 1", "2026-10-21T00:00:00Z")).toBe(false);
  });

  it("reads the time in the zone of the task", () => {
    // Paris is UTC+2 in October (CEST): 02:00 there is 00:00 UTC.
    expect(at("0 2 * * *", "2026-10-20T00:00:00Z", "Europe/Paris")).toBe(true);
    expect(at("0 2 * * *", "2026-10-20T02:00:00Z", "Europe/Paris")).toBe(false);
    // And UTC+1 in winter.
    expect(at("0 2 * * *", "2026-12-15T01:00:00Z", "Europe/Paris")).toBe(true);
  });

  it("reads the day in the zone too: it can differ from UTC's", () => {
    // 22:30 UTC on Monday the 19th is already Tuesday 07:30 in Tokyo.
    expect(at("30 7 * * 2", "2026-10-19T22:30:00Z", "Asia/Tokyo")).toBe(true);
    expect(at("30 7 * * 2", "2026-10-19T22:30:00Z", "UTC")).toBe(false);
  });

  it("refuses a time zone that does not exist", () => {
    expect(() => zoneFormatter("Mars/Olympus")).toThrow(RangeError);
  });
});
