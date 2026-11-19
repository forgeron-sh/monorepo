// The village as data (docs/blueprint/engine.md, "Village as data notes"): writes
// packages/libraries/blueprints/erp-village.bp from this description of `village.ts`, part
// by part in the function's drawing order. What the function computes each frame from the clock
// and the scroll becomes `calc` tracks (one IEEE operation per step, in the function's order, so
// every value is the function's, bit for bit), the prims read those params, the procedural
// masses are rigs (`sparks`, `smoke`, `burst`, `mushroom`, `pile`, `wheel`, `arm`), and the
// pulses along wires are conveyors. The walkers, a simulation over the frames' history in the
// function, become a deterministic crowd (below, "walkers"), the one visible change.
//   bun scripts/blueprint/village.ts
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import type {
  BlueprintFile,
  CalcOp,
  Flag,
  InkRef,
  Instance,
  Num,
  NumVec,
  Part,
  Prim,
  Scene,
  Track,
} from "../../packages/blueprint/src/format";
import { writeBlueprint } from "../../packages/blueprint/src/format";
import type { Vec3 } from "../../packages/blueprint/src/core/types";
import { along, glide, pathLength, X, Y, Z } from "../../apps/site/src/illustrations/parts";
import { STEPS } from "../../apps/site/src/illustrations/steps";

// Under Node: the constants are V8's Math (Bun's sin and cos can be an ulp away, P1 note 2).
if (process.versions.bun) {
  const { build } = await import("rolldown");
  const bundle = "target/blueprint/village.mjs";
  await build({
    input: "scripts/blueprint/village.ts",
    platform: "node",
    external: ["rolldown"],
    output: { file: bundle, format: "esm" },
    logLevel: "warn",
  });
  const run = spawnSync("node", [bundle], { stdio: "inherit" });
  process.exit(run.status ?? 1);
}

const LIBRARY = "packages/libraries/blueprints";
const OUT = `${LIBRARY}/erp-village.bp`;

// ── village.ts's helpers, verbatim ───────────────────────────────────────────

const TAU = Math.PI * 2;

