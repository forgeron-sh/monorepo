/**
 * The village as data (docs/blueprint/engine.md, "Village as data notes"): the engine's blocks
 * of `@forgeron/libraries/blueprints/erp-village.bp` equal `village.ts`'s, word for word in
 * painter's order, at every probe of the clock and the scroll, the walkers left out on both
 * sides (the file's crowd is a deterministic replacement of the function's simulation; its root
 * param `crowd` turns it off).
 * Painter's order is the order the raster draws in; the conveyors' pulses follow the root's
 * blocks in the file, so the lists are compared sorted, as the raster sorts them. Under Node.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STEPS } from "../../../../apps/site/src/illustrations/steps";
import { village, villageStore } from "../../../../apps/site/src/illustrations/village";
import type { Block } from "../../src/core/types";
import { packBlocks } from "../../src/engine/pack";
import { offsets, sizeOf } from "../../src/engine/layout";
import { encodeScene, normalizeBlock, readBlueprint } from "../../src/format/index";
import type { BlueprintFile } from "../../src/format/types";
import { DebugScene } from "../debug";

const repo = new URL("../../../../", import.meta.url);
const H = sizeOf("blocksHeader");
const W = sizeOf("block");
const B = offsets("block");

/** A packed list as records, sorted as the raster sorts them (layer, then the painter's key). */
function painted(bytes: Uint8Array): string[] {
  const words = new Float64Array(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + (bytes.length & ~7)),
  );
  const count = words[1]!;
  const textStart = (H + count * W) * 8;
  const decoder = new TextDecoder();
  const rows = Array.from({ length: count }, (_, k) => {
    const r = words.subarray(H + k * W, H + (k + 1) * W);
    const kind = r[B.kind]!;
    const [ax, ay, az, bx, by, bz] = [r[B.ax]!, r[B.ay]!, r[B.az]!, r[B.bx]!, r[B.by]!, r[B.bz]!];
    const key =
      kind === 0
        ? ax + bx + ay + by + az * 0.5
        : kind === 1
          ? Math.min(ax + ay, bx + by) - 1000 * (az === 0 && bz === 0 ? 1 : 0)
          : ax + ay + az * 0.5;
    const text =
      kind === 3
        ? decoder.decode(
            bytes.subarray(textStart + r[B.text]!, textStart + r[B.text]! + r[B.textLength]!),
          )
        : "";
    const fields = [...r].map((v, i) => (i === B.text ? 0 : Object.is(v, -0) ? 0 : v));
    return { layer: r[B.layer]!, key, row: `${fields.join(",")}|${text}` };
  });
  return rows
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => a.layer - b.layer || a.key - b.key || a.i - b.i)
    .map((r) => r.row);
}

/** A walker of the function: its body, head, parcel or tickets, west of the desks. */
const WALKER = new Set(["0.6,0.6,1.1", "0.5,0.5,0.5", "0.8,0.8,0.5", "0.8,0.8,0.2"]);
const isWalker = (b: Block) => b.kind === "box" && b.at[0] < -20 && WALKER.has(b.size.join(","));

function reference(t: number, p: number): string[] {
  villageStore.progress = p;
  try {
    return painted(
      packBlocks(
        village(t)
          .filter((b) => !isWalker(b))
          .map(normalizeBlock),
      ),
    );
  } finally {
    villageStore.progress = 0;
  }
}

/** The parity suites' times, the frames of the animated suite's dt sequence, a few more. */
const TIMES = [0, 0.37, 1.7, 4.3, 9.2, 31.4, 2.93, 6.11, 13.37]
  .flatMap((t) => [t, Math.round(t * 60) * (1 / 60)])
  .filter((t, i, all) => all.indexOf(t) === i);
/** Every 1/80 of the scroll, and each step's ends with the doubles around them. */
const PROGRESS = [
  ...Array.from({ length: 81 }, (_, i) => i / 80),
  ...Object.values(STEPS).flatMap(([a, b]) =>
    [a, b].flatMap((x) => [x, x + 1e-9, x - 1e-9, x + Number.EPSILON]),
  ),
  0.7,
  0.72,
  0.74,
  0.745,
  0.76,
  0.78,
  0.85,
  0.95,
].filter((p, i, all) => p >= 0 && p <= 1 && all.indexOf(p) === i);

describe("erp-village from data", () => {
  it("draws village.ts's blocks, the walkers left out", async () => {
    const file = JSON.parse(
      readFileSync(new URL("packages/libraries/blueprints/erp-village.bp", repo), "utf8"),
    ) as BlueprintFile;
    const lib = await readBlueprint(file, { location: "erp-village.bp" });
    const encoded = encodeScene(lib, "erp-village");
    const scene = DebugScene.load(encoded.bytes);
    scene.set(encoded.scope.indexOf("crowd"), 0);
    const failures: string[] = [];
    let cases = 0;
    for (const p of PROGRESS) {
      scene.set(encoded.scope.indexOf("progress"), p);
      for (const t of TIMES) {
        scene.frame(t, 0);
        const got = painted(scene.flatBlocks());
        const want = reference(t, p);
        cases++;
        if (got.length !== want.length || got.some((r, i) => r !== want[i])) {
          const i = got.findIndex((r, k) => r !== want[k]);
          failures.push(
            `t=${t} p=${p}: ${got.length} blocks, want ${want.length}; first difference at ${i}:\n  got  ${got[i]}\n  want ${want[i]}`,
          );
        }
      }
    }
    scene.dispose();
    console.log(`erp-village from data: ${cases} cases, ${failures.length} differ`);
    expect(failures.slice(0, 5)).toEqual([]);
  }, 300_000);
});
