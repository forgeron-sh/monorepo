import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  createRuntime,
  type EventContext,
  type QueuedDelivery,
  type RuntimeAction,
  type RuntimeEvent,
  type RuntimeJob,
  type User,
} from "./index";

type LogFn = (message: string, data?: unknown) => void;

const manifest = (events: Manifest["events"], jobs: Manifest["jobs"] = {}): Manifest => ({
  name: "shop",
  version: "1.0.0",
  interfaces: { mcp: true, api: true, cli: true, web: false },
  roles: { staff: { grants: ["write"] } },
  actions: {
    "orders.place": {
      description: "Places an order.",
      access: "write",
      input: { type: "object" },
      confirm: false,
      cli: { args: [] },
      http: { method: "POST" },
      interfaces: ["mcp", "api", "cli"],
    },
  },
  views: {},
  jobs,
  events,
  resources: {},
  uses: {},
  preview: { data: "seed" },
});

const staff: User = { id: "u1", email: "a@shop.fr", name: "Ana", roles: ["staff"] };

function setup(options: {
  events?: Record<string, RuntimeEvent>;
  handlers?: Manifest["events"];
  run?: RuntimeAction["run"];
  jobs?: Record<string, RuntimeJob>;
  jobTable?: Manifest["jobs"];
  timeZone?: string;
  enqueue?: (delivery: QueuedDelivery) => void;
  platform?: Record<string, unknown>;
}) {
  const log = { info: vi.fn<LogFn>(), warn: vi.fn<LogFn>(), error: vi.fn<LogFn>() };
  const emitted: Array<[string, unknown]> = [];
  const runtime = createRuntime({
    manifest: manifest(options.handlers ?? {}, options.jobTable),
    actions: {
      "orders.place": {
        input: z.object({ id: z.number().default(1) }),
        run:
          options.run ??
          ((ctx) => ctx.emit("order.placed", { id: (ctx.input as { id: number }).id })),
      },
    },
    events: options.events ?? {},
    jobs: options.jobs ?? {},
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    authenticate: () => staff,
    platform: {
      log,
      emit: (event, payload) => void emitted.push([event, payload]),
      ...(options.enqueue ? { enqueue: options.enqueue } : {}),
      ...options.platform,
    },
  });
  return { runtime, log, emitted };
}

const place = (runtime: ReturnType<typeof setup>["runtime"], input: unknown = { id: 7 }) =>
  runtime.invoke(staff, "orders.place", input);

const sync = (event: string, handler: RuntimeEvent["handler"]): RuntimeEvent => ({
  event,
  mode: "sync",
  handler,
});
const queue = (event: string, handler: RuntimeEvent["handler"]): RuntimeEvent => ({
  event,
  mode: "queue",
  handler,
});

describe("sync events", () => {
  it("run inside the action, before it returns, with the payload and the caller", async () => {
    const seen: EventContext[] = [];
    const order: string[] = [];
    const { runtime } = setup({
      handlers: { audit: { event: "order.placed", mode: "sync" } },
      events: {
        audit: sync("order.placed", (ctx) => void (seen.push(ctx), order.push("handler"))),
      },
      run: async (ctx) => {
        await ctx.emit("order.placed", { id: 7 });
        order.push("after emit");
        return { ok: true };
      },
    });
    expect(await place(runtime)).toEqual({ ok: true, result: { ok: true } });
    expect(order).toEqual(["handler", "after emit"]);
    expect(seen[0]).toMatchObject({ payload: { id: 7 }, user: staff, env: "local" });
  });

  it("run in order, and only for their event", async () => {
    const calls: string[] = [];
    const { runtime } = setup({
      handlers: {
        first: { event: "order.placed", mode: "sync" },
        second: { event: "order.placed", mode: "sync" },
        other: { event: "order.shipped", mode: "sync" },
      },
      events: {
        first: sync("order.placed", () => void calls.push("first")),
        second: sync("order.placed", () => void calls.push("second")),
        other: sync("order.shipped", () => void calls.push("other")),
      },
    });
    await place(runtime);
    expect(calls).toEqual(["first", "second"]);
  });

  it("cancel the action when they fail: what comes after the emit never runs", async () => {
    const after = vi.fn<() => void>();
    const { runtime, log } = setup({
      handlers: { audit: { event: "order.placed", mode: "sync" } },
      events: {
        audit: sync("order.placed", () => {
          throw new Error("disk full");
        }),
      },
      run: async (ctx) => {
        await ctx.emit("order.placed", {});
        after();
      },
    });
    expect(await place(runtime)).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: "Internal error." },
    });
    expect(after).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalled();
  });

  it("let a ToolError of the handler reach the caller with its code", async () => {
    class ToolError extends Error {
      override name = "ToolError";
      code = "CONFLICT";
    }
    const { runtime } = setup({
      handlers: { guard: { event: "order.placed", mode: "sync" } },
      events: {
        guard: sync("order.placed", () => {
          throw new ToolError("Already placed");
        }),
      },
    });
    expect(await place(runtime)).toMatchObject({
      ok: false,
      error: { code: "CONFLICT", message: "Already placed" },
    });
  });

  it("stop a handler that emits what leads back to itself", async () => {
    const { runtime } = setup({
      handlers: { loop: { event: "order.placed", mode: "sync" } },
      events: { loop: sync("order.placed", (ctx) => ctx.emit("order.placed", {})) },
    });
    expect(await place(runtime)).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
  });

  it("are seen by the platform, and an event nobody handles is fine", async () => {
    const { runtime, emitted } = setup({});
    expect(await place(runtime, { id: 3 })).toMatchObject({ ok: true });
    expect(emitted).toEqual([["order.placed", { id: 3 }]]);
  });
});

