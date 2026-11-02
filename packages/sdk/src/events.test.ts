import { describe, expect, expectTypeOf, it } from "vitest";
import { on, schedule } from "./index";

describe("on", () => {
  it("runs in the action's transaction by default", () => {
    const handler = () => {};
    expect(on("deal.moved", handler)).toEqual({
      kind: "event",
      event: "deal.moved",
      mode: "sync",
      handler,
    });
  });

  it("can run after the commit, through a queue", () => {
    expect(on("deal.moved", { mode: "queue" }, () => {}).mode).toBe("queue");
  });

  it("types the payload", () => {
    on<{ id: string }>("deal.moved", ({ payload }) => {
      expectTypeOf(payload).toEqualTypeOf<{ id: string }>();
    });
  });

  it.each(["moved", "Deal.moved", "deal.moved.now", "deal."])("refuses the name %s", (name) => {
    expect(() => on(name, () => {})).toThrow(/group\.past/);
  });
});

describe("schedule", () => {
  it("declares a task with a cron expression", () => {
    const handler = () => {};
    expect(schedule("0 2 * * *", handler)).toEqual({ kind: "job", cron: "0 2 * * *", handler });
  });

  it("keeps an explicit time zone", () => {
    const job = schedule("0 7 * * 1", { timezone: "Europe/Paris" }, () => {});
    expect(job.timezone).toBe("Europe/Paris");
  });

  it("gives the task the context of the tool, without an input", () => {
    schedule("0 2 * * *", (ctx) => {
      expectTypeOf(ctx.input).toEqualTypeOf<undefined>();
    });
  });

  it.each(["* * * *", "0 2 * * * *", "every day", ""])("refuses %j", (cron) => {
    expect(() => schedule(cron, () => {})).toThrow(/five fields/);
  });
});
