//! Labels: placement around the drawing, then plates or plain captions (`placeLabels`,
//! `drawLabel`, `drawPlainLabel` of `core/draw.ts`).

use crate::block::{flags, Block};
use crate::font::{Glyph, GLYPHS};
use crate::raster::{plot, stroke, Frame, Material, Pt, Slot};
use fg_math::{iso, js_max, js_min, js_round, View};

/// The glyph of `ch`, or a space when the face lacks it.
pub fn glyph(ch: char) -> &'static Glyph {
    let at = |c: char| GLYPHS.binary_search_by(|(k, _)| k.cmp(&c)).ok();
    let i = at(ch).or_else(|| at(' ')).unwrap_or(0);
    &GLYPHS[i].1
}

#[inline]
pub fn glyph_width(g: &Glyph) -> f64 {
    g.rows.first().map_or(3.0, |r| r.chars().count() as f64)
}

/// Width of `text` in pixels: glyphs plus one column between them.
pub fn text_width(text: &str) -> f64 {
    let mut w = 0.0;
    for ch in text.chars() {
        w += glyph_width(glyph(ch)) + 1.0;
    }
    js_max(0.0, w - 1.0)
}

/// A plate in raster pixels, frame included (inclusive bounds).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Plate {
    pub x0: f64,
    pub y0: f64,
    pub x1: f64,
    pub y1: f64,
}

const PLATE_GAP: f64 = 2.0;

impl Plate {
    fn shift(&self, dx: f64, dy: f64) -> Self {
        Self {
            x0: self.x0 + dx,
            y0: self.y0 + dy,
            x1: self.x1 + dx,
            y1: self.y1 + dy,
        }
    }
    fn overlaps(&self, b: &Plate) -> bool {
        self.x0 <= b.x1 + PLATE_GAP
            && b.x0 <= self.x1 + PLATE_GAP
            && self.y0 <= b.y1 + PLATE_GAP
            && b.y0 <= self.y1 + PLATE_GAP
    }
    fn inside(&self, width: f64, height: f64) -> Self {
        let dx = if self.x0 < 0.0 {
            -self.x0
        } else if self.x1 > width - 1.0 {
            width - 1.0 - self.x1
        } else {
            0.0
        };
        let dy = if self.y0 < 0.0 {
            -self.y0
        } else if self.y1 > height - 1.0 {
            height - 1.0 - self.y1
        } else {
            0.0
        };
        self.shift(dx, dy)
    }
}

fn default_plate(l: &Block, text: &str, view: &View) -> Plate {
    let p = iso::project(l.a, view);
    let width = text_width(text);
    let x0 = js_round(p.0 - width / 2.0) - 3.0;
    let y0 = js_round(p.1) - 13.0;
    Plate {
        x0,
        y0,
        x1: x0 + width + 5.0,
        y1: y0 + 12.0,
    }
}

/// The placement rule of labels (see `placeLabels`): each plate starts centred above its anchor,
/// moved inside the raster; then it rises until it covers nothing of the drawing and touches no
/// plate placed before it, or keeps the first spot that touches no plate; else it is left out.
/// `texts` are the upper-cased texts of `labels`.
pub fn place_labels(
    labels: &[&Block],
    texts: &[String],
    view: &View,
    width: f64,
    height: f64,
    occupied: Option<&dyn Fn(usize, usize) -> bool>,
) -> Vec<Option<Plate>> {
    let mut placed: Vec<Plate> = Vec::new();
    let covers = |r: &Plate| -> bool {
        let Some(occupied) = occupied else {
            return false;
        };
        let mut y = js_max(0.0, r.y0 - PLATE_GAP);
        let y_end = js_min(height - 1.0, r.y1 + PLATE_GAP);
        while y <= y_end {
            let mut x = js_max(0.0, r.x0 - PLATE_GAP);
            let x_end = js_min(width - 1.0, r.x1 + PLATE_GAP);
            while x <= x_end {
                if occupied(x as usize, y as usize) {
                    return true;
                }
                x += 1.0;
            }
            y += 1.0;
        }
        false
    };
    let mut out = Vec::with_capacity(labels.len());
    for (l, text) in labels.iter().zip(texts) {
        let start = default_plate(l, text, view).inside(width, height);
        if start.x0 < 0.0 || start.y0 < 0.0 || start.x1 > width - 1.0 || start.y1 > height - 1.0 {
            out.push(None);
            continue;
        }
        if l.has(flags::FIXED) {
            placed.push(start);
            out.push(Some(start));
            continue;
        }
        let mut fallback: Option<Plate> = None;
        let mut chosen: Option<Plate> = None;
        let mut offsets: Vec<f64> = Vec::new();
        let mut dy = 0.0;
        while start.y0 + dy >= 0.0 {
            offsets.push(dy);
            dy -= 1.0;
        }
        let mut dy = 1.0;
        while start.y1 + dy <= height - 1.0 {
            offsets.push(dy);
            dy += 1.0;
        }
        for dy in offsets {
            let r = start.shift(0.0, dy);
            if placed.iter().any(|o| r.overlaps(o)) {
                continue;
            }
            if !covers(&r) {
                chosen = Some(r);
                break;
            }
            if fallback.is_none() {
                fallback = Some(r);
            }
        }
        let r = chosen.or(fallback);
        if let Some(r) = r {
            placed.push(r);
        }
        out.push(r);
    }
    out
}

