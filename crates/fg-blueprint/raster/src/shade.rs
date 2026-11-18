//! Shading (`core/shade.ts` and `core/bayer.ts`): every pixel to a palette slot; faces dithered
//! by Bayer or flat, the rest keep their ink; an optional dithered halo around accent pixels.

use crate::raster::frame::{is_label, is_shaded};
use crate::raster::{Frame, Slot};

/// The Bayer matrix of side `n` (2, 4 or 8): `B(2n) = [4B, 4B + 2; 4B + 3, 4B + 1]`.
pub fn matrix(n: usize) -> Vec<u8> {
    let mut size = 1;
    let mut m = vec![0u8];
    while size < n {
        let row = size * 2;
        let mut next = vec![0u8; row * row];
        for y in 0..size {
            for x in 0..size {
                let b = 4 * m[y * size + x];
                next[y * row + x] = b;
                next[y * row + x + size] = b + 2;
                next[(y + size) * row + x] = b + 3;
                next[(y + size) * row + x + size] = b + 1;
            }
        }
        m = next;
        size *= 2;
    }
    m
}

/// Thresholds of a matrix in `[0, 1)`, as `bayer(x, y, n)`.
pub struct Bayer {
    n: usize,
    t: Vec<f64>,
}

impl Bayer {
    pub fn new(n: usize) -> Self {
        let m = matrix(n);
        let t = m
            .iter()
            .map(|&v| (v as f64 + 0.5) / (n * n) as f64)
            .collect();
        Self { n, t }
    }

    /// The thresholds of row `y`, tiled every `n` pixels.
    #[inline]
    pub fn row(&self, y: usize) -> &[f64] {
        let r = (y & (self.n - 1)) * self.n;
        &self.t[r..r + self.n]
    }

    #[inline]
    pub fn at(&self, x: usize, y: usize) -> f64 {
        self.t[(y & (self.n - 1)) * self.n + (x & (self.n - 1))]
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Glow {
    /// Whole raster pixels, 1 or more.
    pub radius: i64,
    pub density: f64,
}

/// Resolves `f.color` from materials, inks and tones.
pub fn shade(f: &mut Frame, dither: Option<usize>, glow: Option<Glow>) {
    let w = f.width;
    let bayer = dither.map(Bayer::new);
    let Frame {
        material,
        ink,
        tone,
        color,
        ..
    } = f;
    for (y, ((m, k), (t, c))) in material
        .chunks_exact(w.max(1))
        .zip(ink.chunks_exact(w.max(1)))
        .zip(
            tone.chunks_exact(w.max(1))
                .zip(color.chunks_exact_mut(w.max(1))),
        )
        .enumerate()
    {
        let thresholds = bayer.as_ref().map(|b| b.row(y));
        for x in 0..w {
            let mx = m[x];
            c[x] = if mx == 0 {
                Slot::NONE
            } else if is_shaded(mx) {
                let tx = t[x] as f64;
                let on = match thresholds {
                    Some(row) => tx > row[x & (row.len() - 1)],
                    None => tx >= 0.5,
                };
                if on {
                    k[x]
                } else {
                    Slot::BG
                }
            } else {
                k[x]
            };
        }
    }
    if let Some(g) = glow {
        halo(f, g.radius, g.density);
    }
}

fn halo(f: &mut Frame, radius: i64, density: f64) {
    let (w, h) = (f.width as i64, f.height as i64);
    let source = f.color.clone();
    let b4 = Bayer::new(4);
    for y in 0..h {
        for x in 0..w {
            let i = (y * w + x) as usize;
            let c = f.color[i];
            if c != Slot::NONE && c != Slot::BG {
                continue;
            }
            if is_label(f.material[i]) {
                continue;
            }
            let mut best = 0.0;
            let mut from = Slot::NONE;
            for dy in -radius..=radius {
                let yy = y + dy;
                if yy < 0 || yy >= h {
                    continue;
                }
                for dx in -radius..=radius {
                    let xx = x + dx;
                    if xx < 0 || xx >= w || (dx == 0 && dy == 0) {
                        continue;
                    }
                    let s = source[(yy * w + xx) as usize];
                    if s != Slot::ACCENT && s != Slot::SIGNAL && s != Slot::ALERT {
                        continue;
                    }
                    let d = dx.abs().max(dy.abs()) as f64;
                    let strength = density * (1.0 - (d - 1.0) / radius as f64);
                    if strength > best {
                        best = strength;
                        from = s;
                    }
                }
            }
            if best > 0.0 && best > b4.at(x as usize, y as usize) {
                f.color[i] = from;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bayer_tables() {
        assert_eq!(
            matrix(4),
            vec![0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
        );
        let m8 = matrix(8);
        assert_eq!(
            &m8[..16],
            &[0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26]
        );
        assert_eq!(&m8[56..], &[63, 31, 55, 23, 61, 29, 53, 21]);
    }

    #[test]
    fn thresholds_inside_zero_one_and_tiled() {
        for n in [2usize, 4, 8] {
            let b = Bayer::new(n);
            let mut seen: Vec<f64> = (0..n * n).map(|i| b.at(i % n, i / n)).collect();
            seen.sort_by(f64::total_cmp);
            seen.dedup();
            assert_eq!(seen.len(), n * n);
            assert!(seen[0] > 0.0 && seen[n * n - 1] < 1.0);
            assert_eq!(b.at(n + 1, n + 2), b.at(1, 2));
        }
    }
}