describe("queue events", () => {
  const handlers = { mail: { event: "order.placed", mode: "queue" as const } };

  it("run after the action succeeded, not during it", async () => {
    const order: string[] = [];
    const { runtime } = setup({
      handlers,
      events: { mail: queue("order.placed", () => void order.push("mail")) },
      run: async (ctx) => {
        await ctx.emit("order.placed", {});
        order.push("action done");
      },
    });
    await place(runtime);
    expect(order).toEqual(["action done", "mail"]);
  });

  it("do not run when the action fails afterwards", async () => {
    const mail = vi.fn<() => void>();
    const { runtime } = setup({
      handlers,
      events: { mail: queue("order.placed", mail) },
      run: async (ctx) => {
        await ctx.emit("order.placed", {});
        throw new Error("payment refused");
      },
    });
    expect(await place(runtime)).toMatchObject({ ok: false });
    expect(mail).not.toHaveBeenCalled();
  });

  it("are retried three times after the first failure, then given up without failing the action", async () => {
    const mail = vi.fn<() => void>(() => {
      throw new Error("smtp down");
    });
    const { runtime, log } = setup({ handlers, events: { mail: queue("order.placed", mail) } });
    expect(await place(runtime)).toMatchObject({ ok: true });
    expect(mail).toHaveBeenCalledTimes(4);
    expect(log.warn).toHaveBeenCalledTimes(3);
    expect(log.error).toHaveBeenCalledTimes(1);
  });

  it("stop being retried as soon as one attempt succeeds", async () => {
    let calls = 0;
    const mail = vi.fn<() => void>(() => {
      if (++calls < 3) throw new Error("flaky");
    });
    const { runtime, log } = setup({ handlers, events: { mail: queue("order.placed", mail) } });
    await place(runtime);
    expect(mail).toHaveBeenCalledTimes(3);
    expect(log.error).not.toHaveBeenCalled();
  });

  it("go to the platform's queue when it has one, which hands them back to deliver()", async () => {
    const sent: QueuedDelivery[] = [];
    const mail = vi.fn<() => void>();
    const { runtime } = setup({
      handlers,
      events: { mail: queue("order.placed", mail) },
      enqueue: (delivery) => void sent.push(delivery),
    });
    await place(runtime, { id: 9 });
    expect(mail).not.toHaveBeenCalled();
    expect(sent).toEqual([
      { handler: "mail", event: "order.placed", payload: { id: 9 }, user: staff },
    ]);

    await runtime.deliver(sent[0]!);
    expect(mail).toHaveBeenCalledTimes(1);
  });

  it("deliver() throws when the handler fails, for the queue to retry", async () => {
    const { runtime } = setup({
      handlers,
      events: {
        mail: queue("order.placed", () => {
          throw new Error("smtp down");
        }),
      },
    });
    const delivery: QueuedDelivery = {
      handler: "mail",
      event: "order.placed",
      payload: {},
      user: staff,
    };
    await expect(runtime.deliver(delivery)).rejects.toThrow("smtp down");
    await expect(runtime.deliver({ ...delivery, handler: "nope" })).rejects.toThrow(
      /Unknown event handler/,
    );
  });

  it("can be started by a sync handler, and still wait for the action to succeed", async () => {
    const order: string[] = [];
    const { runtime } = setup({
      handlers: {
        audit: { event: "order.placed", mode: "sync" },
        mail: { event: "order.audited", mode: "queue" },
      },
      events: {
        audit: sync("order.placed", (ctx) => ctx.emit("order.audited", {})),
        mail: queue("order.audited", () => void order.push("mail")),
      },
      run: async (ctx) => {
        await ctx.emit("order.placed", {});
        order.push("action done");
      },
    });
    await place(runtime);
    expect(order).toEqual(["action done", "mail"]);
  });
});

