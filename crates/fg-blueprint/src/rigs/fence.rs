//! The border fence of village.ts's lock-in: posts every 3 units and three barbed wires round
//! the island's edge, up to `done` units along it, open where the gate stands.

use super::seg;
use crate::block::Block;
use crate::raster::Slot;
use crate::tracks::along;
use fg_math::num::sin;
use fg_math::Vec3;

const RING: [Vec3; 5] = [
    [36.4, 36.4, 0.0],
    [36.4, -36.4, 0.0],
    [-36.4, -36.4, 0.0],
    [-36.4, 36.4, 0.0],
    [36.4, 36.4, 0.0],
];
const GX: f64 = -27.0;

#[inline]
fn gap(q: Vec3) -> bool {
    q[1] > 36.0 && (q[0] - GX).abs() < 4.2
}

pub fn fence(out: &mut Vec<Block>, done: f64) {
    let mut d = 0.0;
    while d <= done {
        let q = along(&RING, d);
        if !gap(q) {
            seg(out, [q[0], q[1], 0.0], [q[0], q[1], 2.4], Slot::INK);
            seg(
                out,
                [q[0] - 0.25, q[1] - 0.25, 2.4],
                [q[0] + 0.25, q[1] + 0.25, 2.8],
                Slot::DIM,
            );
        }
        d += 3.0;
    }
    for z in [0.8, 1.5, 2.2] {
        let mut prev: Option<Vec3> = None;
        let mut d = 0.0;
        while d <= done {
            let q0 = along(&RING, d);
            let q = [
                q0[0],
                q0[1],
                z - sin((d / 3.0) * std::f64::consts::PI).abs() * 0.15,
            ];
            if gap(q) {
                prev = None;
                d += 1.5;
                continue;
            }
            if let Some(p) = prev {
                seg(out, p, q, if z == 1.5 { Slot::INK } else { Slot::DIM });
            }
            seg(
                out,
                [q[0] - 0.25, q[1], q[2] - 0.25],
                [q[0] + 0.25, q[1], q[2] + 0.25],
                Slot::INK,
            );
            seg(
                out,
                [q[0], q[1] - 0.25, q[2] + 0.25],
                [q[0], q[1] + 0.25, q[2] - 0.25],
                Slot::INK,
            );
            prev = Some(q);
            d += 1.5;
        }
    }
}
