//! A still frame from blocks: order (painter) or depth test (z-buffer), cull, raster, then labels
//! placed around the drawing (`rasterize` of `core/draw.ts`).

use crate::block::{flags, Block, BlockKind};
use crate::boxes::{draw_box, line_bias};
use crate::labels::{draw_label, draw_plain_label, place_labels, upper};
use crate::raster::{dot, stroke, Frame, Material, Pt, Slot};
use crate::{cull, order};
use fg_math::{iso, View};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum Depth {
    /// Today's order, bit for bit: layer, then the painter's key, stable.
    #[default]
    Painter,
    /// A depth buffer (`x + y + z`, nearer wins); no sort. Labels still go last.
    ZBuffer,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct RenderOptions {
    pub labels: bool,
    pub depth: Depth,
}

impl Default for RenderOptions {
    fn default() -> Self {
        Self {
            labels: true,
            depth: Depth::Painter,
        }
    }
}

#[inline]
fn point(v: [f64; 3], view: &View) -> Pt {
    let (x, y) = iso::project(v, view);
    Pt::new(x, y, iso::depth(v))
}

fn draw(f: &mut Frame, b: &Block, view: &View) {
    f.pen_tag = b.tag;
    let bias = if f.ztest { line_bias(view.u) } else { 0.0 };
    match b.kind {
        BlockKind::Line => {
            f.bias = bias;
            stroke(
                f,
                point(b.a, view),
                point(b.b, view),
                Material::EDGE,
                b.ink,
                b.dash,
            );
        }
        BlockKind::Dot => {
            f.bias = bias;
            dot(f, point(b.a, view), b.size, b.ink);
        }
        BlockKind::Box => draw_box(f, b, view),
        BlockKind::Label => {}
    }
}

/// Rasterises `blocks` into `f` (cleared by the caller), reusing `scratch` for the order.
pub fn render_blocks(
    f: &mut Frame,
    blocks: &[Block],
    view: &View,
    options: &RenderOptions,
    scratch: &mut Vec<(f64, f64, u32)>,
) {
    let (w, h) = (f.width as f64, f.height as f64);
    let keep = |b: &Block| cull::visible(b, view, w, h);
    let mut labels: Vec<&Block> = Vec::new();
    match options.depth {
        Depth::Painter => {
            f.ztest = false;
            order::painter_order(blocks, keep, scratch);
            for &(_, _, i) in scratch.iter() {
                let b = &blocks[i as usize];
                if b.kind == BlockKind::Label {
                    labels.push(b);
                } else {
                    draw(f, b, view);
                }
            }
        }
        Depth::ZBuffer => {
            if f.depth.len() != f.width * f.height {
                let (w, h) = (f.width, f.height);
                f.reset(w, h, true);
            }
            f.ztest = true;
            for (i, b) in blocks.iter().enumerate() {
                if b.kind == BlockKind::Label {
                    labels.push(b);
                } else if keep(b) {
                    f.pen_owner = i as u32 + 1;
                    draw(f, b, view);
                }
            }
            f.ztest = false;
        }
    }
    f.bias = 0.0;
    if !options.labels {
        return;
    }
    let framed: Vec<&Block> = labels
        .iter()
        .copied()
        .filter(|l| !l.has(flags::PLAIN))
        .collect();
    let texts: Vec<String> = framed.iter().map(|l| upper(&l.text)).collect();
    let plates = {
        let (material, ink, width) = (&f.material, &f.ink, f.width);
        let occupied = |x: usize, y: usize| {
            let i = y * width + x;
            material[i] != Material::EMPTY && ink[i] != Slot::FAINT
        };
        place_labels(&framed, &texts, view, w, h, Some(&occupied))
    };
    for ((l, text), r) in framed.iter().zip(&texts).zip(&plates) {
        if let Some(r) = r {
            f.pen_tag = l.tag;
            draw_label(f, l, text, view, r);
        }
    }
    for l in labels.iter().filter(|l| l.has(flags::PLAIN)) {
        f.pen_tag = l.tag;
        draw_plain_label(f, l, &upper(&l.text), view);
    }
    f.pen_tag = 0;
}
