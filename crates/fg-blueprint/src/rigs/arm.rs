//! `arm` of parts.ts: a two-link arm on a turret, elbow up, solved by inverse kinematics.

use super::{add, block, dot, len, mul, seg, sub};
use crate::block::{flags, Block};
use crate::raster::Slot;
use fg_math::num::{hypot, js_max, js_min, truthy};
use fg_math::Vec3;

/// Draws the arm; returns the wrist (`target` when it is in reach).
pub fn arm(out: &mut Vec<Block>, base: Vec3, target: Vec3, l1: f64, l2: f64, ink: u8) -> Vec3 {
    block(out, base, [2.4, 2.4, 1.2], flags::PLATE);
    let sh = [base[0], base[1], base[2] + 2.4];
    block(out, [base[0], base[1], base[2] + 1.2], [1.2, 1.2, 1.2], 0);
    let d = sub(target, sh);
    let dist = js_min(len(d), l1 + l2 - 0.01);
    let ld = len(d);
    let dir = mul(d, 1.0 / if truthy(ld) { ld } else { 1.0 });
    let wrist = add(sh, mul(dir, dist));
    let a = (l1 * l1 - l2 * l2 + dist * dist) / (2.0 * dist);
    let h = js_max(0.0, l1 * l1 - a * a).sqrt();
    let hz = hypot(&[dir[0], dir[1]]);
    let horiz = if truthy(hz) { hz } else { 1.0 };
    let up = [
        (-dir[0] * dir[2]) / horiz,
        (-dir[1] * dir[2]) / horiz,
        horiz,
    ];
    let elbow = add(add(sh, mul(dir, a)), mul(up, h));
    seg(out, sh, elbow, ink);
    seg(out, elbow, wrist, ink);
    seg(
        out,
        [sh[0] + 0.3, sh[1], sh[2]],
        [elbow[0] + 0.3, elbow[1], elbow[2]],
        Slot::DIM,
    );
    dot(out, sh, ink, 3.0);
    dot(out, elbow, ink, 3.0);
    seg(out, wrist, [wrist[0], wrist[1], wrist[2] - 0.8], ink);
    seg(
        out,
        [wrist[0] - 0.5, wrist[1], wrist[2] - 0.8],
        [wrist[0] + 0.5, wrist[1], wrist[2] - 0.8],
        ink,
    );
    wrist
}
