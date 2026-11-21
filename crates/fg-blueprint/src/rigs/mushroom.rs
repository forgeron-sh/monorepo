//! The mushroom cloud of village.ts's ERP: a rolled cap with a dome, a stem with a collar, and a
//! surge along the ground, made of red pixels (larger and packed at the heart, dithered away at
//! the edges by Bayer 4×4), turning to ash, then thinning out as the fire takes the village.
//! `b` is the blast's progress, `fire` the fire step's, `t` the clock (the cap boils).
//!
//! Each of its 8,750 puffs has a direction, a radius and thresholds that depend on its number
//! alone (hashes, their sines and cosines, square roots): they are worked out once, on the first
//! draw, with the same operations, so a frame only does what depends on `b`, `fire` and `t` (the
//! trigonometry, done in software in WebAssembly, was most of the frame).

use crate::block::{Block, BlockKind};
use crate::raster::Slot;
use fg_math::num::{cos, hash, js_max, js_min, sin};
use fg_math::Vec3;
use std::sync::OnceLock;

use super::sparks::bayer4;

const TAU: f64 = std::f64::consts::PI * 2.0;

/// What a puff keeps from its number: whether `put` drops it whatever the frame (its Bayer test
/// on a weight that depends on the puff only), the hashes it is tested against each frame, and
/// the factors of its point.
#[derive(Clone, Copy, Default)]
struct Puff {
    dithered: bool,
    edge: f64,
    gone: f64,
    ash: f64,
    c: f64,
    s: f64,
    a: f64,
    b: f64,
    d: f64,
}

struct Puffs {
    cap: Vec<Puff>,
    dome: Vec<Puff>,
    stem: Vec<Puff>,
    collar: Vec<Puff>,
    surge: Vec<Puff>,
}

/// `put`'s tests that depend on the puff alone: `k` its number in `put`, `w` its weight.
fn puff(k: f64, w: f64) -> Puff {
    let edge = js_min(1.0, w);
    Puff {
        dithered: bayer4(k, ((k as i32) >> 2) as f64) < edge * 0.7,
        edge,
        gone: hash(k, 123.0),
        ash: hash(k, 97.0),
        ..Puff::default()
    }
}

fn puffs() -> &'static Puffs {
    static PUFFS: OnceLock<Puffs> = OnceLock::new();
    PUFFS.get_or_init(|| {
        let cap = (0..3800)
            .map(|k| {
                let k = k as f64;
                let u = hash(k, 90.0) * TAU;
                let v = hash(k, 91.0) * TAU;
                let w = hash(k, 92.0).sqrt();
                let sv = sin(v);
                Puff {
                    c: cos(u),
                    s: sin(u),
                    a: cos(v),
                    b: sv,
                    d: w,
                    ..puff(k, w * (if sv < -0.3 { 0.3 } else { 1.0 }))
                }
            })
            .collect();
        let dome = (0..1100)
            .map(|k| {
                let k = k as f64;
                let a2 = hash(k, 110.0) * TAU;
                Puff {
                    c: cos(a2),
                    s: sin(a2),
                    a: hash(k, 111.0).sqrt(),
                    ..puff(k + 4000.0, 0.7)
                }
            })
            .collect();
        let stem = (0..1500)
            .map(|k| {
                let k = k as f64;
                let a2 = hash(k, 94.0) * TAU;
                Puff {
                    c: cos(a2),
                    s: sin(a2),
                    a: hash(k, 93.0),
                    b: hash(k, 95.0).sqrt(),
                    ..puff(k + 5200.0, hash(k, 96.0) * 0.8)
                }
            })
            .collect();
        let collar = (0..650)
            .map(|k| {
                let k = k as f64;
                let a2 = hash(k, 120.0) * TAU;
                Puff {
                    c: cos(a2),
                    s: sin(a2),
                    a: hash(k, 121.0),
                    b: hash(k, 122.0),
                    ..puff(k + 6800.0, 0.6)
                }
            })
            .collect();
        let surge = (0..1700)
            .map(|k| {
                let k = k as f64;
                let a = hash(k, 98.0) * TAU;
                Puff {
                    c: cos(a),
                    s: sin(a),
                    a: hash(k, 99.0).sqrt(),
                    b: hash(k, 100.0),
                    d: hash(k, 101.0),
                    ..puff(k + 7500.0, 0.5 + hash(k, 102.0) * 0.5)
                }
            })
            .collect();
        Puffs {
            cap,
            dome,
            stem,
            collar,
            surge,
        }
    })
}

