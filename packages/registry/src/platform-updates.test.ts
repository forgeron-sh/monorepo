import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, RegistryError, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
let clock = new Date("2026-11-13T10:00:00Z");
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  clock = new Date("2026-11-13T10:00:00Z");
  registry = createRegistry(d1, { now: () => clock });
});
afterEach(() => memory.close());

const start = () =>
  registry.startUpdateRun({ fromVersion: "0.5.0", toVersion: "0.6.0", actor: "p1" });

describe("platform updates (D-138)", () => {
  it("starts a run with every step pending, and finds it running", async () => {
    const run = await start();
    expect(run).toMatchObject({ fromVersion: "0.5.0", toVersion: "0.6.0", state: "running" });
    expect(run.steps.map((s) => [s.name, s.state])).toEqual([
      ["download", "pending"],
      ["restore-point", "pending"],
      ["migrate", "pending"],
      ["code", "pending"],
      ["deploy", "pending"],
    ]);
    expect(await registry.findRunningUpdate()).toEqual(run);
    expect(await registry.getUpdateRun(run.id)).toEqual(run);
    expect(await registry.getUpdateRun("nope")).toBeUndefined();
  });

  it("runs one update at a time, and again once the first has ended", async () => {
    const first = await start();
    await expect(start()).rejects.toMatchObject({ code: "ALREADY_EXISTS" });
    await expect(start()).rejects.toBeInstanceOf(RegistryError);
    await registry.finishUpdateRun(first.id, { result: "succeeded", steps: first.steps });
    expect(await registry.findRunningUpdate()).toBeUndefined();
    const second = await start();
    expect(second.id).not.toBe(first.id);
  });

  it("records the steps and the restore point as the run goes", async () => {
    const run = await start();
    const steps = run.steps.map((s, i) =>
      i === 0 ? { ...s, state: "done" as const, message: "Downloaded 1 MB" } : s,
    );
    await registry.saveUpdateSteps(run.id, steps, "00000085-0000f3a5");
    const saved = await registry.getUpdateRun(run.id);
    expect(saved?.steps[0]).toEqual({
      name: "download",
      state: "done",
      message: "Downloaded 1 MB",
    });
    expect(saved?.bookmark).toBe("00000085-0000f3a5");
    // Steps saved later keep the bookmark.
    await registry.saveUpdateSteps(run.id, steps);
    expect((await registry.getUpdateRun(run.id))?.bookmark).toBe("00000085-0000f3a5");
  });

  it("ends a run with its audit line: from, to, the restore point and the result", async () => {
    const run = await start();
    await registry.saveUpdateSteps(run.id, run.steps, "bm-1");
    clock = new Date("2026-11-13T10:01:00Z");
    const ended = await registry.finishUpdateRun(run.id, {
      result: "failed",
      steps: run.steps,
      error: "Cloudflare refused",
    });
    expect(ended).toMatchObject({
      state: "failed",
      error: "Cloudflare refused",
      finishedAt: "2026-11-13T10:01:00.000Z",
    });
    const { results } = await d1
      .prepare(`SELECT * FROM "audit_log" WHERE "subject" = 'platform:update'`)
      .all();
    expect(results).toHaveLength(1);
    expect((results ?? [])[0]).toMatchObject({
      actor: "p1",
      kind: "access",
      result: "error",
      tool_id: null,
    });
    expect(JSON.parse(String(((results ?? [])[0] as { detail: string }).detail))).toEqual({
      run: run.id,
      from: "0.5.0",
      to: "0.6.0",
      bookmark: "bm-1",
      result: "failed",
      error: "Cloudflare refused",
    });
  });

  it("does not change a run that has ended", async () => {
    const run = await start();
    await registry.finishUpdateRun(run.id, { result: "succeeded", steps: run.steps });
    await registry.saveUpdateSteps(run.id, [], "late");
    const after = await registry.getUpdateRun(run.id);
    expect(after?.steps).toHaveLength(5);
    expect(after?.bookmark).toBeUndefined();
  });

  it("ends the runs a stopped gateway left behind, and only those", async () => {
    const old = await start();
    await registry.saveUpdateSteps(
      old.id,
      old.steps.map((s, i) => (i === 2 ? { ...s, state: "running" as const } : s)),
      "bm-old",
    );
    clock = new Date("2026-11-13T10:30:00Z");
    expect(await registry.interruptStaleUpdates("2026-11-13T10:15:00.000Z")).toBe(1);
    const ended = await registry.getUpdateRun(old.id);
    expect(ended).toMatchObject({ state: "failed", bookmark: "bm-old" });
    expect(ended?.steps[2]).toMatchObject({ state: "failed" });
    expect(ended?.error).toMatch(/interrupted/);
    const fresh = await start();
    expect(await registry.interruptStaleUpdates("2026-11-13T10:15:00.000Z")).toBe(0);
    expect((await registry.findRunningUpdate())?.id).toBe(fresh.id);
  });

  it("lists the latest runs, newest first", async () => {
    const a = await start();
    await registry.finishUpdateRun(a.id, { result: "succeeded", steps: a.steps });
    clock = new Date("2026-11-14T10:00:00Z");
    const b = await start();
    expect((await registry.listUpdateRuns()).map((r) => r.id)).toEqual([b.id, a.id]);
    expect(await registry.listUpdateRuns(1)).toHaveLength(1);
  });
});