describe("scheduled tasks", () => {
  const tasks = {
    nightly: { cron: "0 2 * * *", timezone: "Europe/Paris" },
    hourly: { cron: "0 * * * *" },
  };

  it("run as the tool: no person, no access level, no per-person secret", async () => {
    let seen: Record<string, unknown> = {};
    const { runtime } = setup({
      jobTable: { nightly: tasks.nightly },
      jobs: {
        nightly: {
          handler: (ctx) => {
            seen = {
              user: ctx.user,
              interface: ctx.interface,
              input: ctx.input,
              userSecrets: ctx.userSecrets,
              can: ctx.can("write"),
            };
          },
        },
      },
      platform: { userSecrets: { API_KEY: "a person's key" } },
    });
    await runtime.runJob("nightly");
    expect(seen).toEqual({
      user: { id: "tool:shop", email: "", name: "tool:shop", roles: [] },
      interface: "job",
      input: undefined,
      userSecrets: {},
      can: false,
    });
  });

  it("can emit events, like an action", async () => {
    const mail = vi.fn<() => void>();
    const { runtime } = setup({
      handlers: { mail: { event: "report.ready", mode: "queue" } },
      events: { mail: queue("report.ready", mail) },
      jobTable: { nightly: tasks.nightly },
      jobs: { nightly: { handler: (ctx) => ctx.emit("report.ready", {}) } },
    });
    await runtime.runJob("nightly");
    expect(mail).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown task", async () => {
    const { runtime } = setup({});
    await expect(runtime.runJob("nope")).rejects.toThrow(/Unknown scheduled task/);
  });

  describe("scheduled()", () => {
    const ran: string[] = [];
    const build = (timeZone?: string) => {
      ran.length = 0;
      return setup({
        jobTable: tasks,
        jobs: {
          nightly: { handler: () => void ran.push("nightly") },
          hourly: { handler: () => void ran.push("hourly") },
        },
        ...(timeZone ? { timeZone } : {}),
      });
    };

    it("runs the tasks due in their own time zone", async () => {
      const { runtime } = build();
      // 00:00 UTC is 02:00 in Paris (CEST): `nightly` is due, and `hourly` (UTC) too.
      expect(await runtime.scheduled(new Date("2026-10-20T00:00:00Z"))).toEqual([
        "nightly",
        "hourly",
      ]);
      expect(ran).toEqual(["nightly", "hourly"]);
    });

    it("runs none when nothing is due", async () => {
      const { runtime } = build();
      expect(await runtime.scheduled(new Date("2026-10-20T00:30:00Z"))).toEqual([]);
      expect(ran).toEqual([]);
    });

    it("gives a task with no zone the workspace's", async () => {
      // 14:00 UTC is 23:00 in Tokyo: `hourly` is due either way, so use a daily one.
      const { runtime } = setup({
        jobTable: { morning: { cron: "0 9 * * *" } },
        jobs: { morning: { handler: () => void ran.push("morning") } },
        timeZone: "Asia/Tokyo",
      });
      ran.length = 0;
      expect(await runtime.scheduled(new Date("2026-10-20T00:00:00Z"))).toEqual(["morning"]);
      expect(await runtime.scheduled(new Date("2026-10-20T09:00:00Z"))).toEqual([]);
    });

    it("does not stop the others when one fails, and logs it", async () => {
      const order: string[] = [];
      const { runtime, log } = setup({
        jobTable: { first: { cron: "* * * * *" }, second: { cron: "* * * * *" } },
        jobs: {
          first: {
            handler: () => {
              throw new Error("boom");
            },
          },
          second: { handler: () => void order.push("second") },
        },
      });
      expect(await runtime.scheduled(new Date("2026-10-20T00:00:00Z"))).toEqual([
        "first",
        "second",
      ]);
      expect(order).toEqual(["second"]);
      expect(log.error).toHaveBeenCalledWith('The task "first" failed.', expect.any(Error));
    });
  });
});

describe("startup", () => {
  it("fails when the manifest declares a handler or a task with no code", () => {
    expect(() => setup({ handlers: { audit: { event: "order.placed", mode: "sync" } } })).toThrow(
      /event handler "audit" but no code/,
    );
    expect(() => setup({ jobTable: { nightly: { cron: "0 2 * * *" } } })).toThrow(
      /task "nightly" but no code/,
    );
  });

  it("fails on a cron expression or a time zone that does not exist", () => {
    const job = { handler: () => {} };
    expect(() => setup({ jobTable: { bad: { cron: "99 * * * *" } }, jobs: { bad: job } })).toThrow(
      /out of range/,
    );
    expect(() =>
      setup({
        jobTable: { bad: { cron: "* * * * *", timezone: "Mars/Olympus" } },
        jobs: { bad: job },
      }),
    ).toThrow(RangeError);
  });
});
