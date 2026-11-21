//! The ash of village.ts: the first `n` of 140 grey specks scattered over the island.

use super::dot;
use crate::block::Block;
use crate::raster::Slot;
use fg_math::num::hash;

pub fn ash(out: &mut Vec<Block>, n: f64) {
    let mut k = 0.0;
    while k < n {
        dot(
            out,
            [
                (hash(k, 501.0) - 0.5) * 68.0,
                (hash(k, 502.0) - 0.5) * 68.0,
                0.05,
            ],
            if k % 4.0 == 0.0 { Slot::INK } else { Slot::DIM },
            1.0,
        );
        k += 1.0;
    }
}
