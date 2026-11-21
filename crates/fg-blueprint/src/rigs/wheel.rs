//! `wheel` and `rim` of parts.ts.

use super::{add, mul, seg};
use crate::block::Block;
use crate::raster::Slot;
use fg_math::num::{cos, js_max, js_round, sin, truthy};
use fg_math::Vec3;
use std::f64::consts::PI;

pub struct WheelOptions {
    pub teeth: f64,
    pub spokes: f64,
    /// `hub` as given (`None` when absent): spokes start at `hub ?? 0.3`, the ring needs it.
    pub hub: Option<f64>,
    pub ink: u8,
    /// Teeth length (`tooth ?? 0.5`).
    pub tooth: f64,
}

#[inline]
fn at(c: Vec3, e1: Vec3, e2: Vec3, rad: f64, a: f64) -> Vec3 {
    add(c, add(mul(e1, cos(a) * rad), mul(e2, sin(a) * rad)))
}

/// A point on the wheel's rim at `angle`.
pub fn rim(c: Vec3, r: f64, e1: Vec3, e2: Vec3, angle: f64) -> Vec3 {
    add(c, add(mul(e1, cos(angle) * r), mul(e2, sin(angle) * r)))
}

/// A wheel of radius `r` in the plane spanned by `e1` and `e2`, turned by `angle`.
pub fn wheel(
    out: &mut Vec<Block>,
    c: Vec3,
    r: f64,
    e1: Vec3,
    e2: Vec3,
    angle: f64,
    o: &WheelOptions,
) {
    let n = js_max(14.0, js_round(r * 7.0));
    let mut k = 0.0;
    while k < n {
        seg(
            out,
            at(c, e1, e2, r, (k / n) * PI * 2.0),
            at(c, e1, e2, r, ((k + 1.0) / n) * PI * 2.0),
            o.ink,
        );
        k += 1.0;
    }
    let mut k = 0.0;
    while k < o.teeth {
        let a = angle + (k / o.teeth) * PI * 2.0;
        seg(
            out,
            at(c, e1, e2, r, a),
            at(c, e1, e2, r + o.tooth, a),
            o.ink,
        );
        k += 1.0;
    }
    let mut k = 0.0;
    while k < o.spokes {
        let a = angle + (k / o.spokes) * PI * 2.0;
        seg(
            out,
            at(c, e1, e2, o.hub.unwrap_or(0.3), a),
            at(c, e1, e2, r, a),
            Slot::DIM,
        );
        k += 1.0;
    }
    if let Some(hub) = o.hub.filter(|&h| truthy(h)) {
        for k in 0..8 {
            let k = k as f64;
            seg(
                out,
                at(c, e1, e2, hub, (k / 8.0) * PI * 2.0),
                at(c, e1, e2, hub, ((k + 1.0) / 8.0) * PI * 2.0),
                Slot::DIM,
            );
        }
    }
}
