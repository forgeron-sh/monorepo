//! `fan` of parts.ts: a housing ring and four blades in the horizontal plane.

use super::{rim, seg, wheel, WheelOptions, X, Y};
use crate::block::Block;
use crate::raster::Slot;
use fg_math::Vec3;
use std::f64::consts::PI;

pub fn fan(out: &mut Vec<Block>, c: Vec3, r: f64, angle: f64) {
    let ring = WheelOptions {
        teeth: 0.0,
        spokes: 0.0,
        hub: None,
        ink: Slot::DIM,
        tooth: 0.5,
    };
    wheel(out, c, r, X, Y, 0.0, &ring);
    for k in 0..4 {
        let k = k as f64;
        seg(
            out,
            c,
            rim(c, r * 0.85, X, Y, angle + (k * PI) / 2.0),
            Slot::INK,
        );
    }
}