function hash(x: number, y = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ── The description: root params computed by calc tracks, parts of prims ─────

type P = `@${string}`;
type Ink = Extract<InkRef, string>;

/** Root params, in the order their tracks run (each one written by one or more calc tracks). */
const roots: string[] = [];
const calcs: Track[] = [];
const conveyors: Track[] = [];
let serial = 0;

/** A root param computed each frame: `from`, then `ops` left to right. */
function calc(name: string | null, from: number | P, ops: CalcOp[], guard?: P): P {
  const n = name ?? `v${++serial}`;
  if (!roots.includes(n)) roots.push(n);
  calcs.push({
    kind: "calc",
    target: "",
    channel: `param:${n}`,
    from,
    ops: guard ? [["when", guard], ...ops] : ops,
  });
  return `@${n}`;
}
/** `a && b` of two root values (1 or 0). */
const and = (a: P, b: P) => calc(null, a, [["and", b]]);
const not = (a: P) => calc(null, a, [["not"]]);
/** `b + k·p`. */
const lin = (p: P, k: number, b: number): Num => ({ p: p.slice(1), k, b });
/** `p + b` (as `b + 1·p`: the same double, addition being commutative). */
const plus = (p: P, b: number): Num => ({ p: p.slice(1), b });

const parts: [string, Prim[]][] = [];
let prims: Prim[] = [];
function part(name: string): void {
  prims = [];
  parts.push([name, prims]);
}

interface Extra {
  layer?: number;
  visible?: Flag;
  decor?: false;
}
const base = (x: Extra = {}) => ({
  ...(x.layer !== undefined ? { layer: x.layer } : {}),
  ...(x.decor === false ? {} : { decor: true }),
  ...(x.visible !== undefined ? { visible: x.visible } : {}),
});

function seg(a: NumVec, b: NumVec, ink: InkRef = "ink", x: Extra & { dash?: number } = {}): void {
  prims.push({
    kind: "line",
    points: [a, b],
    ink,
    ...(x.dash ? { dash: x.dash } : {}),
    ...base(x),
  });
}
function polyline(pts: readonly NumVec[], ink: InkRef = "ink", x: Extra = {}): void {
  if (pts.length >= 2) prims.push({ kind: "line", points: pts, ink, ...base(x) });
}
function dot(at: NumVec, ink: InkRef = "ink", size = 2, x: Extra = {}): void {
  prims.push({ kind: "dot", at, ink, size, ...base(x) });
}
interface BoxExtra extends Extra {
  floors?: number;
  plate?: boolean;
  look?: "accent" | "signal" | "alert" | "ghost";
  tone?: readonly [number, number, number];
  vents?: boolean;
}
function box(at: NumVec, size: NumVec, x: BoxExtra = {}): void {
  prims.push({
    kind: "box",
    at,
    size,
    ...(x.tone ? { tone: x.tone } : {}),
    ...(x.look ? { look: x.look } : {}),
    ...(x.plate ? { plate: true } : {}),
    ...(x.floors !== undefined ? { floors: x.floors } : {}),
    ...(x.vents ? { vents: "+x" as const } : {}),
    ...base(x),
  });
}
/** `block` of parts.ts: centred on `c` in x and y. */
function block(c: Vec3, size: Vec3, x: BoxExtra = {}): void {
  box([c[0] - size[0] / 2, c[1] - size[1] / 2, c[2]], size, x);
}
function label(
  text: string,
  at: NumVec,
  x: { to?: NumVec; active?: Flag; plain?: boolean; ink?: Ink; visible?: Flag; layer?: number },
): void {
  prims.push({
    kind: "label",
    at,
    text,
    ...(x.to ? { to: x.to } : {}),
    ...(x.active !== undefined ? { active: x.active } : {}),
    ...(x.plain ? { plain: true } : { fixed: true }),
    ...(x.ink ? { ink: x.ink } : {}),
    ...base({ visible: x.visible, layer: x.layer }),
  });
}
function rig(
  name: Extract<Prim, { kind: "rig" }>["rig"],
  w: Record<string, unknown>,
  x: Extra = {},
): void {
  prims.push({ kind: "rig", rig: name, with: w as never, ...base(x) });
}
/** `wheel` of parts.ts in a plane given by its axes. */
function wheel(
  c: NumVec,
  r: Num,
  e1: Vec3,
  e2: Vec3,
  angle: Num,
  o: { teeth?: number; spokes?: number; hub?: number; ink?: Ink; tooth?: number } = {},
  x: Extra = {},
): void {
  const plane =
    e1 === X && e2 === Y ? { plane: "xy" } : e1 === Y && e2 === Z ? { plane: "yz" } : { e1, e2 };
  rig("wheel", { c, r, ...plane, angle, ...o }, x);
}
/** A conveyor of one copy of part `use` along `path`, `(t·speed + phase) mod L` along it. */
function conveyor(use: string, path: readonly Vec3[], speed: number, phase: number, on?: P): void {
  conveyors.push({
    kind: "conveyor",
    use,
    path: path as Vec3[],
    count: 1,
    speed,
    ...(phase ? { phase } : {}),
    ...(on ? { params: { on } } : {}),
  });
}

// ── Inputs ───────────────────────────────────────────────────────────────────

const T: P = "@t";
const PROGRESS: P = "@progress";
const reveal = (name: string, [a, b]: readonly [number, number]) =>
  calc(name, PROGRESS, [
    ["sub", a],
    ["div", b - a],
    ["max", 0],
    ["min", 1],
  ]);
/** `p >= a && p < b`. */
const within = (name: string, [a, b]: readonly [number, number]) =>
  calc(name, PROGRESS, [
    ["ge", a],
    ["and", calc(null, PROGRESS, [["lt", b]])],
  ]);
const atLeast = (name: string, a: number) => calc(name, PROGRESS, [["ge", a]]);
/** `Math.floor(t·rate + add) % mod` (with `add` 0, as the function's `t·rate + i` at i = 0). */
const tick = (rate: number, add: number, mod: number) =>
  calc(null, T, [
    ["mul", rate],
    ...(add ? ([["add", add]] as CalcOp[]) : []),
    ["floor"],
    ["mod", mod],
  ]);
/** `(t·rate + add) % 1`. */
const age = (rate: number, add: number) =>
  calc(null, T, [
    ["mul", rate],
    ["add", add],
    ["mod", 1],
  ]);

const tinker = reveal("tinker", STEPS.tinker);
const generic = reveal("generic", STEPS.generic);
const plug = reveal("plug", STEPS.plug);
const boom = reveal("boom", STEPS.boom);
const fire = reveal("fire", STEPS.fire);
const excelR = reveal("excel", STEPS.excel);
const upgradeR = reveal("upgrade", STEPS.upgrade);
const lockR = reveal("lock", STEPS.lockin);
const aiR = reveal("ai", STEPS.ai);
/** clamp(p / boom[0]): the story's swing, the bank account drained, the rounds played. */
const swing = calc("swing", PROGRESS, [
  ["div", STEPS.boom[0]],
  ["max", 0],
  ["min", 1],
]);
const BLAST = 0.45;
const broken = calc("broken", boom, [["gt", BLAST + 0.06]]);
const deserted = calc("deserted", boom, [["gt", BLAST]]);
const alive = not(deserted);
/** Labels other than the ERP's go from the explosion on. */
const loud = calc("loud", PROGRESS, [["lt", STEPS.boom[0]]]);
const beforeFire = calc(null, PROGRESS, [["lt", STEPS.fire[0]]]);
// Which label is orange: the one the camera looks at (village.ts's LOOKING).
const looking = (steps: (keyof typeof STEPS)[]) => {
  const [first, ...rest] = steps.map((s) => within(`at-${s}`, STEPS[s]));
  return rest.length
    ? calc(
        null,
        first!,
        rest.map((r) => ["or", r] as CalcOp),
      )
    : first!;
};
const focus = {
  erp: looking(["complex", "generic", "boom"]),
  bank: looking(["unfit"]),
  support: looking(["support"]),
  excel: looking(["excel"]),
  upgrade: looking(["upgrade"]),
  lockin: looking(["lockin"]),
  ai: looking(["ai"]),
  patches: looking(["tinker"]),
  connectors: looking(["plug"]),
};

// ── The island, its edge fence and paths ─────────────────────────────────────

part("islands");
box([-36, -36, -1.2], [72, 72, 1.2], { tone: [0.05, 0.12, 0.2], layer: -1, decor: false });
box([-59, -30, 14], [0, 0, 0], { look: "ghost", layer: -1, decor: false });
for (const [at, size] of [
  [
    [-59, -30, -1.2],
    [18, 26, 1.2],
  ],
  [
    [-33, -59, -1.2],
    [18, 18, 1.2],
  ],
  [
    [-59, 1, -1.2],
    [18, 18, 1.2],
  ],
  [
    [-10, -57, -1.2],
    [18, 16, 1.2],
  ],
] as [Vec3, Vec3][])
  box(at, size, { tone: [0.05, 0.12, 0.2], layer: -1 });

/** The points of `wire` laid up to `len` (village.ts's `laid`). */
function laidOf(pts: Vec3[], len: number): Vec3[] {
  const laid: Vec3[] = [pts[0]!];
  let acc = 0;
  for (let k = 0; k + 1 < pts.length && acc < len; k++) {
    const a = pts[k]!;
    const b = pts[k + 1]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const take = Math.min(l, len - acc);
    laid.push([
      a[0] + ((b[0] - a[0]) * take) / l,
      a[1] + ((b[1] - a[1]) * take) / l,
      a[2] + ((b[2] - a[2]) * take) / l,
    ]);
    acc += take;
  }
  return laid;
}
/** `wire` of village.ts, but its pulse (a conveyor) or its blinking end. */
function wireBody(laid: Vec3[], len: number, x: Extra = {}): void {
  polyline(laid, "ink", x);
  polyline(
    laid.map((q) => [q[0] + 0.25, q[1] + 0.25, q[2]] as Vec3),
    "dim",
    x,
  );
  for (let d = 2; d < len; d += 4) {
    const q = along(laid, d);
    seg([q[0] - 0.3, q[1] - 0.3, q[2]], [q[0] + 0.3, q[1] + 0.3, q[2]], "ink", x);
  }
}

part("wires");
const routes: Vec3[][] = [
  [
    [-4, -7.1, 0.05],
    [-4, -29.4, 0.05],
  ],
  [
    [-6, -7.1, 0.05],
    [-6, -22, 0.05],
    [-22.9, -22, 0.05],
  ],
  [
    [-7.1, -5, 0.05],
    [-15, -5, 0.05],
    [-15, -9, 0.05],
    [-22.9, -9, 0.05],
  ],
];
for (const r of routes) {
  const L = pathLength(r);
  const laid = laidOf(r, L);
  if (pathLength(laid) !== L) throw new Error("a laid wire is not as long as its route");
  wireBody(laid, L);
  // The pulse: dot(along(laid, (t·3) % L)), a conveyor (its copy follows the root's blocks).
  conveyor("pulse1", laid, 3, 0);
}
{
  // The wire to the shack, run out three units at a time while it tinkers.
  const shack: Vec3[] = [
    [7.1, 2, 0.05],
    [20, 2, 0.05],
    [20, 14.9, 0.05],
  ];
  const L = pathLength(shack);
  const stage = calc("shack", tinker, [["mul", L], ["div", 3], ["floor"]]);
  const blink = tick(6, 0, 2);
  for (let m = 1; m * 3 < L; m++) {
    const len = m * 3;
    const laid = laidOf(shack, len);
    const on = calc(null, stage, [["eq", m]]);
    wireBody(laid, len, { visible: on });
    dot(laid[laid.length - 1]!, { if: blink, then: "accent", else: "ink" }, 2, { visible: on });
  }
}
{
  // A thin cable to the marketing tower, held down by clips, a pulse running along it.
  const cable: Vec3[] = [
    [7.1, -5, 0.05],
    [14, -5, 0.05],
  ];
  polyline(cable, "ink");
  polyline(
    cable.map((q) => [q[0] + 0.25, q[1] + 0.25, q[2]] as Vec3),
    "dim",
  );
  const L = pathLength(cable);
  for (let d = 2; d < L; d += 4) {
    const q = along(cable, d);
    seg([q[0] - 0.3, q[1] - 0.3, 0.05], [q[0] + 0.3, q[1] + 0.3, 0.05], "ink");
  }
  conveyor("pulse1", cable, 3, 0);
}

// ── Scenery: trees, flowers, a pond, clouds ──────────────────────────────────

part("scenery");
function tree(x: number, y: number, s: number): void {
  box([x - 0.3, y - 0.3, 0], [0.6, 0.6, 1.6 * s]);
  box([x - 1.3 * s, y - 1.3 * s, 1.6 * s], [2.6 * s, 2.6 * s, 2 * s], { tone: [0.3, 0.2, 0.35] });
  box([x - 0.8 * s, y - 0.8 * s, 3.6 * s], [1.6 * s, 1.6 * s, 1.2 * s], {
    tone: [0.3, 0.2, 0.35],
  });
}
for (let k = 0; k < 46; k++) {
  const x = (hash(k, 1) - 0.5) * 68;
  const y = (hash(k, 2) - 0.5) * 68;
  const busy =
    [
      [0, 0, 14],
      [-26, -22, 10],
      [16, -5, 8],
      [-26, -9, 7],
      [20, 18, 9],
      [-4, -31, 9],
      [6, 20, 8],
      [-18, 2, 8],
      [-30, 2, 7],
      [-10, 29, 5],
    ].some(([cx, cy, r]) => Math.hypot(x - cx!, y - cy!) < r!) ||
    Math.hypot(x, y) < 18 ||
    [
      ...routes,
      [
        [7.1, 2, 0],
        [20, 2, 0],
        [20, 14.9, 0],
      ] as Vec3[],
    ].some((pts) =>
      pts.slice(1).some((q, i) => {
        const o = pts[i]!;
        const minX = Math.min(o[0], q[0]) - 3.5;
        const maxX = Math.max(o[0], q[0]) + 3.5;
        const minY = Math.min(o[1], q[1]) - 3.5;
        const maxY = Math.max(o[1], q[1]) + 3.5;
        return x > minX && x < maxX && y > minY && y < maxY;
      }),
    ) ||
    (x < -15 && x > -36 && y > -9 && y < 7) ||
    (x > -36 && x < -6 && y > -36 && y < -16) ||
    (x < -6 && x > -28 && y > -5 && y < -1) ||
    (x < -6 && y > 4 && y < 8) ||
    (x < -29 && y > -16 && y < 16) ||
    (x < -10 && y > 7 && y < 11) ||
    (x < -14 && y > -16 && y < 2) ||
    (x < -20 && y < -2 && y > -16) ||
    (x > 7 && x < 17 && y < -3);
  if (busy) continue;
  if (k % 3 === 0) {
    for (let f = 0; f < 6; f++)
      dot(
        [x + (hash(k, f + 9) - 0.5) * 3, y + (hash(k, f + 19) - 0.5) * 3, 0.1],
        f % 3 === 0 ? "accent" : "ink",
        1,
      );
  } else tree(x, y, 0.8 + hash(k, 3) * 0.6);
}
wheel([-10, 29, 0.05], 3.2, X, Y, 0, { ink: "dim" });
// 0.4 + ((t·0.8) % 1)·2.6
wheel(
  [-10, 29, 0.05],
  calc("pond", T, [
    ["mul", 0.8],
    ["mod", 1],
    ["mul", 2.6],
    ["add", 0.4],
  ]),
  X,
  Y,
  0,
  { ink: "faint" },
);
for (let k = 0; k < 4; k++) {
  // ((t·0.6 + k·26) % 100) − 50
  const x = calc(null, T, [
    ["mul", 0.6],
    ["add", k * 26],
    ["mod", 100],
    ["sub", 50],
  ]);
  const y = -30 + k * 18;
  for (let j = 0; j < 3; j++)
    box(
      [{ p: x.slice(1), k: 1, b: j * 2.6 }, y + (j % 2) * 1.4, 24 + (k % 2) * 3],
      [3.4, 2.6, 0.8],
      { look: "ghost" },
    );
}

// ── Finance: a slot machine that always hits 7 7 7, its tank, a bonfire ─────

part("casino");
{
  const sx = -3;
  const sy = -49;
  // One round per stretch of scroll: rounds = clamp(p / boom[0])·9, k its fraction.
  const rounds = calc("rounds", swing, [["mul", 9]]);
  const round = calc("round", rounds, [["floor"]]);
  const k = calc("round-k", rounds, [["sub", round]]);
  box([sx, sy - 4, 0], [5, 8, 10], { floors: 2.5 });
  box([sx + 0.5, sy - 3.5, 10], [4, 7, 1.6], { plate: true });
  box([sx + 5, sy - 2.5, 1.2], [1.2, 5, 0.6]);
  // jackpot = k > 0.62 || (k === 0 && round > 0); blink = jackpot && floor(t·8) % 2 === 0.
  const jackpot = calc("jackpot", k, [
    ["gt", 0.62],
    [
      "or",
      calc(null, k, [
        ["eq", 0],
        ["and", calc(null, round, [["gt", 0]])],
      ]),
    ],
  ]);
  const blink = calc("jackpot-blink", tick(8, 0, 2), [
    ["eq", 0],
    ["and", jackpot],
  ]);
  const light = tick(6, 0, 7);
  for (let l = 0; l < 7; l++)
    dot(
      [sx + 5.02, sy - 3.6 + l * 1.2, 9.4],
      {
        if: calc(null, light, [
          ["eq", l],
          ["or", blink],
        ]),
        then: "accent",
        else: "dim",
      },
      2,
    );
  const front = (a: NumVec, b: NumVec, ink: InkRef = "ink", visible?: Flag) =>
    seg(a, b, ink, { layer: 1, visible });
  for (let r = 0; r < 3; r++) {
    const y0 = sy - 3.7 + r * 2.6;
    const fx = sx + 5.02;
    const z0 = 4.8;
    const z1 = 8.2;
    const w = 2.2;
    front([fx, y0, z0], [fx, y0 + w, z0]);
    front([fx, y0, z1], [fx, y0 + w, z1]);
    front([fx, y0, z0], [fx, y0, z1]);
    front([fx, y0 + w, z0], [fx, y0 + w, z1]);
    // Spinning while k > 0.08 && k < 0.42 + r·0.1.
    const spinning = calc(null, k, [
      ["gt", 0.08],
      ["and", calc(null, k, [["lt", 0.42 + r * 0.1]])],
    ]);
    for (let j = 0; j < 3; j++) {
      // z1 − 0.3 − ((t·14 + r·0.7 + j·1.1) % 3)
      const z = calc(null, T, [
        ["mul", 14],
        ["add", r * 0.7],
        ["add", j * 1.1],
        ["mod", 3],
        ["rsub", z1 - 0.3],
      ]);
      front([fx, y0 + 0.4, z], [fx, y0 + w - 0.4, z], j === 1 ? "ink" : "dim", spinning);
      if (j === 1) front([fx, y0 + 0.4, z], [fx, y0 + w - 0.9, plus(z, -0.9)], "dim", spinning);
    }
    const stopped = not(spinning);
    const ink: InkRef = { if: blink, then: "accent", else: "ink" };
    for (const o of [0, 0.18]) {
      front([fx, y0 + 0.4, z1 - 0.5 - o], [fx, y0 + w - 0.4, z1 - 0.5 - o], ink, stopped);
      front([fx, y0 + 0.4 + o, z1 - 0.5], [fx, y0 + w - 0.8 + o, z0 + 0.4], ink, stopped);
    }
  }
  // The crank: pull = k > 0 && k < 0.14 ? sin((k / 0.14)·π) : 0.
  const pull = calc("pull", 0, []);
  calc(
    "pull",
    k,
    [["div", 0.14], ["mul", Math.PI], ["sin"]],
    calc(null, k, [
      ["gt", 0],
      ["and", calc(null, k, [["lt", 0.14]])],
    ]),
  );
  const piv: Vec3 = [sx + 1.4, sy + 4.05, 6];
  box([piv[0] - 0.6, piv[1], piv[2] - 0.6], [1.2, 0.5, 1.2], { plate: true });
  const L = 4.6;
  const ang = calc("crank", pull, [["mul", 1.7]]);
  const kx = calc(null, ang, [["sin"], ["mul", L], ["add", piv[0]]]);
  const kz = calc(null, ang, [["cos"], ["mul", L], ["add", piv[2]]]);
  const knob: NumVec = [kx, piv[1] + 0.5, kz];
  front([piv[0], piv[1] + 0.5, piv[2]], knob);
  front([piv[0] + 0.15, piv[1] + 0.5, piv[2]], [plus(kx, 0.15), piv[1] + 0.5, kz], "dim");
  dot(knob, "accent", 6, { layer: 1 });
  // The tank: your bank account, drained by the scroll.
  const tx = sx - 3.5;
  const ty = sy - 1.5;
  box([tx - 1.5, ty - 1.5, 0], [3, 3, 11], { look: "ghost" });
  box([tx - 1.8, ty - 1.8, 11], [3.6, 3.6, 0.5], { plate: true });
  const full = 22;
  const level = calc("level", swing, [["rsub", 1], ["mul", full], ["round"]]);
  for (let c = 0; c < full; c++)
    block([tx, ty, 0.2 + c * 0.45], [2.2, 2.2, 0.4], {
      look: "signal",
      visible: calc(null, level, [["gt", c]]),
    });
  label("Your bank account", [tx, ty, 15], {
    to: [tx, ty, 11.5],
    active: focus.bank,
    visible: loud,
  });
  const chute: Vec3[] = [
    [tx + 1.5, ty, 1.5],
    [sx, ty, 3],
  ];
  seg(chute[0]!, chute[1]!, "dim");
  const pouring = calc("pouring", level, [["gt", 0]]);
  // Coins down the chute: along(chute, ((t·1.5 + c/4) % 1)·L), a + d·(s / l) on one segment.
  const d: Vec3 = [
    chute[1]![0] - chute[0]![0],
    chute[1]![1] - chute[0]![1],
    chute[1]![2] - chute[0]![2],
  ];
  const cl = pathLength(chute);
  for (let c = 0; c < 4; c++) {
    const s = calc(null, T, [
      ["mul", 1.5],
      ["add", c / 4],
      ["mod", 1],
      ["mul", cl],
      ["div", cl],
    ]);
    dot(
      [lin(s, d[0], chute[0]![0]), lin(s, d[1], chute[0]![1]), lin(s, d[2], chute[0]![2])],
      "signal",
      2,
      { visible: pouring },
    );
  }
  // The bonfire: crossed logs, flames, sparks; notes fly into it on a 7 7 7.
  const fire0: Vec3 = [sx + 9, sy, 0];
  for (let k2 = 0; k2 < 4; k2++) {
    const a = (k2 / 4) * Math.PI;
    const dx = Math.cos(a) * 1.8;
    const dy = Math.sin(a) * 1.8;
    seg([fire0[0] - dx, fire0[1] - dy, 0.2], [fire0[0] + dx, fire0[1] + dy, 0.6]);
    seg(
      [fire0[0] - dx, fire0[1] - dy + 0.2, 0.2],
      [fire0[0] + dx, fire0[1] + dy + 0.2, 0.6],
      "dim",
    );
  }
  rig("sparks", { at: [fire0[0], fire0[1], 0.4], t: T, n: 7, seed: 777 });
  rig("sparks", { at: [fire0[0], fire0[1], 1.2], t: T, n: 4, seed: 778 });
  for (let k2 = 0; k2 < 6; k2++) {
    const a = age(0.6, k2 / 6);
    dot(
      [
        calc(null, T, [["add", k2 * 2], ["sin"], ["mul", 0.8], ["add", fire0[0]]]),
        fire0[1] + Math.cos(k2 * 3) * 0.8,
        lin(a, 5, 2.5),
      ],
      { if: calc(null, a, [["lt", 0.5]]), then: "alert", else: "dim" },
      1,
      { layer: 1 },
    );
  }
  const notesOn = calc("notes", pouring, [["and", jackpot]]);
  const from: Vec3 = [sx + 5.6, sy, 1.6];
  for (let c = 0; c < 6; c++) {
    const q = age(0.8, c / 6);
    const x = calc(null, q, [
      ["mul", fire0[0] - from[0]],
      ["add", from[0]],
    ]);
    const y = calc(null, q, [
      ["mul", Math.PI],
      ["sin"],
      ["mul", Math.sin(c * 1.7) * 1.2],
      ["add", from[1]],
    ]);
    const z = calc(null, q, [
      ["mul", Math.PI],
      ["sin"],
      ["mul", 4],
      ["add", from[2]],
      ["sub", calc(null, q, [["mul", 0.8]])],
    ]);
    const note = and(notesOn, calc(null, q, [["lt", 0.8]]));
    box([plus(x, -0.6), plus(y, -0.35), z], [1.2, 0.7, 0.08], {
      plate: true,
      look: "signal",
      layer: 1,
      visible: note,
    });
    box([plus(x, -0.3), plus(y, -0.2), plus(z, 0.1)], [0.6, 0.4, 0.4], {
      look: "alert",
      layer: 1,
      visible: and(note, calc(null, q, [["gt", 0.6]])),
    });
  }
}

// ── The customers: their island, rope bridges, houses ────────────────────────

part("customers");
const sag = (x: number) => (x > -41 && x < -36 ? -0.8 * Math.sin(((x + 41) / 5) * Math.PI) : 0);
for (const by of [-22, -9]) {
  for (let x = -41; x <= -36; x += 0.75) {
    const z = sag(x) + 0.05;
    seg(
      [x, by - 1, z],
      [x + (hash(Math.round(x * 4), 3) - 0.5) * 0.2, by + 1, z],
      x % 1.5 === 0 ? "ink" : "dim",
    );
  }
  for (const y of [by - 1.1, by + 1.1]) {
    for (const x of [-41, -36]) seg([x, y, 0], [x, y, 1.9]);
    let prev: Vec3 | null = null;
    for (let x = -41; x <= -36; x += 0.5) {
      const q: Vec3 = [x, y, 1.6 + sag(x) * 0.8];
      if (prev) seg(prev, q, "dim");
      if (Math.round(x * 2) % 2 === 0) seg(q, [x, y, sag(x) + 0.05], "faint");
      prev = q;
    }
  }
}
const HOUSES: [number, number][] = [
  [-57, -29],
  [-52.5, -29],
  [-48, -29],
];
for (const [hx, hy] of HOUSES) {
  box([hx, hy, 0], [3, 3, 2.4], { floors: 1.2 });
  box([hx - 0.3, hy - 0.3, 2.4], [3.6, 3.6, 0.5], { plate: true });
}
seg([-56, -8, 0], [-56, -8, 4]);
wheel([-56, -8, 5], 1.4, [Math.SQRT1_2, -Math.SQRT1_2, 0], Z, 0, { spokes: 3, hub: 0.2 });
label("Customers", [-51, -16, 8], { to: [-51, -16, 3], visible: loud });

// ── Support and sales, the ticket pile, the counters ─────────────────────────

part("desks");
{
  const g = calc("pile", swing, [["mul", swing]]);
  const rateSales = calc(null, swing, [["rsub", 1]]);
  const desk = (cy: number, name: string, f: Flag, pile: boolean) => {
    const cx = -26;
    box([cx - 3, cy - 2, 0], [6, 4, 5], { floors: 1.7 });
    box([cx - 3.5, cy - 2.5, 5], [7, 5, 0.5], { plate: true });
    const wx = cx - 3.02;
    box([wx - 0.8, cy - 1.4, 1.4], [0.8, 2.8, 0.2]);
    if (pile) {
      const px = cx - 2;
      const py = cy - 7;
      rig("pile", { at: [px, py, 0], g });
      // A ticket flying onto the pile once it has started: heap = round(160·g) > 3.
      const flying = calc("flying", T, [
        ["mul", 0.9],
        ["mod", 1],
      ]);
      box(
        [
          lin(flying, px - cx, cx),
          lin(flying, py - cy, cy),
          calc(null, flying, [["mul", Math.PI], ["sin"], ["mul", 4], ["add", 5]]),
        ],
        [0.9, 0.6, 0.15],
        { visible: calc(null, g, [["mul", 160], ["round"], ["gt", 3]]) },
      );
      // It catches: b2 = min(1, (boom − BLAST − 0.03)·3).
      const burning = calc("pile-fire", boom, [["gt", BLAST + 0.03]]);
      const b2 = calc("pile-b2", boom, [
        ["sub", BLAST],
        ["sub", 0.03],
        ["mul", 3],
        ["min", 1],
      ]);
      rig(
        "sparks",
        {
          at: [px, py, 0.5],
          t: T,
          n: calc(null, b2, [["mul", 10], ["add", 4], ["round"]]),
          seed: 300,
        },
        { visible: burning },
      );
      rig(
        "sparks",
        {
          at: [px + 1, py - 1, lin(b2, 1.5, 0)],
          t: T,
          n: calc(null, b2, [["mul", 6], ["round"]]),
          seed: 301,
        },
        { visible: burning },
      );
      rig(
        "smoke",
        {
          top: [px, py, 4],
          t: T,
          n: calc(null, b2, [["mul", 4], ["round"], ["add", 3]]),
          seed: 302,
          rise: 12,
        },
        { visible: burning },
      );
    }
    label(name, [cx, cy, 10], { to: [cx, cy, 5.6], active: f, visible: loud });
    // Counters popping over the desk: shown when hash(floor(cycle), k + 40·pile) <= rate.
    const rate = pile ? swing : rateSales;
    const dollars = pile ? null : calc(null, rate, [["mul", 2], ["round"]]);
    for (let k = 0; k < 4; k++) {
      const cycle = calc(null, T, [
        ["mul", 0.7],
        ["add", k / 4],
      ]);
      const a = calc(null, cycle, [["mod", 1]]);
      const show = calc(null, cycle, [
        ["floor"],
        ["hash", k + (pile ? 40 : 0)],
        ["le", rate],
        ["and", loud],
      ]);
      const at: NumVec = [cx + (k - 1.5) * 1.6, cy - 1, lin(a, 6, 11)];
      if (pile) label("+1 mail", at, { plain: true, ink: "alert", visible: show });
      else
        for (let m = 0; m <= 2; m++)
          label(`+${"$".repeat(1 + m)}`, at, {
            plain: true,
            ink: "signal",
            visible: calc(null, dollars!, [
              ["eq", m],
              ["and", show],
            ]),
          });
    }
  };
  desk(-22, "Support", focus.support, true);
  desk(-9, "Sales", false, false);
}
const DESK_Y = { support: -22, sales: -9 } as const;
const SERVE_X = -30.2;
const LANE_IN = -44.5;
const IN_Y = -0.8;
const OUT_Y = 0.6;
const LANE_OUT = -46.2;
for (const cy of [-22, -9]) {
  seg([LANE_IN, cy + IN_Y, 0], [SERVE_X, cy + IN_Y, 0], "faint", { dash: 2 });
  seg([SERVE_X, cy + OUT_Y, 0], [LANE_OUT, cy + OUT_Y, 0], "faint", { dash: 2 });
}

// ── Walkers: a deterministic crowd (the function's is a simulation) ──────────

/** Set to 0 by the parity test to compare the rest with the function, walkers left out. */
const crowd = calc("crowd-on", "@crowd", []);
part("crowd");
walkers();

// ── Marketing: a telecom tower, its offers spreading round it ────────────────

part("marketing");
{
  const tx = 16;
  const ty = -5;
  const H = 18;
  const legs: [number, number][] = [
    [-2, -2],
    [2, -2],
    [2, 2],
    [-2, 2],
  ];
  const at = (lx: number, ly: number, z: number): Vec3 => [
    tx + lx * (1 - (z / H) * 0.8),
    ty + ly * (1 - (z / H) * 0.8),
    z,
  ];
  for (const [lx, ly] of legs) seg(at(lx, ly, 0), at(lx, ly, H));
  for (let z = 0; z < H; z += 3) {
    for (let i = 0; i < 4; i++) {
      const [ax, ay] = legs[i]!;
      const [bx, by] = legs[(i + 1) % 4]!;
      seg(at(ax, ay, z), at(bx, by, z + 3), "dim");
      seg(at(bx, by, z), at(ax, ay, z + 3), "dim");
      seg(at(ax, ay, z + 3), at(bx, by, z + 3), "dim");
    }
  }
  seg([tx, ty, H], [tx, ty, H + 3]);
  // reach = 1 − clamp(p / boom[0]); the light blinks while it broadcasts.
  const reach = calc("reach", swing, [["rsub", 1]]);
  dot(
    [tx, ty, H + 3.2],
    {
      if: calc(null, reach, [
        ["gt", 0],
        ["and", tick(2, 0, 2)],
      ]),
      then: "accent",
      else: "dim",
    },
    3,
  );
  const aim = Math.atan2(-17 - ty, -50 - tx);
  for (const z of [H - 2, H - 5])
    wheel(at(0.9, 0.9, z), 1.2, [-Math.sin(aim), Math.cos(aim), 0], Z, 0, { spokes: 3, hub: 0.2 });
  const rings = calc(null, reach, [["mul", 3], ["ceil"]]);
  for (let k = 0; k < 3; k++) {
    const a = age(0.5, k / 3);
    const r = calc(null, a, [
      ["mul", 6],
      ["add", 1.5],
    ]);
    const pts: NumVec[] = [];
    for (let j = 0; j <= 24; j++) {
      const an = (j / 24) * TAU;
      pts.push([lin(r, Math.cos(an), tx), lin(r, Math.sin(an), ty), H + 1.6]);
    }
    polyline(
      pts,
      { if: calc(null, a, [["gt", 0.7]]), then: "faint", else: "dim" },
      {
        visible: calc(null, rings, [["gt", k]]),
      },
    );
  }
  label("Marketing", [tx, ty, H + 7], { to: [tx, ty, H + 3.6], active: false, visible: loud });
}

// ── Custom work: a shack nailed together by an arm, broken by the upgrade ────

part("shack");
{
  const c: Vec3 = [20, 18, 0];
  const planks = calc("planks", tinker, [["mul", 18], ["round"]]);
  const breaking = calc("breaking", upgradeR, [
    ["sub", 0.4],
    ["div", 0.6],
    ["max", 0],
    ["min", 1],
  ]);
  for (let k = 0; k < 18; k++) {
    const side = k % 4;
    const h = Math.floor(k / 4) * 1.4 + 0.6;
    const tilt = (hash(k, 11) - 0.5) * 1.6;
    const has = calc(null, planks, [["gt", k]]);
    const off = calc(null, breaking, [
      ["gt", hash(k, 12)],
      ["and", has],
    ]);
    const on = calc(null, off, [["not"], ["and", has]]);
    const corners = (z: number): [Vec3, Vec3] => [
      side === 0
        ? [c[0] - 3, c[1] - 3, z]
        : side === 1
          ? [c[0] + 3, c[1] - 3, z]
          : side === 2
            ? [c[0] + 3, c[1] + 3, z]
            : [c[0] - 3, c[1] + 3, z],
      side === 0
        ? [c[0] + 3.4, c[1] - 3, z + tilt]
        : side === 1
          ? [c[0] + 3, c[1] + 3.4, z + tilt]
          : side === 2
            ? [c[0] - 3.4, c[1] + 3, z + tilt]
            : [c[0] - 3, c[1] - 3.4, z + tilt],
    ];
    {
      const [a, b] = corners(0.1);
      const dx = (hash(k, 13) - 0.5) * 3;
      const dy = (hash(k, 14) - 0.5) * 3;
      seg([a[0] + dx, a[1] + dy, 0.1], [b[0] + dx, b[1] + dy, 0.1], "dim", { visible: off });
    }
    const [a, b] = corners(h);
    seg(a, b, "ink", { visible: on });
    seg([a[0], a[1], a[2] - 0.4], [b[0], b[1], b[2] - 0.4], "dim", { visible: on });
    dot([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], "ink", 1, { visible: on });
  }
  const started = calc("tinkering", tinker, [["gt", 0]]);
  for (const [x, y] of [
    [-3, -3],
    [3, -3],
    [3, 3],
    [-3, 3],
  ] as const)
    seg(
      [c[0] + x, c[1] + y, 0],
      [c[0] + x + (hash(x, y) - 0.5), c[1] + y, lin(tinker, 6, 0)],
      "dim",
      { visible: started },
    );
  // The hammer: 2 + floor(planks / 4)·1.4 + |sin(t·5)|·1.5.
  const reachZ = calc(null, planks, [
    ["div", 4],
    ["floor"],
    ["mul", 1.4],
    ["add", 2],
    ["add", calc(null, T, [["mul", 5], ["sin"], ["abs"], ["mul", 1.5]])],
  ]);
  rig(
    "arm",
    { base: [c[0] + 6, c[1] - 4, 0], target: [c[0] + 3.4, c[1] - 1, reachZ], l1: 5, l2: 5 },
    { visible: started },
  );
  label("Custom patches", [20, 18, 9], {
    to: [20, 18, lin(tinker, 6, 0)],
    active: focus.patches,
    visible: and(started, and(beforeFire, loud)),
  });
}

// ── Integrations: a patch tower and the external apps ────────────────────────

part("connectors");
{
  const c: Vec3 = [-4, -31, 0];
  box([c[0] - 1.5, c[1] - 1.5, 0], [3, 3, 12], { floors: 1 });
  box([c[0] - 2, c[1] - 2, 12], [4, 4, 0.6], { plate: true });
  for (let k = 0; k < 6; k++)
    dot([c[0] + 1.5, c[1], 1 + k * 1.8], { if: tick(3, k, 3), then: "dim", else: "accent" }, 1);
  const shapes: [number, number][] = [
    [2.4, 0],
    [3.6, 1],
    [1.6, 2],
    [4.4, 3],
    [2.8, 1],
    [3.2, 0],
    [2, 3],
    [4, 2],
  ];
  const n = calc("cables", plug, [["mul", 8], ["round"]]);
  for (let i = 0; i < 8; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const ax = -30.5 + col * 4.2;
    const ay = -55.5 + row * 6.5;
    const [h, kind] = shapes[i]!;
    box([ax - 1.4, ay - 1.4, 0], [2.8, 2.8, h], { floors: 1, plate: kind === 0 });
    if (kind === 1) box([ax - 0.8, ay - 0.8, h], [1.6, 1.6, 1.2], { floors: 0.6 });
    if (kind === 2)
      wheel([ax, ay, h + 1.2], 0.9, [Math.SQRT1_2, Math.SQRT1_2, 0], Z, 0, { spokes: 3, hub: 0.2 });
    if (kind === 2) seg([ax, ay, h], [ax, ay, h + 0.6]);
    if (kind === 3) box([ax - 1.1, ay - 1.1, h], [2.2, 2.2, 0.5], { plate: true });
    const port: Vec3 = [ax, ay + 1.45, 0.8];
    box([port[0] - 0.35, port[1], 0.4], [0.7, 0.3, 0.7]);
    const wired = calc(`cable${i}`, n, [["gt", i]]);
    const top: Vec3 = [c[0] + (i % 4) * 0.4 - 0.6, c[1] - 1.8, 11.6];
    const pts: Vec3[] = [];
    for (let s2 = 0; s2 <= 10; s2++) {
      const q = s2 / 10;
      const z = top[2] + (port[2] - top[2]) * q - Math.sin(q * Math.PI) * 4;
      pts.push([
        top[0] + (port[0] - top[0]) * q,
        top[1] + (port[1] - top[1]) * q,
        Math.max(-0.8, z),
      ]);
    }
    polyline(pts, i % 2 ? "dim" : "ink", { visible: wired });
    // along(pts, (t·5 + i·3) % L): a conveyor with a phase.
    conveyor("pulse2", pts, 5, i * 3, wired);
    dot([port[0], port[1] + 0.35, 0.9], { if: tick(4, i, 2), then: "accent", else: "dim" }, 1, {
      visible: wired,
    });
  }
  const many = calc(null, plug, [["gt", 0.3]]);
  label("20,000 connectors", [-4, -31, 16], {
    to: [-4, -31, 12.6],
    active: focus.connectors,
    visible: and(many, loud),
  });
  label("Connectors", [-4, -31, 16], {
    to: [-4, -31, 12.6],
    active: focus.connectors,
    visible: calc(null, many, [["not"], ["and", loud]]),
  });
  label("External apps", [-24, -50, 9], { to: [-24, -50, 5], visible: loud });
}

// ── Shadow Excel: sheds where the real work gets done ────────────────────────

part("excel");
{
  const on = atLeast("excel-on", STEPS.excel[0]);
  const sheds: [number, number][] = [
    [4, 15],
    [9, 20],
    [4, 25],
  ];
  const count = calc("sheds", excelR, [["mul", 3], ["ceil"], ["max", 1]]);
  sheds.forEach(([x, y], i) => {
    const has = calc(null, count, [
      ["gt", i],
      ["and", on],
    ]);
    box([x - 1.5, y - 1.5, 0], [3, 3, 2.6], { floors: 1.3, visible: has });
    box([x - 1.8, y - 1.8, 2.6], [3.6, 3.6, 0.4], { plate: true, visible: has });
    const fx = x + 1.52;
    const line = (a: NumVec, b: NumVec, ink: InkRef = "dim") =>
      seg(a, b, ink, { layer: 1, visible: has });
    for (let r = 0; r <= 3; r++) line([fx, y - 1.1, 0.5 + r * 0.55], [fx, y + 1.1, 0.5 + r * 0.55]);
    for (let col = 0; col <= 4; col++)
      line([fx, y - 1.1 + col * 0.55, 0.5], [fx, y - 1.1 + col * 0.55, 2.15]);
    // The cell being edited: floor(t·2 + i·3) % 12.
    const cell = tick(2, i * 3, 12);
    const cy0 = calc(null, cell, [
      ["mod", 4],
      ["mul", 0.55],
      ["add", y - 1.1],
    ]);
    const cz0 = calc(null, cell, [["div", 4], ["floor"], ["mul", 0.55], ["add", 0.5]]);
    line([fx, cy0, cz0], [fx, plus(cy0, 0.55), plus(cz0, 0.55)], "accent");
    line([fx, plus(cy0, 0.55), cz0], [fx, cy0, plus(cz0, 0.55)], "accent");
    person([x + 2.6, y + 0.2, 0], calc(null, tick(3, i, 2), [["eq", 0]]), and(has, alive));
  });
  // Files flying from shed to shed: k < shown − 1 + (shown === 3 ? 1 : 0).
  for (let k = 0; k < 3; k++) {
    const [ax, ay] = sheds[k]!;
    const [bx, by] = sheds[(k + 1) % 3]!;
    const q = age(0.7, k * 0.37);
    box(
      [
        plus(
          calc(null, q, [
            ["mul", bx - ax],
            ["add", ax],
          ]),
          -0.3,
        ),
        plus(
          calc(null, q, [
            ["mul", by - ay],
            ["add", ay],
          ]),
          -0.2,
        ),
        calc(null, q, [["mul", Math.PI], ["sin"], ["mul", 3], ["add", 2.8]]),
      ],
      [0.6, 0.4, 0.1],
      {
        plate: true,
        layer: 1,
        visible: calc(null, count, [
          ["gt", k === 0 ? 1 : 2],
          ["and", on],
        ]),
      },
    );
  }
  label("Excel", [6, 20, 7], { to: [6, 20, 3.2], active: focus.excel, visible: and(on, loud) });
}

/** `person` of village.ts: a body and a head, `step` (1 or 0) moving the head 0.1 along y. */
function person(at: Vec3, step: P, visible: P): void {
  box([at[0] - 0.3, at[1] - 0.3, at[2]], [0.6, 0.6, 1.1], { visible });
  box(
    [
      at[0] - 0.25,
      calc(null, step, [
        ["mul", 0.1],
        ["add", at[1] - 0.25],
      ]),
      at[2] + 1.15,
    ],
    [0.5, 0.5, 0.5],
    { visible },
  );
}

// ── Upgrade: a tower crane and scaffolding round the pyramid ─────────────────

part("upgrade");
{
  const on = calc("crane", atLeast("upgrade-on", STEPS.upgrade[0]), [["and", not(broken)]]);
  const m: Vec3 = [-17, 0, 0];
  const H = 22;
  const v = { visible: on };
  for (const [lx, ly] of [
    [-0.6, -0.6],
    [0.6, -0.6],
    [0.6, 0.6],
    [-0.6, 0.6],
  ] as const)
    seg([m[0] + lx, m[1] + ly, 0], [m[0] + lx, m[1] + ly, H], "ink", v);
  for (let z = 0; z < H; z += 1.5) {
    seg([m[0] - 0.6, m[1] - 0.6, z], [m[0] + 0.6, m[1] + 0.6, z + 1.5], "dim", v);
    seg([m[0] + 0.6, m[1] - 0.6, z], [m[0] - 0.6, m[1] + 0.6, z + 1.5], "dim", v);
  }
  box([m[0] - 1.6, m[1] - 1.6, 0], [3.2, 3.2, 0.6], { plate: true, ...v });
  // A cycle of 9 s: k = (t % 9) / 9, in six stretches.
  const yard: Vec3 = [-21, 15, 0];
  const top: Vec3 = [0, 0, 7.6];
  const k = calc("crane-k", T, [
    ["mod", 9],
    ["div", 9],
  ]);
  const angA = Math.atan2(yard[1] - m[1], yard[0] - m[0]);
  const angB = Math.atan2(top[1] - m[1], top[0] - m[0]);
  const dA = Math.hypot(yard[0] - m[0], yard[1] - m[1]);
  const dB = Math.hypot(top[0] - m[0], top[1] - m[1]);
  const below = [0.12, 0.24, 0.5, 0.62, 0.72].map((e) => calc(null, k, [["lt", e]]));
  // Stretch i: below[i] and not below[i − 1].
  const stretch = [
    below[0]!,
    ...below.slice(1).map((b, i) => calc(null, below[i]!, [["not"], ["and", b]])),
    not(below[4]!),
  ];
  const q = (from: number, span: number) =>
    calc(null, k, [
      ["sub", from],
      ["div", span],
      ["ease", "glide"],
    ]);
  const ang = calc("crane-ang", angA, []);
  calc(
    "crane-ang",
    q(0.24, 0.26),
    [
      ["mul", angB - angA],
      ["add", angA],
    ],
    stretch[2],
  );
  calc("crane-ang", angB, [], calc(null, stretch[3]!, [["or", stretch[4]!]]));
  calc(
    "crane-ang",
    q(0.72, 0.28),
    [
      ["mul", angA - angB],
      ["add", angB],
    ],
    stretch[5],
  );
  const d = calc("crane-d", dA, []);
  calc(
    "crane-d",
    q(0.24, 0.26),
    [
      ["mul", dB - dA],
      ["add", dA],
    ],
    stretch[2],
  );
  calc("crane-d", dB, [], calc(null, stretch[3]!, [["or", stretch[4]!]]));
  calc(
    "crane-d",
    q(0.72, 0.28),
    [
      ["mul", dA - dB],
      ["add", dB],
    ],
    stretch[5],
  );
  const hook = calc("crane-hook", H - 2, []);
  calc(
    "crane-hook",
    q(0, 0.12),
    [
      ["mul", H - 3],
      ["rsub", H - 2],
    ],
    stretch[0],
  );
  calc(
    "crane-hook",
    q(0.12, 0.12),
    [
      ["mul", H - 3],
      ["add", 1],
    ],
    stretch[1],
  );
  calc(
    "crane-hook",
    q(0.5, 0.12),
    [
      ["mul", H - 2 - 10],
      ["rsub", H - 2],
    ],
    stretch[3],
  );
  calc(
    "crane-hook",
    q(0.62, 0.1),
    [
      ["mul", H - 12],
      ["add", 10],
    ],
    stretch[4],
  );
  const carrying = calc(null, stretch[1]!, [
    ["or", stretch[2]!],
    ["or", stretch[3]!],
    ["and", on],
  ]);
  const cos = calc("crane-cos", ang, [["cos"]]);
  const sin = calc("crane-sin", ang, [["sin"]]);
  /** tip(r) = [m0 + cos(ang)·r, m1 + sin(ang)·r, H] for a literal r. */
  const tip = (r: number, z = H): NumVec => [lin(cos, r, m[0]), lin(sin, r, m[1]), z];
  seg(tip(-5), tip(dB + 1.5), "ink", v);
  seg(tip(-5, H + 0.8), tip(dB + 1.5, H + 0.8), "dim", v);
  seg([m[0], m[1], H + 2.4], tip(dB + 1.5), "dim", v);
  seg([m[0], m[1], H + 2.4], tip(-5), "dim", v);
  seg([m[0], m[1], H], [m[0], m[1], H + 2.4], "ink", v);
  const cwx = calc(null, cos, [
    ["mul", -4.2],
    ["add", m[0]],
  ]);
  const cwy = calc(null, sin, [
    ["mul", -4.2],
    ["add", m[1]],
  ]);
  box([plus(cwx, -0.8), plus(cwy, -0.8), H - 1.6], [1.6, 1.6, 1.6], v);
  const trx = calc(null, cos, [
    ["mul", d],
    ["add", m[0]],
  ]);
  const trY = calc(null, sin, [
    ["mul", d],
    ["add", m[1]],
  ]);
  box([plus(trx, -0.5), plus(trY, -0.5), H - 0.4], [1, 1, 0.5], v);
  seg([trx, trY, H - 0.4], [trx, trY, plus(hook, 0.4)], "dim", v);
  box([plus(trx, -0.9), plus(trY, -0.9), plus(hook, -1.4)], [1.8, 1.8, 1.8], {
    floors: 0.6,
    layer: 0.4,
    visible: carrying,
  });
  for (let i = 0; i < 4; i++)
    box([yard[0] - 2 + (i % 2) * 2.2, yard[1] - 1 + Math.floor(i / 2) * 2.2, 0], [1.8, 1.8, 1.8], {
      floors: 0.6,
      ...v,
    });
  // Scaffolding on the two faces we see: pole n shown while n < ceil(upgrade·14).
  const poles = calc("poles", upgradeR, [["mul", 14], ["ceil"]]);
  let n = 0;
  for (const side of [0, 1])
    for (let s2 = -6; s2 <= 6; s2 += 2.3, n++) {
      const has = calc(null, poles, [
        ["gt", n],
        ["and", on],
      ]);
      const b: Vec3 = side === 0 ? [7.7, s2, 0] : [s2, 7.7, 0];
      seg(b, [b[0], b[1], 8], "ink", { layer: 0.35, visible: has });
      for (const z of [2.6, 5.2, 7.8]) {
        const next: Vec3 = side === 0 ? [7.7, s2 + 2.3, z] : [s2 + 2.3, 7.7, z];
        if (s2 + 2.3 <= 6.5) seg([b[0], b[1], z], next, "dim", { layer: 0.35, visible: has });
      }
    }
  label("Upgrade in progress", [7.7, 5, 13], {
    to: [7.7, 5, 8],
    active: focus.upgrade,
    visible: and(on, loud),
  });
}

// ── Lock-in: a barbed-wire fence, a watchtower, a gate ───────────────────────

part("lockin");
{
  const on = atLeast("lock-on", STEPS.lockin[0]);
  const ring: Vec3[] = [
    [36.4, 36.4, 0],
    [36.4, -36.4, 0],
    [-36.4, -36.4, 0],
    [-36.4, 36.4, 0],
    [36.4, 36.4, 0],
  ];
  const GX = -27;
  const L = pathLength(ring);
  // Posts every 3 units and three barbed wires, up to min(L, lock·1.15·L) along the edge: the
  // `fence` rig (village.ts's loops, ported), open where the gate stands.
  const done = calc("fence", lockR, [
    ["mul", 1.15],
    ["mul", L],
    ["min", L],
  ]);
  rig("fence", { done }, { visible: on });
  // One watchtower, at the left corner, its searchlight sweeping the fence.
  const [x, y] = [-34.6, 34.6];
  const tower = calc("tower", lockR, [
    ["ge", 0.2],
    ["and", on],
  ]);
  const v = { visible: tower };
  for (const [lx, ly] of [
    [-0.8, -0.8],
    [0.8, -0.8],
    [0.8, 0.8],
    [-0.8, 0.8],
  ] as const)
    seg([x + lx, y + ly, 0], [x + lx * 0.6, y + ly * 0.6, 6], "ink", v);
  seg([x - 0.8, y - 0.8, 0], [x + 0.6, y + 0.6, 6], "dim", v);
  box([x - 1, y - 1, 6], [2, 2, 1.4], { floors: 0.7, ...v });
  box([x - 1.3, y - 1.3, 7.4], [2.6, 2.6, 0.3], { plate: true, ...v });
  // a = sin(t·0.7 + i·2)·0.9 + atan2(−y, −x), at i = 0.
  const a = calc("searchlight", T, [
    ["mul", 0.7],
    ["add", 0],
    ["sin"],
    ["mul", 0.9],
    ["add", Math.atan2(-y, -x)],
  ]);
  const spx = calc(null, a, [["cos"], ["mul", 9], ["add", x]]);
  const spy = calc(null, a, [["sin"], ["mul", 9], ["add", y]]);
  seg([x, y, 6.8], [spx, spy, 0.05], "dim", v);
  seg([x, y, 6.8], [plus(spx, 1.2), plus(spy, 1.2), 0.05], "dim", v);
  wheel([plus(spx, 0.6), plus(spy, 0.6), 0.05], 1.1, X, Y, 0, { ink: "ink" }, v);
  // The gate, with its barrier down, beside the watchtower.
  const gate = calc("gate", lockR, [
    ["gt", 0.3],
    ["and", on],
  ]);
  const g = { visible: gate };
  const gx = GX;
  for (const o of [-2.6, 2.6]) seg([gx + o, 28, 0.03], [gx + o, 36.4, 0.03], "dim", g);
  for (let yy = 28.5; yy < 36.4; yy += 1.6) seg([gx, yy, 0.03], [gx, yy + 0.7, 0.03], "faint", g);
  box([gx + 3.4, 29.4, 0], [3.4, 3, 3.6], { floors: 1.2, ...g });
  box([gx + 3, 29, 3.6], [4.2, 3.8, 0.4], { plate: true, ...g });
  const blink = tick(2.5, 0, 2);
  for (const [px, lit] of [
    [gx - 3.2, calc(null, blink, [["eq", 0]])],
    [gx + 3.2, calc(null, blink, [["eq", 1]])],
  ] as const) {
    box([px - 0.35, 35.4, 0], [0.7, 0.7, 5], g);
    box([px - 0.9, 35.3, 3.8], [1.8, 0.9, 0.9], g);
    dot([px - 0.4, 36.25, 4.25], { if: lit, then: "accent", else: "dim" }, 4, { layer: 0.4, ...g });
    dot([px + 0.4, 36.25, 4.25], { if: lit, then: "dim", else: "accent" }, 4, { layer: 0.4, ...g });
  }
  for (let k = 0; k < 12; k++)
    for (const z of [2, 2.3])
      seg(
        [gx - 3.2 + k * 0.55, 35.75, z],
        [gx - 3.2 + (k + 1) * 0.55, 35.75, z],
        k % 2 ? "ink" : "accent",
        { layer: 0.4, ...g },
      );
  label("Vendor lock-in", [gx, 35.8, 9], {
    to: [gx, 35.8, 5.2],
    active: focus.lockin,
    visible: and(gate, loud),
  });
}

// ── AI: an island everyone talks about, cables that never quite work ─────────

part("ai");
{
  const cx = -50;
  const cy = 9;
  box([cx - 2, cy - 2, 0], [4, 4, 6], { floors: 1.5, plate: true });
  wheel([cx, cy, 4], 3.4, X, Y, lin(T, 0.9, 0), { teeth: 10, tooth: 0.4 });
  wheel([cx, cy, 2.5], 3.8, X, Y, lin(T, -0.6, 0), { ink: "dim" });
  // floor(t·7) % 5 === 0 || floor(t·3) % 4 === 1
  const glitch = calc(null, tick(3, 0, 4), [
    ["eq", 1],
    ["or", calc(null, tick(7, 0, 5), [["eq", 0]])],
  ]);
  dot([cx + 2.02, cy, 4.5], { if: glitch, then: "accent", else: "dim" }, 3, { layer: 0.4 });
  for (let k = 0; k < 3; k++)
    box([cx - 5.5, cy - 4 + k * 3, 0], [2, 2, 3.5 + (k % 2)], { floors: 0.8 });
  const sockets = [5, 9, 13];
  for (const sy of sockets) box([-41.6, sy - 0.5, 0.4], [0.5, 1, 1]);
  label("AI", [cx, cy, 11], { to: [cx, cy, 6.4], active: focus.ai, visible: loud });
  const on = atLeast("ai-on", STEPS.ai[0]);
  const v = { visible: on };
  polyline(
    [
      [-7.1, 6, 0.05],
      [-12, 6, 0.05],
      [-12, 9, 0.05],
      [-32, 9, 0.05],
    ],
    "ink",
    v,
  );
  box([-34, 8, 0], [2, 2, 1.6], { floors: 0.8, ...v });
  const from = (i: number): Vec3 => [-34, 8.4 + i * 0.6, 1.2];
  const thick = (pts: Vec3[], visible: P, upTo?: (j: number) => P) => {
    for (const shift of [0, 0.25]) {
      const at = pts.map((q) => (shift ? ([q[0], q[1] + 0.25, q[2]] as Vec3) : q));
      if (!upTo) polyline(at, "ink", { visible });
      else
        for (let j = 0; j + 1 < at.length; j++)
          seg(at[j]!, at[j + 1]!, "ink", { visible: upTo(j) });
    }
  };
  const hang = (a: Vec3, b: Vec3, drop: number) => {
    const pts: Vec3[] = [];
    for (let s2 = 0; s2 <= 10; s2++) {
      const q = s2 / 10;
      pts.push([
        a[0] + (b[0] - a[0]) * q,
        a[1] + (b[1] - a[1]) * q,
        a[2] + (b[2] - a[2]) * q - Math.sin(q * Math.PI) * drop,
      ]);
    }
    return pts;
  };
  // One reaches its socket and misfires: its first max(2, round(reach·11)) points.
  const reach = calc("ai-reach", aiR, [
    ["mul", 3],
    ["min", 1],
  ]);
  const shownPts = calc(null, reach, [["mul", 11], ["round"], ["max", 2]]);
  const c1 = hang(from(0), [-41.4, sockets[2]!, 0.9], 2.2);
  const segOn = new Map<number, P>();
  thick(c1, on, (j) => {
    if (!segOn.has(j))
      segOn.set(
        j,
        calc(null, shownPts, [
          ["ge", j + 2],
          ["and", on],
        ]),
      );
    return segOn.get(j)!;
  });
  const full = calc("ai-full", reach, [
    ["ge", 1],
    ["and", on],
  ]);
  // floor(t·6) % 3 !== 0: a packet along the cable, else sparks at the socket.
  const flowing = calc(null, tick(6, 0, 3), [["eq", 0], ["not"]]);
  conveyor("pulse2", c1, 6, 0, and(full, flowing));
  const sparking = calc(null, flowing, [["not"], ["and", full]]);
  const f6 = calc(null, T, [["mul", 6], ["floor"]]);
  for (let k = 0; k < 8; k++)
    dot(
      [
        calc(null, f6, [
          ["rhash", k],
          ["sub", 0.5],
          ["mul", 2],
          ["add", -41.4],
        ]),
        sockets[2]! + (hash(k, 7) - 0.5) * 2,
        1 + hash(k, 9) * 2,
      ],
      "accent",
      2,
      { visible: sparking },
    );
  // Garbage out: stray pixels above the model, (t·0.9 + k/10) % 1 old.
  for (let k = 0; k < 10; k++) {
    const a = age(0.9, k / 10);
    const seed = calc(null, T, [["mul", 0.9], ["add", k / 10], ["floor"]]);
    dot(
      [
        calc(null, seed, [
          ["rhash", k],
          ["sub", 0.5],
          ["mul", 6],
          ["mul", a],
          ["add", cx],
        ]),
        calc(null, seed, [
          ["rhash", k + 20],
          ["sub", 0.5],
          ["mul", 6],
          ["mul", a],
          ["add", cy],
        ]),
        lin(a, 5, 6.5),
      ],
      k % 3 ? "ink" : "accent",
      2,
      { visible: full },
    );
  }
  const short = calc(null, aiR, [
    ["gt", 0.35],
    ["and", on],
  ]);
  thick(hang(from(1), [-38.5, sockets[0]!, -1], 1.2), short);
  const loose = calc(null, aiR, [
    ["gt", 0.6],
    ["and", on],
  ]);
  thick([from(2), [-34.4, 11.6, 0.1], [-33.4, 12.4, 0.1]], loose);
  box([-33.6, 12.2, 0], [0.6, 0.6, 0.4], { visible: loose });
}

// ── The ERP: a stepped pyramid with two chimneys; then it blows ──────────────

part("erp");
{
  const chimneys: [number, number, number][] = [
    [2.6, -6.1, 7],
    [4.6, -6.1, 8],
  ];
  // Paint order: base, middle tier, chimneys, top tier, then everything on top (layer 0.3).
  box([-7, -7, 0], [14, 14, 4], { floors: 1.33, vents: true, layer: 0.1 });
  box([-5, -5, 4], [10, 10, 3.6], { floors: 1.2, plate: true, layer: 0.2 });
  for (const [x, y, h] of chimneys)
    box([x - 0.8, y - 0.8, 4], [1.6, 1.6, Math.max(0.3, h * (1 - 0.7 * 0))], {
      floors: 1.5,
      layer: 0.15,
    });
  const n = calc("chimney-n", generic, [
    ["mul", 10],
    ["add", calc(null, boom, [["mul", 8]])],
    ["add", calc(null, fire, [["mul", 12]])],
    ["round"],
    ["add", 4],
  ]);
  const rise = calc("chimney-rise", generic, [
    ["mul", 2],
    ["add", 5],
    ["add", calc(null, fire, [["mul", 2]])],
  ]);
  const thick = calc("chimney-thick", generic, [
    ["mul", 0.6],
    ["add", 1],
    ["add", calc(null, boom, [["mul", 0.4]])],
    ["add", calc(null, fire, [["mul", 0.8]])],
  ]);
  chimneys.forEach(([x, y, h], i) =>
    rig("smoke", { top: [x, y, 4 + h], t: T, n, seed: i, rise, thick }, { layer: 0.3 }),
  );
  // The blast: b = (boom − BLAST) / (1 − BLAST) once boom > BLAST.
  const blown = deserted;
  const b = calc("blast", boom, [
    ["sub", BLAST],
    ["div", 1 - BLAST],
  ]);
  rig("burst", { b }, { layer: 0.3, visible: blown });
  const catching = calc("catching", b, [
    ["mul", 3],
    ["min", 1],
  ]);
  const catches = calc(null, catching, [
    ["gt", 0],
    ["and", blown],
  ]);
  rig(
    "sparks",
    {
      at: [-2, -2, 7.6 * (1 - 0.7 * 0)],
      t: T,
      n: calc(null, catching, [["mul", 5], ["add", 2], ["round"]]),
      seed: 840,
    },
    { visible: catches },
  );
  rig(
    "sparks",
    {
      at: [2, 2, 7.6 * (1 - 0.7 * 0)],
      t: T,
      n: calc(null, catching, [["mul", 4], ["add", 1], ["round"]]),
      seed: 841,
    },
    { visible: catches },
  );
  rig("mushroom", { b, fire, t: T }, { visible: blown });
  // Once it has blown, the fire runs round the tiers.
  const ring = calc("tiers-fire", boom, [
    ["sub", BLAST],
    ["sub", 0.06],
    ["mul", 2.5],
    ["min", 1],
  ]);
  const ringN = calc(null, ring, [["mul", 3], ["add", 1], ["round"]]);
  for (const [zz, r] of [
    [0, 7],
    [4, 5],
  ] as const)
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4;
      rig(
        "sparks",
        {
          at: [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, zz === 0 ? 4 : 7.6],
          t: T,
          n: ringN,
          seed: 400 + zz * 10 + k,
        },
        { visible: broken },
      );
    }
  const early = calc(null, fire, [
    ["lt", 0.3],
    ["and", broken],
  ]);
  label("ERP", [0, 0, 15], { to: [0, 0, 7.7], active: focus.erp, visible: not(broken) });
  label("ERP - not responding", [0, 0, 34], { to: [0, 0, 7.7], active: focus.erp, visible: early });
  label("ERP - not responding", [0, 0, 15], {
    to: [0, 0, 7.7],
    active: focus.erp,
    visible: calc(null, early, [["not"], ["and", broken]]),
  });
}

