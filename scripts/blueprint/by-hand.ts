// The by-hand pass of the Blueprint conversion (docs/blueprint/engine.md §2, P3): a scene's
// varying blocks, rewritten as prims bound to params that tracks drive, go back into its
// `.bp` at the places the scene function draws them, so the painter's stable order is the
// function's. A spec per scene below; the files it writes are then the source (the mechanical
// pass, `convert-site.ts`, leaves them alone).
//   bun scripts/blueprint/by-hand.ts web mcp
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { Block } from "../../packages/blueprint/src";
import type { BlueprintFile, Prim, Scene, Track } from "../../packages/blueprint/src/format";
import { blockToPrim, writeBlueprint } from "../../packages/blueprint/src/format";
import { evaluate } from "../../apps/site/src/illustrations/library/samples";

const LIBRARY = "apps/site/src/illustrations/library";
/** Times at which a block's place in the list is checked. */
const PROBES = [
  0,
  0.37,
  0.6,
  1.1,
  1.7,
  2.6,
  4.3,
  9.2,
  31.4,
  ...Array.from({ length: 10 }, (_, i) => 0.11 + i * 2.93),
];

interface Spec {
  /** The time at which every varying block is drawn (the list it is aligned on). */
  at?: number;
  /** Params of the scene's part, with their defaults (the picture at t = 0). */
  params: NonNullable<Scene["root"]["params"]>;
  /** The prim of each varying block, in drawing order (or made from those blocks at `at`). */
  prims: Prim[] | ((varying: Block[]) => Prim[]);
  tracks: Track[];
}

const SPECS: Record<string, Spec> = {
  // web: the pop-up block breathes, 0.6 + max(0, sin(t·1.5))·0.8.
  web: {
    params: { pop: { type: "number", default: 0.6 } },
    prims: [{ kind: "box", at: [8, 1, 6], size: [7, "@pop", 3] }],
    tracks: [
      {
        kind: "wave",
        target: "body",
        channel: "param:pop",
        wave: "sin",
        rate: 1.5,
        amp: 0.8,
        base: 0.6,
        clip: true,
      },
    ],
  },
  // mcp: the plug rides 4 + sin(t·1.3)·1.2 above its socket.
  mcp: {
    params: { lift: { type: "number", default: 4 } },
    prims: [
      { kind: "box", at: [3.5, 4, { p: "lift", b: 2 }], size: [1.2, 1.2, 2] },
      { kind: "box", at: [7.3, 4, { p: "lift", b: 2 }], size: [1.2, 1.2, 2] },
      {
        kind: "box",
        at: [2, 2, { p: "lift", b: 4 }],
        size: [8, 8, 3],
        look: "accent",
        floors: 1.5,
      },
      { kind: "box", at: [5, 5, { p: "lift", b: 7 }], size: [2, 2, 5] },
    ],
    tracks: [
      {
        kind: "wave",
        target: "body",
        channel: "param:lift",
        wave: "sin",
        rate: 1.3,
        amp: 1.2,
        base: 4,
      },
    ],
  },
  // cli: the cursor blinks, shown while floor(t·2) mod 2 = 0.
  cli: {
    params: { cursor: { type: "flag", default: true } },
    prims: [
      {
        kind: "box",
        at: [3.2, 1.6 + 5 * 1.9, 1.6],
        size: [1, 1, 1.4],
        look: "accent",
        visible: "@cursor",
      },
    ],
    tracks: [
      {
        kind: "blink",
        target: "body",
        channel: "param:cursor",
        rate: 2,
        period: 2,
        on: 1,
        seed: 0,
      },
    ],
  },
  // usage-iso: the last block of row `beat` (floor(t·2) mod 4) stands 0.6 taller.
  "usage-iso": {
    params: Object.fromEntries(
      [0, 1, 2, 3].map((i) => [`row${i}`, { type: "number" as const, default: i === 0 ? 1 : 0 }]),
    ),
    prims: [
      [6, 4],
      [7, 6],
      [9, 2],
      [3, 1],
    ].map(([c, a], i) => ({
      kind: "box" as const,
      at: [14 + (c! + a! - 1) * 1.5, 1 + i * 4.6, 0.4] as const,
      size: [1.2, 1.2, { p: `row${i}`, k: 0.6, b: 1.2 }] as const,
      look: "accent" as const,
    })),
    tracks: [0, 1, 2, 3].map((i) => ({
      kind: "blink" as const,
      target: "body",
      channel: `param:row${i}` as const,
      rate: 2,
      period: 4,
      on: 1,
      seed: 0,
      at: i,
    })),
  },
  // host-servers: each rack's five lights blink, floor(t·3 + seed·3 + l·5) mod 7 < 2, and the
  // terminal's screen lights while floor(t·2) mod 2 = 0. The blink's seed is seed·3 + l·5 added
  // once (the function adds the two terms one after the other: P3 notes).
  "host-servers": {
    params: {
      ...Object.fromEntries(
        [0, 1, 2].flatMap((seed) =>
          [0, 1, 2, 3, 4].map((l) => [
            `on${seed}${l}`,
            { type: "flag" as const, default: Math.floor(seed * 3 + l * 5) % 7 < 2 },
          ]),
        ),
      ),
      screen: { type: "flag", default: true },
    },
    prims: (blocks) =>
      blocks.map((b, i) => {
        const p = blockToPrim(b);
        if (b.kind === "dot")
          return {
            ...p,
            ink: { if: `@on${Math.floor(i / 5)}${i % 5}`, then: "accent", else: "dim" },
          } as Prim;
        return { ...p, look: { if: "@screen", then: "accent", else: "plain" } } as Prim;
      }),
    tracks: [
      ...[0, 1, 2].flatMap((seed) =>
        [0, 1, 2, 3, 4].map((l) => ({
          kind: "blink" as const,
          target: "body",
          channel: `param:on${seed}${l}` as const,
          rate: 3,
          period: 7,
          on: 2,
          seed: seed * 3 + l * 5,
        })),
      ),
      {
        kind: "blink" as const,
        target: "body",
        channel: "param:screen" as const,
        rate: 2,
        period: 2,
        on: 1,
        seed: 0,
      },
    ],
  },
};

