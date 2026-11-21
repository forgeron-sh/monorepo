//! What a handle keeps between calls: the frame and its scratch buffers, the view, the shading,
//! the inputs and outputs blocks of `frame`, and, for a scene loaded from a SceneBin, the scene,
//! its root scope and its animation. The raster's buffers keep their size between frames.

use crate::bin::{self, SceneBin};
use crate::block::{flags, Block, BlockKind};
use crate::immediate::read_blocks;
use crate::layout::code;
use crate::layout::{frame_flags as F, inputs as I, outputs as O, MAX_EVENTS};
use crate::machine::Events;
use crate::paint::paint;
use crate::raster::Frame;
use crate::render::{render_blocks, Depth, RenderOptions};
use crate::scene::Flattener;
use crate::shade::{shade, Glow};
use crate::timeline::Animator;
use crate::tracks::Overrides;
use fg_math::{fit, Bounds, FitOptions, Unit, View};

pub struct SceneState {
    pub bin: SceneBin,
    /// The root scope's defaults.
    pub defaults: Vec<f64>,
    /// The root scope: `t`, the vars, the root's params.
    pub vars: Vec<f64>,
    pub anim: Animator,
    /// What the last drawn frame was made of: a frame that changes none of it is not drawn.
    drawn_vars: Vec<f64>,
    drawn_over: Overrides,
    /// Whether the root's instances read `t` (slot 0) directly; when not, the time alone never
    /// changes the picture (the tracks it drives do, through `Overrides`).
    uses_t: bool,
    pub dirty: bool,
}

/// Whether a root scope reference reads slot 0 (`t`) in the root's instances or conveyors.
fn reads_time(bin: &SceneBin) -> bool {
    let num = |i: usize| {
        bin.nums
            .get(i)
            .is_some_and(|n| n.kind != code::num::LITERAL && n.a == 0.0)
    };
    let flag = |f: &bin::Flag| f.kind != code::flag::VALUE && f.a == 0.0;
    let args = |r: std::ops::Range<usize>| {
        bin.args[r].iter().any(|a| {
            if a.kind == code::arg::FLAG {
                flag(&a.flag)
            } else {
                num(a.num)
            }
        })
    };
    let root = &bin.defs[bin.scene.root];
    !root.prims.is_empty()
        || bin.instances[root.instances.clone()].iter().any(|i| {
            i.at.is_some_and(|a| num(a) || num(a + 1) || num(a + 2))
                || i.visible.as_ref().is_some_and(flag)
                || args(i.args.clone())
        })
        || bin
            .tracks
            .iter()
            .any(|t| t.kind == code::track::CONVEYOR && args(t.args.clone()))
}

pub struct Stage {
    pub frame: Frame,
    pub view: View,
    pub fit: FitOptions,
    pub options: RenderOptions,
    pub dither: Option<usize>,
    pub glow: Option<Glow>,
    pub blocks: Vec<Block>,
    pub scratch: Vec<(f64, f64, u32)>,
    pub rgba: Vec<u8>,
    pub scene: Option<SceneState>,
    /// The inputs block (`layout::inputs`, then a host value per root scope slot).
    pub inputs: Vec<f64>,
    /// The outputs block (`layout::outputs`, then the root scope, then each machine's state).
    pub outputs: Vec<f64>,
    /// The script layer's packed block list, written by the host (`inputs.blocks` bytes); words,
    /// so that the host can write it through a `Float64Array`.
    pub block_buf: Vec<f64>,
    script: Vec<Block>,
    /// The palette `frame` paints RGBA with, when the host gave one (the 2D presenter).
    pub palette: Option<[u8; 21]>,
    events: Events,
    hover: u16,
    frames: f64,
    /// How many of `blocks` the scene flattened to; the script layer's follow.
    scene_len: usize,
}