// ── Ash settles on the island; the village catches ───────────────────────────

part("ruin");
{
  // The first round(fire·140) specks of ash: the `ash` rig.
  rig("ash", { n: calc("ash", fire, [["mul", 140], ["round"]]) });
  const spots: Vec3[] = [
    [-6.5, -50.5, 11.5],
    [-0.5, -49, 10.6],
    [16, -5, 2],
    [20, 18, 1],
    [-4, -31, 12],
    [0, 0, 1],
    [-6, -2, 0.5],
    [5, 4, 0.5],
  ];
  for (let k = 0; k < 10; k++)
    spots.push([(hash(k, 601) - 0.5) * 60, (hash(k, 602) - 0.5) * 60, 0.2]);
  const lit = calc("lit", fire, [["mul", spots.length], ["ceil"]]);
  const flameN = calc(null, fire, [["mul", 3], ["round"], ["add", 2]]);
  const smokeN = calc(null, fire, [["mul", 3], ["round"], ["add", 3]]);
  const smokeThick = calc(null, fire, [["add", 1]]);
  spots.forEach((s, i) => {
    const on = calc(null, lit, [["gt", i]]);
    rig("sparks", { at: s, t: T, n: flameN, seed: i }, { visible: on });
    if (i % 2 === 0)
      rig(
        "smoke",
        { top: [s[0], s[1], s[2] + 2], t: T, n: smokeN, seed: 20 + i, rise: 10, thick: smokeThick },
        { visible: on },
      );
  });
}

