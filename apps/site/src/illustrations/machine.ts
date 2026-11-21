/**
 * The machine (/machine): a very complex mechanism that does nothing. Marbles are lifted, roll
 * down ramps, tip a lever that rings a bell; an inline four engine turns a flywheel, whose belt
 * drives a gear tower; a planetary set, a carousel with a radar, two arms passing one cube back
 * and forth, a pendulum wave, a cam wave, a Newton's cradle, a loop conveyor, racks, fans and
 * trays. Every part is a pure function of time; the periods differ, so it never quite repeats.
 */
import type { Block, Vec3 } from "@forgeron/blueprint";
import {
  along,
  arm,
  block,
  box,
  dot,
  fan,
  glide,
  lerp3,
  pathLength,
  pendulum,
  piston,
  polyline,
  rack,
  rim,
  seg,
  tray,
  wheel,
  X,
  Y,
  Z,
} from "./parts";

export function machine(t: number): Block[] {
  const out: Block[] = [];
  const TAU = Math.PI * 2;

  // Back wall: racks with lights and fans, a tray of packets above them.
  for (let k = 0, y = -42; y <= 32; y += 3.4, k++) {
    const h = rack(out, -32, y, t, k);
    if (k % 2 === 0) fan(out, [-32, y, h + 0.1], 1.1, t * 4 + k);
  }
  tray(out, [-29.5, -42, 15], [-29.5, 32, 15], t, 4, 14);
  tray(out, [-29, 0, 14], [-12, 0, 14], t, 3, 4);
  tray(out, [-29, -24, 14], [8, -24, 14], t, 3, 6);

  // Gear tower, upright against the back: five gears in mesh, driven by the flywheel's belt.
  const drive = t * 1.4;
  const gears: [number, number, number, number][] = [
    // y, z, radius, teeth
    [-30, 6, 3.6, 24],
    [-30 + 3.6 + 2.2 + 0.5, 6, 2.2, 15],
    [-30 + 3.6 + 2.2 + 0.5, 6 + 2.2 + 3 + 0.5, 3, 20],
    [-30 + 3.6 + 2.2 + 0.5 + 3 + 1.6 + 0.5, 6 + 2.2 + 3 + 0.5, 1.6, 11],
    [-30, 6 + 3.6 + 4 + 0.6, 4, 27],
  ];
  let ratio = 1;
  gears.forEach(([gy, gz, r, teeth], i) => {
    if (i > 0) ratio *= -gears[i - 1]![2] / r;
    const c: Vec3 = [-26, gy, gz];
    wheel(out, c, r, Y, Z, drive * ratio, { teeth, spokes: r > 2.5 ? 5 : 3, hub: 0.5 });
    seg(out, [-26, gy, gz], [-28, gy, gz], "dim");
  });
  box(out, [-28.6, -32, 0], [1, 1, 22], { floors: 2 });
  box(out, [-28.6, -16, 0], [1, 1, 22], { floors: 2 });
  seg(out, [-28.1, -32, 21], [-28.1, -16, 21], "dim");

  // Inline four: crankshaft along y, pistons at quarter phases, a flywheel at the end.
  const crank = t * 3;
  for (let i = 0; i < 4; i++)
    piston(
      out,
      [-18, -8 + i * 3.2, 2.4],
      Y,
      crank + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0),
    );
  seg(out, [-18, -9.5, 2.4], [-18, 4, 2.4]);
  box(out, [-20.5, -9.5, 0], [5, 14, 1.2], { floors: 0.6, vents: true });
  const fw: Vec3 = [-18, -12, 4];
  wheel(out, fw, 3.4, X, Z, crank, { spokes: 6, hub: 0.6 });
  // Belt from the flywheel up to the first gear, with its moving marks.
  const g0: Vec3 = [-26, -30, 6];
  const belt = [rim(fw, 3.4, X, Z, Math.PI / 2), rim(g0, 3.6, Y, Z, Math.PI / 2)];
  const belt2 = [rim(fw, 3.4, X, Z, -Math.PI / 2), rim(g0, 3.6, Y, Z, -Math.PI / 2)];
  seg(out, belt[0]!, belt[1]!, "dim");
  seg(out, belt2[0]!, belt2[1]!, "dim");
  for (let k = 0; k < 5; k++) dot(out, lerp3(belt[0]!, belt[1]!, (t * 0.6 + k / 5) % 1), "ink", 2);

  // Planetary set on a pedestal: sun, three planets, ring.
  {
    const c: Vec3 = [-16, 16, 4];
    box(out, [-19, 13, 0], [6, 6, 4], { floors: 1.3 });
    const sun = t * 1.2;
    wheel(out, c, 1.4, X, Y, sun, { teeth: 10, hub: 0.3 });
    wheel(out, c, 6, X, Y, -sun * (1.4 / 6), { teeth: 36, tooth: -0.5 });
    const carrier = sun * (1.4 / (1.4 + 6));
    for (let k = 0; k < 3; k++) {
      const pc = rim(c, 3.7, X, Y, carrier + (k * TAU) / 3);
      wheel(out, pc, 1.8, X, Y, -sun * (1.4 / 1.8), { teeth: 12, spokes: 3, hub: 0.25 });
      seg(out, c, pc, "dim");
    }
  }

  // Newton's cradle.
  {
    const x0 = -8;
    const y0 = 22;
    box(out, [x0 - 0.3, y0 - 5, 0], [0.6, 0.6, 7]);
    box(out, [x0 - 0.3, y0 + 5, 0], [0.6, 0.6, 7]);
    seg(out, [x0, y0 - 5, 7], [x0, y0 + 5.6, 7]);
    box(out, [x0 - 2, y0 - 5.5, 0], [4, 11, 0.5], { plate: true });
    const phase = (t * 1.1) % 2;
    const swing = Math.sin((phase % 1) * Math.PI) * 0.7;
    for (let k = 0; k < 5; k++) {
      let a = 0;
      if (k === 0 && phase < 1) a = -swing;
      if (k === 4 && phase >= 1) a = swing;
      pendulum(out, [x0, y0 - 3.4 + k * 1.7, 7], 5, Y, a);
    }
  }

  // Carousel with towers, and a radar on its mast.
  {
    const c: Vec3 = [-4, 4, 0.8];
    const spin = t * 0.5;
    box(out, [-6, 2, 0], [4, 4, 0.8]);
    wheel(out, c, 6, X, Y, spin, { teeth: 30, tooth: 0.4 });
    wheel(out, [c[0], c[1], 0.1], 6, X, Y, 0, { ink: "dim" });
    for (let k = 0; k < 6; k++) {
      const p = rim(c, 4.3, X, Y, spin + (k * TAU) / 6);
      block(out, p, [1.4, 1.4, 1.5 + (k % 3) * 1.5], { floors: 1 });
    }
    seg(out, c, [c[0], c[1], 12]);
    const yaw = t * 0.9;
    const e1: Vec3 = [Math.cos(yaw), Math.sin(yaw), 0];
    wheel(out, [c[0], c[1], 13], 2.4, e1, Z, 0, { spokes: 4, hub: 0.3 });
    dot(out, [c[0], c[1], 15.6], Math.floor(t * 2) % 2 ? "accent" : "dim", 3);
  }

  // Two arms passing one cube between two pedestals, for no reason at all.
  {
    const P1: Vec3 = [9, 11, 2];
    const P2: Vec3 = [9, 19, 2];
    block(out, [P1[0], P1[1], 0], [2.4, 2.4, 2], { plate: true });
    block(out, [P2[0], P2[1], 0], [2.4, 2.4, 2], { plate: true });
    const T = 7;
    const k = (t % T) / T;
    const half = k < 0.5;
    const q = half ? k / 0.5 : (k - 0.5) / 0.5;
    const from = half ? P1 : P2;
    const to = half ? P2 : P1;
    const lift = Math.sin(glide(q) * Math.PI) * 5;
    const carry = lerp3(from, to, glide(q));
    const cube: Vec3 = [carry[0], carry[1], carry[2] + lift];
    const rest: Vec3 = [9, 15, 7];
    arm(out, [3, 11, 0], half ? [cube[0], cube[1], cube[2] + 1.6] : rest, 5.5, 5.5);
    arm(
      out,
      [3, 19, 0],
      half ? [rest[0], rest[1] + 1, rest[2]] : [cube[0], cube[1], cube[2] + 1.6],
      5.5,
      5.5,
    );
    block(out, cube, [1.4, 1.4, 1.4], { accent: true });
  }

  // Marble run: a lift, four ramps, a lever and a bell. Marbles go round for ever.
  {
    const run: Vec3[] = [
      [20, 26, 17],
      [20, 6, 14.5],
      [27, 6, 13],
      [27, 24, 10],
      [20, 24, 8.5],
      [20, 6, 6],
      [27, 6, 4.5],
      [27, 20, 2.2],
      [24, 20, 1.4],
    ];
    const lift: Vec3[] = [
      [24, 20, 1.4],
      [22.5, 26, 0.8],
      [22.5, 26, 17.6],
      [20, 26, 17],
    ];
    polyline(out, run);
    polyline(
      out,
      run.map((p) => [p[0] + 0.5, p[1], p[2] - 0.3] as Vec3),
      "dim",
    );
    for (const p of run.slice(1, -1)) seg(out, p, [p[0], p[1], 0], "dim", 2);
    box(out, [21.6, 25.1, 0], [1.8, 1.8, 18.4], { ghost: true });
    // Buckets riding the lift chain.
    for (let k = 0; k < 6; k++) {
      const z = (t * 2.2 + k * 3) % 18;
      block(out, [22.5, 26, z], [0.9, 0.9, 0.5]);
    }
    const Lr = pathLength(run);
    const Ll = pathLength(lift);
    const speed = 6;
    const total = Lr / speed + Ll / 2.2;
    const N = 7;
    let lastHit = Infinity;
    for (let i = 0; i < N; i++) {
      const k = (t + (i * total) / N) % total;
      const onRun = k < Lr / speed;
      const p = onRun ? along(run, k * speed) : along(lift, (k - Lr / speed) * 2.2);
      dot(out, [p[0], p[1], p[2] + 0.5], "ink", 4);
      if (!onRun) lastHit = Math.min(lastHit, k - Lr / speed);
    }
    // Lever: tipped by each marble arriving, it lifts a hammer that strikes the bell.
    const tip = lastHit < 0.6 ? Math.sin((lastHit / 0.6) * Math.PI) : 0;
    const piv: Vec3 = [22, 17, 1.2];
    seg(out, [22, 13.5, 1.2 + tip * 1.2], [22, 20.5, 1.2 - tip * 1.2]);
    block(out, [piv[0], piv[1], 0], [0.8, 0.8, 1.2]);
    const hammer: Vec3 = [22, 13.5, 1.2 + tip * 1.2 + 2.4];
    seg(out, [22, 13.5, 1.2 + tip * 1.2], hammer);
    block(out, hammer, [1, 1, 0.8]);
    const ring = tip > 0.85;
    box(out, [21.2, 11.2, 3.2], [1.6, 1.6, 0.4], { ghost: !ring, accent: ring });
    wheel(out, [22, 12, 4.8], 1.4, X, Y, 0, { ink: ring ? "accent" : "ink" });
    seg(out, [22, 12, 4.8], [22, 12, 9], "dim");
  }

  // Pendulum wave on a long bar: each pendulum a little faster than the last.
  {
    const x = 16;
    box(out, [x - 0.4, -40.4, 0], [0.8, 0.8, 13]);
    box(out, [x - 0.4, -16.4, 0], [0.8, 0.8, 13]);
    seg(out, [x, -40, 13], [x, -16, 13]);
    for (let k = 0; k < 14; k++) {
      const w = TAU * (0.5 + k * 0.025);
      pendulum(out, [x, -38.5 + k * 1.7, 13], 8 - k * 0.25, X, 0.45 * Math.sin(w * t));
    }
  }

  // Cam wave: a camshaft along x lifts a row of followers into a travelling wave.
  {
    const y = -34;
    box(out, [-16, y - 1.5, 0], [24, 3, 1], { floors: 0.5 });
    seg(out, [-16, y, 2], [8, y, 2]);
    for (let k = 0; k < 16; k++) {
      const x = -15 + k * 1.5;
      const a = t * 2 - k * 0.45;
      wheel(out, [x, y, 2], 0.7, Y, Z, a, { spokes: 1 });
      const z = 3 + 1.4 * (0.5 + 0.5 * Math.sin(a));
      seg(out, [x, y, 2.8], [x, y, z + 2], "dim");
      block(out, [x, y, z + 2], [1.1, 1.1, 0.4], { plate: true });
    }
  }

  // A loop conveyor with crates, round and round.
  {
    const loop: Vec3[] = [
      [18, -12, 0.8],
      [30, -12, 0.8],
      [30, 2, 0.8],
      [18, 2, 0.8],
      [18, -12, 0.8],
    ];
    polyline(out, loop);
    polyline(
      out,
      loop.map(
        (p) => [p[0] + (p[0] > 24 ? 1.2 : -1.2), p[1] + (p[1] > -5 ? 1.2 : -1.2), 0.8] as Vec3,
      ),
      "dim",
    );
    const L = pathLength(loop);
    for (let k = 0; k < 8; k++) block(out, along(loop, (t * 2 + (k * L) / 8) % L), [1.4, 1.4, 1.4]);
    for (const [px, py] of [
      [18, -12],
      [30, -12],
      [30, 2],
      [18, 2],
    ] as const)
      wheel(out, [px, py, 0.8], 0.9, X, Y, t * 3, { spokes: 2 });
  }

  // Overhead gantry along the back, its carriage drifting from end to end.
  {
    box(out, [-14, -44, 0], [1, 1, 18]);
    box(out, [-14, 30, 0], [1, 1, 18]);
    box(out, [-14, -44, 18], [1, 75, 0.8]);
    const y = -40 + 66 * (0.5 + 0.5 * Math.sin(t * 0.25));
    box(out, [-15, y - 1, 18.8], [3, 2, 1]);
    seg(out, [-13.5, y, 18.8], [-13.5, y, 10 + 3 * Math.sin(t * 1.3)], "dim");
    block(out, [-13.5, y, 9 + 3 * Math.sin(t * 1.3)], [1.2, 1.2, 1]);
  }

  // Front left: a wheel of gondolas, and three arms dancing in a canon.
  {
    const c: Vec3 = [-2, 40, 9];
    const turn = t * 0.35;
    box(out, [-2.4, 33, 0], [0.8, 0.8, 9]);
    box(out, [-2.4, 46.2, 0], [0.8, 0.8, 9]);
    wheel(out, c, 7, Y, Z, turn, { spokes: 8, hub: 0.8 });
    wheel(out, [-3.2, 40, 9], 7, Y, Z, turn, { ink: "dim" });
    for (let k = 0; k < 8; k++) {
      const p = rim(c, 7, Y, Z, turn + (k * TAU) / 8);
      seg(out, p, [p[0], p[1], p[2] - 1.2], "dim");
      block(out, [p[0], p[1], p[2] - 2.2], [1.4, 1.4, 1], { floors: 0.5 });
    }
    for (let k = 0; k < 3; k++) {
      const a = t * 1.1 - k * 0.9;
      const base: Vec3 = [8, 34 + k * 6, 0];
      arm(
        out,
        base,
        [base[0] + Math.cos(a) * 3, base[1] + Math.sin(a) * 2, 6 + Math.sin(a * 2) * 2],
        5,
        5,
      );
    }
  }

  // Right: a stamping line under three presses, and a row of dishes that sweep together.
  {
    const y0 = -44;
    const y1 = -22;
    seg(out, [26, y0, 1], [26, y1, 1]);
    seg(out, [29, y0, 1], [29, y1, 1]);
    box(out, [25.5, y0, 0], [4, y1 - y0, 1], { floors: 0.5 });
    const L = y1 - y0;
    for (let k = 0; k < 7; k++) {
      const s = (t * 1.6 + (k * L) / 7) % L;
      block(out, [27.5, y0 + s, 1], [1.4, 1.4, 0.6], { plate: true });
    }
    for (let k = 0; k < 3; k++) {
      const y = y0 + 5 + k * 6.5;
      box(out, [31, y - 1, 0], [2, 2, 9], { floors: 1.5 });
      box(out, [26, y - 0.8, 8.4], [7, 1.6, 1]);
      piston(out, [27.5, y, 5.5], X, t * 2.6 + k * 1.2, 0.9, 2.6);
    }
    for (let k = 0; k < 4; k++) {
      const base: Vec3 = [36, -40 + k * 6, 0];
      seg(out, base, [base[0], base[1], 6]);
      const yaw = Math.sin(t * 0.6) * 0.9 + Math.PI;
      const e1: Vec3 = [Math.cos(yaw) * 0.3, Math.sin(yaw), 0];
      const tilt = 0.6 + 0.2 * Math.sin(t * 0.8 + k);
      const e2: Vec3 = [Math.cos(yaw + Math.PI / 2) * tilt, 0, Math.cos(tilt)];
      wheel(out, [base[0], base[1], 7.5], 2, e1, e2, 0, { spokes: 4, hub: 0.2 });
      dot(out, [base[0], base[1], 6], Math.floor(t * 3 + k) % 4 === 0 ? "accent" : "dim", 2);
    }
  }

  return out;
}
