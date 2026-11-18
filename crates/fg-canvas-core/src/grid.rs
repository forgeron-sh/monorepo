//! A hashed uniform grid: the spatial index of the scene.
//!
//! The world is cut into square cells of `cell` world units. Each item is listed in every cell its
//! bounds touch; an item that would touch more than `MAX_CELLS` cells (a frame, a huge background)
//! goes to the `big` list instead, which every query scans. Cells live in a hash map, so the world
//! is unbounded and an empty region costs nothing.
//!
//! Why a grid and not an R-tree: canvas items are of similar sizes (nodes, stickies, tables), and
//! the hot writes are moves. On a grid a move that stays in the same cells is four stores, and one
//! that crosses a cell edge is a removal from a short list plus an append. An R-tree pays a delete
//! and a reinsert with rebalancing for every move, and is only better when sizes vary by orders of
//! magnitude, which the `big` list covers here.

use std::collections::HashMap;
use std::hash::{BuildHasherDefault, Hasher};

/// Beyond this many cells an item is kept in the `big` list.
pub const MAX_CELLS: i32 = 16;

/// The FxHash mix (rustc's), with a final fold: hashbrown takes the bucket from the low bits, and
/// a bare multiply leaves the low bits of a packed (cx, cy) key depending on `cy` alone, which
/// piles a whole column of cells into one probe chain.
#[derive(Default)]
pub struct Fx(u64);

impl Hasher for Fx {
    fn write(&mut self, bytes: &[u8]) {
        for &b in bytes {
            self.write_u64(b as u64);
        }
    }
    fn write_u64(&mut self, n: u64) {
        self.0 = (self.0.rotate_left(5) ^ n).wrapping_mul(0x517c_c1b7_2722_0a95);
    }
    fn finish(&self) -> u64 {
        self.0 ^ (self.0 >> 29)
    }
}

type FxMap<K, V> = HashMap<K, Vec<V>, BuildHasherDefault<Fx>>;

/// The cells an item covers, inclusive. `big` when it is in the big list.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Span {
    pub x0: i32,
    pub y0: i32,
    pub x1: i32,
    pub y1: i32,
}

impl Span {
    pub const BIG: Span = Span {
        x0: 1,
        y0: 1,
        x1: 0,
        y1: 0,
    };
    pub fn is_big(&self) -> bool {
        self.x1 < self.x0
    }
    pub fn cells(&self) -> i64 {
        (self.x1 - self.x0 + 1) as i64 * (self.y1 - self.y0 + 1) as i64
    }
}

#[inline]
fn key(cx: i32, cy: i32) -> u64 {
    ((cx as u32 as u64) << 32) | (cy as u32 as u64)
}

pub struct Grid {
    inv: f32,
    cells: FxMap<u64, u32>,
    pub big: Vec<u32>,
    /// Entries over all cell lists: with the number of cells, the mean length of a list.
    entries: usize,
}

impl Grid {
    pub fn new(cell: f32) -> Grid {
        Grid {
            inv: 1.0 / cell,
            cells: FxMap::default(),
            big: Vec::new(),
            entries: 0,
        }
    }

    /// The cells a rectangle covers, without the big-list cut-off.
    #[inline]
    pub fn range(&self, x: f32, y: f32, w: f32, h: f32) -> Span {
        Span {
            x0: (x * self.inv).floor() as i32,
            y0: (y * self.inv).floor() as i32,
            x1: ((x + w) * self.inv).floor() as i32,
            y1: ((y + h) * self.inv).floor() as i32,
        }
    }

    /// The span an item gets: its cells, or `BIG`.
    #[inline]
    pub fn span(&self, x: f32, y: f32, w: f32, h: f32) -> Span {
        let s = self.range(x, y, w, h);
        if s.cells() > MAX_CELLS as i64 {
            Span::BIG
        } else {
            s
        }
    }

    pub fn insert(&mut self, slot: u32, span: Span) {
        if span.is_big() {
            self.big.push(slot);
            return;
        }
        for cx in span.x0..=span.x1 {
            for cy in span.y0..=span.y1 {
                self.cells.entry(key(cx, cy)).or_default().push(slot);
            }
        }
        self.entries += span.cells() as usize;
    }

    pub fn remove(&mut self, slot: u32, span: Span) {
        if span.is_big() {
            if let Some(i) = self.big.iter().position(|&s| s == slot) {
                self.big.swap_remove(i);
            }
            return;
        }
        for cx in span.x0..=span.x1 {
            for cy in span.y0..=span.y1 {
                if let Some(list) = self.cells.get_mut(&key(cx, cy)) {
                    if let Some(i) = list.iter().position(|&s| s == slot) {
                        list.swap_remove(i);
                        self.entries -= 1;
                    }
                }
            }
        }
    }

    /// Calls `f` with every slot listed in the cells of `span` (an item may come more than once:
    /// the caller dedups), then with the big list.
    #[inline]
    pub fn visit(&self, span: Span, mut f: impl FnMut(u32)) {
        for cx in span.x0..=span.x1 {
            for cy in span.y0..=span.y1 {
                if let Some(list) = self.cells.get(&key(cx, cy)) {
                    for &s in list {
                        f(s);
                    }
                }
            }
        }
        for &s in &self.big {
            f(s);
        }
    }

    pub fn clear(&mut self) {
        self.cells.clear();
        self.big.clear();
        self.entries = 0;
    }

    /// About how many candidates a query over `span` visits: its cells times the mean list, plus
    /// the big list.
    pub fn estimate(&self, span: Span) -> usize {
        let mean = self.entries as f64 / self.cells.len().max(1) as f64;
        (span.cells() as f64 * mean) as usize + self.big.len()
    }

    /// Bytes held by the index, roughly: the lists and the table.
    pub fn bytes(&self) -> usize {
        let lists: usize = self.cells.values().map(|v| v.capacity() * 4 + 24).sum();
        lists + self.cells.capacity() * 9 + self.big.capacity() * 4
    }
}
