//! `piston` of parts.ts: a crank in the vertical plane along `axis`, a piston sliding above it.

use super::{block, boxed, dot, rim, seg, wheel, WheelOptions, X, Y, Z};
use crate::block::{flags, Block};
use crate::raster::Slot;
use fg_math::num::js_max;
use fg_math::Vec3;

pub fn piston(out: &mut Vec<Block>, c: Vec3, axis: Vec3, angle: f64, r: f64, rod: f64) {
    let e1 = if axis == X { Y } else { X };
    let crank = WheelOptions {
        teeth: 0.0,
        spokes: 2.0,
        hub: None,
        ink: Slot::DIM,
        tooth: 0.5,
    };
    wheel(out, c, r + 0.3, e1, Z, angle, &crank);
    let pin = rim(c, r, e1, Z, angle);
    let off = pin[0] - c[0] + pin[1] - c[1];
    let lift = pin[2] + js_max(0.0, rod * rod - off * off).sqrt();
    let head = [c[0], c[1], lift];
    seg(out, pin, head, Slot::INK);
    dot(out, pin, Slot::INK, 2.0);
    block(out, head, [1.4, 1.4, 1.2], 0);
    boxed(
        out,
        [c[0] - 0.9, c[1] - 0.9, c[2] + rod - r - 0.2],
        [1.8, 1.8, 2.0 * r + 2.6],
        flags::GHOST,
    );
}
