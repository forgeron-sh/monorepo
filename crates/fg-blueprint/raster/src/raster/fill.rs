//! Convex faces sampled at pixel centres (`fillConvex` of `core/raster.ts`).

use super::{Frame, Pt};
use fg_math::{js_max, js_min};

/// Depth over a face as an affine function of the screen: `d = a·x + b·y + c`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Plane {
    pub a: f64,
    pub b: f64,
    pub c: f64,
}

impl Plane {
    /// The plane through three projected points; a face seen edge-on keeps their nearest depth.
    pub fn through(p0: Pt, p1: Pt, p2: Pt) -> Self {
        let (x1, y1, d1) = (p1.x - p0.x, p1.y - p0.y, p1.d - p0.d);
        let (x2, y2, d2) = (p2.x - p0.x, p2.y - p0.y, p2.d - p0.d);
        let det = x1 * y2 - x2 * y1;
        if det == 0.0 || !det.is_finite() {
            return Self {
                a: 0.0,
                b: 0.0,
                c: p0.d.max(p1.d).max(p2.d),
            };
        }
        let a = (d1 * y2 - d2 * y1) / det;
        let b = (x1 * d2 - x2 * d1) / det;
        Self {
            a,
            b,
            c: p0.d - a * p0.x - b * p0.y,
        }
    }

    #[inline]
    pub fn at(&self, x: f64, y: f64) -> f64 {
        self.a * x + self.b * y + self.c
    }
}

/// The inside test of `fillConvex` at the pixel centre `(x + 0.5, y + 0.5)`: every edge's cross
/// product that is not zero has the same sign.
#[inline]
fn inside(pts: &[Pt], x: f64, y: f64) -> bool {
    let n = pts.len();
    let mut sign = 0i8;
    for i in 0..n {
        let p = pts[i];
        let q = pts[if i + 1 == n { 0 } else { i + 1 }];
        let cross = (q.x - p.x) * (y + 0.5 - p.y) - (q.y - p.y) * (x + 0.5 - p.x);
        if cross == 0.0 {
            continue;
        }
        let s = if cross > 0.0 { 1 } else { -1 };
        if sign == 0 {
            sign = s;
        } else if s != sign {
            return false;
        }
    }
    true
}

/// The inside test of one row, `inside(pts, x, y)` at a fixed `y`: a quad's, or any polygon's.
enum RowTest<'a> {
    Quad(Quad),
    Polygon(&'a [Pt], f64),
}

impl RowTest<'_> {
    #[inline]
    fn inside(&self, x: f64) -> bool {
        match self {
            RowTest::Quad(q) => q.inside(x),
            RowTest::Polygon(pts, y) => inside(pts, x, *y),
        }
    }
}

/// A quad (every face of a box) along one row: edge `i`'s cross product is
/// `a[i] − b[i]·(x + 0.5 − px[i])`, `inside`'s expression with the factors that do not depend on
/// `x` computed once per row. The same operations on the same operands: the same bits.
struct Quad {
    a: [f64; 4],
    b: [f64; 4],
    px: [f64; 4],
}

impl Quad {
    #[inline]
    fn new(pts: &[Pt; 4], y: f64) -> Self {
        let mut q = Self {
            a: [0.0; 4],
            b: [0.0; 4],
            px: [0.0; 4],
        };
        for i in 0..4 {
            let (p, n) = (pts[i], pts[(i + 1) & 3]);
            q.a[i] = (n.x - p.x) * (y + 0.5 - p.y);
            q.b[i] = n.y - p.y;
            q.px[i] = p.x;
        }
        q
    }
}

impl Quad {
    /// `inside`, without branches: it fails exactly when one cross product is positive and
    /// another is neither positive nor zero (negative, or NaN, which `inside` counts as negative).
    /// With SIMD, two edges a lane (IEEE operations lane by lane: the same bits).
    #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
    #[inline]
    fn inside(&self, x: f64) -> bool {
        use core::arch::wasm32::*;
        let at = |v: &[f64; 4], i: usize| f64x2(v[i], v[i + 1]);
        let xc = f64x2_splat(x + 0.5);
        let zero = f64x2_splat(0.0);
        let (mut pos, mut neg) = (zero, zero);
        for i in [0, 2] {
            let d = f64x2_sub(xc, at(&self.px, i));
            let cross = f64x2_sub(at(&self.a, i), f64x2_mul(at(&self.b, i), d));
            let positive = f64x2_gt(cross, zero);
            pos = v128_or(pos, positive);
            neg = v128_or(neg, v128_andnot(f64x2_ne(cross, zero), positive));
        }
        !(v128_any_true(pos) & v128_any_true(neg))
    }

