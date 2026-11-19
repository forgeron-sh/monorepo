/**
 * The isometric scenes of the lab pages, as Blueprint scene functions of `{ t, active }`.
 * Ported block for block from the former `canvas[data-iso]` engine; `cube` and `stack` come from
 * the package's reference scenes. Faint lines are scenery: they never drive the framing (the old
 * engine skipped them when fitting), which `framed` states with `decor`.
 */
import { machine } from "./machine";
import { OBJECT_SCENES } from "./objects";
import { arm, block, fan, rack, tray, wheel as wheel2, Z } from "./parts";
import {
  type Block,
  examples,
  floorGrid,
  type Ink,
  type SceneFn,
  type Vec3,
} from "@forgeron/blueprint";

/** Dotted floor grid over the square from `a` to `b`, every `step` units. */
const floor = (a: number, b: number, step: number) => floorGrid(a, b, a, b, step);

/** A back row of server racks along the y axis, behind the scene, with blinking status lights. */
function racks(t: number, y0: number, y1: number, back: number): Block[] {
  const shapes: Block[] = [];
  let i = 0;
  for (let y = y0; y <= y1; y += 3.4, i++) {
    const x = -back;
    const h = 8 + ((i * 7) % 5);
    shapes.push({
      kind: "box",
      at: [x - 1.4, y - 1.4, 0],
      size: [2.8, 2.8, h],
      floors: 1,
      tone: [0.04, 0.1, 0.22],
      layer: -1,
    });
    for (let l = 0; l < 3; l++) {
      const on = Math.floor(t * 2 + i * 3 + l * 5) % 7 < 2;
      shapes.push({
        kind: "dot",
        at: [x + 1.4, y, 2 + l * 2.5 + (i % 2)],
        ink: on ? "accent" : "dim",
        size: 1,
      });
    }
  }
  return shapes;
}

/** A cable on the floor from `a` to `b`, routed in two straight runs. */
function cable(a: [number, number], b: [number, number], ink: Ink = "dim"): Block[] {
  return [
    { kind: "line", a: [a[0], a[1], 0.05], b: [b[0], a[1], 0.05], ink, dash: 2 },
    { kind: "line", a: [b[0], a[1], 0.05], b: [b[0], b[1], 0.05], ink, dash: 2 },
  ];
}

/** A small stack of crates. */
function crates(x: number, y: number, n: number): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < n; i++)
    out.push({
      kind: "box",
      at: [x + (i % 2) * 2.2, y + Math.floor(i / 2) * 0.2, Math.floor(i / 2) * 2],
      size: [2, 2, 2],
      tone: [0.12, 0.25, 0.4],
    });
  return out;
}

/** Scenery around a line along -y: a warehouse and silos behind, pallets in front. */
function scenery(y0: number, y1: number): Block[] {
  const out: Block[] = [];
  let i = 0;
  for (let y = y0; y <= y1; y += 4, i++) {
    out.push({
      kind: "box",
      at: [-24, y, 0],
      size: [3, 3, 9 + (i % 3) * 3],
      floors: 1.5,
      tone: [0.03, 0.08, 0.18],
      layer: -1,
      decor: true,
    });
    if (i % 3 === 0)
      out.push({
        kind: "box",
        at: [-36, y, 0],
        size: [6, 6, 16],
        floors: 4,
        vents: true,
        tone: [0.03, 0.06, 0.14],
        layer: -1,
        decor: true,
      });
  }
  for (let y = y0 + 6; y <= y1 - 6; y += 9, i++) {
    for (let k = 0; k < 1 + (i % 3); k++)
      out.push({
        kind: "box",
        at: [28 + (k % 2) * 3, y + (k > 1 ? 3 : 0), Math.floor(k / 2) * 2.4],
        size: [2.6, 2.6, 2.2],
        tone: [0.08, 0.18, 0.32],
        decor: true,
      });
    out.push({
      kind: "box",
      at: [36, y - 2, 0],
      size: [5, 5, 0.6],
      tone: [0.05, 0.12, 0.2],
      decor: true,
    });
  }
  return out;
}

