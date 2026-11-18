//! The document of a scene and its queries, in plain Rust (no wasm-bindgen): testable natively.
//!
//! Items live in slots, addressed by a `u32` the JavaScript side maps to its string ids. Each slot
//! is one 32-byte record (bounds, z, kind, flags, rank): a query tests candidates that come from
//! the grid in no particular order, and one record is one cache line touched, where a struct of
//! arrays would touch six. A stacking order (`order`, bottom first) is kept sorted lazily: moves
//! do not touch it, a change of z or an add marks it dirty and the next query sorts once.

use crate::grid::{Grid, Span};

pub const NONE: u32 = u32::MAX;

pub const FLAG_LOCKED: u32 = 1;
pub const FLAG_HIDDEN: u32 = 2;
pub const FLAG_UNSELECTABLE: u32 = 4;
pub const FLAG_SELECTED: u32 = 8;
const FLAG_ALIVE: u32 = 1 << 31;

/// Above one candidate in `SCAN_RATIO` items, a query scans instead of visiting the grid.
const SCAN_RATIO: usize = 8;

/// Floats per item in the instance buffer: x, y, w, h (world), kind, flags.
pub const STRIDE: usize = 6;
/// Floats per item in the load buffer: x, y, w, h, kind, z.
pub const LOAD_STRIDE: usize = 6;

#[derive(Clone, Copy, Default)]
#[repr(C)]
struct Rec {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    z: f32,
    kind: u32,
    flags: u32,
    /// The position of the slot in `order`, when the order is clean.
    rank: u32,
}

impl Rec {
    #[inline]
    fn alive(&self) -> bool {
        self.flags & FLAG_ALIVE != 0
    }
    #[inline]
    fn touches(&self, rx: f32, ry: f32, rw: f32, rh: f32) -> bool {
        rx <= self.x + self.w && rx + rw >= self.x && ry <= self.y + self.h && ry + rh >= self.y
    }
    #[inline]
    fn inside(&self, rx: f32, ry: f32, rw: f32, rh: f32) -> bool {
        self.x >= rx && self.y >= ry && self.x + self.w <= rx + rw && self.y + self.h <= ry + rh
    }
    #[inline]
    fn holds(&self, px: f32, py: f32) -> bool {
        px >= self.x && px <= self.x + self.w && py >= self.y && py <= self.y + self.h
    }
}

pub struct Scene {
    recs: Vec<Rec>,
    span: Vec<Span>,
    /// One bit per rank, for gathering in stacking order.
    marks: Vec<u64>,
    free: Vec<u32>,
    grid: Grid,
    /// Live slots, bottom of the stack first, when `!order_dirty`.
    order: Vec<u32>,
    order_dirty: bool,
    live: usize,
    /// The answer of the last query that returns slots.
    pub out: Vec<u32>,
    /// The instance buffer of the last frame, `STRIDE` floats per visible item.
    pub instances: Vec<f32>,
    /// Where JavaScript writes the items of a bulk load.
    pub staging: Vec<f32>,
    /// Where JavaScript writes the slots of a bulk command (a move).
    pub slots_in: Vec<u32>,
}

impl Scene {
    pub fn new(cell: f32) -> Scene {
        Scene {
            recs: Vec::new(),
            span: Vec::new(),
            marks: Vec::new(),
            free: Vec::new(),
            grid: Grid::new(cell),
            order: Vec::new(),
            order_dirty: false,
            live: 0,
            out: Vec::new(),
            instances: Vec::new(),
            staging: Vec::new(),
            slots_in: Vec::new(),
        }
    }

    pub fn len(&self) -> usize {
        self.live
    }

    pub fn is_empty(&self) -> bool {
        self.live == 0
    }

    pub fn clear(&mut self) {
        self.recs.clear();
        self.span.clear();
        self.free.clear();
        self.grid.clear();
        self.order.clear();
        self.live = 0;
        self.order_dirty = false;
    }