impl Default for Stage {
    fn default() -> Self {
        Self {
            frame: Frame::new(0, 0),
            view: View {
                u: 2.0,
                ox: 0.0,
                oy: 0.0,
            },
            fit: FitOptions::default(),
            options: RenderOptions::default(),
            dither: Some(4),
            glow: None,
            blocks: Vec::new(),
            scratch: Vec::new(),
            rgba: Vec::new(),
            scene: None,
            inputs: vec![0.0; I::WORDS],
            outputs: vec![0.0; O::WORDS],
            block_buf: Vec::new(),
            script: Vec::new(),
            palette: None,
            events: Events::default(),
            hover: 0,
            frames: 0.0,
            scene_len: 0,
        }
    }
}

/// The screen bounds of the blocks that frame a scene (all but `decor`), at `u = 1`.
pub fn framing(blocks: &[Block]) -> Bounds {
    let mut b = Bounds::default();
    for block in blocks.iter().filter(|b| !b.has(flags::DECOR)) {
        match block.kind {
            BlockKind::Box => {
                let [x, y, z] = block.a;
                let [w, d, h] = block.b;
                for a in [0.0, w] {
                    for c in [0.0, d] {
                        for e in [0.0, h] {
                            b.add([x + a, y + c, z + e]);
                        }
                    }
                }
            }
            BlockKind::Line => {
                b.add(block.a);
                b.add(block.b);
            }
            _ => b.add(block.a),
        }
    }
    b
}

impl Stage {
    /// A stage for a SceneBin: its depth mode, labels, shading and fit from the scene record.
    pub fn load(bytes: &[u8]) -> Result<Self, String> {
        let bin = bin::read(bytes)?;
        let s = &bin.scene;
        let mut stage = Stage::default();
        stage.options.depth = if s.depth == code::depth::ZBUFFER {
            Depth::ZBuffer
        } else {
            Depth::Painter
        };
        stage.options.labels = s.labels.unwrap_or(true);
        stage.fit = FitOptions {
            fill: s.fill,
            unit: if s.unit == code::unit::ANY {
                Unit::Any
            } else {
                Unit::Even
            },
        };
        stage.dither = match s.dither {
            -1 => Some(4),
            0 => None,
            n => Some(n as usize),
        };
        stage.glow = s.glow_radius.map(|r| Glow {
            radius: fg_math::js_max(1.0, fg_math::js_round(r)) as i64,
            density: s.glow_density.unwrap_or(0.35).clamp(0.0, 1.0),
        });
        let defaults = bin.root_defaults();
        let n = defaults.len();
        let anim = Animator::new(&bin, n);
        stage.inputs = vec![0.0; I::WORDS + n];
        stage.inputs[I::WORDS..].fill(f64::NAN);
        stage.outputs = vec![0.0; O::WORDS + n + bin.machines.len()];
        let drawn_over = anim.over.clone();
        let uses_t = reads_time(&bin);
        stage.scene = Some(SceneState {
            uses_t,
            bin,
            vars: defaults.clone(),
            defaults,
            anim,
            drawn_vars: Vec::new(),
            drawn_over,
            dirty: true,
        });
        Ok(stage)
    }

    /// Flattens the loaded scene into `blocks` when its inputs changed.
    fn flatten(&mut self) -> Result<(), String> {
        let Some(scene) = &mut self.scene else {
            return Ok(());
        };
        if scene.dirty {
            Flattener::with(&scene.bin, &scene.anim.over).flatten(&scene.vars, &mut self.blocks)?;
            self.scene_len = self.blocks.len();
            scene.dirty = false;
        }
        Ok(())
    }