// ── Walkers ──────────────────────────────────────────────────────────────────

/**
 * The customers walk from their houses to a desk and back, as in the function, but on fixed
 * loops instead of a simulation. Walker `w` lives in house `w % 3`; every `PERIOD` seconds it
 * walks out at its own time to sales or to support (`hash(w, trip) < 0.15 + swing·0.75`, the
 * function's choice, per trip), waits in line while the line moves up to the window, and walks
 * home, where it stays in until its next trip. Each stage of a trip is a conveyor of one copy
 * (walking, then the slow line, then walking), shown during its window of the period (`blink`
 * tracks, to a 60th of a second); the walkers turn into the inbound lane at even intervals, and
 * both desks take as long from there to where the return lanes meet, so that walkers sharing a
 * lane keep their distance.
 */
function walkers(): void {
  const SPEED = 4.2;
  const PERIOD = 30;
  const RATE = 60;
  const N = 18;
  const SLOT = 1.3;
  const IN_ROW = -24.6;
  const OUT_ROW = -23.4;
  const door = (h: number): [number, number] => [HOUSES[h]![0] + 1.5, HOUSES[h]![1] + 3.3];
  /** The drawn points of a route (0.4 to the right of the way walked, village.ts's `shown`; a
   * corner turned on the bisector), on the bridges' sag at three points of each crossing. */
  const shownPath = (raw: [number, number][]): Vec3[] => {
    const dirs = raw.slice(1).map((b, i) => {
      const a = raw[i]!;
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return [(b[0] - a[0]) / l, (b[1] - a[1]) / l] as const;
    });
    const out: Vec3[] = [];
    raw.forEach(([x, y], i) => {
      const [ux, uy] = dirs[Math.min(i, dirs.length - 1)]!;
      const [vx, vy] = dirs[Math.max(0, i - 1)]!;
      const ox = ((uy + vy) / 2) * 0.4;
      const oy = (-(ux + vx) / 2) * 0.4;
      if (i > 0 && raw[i - 1]![1] === y) {
        const [px] = raw[i - 1]!;
        const crossing = [-39.75, -38.5, -37.25].filter((bx) => (bx - px) * (bx - x) < 0);
        for (const bx of px < x ? crossing : crossing.reverse()) out.push([bx, y + oy, sag(bx)]);
      }
      out.push([x + ox, y + oy, sag(x + ox)]);
    });
    return out;
  };
  /** A stage's path, then a drop under the island that makes it last a period (hidden). */
  const padded = (pts: Vec3[], speed: number): Vec3[] => {
    const pad = speed * PERIOD - pathLength(pts);
    if (pad <= 0) throw new Error("a walker's stage is longer than its period");
    const last = pts[pts.length - 1]!;
    return [...pts, [last[0], last[1], last[2] - pad]];
  };
  type Desk = "sales" | "support";
  const QUEUE: Record<Desk, number> = { sales: 0.6, support: 4 * SLOT };
  const routes = (h: number, desk: Desk) => {
    const [dx, dy] = door(h);
    const lane = DESK_Y[desk] + IN_Y;
    const back = DESK_Y[desk] + OUT_Y;
    const q0 = SERVE_X - QUEUE[desk];
    return {
      walkIn: shownPath([
        [dx + 0.4, dy],
        [dx + 0.4, IN_ROW],
        [LANE_IN, IN_ROW],
        [LANE_IN, lane],
        [q0, lane],
      ]),
      queue: shownPath([
        [q0, lane],
        [SERVE_X, lane],
      ]),
      walkOut: shownPath([
        [SERVE_X, lane],
        [SERVE_X, back],
        [LANE_OUT, back],
        [LANE_OUT, OUT_ROW],
        [dx - 0.4, OUT_ROW],
        [dx - 0.4, dy],
      ]),
      corner: Math.abs(IN_ROW - dy) + Math.abs(LANE_IN - (dx + 0.4)),
      // From the window to where the return lanes of the two desks meet.
      junction: back - lane + (SERVE_X - LANE_OUT) + (back - (DESK_Y.support + OUT_Y)),
    };
  };
  // Sales serves in 0.9 s; support takes as long as makes both desks equal from the corner of
  // the inbound lane to where the return lanes meet (about 6 s more: it was 1 to 6 s, and a line).
  const SALES_WAIT = 0.9;
  const timeTo = (desk: Desk) => {
    const r = routes(0, desk);
    return (pathLength(r.walkIn) - r.corner + r.junction) / SPEED;
  };
  const WAIT: Record<Desk, number> = {
    sales: SALES_WAIT,
    support: SALES_WAIT + timeTo("sales") - timeTo("support"),
  };
  const choice = calc("crowd-support", swing, [
    ["mul", 0.75],
    ["add", 0.15],
  ]);
  const twice = calc(null, swing, [["mul", 2]]);
  for (let w = 0; w < N; w++) {
    const h = w % 3;
    // Walkers turn into the inbound lane every PERIOD / N seconds.
    const t0 = (w * PERIOD) / N - routes(h, "sales").corner / SPEED;
    /** A blink window of the period: on from `from` for `span` seconds after the door. */
    const window = (name: string, from: number, span: number): P => {
      roots.push(name);
      calcs.push({
        kind: "blink",
        target: "",
        channel: `param:${name}`,
        rate: RATE,
        period: PERIOD * RATE,
        on: Math.round(span * RATE),
        seed: (((-t0 * RATE) % (PERIOD * RATE)) + PERIOD * RATE) % (PERIOD * RATE),
        at: Math.round(from * RATE),
      });
      return `@${name}`;
    };
    // The trip counts the doors walked out of: the desk is chosen per trip.
    const trip = calc(`walker${w}-trip`, T, [["sub", t0], ["div", PERIOD], ["floor"]]);
    const support = calc(null, trip, [
      ["rhash", w],
      ["lt", choice],
    ]);
    const tickets = calc(null, trip, [
      ["add", 1000],
      ["rhash", w],
      ["mul", 3],
      ["add", twice],
      ["floor"],
      ["add", 1],
    ]);
    const ticket = [0, 1, 2, 3, 4].map((j) => (j === 0 ? true : calc(null, tickets, [["gt", j]])));
    roots.push(`walker${w}-step`);
    calcs.push({
      kind: "blink",
      target: "",
      channel: `param:walker${w}-step`,
      rate: 4,
      period: 2,
      on: 1,
      seed: w,
    });
    for (const desk of ["sales", "support"] as const) {
      const r = routes(h, desk);
      const route = calc(
        null,
        support,
        desk === "support" ? [["and", crowd]] : [["not"], ["and", crowd]],
      );
      const queueSpeed = QUEUE[desk] / WAIT[desk];
      let start = 0;
      for (const [stage, pts, speed, carrying] of [
        ["in", r.walkIn, SPEED, true],
        ["queue", r.queue, queueSpeed, true],
        ["out", r.walkOut, SPEED, false],
      ] as const) {
        const path = padded(pts, speed);
        const L = pathLength(path);
        const span = pathLength(pts) / speed;
        conveyors.push({
          kind: "conveyor",
          use: "walker",
          path,
          count: 1,
          speed,
          phase: (((-(t0 + start) * speed) % L) + L) % L,
          params: {
            route,
            window: window(`walker${w}-${desk}-${stage}`, start, span),
            body: alive,
            step: `@walker${w}-step`,
            parcel: carrying && desk === "sales",
            ...Object.fromEntries(
              ticket.map((f, j) => [`ticket${j}`, carrying && desk === "support" ? f : false]),
            ),
          },
        });
        start += span;
      }
    }
  }
}

