//! The properties of `packages/blueprint/src/core/core.test.ts`, on the Rust core, and the cases
//! of the z-buffer where painter's order fails.

use fg_blueprint::block::flags;
use fg_blueprint::labels::{place_labels, Plate};
use fg_blueprint::raster::{fill_convex, stroke, Pt};
use fg_blueprint::shade::{shade, Glow};
use fg_blueprint::stage::framing;
use fg_blueprint::{render_blocks, Block, BlockKind, Depth, Frame, Material, RenderOptions, Slot};
use fg_math::{fit, iso, FitOptions, View};
use std::collections::BTreeMap;

fn cuboid(at: [f64; 3], size: [f64; 3]) -> Block {
    let mut b = Block::new(BlockKind::Box);
    b.a = at;
    b.b = size;
    b
}

fn label(at: [f64; 3], text: &str) -> Block {
    let mut b = Block::new(BlockKind::Label);
    b.a = at;
    b.text = text.into();
    b
}

fn line(a: [f64; 3], b: [f64; 3], ink: u8) -> Block {
    let mut l = Block::new(BlockKind::Line);
    l.a = a;
    l.b = b;
    l.ink = ink;
    l
}

fn pt(v: [f64; 3], view: &View) -> Pt {
    let (x, y) = iso::project(v, view);
    Pt::new(x, y, iso::depth(v))
}

struct Out {
    frame: Frame,
    view: View,
}

/// `render(blocks, { width, height, filters: [pixelate(pixel), dither?, glow?] })`.
fn render(
    blocks: &[Block],
    width: f64,
    height: f64,
    pixel: f64,
    dither: Option<usize>,
    glow: Option<Glow>,
    depth: Depth,
) -> Out {
    let (w, h) = (
        (width / pixel).floor().max(1.0),
        (height / pixel).floor().max(1.0),
    );
    let view = fit(&framing(blocks), w, h, &FitOptions::default());
    let mut frame = Frame::new(w as usize, h as usize);
    render_blocks(
        &mut frame,
        blocks,
        &view,
        &RenderOptions {
            labels: true,
            depth,
        },
        &mut Vec::new(),
    );
    shade(&mut frame, dither, glow);
    Out { frame, view }
}

fn painter(blocks: &[Block], width: f64, height: f64) -> Out {
    render(blocks, width, height, 1.0, None, None, Depth::Painter)
}

fn rows(f: &Frame, keep: impl Fn(usize) -> bool) -> BTreeMap<usize, Vec<usize>> {
    let mut out: BTreeMap<usize, Vec<usize>> = BTreeMap::new();
    for y in 0..f.height {
        for x in 0..f.width {
            if keep(y * f.width + x) {
                out.entry(y).or_default().push(x);
            }
        }
    }
    out
}

fn is_face(m: u8) -> bool {
    matches!(
        m,
        Material::FACE_TOP | Material::FACE_LEFT | Material::FACE_RIGHT
    )
}

#[test]
fn draws_a_two_to_one_edge_as_runs_of_two_pixels() {
    let mut f = Frame::new(64, 64);
    let view = View {
        u: 4.0,
        ox: 4.0,
        oy: 4.0,
    };
    stroke(
        &mut f,
        pt([0.0, 0.0, 0.0], &view),
        pt([10.0, 0.0, 0.0], &view),
        Material::EDGE,
        Slot::INK,
        0.0,
    );
    let by_row = rows(&f, |i| f.material[i] == Material::EDGE);
    assert_eq!(by_row.len(), 21);
    let widths: Vec<usize> = by_row.values().map(Vec::len).collect();
    assert!(widths[1..widths.len() - 1].iter().all(|&w| w == 2));
}

#[test]
fn draws_the_same_pixels_from_either_end() {
    let view = View {
        u: 4.0,
        ox: 30.0,
        oy: 4.0,
    };
    let (a, b) = (pt([0.0, 0.0, 0.0], &view), pt([0.0, 7.0, 0.0], &view));
    let mut one = Frame::new(64, 64);
    let mut two = Frame::new(64, 64);
    stroke(&mut one, a, b, Material::EDGE, Slot::INK, 0.0);
    stroke(&mut two, b, a, Material::EDGE, Slot::INK, 0.0);
    assert_eq!(one.material, two.material);
}