fn draw_text(f: &mut Frame, text: &str, mut x: f64, y: f64, ink: u8) {
    for ch in text.chars() {
        let g = glyph(ch);
        for (i, row) in g.rows.iter().enumerate() {
            for (j, px) in row.bytes().enumerate() {
                if px == b'#' {
                    plot(
                        f,
                        x + j as f64,
                        y + g.top as f64 + i as f64,
                        Material::LABEL_TEXT,
                        ink,
                        1.0,
                        0.0,
                    );
                }
            }
        }
        x += glyph_width(g) + 1.0;
    }
}

/// A plain label: its text alone, centred on its anchor, in its own colour family.
pub fn draw_plain_label(f: &mut Frame, l: &Block, text: &str, view: &View) {
    let p = iso::project(l.a, view);
    let px = js_round(p.0 - text_width(text) / 2.0);
    draw_text(f, text, px, js_round(p.1) - 7.0, l.ink);
}

/// A tag on its plate: a 1-pixel frame, a solid fill, capitals; a leader down to `to`.
pub fn draw_label(f: &mut Frame, l: &Block, text: &str, view: &View, r: &Plate) {
    let p = iso::project(l.a, view);
    let active = l.has(flags::ACTIVE);
    let Plate { x0, y0, x1, y1 } = *r;
    if l.has(flags::HAS_TO) {
        let target = iso::project(l.b, view);
        let sx = js_min(js_max(js_round(p.0), x0 + 1.0), x1 - 1.0);
        let sy = if target.1 < y0 { y0 - 1.0 } else { y1 + 1.0 };
        let ink = if active { Slot::ACCENT } else { Slot::DIM };
        let dash = if active { 0.0 } else { 1.0 };
        stroke(
            f,
            Pt::new(sx, sy, 0.0),
            Pt::new(target.0, target.1, 0.0),
            Material::EDGE,
            ink,
            dash,
        );
    }
    let mut y = y0;
    while y <= y1 {
        let mut x = x0;
        while x <= x1 {
            let edge = x == x0 || x == x1 || y == y0 || y == y1;
            if edge {
                plot(
                    f,
                    x,
                    y,
                    Material::LABEL_FRAME,
                    if active { Slot::ACCENT } else { Slot::DIM },
                    1.0,
                    0.0,
                );
            } else {
                plot(
                    f,
                    x,
                    y,
                    Material::LABEL_FILL,
                    if active { Slot::ACCENT } else { Slot::BG },
                    1.0,
                    0.0,
                );
            }
            x += 1.0;
        }
        y += 1.0;
    }
    draw_text(
        f,
        text,
        x0 + 3.0,
        y0 + 3.0,
        if active { Slot::BG } else { Slot::INK },
    );
}

/// `toUpperCase` for the label face: ASCII and Latin-1 letters (the face's glyphs), and the few
/// letters whose upper case lands there (ß → SS, ı → I, ſ → S, the Latin ligatures). Other
/// scripts have no glyph and are left as they are; std's full Unicode tables would cost the
/// module several KB for letters the face cannot draw.
pub fn upper(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            'a'..='z' => out.push(c.to_ascii_uppercase()),
            '\u{e0}'..='\u{fe}' if c != '\u{f7}' => {
                out.push(char::from_u32(c as u32 - 0x20).unwrap_or(c))
            }
            '\u{df}' => out.push_str("SS"),
            '\u{131}' => out.push('I'),
            '\u{17f}' => out.push('S'),
            '\u{fb00}' => out.push_str("FF"),
            '\u{fb01}' => out.push_str("FI"),
            '\u{fb02}' => out.push_str("FL"),
            '\u{fb03}' => out.push_str("FFI"),
            '\u{fb04}' => out.push_str("FFL"),
            '\u{fb05}' | '\u{fb06}' => out.push_str("ST"),
            _ => out.push(c),
        }
    }
    out
}

#[cfg(test)]
mod upper_tests {
    use super::upper;

    #[test]
    fn upper_cases_like_javascript_on_the_face() {
        // "…".toUpperCase() under node.
        assert_eq!(upper("Prévisualisation à 3 €"), "PRÉVISUALISATION À 3 €");
        assert_eq!(upper("straße · ﬁn →"), "STRASSE · FIN →");
        // JavaScript gives Ÿ (U+0178): neither has a glyph, so the label draws the same.
        assert_eq!(upper("ÿ"), "ÿ");
        assert_eq!(upper("çà ÷ þ"), "ÇÀ ÷ Þ");
    }
}
