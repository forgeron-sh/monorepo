import { describe, expect, it } from "vitest";
import { formatBytes, formatDuration, formatWhen } from "./format";

describe("formatBytes", () => {
  it("counts in powers of 1000 by default", () => {
    expect(formatBytes(840)).toBe("840 B");
    expect(formatBytes(12_400)).toBe("12 KB");
    expect(formatBytes(3_100_000)).toBe("3.1 MB");
    expect(formatBytes(5_000_000)).toBe("5 MB");
    expect(formatBytes(2_000_000_000_000)).toBe("2 TB");
  });
  it("counts in powers of 1024 on request", () => {
    expect(formatBytes(12, { base: 1024 })).toBe("12 B");
    expect(formatBytes(1536, { base: 1024 })).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024, { base: 1024 })).toBe("5 MB");
  });
  it("writes a dash when the size is unknown", () => {
    expect(formatBytes(undefined)).toBe("—");
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});

describe("formatWhen", () => {
  it("tells the time today, the day otherwise", () => {
    expect(formatWhen("2026-11-18 09:42", "2026-11-18")).toBe("09:42");
    expect(formatWhen("2026-11-12 09:42", "2026-11-18")).toBe("Nov 12");
    expect(formatWhen("2025-03-02", "2026-11-18")).toBe("Mar 2, 2025");
    expect(formatWhen(undefined)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("writes milliseconds, seconds and minutes", () => {
    expect(formatDuration(120)).toBe("120 ms");
    expect(formatDuration(1400)).toBe("1.4 s");
    expect(formatDuration(30_000)).toBe("30 s");
    expect(formatDuration(125_000)).toBe("2 min 05 s");
  });
  it("rounds to whole minutes when compact", () => {
    expect(formatDuration(125_000, { compact: true })).toBe("2 min");
    expect(formatDuration(1400, { compact: true })).toBe("1.4 s");
  });
  it("writes a dash when unknown", () => {
    expect(formatDuration(undefined)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
  });
});
