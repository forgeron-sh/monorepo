//! `flames` of village.ts: pixel-art flames, dots whose density is dithered through Bayer 4×4,
//! in three stepped frames; one flame in three is a big one.

use crate::block::{Block, BlockKind};
use crate::raster::Slot;
use fg_math::num::{hash, js_max, js_round, pow};
use fg_math::Vec3;

const BAYER4: [f64; 16] = [
    0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.,
];

#[inline]
fn bayer4(x: f64, y: f64) -> f64 {
    let m = |v: f64| ((v % 4.0) + 4.0) % 4.0;
    (BAYER4[(m(y) * 4.0 + m(x)) as usize] + 0.5) / 16.0
}

pub fn sparks(out: &mut Vec<Block>, c: Vec3, t: f64, n: f64, seed: f64) {
    let frame = (t * 6.0).floor();
    const S: f64 = 0.2;
    let mut k = 0.0;
    while k < n {
        let ox = (hash(seed, k) - 0.5) * 4.0;
        let oy = (hash(seed, k + 50.0) - 0.5) * 4.0;
        let f = (frame + k) % 3.0;
        let big = k % 3.0 == 0.0;
        let rows = (if big { 13.0 } else { 9.0 }) + (if f == 1.0 { 1.0 } else { 0.0 });
        let half: f64 = if big { 4.0 } else { 3.0 };
        let sway = if f == 0.0 {
            -1.0
        } else if f == 2.0 {
            1.0
        } else {
            0.0
        };
        let mut i = 0.0;
        while i < rows {
            let q = i / rows;
            let w = half * pow(1.0 - q, 0.75);
            let shift = js_round(sway * q * q * 2.0);
            let mut j = -half;
            while j <= half {
                let d = j.abs() / js_max(0.5, w);
                if d <= 1.0 {
                    let density = (0.72 - q * 0.55) * (1.0 - d * d * 0.75);
                    if bayer4(j + k * 3.0, i + f) < density {
                        let mut b = Block::new(BlockKind::Dot);
                        b.a = [c[0] + ox + (j + shift) * S, c[1] + oy, c[2] + i * S];
                        b.ink = Slot::ALERT;
                        b.size = 1.0;
                        b.layer = 1.0;
                        out.push(b);
                    }
                }
                j += 1.0;
            }
            i += 1.0;
        }
        k += 1.0;
    }
}