    /// Sizes the raster; a loaded scene is fitted again, on its picture at time 0 with the
    /// host's current values (as `frameView` frames a scene function at `t = 0`).
    pub fn resize(&mut self, width: usize, height: usize) -> Result<bool, String> {
        let before = (
            self.frame.material.as_ptr(),
            self.frame.color.as_ptr(),
            self.frame.tags.as_ptr(),
        );
        let zb = self.options.depth == Depth::ZBuffer;
        self.frame.reset(width, height, zb);
        if let Some(scene) = &mut self.scene {
            let mut probe = scene.anim.clone();
            probe.reset(&scene.bin);
            let mut scope = Vec::new();
            probe.step(
                &scene.bin,
                &scene.defaults,
                &mut scope,
                0.0,
                0.0,
                &Events::default(),
            );
            Flattener::with(&scene.bin, &probe.over).flatten(&scope, &mut self.blocks)?;
            scene.dirty = true;
            scene.drawn_vars.clear();
            self.fit_view();
        }
        if self.palette.is_some() {
            self.rgba.resize(width * height * 4, 0);
        }
        Ok(before
            != (
                self.frame.material.as_ptr(),
                self.frame.color.as_ptr(),
                self.frame.tags.as_ptr(),
            ))
    }

    /// Fits the view on the current blocks.
    pub fn fit_view(&mut self) {
        let b = framing(&self.blocks);
        self.view = fit(
            &b,
            self.frame.width as f64,
            self.frame.height as f64,
            &self.fit,
        );
    }

    /// Fits the view on a packed block list (the framing scene of immediate mode).
    pub fn fit_packed(&mut self, bytes: &[u8]) -> Result<(), String> {
        read_blocks(bytes, &mut self.blocks)?;
        if let Some(scene) = &mut self.scene {
            scene.dirty = true;
        }
        self.fit_view();
        Ok(())
    }

    fn draw(&mut self) {
        let (w, h) = (self.frame.width, self.frame.height);
        self.frame.reset(w, h, self.options.depth == Depth::ZBuffer);
        render_blocks(
            &mut self.frame,
            &self.blocks,
            &self.view,
            &self.options,
            &mut self.scratch,
        );
        shade(&mut self.frame, self.dither, self.glow);
    }

    /// A frame of the loaded scene at its current inputs (the P2 entry point: no clock).
    pub fn frame(&mut self) -> Result<(), String> {
        self.flatten()?;
        self.draw();
        Ok(())
    }

    /// The tag under the pointer in the last frame (string index + 1, 0 for none).
    fn tag_under_pointer(&self) -> u16 {
        let i = &self.inputs;
        if i[I::POINTER_IN] == 0.0 {
            return 0;
        }
        let (x, y) = (i[I::POINTER_X].floor(), i[I::POINTER_Y].floor());
        let (w, h) = (self.frame.width as f64, self.frame.height as f64);
        if !(x >= 0.0 && y >= 0.0 && x < w && y < h) {
            return 0;
        }
        self.frame
            .tags
            .get(y as usize * self.frame.width + x as usize)
            .copied()
            .unwrap_or(0)
    }

