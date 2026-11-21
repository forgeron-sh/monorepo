//! The WebAssembly entry points (feature "wasm"). Every call takes and returns numbers; bulk data
//! goes through pointers into linear memory (docs/blueprint/engine.md §3, "WASM API"). One module
//! serves every canvas of a page, one handle each; handles keep their buffers between frames.

use crate::paint::paint as paint_rgba;
use crate::render::Depth;
use crate::shade::Glow;
use crate::stage::Stage;
use fg_math::{Unit, View};
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

thread_local! {
    static STAGES: RefCell<Vec<Option<Box<Stage>>>> = const { RefCell::new(Vec::new()) };
    static ERROR: RefCell<String> = const { RefCell::new(String::new()) };
}

fn fail(message: String) -> u32 {
    ERROR.with(|e| *e.borrow_mut() = message);
    0
}

fn add(stage: Stage) -> u32 {
    STAGES.with(|s| {
        let mut s = s.borrow_mut();
        let slot = s.iter().position(Option::is_none).unwrap_or_else(|| {
            s.push(None);
            s.len() - 1
        });
        s[slot] = Some(Box::new(stage));
        slot as u32 + 1
    })
}

fn with<R>(handle: u32, default: R, f: impl FnOnce(&mut Stage) -> R) -> R {
    STAGES.with(|s| {
        let mut s = s.borrow_mut();
        match s
            .get_mut((handle as usize).wrapping_sub(1))
            .and_then(|x| x.as_deref_mut())
        {
            Some(stage) => f(stage),
            None => default,
        }
    })
}

/// # Safety
/// `ptr..ptr+len` must be a live allocation of this module (`alloc`).
unsafe fn bytes<'a>(ptr: usize, len: usize) -> &'a [u8] {
    if len == 0 {
        return &[];
    }
    unsafe { std::slice::from_raw_parts(ptr as *const u8, len) }
}

/// Room for `len` bytes (a SceneBin, a block list, a palette): free it with `dealloc`.
#[wasm_bindgen]
pub fn alloc(len: usize) -> usize {
    let mut v = vec![0u8; len.max(1)];
    let ptr = v.as_mut_ptr() as usize;
    std::mem::forget(v);
    ptr
}

#[wasm_bindgen]
pub fn dealloc(ptr: usize, len: usize) {
    if ptr != 0 {
        drop(unsafe { Vec::from_raw_parts(ptr as *mut u8, len.max(1), len.max(1)) });
    }
}

/// A handle for immediate mode only.
#[wasm_bindgen]
pub fn create() -> u32 {
    add(Stage::default())
}

/// Reads a SceneBin; 0 on error (`error_ptr`, `error_len`).
#[wasm_bindgen]
pub fn load(ptr: usize, len: usize) -> u32 {
    match Stage::load(unsafe { bytes(ptr, len) }) {
        Ok(stage) => add(stage),
        Err(e) => fail(e),
    }
}

#[wasm_bindgen]
pub fn error_ptr() -> usize {
    ERROR.with(|e| e.borrow().as_ptr() as usize)
}

#[wasm_bindgen]
pub fn error_len() -> usize {
    ERROR.with(|e| e.borrow().len())
}

/// Sizes the raster and fits a loaded scene: 1 when the buffer pointers moved, 2 on error.
#[wasm_bindgen]
pub fn resize(handle: u32, width: usize, height: usize) -> u32 {
    with(handle, 2, |s| match s.resize(width, height) {
        Ok(moved) => moved as u32,
        Err(e) => {
            fail(e);
            2
        }
    })
}

/// Fit options: `fill` NaN keeps the current one; `unit` 0 even, 1 any, other values keep it.
#[wasm_bindgen]
pub fn set_fit(handle: u32, fill: f64, unit: i32) {
    with(handle, (), |s| {
        if !fill.is_nan() {
            s.fit.fill = Some(fill);
        }
        match unit {
            0 => s.fit.unit = Unit::Even,
            1 => s.fit.unit = Unit::Any,
            _ => {}
        }
    })
}

/// Dither 0 (flat), 2, 4 or 8; glow radius 0 for none.
#[wasm_bindgen]
pub fn set_shading(handle: u32, dither: u32, glow_radius: f64, glow_density: f64) {
    with(handle, (), |s| {
        s.dither = if dither == 0 {
            None
        } else {
            Some(dither as usize)
        };
        s.glow = if glow_radius > 0.0 {
            Some(Glow {
                radius: glow_radius as i64,
                density: glow_density,
            })
        } else {
            None
        };
    })
}