/// `put` of village.ts: the puff's dot, unless the cloud has gone there or the dither drops it.
#[inline]
fn kept(p: &Puff, gone: f64) -> bool {
    !(p.gone < gone || p.dithered)
}

#[inline]
fn put(out: &mut Vec<Block>, q: Vec3, p: &Puff, fade: f64) {
    let mut d = Block::new(BlockKind::Dot);
    d.a = q;
    d.ink = if p.ash < fade * 0.8 {
        Slot::DIM
    } else {
        Slot::ALERT
    };
    d.size = if p.edge < 0.45 { 2.0 } else { 1.0 };
    d.layer = 1.0;
    out.push(d);
}

pub fn mushroom(out: &mut Vec<Block>, b: f64, fire: f64, t: f64) {
    let all = puffs();
    let grow = js_min(1.0, b * 2.5);
    let fade = js_max(0.0, (b - 0.6) / 0.4);
    let r = 2.0 + grow * 9.0;
    let cz = 12.0 + grow * 10.0;
    let gone = js_min(1.0, js_max(0.0, (b - 0.75) / 0.25) * 0.35 + fire * 1.15);
    // The cap: a rolled ring whose underside curls back, and a dome filling its middle.
    let ring_r = r * 0.62;
    let tube = r * 0.5;
    for (k, p) in all.cap.iter().enumerate() {
        if !kept(p, gone) {
            continue;
        }
        let (w, cv, sv) = (p.d, p.a, p.b);
        let boil = 1.0 + 0.08 * sin(t * 2.0 + k as f64);
        let rr = ring_r + cv * tube * w * boil;
        let z = cz + sv * tube * w * 0.8 + fade * 3.0;
        put(out, [p.c * rr, p.s * rr, z], p, fade);
    }
    for p in &all.dome {
        if !kept(p, gone) {
            continue;
        }
        let r2 = p.a * ring_r;
        let z = cz + tube * 0.5 + (1.0 - r2 / ring_r) * tube * 0.7 + fade * 3.0;
        put(out, [p.c * r2, p.s * r2, z], p, fade);
    }
    // The stem, widening a little to the cap, with a collar of cloud halfway up.
    let stem_top = cz - tube * 0.6;
    for p in &all.stem {
        if !kept(p, gone) {
            continue;
        }
        let z = 7.6 + p.a * (stem_top - 7.6);
        let rr = (0.9 + 0.8 * ((z - 7.6) / (stem_top - 7.6))) * p.b * (1.0 + grow * 0.5);
        put(out, [p.c * rr, p.s * rr, z], p, fade);
    }
    let collar_z = 7.6 + (stem_top - 7.6) * 0.55;
    for p in &all.collar {
        if !kept(p, gone) {
            continue;
        }
        let rr = (2.2 + grow * 2.2) * (0.8 + 0.2 * p.a);
        put(
            out,
            [p.c * rr, p.s * rr, collar_z + (p.b - 0.5) * 1.2],
            p,
            fade,
        );
    }
    // The surge of fire and smoke rolling out along the ground.
    let surge = 9.0 + grow * 9.0;
    for p in &all.surge {
        if !kept(p, gone) {
            continue;
        }
        let rr = surge * (0.75 + 0.25 * p.a);
        let z = p.b * 2.4 * (1.0 - p.d * 0.5);
        put(out, [p.c * rr, p.s * rr, z], p, fade);
    }
}