    #[allow(clippy::too_many_arguments)]
    pub fn add(&mut self, x: f32, y: f32, w: f32, h: f32, kind: u32, z: f32, flags: u32) -> u32 {
        let span = self.grid.span(x, y, w, h);
        let rec = Rec {
            x,
            y,
            w,
            h,
            z,
            kind,
            flags: flags | FLAG_ALIVE,
            rank: 0,
        };
        let slot = match self.free.pop() {
            Some(s) => {
                self.recs[s as usize] = rec;
                self.span[s as usize] = span;
                s
            }
            None => {
                self.recs.push(rec);
                self.span.push(span);
                (self.recs.len() - 1) as u32
            }
        };
        self.grid.insert(slot, span);
        self.live += 1;
        self.order_dirty = true;
        slot
    }

    /// Replaces the document with `n` items read from `staging` (`LOAD_STRIDE` floats each). The
    /// slots are 0..n in the order given.
    pub fn load_staging(&mut self, n: usize) {
        self.clear();
        self.recs.reserve(n);
        self.span.reserve(n);
        for i in 0..n {
            let b = &self.staging[i * LOAD_STRIDE..i * LOAD_STRIDE + LOAD_STRIDE];
            let (x, y, w, h, kind, z) = (b[0], b[1], b[2], b[3], b[4] as u32, b[5]);
            self.add(x, y, w, h, kind, z, 0);
        }
    }

    #[inline]
    pub fn alive(&self, slot: u32) -> bool {
        self.recs.get(slot as usize).is_some_and(Rec::alive)
    }

    pub fn remove(&mut self, slot: u32) -> bool {
        if !self.alive(slot) {
            return false;
        }
        let i = slot as usize;
        self.grid.remove(slot, self.span[i]);
        self.recs[i].flags = 0;
        self.free.push(slot);
        self.live -= 1;
        self.order_dirty = true;
        true
    }

    pub fn set_bounds(&mut self, slot: u32, x: f32, y: f32, w: f32, h: f32) -> bool {
        if !self.alive(slot) {
            return false;
        }
        let i = slot as usize;
        let span = self.grid.span(x, y, w, h);
        if span != self.span[i] {
            self.grid.remove(slot, self.span[i]);
            self.grid.insert(slot, span);
            self.span[i] = span;
        }
        let r = &mut self.recs[i];
        (r.x, r.y, r.w, r.h) = (x, y, w, h);
        true
    }

    /// Moves every slot of `slots_in[..n]` by (dx, dy). Returns how many moved.
    pub fn move_many(&mut self, n: usize, dx: f32, dy: f32) -> usize {
        let mut moved = 0;
        for k in 0..n {
            let slot = self.slots_in[k];
            let Some(&r) = self.recs.get(slot as usize) else {
                continue;
            };
            if !r.alive() || r.flags & FLAG_LOCKED != 0 {
                continue;
            }
            self.set_bounds(slot, r.x + dx, r.y + dy, r.w, r.h);
            moved += 1;
        }
        moved
    }

    pub fn set_z(&mut self, slot: u32, z: f32) -> bool {
        if !self.alive(slot) {
            return false;
        }
        self.recs[slot as usize].z = z;
        self.order_dirty = true;
        true
    }

    pub fn set_flags(&mut self, slot: u32, flags: u32) -> bool {
        if !self.alive(slot) {
            return false;
        }
        self.recs[slot as usize].flags = flags | FLAG_ALIVE;
        true
    }

    pub fn bounds(&self, slot: u32) -> Option<[f32; 4]> {
        let r = self.recs.get(slot as usize)?;
        r.alive().then_some([r.x, r.y, r.w, r.h])
    }

    pub fn z(&self, slot: u32) -> Option<f32> {
        let r = self.recs.get(slot as usize)?;
        r.alive().then_some(r.z)
    }

    /// Slots ever used, live or free.
    pub fn slots(&self) -> u32 {
        self.recs.len() as u32
    }