// ── The file ─────────────────────────────────────────────────────────────────

/** The root params a prim list reads. */
function reads(value: unknown, out: Set<string>): Set<string> {
  if (typeof value === "string" && value.startsWith("@")) out.add(value.slice(1));
  else if (Array.isArray(value)) for (const v of value) reads(v, out);
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.p === "string" && ("k" in o || "b" in o)) out.add(o.p);
    for (const v of Object.values(o)) reads(v, out);
  }
  return out;
}

/** The value of each root param at t = 0, progress 0 (the defaults: the still picture). */
function defaults(): Record<string, number> {
  const scope: Record<string, number> = { t: 0, progress: 0, crowd: 1 };
  for (const name of roots) scope[name] ??= 0;
  const value = (x: unknown) => (typeof x === "string" ? scope[x.slice(1)]! : (x as number));
  const EASE: Record<string, (q: number) => number> = { glide };
  for (const track of calcs) {
    if (track.kind === "blink") {
      const m = Math.floor(0 * track.rate + track.seed) % track.period;
      const at = track.at ?? 0;
      scope[track.channel.slice(6)] = m >= at && m < at + track.on ? 1 : 0;
      continue;
    }
    if (track.kind !== "calc") continue;
    let v = 0;
    let write = true;
    for (const [op, x] of [["load", track.from], ...track.ops] as [string, unknown][]) {
      const o = op === "ease" ? 0 : value(x);
      const b = (c: boolean) => (c ? 1 : 0);
      switch (op) {
        case "load":
          v = o;
          break;
        case "add":
          v = v + o;
          break;
        case "sub":
          v = v - o;
          break;
        case "rsub":
          v = o - v;
          break;
        case "mul":
          v = v * o;
          break;
        case "div":
          v = v / o;
          break;
        case "rdiv":
          v = o / v;
          break;
        case "mod":
          v = v % o;
          break;
        case "min":
          v = Math.min(v, o);
          break;
        case "max":
          v = Math.max(v, o);
          break;
        case "pow":
          v = Math.pow(v, o);
          break;
        case "floor":
          v = Math.floor(v);
          break;
        case "ceil":
          v = Math.ceil(v);
          break;
        case "round":
          v = Math.round(v);
          break;
        case "abs":
          v = Math.abs(v);
          break;
        case "sqrt":
          v = Math.sqrt(v);
          break;
        case "sin":
          v = Math.sin(v);
          break;
        case "cos":
          v = Math.cos(v);
          break;
        case "lt":
          v = b(v < o);
          break;
        case "le":
          v = b(v <= o);
          break;
        case "gt":
          v = b(v > o);
          break;
        case "ge":
          v = b(v >= o);
          break;
        case "eq":
          v = b(v === o);
          break;
        case "and":
          v = b(!!v && !!o);
          break;
        case "or":
          v = b(!!v || !!o);
          break;
        case "not":
          v = b(!v);
          break;
        case "hash":
          v = hash(v, o);
          break;
        case "rhash":
          v = hash(o, v);
          break;
        case "ease":
          v = EASE[x as string]!(v);
          break;
        case "when":
          if (!o) write = false;
          break;
        default:
          throw new Error(`no op ${op}`);
      }
      if (!write) break;
    }
    if (write) scope[track.channel.slice(6)] = v;
  }
  return scope;
}

