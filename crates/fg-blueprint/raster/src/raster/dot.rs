//! A square dot of `n` pixels centred on a point (the `dot` case of `rasterize`).

use super::{plot, Frame, Material, Pt};

/// ECMAScript's ToInt32, for `n >> 1`.
#[inline]
pub fn to_int32(n: f64) -> i32 {
    if !n.is_finite() {
        return 0;
    }
    let t = n.trunc();
    (t.rem_euclid(4294967296.0) as u32) as i32
}

pub fn dot(f: &mut Frame, p: Pt, n: f64, ink: u8) {
    let half = (to_int32(n) >> 1) as f64;
    let mut i = 0.0;
    while i < n {
        let mut j = 0.0;
        while j < n {
            plot(
                f,
                p.x + i - half,
                p.y + j - half,
                Material::DOT,
                ink,
                1.0,
                p.d,
            );
            j += 1.0;
        }
        i += 1.0;
    }
}
