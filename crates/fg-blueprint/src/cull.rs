//! Culling: a block whose pixels all fall outside the raster is skipped. Every pixel a block can
//! write lies within its projected corners (a box's details and plate sit on its faces; a dot
//! spans its size), so the margin below keeps the frame identical. Labels are never culled:
//! their placement reads them all.

use crate::block::{Block, BlockKind};
use fg_math::{iso, View};

const MARGIN: f64 = 3.0;

/// Whether `b` may write a pixel of a `width` × `height` raster.
pub fn visible(b: &Block, view: &View, width: f64, height: f64) -> bool {
    let mut lo = (f64::INFINITY, f64::INFINITY);
    let mut hi = (f64::NEG_INFINITY, f64::NEG_INFINITY);
    let mut add = |v: [f64; 3]| {
        let (x, y) = iso::project(v, view);
        lo = (lo.0.min(x), lo.1.min(y));
        hi = (hi.0.max(x), hi.1.max(y));
    };
    let mut pad = MARGIN;
    match b.kind {
        BlockKind::Label => return true,
        BlockKind::Box => {
            let [x, y, z] = b.a;
            let [w, d, h] = b.b;
            for a in [0.0, w] {
                for c in [0.0, d] {
                    for e in [0.0, h] {
                        add([x + a, y + c, z + e]);
                    }
                }
            }
        }
        BlockKind::Line => {
            add(b.a);
            add(b.b);
        }
        BlockKind::Dot => {
            add(b.a);
            pad += b.size.abs();
        }
    }
    if !(lo.0.is_finite()
        && lo.1.is_finite()
        && hi.0.is_finite()
        && hi.1.is_finite()
        && pad.is_finite())
    {
        return true;
    }
    hi.0 + pad >= 0.0 && hi.1 + pad >= 0.0 && lo.0 - pad <= width && lo.1 - pad <= height
}
