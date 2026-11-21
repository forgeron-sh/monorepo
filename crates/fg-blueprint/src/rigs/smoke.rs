//! `smoke` of village.ts: puffs rising from a chimney top, small squiggles that drift and thin.

use super::seg;
use crate::block::Block;
use crate::raster::Slot;
use fg_math::num::{hash, sin};
use fg_math::Vec3;

pub fn smoke(out: &mut Vec<Block>, top: Vec3, t: f64, n: f64, seed: f64, rise: f64, thick: f64) {
    let mut k = 0.0;
    while k < n {
        let age = (t * 0.28 + k / n + hash(seed, k) * 0.1) % 1.0;
        let jx = (hash(seed, k + 100.0) - 0.5) * 1.6 * thick;
        let jy = (hash(seed, k + 200.0) - 0.5) * 1.6 * thick;
        let c = [
            top[0] + age * 3.0 + jx + sin(age * 5.0 + seed) * 0.6,
            top[1] - age * 1.5 + jy,
            top[2] + age * rise,
        ];
        let len = 0.5 + age * 0.6;
        let wob = sin(t * 6.0 + k * 1.3) * 0.25;
        let ink = if age > 0.7 { Slot::FAINT } else { Slot::DIM };
        let mut prev = [c[0] - len, c[1], c[2]];
        for j in 1..=3 {
            let jf = j as f64;
            let q = [
                c[0] - len + (jf * 2.0 * len) / 3.0,
                c[1] + (if j % 2 == 1 { 0.3 } else { -0.3 }) + wob,
                c[2] + jf * 0.25,
            ];
            seg(out, prev, q, ink);
            prev = q;
        }
        k += 1.0;
    }
}
