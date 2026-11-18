//! JavaScript's number semantics where Rust's differ.

/// `Math.round`: halves go up (towards +∞), as ECMAScript says. Rust's `round` goes away from
/// zero (-2.5 → -3, JavaScript gives -2), and `(x + 0.5).floor()` is one ulp off for
/// 0.49999999999999994 (it gives 1). NaN and infinities pass through.
#[inline]
pub fn js_round(x: f64) -> f64 {
    let f = x.floor();
    if x - f >= 0.5 {
        f + 1.0
    } else {
        f
    }
}

/// `Math.min` of two numbers: NaN wins (Rust's `f64::min` ignores it).
#[inline]
pub fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

/// `Math.max` of two numbers: NaN wins.
#[inline]
pub fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b || (a == b && b.is_sign_negative()) {
        a
    } else {
        b
    }
}

/// `Math.sin`, as V8's fdlibm on the parity machine (`fdlibm.rs`).
#[inline]
pub fn sin(x: f64) -> f64 {
    crate::fdlibm::sin(x)
}

/// `Math.cos`, as V8's fdlibm on the parity machine (`fdlibm.rs`).
#[inline]
pub fn cos(x: f64) -> f64 {
    crate::fdlibm::cos(x)
}

/// `Math.atan2`, through fdlibm as V8.
#[inline]
pub fn atan2(y: f64, x: f64) -> f64 {
    libm::atan2(y, x)
}

/// `Math.pow`, through fdlibm (checked against V8 in the tests).
#[inline]
pub fn pow(x: f64, y: f64) -> f64 {
    libm::pow(x, y)
}

/// `Math.hypot` of any number of values, as V8 computes it: every value over the largest, their
/// squares summed with Kahan's compensation, then the root times the largest. Rust's `hypot`
/// (two values, another algorithm) can differ by an ulp.
pub fn hypot(values: &[f64]) -> f64 {
    let mut max = 0.0f64;
    let mut nan = false;
    for &v in values {
        if v.is_nan() {
            nan = true;
        } else if v.abs() > max {
            max = v.abs();
        }
    }
    if max == f64::INFINITY {
        return f64::INFINITY;
    }
    if nan {
        return f64::NAN;
    }
    if max == 0.0 {
        return 0.0;
    }
    let mut sum = 0.0f64;
    let mut compensation = 0.0f64;
    for &v in values {
        let n = v.abs() / max;
        let summand = n * n - compensation;
        let preliminary = sum + summand;
        compensation = (preliminary - sum) - summand;
        sum = preliminary;
    }
    sum.sqrt() * max
}

/// `x | 0`: ECMAScript's ToInt32 (truncate, then wrap modulo 2^32).
#[inline]
pub fn to_int32(x: f64) -> i32 {
    if !x.is_finite() {
        return 0;
    }
    let t = x.trunc();
    let m = t.rem_euclid(4294967296.0);
    (m as u64 as u32) as i32
}

/// The integer hash of the site's scenes (`hash` of `village.ts`): `Math.imul` and unsigned
/// shifts on ToInt32 of both inputs, mapped to [0, 1).
pub fn hash(x: f64, y: f64) -> f64 {
    let h = to_int32(x)
        .wrapping_mul(374761393)
        .wrapping_add(to_int32(y).wrapping_mul(668265263));
    let h = (h ^ ((h as u32 >> 13) as i32)).wrapping_mul(1274126177);
    ((h ^ ((h as u32 >> 16) as i32)) as u32) as f64 / 4294967296.0
}

/// JavaScript's truthiness of a number: neither 0 nor NaN.
#[inline]
pub fn truthy(x: f64) -> bool {
    x != 0.0 && !x.is_nan()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rounds_like_javascript() {
        assert_eq!(js_round(2.5), 3.0);
        assert_eq!(js_round(-2.5), -2.0);
        assert_eq!(js_round(-2.6), -3.0);
        assert_eq!(js_round(0.49999999999999994), 0.0);
        assert_eq!(js_round(4503599627370497.0), 4503599627370497.0);
        assert!(js_round(f64::NAN).is_nan());
    }

    #[test]
    fn min_and_max_propagate_nan() {
        assert!(js_min(1.0, f64::NAN).is_nan());
        assert!(js_max(f64::NAN, 1.0).is_nan());
        assert_eq!(js_min(1.0, 2.0), 1.0);
        assert_eq!(js_max(1.0, 2.0), 2.0);
        assert!(js_min(0.0, -0.0).is_sign_negative());
        assert!(js_max(-0.0, 0.0).is_sign_positive());
    }

    #[test]
    fn trig_is_fdlibm() {
        // Values V8 gives (node -p "Math.sin(1e10)" and friends).
        // Beyond 2^19·π/2 the reduction is not V8's: finite and bounded only.
        assert!(sin(1e10).abs() <= 1.0);
        assert_eq!(cos(1.0), 0.5403023058681398);
        assert_eq!(sin(core::f64::consts::PI), 1.2246467991473532e-16);
        assert_eq!(sin(5.510778793854958), -0.6978608827868472);
        assert_eq!(cos(123.456), -0.5947139710921574);
        // Where musl's kernels and reduction (the `libm` crate) are an ulp away from V8's.
        assert_eq!(sin(0.8377580409572781), 0.7431448254773942);
        assert_eq!(sin(0.36119282245635986), 0.3533903411461424);
        assert_eq!(sin(121.73984050750732), 0.7048934951080976);
        assert_eq!(sin(-2.3707155883312225), -0.6967646253049782);
        assert_eq!(cos(0.36119282245635986), 0.9354759573525196);
        assert_eq!(cos(121.73984050750732), -0.70931316113145);
        assert_eq!(cos(-2.3707155883312225), -0.7172998375321253);
        assert_eq!(atan2(-14.0, -2.5), -1.7475051828649333);
        assert_eq!(pow(0.6153846153846154, 0.75), 0.6948002659548387);
        assert_eq!(pow(0.3, 0.75), 0.4053600464421103);
    }

    #[test]
    fn hypot_is_v8s() {
        // node -p "Math.hypot(…)"
        assert_eq!(hypot(&[3.0, 4.0, 12.0]), 13.0);
        assert_eq!(hypot(&[0.1, 0.2, 0.3]), 0.37416573867739417);
        assert_eq!(hypot(&[1e-3, 2.5, -7.1]), 7.527283773048549);
        assert_eq!(hypot(&[0.6, 0.8]), 1.0);
        assert_eq!(hypot(&[-0.30000000000000004, 0.7]), 0.7615773105863908);
        assert_eq!(hypot(&[0.0, -0.0]), 0.0);
    }

    #[test]
    fn hash_is_the_sites() {
        // `hash` of village.ts under node.
        assert_eq!(hash(777.0, 3.0), 0.5329793943092227);
        assert_eq!(hash(-5.0, 104.0), 0.5038685505278409);
        assert_eq!(hash(3000000000.7, 2.0), 0.04937610658816993);
        assert_eq!(hash(840.0, 0.0), 0.5720976137090474);
        assert_eq!(to_int32(-1.5), -1);
        assert_eq!(to_int32(4294967297.0), 1);
    }
}
