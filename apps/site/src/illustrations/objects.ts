/**
 * Recognisable objects for the home page's scenes, and the scenes built from them: what a tool is
 * given (a server, a filing cabinet, a memory stick under a lightning bolt, a safe, a belt of jobs
 * feeding a worker, a mail funnel that letters drop into and leave from), the access cards (a badge gate, a personal safe, a ticker printing the audit tape), the
 * observability desk, the production line of the develop section, driven by the scroll through
 * `lineStore`, and the AI gateway.
 *
 * Everything is square, like pixel art: boxes, straight lines and square dots, no circle. What
 * turns does it in quarter steps. The iso view looks at the corner (max x, max y): the right face
 * is the +x face, the left face the +y face. Fronts, doors and drawers are put on those faces.
 */
import type { Block, Vec3 } from "@forgeron/blueprint";
import { floorGrid, glyph } from "@forgeron/blueprint";
import { along, block, box, dot, glide, pathLength, polyline, seg } from "./parts";

type Out = Block[];

/** A deterministic pseudo-random in [0, 1) for a seed: heights, windows, sparks. */
const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * Face details (LEDs, handles, slots) lie on a face of their box: the painter's depth would draw
 * the box over them. They go up one layer, from index `from` of `out` to its end.
 */
function raise(out: Out, from: number): void {
  for (let k = from; k < out.length; k++) {
    const b = out[k]!;
    if ((b.kind === "line" || b.kind === "dot") && b.layer === undefined)
      out[k] = { ...b, layer: 1 };
  }
}

/** Boxes (from index `from`) that sit on a face go up one layer too, over their support. */
function lift(out: Out, from: number, layer = 1): void {
  for (let k = from; k < out.length; k++) {
    const b = out[k]!;
    if (b.layer === undefined) out[k] = { ...b, layer };
  }
}

/**
 * A database server: a tower of five drive bays on its +x face, each with two status lights that
 * blink; `on` turns the lights ember.
 */
function server(out: Out, at: Vec3, s: number, on: boolean, t: number): void {
  const [x, y, z] = at;
  const w = 3.4 * s;
  const d = 4.4 * s;
  const h = 8 * s;
  box(out, [x, y, z], [w, d, h], { tone: [0.06, 0.2, 0.08] });
  const from = out.length;
  const bays = 5;
  const bh = h / bays;
  for (let k = 0; k < bays; k++) {
    const bz = z + k * bh + 0.2 * s;
    box(out, [x + w, y + 0.35 * s, bz], [0.25 * s, d - 0.7 * s, bh - 0.4 * s], {
      tone: [0.04, 0.1, 0.06],
    });
    const blink = Math.floor(t * 4 + k * 3) % 5;
    dot(
      out,
      [x + w + 0.26 * s, y + d - 1 * s, bz + bh * 0.4],
      blink < 2 ? (on ? "accent" : "ink") : "dim",
      2,
    );
    dot(
      out,
      [x + w + 0.26 * s, y + d - 1.7 * s, bz + bh * 0.4],
      on && blink === 4 ? "accent" : "dim",
      2,
    );
    seg(
      out,
      [x + w + 0.26 * s, y + 0.8 * s, bz + bh * 0.4],
      [x + w + 0.26 * s, y + d * 0.45, bz + bh * 0.4],
      "faint",
    );
  }
  lift(out, from);
}

/**
 * A filing cabinet, three drawers on its +x face; the middle drawer slides out with its sheets
 * when `on`.
 */
function cabinet(out: Out, at: Vec3, s: number, on: boolean, t: number): void {
  const [x, y, z] = at;
  const w = 3.2 * s;
  const d = 3.6 * s;
  const h = 6 * s;
  const dh = h / 3;
  box(out, [x, y, z], [w, d, h], { floors: dh, tone: [0.06, 0.2, 0.1] });
  // How far the middle drawer is out: in whole steps, out, held, back in, held.
  const phase = (t * 0.5) % 1;
  const steps = 4;
  const out_ =
    phase < 0.3 ? phase / 0.3 : phase < 0.55 ? 1 : phase < 0.85 ? 1 - (phase - 0.55) / 0.3 : 0;
  const pull = on ? (Math.round(out_ * steps) / steps) * 2.4 * s : 0;
  // Handles: the middle one rides on the drawer front when it is out.
  const handles = out.length;
  for (let k = 0; k < 3; k++) {
    if (k === 1 && pull > 0) continue;
    const hz = z + dh * (k + 0.62);
    seg(out, [x + w, y + d * 0.38, hz], [x + w, y + d * 0.62, hz], "ink");
  }
  raise(out, handles);
  if (pull > 0) {
    // The drawer, then its sheets standing inside it, above the cabinet and its face details.
    const dz = z + dh + 0.12 * s;
    const ddh = dh - 0.24 * s;
    const drawer = out.length;
    box(out, [x + w, y + 0.25 * s, dz], [pull, d - 0.5 * s, ddh], { accent: true });
    for (let k = 0; (k + 1) * 0.55 * s < pull - 0.2 * s; k++)
      box(
        out,
        [x + w + 0.25 * s + k * 0.55 * s, y + 0.55 * s, dz + ddh],
        [0.15 * s, d - 1.1 * s, (0.7 + (k % 2) * 0.25) * s],
      );
    lift(out, drawer, 2);
    out.push({
      kind: "line",
      a: [x + w + pull, y + d * 0.38, dz + ddh * 0.55],
      b: [x + w + pull, y + d * 0.62, dz + ddh * 0.55],
      ink: "ink",
      layer: 3,
    });
  }
}

/** The bolt over the cache, as pixels: rows from top to bottom, `#` a cube. */
const BOLT = ["...##", "..##.", ".##..", "#####", "..##.", ".##..", "##...", "#...."];

/**
 * A cache: a memory stick (a board, its chips and its pins) with a pixel lightning bolt over it,
 * the bolt flashing and speed lines streaking past when `on`.
 */
function cacheChip(out: Out, at: Vec3, s: number, on: boolean, t: number): void {
  const [x, y, z] = at;
  const w = 2.6 * s;
  const d = 5.4 * s;
  box(out, [x, y, z], [w, d, 0.5 * s], { tone: [0.08, 0.24, 0.12] });
  for (let k = 0; k < 4; k++)
    box(
      out,
      [x + 0.5 * s, y + 0.4 * s + k * 1.25 * s, z + 0.5 * s],
      [w - 1 * s, 0.9 * s, 0.45 * s],
      {
        tone: [0.04, 0.12, 0.06],
      },
    );
  const pins = out.length;
  for (let k = 0; k < 12; k++) {
    const py = y + 0.3 * s + k * 0.42 * s;
    seg(out, [x + w, py, z + 0.05], [x + w, py, z + 0.4 * s], "dim");
  }
  raise(out, pins);
  // The bolt, in cubes, floating over the stick and stepping up and down.
  const flash = on && Math.floor(t * 4) % 3 !== 0;
  const bob = Math.floor(t * 2) % 2 ? 0.3 * s : 0;
  const c = 0.8 * s;
  const bolt = out.length;
  BOLT.forEach((row, r) =>
    [...row].forEach((ch, col) => {
      if (ch !== "#") return;
      box(
        out,
        [
          x + w / 2 - c / 2,
          y + d / 2 + 2 * c - col * c,
          z + 1.6 * s + bob + (BOLT.length - 1 - r) * c,
        ],
        [c, c, c],
        flash ? { accent: true } : { tone: [0.3, 0.5, 0.7] },
      );
    }),
  );
  lift(out, bolt, 2);
  // Speed lines, streaking past the bolt.
  if (on)
    for (let k = 0; k < 3; k++) {
      const off = ((t * 6 + k * 1.3) % 4) * s;
      const zz = z + 2.6 * s + k * 1.1 * s;
      out.push({
        kind: "line",
        a: [x + w / 2, y + d + 0.4 * s + off, zz],
        b: [x + w / 2, y + d + 1.6 * s + off, zz],
        ink: "accent",
        layer: 3,
      });
    }
}

/** An envelope lying flat at `at`: a thin box and the V of its flap. */
function envelope(out: Out, at: Vec3, lit: boolean): void {
  const [ex, ey, ez] = at;
  box(
    out,
    [ex, ey, ez],
    [1.6, 1.1, 0.3],
    lit ? { accent: true, layer: 2 } : { tone: [0.2, 0.3, 0.5], layer: 2 },
  );
  const zt = ez + 0.31;
  const ink = lit ? "accent" : "ink";
  out.push({ kind: "line", a: [ex, ey, zt], b: [ex + 0.8, ey + 0.55, zt], ink, layer: 3 });
  out.push({ kind: "line", a: [ex, ey + 1.1, zt], b: [ex + 0.8, ey + 0.55, zt], ink, layer: 3 });
}

/**
 * Mail: a stepped funnel on a base. Letters drop into it one after another (received), and a
 * letter slides out of the slot on the base and away (sent). `on` lights the leading letter
 * in, the one going out, and the slot.
 */
function mailFunnel(out: Out, c: Vec3, on: boolean, t: number): void {
  const [cx, cy, z] = c;
  box(out, [cx - 1.6, cy - 1.6, z], [3.2, 3.2, 2.6], { floors: 1.3, tone: [0.06, 0.2, 0.1] });
  const slot = out.length;
  const through = Math.floor(t * 2.1) % 3 === 0;
  seg(
    out,
    [cx + 1.6, cy - 0.8, z + 0.9],
    [cx + 1.6, cy + 0.8, z + 0.9],
    through && on ? "accent" : "ink",
  );
  dot(out, [cx + 1.6, cy + 1.1, z + 1.9], through ? (on ? "accent" : "ink") : "dim", 2);
  raise(out, slot);
  // The funnel, widening in steps.
  box(out, [cx - 1, cy - 1, z + 2.6], [2, 2, 1.2], { tone: [0.04, 0.14, 0.08] });
  box(out, [cx - 1.8, cy - 1.8, z + 3.8], [3.6, 3.6, 0.8], { tone: [0.06, 0.18, 0.1] });
  box(out, [cx - 2.6, cy - 2.6, z + 4.6], [5.2, 5.2, 0.8], { tone: [0.04, 0.12, 0.08] });
  // Received: letters dropping in, in whole steps.
  for (let k = 0; k < 3; k++) {
    const phase = (t * 0.7 + k / 3) % 1;
    const lz = z + 5.6 + Math.round((1 - phase) * 10) * 0.6;
    envelope(out, [cx - 0.8 + (k - 1) * 0.3, cy - 0.55, lz], on && k === 0);
  }
  // Sent: a letter out of the slot, along the plinth to its edge, in whole steps.
  const out1 = (t * 0.55) % 1;
  envelope(out, [cx + 1.3 + Math.round(out1 * 6) * 0.25, cy - 0.55, z], on);
}

/**
 * A queue: jobs waiting in line on a short belt, crates that step back together into a tall
 * worker behind it, whose gauge on the +x face fills as it runs the job it took. The belt runs
 * along y, in front of the worker, so the line is never hidden behind it. `on` lights the job at
 * the head of the line and the gauge.
 */