    #[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
    #[inline]
    fn inside(&self, x: f64) -> bool {
        let (mut pos, mut neg) = (false, false);
        for i in 0..4 {
            let cross = self.a[i] - self.b[i] * (x + 0.5 - self.px[i]);
            let positive = cross > 0.0;
            pos |= positive;
            neg |= !positive & (cross != 0.0);
        }
        !(pos & neg)
    }
}

/// Twice the signed area of a polygon.
fn area2(pts: &[Pt]) -> f64 {
    let n = pts.len();
    (0..n)
        .map(|i| {
            let (p, q) = (pts[i], pts[(i + 1) % n]);
            p.x * q.y - q.x * p.y
        })
        .sum()
}

/// Fills a convex polygon: every pixel whose centre is inside (or on an edge) gets the material,
/// the colour family and the tone, as `fillConvex`.
///
/// The test is `fillConvex`'s, pixel for pixel, but only where a row's span begins and ends:
/// each edge's cross product is a monotone function of x (float operations are monotone), so on
/// a polygon with an area the pixels that pass form one run per row, found by testing from an
/// estimate of its ends. A polygon without area (an edge-on face) is tested pixel by pixel.
pub fn fill_convex(
    f: &mut Frame,
    pts: &[Pt],
    material: u8,
    ink: u8,
    tone: f64,
    plane: Option<&Plane>,
) {
    let mut lo_x = f64::INFINITY;
    let mut hi_x = f64::NEG_INFINITY;
    let mut lo_y = f64::INFINITY;
    let mut hi_y = f64::NEG_INFINITY;
    for p in pts {
        lo_x = js_min(lo_x, p.x);
        hi_x = js_max(hi_x, p.x);
        lo_y = js_min(lo_y, p.y);
        hi_y = js_max(hi_y, p.y);
    }
    let min_x = js_max(0.0, lo_x.floor());
    let max_x = js_min(f.width as f64 - 1.0, hi_x.ceil());
    let min_y = js_max(0.0, lo_y.floor());
    let max_y = js_min(f.height as f64 - 1.0, hi_y.ceil());
    if !(min_x <= max_x && min_y <= max_y) {
        return;
    }
    let a2 = area2(pts);
    let spans = pts.len() >= 3 && a2.is_finite() && a2.abs() >= 2.0;
    let orient = if a2 > 0.0 { 1.0 } else { -1.0 };
    let rows = Rows {
        min_x,
        max_x,
        min_y,
        max_y,
        spans,
        orient,
    };
    let pen = (material, ink, tone);
    let quad = <&[Pt; 4]>::try_from(pts).ok();
    fill_rows(f, pts, &rows, pen, plane, |y| match quad {
        Some(q) => RowTest::Quad(Quad::new(q, y)),
        None => RowTest::Polygon(pts, y),
    });
}

/// The rows a polygon covers in the frame, and how to find their pixels.
#[derive(Clone, Copy)]
struct Rows {
    min_x: f64,
    max_x: f64,
    min_y: f64,
    max_y: f64,
    /// One run per row (the polygon has an area), else a test per pixel.
    spans: bool,
    orient: f64,
}

fn fill_rows<'a>(
    f: &mut Frame,
    pts: &[Pt],
    rows: &Rows,
    (material, ink, tone): (u8, u8, f64),
    plane: Option<&Plane>,
    row_test: impl Fn(f64) -> RowTest<'a>,
) {
    let Rows {
        min_x,
        max_x,
        min_y,
        max_y,
        spans,
        orient,
    } = *rows;
    let mut y = min_y;
    while y <= max_y {
        let test = row_test(y);
        let (from, to) = if spans {
            match span(pts, &test, y, orient, min_x, max_x) {
                Some(r) => r,
                None => {
                    y += 1.0;
                    continue;
                }
            }
        } else {
            (min_x, max_x)
        };
        let row = y as usize * f.width;
        if spans && !f.ztest {
            f.write_run(
                row + from as usize,
                row + to as usize + 1,
                material,
                ink,
                tone,
            );
            y += 1.0;
            continue;
        }
        let mut x = from;
        while x <= to {
            if spans || test.inside(x) {
                let d = match plane {
                    // At the pixel's own point, as `plot` rounds a line's points to it.
                    Some(p) if f.ztest => p.at(x, y),
                    _ => 0.0,
                };
                f.write(row + x as usize, material, ink, tone, d);
            }
            x += 1.0;
        }
        y += 1.0;
    }
}

