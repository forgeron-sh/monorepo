//! The low-resolution raster: a frame of materials (`frame`), and the three ways of writing it,
//! ported line for line from `core/raster.ts` and `core/draw.ts`: pixels and lines (`line`),
//! convex faces sampled at pixel centres (`fill`), square dots (`dot`).

pub mod dot;
pub mod fill;
pub mod frame;
pub mod line;

pub use dot::dot;
pub use fill::{fill_convex, Plane};
pub use frame::{Frame, Material, Slot};
pub use line::{outline, plot, stroke};

/// A projected point and its depth (`x + y + z` of the world point, for the z-buffer).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Pt {
    pub x: f64,
    pub y: f64,
    pub d: f64,
}

impl Pt {
    #[inline]
    pub fn new(x: f64, y: f64, d: f64) -> Self {
        Self { x, y, d }
    }
}