function jobQueue(out: Out, c: Vec3, on: boolean, t: number): void {
  const [cx, cy, z] = c;
  const yw = cy - 0.6;
  const L = 4.8;
  const front = yw + L;
  const top = z + 1.6;
  // The worker at the back, and the belt on two legs in front of it.
  box(out, [cx - 1.8, cy - 4.2, z], [3.6, 3.6, 6.4], {
    floors: 3.2,
    vents: true,
    tone: [0.06, 0.2, 0.1],
  });
  box(out, [cx - 1, yw + 0.3, z], [2, 0.5, 1]);
  box(out, [cx - 1, front - 0.8, z], [2, 0.5, 1]);
  box(out, [cx - 1.2, yw, z + 1], [2.4, L, 0.6], { tone: [0.04, 0.12, 0.08] });
  // The line moves one place a beat: it eases over the first third, then the worker runs it.
  const beat = t * 0.8;
  const n = Math.floor(beat);
  const u = (beat - n) * 3;
  const f = Math.min(1, u);
  const ease = f * f * (3 - 2 * f);
  const PITCH = 1.6;
  const crates: number[] = [];
  for (let k = 0; k < 4; k++) {
    const y = front - 1.5 - (k - 1 + ease) * PITCH;
    // Appears at the front of the belt, goes into the worker at the back.
    if (y >= yw - 0.05 && y + 1.4 <= front + 0.05) crates.push(y);
  }
  crates.forEach((y) => {
    const head = y === Math.min(...crates);
    box(
      out,
      [cx - 0.75, y, top],
      [1.5, 1.4, 1.4],
      head && on ? { accent: true, layer: 1 } : { tone: [0.1, 0.25, 0.4], layer: 1 },
    );
    // A job ticket on the crate's +x face.
    out.push({
      kind: "line",
      a: [cx + 0.76, y + 0.3, top + 0.8],
      b: [cx + 0.76, y + 1.1, top + 0.8],
      ink: head && on ? "accent" : "ink",
      layer: 2,
    });
  });
  // The worker's gauge, four cells up its +x face, filling while it runs the job.
  const done = u < 1 ? 0 : Math.min(4, Math.floor((u - 1) * 2) + 1);
  for (let k = 0; k < 4; k++) {
    const lit = k < done;
    box(
      out,
      [cx + 1.8, cy - 3.4, z + 1.4 + k * 1.1],
      [0.05, 2, 0.7],
      lit ? (on ? { accent: true, layer: 1 } : { tone: [0.3, 0.6, 0.9], layer: 1 }) : { layer: 1 },
    );
  }
}

/**
 * A safe, after a pixel-art safe: a squat box on four feet, its door framed twice on the +x face,
 * a lever on the left and a three-spoke handle on the right that turns a notch at a time, round a
 * square hub. `on` lights the hub and the spokes.
 */
function vault(out: Out, at: Vec3, s: number, on: boolean, t: number): void {
  const [x, y, z0] = at;
  const w = 4.6 * s;
  const d = 5 * s;
  const h = 4.6 * s;
  const f = 0.5 * s;
  for (const [fx, fy] of [
    [0.2, 0.2],
    [w - 0.8 * s, 0.2],
    [0.2, d - 0.8 * s],
    [w - 0.8 * s, d - 0.8 * s],
  ] as const)
    box(out, [x + fx, y + fy, z0], [0.6 * s, 0.6 * s, f]);
  const z = z0 + f;
  box(out, [x, y, z], [w, d, h], { tone: [0.06, 0.24, 0.08] });
  const X0 = x + w;
  const from = out.length;
  // The door: two frames, one inside the other.
  const rect = (m: number) => {
    const pts: Vec3[] = [
      [X0, y + m, z + m],
      [X0, y + d - m, z + m],
      [X0, y + d - m, z + h - m],
      [X0, y + m, z + h - m],
      [X0, y + m, z + m],
    ];
    polyline(out, pts, "ink");
  };
  rect(0.45 * s);
  rect(0.75 * s);
  raise(out, from);
  // The lever on the left, a short bar standing off the door.
  const lever = out.length;
  box(out, [X0, y + 1.25 * s, z + h * 0.32], [0.3 * s, 0.4 * s, h * 0.36], {
    tone: [0.3, 0.4, 0.6],
  });
  lift(out, lever);
  // The handle: three straight spokes with square knobs, a notch (30°) per beat, round a square hub.
  const spokes = out.length;
  const c: Vec3 = [X0 + 0.05, y + d * 0.64, z + h * 0.5];
  const notch = Math.floor(t * (on ? 3 : 1)) * (Math.PI / 6);
  const arm = 1.25 * s;
  const ink = on ? "accent" : "ink";
  for (let k = 0; k < 3; k++) {
    const a = notch + (k * 2 * Math.PI) / 3 + Math.PI / 2;
    const e: Vec3 = [c[0], c[1] + Math.cos(a) * arm, c[2] + Math.sin(a) * arm];
    seg(out, c, e, ink);
    seg(out, [c[0], c[1] + 0.12, c[2]], [e[0], e[1] + 0.12, e[2]], ink);
    dot(out, e, ink, 4);
  }
  dot(out, c, on ? "accent" : "ink", 7);
  dot(out, c, "dim", 3);
  for (let k = spokes; k < out.length; k++) out[k] = { ...out[k]!, layer: 2 };
}

/** A plinth for an object: a low slab a little wider than its footprint, under belts and cables. */
function plinth(out: Out, at: Vec3, size: Vec3): void {
  box(out, at, size, { tone: [0.03, 0.08, 0.16], layer: -2 });
}

/**
 * Cron jobs: a square alarm clock, its square dial on the +x face, the hand stepping round the
 * twelve marks; when `on`, the bells on top ring (short strokes beside them).
 */
function alarmClock(out: Out, at: Vec3, s: number, on: boolean, t: number): void {
  const [x, y, z] = at;
  const w = 2.4 * s;
  const d = 4.2 * s;
  const h = 4.2 * s;
  // Feet, body, and two square bells on top.
  box(out, [x + 0.3 * s, y + 0.3 * s, z], [0.5 * s, 0.5 * s, 0.4 * s]);
  box(out, [x + 0.3 * s, y + d - 0.8 * s, z], [0.5 * s, 0.5 * s, 0.4 * s]);
  box(out, [x, y, z + 0.4 * s], [w, d, h], { tone: [0.06, 0.22, 0.1] });
  const ring = on && Math.floor(t * 6) % 2 === 0;
  for (const by of [y + 0.4 * s, y + d - 1.6 * s])
    box(
      out,
      [x + 0.5 * s, by + (ring ? 0.1 * s : 0), z + 0.4 * s + h],
      [1.2 * s, 1.2 * s, 0.7 * s],
      on ? { accent: true } : {},
    );
  const X0 = x + w + 0.02;
  const cy = y + d / 2;
  const cz = z + 0.4 * s + h / 2;
  const R = 1.55 * s;
  const from = out.length;
  polyline(
    out,
    [
      [X0, cy - R, cz - R],
      [X0, cy + R, cz - R],
      [X0, cy + R, cz + R],
      [X0, cy - R, cz + R],
      [X0, cy - R, cz - R],
    ],
    "ink",
  );
  // Twelve marks on the square's edge, and the hand.
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const m = Math.max(Math.abs(Math.sin(a)), Math.abs(Math.cos(a)));
    dot(
      out,
      [X0, cy - (Math.sin(a) / m) * R * 0.8, cz + (Math.cos(a) / m) * R * 0.8],
      k % 3 === 0 ? "ink" : "dim",
      2,
    );
  }
  const step = Math.floor(t * 2) % 12;
  const a = (step / 12) * Math.PI * 2;
  seg(
    out,
    [X0, cy, cz],
    [X0, cy - Math.sin(a) * R * 0.65, cz + Math.cos(a) * R * 0.65],
    on ? "accent" : "ink",
  );
  seg(out, [X0, cy, cz], [X0, cy, cz + R * 0.4], "ink");
  dot(out, [X0, cy, cz], on ? "accent" : "ink", 3);
  raise(out, from);
  if (ring)
    for (const [dy2, dz2] of [
      [-0.9, 0.6],
      [d + 0.9, 0.6],
    ] as const)
      out.push({
        kind: "line",
        a: [x + w / 2, y + dy2 * (dy2 < 0 ? s : 1), z + h + dz2 * s + 0.6 * s],
        b: [x + w / 2, y + dy2 * (dy2 < 0 ? s : 1), z + h + dz2 * s + 1.4 * s],
        ink: "accent",
        layer: 3,
      });
}

/**
 * Realtime: a small broadcasting mast on a base, square waves stepping out from its top on the
 * +x side, and a presence light on the base. `on` lights the waves.
 */
function broadcaster(out: Out, at: Vec3, s: number, on: boolean, t: number): void {
  const [x, y, z] = at;
  box(out, [x, y, z], [3 * s, 3 * s, 1.6 * s], { floors: 0.8 * s, tone: [0.06, 0.2, 0.1] });
  const top: Vec3 = [x + 1.5 * s, y + 1.5 * s, z + 6.4 * s];
  // The mast: four corners narrowing to the top, braced.
  const corner = (i: number, k: number): Vec3 => {
    const r = (1 - k * 0.8) * 1 * s;
    const sx = i === 0 || i === 3 ? -1 : 1;
    const sy = i < 2 ? -1 : 1;
    return [top[0] + sx * r, top[1] + sy * r, z + 1.6 * s + k * 4.8 * s];
  };
  for (let i = 0; i < 4; i++) seg(out, corner(i, 0), corner(i, 1), "ink");
  for (let k = 0; k < 1; k += 0.34)
    for (let i = 0; i < 4; i++) seg(out, corner(i, k), corner((i + 1) % 4, k + 0.34), "dim");
  out.push({ kind: "dot", at: top, ink: on ? "accent" : "ink", size: 4, layer: 3 });
  // Square waves in the plane x = top, growing in whole steps.
  const step = Math.floor(t * 3) % 3;
  for (let w = 0; w < 3; w++) {
    const r = (0.8 + ((w + step) % 3) * 0.7) * s;
    const ink = on ? (w === 0 ? "accent" : "dim") : "faint";
    out.push(
      {
        kind: "line",
        a: [top[0] + 0.6 * s, top[1] - r, top[2] + r],
        b: [top[0] + 0.6 * s, top[1] + r, top[2] + r],
        ink,
        layer: 3,
      },
      {
        kind: "line",
        a: [top[0] + 0.6 * s, top[1] + r, top[2] + r],
        b: [top[0] + 0.6 * s, top[1] + r, top[2] - r * 0.4],
        ink,
        layer: 3,
      },
      {
        kind: "line",
        a: [top[0] + 0.6 * s, top[1] - r, top[2] + r],
        b: [top[0] + 0.6 * s, top[1] - r, top[2] - r * 0.4],
        ink,
        layer: 3,
      },
    );
  }
  const presence = out.length;
  dot(
    out,
    [x + 3 * s, y + 2.2 * s, z + 0.8 * s],
    on && Math.floor(t * 2) % 2 ? "accent" : "dim",
    2,
  );
  dot(out, [x + 3 * s, y + 1.4 * s, z + 0.8 * s], "dim", 2);
  raise(out, presence);
}

/**
 * Where each resource stands round the tool, clockwise on screen from twelve o'clock, in the
 * order of the page's list (database, files, cache, secrets, queue, mail, cron jobs, observability,
 * realtime),
 * and the route of its cable on the floor: it leaves the tool on the
 * side facing the resource and arrives square on the resource's plinth.
 */
type Spot = { at: [number, number]; size: number; route: [number, number][] };
const SPOTS: Spot[] = [
  // 0 · database, just past noon: out of the top left, round to its right side.
  {
    at: [-10, -20],
    size: 8,
    route: [
      [-3, -5],
      [-3, -20],
      [-6, -20],
    ],
  },
  // 1 · files, between one and two: straight out of the top right.
  {
    at: [1, -20],
    size: 8,
    route: [
      [1, -5],
      [1, -16],
    ],
  },
  // 2 · cache, three o'clock: out of the right, then up to it.
  {
    at: [16, -9],
    size: 8,
    route: [
      [5, -3],
      [16, -3],
      [16, -5],
    ],
  },
  // 3 · secrets, between four and five: out of the bottom right, onto the safe's top-left side.
  {
    at: [22.5, 6],
    size: 9,
    route: [
      [5, 4.5],
      [18, 4.5],
    ],
  },
  // 4 · queue, six o'clock, at the front corner: down, across under the safe, then down to it.
  {
    at: [21, 21],
    size: 9,
    route: [
      [3, 5],
      [3, 13],
      [20, 13],
      [20, 16.5],
    ],
  },
  // 5 · mail, between six and seven: straight out of the bottom left.
  {
    at: [2, 22],
    size: 8,
    route: [
      [-1, 5],
      [-1, 18],
    ],
  },
  // 6 · cron jobs, between seven and eight: out of the bottom left, then across and down to it.
  {
    at: [-11, 18],
    size: 8,
    route: [
      [-4, 5],
      [-4, 10],
      [-11, 10],
      [-11, 14],
    ],
  },
  // 7 · observability, nine o'clock: straight out of the left.
  {
    at: [-22, 4],
    size: 8,
    route: [
      [-5, 2],
      [-18, 2],
    ],
  },
  // 8 · realtime, eleven o'clock: out of the left, then up to it.
  {
    at: [-21, -9],
    size: 8,
    route: [
      [-5, -4],
      [-21, -4],
      [-21, -5],
    ],
  },
];

