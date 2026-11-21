// @vitest-environment jsdom
// How `canvas.ts` chooses where the iso scenes play, and what it does when the worker fails:
// the worker and the in-page player are fakes, the engine never runs.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const flags = vi.hoisted(() => ({ simd: true, worker: true }));
const inline = vi.hoisted(() => ({ calls: [] as { el: HTMLCanvasElement; name: string }[] }));

vi.mock("@forgeron/blueprint/dom", async (original) => ({
  ...(await original<typeof import("@forgeron/blueprint/dom")>()),
  simdSupported: () => flags.simd,
  workerSupported: () => flags.worker,
}));

/** A player that records what it is told. */
const fakePlayer = (sets: [string, number][]) => ({
  set: (v: string, value: number) => sets.push([v, value]),
  release() {},
  emit() {},
  on: () => () => {},
  show() {},
  destroy() {},
});

const inlineSets: [string, number][] = [];
vi.mock("./inline", () => ({
  playInline: (el: HTMLCanvasElement, name: string) => {
    inline.calls.push({ el, name });
    return fakePlayer(inlineSets);
  },
}));

/** The workers the page started. */
const workers: FakeWorker[] = [];
class FakeWorker extends EventTarget {
  posted: { type: string }[] = [];
  terminated = false;
  constructor() {
    super();
    workers.push(this);
  }
  postMessage(m: { type: string }) {
    this.posted.push(m);
  }
  terminate() {
    this.terminated = true;
  }
}

const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
};

async function load() {
  document.body.innerHTML = `
    <div class="box"><canvas id="a" class="art" data-iso="web" data-scale="2" style="width: 10px"></canvas></div>
    <canvas id="b" data-iso="mcp"></canvas>`;
  const original = [...document.querySelectorAll("canvas")];
  const mod = await import("./canvas");
  return { mod, original };
}

beforeEach(() => {
  vi.resetModules();
  flags.simd = true;
  flags.worker = true;
  workers.length = 0;
  inline.calls.length = 0;
  inlineSets.length = 0;
  vi.stubGlobal("Worker", FakeWorker);
  // No IntersectionObserver: the engine starts at once.
  vi.stubGlobal("IntersectionObserver", undefined);
  Object.assign(HTMLCanvasElement.prototype, {
    transferControlToOffscreen: () => ({}),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("canvas.ts", () => {
  it("plays every iso canvas in one worker", async () => {
    const { original } = await load();
    await settle();
    expect(workers).toHaveLength(1);
    expect(workers[0]!.posted.filter((m) => m.type === "mount")).toHaveLength(2);
    expect([...document.querySelectorAll("canvas")]).toEqual(original);
    expect(inline.calls).toHaveLength(0);
  });

  it("without SIMD, starts nothing and leaves the canvases as the page drew them", async () => {
    flags.simd = false;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const transfer = vi.spyOn(HTMLCanvasElement.prototype, "transferControlToOffscreen");
    const { mod, original } = await load();
    await settle();
    expect(workers).toHaveLength(0);
    expect(inline.calls).toHaveLength(0);
    expect(transfer).not.toHaveBeenCalled();
    expect([...document.querySelectorAll("canvas")]).toEqual(original);
    // The handle still answers: the page's scripts run as before.
    const handle = mod.isoCanvas(original[0]!);
    expect(handle).not.toBeNull();
    handle!.select(2);
    handle!.set("progress", 0.5);
    expect(log).not.toHaveBeenCalled();
  });

  it("without workers, plays in the page", async () => {
    flags.worker = false;
    const { original } = await load();
    await settle();
    expect(workers).toHaveLength(0);
    expect(inline.calls.map((c) => c.el)).toEqual(original);
  });

  it("when the worker fails, reports once and plays fresh clones in the page", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { mod, original } = await load();
    const handle = mod.isoCanvas(original[0]!)!;
    handle.select(3);
    handle.set("progress", 0.25);
    await settle();
    const worker = workers[0]!;
    worker.dispatchEvent(new ErrorEvent("error", { message: "404", cancelable: true }));
    worker.dispatchEvent(new ErrorEvent("error", { message: "again", cancelable: true }));
    await settle();

    expect(worker.terminated).toBe(true);
    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0]![0])).toContain("404");
    const now = [...document.querySelectorAll("canvas")];
    expect(now).toHaveLength(2);
    for (const [i, el] of now.entries()) {
      const old = original[i]!;
      expect(el).not.toBe(old);
      expect(old.isConnected).toBe(false);
      expect([...el.attributes].map((a) => [a.name, a.value])).toEqual(
        [...old.attributes].map((a) => [a.name, a.value]),
      );
    }
    expect(now[0]!.parentElement?.className).toBe("box");
    expect(inline.calls.map((c) => [c.el, c.name])).toEqual([
      [now[0], "web"],
      [now[1], "mcp"],
    ]);
    // The new canvas has the same handle, and what the page told the scene is told again.
    expect(mod.isoCanvas(now[0]!)).toBe(handle);
    expect(inlineSets).toEqual([
      ["active", 3],
      ["progress", 0.25],
    ]);
    handle.set("progress", 0.75);
    expect(inlineSets.at(-1)).toEqual(["progress", 0.75]);
  });

  it("when the engine does not start in the worker, falls back the same way", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await load();
    await settle();
    workers[0]!.dispatchEvent(
      new MessageEvent("message", { data: { type: "error", id: -1, message: "CompileError" } }),
    );
    await settle();
    expect(log).toHaveBeenCalledTimes(1);
    expect(inline.calls).toHaveLength(2);
  });
});
