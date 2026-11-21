//! The ticket pile behind village.ts's support desk: `round(160·g)` tickets heaped round `at`,
//! the heap higher and wider as `g` (the story's swing, squared) grows; one in nine is a plate.

use super::boxed;
use crate::block::{flags, Block};
use fg_math::num::{cos, hash, js_round, sin};
use fg_math::Vec3;

const TAU: f64 = std::f64::consts::PI * 2.0;

pub fn pile(out: &mut Vec<Block>, at: Vec3, g: f64) {
    let heap = js_round(160.0 * g);
    let mut k = 0.0;
    while k < heap {
        let h = hash(k, 61.0).sqrt() * (0.5 + g * 6.5);
        let r = (1.0 - h / (0.6 + g * 6.6)) * (1.0 + g * 5.0);
        let a = hash(k, 62.0) * TAU;
        let d = hash(k, 63.0).sqrt() * r;
        boxed(
            out,
            [at[0] + cos(a) * d, at[1] + sin(a) * d, h * 0.7],
            [0.9, 0.6, 0.15],
            if k % 9.0 == 0.0 { flags::PLATE } else { 0 },
        );
        k += 1.0;
    }
}