/** A cable along `route` on the floor, packets riding it when `on`. */
function wire(out: Out, route: readonly [number, number][], on: boolean, t: number): void {
  const pts: Vec3[] = route.map(([x, y]) => [x, y, 0.05]);
  polyline(out, pts, on ? "accent" : "dim", on ? 0 : 2);
  if (!on) return;
  const L = pathLength(pts);
  for (let k = 0; k < 3; k++) dot(out, along(pts, (t * 5 + (k * L) / 3) % L), "accent", 3);
}

/**
 * The tool and what it was given, clockwise from noon: database, files, cache, secrets, queue,
 * mail, cron jobs, observability and realtime, each wired to it. `active` (or the cycle) picks the resource in ember.
 */
function resources(t: number, active: number): Block[] {
  const pick = active >= 0 ? active : Math.floor(t / 1.6) % 9;
  const out: Out = [...floorGrid(-36, 36, -36, 36, 4)];
  // The tool, on its plinth.
  plinth(out, [-5, -5, 0], [10, 10, 0.8]);
  box(out, [-3, -3, 0.8], [6, 6, 6.4], { vents: true, floors: 3.2 });
  box(out, [-2.2, -2.2, 7.2], [4.4, 4.4, 0.8], { accent: true });
  const spot = (i: number) => {
    const { at, size, route } = SPOTS[i]!;
    wire(out, route, pick === i, t);
    plinth(out, [at[0] - size / 2, at[1] - size / 2, 0], [size, size, 0.6]);
    return at;
  };
  const [dx, dy] = spot(0);
  server(out, [dx - 1.7, dy - 2.2, 0.6], 1, pick === 0, t);
  const [fx, fy] = spot(1);
  cabinet(out, [fx - 1.9, fy - 2.2, 0.6], 1.2, pick === 1, t);
  const [cx, cy] = spot(2);
  cacheChip(out, [cx - 1.7, cy - 3.5, 0.6], 1.3, pick === 2, t);
  const [sx, sy] = spot(3);
  vault(out, [sx - 3, sy - 3.25, 0.6], 1.3, pick === 3, t);
  const [qx, qy] = spot(4);
  jobQueue(out, [qx, qy, 0.6], pick === 4, t);
  const [mx, my] = spot(5);
  mailFunnel(out, [mx, my, 0.6], pick === 5, t);
  const [kx, ky] = spot(6);
  alarmClock(out, [kx - 1.2, ky - 2.1, 0.6], 1, pick === 6, t);
  const [ox, oy] = spot(7);
  monitor(out, [ox - 1.2, oy - 2.5, 0.6], 1, pick === 7, t);
  const [rx, ry] = spot(8);
  broadcaster(out, [rx - 1.5, ry - 1.5, 0.6], 1, pick === 8, t);
  return out;
}

/** A safe, its handle turning a notch at a time. */
function safe(t: number): Block[] {
  const out: Out = [...floorGrid(-12, 12, -12, 12, 4)];
  plinth(out, [-6, -6, 0], [12, 12, 0.8]);
  vault(out, [-3.6, -4, 0.8], 1.45, true, t);
  return out;
}

/** A person, square: a body and a head, `at` their feet. */
function person(
  out: Out,
  at: Vec3,
  tone: readonly [number, number, number] = [0.2, 0.4, 0.6],
): void {
  box(out, [at[0] - 0.6, at[1] - 0.6, at[2]], [1.2, 1.2, 2.4], { tone });
  box(out, [at[0] - 0.45, at[1] - 0.45, at[2] + 2.5], [0.9, 0.9, 0.9], { tone });
}

/**
 * A toll barrier at the sign-in: a person walks up, lays a badge on the reader, the light
 * answers, the striped arm swings up, they walk through and it comes back down. Another person
 * waits their turn.
 */
function badgeGate(t: number): Block[] {
  const out: Out = [...floorGrid(-12, 12, -12, 12, 4)];
  plinth(out, [-8, -6, 0], [16, 11, 0.6]);
  const T = 6;
  const c = t % T;
  // The arm's angle, closed (0) to raised (80°), in whole steps of 10°.
  const up = c < 2.6 ? 0 : c < 3.2 ? (c - 2.6) / 0.6 : c < 5 ? 1 : c < 5.6 ? 1 - (c - 5) / 0.6 : 0;
  const angle = (Math.round(up * 8) * 10 * Math.PI) / 180;
  // The lane.
  seg(out, [-7.5, 0, 0.62], [7.5, 0, 0.62], "dim", 2);
  // The big post with its housing, and the small rest post across the lane.
  box(out, [-0.8, -4.6, 0.6], [1.6, 1.6, 3.4], { floors: 0.85 });
  box(out, [-1, -4.8, 4], [2, 2, 1.2], { tone: [0.06, 0.2, 0.1] });
  box(out, [-0.3, 3.6, 0.6], [0.6, 0.6, 2.4]);
  box(out, [-0.5, 3.4, 3], [1, 1, 0.3]);
  // The arm: cubes from the pivot along y, raised by `angle`, striped ember and ink.
  const pivot: Vec3 = [-0.3, -3.2, 4.4];
  const n = 13;
  for (let k = 0; k < n; k++) {
    const r = 0.3 + k * 0.6;
    box(
      out,
      [pivot[0], pivot[1] + Math.cos(angle) * r - 0.3, pivot[2] + Math.sin(angle) * r - 0.3],
      [0.6, 0.6, 0.6],
      {
        ...(Math.floor(k / 2) % 2 === 0 ? { accent: true } : { tone: [0.3, 0.5, 0.7] }),
        layer: 2,
      },
    );
  }
  // The reader on its pole, beside the lane, before the arm.
  box(out, [-3, -2.6, 0.6], [0.5, 0.5, 2.6]);
  box(out, [-3.4, -3, 3.2], [1.3, 1.3, 1]);
  const read = c > 2.2 && c < 5;
  out.push({
    kind: "dot",
    at: [-2.08, -2.4, 3.8],
    ink: read ? "accent" : "dim",
    size: 3,
    layer: 3,
  });
  // The walker: up to the arm, waits with the badge on the reader, then through.
  const walk =
    c < 2 ? -7.5 + (c / 2) * 5 : c < 3.2 ? -2.5 : c < 5.6 ? -2.5 + ((c - 3.2) / 2.4) * 9.5 : 7;
  const wx = Math.round(walk * 2) / 2;
  if (c < 5.6) person(out, [wx, 0, 0.6]);
  if (c > 1.6 && c < 3.2) box(out, [-2.9, -1.8, 3.4], [1, 0.2, 0.7], { accent: true, layer: 3 });
  // The next one, waiting.
  person(out, [-6, 0, 0.6], [0.1, 0.25, 0.4]);
  return out;
}

/**
 * The audit log: a ledger unrolling from its roll, one line written at a time by a pen, the
 * newest in ember; when the sheet is full it rolls back up and starts again.
 */
function ledger(t: number): Block[] {
  const out: Out = [...floorGrid(-12, 14, -10, 10, 4)];
  plinth(out, [-9, -7, 0], [22, 14, 0.6]);
  const lines = (Math.floor(t * 1.4) % 11) + 1;
  const len = 1.6 + lines * 1.1;
  // The roll, square, lying along y, with its end caps.
  box(out, [-8, -5.4, 0.6], [2.2, 10.8, 2.2], { floors: 0.55, tone: [0.08, 0.24, 0.12] });
  box(out, [-8.2, -5.8, 0.4], [2.6, 0.4, 2.6]);
  box(out, [-8.2, 5.4, 0.4], [2.6, 0.4, 2.6]);
  // The sheet, unrolled towards the viewer.
  box(out, [-5.8, -4.8, 0.6], [len, 9.6, 0.15], { tone: [0.02, 0.05, 0.03] });
  const from = out.length;
  for (let i = 0; i < lines; i++) {
    const x = -5 + i * 1.1;
    const newest = i === lines - 1;
    const w = 3 + Math.floor(hash(i * 5) * 4);
    seg(out, [x, -4.2, 0.77], [x, -3.2, 0.77], "dim");
    seg(out, [x, -2.6, 0.77], [x, -2.6 + w, 0.77], newest ? "accent" : "ink");
    if (hash(i * 3) > 0.5)
      seg(out, [x, -2.6 + w + 0.6, 0.77], [x, 3.8, 0.77], newest ? "accent" : "dim");
  }
  raise(out, from);
  // The pen, standing over the line it writes.
  const px = -5 + (lines - 1) * 1.1;
  const py = -2.6 + 3 + Math.floor(hash((lines - 1) * 5) * 4);
  box(out, [px - 0.2, py - 0.2, 0.8], [0.4, 0.4, 0.5], { accent: true, layer: 2 });
  box(out, [px - 0.25, py - 0.25, 1.3], [0.5, 0.5, 4], { tone: [0.2, 0.4, 0.6], layer: 2 });
  return out;
}

/** Scroll progress of the develop section's line, 0 to 1: the page sets it on the canvas. */
export const lineStore = { progress: 0 };

/** A monitor on a stand (observability), a stepped line and bars on its +x screen. */
function monitor(out: Out, at: Vec3, s: number, on: boolean, t: number): void {
  const [x, y, z] = at;
  box(out, [x + 0.6 * s, y + 1 * s, z], [2 * s, 3 * s, 0.4 * s], { tone: [0.06, 0.2, 0.1] });
  box(out, [x + 1.2 * s, y + 2.1 * s, z + 0.4 * s], [0.8 * s, 0.8 * s, 1.6 * s]);
  box(out, [x, y, z + 2 * s], [1.4 * s, 5 * s, 3.6 * s], { tone: [0.06, 0.22, 0.1] });
  const X0 = x + 1.4 * s + 0.02;
  const from = out.length;
  polyline(
    out,
    [
      [X0, y + 0.35 * s, z + 2.35 * s],
      [X0, y + 4.65 * s, z + 2.35 * s],
      [X0, y + 4.65 * s, z + 5.25 * s],
      [X0, y + 0.35 * s, z + 5.25 * s],
      [X0, y + 0.35 * s, z + 2.35 * s],
    ],
    "ink",
  );
  const beat = Math.floor(t * 2);
  const pts: Vec3[] = [];
  for (let k = 0; k < 6; k++) {
    const v = z + 3.6 * s + Math.floor(hash(k + beat) * 3) * 0.45 * s;
    pts.push([X0, y + 0.7 * s + k * 0.62 * s, v], [X0, y + 0.7 * s + (k + 1) * 0.62 * s, v]);
  }
  polyline(out, pts, on ? "accent" : "ink");
  for (let k = 0; k < 6; k++)
    seg(
      out,
      [X0, y + 0.8 * s + k * 0.62 * s, z + 2.7 * s],
      [X0, y + 0.8 * s + k * 0.62 * s, z + 2.7 * s + (1 + ((k + beat) % 3)) * 0.25 * s],
      "dim",
    );
  raise(out, from);
}