#[wasm_bindgen]
pub fn set_labels(handle: u32, on: bool) {
    with(handle, (), |s| s.options.labels = on)
}

/// 0 painter, 1 z-buffer.
#[wasm_bindgen]
pub fn set_depth(handle: u32, mode: u32) {
    with(handle, (), |s| {
        s.options.depth = if mode == 1 {
            Depth::ZBuffer
        } else {
            Depth::Painter
        }
    })
}

#[wasm_bindgen]
pub fn set_view(handle: u32, u: f64, ox: f64, oy: f64) {
    with(handle, (), |s| s.view = View { u, ox, oy })
}

#[wasm_bindgen]
pub fn view_u(handle: u32) -> f64 {
    with(handle, f64::NAN, |s| s.view.u)
}

#[wasm_bindgen]
pub fn view_ox(handle: u32) -> f64 {
    with(handle, f64::NAN, |s| s.view.ox)
}

#[wasm_bindgen]
pub fn view_oy(handle: u32) -> f64 {
    with(handle, f64::NAN, |s| s.view.oy)
}

/// Sets entry `index` of a loaded scene's root scope (`t`, the vars, the root's params).
#[wasm_bindgen]
pub fn set_var(handle: u32, index: usize, value: f64) {
    with(handle, (), |s| s.set_var(index, value))
}

/// Fits the view on a packed block list.
#[wasm_bindgen]
pub fn fit_blocks(handle: u32, ptr: usize, len: usize) -> u32 {
    with(handle, 0, |s| {
        match s.fit_packed(unsafe { bytes(ptr, len) }) {
            Ok(()) => 1,
            Err(e) => fail(e),
        }
    })
}

/// The still picture of the loaded scene at its root scope as set (P2): 1 when drawn, 0 on error.
#[wasm_bindgen]
pub fn draw_scene(handle: u32) -> u32 {
    with(handle, 0, |s| match s.frame() {
        Ok(()) => 1,
        Err(e) => fail(e),
    })
}

/// **The** call of a frame (§3 "The frame"): reads the inputs block, runs vars, machines,
/// timelines, the raster (when anything changed), the RGBA (when a palette is set), writes the
/// outputs block. Returns the outputs' flags (`frame_flags`; `ERROR` on error).
#[wasm_bindgen]
pub fn frame(handle: u32) -> u32 {
    with(handle, crate::layout::frame_flags::ERROR, |s| {
        match s.step() {
            Ok(flags) => flags,
            Err(e) => {
                fail(e);
                crate::layout::frame_flags::ERROR
            }
        }
    })
}

/// The inputs block of a handle (f64 words): stable until `load`, `free` or a memory growth.
#[wasm_bindgen]
pub fn inputs_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.inputs.as_ptr() as usize)
}

#[wasm_bindgen]
pub fn inputs_len(handle: u32) -> usize {
    with(handle, 0, |s| s.inputs.len())
}

/// The outputs block of a handle (f64 words).
#[wasm_bindgen]
pub fn outputs_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.outputs.as_ptr() as usize)
}

#[wasm_bindgen]
pub fn outputs_len(handle: u32) -> usize {
    with(handle, 0, |s| s.outputs.len())
}

/// Room for `len` bytes of packed blocks (the script layer), returned as an address; the host
/// writes the list there and its length into `inputs.blocks`. Moves only when it grows.
#[wasm_bindgen]
pub fn block_buffer(handle: u32, len: usize) -> usize {
    with(handle, 0, |s| s.block_buffer(len))
}

/// Seven slots × RGB at `palette_ptr`: `frame` then paints RGBA (`rgba_ptr`). 0 bytes: no paint.
#[wasm_bindgen]
pub fn set_palette(handle: u32, palette_ptr: usize, len: usize) {
    let mut palette = [0u8; 21];
    let on = len >= 21;
    if on {
        palette.copy_from_slice(unsafe { bytes(palette_ptr, 21) });
    }
    with(handle, (), |s| {
        s.palette = on.then_some(palette);
        if on {
            let n = s.frame.width * s.frame.height * 4;
            s.rgba.resize(n, 0);
            crate::paint::paint(&s.frame.color, &palette, &mut s.rgba);
        }
    })
}

