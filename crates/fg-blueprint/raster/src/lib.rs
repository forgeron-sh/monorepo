//! Blueprint's hot path (docs/blueprint/engine.md §3, "The frame", steps 7–10): blocks into a
//! low-resolution frame of materials, painter's order or a depth buffer, labels placed around the
//! drawing, then shading and paint. A crate of its own so that it builds at `opt-level = 3`
//! while `fg-blueprint` (the reader, the scene, timelines, machines, rigs) builds for size; the
//! generated `layout.rs` and `font.rs` stay in `fg-blueprint/src/` and are included from there.

pub mod block;
pub mod boxes;
pub mod cull;
#[rustfmt::skip]
#[path = "../../src/font.rs"]
pub mod font;
pub mod labels;
#[rustfmt::skip]
#[path = "../../src/layout.rs"]
pub mod layout;
pub mod order;
pub mod paint;
pub mod raster;
pub mod render;
pub mod shade;
#[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
pub mod simd;

pub use block::{Block, BlockKind};
pub use raster::frame::{Frame, Material, Slot};
pub use render::{render_blocks, Depth, RenderOptions};
