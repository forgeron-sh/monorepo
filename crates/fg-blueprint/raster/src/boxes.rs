//! A box: faces, then details (floors, vents), then edges, then the plate (`drawBox` of
//! `core/draw.ts`, operation for operation).

use crate::block::{flags, Block};
use crate::raster::{fill_convex, outline, plot, stroke, Frame, Material, Plane, Pt, Slot};
use fg_math::num::{cos, sin};
use fg_math::{iso, js_min, View};

/// Default face densities: a light top, a mid left, a dense right.
const TONE: [f64; 3] = [0.06, 0.2, 0.42];

/// Depth bias of lines and dots over faces in z-buffer mode (world units), as designed.
pub const LINE_BIAS: f64 = 0.05;

/// The bias lines and dots get at unit `u` against other blocks' faces: the designed 0.05, plus
/// what rounding a point to its pixel can cost against a face sampled there (half a pixel along
/// the steepest face gradient, 2.5/u per pixel). Against its own faces a block's lines always win.
#[inline]
pub fn line_bias(u: f64) -> f64 {
    LINE_BIAS + 1.25 / u
}

/// Points of a plate's ring.
const RING: usize = 48;

/// `(cos t, sin t)` of the ring's angles, `t = a / 48 · 2π` (cached in `Frame::ring`).
pub fn ring_angles() -> Vec<(f64, f64)> {
    (0..RING)
        .map(|a| {
            let t = (a as f64 / RING as f64) * std::f64::consts::PI * 2.0;
            (cos(t), sin(t))
        })
        .collect()
}

pub fn draw_box(f: &mut Frame, s: &Block, view: &View) {
    let [x, y, z] = s.a;
    let [w, d, h] = s.b;
    let v = |a: f64, b: f64, c: f64| -> Pt {
        let p = [x + a, y + b, z + c];
        let (px, py) = iso::project(p, view);
        Pt::new(px, py, iso::depth(p))
    };
    let top = [v(0.0, 0.0, h), v(w, 0.0, h), v(w, d, h), v(0.0, d, h)];
    let right = [v(w, 0.0, 0.0), v(w, d, 0.0), v(w, d, h), v(w, 0.0, h)];
    let left = [v(0.0, d, 0.0), v(w, d, 0.0), v(w, d, h), v(0.0, d, h)];
    let zb = !f.depth.is_empty();
    let line_bias = if zb { line_bias(view.u) } else { 0.0 };
    if s.has(flags::GHOST) {
        f.bias = line_bias;
        for face in [&top, &right, &left] {
            outline(f, face, Material::EDGE, Slot::DIM, 2.0);
        }
        return;
    }
    let (alert, signal, accent) = (
        s.has(flags::ALERT),
        s.has(flags::SIGNAL),
        s.has(flags::ACCENT),
    );
    let family = if alert {
        Some(Slot::ALERT)
    } else if signal {
        Some(Slot::SIGNAL)
    } else if accent {
        Some(Slot::ACCENT)
    } else {
        None
    };
    let edge = family.unwrap_or(Slot::INK);
    let fg = family.unwrap_or(Slot::DIM);
    let [tt, tl, tr] = if s.has(flags::HAS_TONE) { s.tone } else { TONE };
    f.bias = 0.0;
    let plane = |pts: &[Pt; 4]| {
        if zb {
            Some(Plane::through(pts[0], pts[1], pts[3]))
        } else {
            None
        }
    };
    fill_convex(f, &top, Material::FACE_TOP, fg, tt, plane(&top).as_ref());
    fill_convex(f, &left, Material::FACE_LEFT, fg, tl, plane(&left).as_ref());
    fill_convex(
        f,
        &right,
        Material::FACE_RIGHT,
        fg,
        tr,
        plane(&right).as_ref(),
    );
    f.bias = line_bias;
    let floors = s.floors;
    if floors != 0.0 && !floors.is_nan() {
        let mut k = floors;
        while k < h - 0.01 {
            stroke(f, v(0.0, d, k), v(w, d, k), Material::DETAIL, fg, 0.0);
            stroke(f, v(w, 0.0, k), v(w, d, k), Material::DETAIL, fg, 0.0);
            k += floors;
        }
    }
    if s.has(flags::VENTS) {
        let n = fg_math::js_max(2.0, (d * 0.6).floor());
        let mut k = 0.0;
        while k < n {
            let yy = d * 0.55 + (k * d * 0.4) / n;
            stroke(
                f,
                v(w, yy, h * 0.25),
                v(w, yy, h * 0.75),
                Material::DETAIL,
                Slot::DIM,
                0.0,
            );
            k += 1.0;
        }
    }
    for face in [&top, &right, &left] {
        outline(f, face, Material::EDGE, edge, 0.0);
    }
    if s.has(flags::PLATE) {
        let m = js_min(w, d) * 0.12;
        let inset = [
            v(m, m, h),
            v(w - m, m, h),
            v(w - m, d - m, h),
            v(m, d - m, h),
        ];
        outline(
            f,
            &inset,
            Material::DETAIL,
            if accent { Slot::ACCENT } else { Slot::FAINT },
            0.0,
        );
        for p in inset {
            plot(f, p.x, p.y, Material::DOT, Slot::INK, 1.0, p.d);
            plot(f, p.x + 1.0, p.y, Material::DOT, Slot::INK, 1.0, p.d);
        }
        let c = v(w / 2.0, d / 2.0, h);
        let rad = js_min(w, d) * 0.16 * view.u;
        let ring = if accent { Slot::ACCENT } else { Slot::INK };
        if f.ring.is_empty() {
            f.ring = ring_angles();
        }
        for a in 0..RING {
            let (ca, sa) = f.ring[a];
            plot(
                f,
                c.x + ca * rad,
                c.y + sa * rad * 0.5,
                Material::DETAIL,
                ring,
                1.0,
                c.d,
            );
        }
    }
}
