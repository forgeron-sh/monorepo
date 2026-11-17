/**
 * Flat pixel scenes, for the /wild-erp page. Each scene paints a
 * cell grid into two buffers, light (ink coverage, 0 to 1) and ember (accent, 0 to 1), and a 4×4
 * Bayer matrix thresholds them into four tokens: `--bg-sunk`, `--ink-dim`, `--ink`, `--accent`.
 * Pixels switch on or off whole; nothing blurs or fades. Scenes are pure functions of time, so a
 * frame never depends on the previous one.
 */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)]!;

/** Ink at a coverage, light added to what is there, or ember at a heat. */
type Paint = number | { add: number } | { ember: number };

function hash(x: number, y: number, seed = 0): number {
  let h =
    (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);

/** 3×5 capitals and figures (some glyphs narrower), drawn one cell per pixel. */
const FONT: Record<string, string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  "!": ["#", "#", "#", ".", "#"],
  ".": [".", ".", ".", ".", "#"],
  ",": [".", ".", ".", "#", "#"],
  "'": ["#", "#", ".", ".", "."],
  "?": ["##.", "..#", ".#.", "...", ".#."],
  "-": ["...", "...", "###", "...", "..."],
  ">": ["#..", "##.", "###", "##.", "#.."],
  "~": ["#####", ".###.", "..#..", ".....", "....."],
  " ": ["..", "..", "..", "..", ".."],
};

/** The two buffers of a frame, and the shapes painted into them. */
export class Cells {
  readonly l: Float32Array;
  readonly a: Float32Array;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.l = new Float32Array(w * h);
    this.a = new Float32Array(w * h);
  }

  put(x: number, y: number, p: Paint): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (typeof p === "number") {
      this.l[i] = p;
      this.a[i] = 0;
    } else if ("add" in p) this.l[i] = clamp(this.l[i]! + p.add);
    else this.a[i] = Math.max(this.a[i]!, p.ember);
  }

  fill(fn: (x: number, y: number) => number): void {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        this.l[i] = fn(x, y);
        this.a[i] = 0;
      }
  }

  rect(x: number, y: number, w: number, h: number, p: Paint): void {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + w);
    const y1 = Math.round(y + h);
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.put(i, j, p);
  }

  /** A one-cell outline. */
  frame(x: number, y: number, w: number, h: number, p: Paint): void {
    this.rect(x, y, w, 1, p);
    this.rect(x, y + h - 1, w, 1, p);
    this.rect(x, y, 1, h, p);
    this.rect(x + w - 1, y, 1, h, p);
  }

  circle(cx: number, cy: number, r: number, p: Paint): void {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.put(x, y, p);
      }
  }

  /** A polygon from flat [x0, y0, x1, y1, …], filled by scanline (even-odd). */
  poly(pts: number[], p: Paint): void {
    const n = pts.length / 2;
    let lo = Infinity;
    let hi = -Infinity;
    for (let k = 0; k < n; k++) {
      lo = Math.min(lo, pts[k * 2 + 1]!);
      hi = Math.max(hi, pts[k * 2 + 1]!);
    }
    for (let y = Math.floor(lo); y <= hi; y++) {
      const sy = y + 0.5;
      const xs: number[] = [];
      for (let k = 0; k < n; k++) {
        const ax = pts[k * 2]!;
        const ay = pts[k * 2 + 1]!;
        const bx = pts[((k + 1) % n) * 2]!;
        const by = pts[((k + 1) % n) * 2 + 1]!;
        if (ay <= sy !== by <= sy) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]!); x < Math.round(xs[k + 1]!); x++) this.put(x, y, p);
    }
  }

  /** A segment with round ends, `r` cells thick on each side. */
  capsule(x0: number, y0: number, x1: number, y1: number, r: number, p: Paint): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.max(y0, y1) + r; y++)
      for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.max(x0, x1) + r; x++) {
        const k = clamp(((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) / len2);
        const ex = x + 0.5 - (x0 + k * dx);
        const ey = y + 0.5 - (y0 + k * dy);
        if (ex * ex + ey * ey <= r * r) this.put(x, y, p);
      }
  }

  /** Ember (or added light) falling off from a centre: dithered, it reads as a pixel halo. */
  glow(cx: number, cy: number, r: number, heat: number, light = false): void {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(this.h - 1, cy + r); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(this.w - 1, cx + r); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d >= 1) continue;
        const v = heat * (1 - d) ** 1.6;
        this.put(x, y, light ? { add: v } : { ember: v });
      }
  }

  /** Capitals in the 3×5 face; returns the width in cells. `keep` drops cells for a dissolve. */
  text(
    s: string,
    x: number,
    y: number,
    p: Paint,
    keep?: (x: number, y: number) => boolean,
  ): number {
    let cx = Math.round(x);
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? FONT[" "]!;
      g.forEach((row, j) =>
        [...row].forEach((c, i) => {
          if (c === "#" && (!keep || keep(cx + i, y + j))) this.put(cx + i, Math.round(y) + j, p);
        }),
      );
      cx += g[0]!.length + 1;
    }
    return cx - Math.round(x) - 1;
  }
}

