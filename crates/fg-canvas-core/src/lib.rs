//! fg-canvas-core: the hot paths of `@forgeron/canvas` (D-148) in Rust, for WebAssembly.
//!
//! The document of a scene (geometry, kind, z, flags), a spatial index, hit testing, box
//! selection, culling and the instance buffer the WebGL2 renderer draws. Bulk data crosses the
//! boundary through buffers in the module's memory (`staging`, `slots_in`, `out`, `instances`),
//! which JavaScript reads and writes as typed-array views: one call per operation, no copy.
//!
//! Strings (ids, kinds), item data, history and selection stay on the JavaScript side for now:
//! slots are `u32`, and the caller maps them to its ids.

pub mod grid;
pub mod scene;

use scene::{Scene, LOAD_STRIDE, STRIDE};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct CanvasCore {
    scene: Scene,
}

#[wasm_bindgen]
impl CanvasCore {
    /// A scene whose index cuts the world into cells of `cell` world units.
    #[wasm_bindgen(constructor)]
    pub fn new(cell: f32) -> CanvasCore {
        CanvasCore {
            scene: Scene::new(cell),
        }
    }

    pub fn len(&self) -> usize {
        self.scene.len()
    }

    pub fn is_empty(&self) -> bool {
        self.scene.is_empty()
    }

    /// Grows the load buffer to `n` items and returns its address (`LOAD_STRIDE` f32 each:
    /// x, y, w, h, kind, z). Views on memory are invalid after any call that may grow it.
    pub fn staging(&mut self, n: usize) -> *mut f32 {
        self.scene.staging.resize(n * LOAD_STRIDE, 0.0);
        self.scene.staging.as_mut_ptr()
    }

    /// Replaces the document with the `n` items of the load buffer: slots 0..n.
    pub fn load(&mut self, n: usize) {
        self.scene.load_staging(n);
        self.scene.staging = Vec::new();
    }

    #[allow(clippy::too_many_arguments)]
    pub fn add(&mut self, x: f32, y: f32, w: f32, h: f32, kind: u32, z: f32, flags: u32) -> u32 {
        self.scene.add(x, y, w, h, kind, z, flags)
    }

    pub fn remove(&mut self, slot: u32) -> bool {
        self.scene.remove(slot)
    }

    pub fn set_bounds(&mut self, slot: u32, x: f32, y: f32, w: f32, h: f32) -> bool {
        self.scene.set_bounds(slot, x, y, w, h)
    }

    pub fn set_z(&mut self, slot: u32, z: f32) -> bool {
        self.scene.set_z(slot, z)
    }

    pub fn set_flags(&mut self, slot: u32, flags: u32) -> bool {
        self.scene.set_flags(slot, flags)
    }

    /// Grows the slot buffer to `n` and returns its address (u32 each): the input of `move_many`.
    pub fn slots_in(&mut self, n: usize) -> *mut u32 {
        self.scene.slots_in.resize(n, 0);
        self.scene.slots_in.as_mut_ptr()
    }

    /// Moves the first `n` slots of the slot buffer by (dx, dy); locked items stay.
    pub fn move_many(&mut self, n: usize, dx: f32, dy: f32) -> usize {
        self.scene.move_many(n, dx, dy)
    }

    /// The top-most selectable item under a world point; `u32::MAX` for none.
    pub fn hit(&mut self, x: f32, y: f32) -> u32 {
        self.scene.hit(x, y)
    }

    /// Box selection into the output buffer; returns the count.
    pub fn in_rect(&mut self, x: f32, y: f32, w: f32, h: f32, contain: bool) -> usize {
        self.scene.in_rect(x, y, w, h, contain)
    }

    /// Culling into the output buffer, bottom first; returns the count.
    pub fn cull(&mut self, vx: f32, vy: f32, zoom: f32, sw: f32, sh: f32, margin: f32) -> usize {
        self.scene.cull(vx, vy, zoom, sw, sh, margin)
    }

    /// Culls and fills the instance buffer; returns the count of instances.
    pub fn frame(&mut self, vx: f32, vy: f32, zoom: f32, sw: f32, sh: f32, margin: f32) -> usize {
        self.scene.frame(vx, vy, zoom, sw, sh, margin)
    }

    /// The address of the output buffer (u32 slots) of the last query.
    pub fn out_ptr(&self) -> *const u32 {
        self.scene.out.as_ptr()
    }

    /// The address of the instance buffer (f32, `stride()` per instance) of the last frame.
    pub fn instances_ptr(&self) -> *const f32 {
        self.scene.instances.as_ptr()
    }

    pub fn stride() -> usize {
        STRIDE
    }

    /// Bytes the document and its index hold.
    pub fn bytes(&self) -> usize {
        self.scene.bytes()
    }

    /// Does nothing: measures the cost of one call across the boundary.
    pub fn noop(&self) -> u32 {
        0
    }
}
