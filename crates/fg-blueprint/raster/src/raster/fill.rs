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
    let mut y = min_y;
    while y <= max_y {
        let (from, to) = if spans {
            match span(pts, y, orient, min_x, max_x) {
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
            if spans || inside(pts, x, y) {
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
fn span(pts: &[Pt], y: f64, orient: f64, min_x: f64, max_x: f64) -> Option<(f64, f64)> {
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
    if inside(pts, l, y) {
        while l > min_x && inside(pts, l - 1.0, y) {
            l -= 1.0;
        }
    } else {
        loop {
            l += 1.0;
            if l > max_x {
                return None;
            }
            if inside(pts, l, y) {
                break;
            }
        }
    }
    let mut r = guess_r.max(l);
    if inside(pts, r, y) {
        while r < max_x && inside(pts, r + 1.0, y) {
            r += 1.0;
        }
    } else {
        while r > l && !inside(pts, r, y) {
            r -= 1.0;
        }
    }
    Some((l, r))
}
