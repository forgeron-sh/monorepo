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
    merge_sort(out, |a, b| compare(a.0, a.1, b.0, b.1) == Ordering::Less);
}

/// A stable sort (`before(a, b)`: `a` goes strictly before `b`): the natural runs of `v` merged
/// two by two. On a consistent order every stable sort gives the same result as `sort_by` (and as
/// `Array.prototype.sort`); this one is a few hundred bytes of WebAssembly where the standard
/// library's sort is 6 KB (docs/blueprint/engine.md, "SIMD and size notes").
pub fn merge_sort<T: Copy>(v: &mut Vec<T>, before: impl Fn(&T, &T) -> bool) {
    let n = v.len();
    let mut runs: Vec<usize> = vec![0];
    for i in 1..n {
        if before(&v[i], &v[i - 1]) {
            runs.push(i);
        }
    }
    if runs.len() == 1 {
        return;
    }
    runs.push(n);
    let mut from = std::mem::take(v);
    let mut to: Vec<T> = Vec::with_capacity(n);
    while runs.len() > 2 {
        to.clear();
        let mut merged = vec![0];
        // Runs t and t + 1 (the last one alone when their number is odd).
        let mut t = 0;
        while t + 1 < runs.len() {
            let (a, b) = (runs[t], runs[t + 1]);
            let c = runs.get(t + 2).copied().unwrap_or(b);
            let (mut i, mut j) = (a, b);
            while i < b && j < c {
                if before(&from[j], &from[i]) {
                    to.push(from[j]);
                    j += 1;
                } else {
                    to.push(from[i]);
                    i += 1;
                }
            }
            to.extend_from_slice(&from[i..b]);
            to.extend_from_slice(&from[j..c]);
            merged.push(c);
            t += 2;
        }
        runs = merged;
        std::mem::swap(&mut from, &mut to);
    }
    *v = from;
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
    fn merge_sort_is_sort_by() {
        let mut seed = 0x853c_49e6_748f_ea9bu64;
        let mut next = move || {
            seed ^= seed << 13;
            seed ^= seed >> 7;
            seed ^= seed << 17;
            seed
        };
        for n in (0..70).chain([500, 1500]) {
            for shape in 0..4 {
                let mut v: Vec<(u64, usize)> = (0..n)
                    .map(|i| {
                        let key = match shape {
                            0 => next() % 7,
                            1 => i as u64 / 3,
                            2 => (n - i) as u64 / 2,
                            _ => (i as u64 % 13) * 3 + next() % 2,
                        };
                        (key, i)
                    })
                    .collect();
                let mut want = v.clone();
                want.sort_by(|a, b| a.0.cmp(&b.0));
                merge_sort(&mut v, |a, b| a.0 < b.0);
                assert_eq!(v, want, "{n} items, shape {shape}");
            }
        }
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