#[test]
fn fills_a_convex_polygon_and_nothing_outside() {
    let mut f = Frame::new(10, 10);
    let p = |x: f64, y: f64| Pt::new(x, y, 0.0);
    fill_convex(
        &mut f,
        &[p(2.0, 2.0), p(8.0, 2.0), p(8.0, 8.0), p(2.0, 8.0)],
        Material::FACE_TOP,
        Slot::DIM,
        0.3,
        None,
    );
    assert_eq!(f.material[55], Material::FACE_TOP);
    assert_eq!(f.tone[55], 0.3f32);
    assert_eq!(f.material[0], Material::EMPTY);
    assert_eq!(f.material[99], Material::EMPTY);
}

#[test]
fn writes_tones_not_colours() {
    let out = painter(&[cuboid([0.0; 3], [4.0; 3])], 80.0, 80.0);
    let mut tones: Vec<i64> = (0..out.frame.material.len())
        .filter(|&i| is_face(out.frame.material[i]))
        .map(|i| (out.frame.tone[i] as f64 * 100.0).round() as i64)
        .collect();
    tones.sort();
    tones.dedup();
    assert_eq!(tones, vec![6, 20, 42]);
}

#[test]
fn hoists_pixelate_and_keeps_an_even_unit() {
    let out = render(
        &[cuboid([0.0; 3], [4.0; 3])],
        300.0,
        200.0,
        3.0,
        None,
        None,
        Depth::Painter,
    );
    assert_eq!((out.frame.width, out.frame.height), (100, 66));
    assert_eq!(out.view.u % 2.0, 0.0);
}

#[test]
fn dithers_faces_and_never_an_edge_a_detail_a_dot_or_a_letter() {
    let mut b = cuboid([0.0; 3], [8.0; 3]);
    b.tone = [0.5; 3];
    b.flags |= flags::HAS_TONE | flags::VENTS | flags::PLATE;
    b.floors = 2.0;
    let mut l = label([4.0, 4.0, 14.0], "Forge");
    l.b = [4.0, 4.0, 8.0];
    l.flags |= flags::HAS_TO;
    let f = render(&[b, l], 240.0, 240.0, 2.0, Some(4), None, Depth::Painter).frame;
    let (mut faces, mut lit, mut wrong) = (0, 0, 0);
    for i in 0..f.material.len() {
        let m = f.material[i];
        if is_face(m) {
            faces += 1;
            if f.color[i] == f.ink[i] {
                lit += 1;
            } else if f.color[i] != Slot::BG {
                wrong += 1;
            }
        } else if m != Material::EMPTY && f.color[i] != f.ink[i] {
            wrong += 1;
        }
    }
    assert_eq!(wrong, 0);
    assert!(faces > 100);
    let ratio = lit as f64 / faces as f64;
    assert!(ratio > 0.4 && ratio < 0.6, "{ratio}");
}

#[test]
fn shades_faces_flat_without_a_dither() {
    let mut b = cuboid([0.0; 3], [8.0; 3]);
    b.tone = [0.2, 0.2, 0.7];
    b.flags |= flags::HAS_TONE;
    let f = painter(&[b], 120.0, 120.0).frame;
    let colors_of = |m: u8| {
        let mut c: Vec<u8> = (0..f.material.len())
            .filter(|&i| f.material[i] == m)
            .map(|i| f.color[i])
            .collect();
        c.sort();
        c.dedup();
        c
    };
    assert_eq!(colors_of(Material::FACE_TOP), vec![Slot::BG]);
    assert_eq!(colors_of(Material::FACE_RIGHT), vec![Slot::DIM]);
}

#[test]
fn glows_around_accent_pixels_never_over_a_label() {
    let blocks = [
        line([0.0; 3], [6.0, 0.0, 0.0], Slot::ACCENT),
        label([20.0, 20.0, 0.0], "AB"),
    ];
    let base = render(&blocks, 160.0, 160.0, 2.0, None, None, Depth::Painter).frame;
    let glow = Glow {
        radius: 1,
        density: 1.0,
    };
    let lit = render(&blocks, 160.0, 160.0, 2.0, None, Some(glow), Depth::Painter).frame;
    let count = |c: &[u8]| c.iter().filter(|&&s| s == Slot::ACCENT).count();
    assert!(count(&lit.color) > count(&base.color));
    let fills: Vec<usize> = (0..lit.material.len())
        .filter(|&i| lit.material[i] == Material::LABEL_FILL)
        .collect();
    assert!(!fills.is_empty());
    assert!(fills.iter().all(|&i| lit.color[i] == Slot::BG));
}

