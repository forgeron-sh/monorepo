/**
 * The editorial scenes: one drawing per blog post, customer story or large release, made for what
 * it says, played by Blueprint on its card, on its index's lead and over its banner (`scene:` in
 * its front matter).
 *
 * Square like the rest of the site's objects: boxes, straight lines and square dots. The iso view
 * looks at the corner (max x, max y): the right face is the +x face, the left face the +y face.
 */
import type { Block, Vec3 } from "@forgeron/blueprint";
import { floorGrid } from "@forgeron/blueprint";
import { box, dot, glide, lerp3, seg } from "./parts";

type Out = Block[];

/** A slab under a group, below everything else. */
function plinth(out: Out, at: Vec3, size: Vec3): void {
  box(out, at, size, { tone: [0.03, 0.08, 0.16], layer: -2 });
}

/**
 * The manifesto: a monolith, the suite a company rents, is taken apart storey by storey. Each
 * piece leaves its top in an arc, in ember, and lands on the grid beside it as a small tool of its
 * own, its status light on. When the monolith is gone, the tools hold a moment, then it starts
 * again.
 */
function manifesto(t: number): Block[] {
  const out: Out = [...floorGrid(-18, 18, -14, 14, 4)];
  const PIECES = 12;
  const STEP = 0.9;
  const FLIGHT = 1.1;
  const HOLD = 3;
  const cycle = PIECES * STEP + FLIGHT + HOLD;
  const c = t % cycle;
  const STOREY = 1.5;
  const BASE = 0.6;

  // The monolith: its storeys, minus the pieces that left.
  plinth(out, [-16.5, -6.5, 0], [11, 13, 0.6]);
  const left = Math.min(PIECES, Math.max(0, Math.floor(c / STEP) + (c % STEP > 0 ? 1 : 0)));
  const height = (PIECES - left) * STOREY;
  if (height > 0)
    box(out, [-15, -5, BASE], [8, 10, height], { floors: STOREY, tone: [0.08, 0.22, 0.12] });
  // Where it stood: a ghost of its full height.
  box(out, [-15, -5, BASE], [8, 10, PIECES * STOREY], { ghost: true, layer: -1 });

  // The tools: a grid of four by three on its own plinth.
  plinth(out, [-0.5, -9.5, 0], [17, 19, 0.6]);
  const slot = (k: number): Vec3 => [1 + (k % 4) * 4, -8 + Math.floor(k / 4) * 6.5, BASE];
  for (let k = 0; k < PIECES; k++) {
    const start = k * STEP;
    const u = (c - start) / FLIGHT;
    const [sx, sy, sz] = slot(k);
    const h = 2 + ((k * 7) % 5) * 0.4;
    if (u >= 1) {
      // Landed: a light tool, its light blinking in its own rhythm.
      box(out, [sx, sy, sz], [2.8, 3.4, h], { floors: h / 2 });
      const on = Math.floor(t * 1.5 + k * 0.7) % 4 !== 0;
      dot(out, [sx + 2.85, sy + 1.7, sz + h - 0.6], on ? "accent" : "dim", 2);
      out.push({
        kind: "dot",
        at: [sx + 2.85, sy + 2.5, sz + h - 0.6],
        ink: "dim",
        size: 2,
        layer: 1,
      });
    } else {
      box(out, [sx, sy, sz], [2.8, 3.4, h], { ghost: true, layer: -1 });
      if (u >= 0) {
        // In flight: from the top of the monolith to its slot, in an arc.
        const from: Vec3 = [-12.4, -1.7, BASE + (PIECES - k - 1) * STOREY];
        const p = lerp3(from, [sx, sy, sz], glide(u));
        const lift = Math.sin(Math.PI * u) * 7;
        box(out, [p[0], p[1], p[2] + lift], [2.8, 3.4, STOREY], { accent: true, layer: 3 });
        // Its trail: a few dim specks behind it.
        for (let s = 1; s <= 3; s++) {
          const v = Math.max(0, u - s * 0.07);
          const q = lerp3(from, [sx, sy, sz], glide(v));
          dot(out, [q[0] + 1.4, q[1] + 1.7, q[2] + Math.sin(Math.PI * v) * 7 + 0.7], "dim", 2);
        }
      }
    }
  }
  return out;
}

/**
 * Writing a post: blank sheets ride a belt under a press. The stamp comes down in ember, lifts,
 * and the sheet goes on printed, its lines of text on top, to a pile that grows at the end.
 */