    fn ensure_order(&mut self) {
        if !self.order_dirty {
            return;
        }
        let recs = &mut self.recs;
        self.order.clear();
        self.order
            .extend((0..recs.len() as u32).filter(|&s| recs[s as usize].alive()));
        // Stable on equal z: the slot (insertion order of a load) breaks ties, as the TypeScript
        // engine's stable sort does.
        self.order.sort_unstable_by(|&a, &b| {
            recs[a as usize]
                .z
                .total_cmp(&recs[b as usize].z)
                .then(a.cmp(&b))
        });
        for (r, &s) in self.order.iter().enumerate() {
            recs[s as usize].rank = r as u32;
        }
        self.order_dirty = false;
    }

    /// The top-most selectable item under a world point, or `NONE`.
    pub fn hit(&mut self, px: f32, py: f32) -> u32 {
        self.ensure_order();
        let span = self.grid.range(px, py, 0.0, 0.0);
        let mut best = NONE;
        let mut best_rank = 0u32;
        let recs = &self.recs;
        self.grid.visit(span, |s| {
            let r = &recs[s as usize];
            if r.flags & (FLAG_HIDDEN | FLAG_UNSELECTABLE) == 0
                && r.holds(px, py)
                && (best == NONE || r.rank > best_rank)
            {
                best = s;
                best_rank = r.rank;
            }
        });
        best
    }

    /// Selectable, unlocked items a rectangle touches (`contain` false) or holds whole, into `out`
    /// in stacking order. Returns the count.
    pub fn in_rect(&mut self, rx: f32, ry: f32, rw: f32, rh: f32, contain: bool) -> usize {
        let skip = FLAG_LOCKED | FLAG_HIDDEN | FLAG_UNSELECTABLE;
        if contain {
            self.gather(rx, ry, rw, rh, |r| {
                r.flags & skip == 0 && r.inside(rx, ry, rw, rh)
            })
        } else {
            self.gather(rx, ry, rw, rh, |r| {
                r.flags & skip == 0 && r.touches(rx, ry, rw, rh)
            })
        }
    }

    /// The items a world rectangle shows, into `out`, bottom first.
    ///
    /// A candidate from the grid costs a random access (a cache miss on a large scene); an item
    /// of the stacking order costs a sequential one, several times cheaper. So when the grid would
    /// visit more than an eighth of the items, scanning the order wins, and it does.
    fn gather(&mut self, rx: f32, ry: f32, rw: f32, rh: f32, keep: impl Fn(&Rec) -> bool) -> usize {
        self.ensure_order();
        let span = self.grid.range(rx, ry, rw, rh);
        let mut out = std::mem::take(&mut self.out);
        out.clear();
        let recs = &self.recs;
        if self.grid.estimate(span) * SCAN_RATIO > self.live {
            out.extend(
                self.order
                    .iter()
                    .copied()
                    .filter(|&s| keep(&recs[s as usize])),
            );
        } else {
            // Mark the rank of each item kept in a bitmap, then read the bitmap in order: the
            // answer comes out in stacking order without a sort, and a duplicate (an item listed
            // in several cells) sets the same bit.
            let mut marks = std::mem::take(&mut self.marks);
            marks.resize(self.live.div_ceil(64), 0);
            self.grid.visit(span, |s| {
                let r = &recs[s as usize];
                let (word, bit) = ((r.rank >> 6) as usize, 1u64 << (r.rank & 63));
                if marks[word] & bit == 0 && keep(r) {
                    marks[word] |= bit;
                }
            });
            for (w, word) in marks.iter_mut().enumerate() {
                let mut m = *word;
                *word = 0;
                while m != 0 {
                    out.push(self.order[(w << 6) | m.trailing_zeros() as usize]);
                    m &= m - 1;
                }
            }
            self.marks = marks;
        }
        let n = out.len();
        self.out = out;
        n
    }

