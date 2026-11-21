/**
 * Rigs (docs/blueprint/engine.md §2 "Rigs", P3): each rig of the engine draws the blocks the
 * site's function pushes, word for word (`wheel`, `arm`, `fan`, `piston`, `pendulum` of
 * parts.ts; `smoke` and `flames` of village.ts, through verbatim copies), at settings that cover
 * their branches; and a rig's channel driven by a track moves it as the function's argument does.
 * Under Node (trig through fdlibm on both sides).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  arm,
  fan,
  pendulum,
  piston,
  wheel,
  X,
  Y,
  Z,
} from "../../../../apps/site/src/illustrations/parts";
import type { Block, Vec3 } from "../../src/core/types";
import { packBlocks } from "../../src/engine/pack";
import { DebugScene } from "../debug";
import { normalizeBlock, readBlueprint, writeSceneBin } from "../../src/format/index";
import type { BlueprintFile, RigPrim, Timeline } from "../../src/format/types";
import { flames, smoke } from "./village-rigs";

function file(prim: RigPrim, extra: object = {}, params = {}): BlueprintFile {
  return {
    $schema: "https://blueprint.forgeron.sh/schema/v1.json",
    version: 1,
    id: "test/rigs",
    parts: { r: { params, prims: [prim] } },
    scenes: {
      s: {
        title: "rig",
        depth: "painter",
        camera: { view: 0, fit: {} },
        root: { instances: [{ id: "r", use: "r" }] },
        ...extra,
      },
    },
  } as BlueprintFile;
}

const expected = (blocks: Block[]) => packBlocks(blocks.map(normalizeBlock));

/** The first word where two packed lists differ, for the failure message. */
function firstDiff(a: Uint8Array, b: Uint8Array): string {
  const x = new Float64Array(a.slice(0, a.length - (a.length % 8)).buffer);
  const y = new Float64Array(b.slice(0, b.length - (b.length % 8)).buffer);
  for (let i = 0; i < Math.min(x.length, y.length); i++)
    if (!Object.is(x[i], y[i])) return `word ${i}: ${x[i]} vs ${y[i]}`;
  return a.length === b.length ? "" : `length ${a.length} vs ${b.length}`;
}

async function drawn(prim: RigPrim): Promise<Uint8Array> {
  const lib = await readBlueprint(file(prim), { location: "rigs.bp" });
  const scene = DebugScene.load(writeSceneBin(lib, "s"));
  const out = scene.flatBlocks();
  scene.dispose();
  return out;
}

const rig = (name: RigPrim["rig"], w: RigPrim["with"]): RigPrim => ({
  kind: "rig",
  rig: name,
  with: w,
});
const TIMES = [0, 0.37, 1.7, 4.3, 9.2, 31.4];

