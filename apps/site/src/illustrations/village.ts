/**
 * The ERP village (home page opening): an island of absurd machines, one per department, around
 * the ERP itself, a stepped pyramid with two chimneys, with a customers' island over a rope
 * bridge and an island of external apps. The scroll drives the story through
 * `villageStore.progress`: it tinkers (a nailed-together shack), goes generic (smoke), plugs into
 * everything (cables), breaks (the support's ticket pile catches, the ERP explodes, scrubbed by
 * the scroll), and burns.
 *
 * The site plays the village from data (`library/erp-village.bp`, written by
 * `scripts/blueprint/village.ts` from this function's computations); this function stays as the
 * reference its parity test compares with, the walkers aside (docs/blueprint/engine.md, "Village
 * as data notes").
 */
import type { Block, Vec3 } from "@forgeron/blueprint";
import {
  along,
  arm,
  block,
  box,
  dot,
  glide,
  pathLength,
  polyline,
  seg,
  wheel,
  X,
  Y,
  Z,
} from "./parts";
import { STEPS } from "./steps";

/** Scroll progress of the story, 0 to 1, read by every frame: the page sets it on the canvas. */
export const villageStore = { progress: 0 };

// The story's steps (`steps.ts`): the page reads them without loading this module.
export { STEPS } from "./steps";

// Where the camera looks at each step, and how close, and the box that frames the island: the
// shots and the fit box of `library/erp-village.bp`, read by the page.

const TAU = Math.PI * 2;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const reveal = (p: number, [a, b]: readonly [number, number]) => clamp((p - a) / (b - a));