    /// Culling: the visible items of a viewport (`screen = world * zoom + (vx, vy)`, a surface of
    /// sw × sh pixels, a margin in pixels), into `out`, bottom first.
    pub fn cull(&mut self, vx: f32, vy: f32, zoom: f32, sw: f32, sh: f32, margin: f32) -> usize {
        let m = margin / zoom;
        let (rx, ry, rw, rh) = (
            -vx / zoom - m,
            -vy / zoom - m,
            sw / zoom + 2.0 * m,
            sh / zoom + 2.0 * m,
        );
        self.gather(rx, ry, rw, rh, |r| {
            r.flags & FLAG_HIDDEN == 0 && r.touches(rx, ry, rw, rh)
        })
    }

    /// Culls, then writes the instance buffer of the visible items (`STRIDE` floats each, world
    /// units: the shader applies the camera). Returns the count.
    pub fn frame(&mut self, vx: f32, vy: f32, zoom: f32, sw: f32, sh: f32, margin: f32) -> usize {
        let n = self.cull(vx, vy, zoom, sw, sh, margin);
        let mut buf = std::mem::take(&mut self.instances);
        buf.clear();
        buf.reserve(n * STRIDE);
        for &s in &self.out {
            let r = &self.recs[s as usize];
            buf.extend_from_slice(&[
                r.x,
                r.y,
                r.w,
                r.h,
                r.kind as f32,
                (r.flags & !FLAG_ALIVE) as f32,
            ]);
        }
        self.instances = buf;
        n
    }

    /// Bytes held by the document and its index (capacities, not lengths).
    pub fn bytes(&self) -> usize {
        let u = |v: &Vec<u32>| v.capacity() * 4;
        self.recs.capacity() * std::mem::size_of::<Rec>()
            + self.span.capacity() * std::mem::size_of::<Span>()
            + self.marks.capacity() * 8
            + u(&self.free)
            + u(&self.order)
            + u(&self.out)
            + self.instances.capacity() * 4
            + self.staging.capacity() * 4
            + u(&self.slots_in)
            + self.grid.bytes()
    }
}

#[cfg(test)]
#[allow(clippy::too_many_arguments)]
fn intersects(ax: f32, ay: f32, aw: f32, ah: f32, bx: f32, by: f32, bw: f32, bh: f32) -> bool {
    ax <= bx + bw && ax + aw >= bx && ay <= by + bh && ay + ah >= by
}

#[cfg(test)]
mod tests {
    use super::*;

    fn two() -> Scene {
        let mut s = Scene::new(256.0);
        s.add(0.0, 0.0, 100.0, 60.0, 0, 0.0, 0);
        s.add(200.0, 0.0, 100.0, 60.0, 0, 1.0, 0);
        s
    }

    #[test]
    fn hits_the_top_most() {
        let mut s = two();
        assert_eq!(s.hit(210.0, 10.0), 1);
        assert_eq!(s.hit(150.0, 10.0), NONE);
        let c = s.add(0.0, 0.0, 10.0, 10.0, 0, -1.0, 0);
        assert_eq!(s.hit(5.0, 5.0), 0);
        s.set_z(c, 5.0);
        assert_eq!(s.hit(5.0, 5.0), c);
        s.set_flags(c, FLAG_UNSELECTABLE);
        assert_eq!(s.hit(5.0, 5.0), 0);
    }

    #[test]
    fn selects_by_box_and_skips_locked() {
        let mut s = two();
        assert_eq!(s.in_rect(-10.0, -10.0, 120.0, 100.0, false), 1);
        assert_eq!(s.out, vec![0]);
        assert_eq!(s.in_rect(-10.0, -10.0, 400.0, 100.0, true), 2);
        assert_eq!(s.in_rect(50.0, 0.0, 10.0, 10.0, true), 0);
        s.set_flags(0, FLAG_LOCKED);
        assert_eq!(s.in_rect(-10.0, -10.0, 400.0, 100.0, false), 1);
        assert_eq!(s.out, vec![1]);
    }

