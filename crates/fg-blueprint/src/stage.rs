//! What a handle keeps between calls: the frame and its scratch buffers, the view, the shading,
//! and, for a scene loaded from a SceneBin, the scene and its root scope. Nothing is allocated per
//! frame once the buffers have their size.

use crate::bin::{self, SceneBin};
use crate::block::{flags, Block, BlockKind};
use crate::immediate::read_blocks;
use crate::layout::code;
use crate::raster::Frame;
use crate::render::{render_blocks, Depth, RenderOptions};
use crate::scene::Flattener;
use crate::shade::{shade, Glow};
use fg_math::{fit, Bounds, FitOptions, Unit, View};

pub struct SceneState {
    pub bin: SceneBin,
    /// The root scope: `t`, the vars, the root's params.
    pub vars: Vec<f64>,
    pub dirty: bool,
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
        let vars = bin.root_defaults();
        stage.scene = Some(SceneState {
            bin,
            vars,
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
            Flattener::new(&scene.bin).flatten(&scene.vars, &mut self.blocks)?;
            scene.dirty = false;
        }
        Ok(())
    }

    /// Sizes the raster; a loaded scene is fitted again (on its current inputs).
    pub fn resize(&mut self, width: usize, height: usize) -> Result<bool, String> {
        let before = (self.frame.material.as_ptr(), self.frame.color.as_ptr());
        let zb = self.options.depth == Depth::ZBuffer;
        self.frame.reset(width, height, zb);
        if self.scene.is_some() {
            self.flatten()?;
            self.fit_view();
        }
        Ok(before != (self.frame.material.as_ptr(), self.frame.color.as_ptr()))
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

    /// A frame of the loaded scene.
    pub fn frame(&mut self) -> Result<(), String> {
        self.flatten()?;
        self.draw();
        Ok(())
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

    pub fn set_var(&mut self, index: usize, value: f64) {
        if let Some(scene) = &mut self.scene {
            if let Some(v) = scene.vars.get_mut(index) {
                if v.to_bits() != value.to_bits() {
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
