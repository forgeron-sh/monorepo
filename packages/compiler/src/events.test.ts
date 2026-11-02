import { createTestTool } from "@forgeron/sdk/testing";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { buildTool, type BuildResult } from "./index";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

describe("events and scheduled tasks, built", () => {
  let built: BuildResult;
  beforeAll(async () => {
    built = await buildTool(fixture("events-tool"));
  }, 60_000);

  it("writes the handlers and the task to the manifest", async () => {
    const manifest = JSON.parse(await readFile(join(built.outDir, "manifest.json"), "utf8"));
    // `events/_types.ts` is not a handler.
    expect(manifest.events).toEqual({
      audit: { event: "order.placed", mode: "sync" },
      mail: { event: "order.placed", mode: "queue" },
    });
    expect(manifest.jobs).toEqual({ nightly: { cron: "0 2 * * *", timezone: "Europe/Paris" } });
  });

  it("runs the handlers of an action, the sync one first and the queued one after", async () => {
    const tool = await createTestTool({ dir: built.dir });
    expect(await tool.call("orders.place", { id: 5 })).toEqual({ placed: 5 });
    expect(tool.events.map((e) => e.event)).toEqual(["order.placed", "audit.logged", "mail.sent"]);
    expect(tool.events[1]).toEqual({ event: "audit.logged", payload: { id: 5 } });
  });

  it("runs the task as the tool, at the hour of its own time zone", async () => {
    const tool = await createTestTool({ dir: built.dir });
    // 02:00 in Paris (CEST) is 00:00 UTC.
    expect(await tool.scheduled(new Date("2026-10-20T00:00:00Z"))).toEqual(["nightly"]);
    expect(tool.events).toEqual([{ event: "report.ready", payload: { by: "tool:shop" } }]);
    expect(await tool.scheduled(new Date("2026-10-20T02:00:00Z"))).toEqual([]);
  });

  it("builds a Worker that answers the cron trigger", async () => {
    const worker = (await import(pathToFileURL(join(built.outDir, "worker.js")).href)) as {
      default: { scheduled: unknown; fetch: unknown };
    };
    expect(typeof worker.default.scheduled).toBe("function");
    expect(typeof worker.default.fetch).toBe("function");
  });

  it("refuses a queue handler when the tool declared no queue", async () => {
    await expect(buildTool(fixture("rules/queue-without-resource"))).rejects.toThrow(
      /events\/mail: the handler of "order\.placed" runs in mode "queue", which needs resources\.queue/,
    );
  }, 60_000);
});