    #[test]
    fn culls_like_the_contract() {
        let mut s = two();
        assert_eq!(s.cull(-150.0, 0.0, 1.0, 100.0, 100.0, 0.0), 1);
        assert_eq!(s.out, vec![1]);
        assert_eq!(s.frame(0.0, 0.0, 1.0, 800.0, 600.0, 0.0), 2);
        assert_eq!(&s.instances[6..10], &[200.0, 0.0, 100.0, 60.0]);
    }

    #[test]
    fn moves_across_cells_and_removes() {
        let mut s = two();
        s.slots_in = vec![0];
        assert_eq!(s.move_many(1, 1000.0, 1000.0), 1);
        assert_eq!(s.hit(10.0, 10.0), NONE);
        assert_eq!(s.hit(1010.0, 1010.0), 0);
        assert!(s.remove(0));
        assert_eq!(s.hit(1010.0, 1010.0), NONE);
        assert_eq!(s.len(), 1);
        let again = s.add(5.0, 5.0, 1.0, 1.0, 0, 9.0, 0);
        assert_eq!(again, 0, "a freed slot is reused");
    }

    #[test]
    fn keeps_huge_items_in_the_big_list() {
        let mut s = two();
        let bg = s.add(-10_000.0, -10_000.0, 20_000.0, 20_000.0, 1, -5.0, 0);
        assert_eq!(s.hit(5000.0, 5000.0), bg);
        assert_eq!(s.hit(10.0, 10.0), 0);
        assert_eq!(s.cull(-4000.0, -4000.0, 1.0, 100.0, 100.0, 0.0), 1);
    }

    /// The grid answers exactly what a scan answers, on a random scene with random edits.
    #[test]
    fn agrees_with_a_linear_scan() {
        let mut seed = 42u64;
        let mut rnd = move || {
            seed ^= seed << 13;
            seed ^= seed >> 7;
            seed ^= seed << 17;
            (seed % 10_000) as f32 / 10_000.0
        };
        let mut s = Scene::new(128.0);
        for k in 0..3000 {
            let w = 10.0 + rnd() * if k % 50 == 0 { 3000.0 } else { 200.0 };
            s.add(
                rnd() * 20_000.0 - 10_000.0,
                rnd() * 20_000.0 - 10_000.0,
                w,
                10.0 + rnd() * 150.0,
                0,
                (k % 97) as f32,
                0,
            );
        }
        for k in 0..500u32 {
            let slot = (rnd() * 2999.0) as u32;
            if k % 3 == 0 {
                s.slots_in = vec![slot];
                s.move_many(1, rnd() * 900.0 - 450.0, rnd() * 900.0 - 450.0);
            } else if k % 7 == 0 {
                s.remove(slot);
            }
        }
        for _ in 0..300 {
            let (px, py) = (rnd() * 20_000.0 - 10_000.0, rnd() * 20_000.0 - 10_000.0);
            let mut best = NONE;
            let mut best_key = (f32::MIN, 0u32);
            for i in 0..s.slots() {
                if let Some([x, y, w, h]) = s.bounds(i) {
                    let key = (s.z(i).unwrap(), i);
                    if px >= x
                        && px <= x + w
                        && py >= y
                        && py <= y + h
                        && (best == NONE
                            || key.0 > best_key.0
                            || (key.0 == best_key.0 && key.1 > best_key.1))
                    {
                        best = i;
                        best_key = key;
                    }
                }
            }
            assert_eq!(s.hit(px, py), best);
            let (rx, ry, rw, rh) = (px, py, rnd() * 3000.0, rnd() * 3000.0);
            let mut expect: Vec<u32> = (0..s.slots())
                .filter(|&i| {
                    s.bounds(i)
                        .is_some_and(|[x, y, w, h]| intersects(rx, ry, rw, rh, x, y, w, h))
                })
                .collect();
            s.in_rect(rx, ry, rw, rh, false);
            let mut got = s.out.clone();
            expect.sort_unstable();
            got.sort_unstable();
            assert_eq!(got, expect);
        }
    }
}
