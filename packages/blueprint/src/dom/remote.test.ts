// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { box, pixelate } from "../index";
import { compileBlueprint } from "../format/compile";
import { readBlueprint } from "../format/read";
import type { BlueprintFile } from "../format/types";
import { playCompiled } from "./play-compiled";
import { connectWorker, playInWorker } from "./remote";
import { type SceneResolver, serveBlueprint, type WorkerScope } from "./serve";

// A path by hand: under jsdom the global `URL` is jsdom's (runtime.ts says why).
const here = decodeURIComponent(import.meta.url.slice("file://".length));
const WASM = readFileSync(
  `${here.slice(0, here.lastIndexOf("/src/dom/"))}/wasm/fg_blueprint_bg.wasm`,
);

type Put = { data: ArrayLike<number> };

/** A 2D context that records `putImageData`. */
const contextOf = (puts: Put[]) => ({
  createImageData: (w: number, h: number) => ({
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  }),
  putImageData: (img: Put) => puts.push({ data: Array.from(img.data) }),
});

/** A canvas at a CSS size; handed to the "worker", it becomes a bare object with the context. */
function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  Object.defineProperty(canvas, "clientWidth", { value: width });
  Object.defineProperty(canvas, "clientHeight", { value: height });
  const puts: Put[] = [];
  const ctx = contextOf(puts);
  canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
  const offscreen = { width: 0, height: 0, getContext: () => ctx };
  Object.assign(canvas, { transferControlToOffscreen: () => offscreen });
  return { canvas, puts, offscreen };
}

/** A page and a worker in one thread: messages cross as tasks, as they would. */
function pair(resolve: SceneResolver) {
  const toWorker: ((e: MessageEvent) => void)[] = [];
  const toPage: ((e: MessageEvent) => void)[] = [];
  const deliver = (to: ((e: MessageEvent) => void)[], data: unknown) =>
    setTimeout(() => {
      for (const fn of to) fn({ data } as MessageEvent);
    });
  const scope: WorkerScope = {
    postMessage: (m) => deliver(toPage, m),
    addEventListener: (_type, fn) => toWorker.push(fn as (e: MessageEvent) => void),
  };
  serveBlueprint(resolve, { engine: WASM, scope });
  const worker = {
    postMessage: (m: unknown) => deliver(toWorker, m),
    addEventListener: (_type: string, fn: (e: MessageEvent) => void) => toPage.push(fn),
    terminate() {},
  } as unknown as Worker;
  return connectWorker(worker);
}

const settle = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};

const file: BlueprintFile = {
  $schema: "https://blueprint.forgeron.sh/schema/v1.json",
  version: 1,
  id: "test/remote",
  parts: {
    sign: {
      prims: [
        { kind: "box", at: [0, 0, 0], size: [4, 4, 4], look: "accent", tag: "sign" },
        { kind: "label", at: [2, 2, 6], text: "Sign" },
      ],
    },
  },
  scenes: {
    s: {
      title: "A sign",
      depth: "painter",
      camera: { view: 0, fit: {} },
      root: { instances: [{ use: "sign" }] },
      vars: { pointer: { type: "pointer" } },
    },
  },
};

const fn = ({ active }: { active: number }) => ({
  blocks: [box([0, 0, 0], [4, 4, 4], { accent: active === 1 })],
});

describe("playInWorker", () => {
  it("draws what playCompiled draws, in the worker, and relays the outputs", async () => {
    const compiled = compileBlueprint(await readBlueprint(file, { location: "remote.bp" }));
    const resolve: SceneResolver = (name) =>
      name === "s" ? { compiled, scene: "s" } : name === "f" ? fn : undefined;
    const host = pair(resolve);
    const options = { filters: [pixelate(2)], reducedMotion: true, fill: 0.5 };

    const here = canvasOf(80, 60);
    const local = playCompiled(
      here.canvas,
      { compiled, scene: "s" },
      { ...options, overlay: false },
    );
    const there = canvasOf(80, 60);
    const remote = playInWorker(there.canvas, host, "s", options);
    const hovered: string[] = [];
    remote.on("hover", (_, tag) => hovered.push(tag));
    remote.set("nope", 1); // a var the scene lacks: ignored
    await settle();
    expect([there.offscreen.width, there.offscreen.height]).toEqual([40, 30]);
    expect(there.puts.length).toBeGreaterThan(0);
    expect(there.puts.at(-1)!.data).toEqual(here.puts.at(-1)!.data);
    expect(there.canvas.style.imageRendering).toBe("pixelated");

    // The pointer crosses as a fraction of the canvas; hover comes back as an event.
    const tags = local.scene.tags;
    const at = tags.findIndex((t) => t > 0);
    const { width, height } = local.scene.size;
    const rect = { left: 0, top: 0, width: 80, height: 60 } as DOMRect;
    there.canvas.getBoundingClientRect = () => rect;
    there.canvas.dispatchEvent(
      Object.assign(new Event("pointermove"), {
        clientX: (((at % width) + 0.5) / width) * 80,
        clientY: ((Math.floor(at / width) + 0.5) / height) * 60,
      }),
    );
    await settle();
    expect(hovered).toEqual(["sign"]);
    // A late subscriber gets the last value at once.
    const late: string[] = [];
    remote.on("hover", (_, tag) => late.push(tag));
    expect(late).toEqual(["sign"]);
    local.destroy();

    // A scene function: the cycle's index, the page's `active`, a swap, an unknown name.
    const other = canvasOf(80, 60);
    const script = playInWorker(other.canvas, host, "f", {
      ...options,
      cycle: { every: 1, count: 3 },
    });
    const active: number[] = [];
    script.on("active", (v) => active.push(v));
    await settle();
    expect(active).toEqual([0]);
    const before = other.puts.length;
    script.set("active", 1);
    await settle();
    expect(active).toEqual([0, 1]);
    expect(other.puts.length).toBe(before + 1);
    script.show("unknown");
    script.set("active", 2);
    await settle();
    expect(active).toEqual([0, 1, 2]);
    script.show("s");
    await settle();
    expect(other.puts.at(-1)!.data).toEqual(here.puts.at(-1)!.data);
    remote.destroy();
    script.destroy();
  });
});
