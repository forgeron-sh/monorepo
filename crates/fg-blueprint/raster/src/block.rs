//! A block of today's model (`core/types.ts`): what immediate mode receives and what a scene
//! flattens to. Absent fields already hold the renderer's defaults.

use fg_math::Vec3;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BlockKind {
    Box,
    Line,
    Dot,
    Label,
}

/// Bits of `Block::flags` (the same as the packed block's `flags` word).
pub use crate::layout::flags;

#[derive(Clone, Debug, PartialEq)]
pub struct Block {
    pub kind: BlockKind,
    /// `layer ?? 0`.
    pub layer: f64,
    pub flags: u32,
    /// A box's corner, a line's first end, a dot's or a label's anchor.
    pub a: Vec3,
    /// A box's size, a line's second end, a label's `to` (with `HAS_TO`).
    pub b: Vec3,
    /// Face densities when `HAS_TONE`.
    pub tone: [f64; 3],
    /// `floors` (0 when absent).
    pub floors: f64,
    /// Palette slot of a line, a dot or a plain label (`ink ?? "ink"`).
    pub ink: u8,
    /// Dash of a line, 0 for solid.
    pub dash: f64,
    /// Side of a dot (`size ?? 2`).
    pub size: f64,
    /// Hover tag id (0 = none).
    pub tag: u16,
    pub text: String,
}

impl Block {
    pub fn new(kind: BlockKind) -> Self {
        Self {
            kind,
            layer: 0.0,
            flags: 0,
            a: [0.0; 3],
            b: [0.0; 3],
            tone: [0.0; 3],
            floors: 0.0,
            ink: crate::Slot::INK,
            dash: 0.0,
            size: 2.0,
            tag: 0,
            text: String::new(),
        }
    }

    #[inline]
    pub fn has(&self, flag: u32) -> bool {
        self.flags & flag != 0
    }
}