const key = (b: Block) => JSON.stringify(b);

function convert(name: string, spec: Spec): void {
  const at = spec.at ?? 0;
  const full = evaluate(name, { t: at, active: -1 });
  const varying = new Set<number>();
  for (const t of PROBES) {
    const other = evaluate(name, { t, active: -1 });
    full.forEach((b, i) => {
      if (other[i] === undefined || key(other[i]!) !== key(b)) varying.add(i);
    });
  }
  const path = `${LIBRARY}/${name}.bp`;
  const file = JSON.parse(readFileSync(path, "utf8")) as BlueprintFile;
  const part = Object.values(file.parts ?? {})[0];
  if (!part || Object.keys(file.parts ?? {}).length !== 1)
    throw new Error(`${name}: expected one static part`);
  const statics = part.prims;
  // A line prim of n points draws n − 1 blocks.
  const drawn = (p: Prim) => (p.kind === "line" ? p.points.length - 1 : 1);
  const count = statics.reduce((n, p) => n + drawn(p), 0);
  if (count !== full.length - varying.size)
    throw new Error(
      `${name}: ${count} static blocks in the file, ${full.length - varying.size} drawn`,
    );
  const made =
    typeof spec.prims === "function"
      ? spec.prims(full.filter((_, i) => varying.has(i)) as Block[])
      : spec.prims;
  if (made.length !== varying.size)
    throw new Error(`${name}: ${varying.size} varying blocks, ${made.length} prims`);
  const prims: Prim[] = [];
  let s = 0;
  let v = 0;
  let left = 0;
  full.forEach((_, i) => {
    if (varying.has(i)) {
      if (left > 0) throw new Error(`${name}: block ${i} varies inside a polyline`);
      prims.push(made[v++]!);
    } else if (left > 0) left--;
    else {
      const p = statics[s++]!;
      prims.push(p);
      left = drawn(p) - 1;
    }
  });
  const sceneName = Object.keys(file.scenes ?? {})[0]!;
  const scene = file.scenes![sceneName]!;
  const out: BlueprintFile = {
    ...file,
    parts: { body: { params: spec.params, prims } },
    scenes: {
      [sceneName]: {
        ...scene,
        root: { instances: [{ id: "body", use: "body" }] },
        timelines: { motion: { tracks: spec.tracks } },
      },
    },
  };
  writeFileSync(path, writeBlueprint(out));
  console.log(`${name}: ${varying.size} varying blocks at ${[...varying].join(", ")}`);
}

const names = process.argv.slice(2);
for (const name of names.length ? names : Object.keys(SPECS)) {
  const spec = SPECS[name];
  if (!spec) throw new Error(`no spec for "${name}"`);
  convert(name, spec);
}
spawnSync("bunx", ["oxfmt", LIBRARY], { stdio: "inherit" });