    /// One frame from the inputs block (§3 "The frame"): vars, machines, timelines, then the
    /// raster when anything it is made of changed, the RGBA when a palette is set, and the
    /// outputs block. Returns the `frame_flags`.
    pub fn step(&mut self) -> Result<u32, String> {
        let time = self.inputs[I::TIME];
        let dt = self.inputs[I::DT];
        let mut flags = 0;
        // Hover: the tag under the pointer in the last frame.
        let hover = self.tag_under_pointer();
        self.events.clear();
        if hover != self.hover {
            flags |= F::HOVER;
            if let Some(scene) = &self.scene {
                if self.hover != 0 {
                    self.events.leave = true;
                }
                if hover != 0 {
                    self.events.hover = scene.bin.strings.get(hover as usize - 1).cloned();
                }
            }
            self.hover = hover;
        }
        let queued = (self.inputs[I::EVENT_COUNT].max(0.0) as usize).min(MAX_EVENTS);
        for k in 0..queued {
            let e = self.inputs[I::EVENT0 + k];
            if e >= 0.0 {
                self.events.queued.push(e as usize);
            }
        }
        self.inputs[I::EVENT_COUNT] = 0.0;
        let script = self.inputs[I::BLOCKS].max(0.0) as usize;
        let mut draw = script > 0;
        if let Some(scene) = &mut self.scene {
            let n = scene.defaults.len();
            scene
                .anim
                .host
                .copy_from_slice(&self.inputs[I::WORDS..I::WORDS + n]);
            if scene.anim.step(
                &scene.bin,
                &scene.defaults,
                &mut scene.vars,
                time,
                dt,
                &self.events,
            ) {
                flags |= F::STATE;
            }
            let skip = usize::from(!scene.uses_t);
            let same = scene.drawn_vars.len() == n
                && scene.drawn_vars[skip..]
                    .iter()
                    .zip(&scene.vars[skip..])
                    .all(|(a, b)| a.to_bits() == b.to_bits())
                && scene.drawn_over == scene.anim.over;
            if !same {
                flags |= F::VARS;
                scene.dirty = true;
                scene.drawn_vars.clear();
                scene.drawn_vars.extend_from_slice(&scene.vars);
                scene.drawn_over.clone_from(&scene.anim.over);
            }
            draw |= scene.dirty;
        }
        if draw {
            if self.scene.is_some() {
                self.flatten()?;
                // The script layer's blocks follow the scene's (P3 notes, "Interleaving").
                self.blocks.truncate(self.scene_len);
            } else {
                self.blocks.clear();
            }
            if script > 0 {
                if script > self.block_buf.len() * 8 {
                    return Err("inputs.blocks beyond the block buffer".into());
                }
                // SAFETY: the words of `block_buf` seen as their bytes (u8 has no alignment).
                let bytes = unsafe {
                    std::slice::from_raw_parts(self.block_buf.as_ptr() as *const u8, script)
                };
                read_blocks(bytes, &mut self.script)?;
                self.blocks.extend(self.script.iter().cloned());
            }
            self.draw();
            if let Some(palette) = &self.palette {
                paint(&self.frame.color, palette, &mut self.rgba);
            }
            flags |= F::DRAWN;
            self.frames += 1.0;
        }
        // Outputs.
        let o = &mut self.outputs;
        o[O::HOVER] = self.hover as f64;
        o[O::FRAMES] = self.frames;
        if let Some(scene) = &self.scene {
            let n = scene.vars.len();
            o[O::WORDS..O::WORDS + n].copy_from_slice(&scene.vars);
            for (k, &s) in scene.anim.machines.current.iter().enumerate() {
                let m = &scene.bin.machines[k];
                o[O::WORDS + n + k] = (s - m.states.start) as f64;
            }
        }
        o[O::FLAGS] = flags as f64;
        Ok(flags)
    }

    /// Room for a packed block list of `len` bytes in the block buffer; its address.
    pub fn block_buffer(&mut self, len: usize) -> usize {
        let words = len.div_ceil(8);
        if self.block_buf.len() < words {
            self.block_buf.resize(words.next_power_of_two(), 0.0);
        }
        self.block_buf.as_ptr() as usize
    }

    /// A frame of a packed block list, on the current view.
    pub fn immediate(&mut self, bytes: &[u8]) -> Result<(), String> {
        read_blocks(bytes, &mut self.blocks)?;
        if let Some(scene) = &mut self.scene {
            scene.dirty = true;
        }
        self.draw();
        Ok(())
    }

    /// The host's value of root scope slot `index` (NaN releases it), as the inputs block holds it.
    pub fn set_var(&mut self, index: usize, value: f64) {
        if let Some(scene) = &mut self.scene {
            if let Some(v) = self.inputs.get_mut(I::WORDS + index) {
                *v = value;
            }
            // The P2 entry points (`frame`, `flat_blocks`) read the root scope directly.
            if let Some(v) = scene.vars.get_mut(index) {
                if !value.is_nan() && v.to_bits() != value.to_bits() {
                    *v = value;
                    scene.dirty = true;
                }
            }
        }
    }

    /// The loaded scene's blocks at its current inputs.
    pub fn flat_blocks(&mut self) -> Result<&[Block], String> {
        if let Some(scene) = &mut self.scene {
            scene.dirty = true;
        }
        self.flatten()?;
        Ok(&self.blocks)
    }
}
