//! `pendulum` of parts.ts: hung at `pivot`, swinging by `angle` in the plane of `e` and Z.

use super::{add, block, mul, seg, Z};
use crate::block::{flags, Block};
use crate::raster::Slot;
use fg_math::num::{cos, sin};
use fg_math::Vec3;

/// Draws the pendulum; returns the bob.
pub fn pendulum(
    out: &mut Vec<Block>,
    pivot: Vec3,
    length: f64,
    e: Vec3,
    angle: f64,
    ink: u8,
) -> Vec3 {
    let bob = add(
        pivot,
        add(mul(e, sin(angle) * length), mul(Z, -cos(angle) * length)),
    );
    seg(out, pivot, bob, Slot::DIM);
    let look = if ink == Slot::ACCENT {
        flags::ACCENT
    } else {
        0
    };
    block(out, [bob[0], bob[1], bob[2] - 0.5], [1.0, 1.0, 1.0], look);
    bob
}