/** The workshop (local): walls with a tool board, a workbench, an anvil on its stump, crates. */
function workshop(out: Out, t: number, hot: boolean): void {
  plinth(out, [-50, -11, 0], [22, 20, 0.6]);
  // Back walls: along x at the back, along y on the left.
  box(out, [-50, -11, 0.6], [22, 0.6, 9], { tone: [0.03, 0.06, 0.1], layer: -1 });
  box(out, [-50, -10.4, 0.6], [0.6, 19.4, 9], { tone: [0.03, 0.1, 0.06], layer: -1 });
  const board = out.length;
  // A tool board on the back wall: hammers, a saw, pliers, a grid of pegs.
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 3; j++) dot(out, [-47 + i * 1.6, -10.38, 4 + j * 1.6], "faint", 1);
  const tool = (x0: number, len: number, head: number) => {
    seg(out, [x0, -10.38, 7.4], [x0, -10.38, 7.4 - len], "ink");
    seg(out, [x0 - head / 2, -10.38, 7.4], [x0 + head / 2, -10.38, 7.4], "ink");
    seg(out, [x0 - head / 2, -10.38, 7.1], [x0 + head / 2, -10.38, 7.1], "ink");
  };
  tool(-46, 2.6, 1.2);
  tool(-44, 2.2, 0.8);
  // The saw: a blade with teeth.
  seg(out, [-41.5, -10.38, 7.4], [-37.5, -10.38, 7.4], "ink");
  seg(out, [-41.5, -10.38, 6.4], [-37.5, -10.38, 6.4], "ink");
  for (let k = 0; k < 8; k++)
    seg(out, [-41.5 + k * 0.5, -10.38, 6.4], [-41.25 + k * 0.5, -10.38, 6.1], "dim");
  seg(out, [-37.5, -10.38, 7.4], [-36.5, -10.38, 6.4], "ink");
  // Pliers.
  seg(out, [-34.5, -10.38, 7.4], [-33.5, -10.38, 5], "ink");
  seg(out, [-33.5, -10.38, 7.4], [-34.5, -10.38, 5], "ink");
  // A window on the left wall.
  polyline(
    out,
    [
      [-49.38, -6, 3.5],
      [-49.38, -1, 3.5],
      [-49.38, -1, 7],
      [-49.38, -6, 7],
      [-49.38, -6, 3.5],
    ],
    "dim",
  );
  seg(out, [-49.38, -3.5, 3.5], [-49.38, -3.5, 7], "dim");
  seg(out, [-49.38, -6, 5.25], [-49.38, -1, 5.25], "dim");
  raise(out, board);
  // The workbench with a vise and a laptop running the tool locally.
  box(out, [-47, -8.6, 0.6], [10, 3.6, 3.2], { floors: 1.6, tone: [0.05, 0.16, 0.1] });
  box(out, [-46, -7.8, 3.8], [1.4, 1.6, 1], { tone: [0.2, 0.3, 0.4] });
  box(out, [-42.6, -7.6, 3.8], [3.4, 2.4, 0.2]);
  box(out, [-42.8, -7.6, 4], [0.2, 2.4, 2], { accent: hot });
  const lap = out.length;
  for (let k = 0; k < 3; k++)
    seg(out, [-42.58, -7.2, 4.5 + k * 0.5], [-42.58, -7.2 + 0.8 + k * 0.4, 4.5 + k * 0.5], "ink");
  raise(out, lap);
  // The anvil on its stump: foot, waist, face and a horn in steps.
  box(out, [-37.4, -1.4, 0.6], [2.8, 2.8, 2.4], { floors: 0.8, tone: [0.06, 0.2, 0.12] });
  box(out, [-37.6, -1.6, 3], [3.2, 3.2, 0.6]);
  box(out, [-37, -1, 3.6], [2, 2, 0.8]);
  box(out, [-38, -1.6, 4.4], [4.2, 3.2, 1], { accent: hot });
  box(out, [-39.2, -0.9, 4.6], [1.2, 1.8, 0.7]);
  box(out, [-40, -0.5, 4.8], [0.8, 1, 0.4]);
  // The hammer resting on it, and sparks while the tool is being forged.
  box(out, [-36.6, 1.2, 5.4], [3, 0.4, 0.4]);
  box(out, [-36.9, 0.9, 5.2], [0.8, 1, 0.9]);
  if (hot)
    for (let k = 0; k < 6; k++) {
      const a = hash(k + Math.floor(t * 6) * 7);
      const b2 = hash(k * 3 + Math.floor(t * 6));
      out.push({
        kind: "dot",
        at: [-35.6 + a * 2, -1 + b2 * 3, 6.6 + a * 2.4],
        ink: "accent",
        size: 2,
        layer: 3,
      });
    }
  // Crates and a stool.
  box(out, [-48.6, 4, 0.6], [2.6, 2.6, 2.4], { floors: 1.2, tone: [0.1, 0.2, 0.3] });
  box(out, [-48.6, 4, 3], [2.6, 2.6, 2.4], { floors: 1.2, tone: [0.1, 0.2, 0.3] });
  box(out, [-45.6, 5.2, 0.6], [2.4, 2.4, 2.2], { floors: 1.1, tone: [0.1, 0.2, 0.3] });
  box(out, [-42, 3, 0.6], [0.4, 0.4, 2.4]);
  box(out, [-42.8, 2.2, 3], [2, 2, 0.4]);
  // A lamp hanging over the anvil.
  seg(out, [-36, 0, 12], [-36, 0, 9], "dim");
  box(out, [-36.8, -0.8, 8.2], [1.6, 1.6, 0.8], { accent: hot });
}

/**
 * The preview desk: a cathode-ray monitor on a desk, its screen drawing the tool as the package
 * passes, a keyboard, a chair, and the arch the package goes through.
 */
function previewDesk(out: Out, t: number, on: boolean, k: number): void {
  plinth(out, [-12, -11, 0], [22, 20, 0.6]);
  // The desk, back left of the belt.
  box(out, [-8.4, -11.4, 0.6], [6.4, 7.4, 3.4], { floors: 1.7, tone: [0.05, 0.16, 0.1] });
  // The CRT: a deep body, its tube behind, the screen on the +x face.
  box(out, [-8.6, -10.4, 4], [1.4, 4.6, 4.2], { tone: [0.05, 0.12, 0.08] });
  box(out, [-7.4, -11, 4], [5, 5.8, 5.6], { tone: [0.08, 0.24, 0.12] });
  box(out, [-6.6, -10.2, 9.6], [3, 4.2, 0.3]);
  const scr = out.length;
  const X0 = -2.38;
  const Y0 = -10.5;
  const Z0 = 4.6;
  const W = 4.8;
  const H = 4.4;
  const frame = (m: number, ink: "ink" | "dim") =>
    polyline(
      out,
      [
        [X0, Y0 + m, Z0 + m],
        [X0, Y0 + W - m, Z0 + m],
        [X0, Y0 + W - m, Z0 + H - m],
        [X0, Y0 + m, Z0 + H - m],
        [X0, Y0 + m, Z0 + m],
      ],
      ink,
    );
  frame(0, "ink");
  frame(0.35, "dim");
  // The render: a title bar, a sidebar, then cards appearing one by one while the preview builds.
  const shown = on ? Math.min(6, Math.floor(k * 7) + 1) : (Math.floor(t * 1.5) % 3) + 1;
  seg(out, [X0, Y0 + 0.7, Z0 + H - 0.8], [X0, Y0 + W - 0.7, Z0 + H - 0.8], on ? "accent" : "ink");
  for (let r = 0; r < 4; r++)
    seg(out, [X0, Y0 + 0.7, Z0 + 0.9 + r * 0.6], [X0, Y0 + 1.4, Z0 + 0.9 + r * 0.6], "dim");
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const y0 = Y0 + 1.9 + col * 0.95;
    const z0 = Z0 + 0.7 + (1 - row) * 1.3;
    const ink = i < shown ? (on && i === shown - 1 ? "accent" : "ink") : "faint";
    polyline(
      out,
      [
        [X0, y0, z0],
        [X0, y0 + 0.75, z0],
        [X0, y0 + 0.75, z0 + 1],
        [X0, y0, z0 + 1],
        [X0, y0, z0],
      ],
      ink,
    );
  }
  // The power light.
  out.push({ kind: "dot", at: [X0, Y0 + W - 0.4, Z0 - 0.3], ink: on ? "accent" : "dim", size: 2 });
  raise(out, scr);
  // A keyboard, a mug, a chair, and a plant in a square pot.
  box(out, [-2.1, -10.4, 4], [1.2, 3.6, 0.3]);
  box(out, [-3.2, -5.8, 4], [0.8, 0.8, 0.9], { tone: [0.2, 0.3, 0.4] });
  box(out, [0.4, -9, 0.6], [0.4, 0.4, 2]);
  box(out, [-0.4, -9.8, 2.6], [2, 2, 0.4]);
  box(out, [1.2, -9.8, 3], [0.4, 2, 2.6]);
  box(out, [-10.6, 5, 0.6], [1.4, 1.4, 1.4], { tone: [0.1, 0.2, 0.3] });
  for (let k2 = 0; k2 < 4; k2++)
    seg(
      out,
      [-9.9, 5.7, 2],
      [-9.9 + (k2 - 1.5) * 0.5, 5.7 + (k2 % 2 ? 0.5 : -0.5), 3.4 + (k2 % 2) * 0.6],
      "dim",
    );
}

/** The town's origin: its plinth's back corner. The belt runs down its avenue, x 4 to 6. */
const TOWN = { ox: -8.4, oy: -56 };

/**
 * Production: a town of buildings on either side of an avenue, the belt running down it into a
 * depot; a lattice mast at the far corner. Windows light once the release is live.
 */
function town(out: Out, t: number, live: boolean): void {
  const { ox, oy } = TOWN;
  plinth(out, [ox, oy, 0], [26, 22, 0.6]);
  const xs = [-6.6, -1.6, 8.2, 13.2];
  let n = 0;
  for (let gx = 0; gx < 4; gx++)
    for (let gy = 0; gy < 4; gy++) {
      if (gx === 3 && gy === 3) continue;
      const x = xs[gx]!;
      const y = oy + 1.4 + gy * 5;
      const h = 2.4 + Math.floor(hash(gx * 7 + gy * 13) * 5) * 1.6;
      const w = 3.4;
      const d = 3.4;
      box(out, [x, y, 0.6], [w, d, h], { floors: 1.6, tone: [0.05, 0.18, 0.1] });
      const roof = Math.floor(hash(gx * 3 + gy) * 3);
      if (roof === 0) box(out, [x + 0.6, y + 0.6, h + 0.6], [1.2, 1.2, 1]);
      if (roof === 1)
        seg(out, [x + w / 2, y + d / 2, h + 0.6], [x + w / 2, y + d / 2, h + 2.4], "dim");
      if (roof === 2) box(out, [x + w - 1.4, y + 0.4, h + 0.6], [1, 1.6, 0.8]);
      const win = out.length;
      for (let f = 0; f * 1.6 + 1.2 < h; f++)
        for (let c = 0; c < 2; c++) {
          const on = live && hash(n++ + Math.floor(t * 1.5) * 3) > 0.55;
          dot(out, [x + w, y + 0.9 + c * (d - 1.8), 1.5 + f * 1.6], on ? "accent" : "faint", 2);
          dot(out, [x + 0.9 + c * (w - 1.8), y + d, 1.5 + f * 1.6], on ? "accent" : "faint", 2);
        }
      raise(out, win);
    }
  // The depot at the end of the avenue, where the package goes in.
  box(out, [2.4, oy + 1, 0.6], [5.2, 4.6, 4.6], { floors: 2.3, tone: [0.06, 0.2, 0.1] });
  box(out, [2.2, oy + 0.8, 5.2], [5.6, 5, 0.5]);
  const door = out.length;
  polyline(
    out,
    [
      [4, oy + 5.62, 0.7],
      [4, oy + 5.62, 3.4],
      [6, oy + 5.62, 3.4],
      [6, oy + 5.62, 0.7],
    ],
    "ink",
  );
  raise(out, door);
  // The mast in the free corner: four corners narrowing, braced in zigzags, a beacon on top.
  const mx = 14.9;
  const my = oy + 18.1;
  const base = 1.4;
  const H = 12;
  const corner = (i: number, z: number): Vec3 => {
    const r = base * (1 - (z / H) * 0.7);
    const sx = i === 0 || i === 3 ? -1 : 1;
    const sy = i < 2 ? -1 : 1;
    return [mx + sx * r, my + sy * r, z];
  };
  for (let i = 0; i < 4; i++) seg(out, corner(i, 0.6), corner(i, H), "ink");
  for (let z = 0.6; z < H - 1; z += 2)
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      seg(out, corner(i, z), corner(j, z + 2), "dim");
      seg(out, corner(i, z + 2), corner(j, z + 2), "dim");
    }
  const beat = Math.floor(t * 2) % 2 === 0;
  out.push({
    kind: "dot",
    at: [mx, my, H + 0.6],
    ink: live && beat ? "accent" : "dim",
    size: 4,
    layer: 3,
  });
}