export const textWidth = (s: string) =>
  [...s.toUpperCase()].reduce((w, ch) => w + (FONT[ch] ?? FONT[" "]!)[0]!.length + 1, 0) - 1;

export type FlatScene = (c: Cells, t: number) => void;

// ---------------------------------------------------------------------------------------------
// A wild ERP appeared: a handheld battle screen; each forged tool knocks a module off the suite.
// ---------------------------------------------------------------------------------------------

interface Module {
  name: string;
  x: number;
  y: number;
}

const MODULES: Module[] = [
  { name: "ASSETS", x: -15, y: -33 },
  { name: "CRM", x: -47, y: -22 },
  { name: "STOCK", x: 17, y: -22 },
  { name: "SUPPORT", x: -47, y: -8 },
  { name: "BILLING", x: 17, y: -8 },
  { name: "HR", x: -37, y: 6 },
  { name: "PAYROLL", x: 7, y: 6 },
];
const HITS = ["CRM", "BILLING", "STOCK"];
const AFTER = ["IT'S SUPER EFFECTIVE!", "A CRITICAL HIT!", "THE SUITE FALLS APART!"];

const erp: FlatScene = (c, t) => {
  const { w: W, h: H } = c;
  const lw = Math.min(W, Math.round(H * 3.1));
  const lx = Math.floor((W - lw) / 2);
  const compact = lw < 170;
  c.fill((x, y) => (hash(x, y, 2) < 0.006 && y < H * 0.62 ? 0.5 : 0));

  const LOOP = 20;
  const lt = t % LOOP;
  const blink = Math.floor(t * 4) % 2 === 0;

  // Dialog.
  const dh = 21;
  const dy = H - dh - 3;
  const dx = lx + 6;
  const dwid = lw - 12;
  let lines: string[] = [];
  let menu = false;
  let swing = -1;
  let hitIndex = -1;
  let since = 0;
  const hp = (() => {
    let v = 1;
    for (let a = 0; a < 3; a++) {
      const at = 4.6 + a * 3.4 + 1.0;
      if (lt > at) v = lerp(v, 1 - (a + 1) / 3, clamp((lt - at) / 0.6));
    }
    return v;
  })();
  if (lt < 2.6) lines = ["A WILD ERP SUITE", "APPEARED!"];
  else if (lt < 4.6) {
    lines = ["WHAT WILL", "FORGERON DO?"];
    menu = true;
  } else if (lt < 4.6 + 3 * 3.4) {
    const a = Math.floor((lt - 4.6) / 3.4);
    const s = (lt - 4.6) % 3.4;
    hitIndex = a;
    since = s - 1.0;
    swing = s;
    lines = s < 1.4 ? ["FORGERON FORGED", `A ${HITS[a]} TOOL!`] : [AFTER[a]!];
  } else if (lt < 16.8) {
    lines = ["ERP SUITE", "FAINTED!"];
    hitIndex = 3;
    since = lt - (4.6 + 3 * 3.4);
  } else if (lt < 18.4) lines = ["YOUR TEAM NOW", "ASKS CLAUDE."];
  else lines = ["LIGHT TOOLS WIN."];

  // Which modules are gone: every hit before this one, and this one once struck.
  const gone = new Set<string>();
  for (let a = 0; a < Math.min(hitIndex, 3); a++) gone.add(HITS[a]!);
  const falling = hitIndex >= 0 && hitIndex < 3 && since >= 0 ? HITS[hitIndex]! : null;
  const fainting = hitIndex === 3 ? clamp(since / 1.3) : 0;
  const absent = lt >= 16.8;

  // Enemy, sliding in from the right at the start of each loop.
  const slide = lt < 0.7 ? Math.round((1 - ease(lt / 0.7)) * lw * 0.45) : 0;
  const ex = lx + Math.round(lw * 0.64) + slide;
  const ey = Math.round(H * 0.4) + (Math.floor(t * 2.5) % 2);
  const sc = compact ? 0.5 : 1;
  const hidden = falling !== null && since < 0.5 && blink;
  const keep = (x: number, y: number) => bayer(x, y) >= fainting;

  for (let y = -3; y <= 3; y++)
    for (let x = -42; x <= 42; x++)
      if ((x / 42) ** 2 + (y / 3.5) ** 2 <= 1 && (x + y) % 2 === 0)
        c.put(ex + x * sc, Math.round(H * 0.4) + 20 * sc + y, 0.5);

  const block = (m: Module, ox: number, oy: number, alpha: (x: number, y: number) => boolean) => {
    const bx = Math.round(ex + m.x * sc + ox);
    const by = Math.round(ey + m.y * sc + oy);
    const bw = Math.round(30 * sc);
    const bh = Math.round(11 * sc);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        if (!alpha(bx + x, by + y)) continue;
        const edge = x === 0 || y === 0 || x === bw - 1 || y === bh - 1;
        c.put(bx + x, by + y, edge ? 1 : 0);
      }
    if (!compact) c.text(m.name, bx + Math.round((bw - textWidth(m.name)) / 2), by + 3, 1, alpha);
  };

  if (!absent && !hidden) {
    for (const m of MODULES) {
      if (gone.has(m.name)) continue;
      if (m.name === falling) {
        const s = since;
        const drop = 0.5 * 160 * s * s;
        const fade = clamp((s - 0.2) / 0.8);
        block(m, (m.x < 0 ? -1 : 1) * s * 14, drop, (x, y) => bayer(x, y) >= fade);
        continue;
      }
      block(m, 0, 0, keep);
    }
    // The core, with its face.
    const cw = Math.round(34 * sc);
    const chh = Math.round(22 * sc);
    const cx0 = ex - Math.round(17 * sc);
    const cy0 = ey - Math.round(11 * sc);
    for (let y = 0; y < chh; y++)
      for (let x = 0; x < cw; x++) {
        if (!keep(cx0 + x, cy0 + y)) continue;
        const edge = x === 0 || y === 0 || x === cw - 1 || y === chh - 1;
        c.put(cx0 + x, cy0 + y, edge ? 1 : 0.5);
      }
    if (fainting < 0.5) {
      const e = sc;
      for (const side of [-1, 1]) {
        const eyx = ex + side * 8 * e - 3 * e;
        c.rect(eyx, ey - 5 * e, 6 * e, 4 * e, 1);
        c.rect(eyx + (side < 0 ? 3 : 1) * e, ey - 4 * e, 2 * e, 2 * e, { ember: 1 });
        for (let k = 0; k < 6 * e; k++)
          c.put(eyx + k, ey - 7 * e + (side < 0 ? k / (3 * e) : 2 - k / (3 * e)), 0);
      }
      c.rect(ex - 9 * e, ey + 3 * e, 18 * e, 5 * e, 0);
      for (let k = 0; k < 6; k++) {
        const tx = ex - 9 * e + k * 3 * e;
        c.poly([tx, ey + 3 * e, tx + 3 * e, ey + 3 * e, tx + 1.5 * e, ey + 5.5 * e], 1);
      }
    }
  }

  // Player: the smith from behind, hammer up.
  const px = lx + Math.round(lw * 0.24);
  const pb = dy - 2;
  for (let y = -3; y <= 3; y++)
    for (let x = -36; x <= 36; x++)
      if ((x / 36) ** 2 + (y / 3.5) ** 2 <= 1 && (x + y) % 2 === 0)
        c.put(px + x * sc, pb - 2 + y, 0.5);
  const ps = compact ? 0.6 : 1;
  c.rect(px - 13 * ps, pb - 16 * ps, 26 * ps, 16 * ps, 0.5);
  c.circle(px - 13 * ps + 3 * ps, pb - 13 * ps, 3 * ps, 0.5);
  c.circle(px + 13 * ps - 3 * ps, pb - 13 * ps, 3 * ps, 0.5);
  c.rect(px - 5 * ps, pb - 16 * ps, 2 * ps, 16 * ps, 0);
  c.rect(px + 3 * ps, pb - 16 * ps, 2 * ps, 16 * ps, 0);
  c.circle(px, pb - 22 * ps, 7 * ps, 1);
  c.circle(px - 2 * ps, pb - 25 * ps, 2.5 * ps, 0.5);
  let deg = -60;
  if (swing >= 0 && swing < 0.5) deg = lerp(-60, -150, ease(swing / 0.5));
  else if (swing >= 0.5 && swing < 0.62) deg = lerp(-150, 10, (swing - 0.5) / 0.12);
  else if (swing >= 0.62 && swing < 1.2) deg = 10;
  const th = (deg * Math.PI) / 180;
  const sx = px + 11 * ps;
  const sy = pb - 14 * ps;
  const hx = sx + Math.cos(th) * 18 * ps;
  const hy = sy + Math.sin(th) * 18 * ps;
  c.capsule(sx, sy, sx + Math.cos(th) * 9 * ps, sy + Math.sin(th) * 9 * ps, 2.4 * ps, 0.5);
  c.capsule(sx + Math.cos(th) * 9 * ps, sy + Math.sin(th) * 9 * ps, hx, hy, 0.9 * ps, 1);
  c.capsule(
    hx + Math.sin(th) * 4 * ps,
    hy - Math.cos(th) * 4 * ps,
    hx - Math.sin(th) * 4 * ps,
    hy + Math.cos(th) * 4 * ps,
    2 * ps,
    1,
  );

  // The forged tool, flying to its module, and the hit.
  if (falling !== null || (hitIndex >= 0 && hitIndex < 3 && swing >= 0.6 && swing < 1.0)) {
    const target = MODULES.find((m) => m.name === HITS[hitIndex])!;
    const tx = ex + (target.x + 15) * sc;
    const ty = ey + (target.y + 5) * sc;
    if (swing >= 0.6 && swing < 1.0) {
      const q = (swing - 0.6) / 0.4;
      const fx = lerp(hx, tx, q);
      const fy = lerp(hy, ty, q) - Math.sin(q * Math.PI) * 18;
      const spin = Math.floor(q * 8) % 2;
      c.rect(fx - 1, fy - 3, 2, 6, { ember: 1 });
      c.rect(fx - 3, fy - 3 + spin * 4, 6, 2, { ember: 1 });
    }
    if (since >= 0 && since < 0.25) {
      const r = 3 + Math.round(since * 30);
      for (let k = -r; k <= r; k++) {
        c.put(tx + k, ty, { ember: 1 });
        c.put(tx, ty + k, { ember: 1 });
        c.put(tx + k * 0.7, ty + k * 0.7, { ember: 1 });
        c.put(tx + k * 0.7, ty - k * 0.7, { ember: 1 });
      }
    }
  }

  // Boxes: the enemy's top left, the player's above the dialog on the right.
  const bar = (x: number, y: number, len: number, v: number, p: Paint) => {
    c.text("HP", x, y, 1);
    c.frame(x + 9, y, len + 2, 5, 0.5);
    c.rect(x + 10, y + 1, Math.round(len * v), 3, p);
  };
  const ebx = lx + 8;
  if (!absent) {
    c.text("ERP SUITE", ebx, 6, 1);
    c.text("LV99", ebx + textWidth("ERP SUITE") + 6, 6, 0.5);
    bar(ebx, 14, compact ? 30 : 56, hp * (1 - fainting), { ember: 1 });
    c.rect(ebx, 22, compact ? 41 : 67, 1, 0.5);
  }
  const pbx = lx + lw - (compact ? 48 : 78);
  const pby = dy - 22;
  c.text("FORGERON", pbx, pby, 1);
  if (!compact) c.text("LV1", pbx + textWidth("FORGERON") + 6, pby, 0.5);
  bar(pbx, pby + 8, compact ? 30 : 56, 1, 1);
  c.rect(pbx + (compact ? 39 : 65), pby + 2, 1, 15, 0.5);

  // Dialog box, with the menu at its right and the next-line marker.
  c.rect(dx, dy, dwid, dh, 0);
  c.frame(dx, dy, dwid, dh, 1);
  c.frame(dx + 2, dy + 2, dwid - 4, dh - 4, 0.5);
  lines.forEach((ln, i) => c.text(ln, dx + 7, dy + 5 + i * 7, 1));
  if (menu) {
    const mx = dx + dwid - (compact ? 34 : 60);
    c.rect(mx - 6, dy, 1, dh, 1);
    if (blink) c.text(">", mx, dy + 5, { ember: 1 });
    c.text("FORGE", mx + 6, dy + 5, 1);
    c.text("RUN", mx + 6, dy + 12, 0.5);
  } else if (blink) c.text("~", dx + dwid - 12, dy + dh - 8, 1);

  // Battle intro: bands close over the screen, then open on the fight.
  if (lt < 0.6) {
    const cover = Math.round((1 - lt / 0.6) * 8);
    for (let y = 0; y < H; y++) if (y % 8 < cover) c.rect(0, y, W, 1, 1);
  }
};

