//! Pixels and Bresenham lines (`plot`, `stroke`, `outline` of `core/raster.ts`).

use super::{Frame, Pt};
use fg_math::js_round;

/// Writes one pixel (rounded, clipped). Faces carry a tone; every other material passes 1.
#[inline]
pub fn plot(f: &mut Frame, x: f64, y: f64, material: u8, ink: u8, tone: f64, d: f64) {
    let px = js_round(x);
    let py = js_round(y);
    // Written so that NaN is clipped, as a typed array ignores a NaN index.
    if !(px >= 0.0 && py >= 0.0 && px < f.width as f64 && py < f.height as f64) {
        return;
    }
    let i = py as usize * f.width + px as usize;
    f.write(i, material, ink, tone, d);
}

/// `plot` of a whole pixel: rounding a whole number gives it back, so only the clip remains.
#[inline]
fn plot_px(f: &mut Frame, x: i64, y: i64, material: u8, ink: u8, d: f64) {
    if x < 0 || y < 0 || x >= f.width as i64 || y >= f.height as i64 {
        return;
    }
    let i = y as usize * f.width + x as usize;
    f.write(i, material, ink, 1.0, d);
}

/// Bresenham between two rounded points, walked from the upper end (so an edge shared by two
/// faces is the same pixels both times); `dash` alternates `dash` pixels drawn and skipped.
pub fn stroke(f: &mut Frame, a: Pt, b: Pt, material: u8, ink: u8, dash: f64) {
    let flip = js_round(a.y) > js_round(b.y) || (js_round(a.y) == js_round(b.y) && a.x > b.x);
    let (from, to) = if flip { (b, a) } else { (a, b) };
    let mut x0 = js_round(from.x) as i64;
    let mut y0 = js_round(from.y) as i64;
    let x1 = js_round(to.x) as i64;
    let y1 = js_round(to.y) as i64;
    let dx = (x1 - x0).abs();
    let dy = -(y1 - y0).abs();
    let sx = if x0 < x1 { 1 } else { -1 };
    let sy = if y0 < y1 { 1 } else { -1 };
    let mut err = dx + dy;
    let solid = dash == 0.0 || dash.is_nan();
    let steps = dx.max(-dy).max(1) as f64;
    let mut i: i64 = 0;
    loop {
        if solid || (i as f64 / dash).floor() % 2.0 == 0.0 {
            let d = if f.ztest {
                from.d + (to.d - from.d) * (i as f64 / steps)
            } else {
                0.0
            };
            plot_px(f, x0, y0, material, ink, d);
        }
        if x0 == x1 && y0 == y1 {
            break;
        }
        let e2 = 2 * err;
        if e2 >= dy {
            err += dy;
            x0 += sx;
        }
        if e2 <= dx {
            err += dx;
            y0 += sy;
        }
        i += 1;
    }
}

/// Closed outline of a polygon.
pub fn outline(f: &mut Frame, pts: &[Pt], material: u8, ink: u8, dash: f64) {
    for i in 0..pts.len() {
        stroke(f, pts[i], pts[(i + 1) % pts.len()], material, ink, dash);
    }
}
