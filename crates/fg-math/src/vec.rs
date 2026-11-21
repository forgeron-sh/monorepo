//! World vectors and quarter turns about +z.

pub type Vec3 = [f64; 3];

/// Quarter turns about +z, counter-clockwise seen from above: 0 to 3.
pub type Turn = u8;

/// `p` turned by `turn` quarter turns, as `rotate` of `format/flatten.ts`.
#[inline]
pub fn rotate(p: Vec3, turn: Turn) -> Vec3 {
    match turn & 3 {
        0 => p,
        1 => [-p[1], p[0], p[2]],
        2 => [-p[0], -p[1], p[2]],
        _ => [p[1], -p[0], p[2]],
    }
}

#[inline]
pub fn add(a: Vec3, b: Vec3) -> Vec3 {
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

#[inline]
pub fn scale(a: Vec3, s: f64) -> Vec3 {
    [a[0] * s, a[1] * s, a[2] * s]
}

/// -0 → 0, every other value unchanged (JSON cannot write -0).
#[inline]
pub fn no_neg_zero(x: f64) -> f64 {
    if x == 0.0 {
        0.0
    } else {
        x
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn four_quarter_turns_are_the_identity() {
        let p = [1.5, -2.0, 3.0];
        let mut q = p;
        for _ in 0..4 {
            q = rotate(q, 1);
        }
        assert_eq!(q, p);
        assert_eq!(rotate([1.0, 0.0, 0.0], 1), [-0.0, 1.0, 0.0]);
    }
}