/** Isometric scenes, in world units, as a function of time and of an optional active index. */
/** Scenes in world units, as a function of time and of an optional active index. */
const BUILDS: Record<string, (t: number, active: number) => Block[]> = {
  ...OBJECT_SCENES,
  blocks(t, active) {
    const pick = active >= 0 ? active : Math.floor(t / 2.5) % 3;
    const shapes: Block[] = [
      { kind: "box", at: [-2, -2, 0], size: [26, 16, 1], tone: [0.03, 0.12, 0.25], layer: -1 },
      { kind: "box", at: [0, 6, 1], size: [7, 7, 10], floors: 2.5 },
      { kind: "box", at: [0, 6, 11.4], size: [7, 7, 8], floors: 2.5 },
      { kind: "box", at: [9, 7, 1], size: [5, 5, 7], floors: 2 },
      { kind: "box", at: [16, 0, 1], size: [6, 9, 12], floors: 1, accent: pick === 0 },
      { kind: "box", at: [16, 0, 13.4], size: [6, 9, 10], floors: 1, accent: pick === 0 },
      { kind: "box", at: [9, -1, 1], size: [5, 6, 5], floors: 1.5, accent: pick === 1 },
      {
        kind: "box",
        at: [1, -1, 1],
        size: [6, 5, 4],
        ghost: pick !== 2,
        accent: pick === 2,
        floors: 2,
      },
    ];
    return shapes;
  },
  network(t) {
    const shapes: Block[] = [];
    for (let k = -16; k <= 16; k += 4) {
      shapes.push({ kind: "line", a: [k, -16, 0], b: [k, 16, 0], ink: "faint", dash: 1 });
      shapes.push({ kind: "line", a: [-16, k, 0], b: [16, k, 0], ink: "faint", dash: 1 });
    }
    const ends: Vec3[] = [
      [-13, -13, 0],
      [13, -13, 0],
      [-13, 13, 0],
      [13, 13, 0],
    ];
    for (const [x, y] of ends) {
      shapes.push({ kind: "line", a: [0, 0, 0.05], b: [x, 0, 0.05], ink: "accent" });
      shapes.push({ kind: "line", a: [x, 0, 0.05], b: [x, y, 0.05], ink: "accent" });
      shapes.push({ kind: "box", at: [x - 2.5, y - 2.5, 0], size: [5, 5, 2.5], plate: true });
    }
    shapes.push({ kind: "box", at: [-4, -4, 0], size: [8, 8, 7], vents: true, floors: 3.5 });
    shapes.push({ kind: "box", at: [-3, -3, 7.6], size: [6, 6, 1.2], plate: true, accent: true });
    ends.forEach(([x, y], i) => {
      const k = (t * 0.5 + i * 0.25) % 1;
      const total = Math.abs(x) + Math.abs(y);
      const along = k * total;
      const pos: Vec3 =
        along < Math.abs(x)
          ? [Math.sign(x) * along, 0, 0.1]
          : [x, Math.sign(y) * (along - Math.abs(x)), 0.1];
      shapes.push({ kind: "dot", at: pos, ink: "ink", size: 2 });
    });
    return shapes;
  },
  pipeline(t) {
    const shapes: Block[] = [];
    for (let k = -4; k <= 28; k += 4) {
      shapes.push({ kind: "line", a: [k, -4, 0], b: [k, 28, 0], ink: "faint", dash: 1 });
      shapes.push({ kind: "line", a: [-4, k, 0], b: [28, k, 0], ink: "faint", dash: 1 });
    }
    // Repository, then a preview per push (stacked ghosts), then production.
    shapes.push({ kind: "line", a: [5, 10, 0.05], b: [5, 18, 0.05], ink: "accent" });
    shapes.push({ kind: "line", a: [10, 5, 0.05], b: [18, 5, 0.05], ink: "ink" });
    shapes.push({ kind: "box", at: [0, 0, 0], size: [10, 10, 1.4], plate: true, vents: true });
    shapes.push({ kind: "box", at: [0, 18, 0], size: [10, 10, 1], ghost: true });
    shapes.push({ kind: "box", at: [0, 18, 1.6], size: [10, 10, 1], ghost: true });
    shapes.push({ kind: "box", at: [0, 18, 3.2], size: [10, 10, 1.4], plate: true, accent: true });
    shapes.push({ kind: "box", at: [18, 0, 0], size: [10, 10, 1.4], plate: true });
    const k = (t * 0.4) % 1;
    shapes.push({ kind: "dot", at: [5, 10 + k * 8, 0.1], ink: "ink", size: 2 });
    shapes.push({ kind: "dot", at: [10 + ((k + 0.5) % 1) * 8, 5, 0.1], ink: "ink", size: 2 });
    return shapes;
  },
  /** The pipeline with its three stops named in the drawing, on plates (the home page). */
  "pipeline-labels"(t) {
    const pipeline = BUILDS.pipeline;
    if (!pipeline) return [];
    return [
      ...pipeline(t, -1),
      { kind: "label", text: "Repository", at: [5, 5, 8], to: [5, 5, 1.4] },
      { kind: "label", text: "Preview", at: [5, 23, 10], to: [5, 23, 4.6], active: true },
      { kind: "label", text: "Production", at: [23, 5, 8], to: [23, 5, 1.4] },
    ];
  },
  bars(t) {
    const shapes: Block[] = [];
    for (let k = 0; k <= 24; k += 3)
      shapes.push({ kind: "line", a: [k, 0, 0], b: [k, 6, 0], ink: "faint", dash: 1 });
    shapes.push({ kind: "line", a: [0, 0, 0], b: [24, 0, 0], ink: "faint", dash: 1 });
    shapes.push({ kind: "line", a: [0, 6, 0], b: [24, 6, 0], ink: "faint", dash: 1 });
    for (let i = 0; i < 8; i++) {
      const h = 3 + 6 * (0.5 + 0.5 * Math.sin(i * 0.9 + t * 0.8)) + (i === 5 ? 4 : 0);
      if (i === 5)
        shapes.push({ kind: "box", at: [i * 3 + 0.5, 1, 0], size: [2, 4, 16], ghost: true });
      shapes.push({
        kind: "box",
        at: [i * 3 + 0.5, 1, 0],
        size: [2, 4, h],
        accent: i === 5,
        tone: [0.1, 0.25, 0.45],
      });
    }
    return shapes;
  },
  /** A plug lowering into its socket: the MCP connector. */
  mcp(t) {
    const lift = 4 + Math.sin(t * 1.3) * 1.2;
    return [
      ...floor(-6, 20, 4),
      { kind: "box", at: [0, 0, 0], size: [12, 12, 2], plate: true, vents: true },
      { kind: "box", at: [3.5, 4, 2], size: [1.2, 1.2, 0.4], ghost: true },
      { kind: "box", at: [7.3, 4, 2], size: [1.2, 1.2, 0.4], ghost: true },
      { kind: "box", at: [3.5, 4, 2 + lift], size: [1.2, 1.2, 2] },
      { kind: "box", at: [7.3, 4, 2 + lift], size: [1.2, 1.2, 2] },
      { kind: "box", at: [2, 2, 4 + lift], size: [8, 8, 3], accent: true, floors: 1.5 },
      { kind: "box", at: [5, 5, 7 + lift], size: [2, 2, 5] },
    ];
  },
  /** Requests travelling to an endpoint and back. */
  api(t) {
    const shapes: Block[] = [...floor(-4, 32, 4)];
    shapes.push({ kind: "line", a: [6, 4, 0.05], b: [22, 4, 0.05], ink: "dim", dash: 2 });
    shapes.push({ kind: "line", a: [6, 8, 0.05], b: [22, 8, 0.05], ink: "accent" });
    shapes.push({ kind: "box", at: [0, 0, 0], size: [6, 12, 6], floors: 2, vents: true });
    shapes.push({ kind: "box", at: [22, 0, 0], size: [6, 12, 9], floors: 1.5 });
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.35 + i / 3) % 1;
      shapes.push({ kind: "box", at: [6.5 + k * 13.5, 3.2, 0], size: [1.6, 1.6, 1.2] });
      shapes.push({
        kind: "box",
        at: [20 - k * 13.5, 7.2, 0],
        size: [1.6, 1.6, 1.2],
        accent: true,
      });
    }
    return shapes;
  },
  /** A standing browser window with its blocks. */
  web(t) {
    const pop = 0.6 + Math.max(0, Math.sin(t * 1.5)) * 0.8;
    return [
      ...floor(-4, 22, 4),
      { kind: "box", at: [0, 0, 0], size: [16, 1, 12], tone: [0.1, 0.06, 0.3] },
      { kind: "box", at: [0, 1, 10.5], size: [16, 0.4, 1.5], accent: true },
      { kind: "box", at: [1, 1, 1], size: [6, 0.6, 8] },
      { kind: "box", at: [8, 1, 6], size: [7, pop, 3] },
      { kind: "box", at: [8, 1, 1], size: [7, 0.6, 4] },
      { kind: "dot", at: [1, 1.2, 11.2], ink: "ink", size: 2 },
      { kind: "dot", at: [2.2, 1.2, 11.2], ink: "ink", size: 2 },
      { kind: "dot", at: [3.4, 1.2, 11.2], ink: "ink", size: 2 },
    ];
  },
  /** A terminal slab with its lines and a blinking cursor. */
  cli(t) {
    const shapes: Block[] = [
      ...floor(-4, 20, 4),
      { kind: "box", at: [0, 0, 0], size: [16, 12, 1.4], vents: true, layer: -2 },
      { kind: "box", at: [0.8, 0.8, 1.4], size: [14.4, 10.4, 0.2], tone: [0.02, 0, 0], layer: -1 },
    ];
    const lines = [9, 6, 11, 4, 7];
    lines.forEach((len, i) => {
      const y = 1.6 + i * 1.9;
      shapes.push({ kind: "box", at: [1.6, y, 1.6], size: [1, 1, 0.5], accent: true });
      shapes.push({ kind: "box", at: [3.2, y, 1.6], size: [len, 1, 0.5] });
    });
    if (Math.floor(t * 2) % 2 === 0)
      shapes.push({ kind: "box", at: [3.2, 1.6 + 5 * 1.9, 1.6], size: [1, 1, 1.4], accent: true });
    return shapes;
  },
  /** A version asking for more waits at the gate: preview runs, production follows once approved. */
  gate(t) {
    const open = t % 5 > 2.6;
    const lift = open ? Math.min(3, ((t % 5) - 2.6) * 6) : 0;
    return [
      ...floor(-4, 30, 4),
      {
        kind: "line",
        a: [8, 4, 0.05],
        b: [22, 4, 0.05],
        ink: open ? "accent" : "dim",
        dash: open ? 0 : 2,
      },
      { kind: "box", at: [0, 0, 0], size: [8, 8, 1.4], plate: true, accent: true },
      { kind: "box", at: [14, 0.5, 0], size: [1.2, 1.2, 6], floors: 1 },
      { kind: "box", at: [14, 6.3, 0], size: [1.2, 1.2, 6], floors: 1 },
      { kind: "box", at: [14.1, 1.7, 4.6 + lift], size: [1, 4.6, 0.9], accent: !open },
      open
        ? { kind: "box", at: [22, 0, 0], size: [8, 8, 1.4], plate: true }
        : { kind: "box", at: [22, 0, 0], size: [8, 8, 1.4], ghost: true },
    ];
  },
  /**
   * Hero · the cell: one tool after another, through an automated cell. Commits drop in, an arm
   * inspects them, an indexing table builds (press) and tests (scan) them, a gantry ships them,
   * an arm labels them, and a sorter hands each one to one of the four interfaces, under a rack
   * row whose trays carry packets. One slow beat drives it all; motions ease and never bounce.
   */
  "hero-cell"(t) {
    const B = 1.25;
    const n = Math.floor(t / B);
    const f = t / B - n;
    const MOVE = 0.42;
    const glide = (k: number) => {
      const q = Math.min(1, Math.max(0, k));
      return q * q * q * (q * (q * 6 - 15) + 10);
    };
    /** Steps taken at age `a` (in beats): whole beats, each eased over the first part of the beat. */
    const steps = (a: number) => Math.floor(a) + glide((a - Math.floor(a)) / MOVE);
    const shapes: Block[] = [...floorGrid(-40, 40, -60, 50, 4)];
    const line = (a: Vec3, b: Vec3, ink: Ink = "ink", dash = 0): Block =>
      dash ? { kind: "line", a, b, ink, dash } : { kind: "line", a, b, ink };

    /** A wheel in the horizontal plane (`h`) or in the plane x = const (`v`), with teeth or spokes. */
    const wheel = (
      c: Vec3,
      r: number,
      plane: "h" | "v",
      angle: number,
      opts: { teeth?: number; spokes?: number; ink?: Ink; hub?: number } = {},
    ) => {
      const P = (rad: number, a: number): Vec3 =>
        plane === "h"
          ? [c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad, c[2]]
          : [c[0], c[1] + Math.cos(a) * rad, c[2] + Math.sin(a) * rad];
      const ink = opts.ink ?? "ink";
      const seg = Math.max(18, Math.round(r * 7));
      for (let k = 0; k < seg; k++) {
        const a0 = (k / seg) * Math.PI * 2;
        const a1 = ((k + 1) / seg) * Math.PI * 2;
        shapes.push(line(P(r, a0), P(r, a1), ink));
      }
      for (let k = 0; k < (opts.teeth ?? 0); k++) {
        const a = angle + (k / opts.teeth!) * Math.PI * 2;
        shapes.push(line(P(r, a), P(r + 0.55, a), ink));
      }
      for (let k = 0; k < (opts.spokes ?? 0); k++) {
        const a = angle + (k / opts.spokes!) * Math.PI * 2;
        shapes.push(line(P(opts.hub ?? 0.4, a), P(r, a), "dim"));
      }
      if (opts.hub) {
        for (let k = 0; k < 10; k++)
          shapes.push(
            line(
              P(opts.hub, (k / 10) * Math.PI * 2),
              P(opts.hub, ((k + 1) / 10) * Math.PI * 2),
              "dim",
            ),
          );
      }
    };

    // Back row: racks with status lights and fans, cable trays carrying packets over the line.
    for (let k = 0, y = -36; y <= 30; y += 3.4, k++) {
      const h = rack(shapes, -12, y, t, k);
      if (k % 3 === 1) fan(shapes, [-12, y, h + 0.1], 1.1, t * 3 + k);
    }
    tray(shapes, [-9.5, -36, 13], [-9.5, 30, 13], t, 3, 12);
    tray(shapes, [-9, 20, 12], [-2, 20, 12], t, 2, 2);
    tray(shapes, [-9, -30, 12], [-2, -30, 12], t, 2, 2);
    shapes.push(line([-2, 20, 12], [-2, 20, 6.5], "dim", 2));
    shapes.push(line([-2, -30, 12], [-2, -30, 2], "dim", 2));
    // Inspection arm on the intake: it rides along with a commit, then comes back for the next.
    {
      const k = f < 0.42 ? glide(f / 0.42) : 1 - glide((f - 0.5) / 0.45);
      arm(shapes, [-6, 25, 0], [0, 28 - 5 * k, 3.6], 5, 5);
    }

    // Commits drop from the hopper onto the intake belt.
    const C: [number, number] = [0, 8];
    const RN = 4.6;
    shapes.push({ kind: "box", at: [-1.8, 31.2, 6], size: [3.6, 3.6, 3.4], floors: 1.1 });
    shapes.push({ kind: "box", at: [-1.2, 31.8, 4.8], size: [2.4, 2.4, 1.2] });
    const belt = (x: number, y0: number, y1: number, phase: number) => {
      shapes.push(
        line([x - 1.5, y0, 0.6], [x - 1.5, y1, 0.6]),
        line([x + 1.5, y0, 0.6], [x + 1.5, y1, 0.6]),
      );
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y += 2)
        shapes.push(line([x - 1.5, y + phase, 0.6], [x + 1.5, y + phase, 0.6], "faint"));
    };
    const roll = (steps(t / B) * 2) % 2;
    belt(0, 34, 14.4, -roll);

    // The indexing table: it turns a sixth per beat; nests carry the work round.
    const spin = -steps(t / B) * (Math.PI / 3);
    shapes.push({ kind: "box", at: [C[0] - 1.5, C[1] - 1.5, 0], size: [3, 3, 0.8] });
    wheel([C[0], C[1], 1], 6.2, "h", spin, { teeth: 24 });
    wheel([C[0], C[1], 0.2], 6.2, "h", 0, { ink: "dim" });
    wheel([C[0], C[1], 1.05], 1.3, "h", spin, { spokes: 6, hub: 0.3 });
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 2 + spin + (k * Math.PI) / 3;
      const x = C[0] + Math.cos(a) * RN;
      const y = C[1] + Math.sin(a) * RN;
      shapes.push({ kind: "box", at: [x - 1.2, y - 1.2, 1], size: [2.4, 2.4, 0.3], ghost: true });
    }
    const at = (deg: number): [number, number] => [
      C[0] + Math.cos((deg * Math.PI) / 180) * RN,
      C[1] + Math.sin((deg * Math.PI) / 180) * RN,
    ];
    const dwell = (lo: number, hi: number) =>
      f > lo && f < hi ? Math.sin(((f - lo) / (hi - lo)) * Math.PI) : 0;

    // Build: a press over the first station.
    {
      const [x, y] = at(30);
      shapes.push({ kind: "box", at: [x + 3.4, y - 1, 0], size: [2, 2, 10], floors: 2.5 });
      shapes.push({ kind: "box", at: [x - 1, y - 0.8, 9], size: [5.4, 1.6, 1.2] });
      const press = dwell(0.5, 0.9);
      shapes.push(line([x, y, 9], [x, y, 6.6 - press * 3.2], "dim"));
      shapes.push({ kind: "box", at: [x - 1.3, y - 1.3, 5.6 - press * 3.2], size: [2.6, 2.6, 1] });
    }
    // Test: a scanner over the second station; its beam reads the part, then lets it go.
    const scan = dwell(0.5, 0.9);
    {
      const [x, y] = at(-30);
      shapes.push({ kind: "box", at: [x + 3.4, y - 1, 0], size: [2, 2, 8], floors: 2 });
      shapes.push({ kind: "box", at: [x - 1, y - 0.6, 7.4], size: [5.4, 1.2, 0.8] });
      shapes.push({ kind: "box", at: [x - 0.8, y - 0.8, 6.4], size: [1.6, 1.6, 1] });
      if (scan > 0.05) {
        const sweep = (f - 0.5) / 0.4;
        shapes.push(line([x, y, 6.4], [x - 1 + sweep * 2, y - 1, 1.9], "signal"));
        shapes.push(line([x, y, 6.4], [x - 1 + sweep * 2, y + 1, 1.9], "signal"));
      }
    }

    // Ship: a gantry lifts each tested tool over the drive train onto the outbound belt.
    const gy0 = at(-90)[1];
    const gy1 = -11;
    for (const y of [-1.5, -14]) {
      shapes.push({ kind: "box", at: [-3.8, y - 0.5, 0], size: [1, 1, 11], floors: 2.75 });
      shapes.push({ kind: "box", at: [2.8, y - 0.5, 0], size: [1, 1, 11], floors: 2.75 });
      shapes.push({ kind: "box", at: [-3.8, y - 0.5, 11], size: [7.6, 1, 0.8] });
    }
    shapes.push({ kind: "box", at: [-0.5, -14, 11.8], size: [1, gy0 - -14 + 1.5, 0.7] });
    // Carriage course over one beat: down, up, across, down, up, back.
    const seg = (lo: number, hi: number) => glide((f - lo) / (hi - lo));
    let cy = gy0;
    let cz = 9;
    if (f < 0.42) cz = 9;
    else if (f < 0.5) cz = 9 - 7.1 * seg(0.42, 0.5);
    else if (f < 0.58) cz = 1.9 + 7.1 * seg(0.5, 0.58);
    else if (f < 0.76) {
      cz = 9;
      cy = gy0 + (gy1 - gy0) * seg(0.58, 0.76);
    } else if (f < 0.82) {
      cy = gy1;
      cz = 9 - 7.1 * seg(0.76, 0.82);
    } else if (f < 0.88) {
      cy = gy1;
      cz = 1.9 + 7.1 * seg(0.82, 0.88);
    } else cy = gy1 + (gy0 - gy1) * seg(0.88, 1);
    shapes.push({ kind: "box", at: [-1, cy - 1, 12.5], size: [2, 2, 1] });
    shapes.push(line([0, cy, 12.5], [0, cy, cz + 0.8], "dim"));
    shapes.push({ kind: "box", at: [-0.9, cy - 0.9, cz], size: [1.8, 1.8, 0.8] });

    // Outbound belt, then the sorter and the four interfaces.
    belt(0, -9, -26, roll);
    const lanes = [-7.5, -2.5, 2.5, 7.5];
    const SY = -28;
    const DY = -42;
    for (const lx of lanes) {
      shapes.push(line([0, SY, 0.6], [lx, DY + 2, 0.6], "dim", 2));
      shapes.push({ kind: "box", at: [lx - 1.6, DY - 0.6, 0], size: [3.2, 1.2, 0.6], plate: true });
      shapes.push({ kind: "box", at: [lx - 1.6, DY - 0.6, 0.6], size: [0.6, 1.2, 5] });
      shapes.push({ kind: "box", at: [lx + 1, DY - 0.6, 0.6], size: [0.6, 1.2, 5] });
      shapes.push({ kind: "box", at: [lx - 1.6, DY - 0.6, 5.6], size: [3.2, 1.2, 0.8] });
    }
    shapes.push({ kind: "box", at: [-1.4, SY - 1.4, 0], size: [2.8, 2.8, 0.6], plate: true });
    {
      const lane = (k: number) => lanes[((k % 4) + 4) % 4]!;
      const current = n - 14;
      const from = Math.atan2(DY - SY, lane(current - 1));
      const to = Math.atan2(DY - SY, lane(current));
      const a = from + (to - from) * glide(f / MOVE);
      shapes.push(line([0, SY, 0.9], [Math.cos(a) * 4.2, SY + Math.sin(a) * 4.2, 0.9], "ink"));
      shapes.push({
        kind: "dot",
        at: [Math.cos(a) * 4.2, SY + Math.sin(a) * 4.2, 0.9],
        ink: "ink",
        size: 2,
      });
    }

    // Labelling arm on the outbound belt, and an antenna by the doors.
    {
      const k = dwell(0.5, 0.9);
      arm(shapes, [6.5, -17, 0], [0, -19, 4 - k * 2.2], 5, 5);
      shapes.push(line([13, -46, 0], [13, -46, 12]));
      const yaw = t * 0.35;
      const e1: Vec3 = [Math.cos(yaw), Math.sin(yaw), 0];
      const nrm: Vec3 = [-Math.sin(yaw), Math.cos(yaw), 0];
      wheel2(shapes, [13, -46, 13.5], 2.4, e1, Z, 0, { spokes: 4, hub: 0.3 });
      shapes.push(line([13, -46, 13.5], [13 + nrm[0] * 2, -46 + nrm[1] * 2, 13.5]));
      block(shapes, [10, -36, 0], [2.4, 1.2, 3], { floors: 1 });
      block(shapes, [10, -36, 3], [2.8, 0.4, 2], { ghost: true });
    }

    // The tools themselves: item i enters at beat i and is a pure function of its age in beats.
    for (let i = n - 17; i <= n; i++) {
      const a = t / B - i;
      if (a < 0) continue;
      const k = a - Math.floor(a);
      let p: Vec3 | null = null;
      if (a < 1) p = [0, 33, 0.8 + 4 * (1 - glide(k / 0.6))];
      else if (a < 4) p = [0, 33 - 5 * (steps(a) - 1) - 0, 0.8];
      else if (a < 5) {
        const y0 = 18;
        const y1 = at(90)[1];
        p = [0, y0 + (y1 - y0) * glide((k - 0.45) / 0.4), 0.8 + 0.5 * glide((k - 0.45) / 0.4)];
      } else if (a < 9) {
        const deg = 90 - 60 * Math.min(3, steps(a - 5));
        const [x, y] = at(deg);
        p = [x, y, 1.3];
        if (a >= 8 && k >= 0.5) {
          if (k < 0.58) p = [0, gy0, cz - 0.6];
          else if (k < 0.82) p = [0, cy, cz - 0.6];
          else p = [0, gy1, 0.8];
        }
      } else if (a < 13) p = [0, gy1 - 4 * steps(a - 9) * (15 / 16), 0.8];
      else if (a < 14) p = [0, gy1 - 15 + (SY - gy1 + 15) * glide(k / MOVE), 0.8];
      else if (a < 15.5) {
        const lx = lanes[((i % 4) + 4) % 4]!;
        const q = glide((a - 14) / 1.4);
        p = [lx * q, SY + (DY + 1 - SY) * q, 0.8];
      }
      if (!p) continue;
      const built = a > 6.75;
      const tested = a > 7.75;
      const size: Vec3 = built ? [2, 2, 0.6] : [1.6, 1.6, 1.6];
      shapes.push({
        kind: "box",
        at: [p[0] - size[0] / 2, p[1] - size[1] / 2, p[2]],
        size,
        plate: built,
        signal: tested,
      });
    }
    // A door lights when a tool goes through it.
    for (let i = n - 17; i <= n; i++) {
      const a = t / B - i;
      if (a >= 15.3 && a < 15.9) {
        const lx = lanes[((i % 4) + 4) % 4]!;
        shapes.push({ kind: "box", at: [lx - 1, DY - 0.4, 0.6], size: [2, 0.8, 5], signal: true });
      }
    }
    return shapes;
  },
  /** The machine: a very complex mechanism that does nothing (/machine). */
  machine: (t) => machine(t),
  /** Hero · the line: three tools forged in parallel, from the repository to production, in seven stations. */
  "hero-line"(t) {
    const D = 9;
    const Y = (s: number) => -s * D;
    const lanes = [6, 9.5, 13];
    const shapes: Block[] = [
      ...floorGrid(-60, 60, -110, 60, 4),
      ...racks(t, Y(7.4), Y(-1.2), 15),
      ...scenery(Y(9), Y(-3)),
    ];
    shapes.push(...crates(4, Y(-1.1), 6), ...crates(17, Y(6.6), 4));
    // Belts: two rails and rollers per lane.
    const yA = Y(-0.7);
    const yB = Y(7.2);
    for (const lx of lanes) {
      shapes.push({ kind: "line", a: [lx - 1.2, yA, 0.6], b: [lx - 1.2, yB, 0.6], ink: "ink" });
      shapes.push({ kind: "line", a: [lx + 1.2, yA, 0.6], b: [lx + 1.2, yB, 0.6], ink: "ink" });
      for (let y = yB; y <= yA; y += 1.5)
        shapes.push({ kind: "line", a: [lx - 1.2, y, 0.6], b: [lx + 1.2, y, 0.6], ink: "faint" });
    }
    // Items flowing on the three lanes, staggered.
    const v = 0.38;
    const items: { s: number; lane: number }[] = [];
    lanes.forEach((_, k) => {
      for (let n = 0; n < 5; n++)
        items.push({ s: ((t * v + k * 0.47 + n * 1.5) % 7.5) - 0.5, lane: k });
    });
    const near = (st: number) => items.some((it) => Math.abs(it.s - st) < 0.18);
    // Control cabinets behind each station, cabled to it.
    const cab = [3, 7, 5, 6, 4, 3, 9];
    cab.forEach((h, i) => {
      shapes.push({
        kind: "box",
        at: [-6, Y(i) - 2.5, 0],
        size: [4, 5, h],
        floors: 1.5,
        vents: true,
      });
      shapes.push(...cable([-2, Y(i)], [4, Y(i) + 1.5]));
    });
    // 01 Repo: one intake hopper per lane.
    for (const lx of lanes)
      shapes.push({
        kind: "box",
        at: [lx - 1.4, Y(0) - 1.4, 0],
        size: [2.8, 2.8, 3.2],
        plate: true,
        accent: near(0),
      });
    // 02 Build: a gantry with three hammers.
    {
      const y = Y(1);
      shapes.push({ kind: "box", at: [3.6, y - 0.6, 0], size: [1.2, 1.2, 8] });
      shapes.push({ kind: "box", at: [15, y - 0.6, 0], size: [1.2, 1.2, 8] });
      shapes.push({ kind: "box", at: [3.6, y - 1, 8], size: [12.6, 2, 1.2], accent: near(1) });
      lanes.forEach((lx, k) => {
        const z = 1.4 + 5 * Math.abs(Math.sin(Math.PI * (t / 1.1 + k / 3)));
        shapes.push({ kind: "line", a: [lx, y, z + 1], b: [lx, y, 8], ink: "dim" });
        shapes.push({ kind: "box", at: [lx - 1, y - 1, z], size: [2, 2, 1], accent: z < 2 });
        if (z < 1.8)
          for (let i = 0; i < 3; i++)
            shapes.push({
              kind: "dot",
              at: [lx + Math.cos(i * 2.1 + t) * 2, y + Math.sin(i * 2.1 + t) * 2, 1.5],
              ink: "accent",
              size: 1,
            });
      });
    }
    // 03 Test: a scanner gantry and its beam.
    {
      const y = Y(2);
      shapes.push({ kind: "box", at: [3.6, y - 1.2, 0], size: [1.2, 2.4, 6] });
      shapes.push({ kind: "box", at: [15, y - 1.2, 0], size: [1.2, 2.4, 6] });
      shapes.push({ kind: "box", at: [3.6, y - 1.2, 6], size: [12.6, 2.4, 1], floors: 0.5 });
      const scan = near(2) || Math.floor(t * 3) % 3 === 0;
      for (const dz of [1.6, 2.4])
        shapes.push({
          kind: "line",
          a: [4.8, y, dz],
          b: [15, y, dz],
          ink: scan ? "accent" : "faint",
          dash: scan ? 0 : 1,
        });
    }
    // 04 Bundle: a wrapping tunnel over the lanes.
    {
      const y = Y(3);
      shapes.push({
        kind: "box",
        at: [3.6, y - 2.5, 3.6],
        size: [12.6, 5, 2.4],
        floors: 0.8,
        accent: near(3),
      });
      shapes.push({ kind: "box", at: [3.6, y - 2.5, 0], size: [1.2, 5, 3.6] });
      shapes.push({ kind: "box", at: [15, y - 2.5, 0], size: [1.2, 5, 3.6] });
    }
    // 05 Preview: stacked plates beside the line.
    {
      const y = Y(4);
      shapes.push({ kind: "box", at: [17.5, y - 3, 0], size: [6, 6, 1], ghost: true });
      shapes.push({ kind: "box", at: [17.5, y - 3, 1.6], size: [6, 6, 1], ghost: true });
      shapes.push({
        kind: "box",
        at: [17.5, y - 3, 3.2],
        size: [6, 6, 1.2],
        plate: true,
        accent: near(4),
      });
      shapes.push(...cable([14.5, y], [17.5, y], "accent"));
    }
    // 06 Approval: a barrier per lane.
    {
      const y = Y(5);
      const open = Math.floor(t / 1.6) % 2 === 0;
      shapes.push({ kind: "box", at: [3.6, y - 0.5, 0], size: [1, 1, 5.5], floors: 1 });
      shapes.push({ kind: "box", at: [15.2, y - 0.5, 0], size: [1, 1, 5.5], floors: 1 });
      shapes.push({
        kind: "box",
        at: [3.6, y - 0.4, open ? 4.6 : 2.2],
        size: [12.6, 0.8, 0.7],
        accent: !open,
      });
    }
    // 07 Production: racks receiving the crates, an antenna.
    {
      const y = Y(6.6);
      for (let k = 0; k < 3; k++)
        shapes.push({
          kind: "box",
          at: [lanes[k]! - 1.6, y - 3.2, 0],
          size: [3.2, 3.2, 7 + k * 1.5],
          floors: 1,
          accent: near(6.6) && k === 1,
        });
      shapes.push({ kind: "line", a: [9.5, y - 1.6, 10], b: [9.5, y - 1.6, 14], ink: "ink" });
      shapes.push({
        kind: "dot",
        at: [9.5, y - 1.6, 14.2],
        ink: Math.floor(t * 2) % 2 ? "accent" : "ink",
        size: 2,
      });
    }
    // The items themselves: raw, then forged plates, then crates.
    for (const it of items) {
      const lx = lanes[it.lane] ?? 6;
      const y = Y(it.s);
      if (it.s > 6.3) continue;
      if (it.s < 1)
        shapes.push({
          kind: "box",
          at: [lx - 0.8, y - 0.8, 0.6],
          size: [1.6, 1.6, 1.6],
          tone: [0.2, 0.3, 0.5],
        });
      else if (it.s < 3)
        shapes.push({
          kind: "box",
          at: [lx - 1, y - 1, 0.6],
          size: [2, 2, 0.6],
          signal: true,
          plate: true,
        });
      else
        shapes.push({
          kind: "box",
          at: [lx - 1, y - 1, 0.6],
          size: [2, 2, 1.6],
          floors: 0.8,
          signal: true,
        });
    }
    const tags: [string, number, number, number][] = [
      ["01 REPO", 0, -4, 3],
      ["02 BUILD", 1, -4, 7],
      ["03 TEST", 2, -4, 5],
      ["04 BUNDLE", 3, -4, 6],
      ["05 PREVIEW", 4, 20.5, 4.4],
      ["06 APPROVAL", 5, -4, 3],
      ["07 PRODUCTION", 6, -4, 9],
    ];
    tags.forEach(([text, i, x, h]) => {
      const st = i === 6 ? 6.6 : i;
      shapes.push({
        kind: "label",
        text,
        at: [x, Y(i), h + 5 + (i % 2) * 3],
        to: [x, Y(i), h],
        active: near(st),
      });
    });
    return shapes;
  },
  /** Hero · from a push to production: repo, build and test, preview, approval, production. */
  "hero-pipeline"(t) {
    // Stations along -y (bottom-left to top-right on screen); the belt runs in front, at x = 7.
    const D = 11;
    const st = (s: number): [number, number] => [0, -s * D];
    const belt = (s: number): [number, number] => [7, -s * D];
    const shapes: Block[] = [...floorGrid(-40, 40, -80, 40, 4), ...racks(t, -4.6 * D, 1.2 * D, 12)];
    for (let i = 0; i < 4; i++) shapes.push(...cable([-5, -i * D - 4], [-5, -(i + 1) * D + 4]));
    shapes.push(...crates(-3, 8, 5), ...crates(11, -4 * D - 8, 3));
    const T = 11;
    const k = t % T;
    const keys: [number, number][] = [
      [0, 0],
      [1, 0],
      [2.4, 1],
      [4, 1],
      [5.4, 2],
      [6.8, 2],
      [7.6, 3],
      [8.6, 3],
      [9.6, 4],
      [11, 4],
    ];
    let ms = 0;
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, sa] = keys[i] as [number, number];
      const [tb, sb] = keys[i + 1] as [number, number];
      if (k >= ta && k <= tb) ms = sa + (sb - sa) * ((k - ta) / Math.max(0.001, tb - ta));
    }
    const stage =
      k < 1
        ? 0
        : k >= 2.4 && k < 4
          ? 1
          : k >= 5.4 && k < 6.8
            ? 2
            : k >= 7.6 && k < 8.6
              ? 3
              : k >= 9.6
                ? 4
                : -1;
    // Conveyor: two rails and rollers.
    const yA = -(-0.7 * D);
    const yB = -(4.7 * D);
    shapes.push({ kind: "line", a: [5.6, yA, 0.6], b: [5.6, yB, 0.6], ink: "ink" });
    shapes.push({ kind: "line", a: [8.4, yA, 0.6], b: [8.4, yB, 0.6], ink: "ink" });
    for (let y = yB; y <= yA; y += 1.3)
      shapes.push({ kind: "line", a: [5.6, y, 0.6], b: [8.4, y, 0.6], ink: "faint" });
    // 01 Repository and its commits.
    {
      const [x, y] = st(0);
      shapes.push({
        kind: "box",
        at: [x - 4, y - 4, 0],
        size: [8, 8, 1.4],
        plate: true,
        accent: stage === 0,
      });
      for (let c = 0; c < 3; c++)
        shapes.push({ kind: "box", at: [x - 2, y - 2, 1.4 + c * 0.9], size: [4, 4, 0.5] });
    }
    // 02 Build and test, with a press over the belt.
    {
      const [x, y] = st(1);
      shapes.push({
        kind: "box",
        at: [x - 4, y - 4, 0],
        size: [8, 8, 7],
        floors: 2.33,
        vents: true,
        accent: stage === 1,
      });
      shapes.push({ kind: "box", at: [x + 3, y - 1.5, 6.5], size: [6, 3, 1] });
      const stroke = stage === 1 ? Math.abs(Math.sin(((k - 2.4) / 1.6) * Math.PI * 2)) : 0;
      shapes.push({
        kind: "box",
        at: [x + 5.8, y - 1.2, 5.5 - stroke * 3.6],
        size: [2.4, 2.4, 1],
        accent: stage === 1,
      });
    }
    // 03 Preview, one per branch.
    {
      const [x, y] = st(2);
      shapes.push({ kind: "box", at: [x - 4, y - 4, 0], size: [8, 8, 1], ghost: true });
      shapes.push({ kind: "box", at: [x - 4, y - 4, 1.6], size: [8, 8, 1], ghost: true });
      shapes.push({
        kind: "box",
        at: [x - 4, y - 4, 3.2],
        size: [8, 8, 1.4],
        plate: true,
        accent: stage === 2,
      });
    }
    // 04 Approval: a gate across the belt.
    const lift =
      stage === 3 ? Math.min(3.5, Math.max(0, (k - 8) * 7)) : k >= 8.6 && k < 9.6 ? 3.5 : 0;
    {
      const [x, y] = belt(3);
      shapes.push({ kind: "box", at: [x - 3.3, y - 0.5, 0], size: [1, 1, 6.5], floors: 1 });
      shapes.push({ kind: "box", at: [x + 2.3, y - 0.5, 0], size: [1, 1, 6.5], floors: 1 });
      shapes.push({
        kind: "box",
        at: [x - 2.8, y - 0.4, 4.6 + lift],
        size: [5.6, 0.8, 0.8],
        accent: lift < 1,
      });
      const [sx, sy] = st(3);
      shapes.push({
        kind: "box",
        at: [sx - 3, sy - 3, 0],
        size: [6, 6, 2.5],
        plate: true,
        accent: stage === 3,
      });
    }
    // 05 Production, with its antenna.
    {
      const [x, y] = st(4);
      shapes.push({
        kind: "box",
        at: [x - 4, y - 4, 0],
        size: [8, 8, 9],
        floors: 1.5,
        accent: stage === 4,
      });
      shapes.push({ kind: "box", at: [x - 3, y - 3, 9.4], size: [6, 6, 0.8], plate: true });
      shapes.push({ kind: "line", a: [x + 2, y + 2, 10.2], b: [x + 2, y + 2, 15], ink: "ink" });
      shapes.push({
        kind: "dot",
        at: [x + 2, y + 2, 15.2],
        ink: Math.floor(t * 2) % 2 ? "accent" : "ink",
        size: 2,
      });
    }
    // The module: raw before the build, forged after.
    {
      const [x, y] = belt(ms);
      const forged = ms > 1.2;
      shapes.push({
        kind: "box",
        at: [x - 1.1, y - 1.1, 0.6],
        size: forged ? [2.2, 2.2, 0.7] : [1.8, 1.8, 1.8],
        signal: forged,
        plate: forged,
      });
    }
    const tags: [string, number, number][] = [
      ["01 REPO", 0, 4.4],
      ["02 BUILD · TEST", 1, 7],
      ["03 PREVIEW", 2, 4.6],
      ["04 APPROVAL", 3, 2.5],
      ["05 PRODUCTION", 4, 10.2],
    ];
    tags.forEach(([text, i, h]) => {
      const [x, y] = st(i);
      shapes.push({
        kind: "label",
        text,
        at: [x, y, 15 + (i % 2) * 3],
        to: [x, y, h],
        active: stage === i,
      });
    });
    return shapes;
  },
  /** Hero · the forge: raw blocks pressed into tools, sent out to the four interfaces. */
  "hero-forge"(t) {
    const D = 11;
    const line = (s: number): [number, number] => [0, -s * D];
    const shapes: Block[] = [...floorGrid(-40, 40, -70, 50, 4), ...racks(t, -4.4 * D, 2.2 * D, 14)];
    shapes.push(...crates(3, 1.5 * D + 2, 6), ...crates(-7, 1.5 * D + 6, 3));
    shapes.push(...cable([-4, 1.5 * D], [-6, -0.8 * D]));
    const strike = 1.2;
    // Conveyor from the feeder to the sorter.
    const yA = 1 * D;
    const yB = -2.4 * D;
    shapes.push({ kind: "line", a: [-1.4, yA, 0.6], b: [-1.4, yB, 0.6], ink: "ink" });
    shapes.push({ kind: "line", a: [1.4, yA, 0.6], b: [1.4, yB, 0.6], ink: "ink" });
    for (let y = yB; y <= yA; y += 1.3)
      shapes.push({ kind: "line", a: [-1.4, y, 0.6], b: [1.4, y, 0.6], ink: "faint" });
    // Feeder.
    {
      const [x, y] = line(-1.5);
      shapes.push({ kind: "box", at: [x - 3, y - 3, 0], size: [6, 6, 9], floors: 3, vents: true });
      shapes.push({ kind: "label", text: "RAW", at: [x, y, 14], to: [x, y, 9] });
    }
    // Press: column behind, arm over the belt, hammer.
    const phase = (t % strike) / strike;
    const hz = 1 + 6.5 * Math.abs(Math.sin(Math.PI * phase));
    {
      const [x, y] = line(0.8);
      shapes.push({ kind: "box", at: [x - 7, y - 3, 0], size: [3, 6, 13], floors: 3.25 });
      shapes.push({ kind: "box", at: [x - 7, y - 3, 13], size: [9, 6, 1.6] });
      shapes.push({ kind: "box", at: [x - 2, y - 2, hz], size: [4, 4, 1.6], accent: hz < 2.2 });
      shapes.push({ kind: "line", a: [x, y, hz + 1.6], b: [x, y, 13], ink: "dim" });
      if (hz < 2.4)
        for (let i = 0; i < 6; i++) {
          const a = i * 1.7 + Math.floor(t / strike);
          shapes.push({
            kind: "dot",
            at: [x + Math.cos(a) * 3, y + Math.sin(a) * 3, 1.2 + (i % 3)],
            ink: "accent",
            size: 2,
          });
        }
      shapes.push({
        kind: "label",
        text: "PRESS · BUILD",
        at: [x - 5, y, 20],
        to: [x - 5, y, 14.6],
        active: hz < 2.2,
      });
    }
    // Items: raw before the press, tools after.
    const v = 1 / (strike * 2.2);
    for (let i = 0; i < 8; i++) {
      const s = -1 + ((t * v + i * 0.45) % 3.4);
      const [x, y] = line(s);
      if (s < 0.8)
        shapes.push({
          kind: "box",
          at: [x - 0.9, y - 0.9, 0.6],
          size: [1.8, 1.8, 1.8],
          tone: [0.2, 0.3, 0.5],
        });
      else
        shapes.push({
          kind: "box",
          at: [x - 1.2, y - 1.2, 0.6],
          size: [2.4, 2.4, 0.6],
          signal: true,
          plate: true,
        });
    }
    // Sorter and the four interfaces, spread along x.
    const names = ["MCP", "API", "WEB", "CLI"];
    const [ex, ey] = line(2.4);
    names.forEach((name, i) => {
      const port: [number, number] = [(i - 1.5) * 7, -4 * D];
      shapes.push({
        kind: "line",
        a: [ex, ey, 0.05],
        b: [port[0], port[1] + 3, 0.05],
        ink: "accent",
      });
      for (let j = 0; j < 2; j++) {
        const f = (t * 0.45 + i * 0.25 + j * 0.5) % 1;
        shapes.push({
          kind: "box",
          at: [ex + (port[0] - ex) * f - 0.7, ey + (port[1] + 3 - ey) * f - 0.7, 0],
          size: [1.4, 1.4, 0.6],
          signal: true,
        });
      }
      shapes.push({
        kind: "box",
        at: [port[0] - 2.5, port[1] - 2.5, 0],
        size: [5, 5, 3],
        plate: true,
      });
      shapes.push({
        kind: "label",
        text: name,
        at: [port[0], port[1], 7 + (i % 2) * 3],
        to: [port[0], port[1], 3],
      });
    });
    return shapes;
  },
  /** Hero · the gateway: four doors in, SSO and audit beside, the tools served behind. */
  "hero-gateway"(t) {
    const D = 11;
    const pos = (s: number, k = 0): [number, number] => [k * 4, -s * D];
    const shapes: Block[] = [...floorGrid(-40, 40, -60, 50, 4), ...racks(t, -3.4 * D, 2.6 * D, 16)];
    const doors = ["MCP", "API", "WEB", "CLI"];
    const clients = doors.map((_, i) => pos(-2.2, (i - 1.5) * 1.6));
    const workers: { at: [number, number]; h: number }[] = [];
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        workers.push({ at: pos(1.7 + c * 0.6, (r - 1.5) * 1.6), h: 2 + ((c * 3 + r * 2) % 4) });
    const toolNames: Record<number, string> = {
      3: "CRM",
      9: "ODOO",
      12: "DATA HUB",
      15: "DASHBOARD",
    };
    const live = [0, 1].map((o) => {
      const n = Math.floor(t / 2 + o * 0.5);
      return { c: n % 4, w: (n * 5 + o * 3) % 16, p: (t / 2 + o * 0.5) % 1 };
    });
    const [gx, gy] = pos(0);
    clients.forEach(([x, y], i) => {
      const on = live.some((l) => l.c === i && l.p < 0.5);
      shapes.push({
        kind: "line",
        a: [x, y, 0.05],
        b: [gx, gy, 0.05],
        ink: on ? "accent" : "dim",
        dash: on ? 0 : 2,
      });
      shapes.push({
        kind: "box",
        at: [x - 2, y - 2, 0],
        size: [4, 4, 2.5],
        plate: true,
        accent: on,
      });
      shapes.push({ kind: "label", text: doors[i] ?? "", at: [x, y, 7], to: [x, y, 2.5] });
    });
    workers.forEach(({ at: [x, y], h }, i) => {
      const on = live.some((l) => l.w === i && l.p > 0.55);
      shapes.push({
        kind: "line",
        a: [gx, gy, 0.05],
        b: [x, y, 0.05],
        ink: on ? "accent" : "faint",
        dash: on ? 0 : 1,
      });
      shapes.push({
        kind: "box",
        at: [x - 1.5, y - 1.5, 0],
        size: [3, 3, h],
        floors: 1,
        accent: on,
      });
      const name = toolNames[i];
      if (name)
        shapes.push({ kind: "label", text: name, at: [x, y, h + 5 + (i % 2) * 4], to: [x, y, h] });
    });
    const busy = live.some((l) => l.p >= 0.45 && l.p <= 0.55);
    shapes.push({ kind: "box", at: [gx - 4, gy - 4, 0], size: [8, 8, 14], floors: 2, vents: true });
    shapes.push({
      kind: "box",
      at: [gx - 3, gy - 3, 14.4],
      size: [6, 6, 1],
      plate: true,
      accent: busy,
    });
    const [ax, ay] = pos(0, -2.4);
    const [bx, by] = pos(0, 2.4);
    shapes.push({ kind: "box", at: [ax - 2.5, ay - 2.5, 0], size: [5, 5, 4], plate: true });
    shapes.push({ kind: "box", at: [bx - 2.5, by - 2.5, 0], size: [5, 5, 3], floors: 1 });
    shapes.push({
      kind: "label",
      text: "GATEWAY",
      at: [gx, gy, 24],
      to: [gx, gy, 15.4],
      active: busy,
    });
    shapes.push({ kind: "label", text: "SSO", at: [ax, ay, 9], to: [ax, ay, 4] });
    shapes.push({ kind: "label", text: "AUDIT", at: [bx, by, 8], to: [bx, by, 3] });
    for (const l of live) {
      const [cx, cy] = clients[l.c] ?? [0, 0];
      const w = workers[l.w]?.at ?? [0, 0];
      const at: Vec3 =
        l.p < 0.45
          ? [cx + (gx - cx) * (l.p / 0.45), cy + (gy - cy) * (l.p / 0.45), 0.2]
          : l.p < 0.55
            ? [gx, gy, 15.6]
            : [
                gx + (w[0] - gx) * ((l.p - 0.55) / 0.45),
                gy + (w[1] - gy) * ((l.p - 0.55) / 0.45),
                0.2,
              ];
      shapes.push({ kind: "dot", at, ink: "signal", size: 3 });
    }
    return shapes;
  },
  module(t) {
    const lift = 1 + Math.sin(t * 1.1) * 0.25;
    return [
      { kind: "box", at: [0, 0, 0], size: [14, 14, 2], vents: true },
      { kind: "box", at: [1, 1, 5 * lift], size: [12, 12, 0.6], tone: [0.12, 0.2, 0.3] },
      { kind: "box", at: [2, 2, 5 * lift + 0.6], size: [4, 3, 1.4], accent: true },
      { kind: "box", at: [8, 2, 5 * lift + 0.6], size: [3, 3, 1] },
      { kind: "box", at: [2, 7, 5 * lift + 0.6], size: [2, 4, 0.8] },
      { kind: "box", at: [6, 8, 5 * lift + 0.6], size: [5, 3, 1.8] },
      { kind: "box", at: [0, 0, 11 * lift], size: [14, 14, 1.4], plate: true },
      { kind: "line", a: [0, 14, 2], b: [0, 14, 11 * lift], ink: "dim", dash: 2 },
      { kind: "line", a: [14, 14, 2], b: [14, 14, 11 * lift], ink: "dim", dash: 2 },
      { kind: "line", a: [14, 0, 2], b: [14, 0, 11 * lift], ink: "dim", dash: 2 },
    ];
  },
};

/** Wraps a block list as a scene function, marking faint lines as `decor` (never framed). */
function framed(build: (t: number, active: number) => Block[]): SceneFn {
  return ({ t, active }) => ({
    blocks: build(t, active).map((b) =>
      b.kind === "line" && b.ink === "faint" && !b.decor ? { ...b, decor: true } : b,
    ),
  });
}

/**
 * Every scene a lab canvas can show on the script layer, by the name its `data-iso` attribute
 * gives. The ERP village is not here: the site plays it from data (`library/erp-village.bp`), and
 * its function (`village.ts`) is the parity tests' reference (`library/samples.ts`), so the
 * worker that plays the scenes does not ship it.
 */
export const SCENES: Readonly<Record<string, SceneFn>> = {
  cube: examples.cube,
  stack: examples.stack,
  ...Object.fromEntries(Object.entries(BUILDS).map(([name, build]) => [name, framed(build)])),
};