// What the page talks to (the progress var, the story machine, the camera's shots and fit box)
// is kept from the file as it is: only the picture and its motion are written here.
const previous = JSON.parse(readFileSync(OUT, "utf8")) as BlueprintFile;
const kept = previous.scenes!["erp-village"]!;
const scene: Partial<Scene> = {
  title: kept.title,
  description: kept.description,
  depth: kept.depth,
  camera: kept.camera,
  vars: kept.vars,
  machines: kept.machines,
};
const values = defaults();
// A value only one part reads, and no track, is written into that part's own params (its
// instance's), not into the root scope: a smaller file, and a smaller root scope for the page.
const readByTracks = reads(
  [
    ...calcs.map((c) => (c.kind === "calc" ? [c.from, c.ops] : [])),
    ...conveyors.map((c) => (c.kind === "conveyor" ? c.params : [])),
  ],
  new Set(),
);
const readers = new Map<string, string[]>();
for (const [name, list] of parts)
  for (const n of reads(list, new Set())) readers.set(n, [...(readers.get(n) ?? []), name]);
const own = new Map<string, string>();
for (const [n, by] of readers)
  if (roots.includes(n) && by.length === 1 && !readByTracks.has(n)) own.set(n, by[0]!);
for (const track of calcs)
  if (track.kind === "calc" || track.kind === "blink") {
    const n = track.channel.slice(6);
    if (own.has(n)) track.target = own.get(n)!;
  }
