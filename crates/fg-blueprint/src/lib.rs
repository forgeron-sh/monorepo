//! Blueprint's scene engine (docs/blueprint/engine.md §3). P2: still frames, from a packed block
//! list (immediate mode) or from a SceneBin (a resolved `.bp.json` scene), rasterised exactly as
//! the TypeScript renderer of `packages/blueprint/test/reference/` does.

pub mod bin;
pub mod block;
pub mod boxes;
pub mod cull;
#[rustfmt::skip]
pub mod font;
pub mod immediate;
pub mod labels;
#[rustfmt::skip]
pub mod layout;
pub mod order;
pub mod paint;
pub mod raster;
pub mod render;
pub mod scene;
pub mod shade;
pub mod stage;
#[cfg(feature = "wasm")]
pub mod wasm;

pub use block::{Block, BlockKind};
pub use raster::frame::{Frame, Material, Slot};
pub use render::{render_blocks, Depth, RenderOptions};