describe("rigs draw what the site's functions push", () => {
  it.each(TIMES)("wheel at t = %s", async (t) => {
    const c: Vec3 = [1, -2.5, 3];
    const out: Block[] = [];
    wheel(out, c, 2.2, Y, Z, t * 1.4, { teeth: 15, spokes: 3, hub: 0.5 });
    const got = await drawn(
      rig("wheel", { c, r: 2.2, plane: "yz", teeth: 15, spokes: 3, hub: 0.5, angle: t * 1.4 }),
    );
    expect(firstDiff(got, expected(out))).toBe("");
    // An axis of any direction (hero-cell's antenna), dim, long teeth, spokes from 0.3.
    const yaw = t * 0.35;
    const e1: Vec3 = [Math.cos(yaw), Math.sin(yaw), 0];
    const other: Block[] = [];
    wheel(other, [13, -46, 13.5], 2.4, e1, Z, -t, { spokes: 4, teeth: 7, tooth: 0.9, ink: "dim" });
    expect(
      await drawn(
        rig("wheel", {
          c: [13, -46, 13.5],
          r: 2.4,
          e1,
          e2: Z,
          angle: -t,
          spokes: 4,
          teeth: 7,
          tooth: 0.9,
          ink: "dim",
        }),
      ),
    ).toEqual(expected(other));
  });

  it.each(TIMES)("arm, fan, piston and pendulum at t = %s", async (t) => {
    for (const target of [
      [0, 28 - 5 * Math.sin(t), 3.6],
      [30, 40, 2],
      [-6, 25, 2.4],
    ] as Vec3[]) {
      const out: Block[] = [];
      arm(out, [-6, 25, 0], target, 5, 5);
      expect(
        await drawn(rig("arm", { base: [-6, 25, 0], target, l1: 5, l2: 5 })),
        `arm to ${target}`,
      ).toEqual(expected(out));
    }
    const accentArm: Block[] = [];
    arm(accentArm, [6.5, -17, 0], [0, -19, 4 - t], 4.5, 5.5, "accent");
    expect(
      await drawn(
        rig("arm", {
          base: [6.5, -17, 0],
          target: [0, -19, 4 - t],
          l1: 4.5,
          l2: 5.5,
          ink: "accent",
        }),
      ),
    ).toEqual(expected(accentArm));
    const fans: Block[] = [];
    fan(fans, [-12, 3, 9.1], 1.1, t * 3 + 4);
    expect(await drawn(rig("fan", { c: [-12, 3, 9.1], r: 1.1, angle: t * 3 + 4 }))).toEqual(
      expected(fans),
    );
    for (const axis of ["x", "y"] as const) {
      const out: Block[] = [];
      piston(out, [2, 3, 1], axis === "x" ? X : Y, t * 2.1, 1.3, 4.5);
      expect(
        await drawn(rig("piston", { c: [2, 3, 1], axis, angle: t * 2.1, r: 1.3, rod: 4.5 })),
        `piston ${axis}`,
      ).toEqual(expected(out));
      const defaults: Block[] = [];
      piston(defaults, [0, 0, 0], axis === "x" ? X : Y, t);
      expect(await drawn(rig("piston", { c: [0, 0, 0], axis, angle: t }))).toEqual(
        expected(defaults),
      );
      const swing: Block[] = [];
      pendulum(swing, [4, -2, 12], 6, axis === "x" ? X : Y, Math.sin(t * 1.1) * 0.6, "accent");
      expect(
        await drawn(
          rig("pendulum", {
            pivot: [4, -2, 12],
            length: 6,
            plane: axis,
            angle: Math.sin(t * 1.1) * 0.6,
            ink: "accent",
          }),
        ),
        `pendulum ${axis}`,
      ).toEqual(expected(swing));
    }
  });

  it.each(TIMES)("smoke and sparks (village.ts) at t = %s", async (t) => {
    const puffs: Block[] = [];
    smoke(puffs, [3, -4, 9], t, 7, 31, 12, 1.4);
    expect(
      await drawn(rig("smoke", { top: [3, -4, 9], t, n: 7, seed: 31, rise: 12, thick: 1.4 })),
    ).toEqual(expected(puffs));
    const plain: Block[] = [];
    smoke(plain, [0, 0, 5], t, 4, 2);
    expect(await drawn(rig("smoke", { top: [0, 0, 5], t, n: 4, seed: 2 }))).toEqual(
      expected(plain),
    );
    const fire: Block[] = [];
    flames(fire, [-2, -2, 7.6], t, 7, 777);
    expect(await drawn(rig("sparks", { at: [-2, -2, 7.6], t, n: 7, seed: 777 }))).toEqual(
      expected(fire),
    );
  });

  it("the copies of village.ts are verbatim", () => {
    const site = readFileSync(
      new URL("../../../../apps/site/src/illustrations/village.ts", import.meta.url),
      "utf8",
    );
    const copies = readFileSync(new URL("./village-rigs.ts", import.meta.url), "utf8");
    for (const name of ["hash", "smoke", "flames"]) {
      const body = (src: string) => {
        const start = src.search(new RegExp(`function ${name}\\(`));
        return src.slice(start, src.indexOf("\n}\n", start));
      };
      expect(body(copies), `${name} of village.ts`).toBe(body(site));
    }
  });
});

describe("a rig's channel on a track", () => {
  it("a spin track turns a wheel as `t·rate` does", async () => {
    const timeline: Timeline = {
      tracks: [{ kind: "spin", target: "r", channel: "param:angle", rate: 1.4 }],
    };
    const prim = rig("wheel", { c: [0, 0, 0], r: 2.2, plane: "yz", teeth: 15, angle: "@angle" });
    const lib = await readBlueprint(
      file(prim, { timelines: { idle: timeline } }, { angle: { type: "number", default: 0 } }),
      { location: "rigs.bp" },
    );
    const scene = DebugScene.load(writeSceneBin(lib, "s"));
    scene.resize(64, 64);
    for (const t of TIMES) {
      scene.frame(t);
      const out: Block[] = [];
      wheel(out, [0, 0, 0], 2.2, Y, Z, t * 1.4, { teeth: 15 });
      expect(firstDiff(scene.flatBlocks(), expected(out)), `t = ${t}`).toBe("");
    }
    scene.dispose();
  });
});
