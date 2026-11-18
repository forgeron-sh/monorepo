//! Rigs: the procedural parts of the site's `parts.ts` and `village.ts`, ported operation for
//! operation (same float64 operations in the same order, trig through `fg_math::num`) so that a
//! rig draws the blocks the TypeScript function pushes, bit for bit. A rig writes blocks in its
//! part's frame; the flattener places them like any prim's.

mod arm;
mod fan;
mod pendulum;
mod piston;
mod smoke;
mod sparks;
mod wheel;

use crate::block::{Block, BlockKind};
use crate::layout::code;
use crate::raster::Slot;
use fg_math::Vec3;

pub use arm::arm;
pub use fan::fan;
pub use pendulum::pendulum;
pub use piston::piston;
pub use smoke::smoke;
pub use sparks::sparks;
pub use wheel::{rim, wheel, WheelOptions};

pub const X: Vec3 = [1.0, 0.0, 0.0];
pub const Y: Vec3 = [0.0, 1.0, 0.0];
pub const Z: Vec3 = [0.0, 0.0, 1.0];

#[inline]
pub fn add(a: Vec3, b: Vec3) -> Vec3 {
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

#[inline]
pub fn sub(a: Vec3, b: Vec3) -> Vec3 {
    [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

#[inline]
pub fn mul(a: Vec3, k: f64) -> Vec3 {
    [a[0] * k, a[1] * k, a[2] * k]
}

/// `Math.hypot(a[0], a[1], a[2])`.
#[inline]
pub fn len(a: Vec3) -> f64 {
    fg_math::num::hypot(&a)
}

/// `seg` of parts.ts: a line, dashed when `dash` is not 0.
pub fn seg(out: &mut Vec<Block>, a: Vec3, b: Vec3, ink: u8) {
    let mut l = Block::new(BlockKind::Line);
    l.a = a;
    l.b = b;
    l.ink = ink;
    out.push(l);
}

/// `dot` of parts.ts.
pub fn dot(out: &mut Vec<Block>, at: Vec3, ink: u8, size: f64) {
    let mut d = Block::new(BlockKind::Dot);
    d.a = at;
    d.ink = ink;
    d.size = size;
    out.push(d);
}

/// `box` of parts.ts; `flags` are block flags (plate, ghost, accent).
pub fn boxed(out: &mut Vec<Block>, at: Vec3, size: Vec3, flags: u32) -> &mut Block {
    let mut b = Block::new(BlockKind::Box);
    b.a = at;
    b.b = size;
    b.flags = flags;
    out.push(b);
    out.last_mut().unwrap()
}

/// `block` of parts.ts: a box centred on `c` in x and y, standing on `c[2]`.
pub fn block(out: &mut Vec<Block>, c: Vec3, size: Vec3, flags: u32) {
    boxed(
        out,
        [c[0] - size[0] / 2.0, c[1] - size[1] / 2.0, c[2]],
        size,
        flags,
    );
}

/// The settings of one rig prim, read by name.
pub trait Settings {
    fn num(&self, name: &str) -> Option<f64>;
    fn vec(&self, name: &str) -> Option<Vec3>;
    fn ink(&self, name: &str) -> Option<u8>;
    fn name(&self, name: &str) -> Option<&str>;
}

/// A plane's two axes, by name: "xy", "yz", "xz" (and "x", "y" for a pendulum's swing).
fn axes(s: &dyn Settings, default: (Vec3, Vec3)) -> (Vec3, Vec3) {
    if let (Some(e1), Some(e2)) = (s.vec("e1"), s.vec("e2")) {
        return (e1, e2);
    }
    match s.name("plane") {
        Some("xy") => (X, Y),
        Some("yz") => (Y, Z),
        Some("xz") => (X, Z),
        _ => default,
    }
}

/// Draws rig `rig` (a `code::rig`) with its settings into `out`, in its part's frame.
pub fn draw(rig: i32, s: &dyn Settings, out: &mut Vec<Block>) {
    let zero = [0.0; 3];
    match rig {
        code::rig::WHEEL => {
            let (e1, e2) = axes(s, (X, Y));
            wheel(
                out,
                s.vec("c").unwrap_or(zero),
                s.num("r").unwrap_or(1.0),
                e1,
                e2,
                s.num("angle").unwrap_or(0.0),
                &WheelOptions {
                    teeth: s.num("teeth").unwrap_or(0.0),
                    spokes: s.num("spokes").unwrap_or(0.0),
                    hub: s.num("hub"),
                    ink: s.ink("ink").unwrap_or(Slot::INK),
                    tooth: s.num("tooth").unwrap_or(0.5),
                },
            );
        }
        code::rig::ARM => {
            arm(
                out,
                s.vec("base").unwrap_or(zero),
                s.vec("target").unwrap_or(zero),
                s.num("l1").unwrap_or(5.0),
                s.num("l2").unwrap_or(5.0),
                s.ink("ink").unwrap_or(Slot::INK),
            );
        }
        code::rig::FAN => fan(
            out,
            s.vec("c").unwrap_or(zero),
            s.num("r").unwrap_or(1.0),
            s.num("angle").unwrap_or(0.0),
        ),
        code::rig::PISTON => piston(
            out,
            s.vec("c").unwrap_or(zero),
            if s.name("axis") == Some("y") { Y } else { X },
            s.num("angle").unwrap_or(0.0),
            s.num("r").unwrap_or(1.2),
            s.num("rod").unwrap_or(4.0),
        ),
        code::rig::PENDULUM => {
            let e = match s.name("plane") {
                Some("y") | Some("yz") => Y,
                _ => X,
            };
            pendulum(
                out,
                s.vec("pivot").unwrap_or(zero),
                s.num("length").unwrap_or(1.0),
                e,
                s.num("angle").unwrap_or(0.0),
                s.ink("ink").unwrap_or(Slot::INK),
            );
        }
        code::rig::SMOKE => smoke(
            out,
            s.vec("top").unwrap_or(zero),
            s.num("t").unwrap_or(0.0),
            s.num("n").unwrap_or(0.0),
            s.num("seed").unwrap_or(0.0),
            s.num("rise").unwrap_or(9.0),
            s.num("thick").unwrap_or(1.0),
        ),
        code::rig::SPARKS => sparks(
            out,
            s.vec("at").unwrap_or(zero),
            s.num("t").unwrap_or(0.0),
            s.num("n").unwrap_or(0.0),
            s.num("seed").unwrap_or(0.0),
        ),
        _ => {}
    }
}