function press(t: number): Block[] {
  const out: Out = [...floorGrid(-18, 18, -12, 12, 4)];
  const P = 2.4;
  const n = Math.floor(t / P);
  const u = (t % P) / P;
  const BELT = 1.6;

  // The belt, its slats moving.
  plinth(out, [-17, -4, 0], [30, 8, 0.6]);
  box(out, [-16, -2.4, 0.6], [24, 4.8, 1], { tone: [0.04, 0.12, 0.26], layer: -1 });
  const slats = out.length;
  for (let x = -16 + ((t * 5) % 2); x < 8; x += 2)
    seg(out, [x, -2.2, BELT + 0.02], [x, 2.2, BELT + 0.02], "faint");
  for (let k = slats; k < out.length; k++) out[k] = { ...out[k]!, layer: 1 } as Block;

  // The press: two posts, a beam, and the stamp on its rod.
  box(out, [-3.2, -4.4, 0.6], [1.2, 1.2, 12]);
  box(out, [-3.2, 3.2, 0.6], [1.2, 1.2, 12]);
  box(out, [-3.6, -4.8, 12.6], [2, 9.6, 1.4], { floors: 0.7 });
  const down = u > 0.38 && u < 0.62 ? glide((0.5 - Math.abs(u - 0.5)) / 0.12) : 0;
  const stampZ = 9 - down * (9 - BELT - 0.3);
  box(out, [-2.95, -0.25, stampZ + 1.6], [0.7, 0.5, 12.6 - stampZ - 1.6]);
  box(out, [-4.6, -2.2, stampZ], [4, 4.4, 1.6], { accent: down > 0.6, layer: 2 });

  // The sheet under the press: in from the left, held under the stamp, out to the right.
  const sheet = (x: number, printed: boolean, z = BELT + 0.02) => {
    box(out, [x, -1.8, z], [4, 3.6, 0.2], { tone: [0.5, 0.3, 0.4], layer: 1 });
    if (printed)
      for (let l = 0; l < 4; l++)
        seg(
          out,
          [x + 0.6, -1.3 + l * 0.8, z + 0.22],
          [x + (l === 3 ? 2.2 : 3.4), -1.3 + l * 0.8, z + 0.22],
          "ink",
        );
  };
  const x =
    u < 0.38
      ? -15 + glide(u / 0.38) * 10.4
      : u < 0.62
        ? -4.6
        : -4.6 + glide((u - 0.62) / 0.38) * 10.8;
  sheet(x, u >= 0.5);

  // The pile at the end of the belt, one sheet more each pass, up to twelve, then a fresh pile.
  box(out, [8.6, -2.6, 0.6], [5.2, 5.2, 1], { tone: [0.06, 0.2, 0.12] });
  const pile = (n % 12) + (u > 0.98 ? 1 : 0);
  for (let k = 0; k < pile; k++) sheet(9.2, k === pile - 1, 1.6 + k * 0.32);
  return out;
}

/**
 * A customer story: modules slide out of a suite one by one, each leaving a dashed slot. In its
 * place a light tool switches on beside it, wired to the gateway column; calls travel from the
 * tools through the gateway to a conversation panel, whose lines fill as the answers come back.
 */
