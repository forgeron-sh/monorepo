//! The frame buffer (`core/frame.ts`): per pixel, its material, colour family, density and, once
//! shaded, its palette slot; plus the hover tag and, in z-buffer mode, the depth.

/// What a pixel is made of.
pub struct Material;
impl Material {
    pub const EMPTY: u8 = 0;
    pub const FACE_TOP: u8 = 1;
    pub const FACE_LEFT: u8 = 2;
    pub const FACE_RIGHT: u8 = 3;
    pub const EDGE: u8 = 4;
    pub const DETAIL: u8 = 5;
    pub const DOT: u8 = 6;
    pub const LABEL_FILL: u8 = 7;
    pub const LABEL_FRAME: u8 = 8;
    pub const LABEL_TEXT: u8 = 9;
    pub const FIELD: u8 = 10;
}

/// Palette slots; 0 is transparent.
pub struct Slot;
impl Slot {
    pub const NONE: u8 = 0;
    pub const BG: u8 = 1;
    pub const INK: u8 = 2;
    pub const DIM: u8 = 3;
    pub const FAINT: u8 = 4;
    pub const ACCENT: u8 = 5;
    pub const SIGNAL: u8 = 6;
    pub const ALERT: u8 = 7;
}

#[inline]
pub fn is_shaded(m: u8) -> bool {
    matches!(
        m,
        Material::FACE_TOP | Material::FACE_LEFT | Material::FACE_RIGHT | Material::FIELD
    )
}

#[inline]
pub fn is_label(m: u8) -> bool {
    matches!(
        m,
        Material::LABEL_FILL | Material::LABEL_FRAME | Material::LABEL_TEXT
    )
}

pub struct Frame {
    pub width: usize,
    pub height: usize,
    pub material: Vec<u8>,
    pub ink: Vec<u8>,
    pub tone: Vec<f32>,
    pub color: Vec<u8>,
    pub tags: Vec<u16>,
    /// One depth per pixel in z-buffer mode, empty in painter mode.
    pub depth: Vec<f32>,
    /// Whether writes test and update `depth`.
    pub ztest: bool,
    /// Depth bias of the current writes: a pixel is written when `d ≥ stored − bias`.
    pub bias: f64,
    /// Tag written with every pixel.
    pub pen_tag: u16,
    /// In z-buffer mode, the block that wrote each pixel (index + 1)...
    pub owner: Vec<u32>,
    /// ... and the block writing now: its lines and dots always win over its own faces.
    pub pen_owner: u32,
}

impl Frame {
    pub fn new(width: usize, height: usize) -> Self {
        let n = width * height;
        Self {
            width,
            height,
            material: vec![0; n],
            ink: vec![0; n],
            tone: vec![0.0; n],
            color: vec![0; n],
            tags: vec![0; n],
            depth: Vec::new(),
            ztest: false,
            bias: 0.0,
            pen_tag: 0,
            owner: Vec::new(),
            pen_owner: 0,
        }
    }

    /// Resizes (keeping the allocation when it is large enough) and clears every buffer.
    pub fn reset(&mut self, width: usize, height: usize, zbuffer: bool) {
        let n = width * height;
        self.width = width;
        self.height = height;
        for (v, zero) in [
            (&mut self.material, 0u8),
            (&mut self.ink, 0),
            (&mut self.color, 0),
        ] {
            v.clear();
            v.resize(n, zero);
        }
        self.tone.clear();
        self.tone.resize(n, 0.0);
        self.tags.clear();
        self.tags.resize(n, 0);
        self.depth.clear();
        self.owner.clear();
        if zbuffer {
            self.depth.resize(n, f32::NEG_INFINITY);
            self.owner.resize(n, 0);
        }
        self.pen_owner = 0;
        self.ztest = false;
        self.bias = 0.0;
        self.pen_tag = 0;
    }

    /// Writes the pixels `from..to` of one row, without the depth test (painter mode).
    #[inline]
    pub fn write_run(&mut self, from: usize, to: usize, material: u8, ink: u8, tone: f64) {
        self.material[from..to].fill(material);
        self.ink[from..to].fill(ink);
        self.tone[from..to].fill(tone as f32);
        self.tags[from..to].fill(self.pen_tag);
    }

    /// Writes the pixel at index `i`, through the depth test when it is on.
    #[inline]
    pub fn write(&mut self, i: usize, material: u8, ink: u8, tone: f64, d: f64) {
        if self.ztest {
            let own = self.bias > 0.0 && self.owner[i] == self.pen_owner;
            let floor = self.depth[i] as f64 - self.bias;
            if !own && matches!(d.partial_cmp(&floor), None | Some(std::cmp::Ordering::Less)) {
                return;
            }
            if !own {
                self.depth[i] = d as f32;
            }
            self.owner[i] = self.pen_owner;
        }
        self.material[i] = material;
        self.ink[i] = ink;
        self.tone[i] = tone as f32;
        self.tags[i] = self.pen_tag;
    }
}
