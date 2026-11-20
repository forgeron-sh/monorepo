// @vitest-environment jsdom
import { encodeScene, readBlueprint, type Turn } from "../format";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blueprintItem, type BlueprintItemData } from "./kind";
import { withView } from "./scenes";
import { BlueprintStage, type Frames } from "./stage";
import { fakeCanvas, FILE } from "./test-fixtures";

/** Frames run only when the test flushes them. */
const manual = (): Frames => ({ request: () => 1, cancel: () => {} });

let draws: ReturnType<typeof fakeCanvas>;
beforeEach(() => {
  draws = fakeCanvas();
});
afterEach(() => vi.restoreAllMocks());

async function stageWith(data: Partial<BlueprintItemData> = {}) {
  const lib = await readBlueprint(FILE, { location: "towers.bp" });
  const stage = new BlueprintStage({ resolve: () => lib, compositor: "webgl2", frames: manual() });
  const canvas = document.createElement("canvas");
  stage.attach(canvas);
  const item = blueprintItem(
    "s",
    { file: "towers.bp", scene: "towers", view: 0, ...data },
    { x: 0, y: 0 },
    { w: 400, h: 250 },
  );
  stage.setViewport({ x: 0, y: 0, zoom: 1 }, { w: 800, h: 500 });
  stage.setItems([item]);
  stage.flush();
  return { stage, lib, item };
}

describe("withView", () => {
  it("writes the view and depth words exactly as encoding a scene with them does", async () => {
    const lib = await readBlueprint(FILE, { location: "towers.bp" });
    const encoded = encodeScene(lib, "towers", { fill: 0.8 });
    for (const view of [0, 1, 2, 3] as Turn[])
      for (const depth of ["painter", "zbuffer"] as const) {
        const scene = lib.scenes.get("towers")!;
        const turned = {
          ...lib,
          scenes: new Map([["towers", { ...scene, depth, camera: { ...scene.camera, view } }]]),
        };
        expect(withView(encoded, view, depth)).toEqual(
          encodeScene(turned, "towers", { fill: 0.8 }).bytes,
        );
      }
  });
});

describe("BlueprintStage", () => {
  it("falls back to the 2D compositor and draws the item centred on its bounds", async () => {
    const { stage } = await stageWith();
    expect(stage.compositorKind).toBe("2d");
    const p = stage.placement("s")!;
    // 400 × 250 CSS at pixel 2: a 200 × 125 raster drawn at scale 2.
    expect([p.width, p.height, p.scale]).toEqual([200, 125, 2]);
    expect(draws.at(-1)).toEqual({ x: 0, y: 0, w: 400, h: 250 });
    stage.dispose();
  });

  it("finds the tag under the pointer at three zooms", async () => {
    const { stage } = await stageWith();
    for (const zoom of [0.5, 1, 2]) {
      stage.setViewport({ x: 37, y: 11, zoom }, { w: 800, h: 500 });
      stage.flush();
      const p = stage.placement("s")!;
      const { scene, encoded } = stage.sceneOf("s")!;
      // Every tag drawn in the raster is found back under the screen pixel of its raster pixel.
      const tags = scene.tags;
      const found = new Set<string>();
      for (let y = 0; y < p.height; y++)
        for (let x = 0; x < p.width; x++) {
          const t = tags[y * p.width + x]!;
          if (!t) continue;
          const want = encoded.strings[t - 1]!;
          const hit = stage.hover({ x: p.x + x * p.scale + p.scale / 2, y: p.y + y * p.scale });
          expect(hit).toEqual({ item: "s", tag: want });
          found.add(want);
        }
      expect([...found].sort()).toEqual(["plate", "short", "tall"]);
      expect(stage.hover({ x: p.x - 1, y: p.y - 1 })).toBeNull();
    }
    stage.dispose();
  });

  it("re-fits once per zoom step crossed, never while panning or zooming inside a step", async () => {
    const { stage } = await stageWith();
    const before = stage.stats.refits;
    for (let dx = 0; dx < 50; dx++)
      stage.setViewport({ x: dx, y: -dx, zoom: 1 }, { w: 800, h: 500 });
    stage.setViewport({ x: 0, y: 0, zoom: 1.2 }, { w: 800, h: 500 });
    stage.setViewport({ x: 0, y: 0, zoom: 1.4 }, { w: 800, h: 500 });
    expect(stage.stats.refits).toBe(before);
    stage.setViewport({ x: 0, y: 0, zoom: 1.5 }, { w: 800, h: 500 });
    stage.setViewport({ x: 0, y: 0, zoom: 1.7 }, { w: 800, h: 500 });
    expect(stage.stats.refits).toBe(before + 1);
    stage.setViewport({ x: 0, y: 0, zoom: 0.9 }, { w: 800, h: 500 });
    expect(stage.stats.refits).toBe(before + 2);
    // Above the last step only the integer scale grows.
    stage.setViewport({ x: 0, y: 0, zoom: 2 }, { w: 800, h: 500 });
    const at2 = stage.stats.refits;
    stage.setViewport({ x: 0, y: 0, zoom: 4 }, { w: 800, h: 500 });
    expect(stage.stats.refits).toBe(at2);
    expect(stage.placement("s")!.scale).toBe(4);
    stage.dispose();
  });

  it("draws a view switch in the next frame, with a different picture", async () => {
    const { stage, item } = await stageWith();
    const first = stage.sceneOf("s")!.scene.slots.slice();
    const composites = stage.stats.composites;
    stage.setItems([{ ...item, data: { ...item.data, view: 1 } }]);
    stage.flush();
    expect(stage.stats.composites).toBe(composites + 1);
    const turned = stage.sceneOf("s")!.scene.slots;
    expect(turned.length).toBe(first.length);
    expect(turned).not.toEqual(first);
    stage.dispose();
  });

  it("scrubs the clock and keeps the host's vars across a view switch", async () => {
    const { stage, item } = await stageWith();
    stage.seek(1.7);
    stage.flush();
    expect(stage.sceneOf("s")!.scene.get("t")).toBe(1.7);
    stage.set("s", "progress", 0.75);
    stage.flush();
    expect(stage.sceneOf("s")!.scene.state(0)).toBe("end");
    stage.setItems([{ ...item, data: { ...item.data, view: 3 } }]);
    stage.flush();
    expect(stage.sceneOf("s")!.scene.state(0)).toBe("end");
    stage.release("s", "progress");
    stage.flush();
    expect(stage.sceneOf("s")!.scene.state(0)).toBe("start");
    stage.dispose();
  });

  it("shows a part or an assembly alone", async () => {
    const { stage } = await stageWith({ scene: "pair", preview: "assembly" });
    const tags = stage.sceneOf("s")!.scene.tags;
    expect(tags.some((t) => t > 0)).toBe(true);
    stage.dispose();
  });
});