/// The RGBA `frame` paints (with `set_palette`).
#[wasm_bindgen]
pub fn rgba_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.rgba.as_ptr() as usize)
}

/// A frame of a packed block list on the current view: 1 when drawn, 0 on error.
#[wasm_bindgen]
pub fn immediate(handle: u32, ptr: usize, len: usize) -> u32 {
    with(handle, 0, |s| {
        match s.immediate(unsafe { bytes(ptr, len) }) {
            Ok(()) => 1,
            Err(e) => fail(e),
        }
    })
}

#[wasm_bindgen]
pub fn width(handle: u32) -> usize {
    with(handle, 0, |s| s.frame.width)
}

#[wasm_bindgen]
pub fn height(handle: u32) -> usize {
    with(handle, 0, |s| s.frame.height)
}

#[wasm_bindgen]
pub fn material_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.frame.material.as_ptr() as usize)
}

#[wasm_bindgen]
pub fn ink_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.frame.ink.as_ptr() as usize)
}

#[wasm_bindgen]
pub fn tone_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.frame.tone.as_ptr() as usize)
}

/// The palette slot of every pixel (u8): what the presenters read.
#[wasm_bindgen]
pub fn slots_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.frame.color.as_ptr() as usize)
}

/// The hover tag of every pixel (u16, a string index + 1; 0 = none).
#[wasm_bindgen]
pub fn tags_ptr(handle: u32) -> usize {
    with(handle, 0, |s| s.frame.tags.as_ptr() as usize)
}

/// RGBA of the last frame with `palette` (7 slots × RGB at `palette_ptr`); returns its pointer.
#[wasm_bindgen]
pub fn paint(handle: u32, palette_ptr: usize) -> usize {
    let mut palette = [0u8; 21];
    palette.copy_from_slice(unsafe { bytes(palette_ptr, 21) });
    with(handle, 0, |s| {
        paint_rgba(&s.frame.color, &palette, &mut s.rgba);
        s.rgba.as_ptr() as usize
    })
}

#[wasm_bindgen]
pub fn free(handle: u32) {
    STAGES.with(|s| {
        if let Some(slot) = s.borrow_mut().get_mut((handle as usize).wrapping_sub(1)) {
            *slot = None;
        }
    })
}

/// The debug and contract outputs (feature "debug"): built into the test module of
/// `packages/blueprint/wasm/debug/` only, never into the shipped one.
#[cfg(feature = "debug")]
mod debug {
    use super::*;
    use crate::block::Block;
    use crate::immediate::write_blocks;

    thread_local! {
        static OUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    }

    fn output(data: Vec<u8>) -> usize {
        OUT.with(|o| {
            let mut o = o.borrow_mut();
            *o = data;
            o.len()
        })
    }

    /// The output buffer of `describe` and `flat_blocks`.
    #[wasm_bindgen]
    pub fn out_ptr() -> usize {
        OUT.with(|o| o.borrow().as_ptr() as usize)
    }

    /// The tree of the loaded SceneBin as text (in the output buffer); returns its length.
    #[wasm_bindgen]
    pub fn describe(handle: u32) -> usize {
        let text = with(handle, String::new(), |s| {
            s.scene
                .as_ref()
                .map(|sc| sc.bin.describe())
                .unwrap_or_default()
        });
        output(text.into_bytes())
    }

    /// The SIMD kernels against the scalar code they replace (`fg_blueprint_raster::simd`):
    /// the number of cases that differ, or `u32::MAX` in a module built without SIMD.
    #[wasm_bindgen]
    pub fn simd_self_test() -> u32 {
        #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
        return fg_blueprint_raster::simd::self_test();
        #[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
        u32::MAX
    }

    /// The loaded scene's blocks, packed (in the output buffer); returns the length, 0 on error.
    #[wasm_bindgen]
    pub fn flat_blocks(handle: u32) -> usize {
        let packed: Result<Vec<u8>, String> = with(handle, Err("no such handle".into()), |s| {
            s.flat_blocks().map(|b: &[Block]| write_blocks(b))
        });
        match packed {
            Ok(p) => output(p),
            Err(e) => fail(e) as usize,
        }
    }
}