const partDefs: Record<string, Part> = {};
const instances: Instance[] = [];
for (const [name, list] of parts) {
  if (!list.length) continue;
  const used = [...reads(list, new Set())];
  const passed = used.filter((n) => !own.has(n));
  partDefs[name] = {
    ...(used.length
      ? {
          params: Object.fromEntries(
            used.map((n) => [n, { type: "number" as const, default: values[n] ?? 0 }]),
          ),
        }
      : {}),
    prims: list,
  };
  instances.push({
    id: name,
    use: name,
    ...(passed.length
      ? { params: Object.fromEntries(passed.map((n) => [n, `@${n}` as const])) }
      : {}),
  });
}
// The parts the conveyors carry: a pulse on a wire.
partDefs.pulse1 = { prims: [{ kind: "dot", at: [0, 0, 0], ink: "ink", size: 1, decor: true }] };
partDefs.pulse2 = {
  params: { on: { type: "flag", default: true } },
  prims: [{ kind: "dot", at: [0, 0, 0], ink: "ink", size: 2, decor: true, visible: "@on" }],
};
// A walker the crowd's conveyors carry: village.ts's `person` (a body and a head that bobs with
// `step`), its parcel or its tickets; shown while on its `route` and in its `window`.
partDefs["walker-person"] = {
  params: {
    body: { type: "flag", default: true },
    step: { type: "number", default: 0 },
    parcel: { type: "flag", default: false },
    ...Object.fromEntries(
      [0, 1, 2, 3, 4].map((j) => [`ticket${j}`, { type: "flag" as const, default: false }]),
    ),
  },
  prims: [
    { kind: "box", at: [-0.3, -0.3, 0], size: [0.6, 0.6, 1.1], decor: true, visible: "@body" },
    {
      kind: "box",
      at: [-0.25, { p: "step", k: 0.1, b: -0.25 }, 1.15],
      size: [0.5, 0.5, 0.5],
      decor: true,
      visible: "@body",
    },
    { kind: "box", at: [-0.9, -0.4, 1], size: [0.8, 0.8, 0.5], decor: true, visible: "@parcel" },
    ...[0, 1, 2, 3, 4].map((j): Prim => ({
      kind: "box",
      at: [-0.9, -0.4, 1 + j * 0.25],
      size: [0.8, 0.8, 0.2],
      decor: true,
      visible: `@ticket${j}`,
    })),
  ],
};
const personParams = partDefs["walker-person"].params!;
const pass = (names: string[]) => Object.fromEntries(names.map((n) => [n, `@${n}` as const]));
const assemblies: BlueprintFile["assemblies"] = {
  "walker-window": {
    params: { window: { type: "flag", default: false }, ...personParams },
    instances: [
      {
        id: "person",
        use: "walker-person",
        visible: "@window",
        params: pass(Object.keys(personParams)),
      },
    ],
  },
  walker: {
    params: {
      route: { type: "flag", default: false },
      window: { type: "flag", default: false },
      ...personParams,
    },
    instances: [
      {
        id: "window",
        use: "walker-window",
        visible: "@route",
        params: pass(["window", ...Object.keys(personParams)]),
      },
    ],
  },
};
const out: BlueprintFile = {
  $schema: previous.$schema,
  version: 1,
  id: "site/erp-village",
  parts: partDefs,
  assemblies,
  scenes: {
    "erp-village": {
      ...scene,
      root: {
        params: {
          crowd: { type: "number", default: 1 },
          ...Object.fromEntries(
            roots
              .filter((n) => !own.has(n))
              .map((n) => [n, { type: "number" as const, default: values[n]! }]),
          ),
        },
        instances,
      },
      timelines: { story: { tracks: [...calcs, ...conveyors] } },
    } as Scene,
  },
};
writeFileSync(OUT, writeBlueprint(out));
spawnSync("bunx", ["oxfmt", OUT], { stdio: "inherit" });
console.log(
  `${OUT}: ${parts.reduce((n, [, l]) => n + l.length, 0)} prims in ${parts.length} parts, ${roots.length} root params, ${calcs.length} calc tracks, ${conveyors.length} conveyors`,
);