/**
 * The production line: a package of code is forged in the workshop (local), rides the belt
 * through the preview desk where a CRT draws it, and reaches the mast that ships it to the town
 * (production). `lineStore.progress` places it.
 */
function productionLine(t: number): Block[] {
  const out: Out = [...floorGrid(-52, 30, -64, 12, 4)];
  const p = lineStore.progress;
  const hot = p < 0.33;
  const inPreview = p >= 0.33 && p < 0.66;
  const live = p >= 0.66;
  // The three stations step down the (+x, -y) diagonal, which reads almost level on screen.
  const PV = { dx: -12, dy: -24 };
  const TW = { dx: 8.4, dy: -2 };
  const Y1 = PV.dy;
  const X1 = -26;
  const X2 = 5 + TW.dx;
  const END = TOWN.oy + TW.dy + 5.6;
  // The belt: off the anvil along x, down -y to the preview lane, along x through the preview,
  // then down -y into the town's depot.
  box(out, [-34, -1, 0.6], [X1 - -34 + 1, 2, 1], { tone: [0.04, 0.12, 0.26], layer: -1 });
  box(out, [X1 - 1, Y1 - 1, 0.6], [2, 1 - (Y1 - 1), 1], { tone: [0.04, 0.12, 0.26], layer: -1 });
  box(out, [X1 + 1, Y1 - 1, 0.6], [X2 + 1 - (X1 + 1), 2, 1], {
    tone: [0.04, 0.12, 0.26],
    layer: -1,
  });
  box(out, [X2 - 1, END, 0.6], [2, Y1 - 1 - END, 1], { tone: [0.04, 0.12, 0.26], layer: -1 });
  const belt = out.length;
  const shift = (t * 1.2) % 2;
  for (let x = -34 + shift; x < X1 - 1; x += 2) seg(out, [x, -0.8, 1.62], [x, 0.8, 1.62], "faint");
  for (let y = 1 - shift; y > Y1 + 1; y -= 2)
    seg(out, [X1 - 0.8, y, 1.62], [X1 + 0.8, y, 1.62], "faint");
  for (let x = X1 + 1 + shift; x < X2 - 1; x += 2)
    seg(out, [x, Y1 - 0.8, 1.62], [x, Y1 + 0.8, 1.62], "faint");
  for (let y = Y1 - 1 - shift; y > END; y -= 2)
    seg(out, [X2 - 0.8, y, 1.62], [X2 + 0.8, y, 1.62], "faint");
  raise(out, belt);
  workshop(out, t, hot);
  let from = out.length;
  previewDesk(out, t, inPreview, (p - 0.33) / 0.33);
  move(out, from, PV.dx, PV.dy);
  from = out.length;
  town(out, t, live);
  move(out, from, TW.dx, TW.dy);
  // The scrolled package: on the anvil, then along the four legs of the belt into the depot.
  const route: Vec3[] = [
    [-36.4, 0, 1.65],
    [X1, 0, 1.65],
    [X1, Y1, 1.65],
    [X2, Y1, 1.65],
    [X2, END + 1.4, 1.65],
  ];
  const total = pathLength(route);
  const dist = glide(Math.min(1, p / 0.92)) * total;
  const [x, y] = along(route, dist);
  const z = x < -34 && y === 0 ? 5.4 : 1.65;
  if (dist < total - 0.5) block(out, [x, y, z], [2.2, 2.2, 2.2], { accent: true, layer: 2 });
  // Each station's name turns orange while the package is there.
  for (const [lx, ly, label, on] of [
    [-42, -14, "LOCAL", hot],
    [-4 + PV.dx, -14 + PV.dy, "PREVIEW", inPreview],
    [10 + TW.dx, TOWN.oy + TW.dy - 2, "PRODUCTION", live],
  ] as const)
    out.push({
      kind: "label",
      at: [lx, ly, 14],
      text: label,
      plain: true,
      ink: on ? "accent" : "dim",
    });
  return out;
}

/** Shifts every block pushed since `from` by (dx, dy) on the floor. */
function move(out: Out, from: number, dx: number, dy: number): void {
  const m = (v: Vec3): Vec3 => [v[0] + dx, v[1] + dy, v[2]];
  for (let k = from; k < out.length; k++) {
    const b = out[k]!;
    if (b.kind === "line") out[k] = { ...b, a: m(b.a), b: m(b.b) };
    else if (b.kind === "box" || b.kind === "dot") out[k] = { ...b, at: m(b.at) };
    else if (b.kind === "label") out[k] = { ...b, at: m(b.at), ...(b.to ? { to: m(b.to) } : {}) };
  }
}

/** Hosting · Forgeron Cloud: a pixel cloud over your tools, sending them updates. */
function hostCloud(t: number): Block[] {
  const out: Out = [...floorGrid(-10, 10, -10, 10, 4)];
  plinth(out, [-7, -7, 0], [14, 14, 0.6]);
  // The cloud: a slab and bumps, in steps.
  const z = 9 + (Math.floor(t * 1.5) % 2) * 0.3;
  box(out, [-4.6, -2.4, z], [9.2, 4.8, 1.4], { tone: [0.1, 0.3, 0.16], layer: 2 });
  box(out, [-3, -1.6, z + 1.4], [3, 3.2, 1.2], { tone: [0.1, 0.3, 0.16], layer: 2 });
  box(out, [0.4, -2, z + 1.4], [3.4, 3.6, 1.8], { tone: [0.1, 0.3, 0.16], layer: 2 });
  // Your tools under it, an update dropping into each in turn.
  const tools: Vec3[] = [
    [-4.5, -4.5, 0.6],
    [1.5, -4.5, 0.6],
    [-1.5, 1.5, 0.6],
  ];
  const turn = Math.floor(t / 1.2) % 3;
  tools.forEach((tl, i) => {
    box(out, tl, [3, 3, 2.4], { floors: 1.2, accent: i === turn && t % 1.2 > 0.9 });
    const top: Vec3 = [tl[0] + 1.5, tl[1] + 1.5, 3];
    seg(out, top, [top[0], top[1], z], "dim", 2);
    if (i === turn) {
      const k = (t % 1.2) / 1.2;
      out.push({
        kind: "dot",
        at: [top[0], top[1], z - Math.round(k * 6) * ((z - 3) / 6)],
        ink: "accent",
        size: 3,
        layer: 3,
      });
    }
  });
  return out;
}

/** Hosting · self-managed: your own fenced plot, your terminal outside deploying into it. */
function hostSelf(t: number): Block[] {
  const out: Out = [...floorGrid(-10, 12, -10, 10, 4)];
  plinth(out, [-8, -8, 0], [13, 13, 0.6]);
  // The fence: posts round the plot and two rails.
  for (let k = 0; k <= 6; k++) {
    const u = -7.5 + k * 2;
    for (const [px, py] of [
      [u, -7.5],
      [u, 4.5],
      [-7.5, u],
      [4.5, u],
    ] as const)
      box(out, [px - 0.15, py - 0.15, 0.6], [0.3, 0.3, 1.6]);
  }
  for (const zz of [1.4, 2.1])
    polyline(
      out,
      [
        [-7.5, -7.5, zz],
        [4.5, -7.5, zz],
        [4.5, 4.5, zz],
        [-7.5, 4.5, zz],
        [-7.5, -7.5, zz],
      ],
      "dim",
    );
  // Inside: your tools.
  box(out, [-5.5, -5.5, 0.6], [3, 3, 3], { floors: 1.5 });
  box(out, [-1, -5.5, 0.6], [3, 3, 2.2], { floors: 1.1 });
  box(out, [-5.5, -1, 0.6], [3, 3, 2.2], { floors: 1.1 });
  const deploying = Math.floor(t / 2) % 2 === 1;
  box(
    out,
    [-1, -1, 0.6],
    [3, 3, deploying ? 1 + Math.min(1.6, Math.floor((t % 2) * 4) * 0.4) : 2.6],
    { accent: deploying, floors: 1.3 },
  );
  // Outside: you, at a terminal, wired in.
  box(out, [7, 0, 0], [2.4, 2, 2.6], { tone: [0.06, 0.2, 0.1] });
  box(out, [7.2, 0.2, 2.6], [0.3, 1.6, 1.4], { accent: deploying });
  person(out, [10.4, 1, 0], [0.2, 0.4, 0.6]);
  const wire: Vec3[] = [
    [7, 1, 0.05],
    [2.5, 1, 0.65],
    [0.5, 0.5, 0.65],
  ];
  polyline(out, wire, deploying ? "accent" : "dim", deploying ? 0 : 2);
  if (deploying) dot(out, along(wire, ((t % 2) / 2) * pathLength(wire)), "accent", 3);
  return out;
}

/** Hosting · your own servers: two racks in a room of your own, blinking, and their admin. */
function hostServers(t: number): Block[] {
  const out: Out = [...floorGrid(-10, 10, -10, 10, 4)];
  plinth(out, [-7, -7, 0], [14, 14, 0.6]);
  box(out, [-7, -7, 0.6], [14, 0.5, 7], { tone: [0.03, 0.06, 0.1], layer: -1 });
  for (const [x, y, seed] of [
    [-5.5, -6, 0],
    [-1.5, -6, 1],
    [2.5, -6, 2],
  ] as const) {
    box(out, [x, y, 0.6], [3, 3, 7], { tone: [0.06, 0.2, 0.1] });
    const from = out.length;
    for (let l = 0; l < 5; l++) {
      const on = Math.floor(t * 3 + seed * 3 + l * 5) % 7 < 2;
      seg(out, [x + 3, y + 0.4, 1.6 + l * 1.2], [x + 3, y + 1.8, 1.6 + l * 1.2], "faint");
      dot(out, [x + 3, y + 2.4, 1.6 + l * 1.2], on ? "accent" : "dim", 2);
    }
    raise(out, from);
  }
  person(out, [2, 3, 0.6]);
  box(out, [-3, 2, 0.6], [3, 2, 2.4], { tone: [0.06, 0.2, 0.1] });
  box(out, [-1.8, 2.4, 3], [0.3, 1.2, 1], { accent: Math.floor(t * 2) % 2 === 0 });
  return out;
}

/**
 * Observability, on one wide screen: four panels side by side on its +x face — calls as bars,
 * the time of a call as a stepped line, errors as a short row of squares, and logs scrolling.
 */
