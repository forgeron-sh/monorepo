import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { box, label, line } from "../core/blocks";
import { dither, palette, plan } from "../core/filters";
import { paint, resolvePalette } from "../core/palette";
import { render, renderTs } from "../core/render";
import { describeScene, flatten, readBlueprint, writeSceneBin } from "../format/index";
import { fontRust, layoutRust } from "./codegen";
import contract from "./fixtures/contract.bp.json";
import { EngineScene, immediateHandle } from "./index";
import { offsets, sizeOf } from "./layout";
import { packBlocks } from "./pack";
import { DebugScene } from "../../test/debug";

const root = new URL("../../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root));

describe("generated Rust", () => {
  it("layout.rs is generated from layout.ts (bun scripts/blueprint/gen-layout.ts)", () => {
    expect(read("crates/fg-blueprint/src/layout.rs").toString()).toBe(layoutRust());
  });

  it("font.rs is generated from core/font.ts (bun scripts/blueprint/gen-font.ts)", () => {
    expect(read("crates/fg-blueprint/src/font.rs").toString()).toBe(fontRust());
  });
});

describe("the built module", () => {
  it("stays within its budget: 150 KB raw, 60 KB gzip", () => {
    const wasm = read("packages/blueprint/wasm/fg_blueprint_bg.wasm");
    expect(wasm.length).toBeLessThanOrEqual(150 * 1024);
    expect(gzipSync(wasm, { level: 9 }).length).toBeLessThanOrEqual(60 * 1024);
  });
});

/** Packed blocks with the tag words cleared: tags are the engine's addition to the block model. */
function untagged(packed: Uint8Array): Uint8Array {
  const out = packed.slice();
  const view = new DataView(out.buffer);
  const count = view.getFloat64(offsets("blocksHeader").count * 8, true);
  for (let k = 0; k < count; k++)
    view.setFloat64(
      (sizeOf("blocksHeader") + k * sizeOf("block") + offsets("block").tag) * 8,
      0,
      true,
    );
  return out;
}

describe("SceneBin: written in TypeScript, read in Rust", async () => {
  const lib = await readBlueprint(contract, { location: "contract.bp.json" });

  it("gives the same tree", () => {
    const scene = DebugScene.load(writeSceneBin(lib, "room"));
    expect(scene.describe()).toBe(describeScene(lib, "room"));
    const fitted = DebugScene.load(
      writeSceneBin(lib, "room", { fill: 0.5, unit: "even", labels: false }),
    );
    expect(fitted.describe()).toBe(
      describeScene(lib, "room", { fill: 0.5, unit: "even", labels: false }),
    );
    scene.dispose();
    fitted.dispose();
  });

  // The root scope: t, active, progress, then the root's param `open`.
  const inputs: [Record<string, number | boolean>, [number, number][]][] = [
    [{}, []],
    [{ progress: 0.7 }, [[2, 0.7]]],
    [{ open: false }, [[3, 0]]],
    [
      { progress: 1 / 3, open: false },
      [
        [2, 1 / 3],
        [3, 0],
      ],
    ],
  ];

  it.each(inputs)("flattens to the blocks of `flatten`, float64 exact (%j)", (vars, set) => {
    const scene = DebugScene.load(writeSceneBin(lib, "room"));
    for (const [i, v] of set) scene.set(i, v);
    expect(untagged(scene.flatBlocks())).toStrictEqual(packBlocks(flatten(lib, "room", vars)));
    scene.dispose();
  });

  it("draws the frame the reference draws from `flatten`", () => {
    const scene = EngineScene.load(writeSceneBin(lib, "room"));
    scene.resize(180, 120);
    scene.draw();
    const fromData = scene.frame();
    const reference = renderTs(
      { blocks: flatten(lib, "room"), fit: { fill: 0.8, unit: "any" } },
      // A scene without filters is dithered by 4, as the site's canvases.
      { width: 180, height: 120, filters: [dither({ matrix: 4 })] },
    );
    expect(scene.view).toEqual(reference.view);
    for (const key of ["material", "ink", "tone", "color"] as const)
      expect(fromData[key]).toStrictEqual(reference.frame[key]);
    scene.dispose();
  });

  it("names what it cannot read", () => {
    expect(() => EngineScene.load(new Uint8Array(8))).toThrow(/not a SceneBin/);
    const bin = writeSceneBin(lib, "room");
    expect(() => EngineScene.load(bin.slice(0, 200))).toThrow(/truncated/);
  });
});

describe("render on the engine", () => {
  it("draws what the TypeScript raster draws", () => {
    const scene = {
      blocks: [
        box([0, 0, 0], [6, 4, 3], { floors: 1, vents: true, plate: true, accent: true }),
        box([7, 0, 0], [2, 2, 5], { ghost: true }),
        line([0, 6, 0], [9, 6, 0], { ink: "faint", dash: 1 }),
        label([3, 2, 6], "Forgeron", { to: [3, 2, 3], active: true }),
        label([8, 1, 7], "plain", { plain: true, ink: "alert" }),
      ],
    };
    const options = { width: 300, height: 200 };
    const a = render(scene, options);
    const b = renderTs(scene, options);
    expect(a.view).toEqual(b.view);
    for (const key of ["material", "ink", "tone", "color"] as const)
      expect(a.frame[key]).toStrictEqual(b.frame[key]);
  });

  it("paints RGBA as `paint` does", () => {
    const colors = resolvePalette(plan([palette({ ink: "#010203", accent: "#ff4f1f" })]).colors);
    const h = immediateHandle();
    const { frame } = render(
      { blocks: [box([0, 0, 0], [4, 4, 4], { accent: true })] },
      { width: 60, height: 60 },
    );
    expect([...h.paint(colors)]).toStrictEqual([...paint(frame, colors)]);
  });
});
