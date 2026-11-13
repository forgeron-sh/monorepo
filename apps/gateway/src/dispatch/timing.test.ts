import { describe, expect, it } from "vitest";
import { createTimings, timed } from "./timing";

const clock = (...ticks: number[]) => {
  const queue = [...ticks];
  return () => queue.shift() ?? 0;
};

describe("createTimings", () => {
  it("adds up what each step took, and the total", async () => {
    // started, then each step: start and end, then the total.
    const timings = createTimings(clock(0, 10, 25, 30, 130, 200));
    await timings.time("find", async () => "a");
    await timings.time("tool", async () => "b");
    expect(timings.header()).toBe("find;dur=15.0, tool;dur=100.0, total;dur=200.0");
  });

  it("counts a step that runs again, and adds its times", async () => {
    const timings = createTimings(clock(0, 0, 10, 10, 30, 100));
    await timings.time("db", async () => 1);
    await timings.time("db", async () => 2);
    expect(timings.header()).toBe('db;dur=30.0;desc="2 times", total;dur=100.0');
  });

  it("counts a step that fails, and lets it fail", async () => {
    const timings = createTimings(clock(0, 5, 20, 50));
    await expect(
      timings.time("access", async () => {
        throw new Error("nope");
      }),
    ).rejects.toThrow("nope");
    expect(timings.header()).toBe("access;dur=15.0, total;dur=50.0");
  });

  it("is the step itself when nobody measures", async () => {
    expect(await timed(undefined, "x", async () => 7)).toBe(7);
  });
});