function dashboard(t: number): Block[] {
  const out: Out = [...floorGrid(-12, 12, -14, 14, 4)];
  plinth(out, [-7, -12, 0], [14, 24, 0.6]);
  // The stand and the screen.
  box(out, [-2.4, -2.5, 0.6], [3.2, 5, 0.5], { tone: [0.06, 0.2, 0.1] });
  box(out, [-1.4, -0.6, 1.1], [1.2, 1.2, 2.6]);
  box(out, [-2.4, -11, 3.7], [1.6, 22, 7.6], { tone: [0.06, 0.22, 0.1] });
  const X0 = -0.78;
  const from = out.length;
  const beat = Math.floor(t * 2);
  const panel = (y0: number) =>
    polyline(
      out,
      [
        [X0, y0, 4.3],
        [X0, y0 + 4.8, 4.3],
        [X0, y0 + 4.8, 10.7],
        [X0, y0, 10.7],
        [X0, y0, 4.3],
      ],
      "ink",
    );
  const ys = [-10.4, -5.2, 0, 5.2];
  ys.forEach(panel);
  // 1 · calls, as bars; the last one growing.
  for (let k = 0; k < 5; k++) {
    const h = k === 4 ? 1 + (beat % 6) : 1 + Math.floor(hash(k + Math.floor(beat / 6)) * 6);
    for (let r = 0; r < h; r++)
      seg(
        out,
        [X0, ys[0]! + 0.5 + k * 0.85, 4.9 + r * 0.8],
        [X0, ys[0]! + 1 + k * 0.85, 4.9 + r * 0.8],
        k === 4 ? "accent" : "ink",
      );
  }
  // 2 · time per call, a stepped line.
  const pts: Vec3[] = [];
  for (let k = 0; k < 6; k++) {
    const v = 5.4 + Math.floor(hash(k + beat) * 5) * 0.9;
    pts.push([X0, ys[1]! + 0.4 + k * 0.67, v], [X0, ys[1]! + 0.4 + (k + 1) * 0.67, v]);
  }
  polyline(out, pts, "ink");
  dot(out, pts[pts.length - 1]!, "accent", 3);
  // 3 · errors: a grid of squares, one lit now and then.
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 5; j++) {
      const lit = (i * 5 + j + beat) % 13 === 0;
      dot(out, [X0, ys[2]! + 0.9 + i * 1, 5.2 + j * 1.1], lit ? "accent" : "dim", 3);
    }
  // 4 · logs scrolling.
  for (let r = 0; r < 7; r++) {
    const len = 1.5 + Math.floor(hash(r + beat) * 3) * 0.8;
    seg(
      out,
      [X0, ys[3]! + 0.5, 4.9 + r * 0.8],
      [X0, ys[3]! + 0.5 + len, 4.9 + r * 0.8],
      r === 0 ? "accent" : "dim",
    );
  }
  raise(out, from);
  return out;
}

/** Pricing · no cold starts: the memory stick and its bolt, lit. */
function boltScene(t: number): Block[] {
  const out: Out = [...floorGrid(-10, 10, -10, 10, 4)];
  plinth(out, [-5, -5, 0], [10, 10, 0.6]);
  cacheChip(out, [-1.7, -3.5, 0.6], 1.3, true, t);
  return out;
}

/** Pricing · files served for free: the filing cabinet, its drawer coming out. */
function drawerScene(t: number): Block[] {
  const out: Out = [...floorGrid(-10, 10, -10, 10, 4)];
  plinth(out, [-5, -5, 0], [10, 10, 0.6]);
  cabinet(out, [-2.6, -2.6, 0.6], 1.4, true, t);
  return out;
}

/**
 * Pricing · a Worker per tool: three tools on plinths of their own, each with its own server
 * beside it; the lit one takes calls.
 */
function isolated(t: number): Block[] {
  const out: Out = [...floorGrid(-14, 14, -14, 14, 4)];
  const lit = Math.floor(t / 1.2) % 3;
  (
    [
      [-11, -11],
      [1, -5],
      [-5, 4],
    ] as const
  ).forEach(([x, y], i) => {
    plinth(out, [x, y, 0], [10, 7, 0.6]);
    box(out, [x + 1, y + 1.5, 0.6], [4, 4, 3.6], { floors: 1.8, accent: i === lit });
    server(out, [x + 6.2, y + 1.6, 0.6], 0.55, i === lit, t);
  });
  return out;
}

/** The six layers of a tool, top to bottom, as the anatomy section lists them. */
const LAYERS = ["Interfaces", "Access", "Tools", "Observability", "Data", "Runtime"] as const;

/** Where each layer's gap stands now, eased towards its target from frame to frame. */
const spreadNow = new Float64Array(LAYERS.length);
let spreadAt = -1;

/** A flat chip on a slab's top face at `z`: a thin box, accent when `on`, above the slab. */
function chip(
  out: Out,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  on: boolean,
  layer: number,
): void {
  out.push({
    kind: "box",
    at: [x, y, z],
    size: [w, d, 0.35],
    ...(on ? { accent: true } : { tone: [0.1, 0.3, 0.16] as const }),
    layer,
  });
}

/** A trace on a slab's top face, through `pts` (x, y), drawn above the slab. */
function trace(out: Out, pts: [number, number][], z: number, on: boolean, layer: number): void {
  for (let k = 0; k + 1 < pts.length; k++)
    out.push({
      kind: "line",
      a: [pts[k]![0], pts[k]![1], z],
      b: [pts[k + 1]![0], pts[k + 1]![1], z],
      ink: on ? "accent" : "dim",
      layer,
    });
}

/**
 * The anatomy, in the style of the first stack: six plates spaced on dashed posts, breathing a
 * little. Each plate carries a small flat schematic of its layer on its front half (the part the
 * plate above leaves in view): ports, a permission grid, processors, a graph, memory, a CPU.
 * When `active` picks one, the plates above rise apart in whole steps and the picked one is lit,
 * with its name.
 */
function stack6(t: number, active: number): Block[] {
  const out: Out = [];
  const n = LAYERS.length;
  const S = 14;
  const H = 1;
  const STEP = 6.4;
  const SPREAD = 2.4;
  const dt = spreadAt < 0 || t < spreadAt ? 0 : t - spreadAt;
  spreadAt = t;
  for (let i = 0; i < n; i++) {
    const target = active >= 0 && i < active ? SPREAD : 0;
    const k = dt > 0 ? Math.min(1, dt * 9) : 1;
    const now = spreadNow[i] ?? 0;
    spreadNow[i] = now + (target - now) * k;
  }
  let topZ = 0;
  for (let i = 0; i < n; i++) {
    const level = n - 1 - i;
    const breathe = Math.round(Math.sin(t * 1.2 + i * 0.9) * 2) * 0.15;
    const z = level * STEP + Math.round((spreadNow[i] ?? 0) * 2) / 2 + breathe;
    if (i === 0) topZ = z + H;
    const on = i === active;
    const layer = level * 2;
    out.push({
      kind: "box",
      at: [0, 0, z],
      size: [S, S, H],
      vents: true,
      ...(on ? { accent: true } : { tone: [0.05, 0.16, 0.1] as const }),
      layer,
    });
    // The plate's own frame, inset on its top face, with a stud at each corner.
    const zt = z + H + 0.02;
    trace(
      out,
      [
        [1, 1],
        [S - 1, 1],
        [S - 1, S - 1],
        [1, S - 1],
        [1, 1],
      ],
      zt,
      false,
      layer + 1,
    );
    for (const [cx, cy] of [
      [1, 1],
      [S - 1, 1],
      [1, S - 1],
      [S - 1, S - 1],
    ] as const)
      out.push({ kind: "dot", at: [cx, cy, zt], ink: "ink", size: 2, layer: layer + 1 });
    const L = layer + 1;
    if (i === 0) {
      // Interfaces: four ports along the front edge, traced back to a hub.
      for (let k = 0; k < 4; k++) {
        chip(out, 4 + k * 2.4, 11, zt, 1.4, 1.4, on, L);
        trace(
          out,
          [
            [4.7 + k * 2.4, 11],
            [4.7 + k * 2.4, 9.5],
            [8.2, 9.5],
          ],
          zt,
          on,
          L,
        );
      }
      chip(out, 7.2, 7.4, zt, 2, 2, on, L);
    } else if (i === 1) {
      // Access: a grid of permission cells, some granted, wired to a key chip.
      for (let a = 0; a < 4; a++)
        for (let b = 0; b < 3; b++)
          if ((a + b * 2) % 3 !== 0)
            chip(out, 5 + a * 1.8, 8 + b * 1.6, zt, 1, 1, on && a === 1, L);
      chip(out, 11.4, 9.4, zt, 1.6, 2.4, on, L);
      trace(
        out,
        [
          [11.4, 10.6],
          [10.2, 10.6],
        ],
        zt,
        on,
        L,
      );
    } else if (i === 2) {
      // Tools: three processors of different sizes, traced together.
      chip(out, 3.5, 8, zt, 3, 3, on, L);
      chip(out, 8, 9, zt, 2, 2, false, L);
      chip(out, 11, 8.6, zt, 1.4, 2.8, false, L);
      trace(
        out,
        [
          [6.5, 9.5],
          [8, 9.5],
        ],
        zt,
        on,
        L,
      );
      trace(
        out,
        [
          [10, 10],
          [11, 10],
        ],
        zt,
        on,
        L,
      );
      trace(
        out,
        [
          [5, 11],
          [5, 12.5],
          [12, 12.5],
          [12, 11.4],
        ],
        zt,
        on,
        L,
      );
    } else if (i === 3) {
      // Observability: a stepped graph traced across the front, and a probe chip.
      const pts: [number, number][] = [];
      for (let k = 0; k < 8; k++) {
        const y = 12 - Math.floor(((k * 5 + Math.floor(t * 2)) % 7) / 2) * 0.9;
        pts.push([3 + k * 1.2, y], [3 + (k + 1) * 1.2, y]);
      }
      trace(out, pts, zt, on, L);
      chip(out, 3, 7.6, zt, 2.2, 1.6, on, L);
    } else if (i === 4) {
      // Data: four memory strips side by side, with their bus.
      for (let k = 0; k < 4; k++) chip(out, 3.4 + k * 2.3, 7.6, zt, 1.4, 4.2, on && k === 0, L);
      trace(
        out,
        [
          [3, 12.6],
          [12, 12.6],
        ],
        zt,
        on,
        L,
      );
    } else {
      // Runtime: a big CPU, pins all round, traces out to the edges.
      chip(out, 5.5, 7, zt, 4, 4, on, L);
      for (let k = 0; k < 5; k++) {
        out.push({
          kind: "dot",
          at: [6 + k * 0.75, 11.6, zt],
          ink: on ? "accent" : "ink",
          size: 2,
          layer: L,
        });
        out.push({
          kind: "dot",
          at: [10.1, 7.5 + k * 0.75, zt],
          ink: on ? "accent" : "ink",
          size: 2,
          layer: L,
        });
      }
      trace(
        out,
        [
          [7.5, 11],
          [7.5, 13],
        ],
        zt,
        on,
        L,
      );
      trace(
        out,
        [
          [9.5, 9],
          [13, 9],
        ],
        zt,
        on,
        L,
      );
      trace(
        out,
        [
          [5.5, 9],
          [2, 9],
          [2, 12],
        ],
        zt,
        on,
        L,
      );
    }
    if (on)
      out.push({
        kind: "label",
        at: [S + 6, S + 6, z + H + 4],
        to: [S, S / 2, z + H / 2],
        text: LAYERS[i]!.toUpperCase(),
        active: true,
        fixed: true,
        layer: 99,
      });
  }
  // The dashed posts at the corners, bottom plate to top plate.
  for (const [x, y] of [
    [0.6, 0.6],
    [S - 0.6, 0.6],
    [0.6, S - 0.6],
    [S - 0.6, S - 0.6],
  ] as const)
    out.push({ kind: "line", a: [x, y, H], b: [x, y, topZ], ink: "dim", dash: 2, layer: -1 });
  return out;
}

/**
 * Text written flat on the floor at `at`, in the pixel face: letters run along +x, rows go down
 * along +y; each pixel a thin tile, so the word reads like paint on the ground.
 */
function floorText(out: Out, text: string, at: Vec3, px: number, accent = false): void {
  let cx = at[0];
  for (const ch of text.toUpperCase()) {
    const g = glyph(ch);
    const w = Math.max(...g.rows.map((r) => r.length), 1);
    g.rows.forEach((row, r) =>
      [...row].forEach((c, col) => {
        if (c !== "#") return;
        out.push({
          kind: "box",
          at: [cx + col * px, at[1] + (g.top + r) * px, at[2]],
          size: [px, px, 0.12],
          ...(accent ? { accent: true } : { tone: [0.3, 0.5, 0.7] as const }),
        });
      }),
    );
    cx += (w + 1) * px;
  }
}

