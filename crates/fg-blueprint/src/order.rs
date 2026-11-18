//! Painter's order (`rasterize` of `core/draw.ts`): by layer, then by the painter's key, with a
//! stable sort and the same comparator.

use crate::block::{Block, BlockKind};
use std::cmp::Ordering;

/// The painter's key: further blocks first; lines lying on the floor go under everything else.
#[inline]
pub fn depth_key(b: &Block) -> f64 {
    match b.kind {
        BlockKind::Box => b.a[0] + b.b[0] + b.a[1] + b.b[1] + b.a[2] * 0.5,
        BlockKind::Line => {
            let floor = if b.a[2] == 0.0 && b.b[2] == 0.0 {
                1.0
            } else {
                0.0
            };
            fg_math::js_min(b.a[0] + b.a[1], b.b[0] + b.b[1]) - 1000.0 * floor
        }
        _ => b.a[0] + b.a[1] + b.a[2] * 0.5,
    }
}

/// `layer(a) - layer(b) || depth(a) - depth(b)` as an ordering: 0, -0 and NaN fall through to
/// the depth, and a NaN result counts as equal (as `Array.prototype.sort` does).
#[inline]
fn compare(la: f64, da: f64, lb: f64, db: f64) -> Ordering {
    let by_layer = la - lb;
    let r = if by_layer != 0.0 && !by_layer.is_nan() {
        by_layer
    } else {
        da - db
    };
    if r < 0.0 {
        Ordering::Less
    } else if r > 0.0 {
        Ordering::Greater
    } else {
        Ordering::Equal
    }
}

/// Indices of `blocks` (those `keep` accepts) in painter's order.
pub fn painter_order(
    blocks: &[Block],
    keep: impl Fn(&Block) -> bool,
    out: &mut Vec<(f64, f64, u32)>,
) {
    out.clear();
    for (i, b) in blocks.iter().enumerate() {
        if keep(b) {
            out.push((b.layer, depth_key(b), i as u32));
        }
    }
    out.sort_by(|a, b| compare(a.0, a.1, b.0, b.1));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sorts_by_layer_then_depth_stably() {
        let mut blocks = Vec::new();
        for (layer, x) in [(0.0, 5.0), (1.0, 0.0), (0.0, 1.0), (0.0, 5.0), (-1.0, 9.0)] {
            let mut b = Block::new(BlockKind::Dot);
            b.layer = layer;
            b.a = [x, 0.0, 0.0];
            blocks.push(b);
        }
        let mut order = Vec::new();
        painter_order(&blocks, |_| true, &mut order);
        let idx: Vec<u32> = order.iter().map(|o| o.2).collect();
        assert_eq!(idx, vec![4, 2, 0, 3, 1]);
    }

    #[test]
    fn floor_lines_go_under() {
        let mut floor = Block::new(BlockKind::Line);
        floor.a = [10.0, 10.0, 0.0];
        floor.b = [20.0, 10.0, 0.0];
        let mut raised = floor.clone();
        raised.a[2] = 1.0;
        assert_eq!(depth_key(&floor), 20.0 - 1000.0);
        assert_eq!(depth_key(&raised), 20.0);
    }
}
