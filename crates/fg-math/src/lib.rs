//! The math the Rust crates share, ported from the TypeScript so that every float64 operation
//! happens in the same order: an exact pixel parity depends on it (docs/blueprint/engine.md, §4).

pub mod iso;
pub mod num;
pub mod vec;

pub use iso::{fit, project, Bounds, FitOptions, Unit, View};
pub use num::{js_max, js_min, js_round};
pub use vec::{Turn, Vec3};