function hash(x: number, y = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Puffs rising from a chimney top: horizontal rings that grow, drift and thin out. */
function smoke(
  out: Block[],
  top: Vec3,
  t: number,
  n: number,
  seed: number,
  rise = 9,
  thick = 1,
): void {
  // Thicker smoke is more puffs, packed tighter, not bigger ones: small squiggles in a low plume.
  for (let k = 0; k < n; k++) {
    const age = (t * 0.28 + k / n + hash(seed, k) * 0.1) % 1;
    const jx = (hash(seed, k + 100) - 0.5) * 1.6 * thick;
    const jy = (hash(seed, k + 200) - 0.5) * 1.6 * thick;
    const c: Vec3 = [
      top[0] + age * 3 + jx + Math.sin(age * 5 + seed) * 0.6,
      top[1] - age * 1.5 + jy,
      top[2] + age * rise,
    ];
    // A small squiggle, not a ring: three short strokes zigzagging up, wobbling with time.
    const len = 0.5 + age * 0.6;
    const wob = Math.sin(t * 6 + k * 1.3) * 0.25;
    const ink = age > 0.7 ? "faint" : "dim";
    let prev: Vec3 = [c[0] - len, c[1], c[2]];
    for (let j = 1; j <= 3; j++) {
      const q: Vec3 = [
        c[0] - len + (j * 2 * len) / 3,
        c[1] + (j % 2 ? 0.3 : -0.3) + wob,
        c[2] + j * 0.25,
      ];
      seg(out, prev, q, ink);
      prev = q;
    }
  }
}

/** Flames on a roof: ember tongues that flicker, and sparks drifting up. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer4 = (x: number, y: number) => BAYER4[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)]!;

function flames(out: Block[], c: Vec3, t: number, n: number, seed: number): void {
  // Pixel-art flames in one colour: the shape is a grid of red pixels whose density, dithered
  // through a 4×4 Bayer matrix like the rest of the site, is full at the root and the core and
  // thins out towards the edges and the tip. Three stepped frames, like a sprite; one flame in
  // three is a big one.
  const frame = Math.floor(t * 6);
  const S = 0.2;
  for (let k = 0; k < n; k++) {
    const ox = (hash(seed, k) - 0.5) * 4;
    const oy = (hash(seed, k + 50) - 0.5) * 4;
    const f = (frame + k) % 3;
    const big = k % 3 === 0;
    const rows = (big ? 13 : 9) + (f === 1 ? 1 : 0);
    const half = big ? 4 : 3;
    const sway = f === 0 ? -1 : f === 2 ? 1 : 0;
    for (let i = 0; i < rows; i++) {
      const q = i / rows;
      const w = half * Math.pow(1 - q, 0.75);
      const shift = Math.round(sway * q * q * 2);
      for (let j = -half; j <= half; j++) {
        const d = Math.abs(j) / Math.max(0.5, w);
        if (d > 1) continue;
        // Plenty of holes, like the rest of the dither: never solid, thinner up and out.
        const density = (0.72 - q * 0.55) * (1 - d * d * 0.75);
        if (bayer4(j + k * 3, i + f) >= density) continue;
        out.push({
          kind: "dot",
          at: [c[0] + ox + (j + shift) * S, c[1] + oy, c[2] + i * S],
          ink: "alert",
          size: 1,
          layer: 1,
        });
      }
    }
  }
}

/**
 * A connection wire on the ground along `pts`: a cable held down by small clips, with a pulse
 * running along it. `upTo` lays only its first stretch, for a wire still being run out.
 */
function wire(out: Block[], pts: Vec3[], t: number, upTo = Infinity): void {
  const L = pathLength(pts);
  const len = Math.min(L, upTo);
  if (len <= 0) return;
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
  polyline(out, laid, "ink");
  polyline(
    out,
    laid.map((q) => [q[0] + 0.25, q[1] + 0.25, q[2]] as Vec3),
    "dim",
  );
  for (let d = 2; d < len; d += 4) {
    const q = along(laid, d);
    seg(out, [q[0] - 0.3, q[1] - 0.3, q[2]], [q[0] + 0.3, q[1] + 0.3, q[2]], "ink");
  }
  if (len >= L) dot(out, along(laid, (t * 3) % len), "ink", 1);
  else dot(out, laid[laid.length - 1]!, Math.floor(t * 6) % 2 ? "accent" : "ink", 2);
}

/** A small person: body and head; `step` shifts the head a little, for a walk. */
/** Set by the scene each frame: once the ERP has blown, there is nobody left to draw. */
let deserted = false;

function person(out: Block[], at: Vec3, step: boolean): void {
  if (deserted) return;
  box(out, [at[0] - 0.3, at[1] - 0.3, at[2]], [0.6, 0.6, 1.1]);
  box(out, [at[0] - 0.25, at[1] - 0.25 + (step ? 0.1 : 0), at[2] + 1.15], [0.5, 0.5, 0.5]);
}

/**
 * The customers, simulated: each lives in one of the three houses, walks out, crosses to sales
 * or support on the inbound lane, queues, is served at the window, steps left onto the return
 * lane and walks home. Nobody pops in or out: the story only changes where the next trip goes
 * (more and more to support) and how long support takes (longer and longer), so the support
 * queue grows on its own. Walkers keep their distance: one never walks into the one ahead.
 */
type Desk = "sales" | "support";
interface Walker {
  id: number;
  home: number;
  state: "home" | "go" | "queue" | "serve" | "leave";
  pos: [number, number];
  dir: [number, number];
  route: [number, number][];
  desk: Desk;
  timer: number;
  waited: number;
  trips: number;
}
/** Three houses in a row along the island's south edge, doors on their +y face. */
const HOUSES: [number, number][] = [
  [-57, -29],
  [-52.5, -29],
  [-48, -29],
];
const DESK_Y: Record<Desk, number> = { support: -22, sales: -9 };
/** The serving spot in front of the window; the queue runs back from it along the inbound lane. */
const SERVE_X = -30.2;
const SLOT = 1.3;
const LANE_IN = -44.5;
/** The inbound lane runs on the -y side of each bridge, the return lane on the +y side. */
const IN_Y = -0.8;
const OUT_Y = 0.6;
const LANE_OUT = -46.2;
const SPEED = 4.2;
const door = (h: number): [number, number] => [HOUSES[h]![0] + 1.5, HOUSES[h]![1] + 3.3];
/** In front of the houses: out along one row (east), back along the other (west). Both desks
 * lie north of it, so the way in only ever climbs and the way back only ever comes down. */
const IN_ROW = -24.6;
const OUT_ROW = -23.4;
/** A desk with this many in line: the next customer waits at home a little longer. */
const FULL = 8;
const walkers: Walker[] = Array.from({ length: 18 }, (_, id) => ({
  id,
  home: id % 3,
  state: "home" as const,
  pos: door(id % 3),
  dir: [1, 0] as [number, number],
  route: [],
  desk: "sales" as Desk,
  timer: 0.4 + id * 0.6,
  waited: 0,
  trips: 0,
}));
const queues: Record<Desk, Walker[]> = { sales: [], support: [] };
let simT: number | null = null;
/** Where a walker is drawn: a little to one side of the way it walks, so two walkers meeting
 * on one lane pass side by side. Spacing is measured there too. */
const shown = (w: Walker): [number, number] => [
  w.pos[0] + w.dir[1] * 0.4,
  w.pos[1] - w.dir[0] * 0.4,
];

function stepWalkers(dt: number, swing: number): void {
  for (const w of walkers) {
    if (w.state === "home") {
      w.timer -= dt;
      if (w.timer > 0) continue;
      const [dx, dy] = door(w.home);
      // Out of the door only when the doorstep is clear.
      if (walkers.some((o) => o.state !== "home" && Math.hypot(o.pos[0] - dx, o.pos[1] - dy) < 1.6))
        continue;
      w.desk = hash(w.id, w.trips++) < 0.15 + swing * 0.75 ? "support" : "sales";
      if (queues[w.desk].length >= FULL) {
        w.timer = 1.5;
        continue;
      }
      const lane = DESK_Y[w.desk] + IN_Y;
      w.pos = [dx + 0.4, dy];
      w.route = [
        [dx + 0.4, IN_ROW],
        [LANE_IN, IN_ROW],
        [LANE_IN, lane],
      ];
      w.state = "go";
      continue;
    }
    if (w.state === "serve") {
      w.timer -= dt;
      if (w.timer > 0) continue;
      const [dx, dy] = door(w.home);
      const back = DESK_Y[w.desk] + OUT_Y;
      // A step to its left at the window (+y, left on screen too), onto the return lane, then home.
      w.route = [
        [SERVE_X, back],
        [LANE_OUT, back],
        [LANE_OUT, OUT_ROW],
        [dx - 0.4, OUT_ROW],
        [dx - 0.4, dy],
      ];
      w.state = "leave";
      continue;
    }
    // Where it heads: the next corner of its route, or its slot in the queue.
    let target: [number, number] | undefined = w.route[0];
    if (w.state === "queue") {
      const k = queues[w.desk].indexOf(w);
      target = [SERVE_X - k * SLOT, DESK_Y[w.desk] + IN_Y];
    }
    if (!target) continue;
    const vx = target[0] - w.pos[0];
    const vy = target[1] - w.pos[1];
    const d = Math.hypot(vx, vy);
    if (d > 1e-3) w.dir = [vx / d, vy / d];
    // Keep a distance: hold when someone is just ahead going the same way, standing in line, or
    // crossing in front; when two crossing walkers see each other, the lower number goes first.
    let blocked = false;
    for (const o of walkers) {
      if (o === w || o.state === "home") continue;
      // Measured on the lanes themselves: at a corner, the drawn side-step would put the one
      // behind ahead.
      const ox = o.pos[0] - w.pos[0];
      const oy = o.pos[1] - w.pos[1];
      const od = Math.hypot(ox, oy);
      if (od > 1.2 || od < 1e-6) continue;
      const ahead = (ox * w.dir[0] + oy * w.dir[1]) / od;
      if (ahead < 0.25) continue;
      const same = o.dir[0] * w.dir[0] + o.dir[1] * w.dir[1];
      // Whether the other has this one ahead too: if not, it will not stop, so this one does.
      const seen = (-ox * o.dir[0] - oy * o.dir[1]) / od >= 0.25;
      if (same > 0.5 || o.state === "queue" || o.state === "serve" || !seen || o.id < w.id)
        blocked = true;
    }
    if (blocked && w.waited < 3) {
      w.waited += dt;
      continue;
    }
    const move = Math.min(d, SPEED * dt);
    const next: [number, number] = [w.pos[0] + w.dir[0] * move, w.pos[1] + w.dir[1] * move];
    // Whatever the rules above say (a long wait lets it go anyway), never a step into someone.
    const [cx, cy] = shown(w);
    const [nx, ny] = shown({ ...w, pos: next });
    const into = walkers.some((o) => {
      if (o === w || o.state === "home") return false;
      // Two walkers crossing at right angles may brush past; only a file is kept apart.
      if (Math.abs(o.dir[0] * w.dir[0] + o.dir[1] * w.dir[1]) < 0.5 && o.state !== "queue")
        return false;
      const [ox, oy] = shown(o);
      const after = Math.hypot(ox - nx, oy - ny);
      // Only a step that heads at the other counts, not one that slides past it.
      const now = Math.hypot(ox - cx, oy - cy);
      const toward = ((ox - cx) * w.dir[0] + (oy - cy) * w.dir[1]) / (now || 1);
      return after < 0.62 && after < now && toward > 0.3;
    });
    // A jam that lasts (a corner where lanes cross) is broken: the one stuck longest slips by.
    if (into && w.waited < 4) {
      w.waited += dt;
      continue;
    }
    w.waited = 0;
    w.pos = next;
    if (d - move > 1e-3) continue;
    if (w.state === "queue") {
      if (queues[w.desk][0] === w) {
        w.state = "serve";
        w.timer = w.desk === "support" ? 1 + swing * 5 : 0.9;
      }
      continue;
    }
    w.route.shift();
    // Out of the window's way: the next in line may step up.
    if (w.state === "leave" && w.route.length === 4) queues[w.desk].shift();
    if (w.route.length) continue;
    if (w.state === "go") {
      queues[w.desk].push(w);
      w.state = "queue";
    } else {
      w.state = "home";
      w.timer = 1.5 + hash(w.id, w.trips + 50) * 3;
    }
  }
}

/** Advances the walkers to time `t`, in small steps; the first call warms the village up. */
function simulate(t: number, swing: number): void {
  const from = simT ?? t - 30;
  const span = Math.min(t - from, simT === null ? 30 : 0.25);
  simT = t;
  if (span <= 0) return;
  const n = Math.ceil(span / 0.05);
  for (let k = 0; k < n; k++) stepWalkers(span / n, swing);
}

/** A tree: trunk and two stacked crowns. Scenery: never frames the scene. */
function tree(out: Block[], x: number, y: number, s: number): void {
  box(out, [x - 0.3, y - 0.3, 0], [0.6, 0.6, 1.6 * s], { decor: true });
  box(out, [x - 1.3 * s, y - 1.3 * s, 1.6 * s], [2.6 * s, 2.6 * s, 2 * s], {
    decor: true,
    tone: [0.3, 0.2, 0.35],
  });
  box(out, [x - 0.8 * s, y - 0.8 * s, 3.6 * s], [1.6 * s, 1.6 * s, 1.2 * s], {
    decor: true,
    tone: [0.3, 0.2, 0.35],
  });
}

/** Which label is orange at each step: the one the camera is looking at. */
const LOOKING: Partial<Record<keyof typeof STEPS, string>> = {
  complex: "erp",
  unfit: "bank",
  support: "support",
  excel: "excel",
  upgrade: "upgrade",
  lockin: "lockin",
  ai: "ai",
  tinker: "patches",
  generic: "erp",
  plug: "connectors",
  boom: "erp",
};

export function village(t: number): Block[] {
  const p = villageStore.progress;
  const step = (Object.keys(STEPS) as (keyof typeof STEPS)[]).find(
    (k) => p >= STEPS[k][0] && p < STEPS[k][1],
  );
  const focus = step ? LOOKING[step] : undefined;
  const out: Block[] = [];
  const tinker = reveal(p, STEPS.tinker);
  const generic = reveal(p, STEPS.generic);
  const plug = reveal(p, STEPS.plug);
  const boom = reveal(p, STEPS.boom);
  const fire = reveal(p, STEPS.fire);
  // The first third of the boom step is the rumble (the page shakes the stage); then it blows.
  const BLAST = 0.45;
  const broken = boom > BLAST + 0.06;
  deserted = boom > BLAST;

  // The island, its edge fence and paths. The island and the anchor alone frame the scene.
  const island: Block = {
    kind: "box",
    at: [-36, -36, -1.2],
    size: [72, 72, 1.2],
    tone: [0.05, 0.12, 0.2],
    layer: -1,
  };
  const anchor: Block = {
    kind: "box",
    at: [-59, -30, 14],
    size: [0, 0, 0],
    ghost: true,
    layer: -1,
  };
  // The customers' island, across the water from the CRM tower.
  const customers: Block = {
    kind: "box",
    at: [-59, -30, -1.2],
    size: [18, 26, 1.2],
    tone: [0.05, 0.12, 0.2],
    layer: -1,
  };
  // The external apps' island, off the top-right edge, across from the connector tower.
  const apps: Block = {
    kind: "box",
    at: [-33, -59, -1.2],
    size: [18, 18, 1.2],
    tone: [0.05, 0.12, 0.2],
    layer: -1,
  };
  // The AI island, beside the customers' island, the same size.
  const aiIsland: Block = {
    kind: "box",
    at: [-59, 1, -1.2],
    size: [18, 18, 1.2],
    tone: [0.05, 0.12, 0.2],
    layer: -1,
  };
  // The casino island, after the external apps, clockwise.
  const casino: Block = {
    kind: "box",
    at: [-10, -57, -1.2],
    size: [18, 16, 1.2],
    tone: [0.05, 0.12, 0.2],
    layer: -1,
  };
  out.push(island, anchor, customers, apps, aiIsland, casino);
  // Connection wires on the ground from the ERP to the connector tower and to the support, and
  // one to the shack, run out a length at a time while it tinkers.
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
  ];
  routes.push([
    [-7.1, -5, 0.05],
    [-15, -5, 0.05],
    [-15, -9, 0.05],
    [-22.9, -9, 0.05],
  ]);
  for (const r of routes) wire(out, r, t);
  {
    const shack: Vec3[] = [
      [7.1, 2, 0.05],
      [20, 2, 0.05],
      [20, 14.9, 0.05],
    ];
    const L = pathLength(shack);
    wire(out, shack, t, Math.floor((tinker * L) / 3) * 3);
  }

  // A thin cable on the ground from the ERP to the marketing tower, held down by small clips.
  {
    const cable: Vec3[] = [
      [7.1, -5, 0.05],
      [14, -5, 0.05],
    ];
    polyline(out, cable, "ink");
    polyline(
      out,
      cable.map((q) => [q[0] + 0.25, q[1] + 0.25, q[2]] as Vec3),
      "dim",
    );
    const L = pathLength(cable);
    for (let d = 2; d < L; d += 4) {
      const q = along(cable, d);
      seg(out, [q[0] - 0.3, q[1] - 0.3, 0.05], [q[0] + 0.3, q[1] + 0.3, 0.05], "ink");
    }
    dot(out, along(cable, (t * 3) % L), "ink", 1);
  }

  // Scenery: trees, flowers, a pond, clouds.
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
      ].some((pts) => {
        return pts.slice(1).some((q, i) => {
          const o = pts[i]!;
          const minX = Math.min(o[0], q[0]) - 3.5;
          const maxX = Math.max(o[0], q[0]) + 3.5;
          const minY = Math.min(o[1], q[1]) - 3.5;
          const maxY = Math.max(o[1], q[1]) + 3.5;
          return x > minX && x < maxX && y > minY && y < maxY;
        });
      }) ||
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
          out,
          [x + (hash(k, f + 9) - 0.5) * 3, y + (hash(k, f + 19) - 0.5) * 3, 0.1],
          f % 3 === 0 ? "accent" : "ink",
          1,
        );
    } else tree(out, x, y, 0.8 + hash(k, 3) * 0.6);
  }
  wheel(out, [-10, 29, 0.05], 3.2, X, Y, 0, { ink: "dim" });
  wheel(out, [-10, 29, 0.05], 0.4 + ((t * 0.8) % 1) * 2.6, X, Y, 0, { ink: "faint" });
  for (let k = 0; k < 4; k++) {
    const x = ((t * 0.6 + k * 26) % 100) - 50;
    const y = -30 + k * 18;
    for (let j = 0; j < 3; j++)
      box(out, [x + j * 2.6, y + (j % 2) * 1.4, 24 + (k % 2) * 3], [3.4, 2.6, 0.8], {
        ghost: true,
        decor: true,
      });
  }

  // Finance, on its own island past the external apps, linked to the ERP by a canal: a slot machine
  // that always hits 7 7 7 and pays the other way. Its glass tank, your bank account, drains into
  // the machine, which spits the notes straight into a bonfire.
  {
    const sx = -3;
    const sy = -49;
    // One round per stretch of scroll: pull, spin, stop on 7 7 7, flash. Nine before the blast.
    const rounds = clamp(p / STEPS.boom[0]) * 9;
    const k = rounds - Math.floor(rounds);
    const round = Math.floor(rounds);
    // Cabinet, topper and coin tray.
    box(out, [sx, sy - 4, 0], [5, 8, 10], { floors: 2.5 });
    box(out, [sx + 0.5, sy - 3.5, 10], [4, 7, 1.6], { plate: true });
    box(out, [sx + 5, sy - 2.5, 1.2], [1.2, 5, 0.6]);
    const jackpot = k > 0.62 || (k === 0 && round > 0);
    const blink = jackpot && Math.floor(t * 8) % 2 === 0;
    for (let l = 0; l < 7; l++)
      dot(
        out,
        [sx + 5.02, sy - 3.6 + l * 1.2, 9.4],
        blink || l === Math.floor(t * 6) % 7 ? "accent" : "dim",
        2,
      );
    // Reels and crank sit on the cabinet's faces: drawn on a layer above it, so the box never hides them.
    const front = (a: Vec3, b: Vec3, ink: "ink" | "dim" | "accent" = "ink") =>
      out.push({ kind: "line", a, b, ink, layer: 1 });
    // Three reels on the front face; they spin, then stop on 7 one after the other.
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
      const spinning = k > 0.08 && k < 0.42 + r * 0.1;
      if (spinning) {
        for (let j = 0; j < 3; j++) {
          const z = z1 - 0.3 - ((t * 14 + r * 0.7 + j * 1.1) % 3);
          front([fx, y0 + 0.4, z], [fx, y0 + w - 0.4, z], j === 1 ? "ink" : "dim");
          if (j === 1) front([fx, y0 + 0.4, z], [fx, y0 + w - 0.9, z - 0.9], "dim");
        }
      } else {
        const ink = blink ? "accent" : "ink";
        for (const o of [0, 0.18]) {
          front([fx, y0 + 0.4, z1 - 0.5 - o], [fx, y0 + w - 0.4, z1 - 0.5 - o], ink);
          // On this face y grows to the screen left: the stroke runs from the top right to the bottom left.
          front([fx, y0 + 0.4 + o, z1 - 0.5], [fx, y0 + w - 0.8 + o, z0 + 0.4], ink);
        }
      }
    }
    // The crank on the side: pulled down at the start of each round.
    const pull = k > 0 && k < 0.14 ? Math.sin((k / 0.14) * Math.PI) : 0;
    const piv: Vec3 = [sx + 1.4, sy + 4.05, 6];
    box(out, [piv[0] - 0.6, piv[1], piv[2] - 0.6], [1.2, 0.5, 1.2], { plate: true });
    const L = 4.6;
    const ang = pull * 1.7;
    // Pulled toward the viewer (+x, the machine's front), not back into the island.
    const knob: Vec3 = [piv[0] + Math.sin(ang) * L, piv[1] + 0.5, piv[2] + Math.cos(ang) * L];
    front([piv[0], piv[1] + 0.5, piv[2]], knob);
    front([piv[0] + 0.15, piv[1] + 0.5, piv[2]], [knob[0] + 0.15, knob[1], knob[2]], "dim");
    out.push({ kind: "dot", at: knob, ink: "accent", size: 6, layer: 1 });
    // The tank: your bank account, emptying with every round and with the story.
    const tx = sx - 3.5;
    const ty = sy - 1.5;
    box(out, [tx - 1.5, ty - 1.5, 0], [3, 3, 11], { ghost: true });
    box(out, [tx - 1.8, ty - 1.8, 11], [3.6, 3.6, 0.5], { plate: true });
    const full = 22;
    // Drained by the scroll, not by the clock: empty by the time the ERP blows.
    const drained = clamp(p / STEPS.boom[0]);
    const level = Math.round(full * (1 - drained));
    for (let c = 0; c < level; c++)
      block(out, [tx, ty, 0.2 + c * 0.45], [2.2, 2.2, 0.4], { signal: true });
    out.push({
      kind: "label",
      text: "Your bank account",
      at: [tx, ty, 15],
      to: [tx, ty, 11.5],
      active: focus === "bank",
    });
    // Coins down a chute from the tank into the machine.
    const chute: Vec3[] = [
      [tx + 1.5, ty, 1.5],
      [sx, ty, 3],
    ];
    seg(out, chute[0]!, chute[1]!, "dim");
    const pouring = level > 0;
    if (pouring)
      for (let c = 0; c < 4; c++)
        dot(out, along(chute, ((t * 1.5 + c / 4) % 1) * pathLength(chute)), "signal", 2);
    // The bonfire: crossed logs, a tall fire, sparks. Notes fly into it from the tray and burn.
    const fire0: Vec3 = [sx + 9, sy, 0];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      const dx = Math.cos(a) * 1.8;
      const dy = Math.sin(a) * 1.8;
      seg(out, [fire0[0] - dx, fire0[1] - dy, 0.2], [fire0[0] + dx, fire0[1] + dy, 0.6]);
      seg(
        out,
        [fire0[0] - dx, fire0[1] - dy + 0.2, 0.2],
        [fire0[0] + dx, fire0[1] + dy + 0.2, 0.6],
        "dim",
      );
    }
    flames(out, [fire0[0], fire0[1], 0.4], t, 7, 777);
    flames(out, [fire0[0], fire0[1], 1.2], t, 4, 778);
    for (let k = 0; k < 6; k++) {
      const age = (t * 0.6 + k / 6) % 1;
      out.push({
        kind: "dot",
        at: [fire0[0] + Math.sin(k * 2 + t) * 0.8, fire0[1] + Math.cos(k * 3) * 0.8, 2.5 + age * 5],
        ink: age < 0.5 ? "alert" : "dim",
        size: 1,
        layer: 1,
      });
    }
    // Money comes out only on a 7 7 7, and straight into the fire.
    const notes = pouring && jackpot ? 6 : 0;
    for (let c = 0; c < notes; c++) {
      const q = (t * 0.8 + c / notes) % 1;
      const from: Vec3 = [sx + 5.6, sy, 1.6];
      const x = from[0] + (fire0[0] - from[0]) * q;
      const y = from[1] + Math.sin(c * 1.7) * 1.2 * Math.sin(q * Math.PI);
      const z = from[2] + Math.sin(q * Math.PI) * 4 - q * 0.8;
      if (q < 0.8) {
        // A note: a green slip, until it catches.
        box(out, [x - 0.6, y - 0.35, z], [1.2, 0.7, 0.08], { plate: true, signal: true, layer: 1 });
        if (q > 0.6)
          box(out, [x - 0.3, y - 0.2, z + 0.1], [0.6, 0.4, 0.4], { alert: true, layer: 1 });
      }
    }
  }

  // The customers, on their own island: three houses they walk out of (see `walkers`).
  // A small rope bridge across the water, jungle style: sagging planks, rope rails, two posts at
  // each end. People cross both ways on it, side by side.
  const sag = (x: number) => (x > -41 && x < -36 ? -0.8 * Math.sin(((x + 41) / 5) * Math.PI) : 0);
  for (const by of [-22, -9]) {
    for (let x = -41; x <= -36; x += 0.75) {
      const z = sag(x) + 0.05;
      seg(
        out,
        [x, by - 1, z],
        [x + (hash(Math.round(x * 4), 3) - 0.5) * 0.2, by + 1, z],
        x % 1.5 === 0 ? "ink" : "dim",
      );
    }
    for (const y of [by - 1.1, by + 1.1]) {
      for (const x of [-41, -36]) seg(out, [x, y, 0], [x, y, 1.9]);
      let prev: Vec3 | null = null;
      for (let x = -41; x <= -36; x += 0.5) {
        const q: Vec3 = [x, y, 1.6 + sag(x) * 0.8];
        if (prev) seg(out, prev, q, "dim");
        if (Math.round(x * 2) % 2 === 0) seg(out, q, [x, y, sag(x) + 0.05], "faint");
        prev = q;
      }
    }
  }
  {
    for (const [hx, hy] of HOUSES) {
      box(out, [hx, hy, 0], [3, 3, 2.4], { floors: 1.2 });
      box(out, [hx - 0.3, hy - 0.3, 2.4], [3.6, 3.6, 0.5], { plate: true });
    }
    seg(out, [-56, -8, 0], [-56, -8, 4]);
    wheel(out, [-56, -8, 5], 1.4, [Math.SQRT1_2, -Math.SQRT1_2, 0], Z, 0, { spokes: 3, hub: 0.2 });
    out.push({ kind: "label", text: "Customers", at: [-51, -16, 8], to: [-51, -16, 3] });
  }

  // Two counters side by side, each reached over its own footbridge: sales, where the customers
  // go at first, and support, where they end up. The crowds swap over the story. Behind support
  // the tickets pile up like a landfill (nothing at first), and that pile is what burns.
  const swing = clamp(p / STEPS.boom[0]);
  const desk = (cy: number, name: string, key: string, pile: boolean) => {
    const cx = -26;
    box(out, [cx - 3, cy - 2, 0], [6, 4, 5], { floors: 1.7 });
    box(out, [cx - 3.5, cy - 2.5, 5], [7, 5, 0.5], { plate: true });
    // The window is on the bridge side (the far side, mostly hidden by the building).
    const wx = cx - 3.02;
    box(out, [wx - 0.8, cy - 1.4, 1.4], [0.8, 2.8, 0.2]);
    if (pile) {
      const px = cx - 2;
      const py = cy - 7;
      const g = swing * swing;
      const heap = Math.round(160 * g);
      for (let k = 0; k < heap; k++) {
        const h = Math.sqrt(hash(k, 61)) * (0.5 + g * 6.5);
        const r = (1 - h / (0.6 + g * 6.6)) * (1 + g * 5);
        const a = hash(k, 62) * TAU;
        const d = Math.sqrt(hash(k, 63)) * r;
        box(out, [px + Math.cos(a) * d, py + Math.sin(a) * d, h * 0.7], [0.9, 0.6, 0.15], {
          plate: k % 9 === 0,
        });
      }
      if (heap > 3) {
        const flying = (t * 0.9) % 1;
        box(
          out,
          [cx + flying * (px - cx), cy + flying * (py - cy), 5 + Math.sin(flying * Math.PI) * 4],
          [0.9, 0.6, 0.15],
        );
      }
      if (boom > BLAST + 0.03) {
        const b2 = Math.min(1, (boom - BLAST - 0.03) * 3);
        flames(out, [px, py, 0.5], t, Math.round(4 + b2 * 10), 300);
        flames(out, [px + 1, py - 1, 1.5 * b2], t, Math.round(b2 * 6), 301);
        smoke(out, [px, py, 4], t, 3 + Math.round(b2 * 4), 302, 12);
      }
    }
    out.push({
      kind: "label",
      text: name,
      at: [cx, cy, 10],
      to: [cx, cy, 5.6],
      active: focus === key,
    });
    // Counters popping over the desk, cookie-clicker style: each rises, then is gone. Sales earns
    // less and less; support gets more and more mail.
    const rate = pile ? swing : 1 - swing;
    for (let k = 0; k < 4; k++) {
      const cycle = t * 0.7 + k / 4;
      const age = cycle % 1;
      if (hash(Math.floor(cycle), k + (pile ? 40 : 0)) > rate) continue;
      const text = pile ? "+1 mail" : `+${"$".repeat(1 + Math.round(rate * 2))}`;
      out.push({
        kind: "label",
        text,
        plain: true,
        ink: pile ? "alert" : "signal",
        at: [cx + (k - 1.5) * 1.6, cy - 1, 11 + age * 6],
      });
    }
  };
  desk(-22, "Support", "support", true);
  desk(-9, "Sales", "sales", false);
  // The lanes, faint on the ground: in on one side of each bridge, back on the other.
  for (const cy of [-22, -9]) {
    seg(out, [LANE_IN, cy + IN_Y, 0], [SERVE_X, cy + IN_Y, 0], "faint", 2);
    seg(out, [SERVE_X, cy + OUT_Y, 0], [LANE_OUT, cy + OUT_Y, 0], "faint", 2);
  }
  simulate(t, swing);
  for (const w of walkers) {
    if (w.state === "home") continue;
    const [x, y] = shown(w);
    const q: Vec3 = [x, y, sag(x)];
    person(out, q, w.state !== "serve" && Math.floor(t * 4 + w.id) % 2 === 0);
    if (w.state === "leave") continue;
    // Going in: a parcel for sales, a stack of tickets for support.
    if (w.desk === "sales") box(out, [x - 0.9, y - 0.4, q[2] + 1], [0.8, 0.8, 0.5]);
    else {
      const n = 1 + Math.floor(hash(w.id, w.trips) * 3 + swing * 2);
      for (let j = 0; j < n; j++)
        box(out, [x - 0.9, y - 0.4, q[2] + 1 + j * 0.25], [0.8, 0.8, 0.2]);
    }
  }

  // Marketing: a telecom tower right of the ERP, its offers spreading round it in rings.
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
    for (const [lx, ly] of legs) seg(out, at(lx, ly, 0), at(lx, ly, H));
    for (let z = 0; z < H; z += 3) {
      for (let i = 0; i < 4; i++) {
        const [ax, ay] = legs[i]!;
        const [bx, by] = legs[(i + 1) % 4]!;
        seg(out, at(ax, ay, z), at(bx, by, z + 3), "dim");
        seg(out, at(bx, by, z), at(ax, ay, z + 3), "dim");
        seg(out, at(ax, ay, z + 3), at(bx, by, z + 3), "dim");
      }
    }
    seg(out, [tx, ty, H], [tx, ty, H + 3]);
    // It broadcasts less and less as the story goes on, then not at all: nobody is listening.
    const reach = 1 - clamp(p / STEPS.boom[0]);
    dot(out, [tx, ty, H + 3.2], reach > 0 && Math.floor(t * 2) % 2 ? "accent" : "dim", 3);
    const aim = Math.atan2(-17 - ty, -50 - tx);
    for (const z of [H - 2, H - 5])
      wheel(out, at(0.9, 0.9, z), 1.2, [-Math.sin(aim), Math.cos(aim), 0], Z, 0, {
        spokes: 3,
        hub: 0.2,
      });
    // Rings spreading round the top, small: they fade out before reaching the ERP's chimneys.
    for (let k = 0; k < Math.ceil(3 * reach); k++) {
      const age = (t * 0.5 + k / 3) % 1;
      const r = 1.5 + age * 6;
      const ink = age > 0.7 ? "faint" : "dim";
      let prev: Vec3 | null = null;
      for (let j = 0; j <= 24; j++) {
        const a = (j / 24) * TAU;
        const q: Vec3 = [tx + Math.cos(a) * r, ty + Math.sin(a) * r, H + 1.6];
        if (prev) seg(out, prev, q, ink);
        prev = q;
      }
    }
    out.push({
      kind: "label",
      text: "Marketing",
      at: [tx, ty, H + 7],
      to: [tx, ty, H + 3.6],
      active: focus === "crm",
    });
  }

  // Custom work: a shack of planks nailed at odd angles by an arm with a hammer; it falls apart.
  {
    const c: Vec3 = [20, 18, 0];
    const planks = Math.round(tinker * 18);
    for (let k = 0; k < planks; k++) {
      const side = k % 4;
      const h = Math.floor(k / 4) * 1.4 + 0.6;
      const tilt = (hash(k, 11) - 0.5) * 1.6;
      // The upgrade breaks the custom work: planks come off, one by one, and lie on the ground.
      const breaking = Math.min(1, Math.max(0, (reveal(p, STEPS.upgrade) - 0.4) / 0.6));
      const off = hash(k, 12) < breaking;
      const z = off ? 0.1 : h;
      const a: Vec3 =
        side === 0
          ? [c[0] - 3, c[1] - 3, z]
          : side === 1
            ? [c[0] + 3, c[1] - 3, z]
            : side === 2
              ? [c[0] + 3, c[1] + 3, z]
              : [c[0] - 3, c[1] + 3, z];
      const b: Vec3 =
        side === 0
          ? [c[0] + 3.4, c[1] - 3, z + tilt]
          : side === 1
            ? [c[0] + 3, c[1] + 3.4, z + tilt]
            : side === 2
              ? [c[0] - 3.4, c[1] + 3, z + tilt]
              : [c[0] - 3, c[1] - 3.4, z + tilt];
      if (off) {
        const dx = (hash(k, 13) - 0.5) * 3;
        const dy = (hash(k, 14) - 0.5) * 3;
        seg(out, [a[0] + dx, a[1] + dy, 0.1], [b[0] + dx, b[1] + dy, 0.1], "dim");
        continue;
      }
      seg(out, a, b);
      seg(out, [a[0], a[1], a[2] - 0.4], [b[0], b[1], b[2] - 0.4], "dim");
      dot(out, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], "ink", 1);
    }
    if (tinker > 0) {
      for (const [x, y] of [
        [-3, -3],
        [3, -3],
        [3, 3],
        [-3, 3],
      ] as const)
        seg(
          out,
          [c[0] + x, c[1] + y, 0],
          [c[0] + x + (hash(x, y) - 0.5), c[1] + y, 6 * tinker],
          "dim",
        );
      const knock = Math.abs(Math.sin(t * 5));
      arm(
        out,
        [c[0] + 6, c[1] - 4, 0],
        [c[0] + 3.4, c[1] - 1, 2 + Math.floor(planks / 4) * 1.4 + knock * 1.5],
        5,
        5,
      );
      // Labels step aside for the final close-up on the burning ERP.
      if (p < STEPS.fire[0])
        out.push({
          kind: "label",
          text: "Custom patches",
          active: focus === "patches",
          at: [20, 18, 9],
          to: [20, 18, 6 * tinker],
        });
    }
  }

  // Integrations: a patch tower on the edge, and across the water an island of external apps,
  // eight of them in a grid. No cable at first; one more app gets wired at each stretch of the
  // story, up to eight, each cable hanging across the gap with packets running down it.
  {
    const c: Vec3 = [-4, -31, 0];
    box(out, [c[0] - 1.5, c[1] - 1.5, 0], [3, 3, 12], { floors: 1 });
    box(out, [c[0] - 2, c[1] - 2, 12], [4, 4, 0.6], { plate: true });
    for (let k = 0; k < 6; k++)
      dot(out, [c[0] + 1.5, c[1], 1 + k * 1.8], Math.floor(t * 3 + k) % 3 ? "dim" : "accent", 1);
    // The apps: a grid of small buildings, each its own shape, each with a port facing the tower.
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
    const n = Math.round(plug * 8);
    for (let i = 0; i < 8; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const ax = -30.5 + col * 4.2;
      const ay = -55.5 + row * 6.5;
      const [h, kind] = shapes[i]!;
      box(out, [ax - 1.4, ay - 1.4, 0], [2.8, 2.8, h], { floors: 1, plate: kind === 0 });
      if (kind === 1) box(out, [ax - 0.8, ay - 0.8, h], [1.6, 1.6, 1.2], { floors: 0.6 });
      if (kind === 2)
        wheel(out, [ax, ay, h + 1.2], 0.9, [Math.SQRT1_2, Math.SQRT1_2, 0], Z, 0, {
          spokes: 3,
          hub: 0.2,
        });
      if (kind === 2) seg(out, [ax, ay, h], [ax, ay, h + 0.6]);
      if (kind === 3) box(out, [ax - 1.1, ay - 1.1, h], [2.2, 2.2, 0.5], { plate: true });
      const port: Vec3 = [ax, ay + 1.45, 0.8];
      box(out, [port[0] - 0.35, port[1], 0.4], [0.7, 0.3, 0.7]);
      if (i >= n) continue;
      // A hanging cable from the tower's head to the port, sagging over the water.
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
      polyline(out, pts, i % 2 ? "dim" : "ink");
      dot(out, along(pts, (t * 5 + i * 3) % pathLength(pts)), "ink", 2);
      dot(out, [port[0], port[1] + 0.35, 0.9], Math.floor(t * 4 + i) % 2 ? "accent" : "dim", 1);
    }
    out.push({
      kind: "label",
      text: plug > 0.3 ? "20,000 connectors" : "Connectors",
      at: [-4, -31, 16],
      to: [-4, -31, 12.6],
      active: focus === "connectors",
    });
    out.push({ kind: "label", text: "External apps", at: [-24, -50, 9], to: [-24, -50, 5] });
  }

  // Shadow Excel: sheds next to the ERP where the real work gets done, on spreadsheets you can see
  // from outside, with files flying from one shed to the next.
  const excel = reveal(p, STEPS.excel);
  if (p >= STEPS.excel[0]) {
    const sheds: [number, number][] = [
      [4, 15],
      [9, 20],
      [4, 25],
    ];
    const shown = Math.max(1, Math.ceil(excel * 3));
    sheds.slice(0, shown).forEach(([x, y], i) => {
      box(out, [x - 1.5, y - 1.5, 0], [3, 3, 2.6], { floors: 1.3 });
      box(out, [x - 1.8, y - 1.8, 2.6], [3.6, 3.6, 0.4], { plate: true });
      // The spreadsheet on the shed's front: a grid of cells, one of them always being edited.
      const fx = x + 1.52;
      const line = (a: Vec3, b: Vec3, ink: "ink" | "dim" | "accent" = "dim") =>
        out.push({ kind: "line", a, b, ink, layer: 1 });
      for (let r = 0; r <= 3; r++)
        line([fx, y - 1.1, 0.5 + r * 0.55], [fx, y + 1.1, 0.5 + r * 0.55]);
      for (let col = 0; col <= 4; col++)
        line([fx, y - 1.1 + col * 0.55, 0.5], [fx, y - 1.1 + col * 0.55, 2.15]);
      const cell = Math.floor(t * 2 + i * 3) % 12;
      const cy0 = y - 1.1 + (cell % 4) * 0.55;
      const cz0 = 0.5 + Math.floor(cell / 4) * 0.55;
      line([fx, cy0, cz0], [fx, cy0 + 0.55, cz0 + 0.55], "accent");
      line([fx, cy0 + 0.55, cz0], [fx, cy0, cz0 + 0.55], "accent");
      person(out, [x + 2.6, y + 0.2, 0], Math.floor(t * 3 + i) % 2 === 0);
    });
    // Files flying between the sheds: final, final-2, final-final.
    for (let k = 0; k < shown - 1 + (shown === 3 ? 1 : 0); k++) {
      const [ax, ay] = sheds[k % shown]!;
      const [bx, by] = sheds[(k + 1) % shown]!;
      const q = (t * 0.7 + k * 0.37) % 1;
      box(
        out,
        [ax + (bx - ax) * q - 0.3, ay + (by - ay) * q - 0.2, 2.8 + Math.sin(q * Math.PI) * 3],
        [0.6, 0.4, 0.1],
        { plate: true, layer: 1 },
      );
    }
    if (p < STEPS.fire[0])
      out.push({
        kind: "label",
        text: "Excel",
        at: [6, 20, 7],
        to: [6, 20, 3.2],
        active: focus === "excel",
      });
  }

  // Upgrade: a tower crane and scaffolding round the pyramid, forever. The crane lifts a new
  // version from the yard to the top terrace, again and again.
  const upgrade = reveal(p, STEPS.upgrade);
  if (p >= STEPS.upgrade[0] && !broken) {
    const m: Vec3 = [-17, 0, 0];
    const H = 22;
    for (const [lx, ly] of [
      [-0.6, -0.6],
      [0.6, -0.6],
      [0.6, 0.6],
      [-0.6, 0.6],
    ] as const)
      seg(out, [m[0] + lx, m[1] + ly, 0], [m[0] + lx, m[1] + ly, H]);
    for (let z = 0; z < H; z += 1.5) {
      seg(out, [m[0] - 0.6, m[1] - 0.6, z], [m[0] + 0.6, m[1] + 0.6, z + 1.5], "dim");
      seg(out, [m[0] + 0.6, m[1] - 0.6, z], [m[0] - 0.6, m[1] + 0.6, z + 1.5], "dim");
    }
    box(out, [m[0] - 1.6, m[1] - 1.6, 0], [3.2, 3.2, 0.6], { plate: true });
    // A cycle: lower at the yard, lift, slew to the pyramid, lower, release, slew back.
    const yard: Vec3 = [-21, 15, 0];
    const top: Vec3 = [0, 0, 7.6];
    const T = 9;
    const k = (t % T) / T;
    const angA = Math.atan2(yard[1] - m[1], yard[0] - m[0]);
    const angB = Math.atan2(top[1] - m[1], top[0] - m[0]);
    const dA = Math.hypot(yard[0] - m[0], yard[1] - m[1]);
    const dB = Math.hypot(top[0] - m[0], top[1] - m[1]);
    let ang = angA;
    let d = dA;
    let hook = H - 2;
    let carrying = false;
    if (k < 0.12) hook = H - 2 - (H - 3) * glide(k / 0.12);
    else if (k < 0.24) {
      hook = 1 + (H - 3) * glide((k - 0.12) / 0.12);
      carrying = true;
    } else if (k < 0.5) {
      const q = glide((k - 0.24) / 0.26);
      ang = angA + (angB - angA) * q;
      d = dA + (dB - dA) * q;
      carrying = true;
    } else if (k < 0.62) {
      ang = angB;
      d = dB;
      hook = H - 2 - (H - 2 - 10) * glide((k - 0.5) / 0.12);
      carrying = true;
    } else if (k < 0.72) {
      ang = angB;
      d = dB;
      hook = 10 + (H - 12) * glide((k - 0.62) / 0.1);
    } else {
      const q = glide((k - 0.72) / 0.28);
      ang = angB + (angA - angB) * q;
      d = dB + (dA - dB) * q;
    }
    const tip = (r: number): Vec3 => [m[0] + Math.cos(ang) * r, m[1] + Math.sin(ang) * r, H];
    seg(out, tip(-5), tip(dB + 1.5));
    seg(
      out,
      [tip(-5)[0], tip(-5)[1], H + 0.8],
      [tip(dB + 1.5)[0], tip(dB + 1.5)[1], H + 0.8],
      "dim",
    );
    seg(out, [m[0], m[1], H + 2.4], tip(dB + 1.5), "dim");
    seg(out, [m[0], m[1], H + 2.4], tip(-5), "dim");
    seg(out, [m[0], m[1], H], [m[0], m[1], H + 2.4]);
    const cw = tip(-4.2);
    box(out, [cw[0] - 0.8, cw[1] - 0.8, H - 1.6], [1.6, 1.6, 1.6]);
    const trolley = tip(d);
    box(out, [trolley[0] - 0.5, trolley[1] - 0.5, H - 0.4], [1, 1, 0.5]);
    seg(out, [trolley[0], trolley[1], H - 0.4], [trolley[0], trolley[1], hook + 0.4], "dim");
    if (carrying)
      box(out, [trolley[0] - 0.9, trolley[1] - 0.9, hook - 1.4], [1.8, 1.8, 1.8], {
        floors: 0.6,
        layer: 0.4,
      });
    // The yard: versions waiting to be installed.
    for (let i = 0; i < 4; i++)
      box(
        out,
        [yard[0] - 2 + (i % 2) * 2.2, yard[1] - 1 + Math.floor(i / 2) * 2.2, 0],
        [1.8, 1.8, 1.8],
        { floors: 0.6 },
      );
    // Scaffolding on the two faces we see, built up during the step and never taken down.
    const poles = Math.ceil(upgrade * 14);
    let n = 0;
    for (const side of [0, 1])
      for (let s2 = -6; s2 <= 6 && n < poles; s2 += 2.3, n++) {
        const base: Vec3 = side === 0 ? [7.7, s2, 0] : [s2, 7.7, 0];
        out.push({ kind: "line", a: base, b: [base[0], base[1], 8], ink: "ink", layer: 0.35 });
        for (const z of [2.6, 5.2, 7.8]) {
          const next: Vec3 = side === 0 ? [7.7, s2 + 2.3, z] : [s2 + 2.3, 7.7, z];
          if (s2 + 2.3 <= 6.5)
            out.push({ kind: "line", a: [base[0], base[1], z], b: next, ink: "dim", layer: 0.35 });
        }
      }
    out.push({
      kind: "label",
      text: "Upgrade in progress",
      at: [7.7, 5, 13],
      to: [7.7, 5, 8],
      active: focus === "upgrade",
    });
  }

  // Lock-in: the island becomes a border post. A barbed-wire fence goes up round it, post by
  // post, with one watchtower at the left corner and, beside it, a gate with its barrier down.
  const lock = reveal(p, STEPS.lockin);
  if (p >= STEPS.lockin[0]) {
    const ring: Vec3[] = [
      [36.4, 36.4, 0],
      [36.4, -36.4, 0],
      [-36.4, -36.4, 0],
      [-36.4, 36.4, 0],
      [36.4, 36.4, 0],
    ];
    const L = pathLength(ring);
    const done = Math.min(L, lock * 1.15 * L);
    // The fence opens where the gate stands.
    const GX = -27;
    const gap = (q: Vec3) => q[1] > 36 && Math.abs(q[0] - GX) < 4.2;
    for (let d = 0; d <= done; d += 3) {
      const q = along(ring, d);
      if (gap(q)) continue;
      seg(out, [q[0], q[1], 0], [q[0], q[1], 2.4]);
      seg(out, [q[0] - 0.25, q[1] - 0.25, 2.4], [q[0] + 0.25, q[1] + 0.25, 2.8], "dim");
    }
    for (const z of [0.8, 1.5, 2.2]) {
      let prev: Vec3 | null = null;
      for (let d = 0; d <= done; d += 1.5) {
        const q0 = along(ring, d);
        const q: Vec3 = [q0[0], q0[1], z - Math.abs(Math.sin((d / 3) * Math.PI)) * 0.15];
        if (gap(q)) {
          prev = null;
          continue;
        }
        if (prev) seg(out, prev, q, z === 1.5 ? "ink" : "dim");
        // A barb every stretch: a small cross on the wire.
        seg(out, [q[0] - 0.25, q[1], q[2] - 0.25], [q[0] + 0.25, q[1], q[2] + 0.25], "ink");
        seg(out, [q[0], q[1] - 0.25, q[2] + 0.25], [q[0], q[1] + 0.25, q[2] - 0.25], "ink");
        prev = q;
      }
    }
    // A border post, over-guarded: watchtowers with sweeping searchlights at the corners, turrets
    // on every side, a checkpoint with its barrier down at the front.
    // One watchtower, at the left corner, every leg on the island.
    const towers: [number, number][] = [[-34.6, 34.6]];
    towers.forEach(([x, y], i) => {
      if (lock < 0.2 + i * 0.15) return;
      for (const [lx, ly] of [
        [-0.8, -0.8],
        [0.8, -0.8],
        [0.8, 0.8],
        [-0.8, 0.8],
      ] as const)
        seg(out, [x + lx, y + ly, 0], [x + lx * 0.6, y + ly * 0.6, 6]);
      seg(out, [x - 0.8, y - 0.8, 0], [x + 0.6, y + 0.6, 6], "dim");
      box(out, [x - 1, y - 1, 6], [2, 2, 1.4], { floors: 0.7 });
      box(out, [x - 1.3, y - 1.3, 7.4], [2.6, 2.6, 0.3], { plate: true });
      // The searchlight sweeps the fence, back and forth.
      const a = Math.sin(t * 0.7 + i * 2) * 0.9 + Math.atan2(-y, -x);
      const spot: Vec3 = [x + Math.cos(a) * 9, y + Math.sin(a) * 9, 0.05];
      seg(out, [x, y, 6.8], spot, "dim");
      seg(out, [x, y, 6.8], [spot[0] + 1.2, spot[1] + 1.2, 0.05], "dim");
      wheel(out, [spot[0] + 0.6, spot[1] + 0.6, 0.05], 1.1, X, Y, 0, { ink: "ink" });
    });
    if (lock > 0.3) {
      // The gate, next to the watchtower, in the gap of the fence: a wide road, a booth, two tall
      // posts with alternating warning lights, and a long striped barrier, down.
      const gx = GX;
      for (const off of [-2.6, 2.6]) seg(out, [gx + off, 28, 0.03], [gx + off, 36.4, 0.03], "dim");
      for (let y = 28.5; y < 36.4; y += 1.6) seg(out, [gx, y, 0.03], [gx, y + 0.7, 0.03], "faint");
      box(out, [gx + 3.4, 29.4, 0], [3.4, 3, 3.6], { floors: 1.2 });
      box(out, [gx + 3, 29, 3.6], [4.2, 3.8, 0.4], { plate: true });
      const blink = Math.floor(t * 2.5) % 2;
      for (const [px, lit] of [
        [gx - 3.2, blink === 0],
        [gx + 3.2, blink === 1],
      ] as const) {
        box(out, [px - 0.35, 35.4, 0], [0.7, 0.7, 5]);
        box(out, [px - 0.9, 35.3, 3.8], [1.8, 0.9, 0.9]);
        out.push({
          kind: "dot",
          at: [px - 0.4, 36.25, 4.25],
          ink: lit ? "accent" : "dim",
          size: 4,
          layer: 0.4,
        });
        out.push({
          kind: "dot",
          at: [px + 0.4, 36.25, 4.25],
          ink: lit ? "dim" : "accent",
          size: 4,
          layer: 0.4,
        });
      }
      // The barrier arm across the road, red and white, down.
      for (let k = 0; k < 12; k++)
        for (const z of [2, 2.3])
          out.push({
            kind: "line",
            a: [gx - 3.2 + k * 0.55, 35.75, z],
            b: [gx - 3.2 + (k + 1) * 0.55, 35.75, z],
            ink: k % 2 ? "ink" : "accent",
            layer: 0.4,
          });
      out.push({
        kind: "label",
        text: "Vendor lock-in",
        at: [gx, 35.8, 9],
        to: [gx, 35.8, 5.2],
        active: focus === "lockin",
      });
    }
  }

  // AI: an island everyone talks about, beside the customers. From a junction box fed by the ERP,
  // three cables go out to its sockets: one reaches and misfires, one hangs short in the water,
  // one lies unplugged.
  const ai = reveal(p, STEPS.ai);
  {
    const cx = -50;
    const cy = 9;
    box(out, [cx - 2, cy - 2, 0], [4, 4, 6], { floors: 1.5, plate: true });
    wheel(out, [cx, cy, 4], 3.4, X, Y, t * 0.9, { teeth: 10, tooth: 0.4 });
    wheel(out, [cx, cy, 2.5], 3.8, X, Y, -t * 0.6, { ink: "dim" });
    const glitch = Math.floor(t * 7) % 5 === 0 || Math.floor(t * 3) % 4 === 1;
    out.push({
      kind: "dot",
      at: [cx + 2.02, cy, 4.5],
      ink: glitch ? "accent" : "dim",
      size: 3,
      layer: 0.4,
    });
    for (let k = 0; k < 3; k++)
      box(out, [cx - 5.5, cy - 4 + k * 3, 0], [2, 2, 3.5 + (k % 2)], { floors: 0.8 });
    const sockets = [5, 9, 13];
    for (const sy of sockets) box(out, [-41.6, sy - 0.5, 0.4], [0.5, 1, 1]);
    out.push({
      kind: "label",
      text: "AI",
      at: [cx, cy, 11],
      to: [cx, cy, 6.4],
      active: focus === "ai",
    });

    if (p >= STEPS.ai[0]) {
      // The junction box on the main island, fed by a ground cable from the ERP.
      polyline(
        out,
        [
          [-7.1, 6, 0.05],
          [-12, 6, 0.05],
          [-12, 9, 0.05],
          [-32, 9, 0.05],
        ],
        "ink",
      );
      box(out, [-34, 8, 0], [2, 2, 1.6], { floors: 0.8 });
      const from = (i: number): Vec3 => [-34, 8.4 + i * 0.6, 1.2];
      const thick = (pts: Vec3[], ink: "ink" | "dim") => {
        polyline(out, pts, ink);
        polyline(
          out,
          pts.map((q) => [q[0], q[1] + 0.25, q[2]] as Vec3),
          ink,
        );
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
      // One: reaches its socket, and misfires.
      const reach = Math.min(1, ai * 3);
      const c1 = hang(from(0), [-41.4, sockets[2]!, 0.9], 2.2);
      thick(c1.slice(0, Math.max(2, Math.round(reach * 11))), "ink");
      if (reach >= 1) {
        const on = Math.floor(t * 6) % 3 !== 0;
        if (on) dot(out, along(c1, (t * 6) % pathLength(c1)), "ink", 2);
        else
          for (let k = 0; k < 8; k++)
            dot(
              out,
              [
                -41.4 + (hash(k, Math.floor(t * 6)) - 0.5) * 2,
                sockets[2]! + (hash(k, 7) - 0.5) * 2,
                1 + hash(k, 9) * 2,
              ],
              "accent",
              2,
            );
        // Garbage out: stray pixels spat above the model, never the same twice.
        for (let k = 0; k < 10; k++) {
          const age = (t * 0.9 + k / 10) % 1;
          const seed = Math.floor(t * 0.9 + k / 10);
          dot(
            out,
            [
              cx + (hash(k, seed) - 0.5) * 6 * age,
              cy + (hash(k + 20, seed) - 0.5) * 6 * age,
              6.5 + age * 5,
            ],
            k % 3 ? "ink" : "accent",
            2,
          );
        }
      }
      // Two: too short, it hangs into the water.
      if (ai > 0.35) thick(hang(from(1), [-38.5, sockets[0]!, -1], 1.2), "ink");
      // Three: never plugged, its end lying on the ground by the box.
      if (ai > 0.6) {
        thick([from(2), [-34.4, 11.6, 0.1], [-33.4, 12.4, 0.1]], "ink");
        box(out, [-33.6, 12.2, 0], [0.6, 0.6, 0.4]);
      }
    }
  }

  const erpStart = out.length;
  // The ERP: a stepped pyramid with two chimneys. Then it blows: a mushroom of fire on top.
  {
    const chimneys: [number, number, number][] = [
      [2.6, -6.1, 7],
      [4.6, -6.1, 8],
    ];
    const flash = boom > BLAST - 0.02 && boom < BLAST + 0.28;
    const parts: {
      at: Vec3;
      size: Vec3;
      seed: number;
      extra?: Partial<Extract<Block, { kind: "box" }>>;
    }[] = [
      { at: [-7, -7, 0], size: [14, 14, 4], seed: 2, extra: { floors: 1.33, vents: true } },
      { at: [-5, -5, 4], size: [10, 10, 3.6], seed: 4, extra: { floors: 1.2, plate: true } },
    ];
    chimneys.forEach(([x, y, h], i) =>
      parts.push({
        at: [x - 0.8, y - 0.8, 4],
        size: [1.6, 1.6, h],
        seed: 10 + i,
        extra: { floors: 1.5 },
      }),
    );
    // Broken, the building stays standing: it burns and smokes.
    const sink = 0;
    const fly = (at: Vec3, _seed: number): Vec3 => at;
    for (const part of parts)
      box(
        out,
        fly(part.at, part.seed),
        [part.size[0], part.size[1], Math.max(0.3, part.size[2] * (1 - 0.7 * sink))],
        {
          ...part.extra,
          accent: flash && part.seed % 3 === 0,
        },
      );

    chimneys.forEach(([x, y, h], i) =>
      smoke(
        out,
        [x, y, 4 + h],
        t,
        4 + Math.round(generic * 10 + boom * 8 + fire * 12),
        i,
        5 + generic * 2 + fire * 2,
        1 + generic * 0.6 + boom * 0.4 + fire * 0.8,
      ),
    );
    // The blast: a burst of fire particles, white hot, then ember, then ash, scrubbed by the
    // scroll; flames stay on the husk.
    if (boom > BLAST) {
      const b = (boom - BLAST) / (1 - BLAST);
      for (let k = 0; k < 160; k++) {
        const age = (b - hash(k, 83) * 0.35) * 2.2;
        if (age <= 0 || age > 1) continue;
        const a = hash(k, 80) * TAU;
        const el = 0.25 + hash(k, 81) * 1.2;
        const v = 6 + hash(k, 82) * 16;
        const pos: Vec3 = [
          Math.cos(a) * Math.cos(el) * v * age,
          Math.sin(a) * Math.cos(el) * v * age,
          Math.max(0, 4 + Math.sin(el) * v * age * 1.4 - 10 * age * age),
        ];
        dot(out, pos, age < 0.2 ? "ink" : age < 0.7 ? "alert" : "dim", age < 0.35 ? 3 : 2);
      }
      // The top terrace catches: tongues of fire spread over it as the blast grows.
      const catching = Math.min(1, b * 3);
      if (catching > 0) {
        flames(out, [-2, -2, 7.6 * (1 - 0.7 * sink)], t, Math.round(2 + catching * 5), 840);
        flames(out, [2, 2, 7.6 * (1 - 0.7 * sink)], t, Math.round(1 + catching * 4), 841);
      }
      // The mushroom: a wide cap swelling over the top terrace on a thick column of fire, and a
      // surge of fire and smoke rolling out along the ground. White at the core, ember around,
      // ash at the edges; it darkens as the scroll goes on.
      const grow = Math.min(1, b * 2.5);
      const fade = Math.max(0, (b - 0.6) / 0.4);
      const R = 2 + grow * 9;
      const cz = 12 + grow * 10;
      // As the fire takes the village, the mushroom thins out and goes, leaving the burning ruins.
      const gone = Math.min(1, Math.max(0, (b - 0.75) / 0.25) * 0.35 + fire * 1.15);
      // The cloud is made of puffs, not blocks: small round billows, like the smoke, packed
      // tight. White at the heart while it is young, red and ember through the body, ash at the
      // edges and as it goes.
      // The cloud in one colour, pixel by pixel: red pixels, larger and packed at the heart,
      // smaller and dithered away at the edges (by a 4×4 Bayer threshold on their depth), turning
      // to ash as it goes.
      const put = (q: Vec3, w: number, k: number) => {
        if (hash(k, 123) < gone) return;
        const edge = Math.min(1, w);
        if (bayer4(k, k >> 2) < edge * 0.7) return;
        const ash = hash(k, 97) < fade * 0.8;
        out.push({
          kind: "dot",
          at: q,
          ink: ash ? "dim" : "alert",
          size: edge < 0.45 ? 2 : 1,
          layer: 1,
        });
      };
      // The cap: a rolled ring (a torus) whose underside curls back towards the stem, with a dome
      // filling its middle. The fireball glows white inside the roll while it is young.
      const ringR = R * 0.62;
      const tube = R * 0.5;
      for (let k = 0; k < 3800; k++) {
        const u = hash(k, 90) * TAU;
        const v = hash(k, 91) * TAU;
        const w = Math.sqrt(hash(k, 92));
        const boil = 1 + 0.08 * Math.sin(t * 2 + k);
        const rr = ringR + Math.cos(v) * tube * w * boil;
        const z = cz + Math.sin(v) * tube * w * 0.8 + fade * 3;
        put([Math.cos(u) * rr, Math.sin(u) * rr, z], w * (Math.sin(v) < -0.3 ? 0.3 : 1), k);
      }
      for (let k = 0; k < 1100; k++) {
        const a2 = hash(k, 110) * TAU;
        const r2 = Math.sqrt(hash(k, 111)) * ringR;
        const z = cz + tube * 0.5 + (1 - r2 / ringR) * tube * 0.7 + fade * 3;
        put([Math.cos(a2) * r2, Math.sin(a2) * r2, z], 0.7, k + 4000);
      }
      // The stem: narrow, widening a little to the cap, with a collar of cloud halfway up.
      const stemTop = cz - tube * 0.6;
      for (let k = 0; k < 1500; k++) {
        const z = 7.6 + hash(k, 93) * (stemTop - 7.6);
        const a2 = hash(k, 94) * TAU;
        const rr =
          (0.9 + 0.8 * ((z - 7.6) / (stemTop - 7.6))) * Math.sqrt(hash(k, 95)) * (1 + grow * 0.5);
        put([Math.cos(a2) * rr, Math.sin(a2) * rr, z], hash(k, 96) * 0.8, k + 5200);
      }
      const collarZ = 7.6 + (stemTop - 7.6) * 0.55;
      for (let k = 0; k < 650; k++) {
        const a2 = hash(k, 120) * TAU;
        const rr = (2.2 + grow * 2.2) * (0.8 + 0.2 * hash(k, 121));
        put(
          [Math.cos(a2) * rr, Math.sin(a2) * rr, collarZ + (hash(k, 122) - 0.5) * 1.2],
          0.6,
          k + 6800,
        );
      }
      const surge = 9 + grow * 9;
      for (let k = 0; k < 1700; k++) {
        const a = hash(k, 98) * TAU;
        const rr = surge * (0.75 + 0.25 * Math.sqrt(hash(k, 99)));
        const z = hash(k, 100) * 2.4 * (1 - hash(k, 101) * 0.5);
        put([Math.cos(a) * rr, Math.sin(a) * rr, z], 0.5 + hash(k, 102) * 0.5, k + 7500);
      }
    }
    // Once it has blown, the fire runs round the tiers, in front and behind.
    if (broken) {
      const ring = Math.min(1, (boom - BLAST - 0.06) * 2.5);
      for (const [zz, r] of [
        [0, 7],
        [4, 5],
      ] as const)
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * TAU + Math.PI / 4;
          flames(
            out,
            [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, zz === 0 ? 4 : 7.6],
            t,
            Math.round(1 + ring * 3),
            400 + zz * 10 + k,
          );
        }
    }
    // Paint order: the renderer sorts boxes by their nearest corner, which would let the wide base
    // cover the tiers above it. Layers fix the order: base, middle tier, chimneys, top tier, then
    // everything standing on the top (smoke, sparks); flames stay on top.
    for (let i = erpStart; i < out.length; i++) {
      const b = out[i]!;
      if (b.layer !== undefined) continue;
      let layer = 0.3;
      if (b.kind === "box" && b.at[2] === 0 && b.size[0] === 14) layer = 0.1;
      else if (b.kind === "box" && b.at[2] === 4 && b.size[0] === 1.6) layer = 0.15;
      else if (b.kind === "box" && b.at[2] === 4 && b.size[0] === 10) layer = 0.2;
      out[i] = { ...b, layer };
    }
    out.push({
      kind: "label",
      text: broken ? "ERP - not responding" : "ERP",
      at: [0, 0, broken && fire < 0.3 ? 34 : 15],
      to: [0, 0, 7.7],
      active: focus === "erp",
    });
  }

  // Ash settles on the island as it burns.
  const ruin = fire;
  if (ruin > 0) {
    for (let k = 0; k < Math.round(ruin * 140); k++)
      dot(
        out,
        [(hash(k, 501) - 0.5) * 68, (hash(k, 502) - 0.5) * 68, 0.05],
        k % 4 === 0 ? "ink" : "dim",
        1,
      );
  }

  // Fire: once the ERP has gone, the village catches.
  if (fire > 0) {
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
    const lit = Math.ceil(fire * spots.length);
    spots.slice(0, lit).forEach((s0, i) => {
      const s: Vec3 = s0;
      flames(out, s, t, 2 + Math.round(fire * 3), i);
      if (i % 2 === 0)
        smoke(out, [s[0], s[1], s[2] + 2], t, 3 + Math.round(fire * 3), 20 + i, 10, 1 + fire);
    });
  }

  // From the explosion on, every label goes but the ERP's.
  const quiet = p >= STEPS.boom[0];
  return (
    out
      .filter((b) => !(quiet && b.kind === "label" && !b.text.startsWith("ERP")))
      // Labels stay over what they name: the village is too dense to move them off the drawing.
      .map((b) => (b.kind === "label" && !b.plain ? { ...b, fixed: true } : b))
      .map((b) => (b === island || b === anchor || b.decor ? b : { ...b, decor: true }))
  );
}