fn plates(labels: &[Block], view: &View, w: f64, h: f64) -> Vec<Option<Plate>> {
    let refs: Vec<&Block> = labels.iter().collect();
    let texts: Vec<String> = labels.iter().map(|l| l.text.to_uppercase()).collect();
    place_labels(&refs, &texts, view, w, h, None)
}

#[test]
fn keeps_every_plate_inside_the_raster() {
    let view = View {
        u: 4.0,
        ox: 50.0,
        oy: 40.0,
    };
    let labels = [
        label([-30.0, 0.0, 0.0], "Left edge"),
        label([0.0, 0.0, 20.0], "Top"),
        label([30.0, 30.0, 0.0], "Corner"),
    ];
    for r in plates(&labels, &view, 100.0, 80.0) {
        let r = r.expect("placed");
        assert!(r.x0 >= 0.0 && r.y0 >= 0.0 && r.x1 <= 99.0 && r.y1 <= 79.0);
    }
}

#[test]
fn never_lets_two_plates_touch() {
    let view = View {
        u: 4.0,
        ox: 50.0,
        oy: 40.0,
    };
    let labels = [
        label([5.0, 5.0, 2.0], "Repository"),
        label([5.0, 5.0, 2.0], "Preview"),
        label([6.0, 5.0, 2.0], "Production"),
    ];
    let p: Vec<Plate> = plates(&labels, &view, 200.0, 160.0)
        .into_iter()
        .map(|r| r.expect("placed"))
        .collect();
    let disjoint = |a: &Plate, b: &Plate| a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0;
    for i in 0..p.len() {
        for j in i + 1..p.len() {
            assert!(disjoint(&p[i], &p[j]));
        }
    }
    assert!(p[1].y1 < p[0].y0);
}

#[test]
fn rises_off_the_drawing() {
    let b = cuboid([0.0; 3], [8.0, 8.0, 6.0]);
    let mut l = label([4.0, 4.0, 7.0], "Tool");
    l.b = [4.0, 4.0, 6.0];
    l.flags |= flags::HAS_TO;
    let with = painter(&[b.clone(), l], 120.0, 120.0).frame;
    let bare = painter(&[b], 120.0, 120.0).frame;
    let covered = (0..with.material.len())
        .filter(|&i| {
            matches!(
                with.material[i],
                Material::LABEL_FILL | Material::LABEL_FRAME | Material::LABEL_TEXT
            )
        })
        .filter(|&i| bare.material[i] != Material::EMPTY)
        .count();
    assert_eq!(covered, 0);
}

#[test]
fn leaves_out_a_label_that_cannot_be_placed() {
    let labels = [label([0.0; 3], "Wide label"), label([0.0; 3], "Wide label")];
    let p = plates(
        &labels,
        &View {
            u: 2.0,
            ox: 40.0,
            oy: 8.0,
        },
        80.0,
        16.0,
    );
    assert!(p[0].is_some());
    assert!(p[1].is_none());
}

#[test]
fn draws_whole_plates() {
    let mut l = label([0.0, 0.0, 2.0], "Edge");
    l.b = [0.0, 0.0, 2.0];
    l.flags |= flags::HAS_TO;
    let blocks = [cuboid([0.0; 3], [6.0, 6.0, 2.0]), l.clone()];
    let out = painter(&blocks, 60.0, 40.0);
    let r = plates(
        &[l],
        &out.view,
        out.frame.width as f64,
        out.frame.height as f64,
    )[0]
    .expect("placed");
    let frame_pixels = out
        .frame
        .material
        .iter()
        .filter(|&&m| m == Material::LABEL_FRAME)
        .count() as f64;
    assert_eq!(frame_pixels, 2.0 * (r.x1 - r.x0) + 2.0 * (r.y1 - r.y0));
}

// ── Z-buffer ──────────────────────────────────────────────────────────────────

