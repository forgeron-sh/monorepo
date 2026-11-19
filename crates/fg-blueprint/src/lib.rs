//! Blueprint's scene engine (docs/blueprint/engine.md §3): frames from a packed block list
//! (immediate mode, the script layer) or from a SceneBin (a resolved `.bp.json` scene with its
//! vars, timelines, machines and rigs), rasterised exactly as the former TypeScript renderer
//! did (its frames frozen in `packages/blueprint/test/parity/golden.json`). The raster itself
//! is `fg-blueprint-raster` (`raster/`), re-exported here under its old paths.

pub mod bin;
pub mod immediate;
pub mod machine;
pub mod rigs;
pub mod scene;
pub mod stage;
pub mod timeline;
pub mod tracks;
pub mod vars;
#[cfg(feature = "wasm")]
pub mod wasm;

pub use fg_blueprint_raster::{
    block, boxes, cull, font, labels, layout, order, paint, raster, render, shade,
};
pub use fg_blueprint_raster::{
    render_blocks, Block, BlockKind, Depth, Frame, Material, RenderOptions, Slot,
};
