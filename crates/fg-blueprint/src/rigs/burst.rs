//! The blast of village.ts's ERP: 160 fire particles thrown from the top terrace, white hot, then
//! ember, then ash, as the blast's progress `b` (0 to 1) goes.

use super::dot;
use crate::block::Block;
use crate::raster::Slot;
use fg_math::num::{cos, hash, js_max, sin};

const TAU: f64 = std::f64::consts::PI * 2.0;

pub fn burst(out: &mut Vec<Block>, b: f64) {
    for k in 0..160 {
        let k = k as f64;
        let age = (b - hash(k, 83.0) * 0.35) * 2.2;
        if age <= 0.0 || age > 1.0 {
            continue;
        }
        let a = hash(k, 80.0) * TAU;
        let el = 0.25 + hash(k, 81.0) * 1.2;
        let v = 6.0 + hash(k, 82.0) * 16.0;
        let pos = [
            cos(a) * cos(el) * v * age,
            sin(a) * cos(el) * v * age,
            js_max(0.0, 4.0 + sin(el) * v * age * 1.4 - 10.0 * age * age),
        ];
        let ink = if age < 0.2 {
            Slot::INK
        } else if age < 0.7 {
            Slot::ALERT
        } else {
            Slot::DIM
        };
        dot(out, pos, ink, if age < 0.35 { 3.0 } else { 2.0 });
    }
}
