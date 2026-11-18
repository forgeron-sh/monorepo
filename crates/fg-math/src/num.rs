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

/// `Math.sin`, through fdlibm as V8.
#[inline]
pub fn sin(x: f64) -> f64 {
    libm::sin(x)
}

/// `Math.cos`, through fdlibm as V8.
#[inline]
pub fn cos(x: f64) -> f64 {
    libm::cos(x)
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
        assert_eq!(sin(1e10), -0.4875060250875107);
        assert_eq!(cos(1.0), 0.5403023058681398);
        assert_eq!(sin(core::f64::consts::PI), 1.2246467991473532e-16);
    }
}