/// The run of pixels of row `y` (within `min_x..=max_x`) that pass the inside test, if any.
fn span(
    pts: &[Pt],
    test: &RowTest,
    y: f64,
    orient: f64,
    min_x: f64,
    max_x: f64,
) -> Option<(f64, f64)> {
    // Estimate: the intersection of the edges' half-planes along the row, in pixel x.
    let n = pts.len();
    let (mut lo, mut hi) = (f64::NEG_INFINITY, f64::INFINITY);
    for i in 0..n {
        let p = pts[i];
        let q = pts[if i + 1 == n { 0 } else { i + 1 }];
        let a = (q.x - p.x) * (y + 0.5 - p.y);
        let b = q.y - p.y;
        if b == 0.0 {
            if a * orient < 0.0 {
                // Outside this edge on the whole row (to rounding): check its ends only.
                lo = f64::INFINITY;
            }
            continue;
        }
        // Inside, cross = a - b·(x + 0.5 - p.x) has the sign of `orient`: x ≤ p.x + a/b - 0.5
        // when b and orient agree, x ≥ it otherwise.
        let at = p.x + a / b - 0.5;
        if b * orient > 0.0 {
            hi = hi.min(at);
        } else {
            lo = lo.max(at);
        }
    }
    let clamp = |x: f64| x.max(min_x).min(max_x);
    let guess_l = if lo.is_finite() {
        clamp(lo.ceil() - 2.0)
    } else {
        min_x
    };
    let guess_r = if hi.is_finite() {
        clamp(hi.floor() + 2.0)
    } else {
        max_x
    };
    let (guess_l, guess_r) = if lo > hi {
        (min_x, max_x)
    } else {
        (guess_l, guess_r)
    };
    // The left end: from the guess, outwards while inside, else inwards until inside.
    let mut l = guess_l;
    if test.inside(l) {
        while l > min_x && test.inside(l - 1.0) {
            l -= 1.0;
        }
    } else {
        loop {
            l += 1.0;
            if l > max_x {
                return None;
            }
            if test.inside(l) {
                break;
            }
        }
    }
    let mut r = guess_r.max(l);
    if test.inside(r) {
        while r < max_x && test.inside(r + 1.0) {
            r += 1.0;
        }
    } else {
        while r > l && !test.inside(r) {
            r -= 1.0;
        }
    }
    Some((l, r))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A small deterministic generator (xorshift).
    fn rng(seed: &mut u64) -> f64 {
        *seed ^= *seed << 13;
        *seed ^= *seed >> 7;
        *seed ^= *seed << 17;
        (*seed >> 11) as f64 / (1u64 << 53) as f64
    }

    #[test]
    fn quad_rows_test_as_inside() {
        let mut seed = 0x9e37_79b9_7f4a_7c15;
        let specials = [0.0, -0.0, 0.5, f64::NAN, f64::INFINITY, 1e-300, 3.0];
        for k in 0..20_000u32 {
            let mut v = |i: usize| {
                if k.is_multiple_of(7) && i.is_multiple_of(3) {
                    specials[(rng(&mut seed) * specials.len() as f64) as usize]
                } else if k.is_multiple_of(3) {
                    (rng(&mut seed) * 16.0).floor() * 0.5
                } else {
                    rng(&mut seed) * 40.0 - 10.0
                }
            };
            let q: [Pt; 4] = std::array::from_fn(|i| Pt::new(v(2 * i), v(2 * i + 1), 0.0));
            for y in 0..20 {
                let y = y as f64 - 2.0;
                let quad = Quad::new(&q, y);
                for x in -2..22 {
                    let x = x as f64;
                    assert_eq!(quad.inside(x), inside(&q, x, y), "{q:?} at {x}, {y}");
                }
            }
        }
    }
}
