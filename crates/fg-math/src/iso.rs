//! Iso 2:1 projection and the fit of a scene on a raster, as `core/project.ts`.

use crate::num::{js_max, js_min, js_round};
use crate::vec::Vec3;

/// Placement of a scene on the raster: the unit in pixels and the screen origin.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct View {
    pub u: f64,
    pub ox: f64,
    pub oy: f64,
}

/// Iso 2:1: x runs down-right, y down-left, z up; one unit is `u` pixels across.
#[inline]
pub fn project(v: Vec3, view: &View) -> (f64, f64) {
    (
        view.ox + (v[0] - v[1]) * view.u,
        view.oy + ((v[0] + v[1]) * view.u) / 2.0 - v[2] * view.u,
    )
}

/// Depth of a point for the z-buffer: `x + y + z` grows towards the viewer of the 2:1 view.
#[inline]
pub fn depth(v: Vec3) -> f64 {
    v[0] + v[1] + v[2]
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum Unit {
    /// Keeps 2:1 edges regular (the default).
    #[default]
    Even,
    /// Any whole unit, for wide frames.
    Any,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct FitOptions {
    /// Share of the target the framed points may take (0.82 when absent).
    pub fill: Option<f64>,
    pub unit: Unit,
}

impl Default for FitOptions {
    fn default() -> Self {
        Self {
            fill: None,
            unit: Unit::Even,
        }
    }
}

/// The screen extent at `u = 1` of the framing points, accumulated in order.
#[derive(Clone, Copy, Debug)]
pub struct Bounds {
    min_x: f64,
    max_x: f64,
    min_y: f64,
    max_y: f64,
}

impl Default for Bounds {
    fn default() -> Self {
        Self {
            min_x: f64::INFINITY,
            max_x: f64::NEG_INFINITY,
            min_y: f64::INFINITY,
            max_y: f64::NEG_INFINITY,
        }
    }
}

impl Bounds {
    pub fn add(&mut self, v: Vec3) {
        let (px, py) = project(
            v,
            &View {
                u: 1.0,
                ox: 0.0,
                oy: 0.0,
            },
        );
        self.min_x = js_min(self.min_x, px);
        self.max_x = js_max(self.max_x, px);
        self.min_y = js_min(self.min_y, py);
        self.max_y = js_max(self.max_y, py);
    }
}

/// The largest unit (even by default, never below 2) that keeps `b` inside `fill` of a
/// `width` × `height` raster, centred.
pub fn fit(b: &Bounds, width: f64, height: f64, options: &FitOptions) -> View {
    if b.min_x == f64::INFINITY {
        return View {
            u: 2.0,
            ox: js_round(width / 2.0),
            oy: js_round(height / 2.0),
        };
    }
    let fill = options.fill.unwrap_or(0.82);
    let bw = js_max(b.max_x - b.min_x, 1e-9);
    let bh = js_max(b.max_y - b.min_y, 1e-9);
    let raw = js_min((width * fill) / bw, (height * fill) / bh);
    let u = match options.unit {
        Unit::Any => js_max(2.0, raw.floor()),
        Unit::Even => js_max(2.0, (raw / 2.0).floor() * 2.0),
    };
    View {
        u,
        ox: js_round(width / 2.0 - ((b.max_x + b.min_x) / 2.0) * u),
        oy: js_round(height / 2.0 - ((b.max_y + b.min_y) / 2.0) * u),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cube(n: f64) -> Bounds {
        let mut b = Bounds::default();
        for a in [0.0, n] {
            for c in [0.0, n] {
                for d in [0.0, n] {
                    b.add([a, c, d]);
                }
            }
        }
        b
    }

    #[test]
    fn projects_two_to_one() {
        let view = View {
            u: 4.0,
            ox: 10.0,
            oy: 20.0,
        };
        assert_eq!(project([0.0, 0.0, 0.0], &view), (10.0, 20.0));
        assert_eq!(project([1.0, 0.0, 0.0], &view), (14.0, 22.0));
        assert_eq!(project([0.0, 1.0, 0.0], &view), (6.0, 22.0));
        assert_eq!(project([0.0, 0.0, 1.0], &view), (10.0, 16.0));
    }

    #[test]
    fn picks_the_largest_even_unit_and_centres() {
        let b = cube(10.0);
        let view = fit(
            &b,
            200.0,
            100.0,
            &FitOptions {
                fill: Some(1.0),
                unit: Unit::Even,
            },
        );
        assert_eq!(view.u, 4.0);
        let top = project([0.0, 0.0, 10.0], &view);
        let bottom = project([10.0, 10.0, 0.0], &view);
        assert_eq!((top.1 + bottom.1) / 2.0, 50.0);
        let any = fit(
            &b,
            200.0,
            100.0,
            &FitOptions {
                fill: Some(1.0),
                unit: Unit::Any,
            },
        );
        assert_eq!(any.u, 5.0);
    }

    #[test]
    fn never_goes_below_two() {
        assert_eq!(fit(&cube(100.0), 50.0, 50.0, &FitOptions::default()).u, 2.0);
        let empty = fit(&Bounds::default(), 51.0, 40.0, &FitOptions::default());
        assert_eq!(
            empty,
            View {
                u: 2.0,
                ox: 26.0,
                oy: 20.0
            }
        );
    }
}