function modulesOut(t: number): Block[] {
  const out: Out = [...floorGrid(-18, 18, -14, 14, 4)];
  const STEP = 3;
  const SLIDE = 1.2;
  const cycle = STEP * 3 + 4;
  const c = t % cycle;

  // The suite, with its three module drawers on the +x face.
  plinth(out, [-17, -8, 0], [11, 16, 0.6]);
  box(out, [-16, -7, 0.6], [8, 14, 9], { floors: 3, tone: [0.08, 0.22, 0.12] });
  const tools: Vec3[] = [];
  for (let i = 0; i < 3; i++) {
    const y = -6 + i * 4.4;
    const u = (c - i * STEP) / SLIDE;
    if (u < 0) {
      box(out, [-8, y, 2.4 + i * 1.6], [0.6, 3.6, 2.2], { tone: [0.1, 0.3, 0.2], layer: 1 });
      continue;
    }
    box(out, [-8, y, 2.4 + i * 1.6], [0.6, 3.6, 2.2], { ghost: true, layer: 1 });
    if (u < 1) {
      // The drawer leaves the suite, in ember, and fades into the tool it becomes.
      const k = glide(u);
      box(out, [-8 + k * 9, y, 2.4 + i * 1.6 - k * (1.8 + i * 1.6)], [3.6 * k + 0.6, 3.6, 2.2], {
        accent: true,
        layer: 3,
      });
    } else tools.push([1, y, 0.6]);
  }

  // The light tools, each on its own slab, and the gateway they answer through.
  plinth(out, [-0.5, -8, 0], [6, 16, 0.6]);
  for (const [x, y, z] of tools) {
    box(out, [x, y, z], [3, 3.6, 3], { floors: 1.5 });
    dot(out, [x + 3.05, y + 1.8, z + 2.4], "accent", 2);
  }
  plinth(out, [7.5, -2.5, 0], [5, 5, 0.6]);
  box(out, [8.5, -1.5, 0.6], [3, 3, 11], { floors: 2.2, tone: [0.06, 0.2, 0.12] });

  // The conversation: a panel on a stand, its lines of text filling with each call.
  box(out, [15, -1, 0.6], [1, 1, 6], { tone: [0.06, 0.2, 0.12] });
  box(out, [14.6, -5, 6.6], [0.8, 9, 6.2], { tone: [0.06, 0.16, 0.1] });
  const lines = Math.min(5, Math.floor(c / 1.4));
  for (let l = 0; l < lines; l++) {
    const y0 = l % 2 ? -4.2 : -0.5;
    out.push({
      kind: "line",
      a: [15.45, y0, 11.8 - l * 1.05],
      b: [15.45, y0 + 3.6, 11.8 - l * 1.05],
      ink: l % 2 ? "dim" : "ink",
      layer: 1,
    });
  }

  // The wires, and a call on each: tool → gateway → conversation.
  for (const [x, y] of tools) {
    const route: Vec3[] = [
      [x + 3, y + 1.8, 1.6],
      [8.5, 0, 1.6],
      [10, 0, 9],
      [14.6, -0.5, 9],
    ];
    for (let k = 0; k + 1 < route.length; k++) seg(out, route[k]!, route[k + 1]!, "faint", 3);
    // Each tool has its own phase; kept in [0, 1) whatever the sign of y.
    const p = (((t * 0.6 + y * 0.13) % 1) + 1) % 1;
    const leg = Math.min(2, Math.floor(p * 3));
    const at = lerp3(route[leg]!, route[leg + 1]!, p * 3 - leg);
    dot(out, at, "accent", 3);
  }
  return out;
}

/**
 * A large release: parts drop from above into a crate on a pallet, row by row; when it is full,
 * the lid closes, the crate is stamped in ember and slides off, and an empty one comes in.
 */
function release(t: number): Block[] {
  const out: Out = [...floorGrid(-18, 18, -12, 12, 4)];
  const PARTS = 9;
  const DROP = 0.5;
  const cycle = PARTS * DROP + 3;
  const c = t % cycle;
  const shift = c > PARTS * DROP + 1.6 ? glide((c - PARTS * DROP - 1.6) / 1.2) * 16 : 0;

  plinth(out, [-16, -7, 0], [32, 14, 0.6]);
  // The crate: a low open box on a pallet, three by three cells inside.
  const X0 = -6 + shift;
  box(out, [X0 - 0.4, -4.4, 0.6], [8.8, 8.8, 0.8], { tone: [0.04, 0.12, 0.26] });
  box(out, [X0, -4, 1.4], [8, 8, 4.4], { ghost: true });
  for (let k = 0; k < PARTS; k++) {
    const u = (c - k * DROP) / DROP;
    if (u < 0) continue;
    const cx = X0 + 0.3 + (k % 3) * 2.6;
    const cy = -3.7 + Math.floor(k / 3) * 2.6;
    const z = 1.4 + (1 - glide(Math.min(1, u))) * 12;
    const h = 1.6 + ((k * 5) % 3) * 0.7;
    box(out, [cx, cy, z], [2.2, 2.2, h], { accent: u < 1, floors: h / 2, layer: u < 1 ? 3 : 1 });
  }
  // The lid and the stamp, once full.
  if (c > PARTS * DROP + 0.4) {
    const k = glide((c - PARTS * DROP - 0.4) / 0.6);
    box(out, [X0 - 0.2, -4.2, 5.8 + (1 - k) * 4], [8.4, 8.4, 0.5], { layer: 4 });
    if (k >= 1) box(out, [X0 + 2.6, -1.4, 6.32], [2.8, 2.8, 0.06], { accent: true, layer: 5 });
  }
  // The next crate waiting on the left.
  box(out, [-15, -4.4, 0.6], [8.8, 8.8, 0.8], { tone: [0.04, 0.12, 0.26] });
  box(out, [-14.6, -4, 1.4], [8, 8, 4.4], { ghost: true });
  return out;
}

export const BLOG_SCENES: Record<string, (t: number, active: number) => Block[]> = {
  manifesto,
  press,
  "modules-out": modulesOut,
  release,
};