/** Extras · usage per team: a row of cubes per team, compute in ink, AI in ember, names flat. */
function usageIso(t: number): Block[] {
  const out: Out = [];
  const rows = [
    { team: "Sales", c: 6, a: 4 },
    { team: "Support", c: 7, a: 6 },
    { team: "Ops", c: 9, a: 2 },
    { team: "Finance", c: 3, a: 1 },
  ];
  plinth(out, [-1, -1, 0], [36, 20, 0.4]);
  const beat = Math.floor(t * 2) % 4;
  rows.forEach((r, i) => {
    const y = 1 + i * 4.6;
    floorText(out, r.team, [0.5, y, 0.4], 0.26);
    for (let k = 0; k < r.c + r.a; k++) {
      const ai = k >= r.c;
      const last = k === r.c + r.a - 1 && i === beat;
      const h = 1.2 + (last ? 0.6 : 0);
      out.push({
        kind: "box",
        at: [14 + k * 1.5, y, 0.4],
        size: [1.2, 1.2, h],
        ...(ai ? { accent: true } : { tone: [0.1, 0.3, 0.16] as const }),
      });
    }
  });
  return out;
}

/** A small house: walls, a stepped roof, a door; `lit` turns its roof ember. */
function house(
  out: Out,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  lit: boolean,
): void {
  box(out, [x, y, 0.4], [w, d, h], { floors: h / 2, tone: [0.06, 0.2, 0.1] });
  box(out, [x - 0.2, y - 0.2, 0.4 + h], [w + 0.4, d + 0.4, 0.5], lit ? { accent: true } : {});
  box(out, [x + 0.6, y + 0.6, 0.9 + h], [w - 1.2, d - 1.2, 0.6], lit ? { accent: true } : {});
  out.push({
    kind: "line",
    a: [x + w, y + d * 0.4, 0.5],
    b: [x + w, y + d * 0.4, 0.4 + h * 0.55],
    ink: "ink",
    layer: 1,
  });
  out.push({
    kind: "line",
    a: [x + w, y + d * 0.65, 0.5],
    b: [x + w, y + d * 0.65, 0.4 + h * 0.55],
    ink: "ink",
    layer: 1,
  });
}

/**
 * Extras · marketplaces: a small village of repositories round a square, a cart going from house
 * to house as the catalog syncs; the house it reaches lights up.
 */
function market(t: number): Block[] {
  const out: Out = [...floorGrid(-14, 14, -14, 14, 4)];
  plinth(out, [-12, -12, 0], [24, 24, 0.4]);
  const spots: [number, number, number, number, number][] = [
    [-10, -10, 4, 4, 3.4],
    [-3, -10, 5, 4, 4.4],
    [5, -10, 4, 4, 3],
    [-10, -2, 4, 5, 3.8],
    [5, -1, 4, 4, 4.8],
    [-10, 6, 5, 4, 3],
    [-2, 6, 4, 4, 3.6],
    [5, 6, 4, 4, 4],
  ];
  const stop = Math.floor(t / 1.4) % spots.length;
  spots.forEach(([x, y, w, d, h], i) => house(out, x, y, w, d, h, i === stop));
  // The square, and the cart on its way to the lit house.
  out.push({ kind: "line", a: [-2, -3, 0.42], b: [3, -3, 0.42], ink: "dim", dash: 2 });
  out.push({ kind: "line", a: [3, -3, 0.42], b: [3, 4, 0.42], ink: "dim", dash: 2 });
  out.push({ kind: "line", a: [3, 4, 0.42], b: [-2, 4, 0.42], ink: "dim", dash: 2 });
  out.push({ kind: "line", a: [-2, 4, 0.42], b: [-2, -3, 0.42], ink: "dim", dash: 2 });
  const [hx, hy, hw, hd] = spots[stop]!;
  const k = Math.min(1, (t % 1.4) / 1.1);
  const cx = Math.round((0.5 + (hx + hw / 2 - 0.5) * k) * 2) / 2;
  const cy = Math.round((0.5 + (hy + hd / 2 - 0.5) * k) * 2) / 2;
  out.push({
    kind: "box",
    at: [cx - 0.6, cy - 0.5, 0.4],
    size: [1.2, 1, 0.8],
    accent: true,
    layer: 2,
  });
  return out;
}

/**
 * Extras · teams and permissions: a grid on the floor, a column per team with its person at the
 * head, a row per action written flat; a granted cell stands as a cube, a refused one stays a
 * dashed tile. The cell being checked lights up.
 */
function permissionsIso(t: number): Block[] {
  const out: Out = [];
  const teams = 3;
  const actions = ["READ", "MOVE", "EDIT", "DROP"];
  const grant = [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
  ];
  plinth(out, [-1, -5, 0], [24, 23, 0.4]);
  const check = Math.floor(t * 1.5) % (teams * actions.length);
  for (let c = 0; c < teams; c++)
    person(
      out,
      [11 + c * 4 + 1, -2.4, 0.4],
      c === check % teams ? [0.3, 0.5, 0.7] : [0.1, 0.25, 0.4],
    );
  actions.forEach((a, r) => {
    const y = 1 + r * 4;
    floorText(out, a, [0.5, y + 0.6, 0.4], 0.36);
    for (let c = 0; c < teams; c++) {
      const x = 11 + c * 4;
      const lit = r * teams + c === check;
      if (grant[r]![c])
        out.push({
          kind: "box",
          at: [x, y, 0.4],
          size: [2.4, 2.4, lit ? 2 : 1.2],
          ...(lit ? { accent: true } : { tone: [0.1, 0.3, 0.16] as const }),
        });
      else out.push({ kind: "box", at: [x, y, 0.4], size: [2.4, 2.4, 0.2], ghost: true });
    }
  });
  return out;
}

/** The check mark that stamps an approval, as cubes, rows from top to bottom. */
const CHECK = ["....#", "...#.", "#.#..", ".#..."];

/**
 * Extras · approval policies: a tool wants a resource. Its cable ends in a plug that waits by the
 * server's socket; the approval comes, the plug goes in, the socket and the server light up and a
 * check mark stamps it. Then it starts over.
 */
function approvalPlug(t: number): Block[] {
  const out: Out = [...floorGrid(-14, 14, -10, 6, 4)];
  plinth(out, [-12, -9, 0], [24, 12, 0.4]);
  const T = 5;
  const c = t % T;
  const phase = c < 1.6 ? "reach" : c < 2.6 ? "wait" : c < 4.6 ? "in" : "out";
  // The server, back left, its socket on the +x face.
  box(out, [-11, -7, 0.4], [4.4, 6, 7.6], { floors: 1.9, tone: [0.06, 0.2, 0.1] });
  const live = phase === "in";
  const sx = -6.6;
  const from = out.length;
  for (let k = 0; k < 4; k++)
    dot(out, [sx, -6, 2.2 + k * 1.9], live && (Math.floor(t * 4) + k) % 2 ? "accent" : "dim", 2);
  out.push({ kind: "line", a: [sx, -4.6, 2.6], b: [sx, -2.6, 2.6], ink: live ? "accent" : "ink" });
  out.push({ kind: "line", a: [sx, -2.6, 2.6], b: [sx, -2.6, 4.2], ink: live ? "accent" : "ink" });
  out.push({ kind: "line", a: [sx, -2.6, 4.2], b: [sx, -4.6, 4.2], ink: live ? "accent" : "ink" });
  out.push({ kind: "line", a: [sx, -4.6, 4.2], b: [sx, -4.6, 2.6], ink: live ? "accent" : "ink" });
  raise(out, from);
  // The tool, front right.
  box(out, [5, -7, 0.4], [5, 5, 5], { vents: true, floors: 2.5 });
  box(out, [5.6, -6.4, 5.4], [3.8, 3.8, 0.6], { accent: true });
  // The plug: where it stands along the way from the tool to the socket.
  const far = 3.4;
  const near = -6.2;
  const at =
    phase === "reach"
      ? far + ((near - far + 1.6) * Math.round((c / 1.6) * 6)) / 6
      : phase === "wait"
        ? near + 1.6
        : phase === "in"
          ? near
          : near + 1.6;
  out.push({
    kind: "line",
    a: [5, -3.6, 0.45],
    b: [at + 1.8, -3.6, 0.45],
    ink: live ? "accent" : "dim",
  });
  out.push({
    kind: "line",
    a: [at + 1.8, -3.6, 0.45],
    b: [at + 1.8, -3.6, 3.4],
    ink: live ? "accent" : "dim",
  });
  box(out, [at + 0.4, -4.6, 2.6], [1.6, 2, 1.8], {
    ...(live ? { accent: true } : { tone: [0.3, 0.5, 0.7] as const }),
    layer: 2,
  });
  for (const py of [-4.1, -3.1])
    out.push({
      kind: "line",
      a: [at + 0.4, py, 3.5],
      b: [at - 0.4, py, 3.5],
      ink: live ? "accent" : "ink",
      layer: 3,
    });
  // The approval: a stamp of cubes over the socket once it is in; a dashed one while it waits.
  CHECK.forEach((row, r) =>
    [...row].forEach((ch, col) => {
      if (ch !== "#") return;
      const p: Vec3 = [-4.2, -6.6 + (4 - col) * 0.95, 9.4 + (CHECK.length - 1 - r) * 0.95];
      const size: Vec3 = [0.85, 0.85, 0.85];
      if (live) out.push({ kind: "box", at: p, size, accent: true, layer: 4 });
      else if (phase === "wait") out.push({ kind: "box", at: p, size, ghost: true, layer: 4 });
    }),
  );
  return out;
}

/**
 * One AI gateway: providers on the left feed a single entry, which hands each call to the tool
 * that asked, counted on the way.
 */
function aiGateway(t: number): Block[] {
  const out: Out = [...floorGrid(-24, 24, -14, 14, 4)];
  const hub: Vec3 = [0, 0, 0];
  plinth(out, [-4, -4, 0], [8, 8, 0.8]);
  box(out, [-2.6, -2.6, 0.8], [5.2, 5.2, 5], { vents: true, floors: 2.5 });
  box(out, [-2, -2, 5.8], [4, 4, 0.8], { accent: true });
  const providers: Vec3[] = [
    [-20, -10, 0],
    [-20, -2, 0],
    [-20, 6, 0],
  ];
  const tools: Vec3[] = [
    [16, -10, 0],
    [16, -2, 0],
    [16, 6, 0],
  ];
  providers.forEach((p, i) => {
    box(out, p, [4, 4, 7 + (i % 2) * 2], { floors: 1.5, tone: [0.04, 0.12, 0.26] });
    const a: Vec3 = [p[0] + 4, p[1] + 2, 0.05];
    const pts: Vec3[] = [a, [hub[0] - 4, a[1], 0.05], [hub[0] - 4, 0, 0.05]];
    polyline(out, pts, "dim", 2);
    const L = pathLength(pts);
    dot(out, along(pts, (t * 4 + i * 3) % L), "ink", 2);
  });
  tools.forEach((p, i) => {
    box(out, p, [4, 4, 3], {});
    const b: Vec3 = [p[0], p[1] + 2, 0.05];
    const pts: Vec3[] = [[hub[0] + 4, 0, 0.05], [hub[0] + 4, b[1], 0.05], b];
    const lit = Math.floor(t / 1.2) % 3 === i;
    polyline(out, pts, lit ? "accent" : "dim", lit ? 0 : 2);
    const L = pathLength(pts);
    if (lit) dot(out, along(pts, (t * 6) % L), "accent", 3);
  });
  return out;
}

/** The objects as scene builds, by the name a canvas's `data-iso` gives. */
/**
 * The closing forge: a hammer rises and falls on a glowing bar on the anvil; each blow flattens
 * and stretches it and throws sparks. After four, a chisel cuts the end off and the blade slides
 * off down the belt, cooling, while a new bar goes on. A forge glows beside, its chimney smoking.
 */