export const FLAT_SCENES: Readonly<Record<string, { draw: FlatScene; still: number }>> = {
  erp: { draw: erp, still: 9.2 },
};

// ---------------------------------------------------------------------------------------------
// Mounting: 12 frames a second, paused off-screen, still under reduced motion.
// ---------------------------------------------------------------------------------------------

const FPS = 12;

type Rgb = [number, number, number];

function parse(color: string): Rgb {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [0, 0, 0];
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return [d[0]!, d[1]!, d[2]!];
}

export interface FlatCanvas {
  /** Draws a scene of `FLAT_SCENES`, or stops drawing with null. */
  show(scene: string | null): void;
}

/** Mounts the flat renderer on a canvas, in cells of `cell` CSS pixels. */
export function mountFlat(el: HTMLCanvasElement, cell = 3): FlatCanvas {
  const ctx = el.getContext("2d");
  const off = document.createElement("canvas");
  const octx = off.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scene: string | null = null;
  let visible = true;
  let lastFrame = -1;
  let cells: Cells | null = null;
  let img: ImageData | null = null;
  let k = 1;
  const start = performance.now();
  const cache = new Map<string, Rgb>();
  const tone = (name: string, fallback: string): Rgb => {
    const v = getComputedStyle(el).getPropertyValue(name).trim() || fallback;
    let rgb = cache.get(v);
    if (!rgb) {
      rgb = parse(v);
      cache.set(v, rgb);
    }
    return rgb;
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    k = Math.max(1, Math.round(cell * dpr));
    el.width = Math.round(el.clientWidth * dpr);
    el.height = Math.round(el.clientHeight * dpr);
    const w = Math.ceil(el.width / k);
    const h = Math.ceil(el.height / k);
    if (w < 1 || h < 1) return;
    cells = new Cells(w, h);
    off.width = w;
    off.height = h;
    img = octx?.createImageData(w, h) ?? null;
    lastFrame = -1;
  };

  const draw = (time: number) => {
    const s = scene ? FLAT_SCENES[scene] : undefined;
    if (!s || !cells || !img || !ctx || !octx) return;
    cells.l.fill(0);
    cells.a.fill(0);
    s.draw(cells, time);
    const bg = tone("--bg-sunk", "#050505");
    const dim = tone("--ink-dim", "#5e5e5e");
    const ink = tone("--ink", "#ededed");
    const ember = tone("--accent", "#ff4f1f");
    const tones = [bg, dim, ink];
    const { w, h, l, a } = cells;
    const d = img.data;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const th = bayer(x, y);
        const heat = a[i]!;
        let rgb: Rgb;
        if (heat > th) rgb = heat > 0.92 && (heat - 0.92) * 12 > th ? ink : ember;
        else {
          const v = clamp(l[i]!) * 2;
          const b = Math.floor(v);
          rgb = tones[Math.min(2, b + (v - b > th ? 1 : 0))]!;
        }
        d[i * 4] = rgb[0];
        d[i * 4 + 1] = rgb[1];
        d[i * 4 + 2] = rgb[2];
        d[i * 4 + 3] = 255;
      }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, w * k, h * k);
  };

  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (!scene || !visible || document.hidden) return;
    const s = FLAT_SCENES[scene];
    if (!s) return;
    if (still.matches) {
      if (lastFrame !== -2) draw(s.still);
      lastFrame = -2;
      return;
    }
    const frame = Math.floor(((now - start) / 1000) * FPS);
    if (frame === lastFrame) return;
    lastFrame = frame;
    draw(frame / FPS);
  };

  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(([e]) => {
    visible = e?.isIntersecting ?? true;
  }).observe(el);
  resize();
  requestAnimationFrame(tick);

  return {
    show(name) {
      scene = name && FLAT_SCENES[name] ? name : null;
      lastFrame = -1;
    },
  };
}