/// A bar passing through a taller block: no order of the two is right everywhere.
fn interlocking() -> [Block; 2] {
    let mut a = cuboid([0.0, 4.0, 1.0], [12.0, 2.0, 1.0]);
    let mut b = cuboid([5.0, 0.0, 0.0], [2.0, 12.0, 3.0]);
    a.tag = 1;
    b.tag = 2;
    [a, b]
}

const VIEW: View = View {
    u: 6.0,
    ox: 100.0,
    oy: 40.0,
};

fn frame_of(blocks: &[Block], depth: Depth) -> Frame {
    let mut f = Frame::new(200, 160);
    f.reset(200, 160, depth == Depth::ZBuffer);
    render_blocks(
        &mut f,
        blocks,
        &VIEW,
        &RenderOptions {
            labels: false,
            depth,
        },
        &mut Vec::new(),
    );
    f
}

/// Pixels where both blocks, drawn alone, put a face, with the tag of the nearer one (by more
/// than any bias).
fn nearer(a: &Block, b: &Block) -> Vec<(usize, u16)> {
    let fa = frame_of(std::slice::from_ref(a), Depth::ZBuffer);
    let fb = frame_of(std::slice::from_ref(b), Depth::ZBuffer);
    (0..fa.material.len())
        .filter(|&i| is_face(fa.material[i]) && is_face(fb.material[i]))
        .filter(|&i| (fa.depth[i] - fb.depth[i]).abs() > 1.0)
        .map(|i| {
            (
                i,
                if fa.depth[i] > fb.depth[i] {
                    a.tag
                } else {
                    b.tag
                },
            )
        })
        .collect()
}

#[test]
fn zbuffer_shows_the_nearer_face_in_either_order() {
    let [a, b] = interlocking();
    let expected = nearer(&a, &b);
    assert!(expected.iter().any(|e| e.1 == 1) && expected.iter().any(|e| e.1 == 2));
    for blocks in [[a.clone(), b.clone()], [b.clone(), a.clone()]] {
        let f = frame_of(&blocks, Depth::ZBuffer);
        for &(i, tag) in &expected {
            assert_eq!(f.tags[i], tag, "pixel {i}");
        }
    }
}

#[test]
fn painter_fails_where_the_zbuffer_does_not() {
    let [a, b] = interlocking();
    let expected = nearer(&a, &b);
    for blocks in [[a.clone(), b.clone()], [b.clone(), a.clone()]] {
        // Same key for both: painter's order is the list order.
        let f = frame_of(&blocks, Depth::Painter);
        assert!(expected.iter().any(|&(i, tag)| f.tags[i] != tag));
    }
}

#[test]
fn zbuffer_shows_a_decal_on_a_face_whatever_the_order() {
    let body = cuboid([0.0; 3], [4.0, 4.0, 4.0]);
    // A dot 0.02 off the right (+x) face.
    let mut decal = Block::new(BlockKind::Dot);
    decal.a = [4.02, 2.0, 2.0];
    decal.ink = Slot::ACCENT;
    let (x, y) = iso::project(decal.a, &VIEW);
    let at = |f: &Frame| f.material[y.round() as usize * f.width + x.round() as usize];
    for blocks in [[decal.clone(), body.clone()], [body.clone(), decal.clone()]] {
        assert_eq!(at(&frame_of(&blocks, Depth::ZBuffer)), Material::DOT);
    }
    // Behind the box, the same dot is hidden.
    let mut hidden = decal.clone();
    hidden.a = [-0.5, 2.0, 2.0];
    let (hx, hy) = iso::project(hidden.a, &VIEW);
    let f = frame_of(&[body, hidden], Depth::ZBuffer);
    assert_ne!(
        f.material[hy.round() as usize * f.width + hx.round() as usize],
        Material::DOT
    );
}

#[test]
fn zbuffer_keeps_a_box_outline_over_its_own_faces() {
    for size in [[6.0, 6.0, 6.0], [3.0, 7.0, 2.0], [9.0, 1.0, 5.0]] {
        let z = frame_of(&[cuboid([0.0; 3], size)], Depth::ZBuffer);
        let p = frame_of(&[cuboid([0.0; 3], size)], Depth::Painter);
        let edges = |f: &Frame| {
            (0..f.material.len())
                .filter(|&i| f.material[i] == Material::EDGE)
                .collect::<Vec<_>>()
        };
        assert_eq!(edges(&z), edges(&p), "{size:?}");
    }
}