function forge(t: number): Block[] {
  const out: Out = [...floorGrid(-18, 16, -18, 16, 4)];
  plinth(out, [-16, -15, 0], [30, 26, 0.6]);
  const T = 1.3;
  const blow = Math.floor(t / T);
  const u = (t % T) / T;
  const n = blow % 6;
  // The forge, off to the left: stepped stone, a mouth glowing on its +x face, a chimney.
  box(out, [-15, -2, 0.6], [6, 6, 4.4], { floors: 1.1, tone: [0.04, 0.12, 0.08] });
  box(out, [-15.4, -2.4, 5], [6.8, 6.8, 0.5]);
  box(out, [-13.4, -0.4, 5.5], [2.8, 2.8, 5], { floors: 1.25, tone: [0.04, 0.12, 0.08] });
  const mouth = out.length;
  const flick = Math.floor(t * 8);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++)
      if (hash(i * 3 + j + flick * 13) > 0.35)
        dot(out, [-8.98, -0.6 + i * 0.9, 1.3 + j * 0.8], j === 2 ? "dim" : "accent", 2);
  raise(out, mouth);
  // Smoke: specks rising and spreading out of the chimney.
  for (let k = 0; k < 18; k++) {
    const age = (t * 0.3 + k / 18) % 1;
    const sx = (hash(k + 70) - 0.5) * (0.6 + age * 4);
    const sy = (hash(k + 90) - 0.5) * (0.6 + age * 4);
    dot(out, [-12 + sx + age * 1.5, 1 + sy, 10.8 + age * 8], age > 0.6 ? "faint" : "dim", 2);
  }
  // The anvil on its stump, large: foot, waist, face and a horn in steps.
  box(out, [-1.6, -2.4, 0.6], [4.4, 4.4, 3.4], { floors: 1.1, tone: [0.06, 0.2, 0.12] });
  box(out, [-2, -2.8, 4], [5.2, 5.2, 0.8]);
  box(out, [-1.1, -1.9, 4.8], [3.4, 3.4, 1.2]);
  box(out, [-2.6, -2.9, 6], [6.6, 5.4, 1.6]);
  box(out, [-4.6, -1.8, 6.3], [2, 3.2, 1.1]);
  box(out, [-5.9, -1.1, 6.6], [1.3, 1.8, 0.6]);
  const face = 7.6;
  // The bar: each blow flattens and stretches it a step, the instant the hammer lands; after the
  // fourth it keeps that long flat shape. Then a chisel cuts the end off, and the blade, still
  // hot, slides off down the belt, cooling.
  const HIT = 0.74;
  const hit = u >= HIT;
  const stage = n < 4 ? n + (hit ? 1 : 0) : 4;
  const h = 1.6 - stage * 0.3;
  const w = 2.6 + stage * 0.9;
  const x0 = 1 - w / 2;
  const cutX = x0 + w - 1.2;
  if (n < 4) box(out, [x0, -0.9, face], [w, 1.8, h], { accent: true, layer: 2 });
  if (n === 4) {
    // The blade, and the end the chisel takes off: it drops beside the anvil once cut.
    box(out, [x0, -0.9, face], [(hit ? cutX - 0.1 : x0 + w) - x0, 1.8, h], {
      accent: true,
      layer: 2,
    });
    if (hit) {
      const f = Math.min(1, (u - HIT) / 0.2);
      box(out, [cutX + 0.1 + f * 1.6, -0.9 - f * 2.6, face - f * f * (face - 0.6)], [1.1, 1.8, h], {
        accent: f < 1,
        layer: 2,
      });
    }
    // The chisel: a thin blade on a shank, down on the mark.
    const cz = u < 0.62 ? face + 6 : u < HIT ? face + 6 - ((u - 0.62) / 0.12) * (6 - h) : face + h;
    box(out, [cutX - 0.15, -1.2, cz], [0.3, 2.4, 1.6], { layer: 3 });
    box(out, [cutX - 0.4, -0.4, cz + 1.6], [0.8, 0.8, 3], { tone: [0.1, 0.3, 0.2], layer: 3 });
  }
  // The belt the finished blade leaves on.
  box(out, [5, -1, 0.6], [9, 2, 1], { tone: [0.04, 0.12, 0.26], layer: -1 });
  const belt = out.length;
  for (let x = 5 + ((t * 1.2) % 2); x < 14; x += 2)
    seg(out, [x, -0.8, 1.62], [x, 0.8, 1.62], "faint");
  raise(out, belt);
  if (n === 5) {
    const k = glide(u);
    const len = cutX - 0.1 - x0;
    const x = x0 + k * 11;
    const z = k < 0.35 ? face - (k / 0.35) * (face - 1.6) : 1.6;
    box(out, [x, -0.9, z], [len, 1.8, h], { accent: k < 0.6, layer: 2 });
  }
  // The hammer: up slowly, down fast, on the bar; it rests up high while the blade is cut and leaves.
  const top = face + 8;
  const rest = face + h;
  const z =
    n >= 4
      ? top
      : u < 0.62
        ? rest + (top - rest) * glide(u / 0.62)
        : u < HIT
          ? top - (top - rest) * ((u - 0.62) / 0.12) ** 2
          : rest;
  const struck = n < 5 && hit;
  box(out, [-0.1, -1.4, z], [2.2, 2.8, 1.8], { tone: [0.1, 0.3, 0.2], layer: 3 });
  box(out, [0.7, 1.4, z + 0.6], [0.6, 6.5, 0.6], { layer: 3 });
  // Sparks off each blow and off the cut, flying out and falling.
  if (struck) {
    const a = (u - HIT) / (1 - HIT);
    const ox = n === 4 ? cutX : 1;
    for (let k = 0; k < 14; k++) {
      const ang = hash(k + blow * 31) * Math.PI * 2;
      const sp = 2 + hash(k + 20 + blow * 31) * 5;
      const x = ox + Math.cos(ang) * sp * a;
      const y = Math.sin(ang) * sp * a;
      const zz = face + 1 + (2 + hash(k + 40 + blow * 31) * 3) * a - 6 * a * a;
      if (zz > 0.8) dot(out, [x, y, zz], k % 3 ? "accent" : "ink", 2);
    }
  }
  return out;
}

/**
 * A fuel tank: a box on a plinth with a gauge of `cells` stacked on its +x face, `level` of them
 * lit (ember when `hot`), and a filler cap on top.
 */
function tank(out: Out, at: Vec3, s: number, level: number, cells: number, hot: boolean): void {
  const [x, y, z] = at;
  const w = 4 * s;
  const d = 4 * s;
  const h = 6.4 * s;
  box(out, [x, y, z], [w, d, h], { tone: [0.06, 0.2, 0.1] });
  box(
    out,
    [x + w / 2 - 0.6 * s, y + d / 2 - 0.6 * s, z + h],
    [1.2 * s, 1.2 * s, 0.5 * s],
    hot ? { accent: true } : {},
  );
  const gh = (h - 1.2 * s) / cells;
  for (let k = 0; k < cells; k++) {
    const lit = k < level;
    box(
      out,
      [x + w, y + 1 * s, z + 0.6 * s + k * gh + 0.1 * s],
      [0.05, d - 2 * s, gh - 0.2 * s],
      lit ? (hot ? { accent: true, layer: 1 } : { tone: [0.3, 0.6, 0.9], layer: 1 }) : { layer: 1 },
    );
  }
}

/**
 * Fuel · each month: the tank fills at the start of the month, the gauge drains week by week,
 * and what is left at the end is emptied out before the next fill: nothing carries over. Four
 * week tiles on the floor light as the month goes.
 */
function fuelMonth(t: number): Block[] {
  const out: Out = [...floorGrid(-10, 10, -10, 10, 4)];
  plinth(out, [-6, -6, 0], [12, 12, 0.6]);
  const p = (t / 7) % 1;
  const CELLS = 8;
  let level: number;
  if (p < 0.12) level = Math.round((p / 0.12) * CELLS);
  else if (p < 0.82) level = CELLS - Math.round(((p - 0.12) / 0.7) * 5);
  else level = p < 0.9 ? (Math.floor(t * 6) % 2 ? 3 : 0) : 0;
  tank(out, [-3.6, -4.4, 0.6], 1, level, CELLS, p < 0.12);
  // The weeks, along the front of the plinth.
  const week = p < 0.12 ? -1 : Math.min(3, Math.floor(((p - 0.12) / 0.7) * 4));
  for (let k = 0; k < 4; k++)
    box(
      out,
      [-4.6 + k * 2.4, 2.6, 0.6],
      [1.8, 1.8, 0.3],
      k === week ? { accent: true } : k < week ? { tone: [0.1, 0.25, 0.4] } : {},
    );
  return out;
}

/** A jerrycan: a slim box standing up, a handle on top and a short spout. */
function jerrycan(out: Out, at: Vec3, lit: boolean): void {
  const [x, y, z] = at;
  box(out, [x, y, z], [1.4, 2.6, 3.2], lit ? { accent: true } : { tone: [0.06, 0.2, 0.1] });
  seg(out, [x + 0.7, y + 0.5, z + 3.2], [x + 0.7, y + 0.5, z + 3.7], lit ? "accent" : "ink");
  seg(out, [x + 0.7, y + 0.5, z + 3.7], [x + 0.7, y + 1.7, z + 3.7], lit ? "accent" : "ink");
  seg(out, [x + 0.7, y + 1.7, z + 3.7], [x + 0.7, y + 1.7, z + 3.2], lit ? "accent" : "ink");
  box(out, [x + 0.35, y + 2.1, z + 3.2], [0.7, 0.5, 0.6], lit ? { accent: true } : {});
}

/**
 * Fuel · top-ups: jerrycans set aside next to a row of twelve month tiles; a marker steps along
 * the year and a can is lit while it lasts.
 */
function fuelTopUp(t: number): Block[] {
  const out: Out = [...floorGrid(-10, 10, -10, 10, 4)];
  plinth(out, [-6, -6, 0], [12, 12, 0.6]);
  const month = Math.floor(t * 1.6) % 13;
  for (let k = 0; k < 3; k++) jerrycan(out, [-4.8 + k * 2, -4.6, 0.6], k === 0 && month < 12);
  // Twelve months, two rows of six along the front.
  for (let k = 0; k < 12; k++) {
    const row = Math.floor(k / 6);
    const col = k % 6;
    box(
      out,
      [-5 + col * 1.7, 0.6 + row * 1.9, 0.6],
      [1.3, 1.4, 0.3],
      k === month ? { accent: true } : k < month ? { tone: [0.1, 0.25, 0.4] } : {},
    );
  }
  return out;
}

/**
 * Fuel · one balance: one tank in the middle, its lines running to a server, a filing cabinet
 * and a memory stick; fuel rides the line to whichever is working.
 */
function fuelPool(t: number): Block[] {
  const out: Out = [...floorGrid(-12, 12, -12, 12, 4)];
  const turn = Math.floor(t / 1.4) % 3;
  plinth(out, [-3, -3, 0], [6, 6, 0.6]);
  tank(out, [-2, -2, 0.6], 1, 6, 8, false);
  const spots: { at: [number, number]; route: [number, number][] }[] = [
    {
      at: [-9, -2],
      route: [
        [-3, 0],
        [-6, 0],
      ],
    },
    {
      at: [3, -10],
      route: [
        [0, -3],
        [0, -7],
      ],
    },
    {
      at: [-3, 9],
      route: [
        [-1, 3],
        [-1, 6],
      ],
    },
  ];
  spots.forEach(({ at, route }, i) => {
    wire(out, route, i === turn, t);
    plinth(out, [at[0] - 3, at[1] - 3, 0], [6, 6, 0.6]);
  });
  server(out, [-10.2, -4.2, 0.6], 0.9, turn === 0, t);
  cabinet(out, [1.4, -12, 0.6], 1, turn === 1, t);
  cacheChip(out, [-4.5, 6.4, 0.6], 1.1, turn === 2, t);
  return out;
}

export const OBJECT_SCENES: Record<string, (t: number, active: number) => Block[]> = {
  resources,
  safe,
  "badge-gate": badgeGate,
  ledger,
  "production-line": productionLine,
  dashboard,
  "usage-iso": usageIso,
  market,
  "permissions-iso": permissionsIso,
  "approval-plug": approvalPlug,
  stack6,
  bolt: boltScene,
  drawer: drawerScene,
  isolated,
  "host-cloud": hostCloud,
  "host-self": hostSelf,
  "host-servers": hostServers,
  "ai-gateway": aiGateway,
  "forge-cta": forge,
  "fuel-month": fuelMonth,
  "fuel-topup": fuelTopUp,
  "fuel-pool": fuelPool,
};
