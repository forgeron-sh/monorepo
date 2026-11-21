//! WebAssembly SIMD (`simd128`) kernels of the per-pixel passes: shading and paint, 16 pixels at
//! a time (docs/blueprint/engine.md, "SIMD and size notes"). Each one computes exactly what the
//! scalar loop beside it does, bit for bit: integer lanes, and float compares only where the
//! compared values are exact in `f32` (no arithmetic on floats at all). The scalar loops stay
//! the reference: native builds and tests run them, and `self_test` (exported by the test module,
//! run by `packages/blueprint/test/parity/simd.test.ts`) compares both under WebAssembly.

use core::arch::wasm32::*;

/// Shades the pixels `0..n·16` of one row, `n = len / 16`; returns how many it shaded (the
/// caller shades the rest). `thresholds`: the row's Bayer thresholds, or `None` for flat shading
/// (`tone ≥ 0.5`).
///
/// Per pixel, as `shade`: empty → `NONE`; a shaded material (faces, field) → its ink when its
/// tone passes the threshold, else `BG`; any other material → its ink. A tone is an `f32` and
/// the compare runs in `f32`: the same answer as in `f64` when the threshold is exact in `f32`,
/// as those of sides 2, 4 and 8 are (`(v + 0.5) / n²`); otherwise this shades nothing.
pub fn shade_row(m: &[u8], k: &[u8], t: &[f32], c: &mut [u8], thresholds: Option<&[f64]>) -> usize {
    let len = m.len().min(k.len()).min(t.len()).min(c.len());
    let chunks = len / 16;
    let mut th = [0.5f32; 8];
    let flat = thresholds.is_none();
    let n = match thresholds {
        None => 4,
        Some(row) if matches!(row.len(), 2 | 4 | 8) => {
            for (d, &v) in th.iter_mut().zip(row) {
                *d = v as f32;
                if *d as f64 != v {
                    return 0;
                }
            }
            row.len()
        }
        Some(_) => return 0,
    };
    // The thresholds of the four lanes of each quarter of a 16-pixel chunk: a chunk starts at a
    // multiple of 16, so quarter q starts at 4q, and its lane i at (4q + i) mod n.
    let at = |i: usize| th[i % n];
    let even = f32x4(at(0), at(1), at(2), at(3));
    let odd = f32x4(at(4), at(5), at(6), at(7));
    let zero = u8x16_splat(0);
    let one = u8x16_splat(1);
    let three = u8x16_splat(3);
    let field = u8x16_splat(crate::Material::FIELD);
    let bg = u8x16_splat(crate::Slot::BG);
    for i in 0..chunks {
        let o = i * 16;
        // SAFETY: `o + 16 ≤ len` for every slice; unaligned loads and stores are allowed.
        unsafe {
            let mv = v128_load(m.as_ptr().add(o) as *const v128);
            let kv = v128_load(k.as_ptr().add(o) as *const v128);
            let tp = t.as_ptr().add(o) as *const v128;
            let (t0, t1, t2, t3) = (
                v128_load(tp),
                v128_load(tp.add(1)),
                v128_load(tp.add(2)),
                v128_load(tp.add(3)),
            );
            let pass = |t: v128, th: v128| {
                if flat {
                    f32x4_ge(t, th)
                } else {
                    f32x4_gt(t, th)
                }
            };
            // Lane masks (all ones or zero) narrowed to bytes: saturation keeps -1 and 0.
            let on = i8x16_narrow_i16x8(
                i16x8_narrow_i32x4(pass(t0, even), pass(t1, odd)),
                i16x8_narrow_i32x4(pass(t2, even), pass(t3, odd)),
            );
            // FACE_TOP, FACE_LEFT, FACE_RIGHT (1..=3: m − 1 < 3 unsigned) or FIELD.
            let shaded = v128_or(u8x16_lt(u8x16_sub(mv, one), three), u8x16_eq(mv, field));
            let face = v128_bitselect(kv, bg, on);
            let out = v128_bitselect(face, kv, shaded);
            let out = v128_andnot(out, u8x16_eq(mv, zero));
            v128_store(c.as_mut_ptr().add(o) as *mut v128, out);
        }
    }
    chunks * 16
}

/// Paints the RGBA of `color[..n·16]`, `n = len / 16`, into `out` (4 bytes a pixel); returns how
/// many pixels it painted. `table`: the 8 slots × RGBA (slot 0 all zero), as `paint` reads them:
/// slots above 7 are transparent.
pub fn paint(color: &[u8], table: &[u8; 32], out: &mut [u8]) -> usize {
    let chunks = color.len().min(out.len() / 4) / 16;
    // SAFETY: `table` is 32 bytes.
    let (lo, hi) = unsafe {
        let p = table.as_ptr() as *const v128;
        (v128_load(p), v128_load(p.add(1)))
    };
    let eight = u8x16_splat(8);
    let sixteen = u8x16_splat(16);
    let channel = u8x16(0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3);
    for i in 0..chunks {
        let o = i * 16;
        // SAFETY: `o + 16 ≤ color.len()` and `4·(o + 16) ≤ out.len()`.
        unsafe {
            let cv = v128_load(color.as_ptr().add(o) as *const v128);
            // A slot's first byte in `table`; every slot above 7 lands past it (32..=35).
            let base = u8x16_shl(u8x16_min(cv, eight), 2);
            let dst = out.as_mut_ptr().add(o * 4) as *mut v128;
            let spread = [
                i8x16(0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3),
                i8x16(4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7),
                i8x16(8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 11),
                i8x16(
                    12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15,
                ),
            ];
            for (q, s) in spread.into_iter().enumerate() {
                let idx = u8x16_add(i8x16_swizzle(base, s), channel);
                // An index of 16 or more selects zero: `lo` serves 0..16, `hi` 16..32 (below
                // 16, `idx − 16` wraps past 16 too).
                let px = v128_or(
                    i8x16_swizzle(lo, idx),
                    i8x16_swizzle(hi, u8x16_sub(idx, sixteen)),
                );
                v128_store(dst.add(q), px);
            }
        }
    }
    chunks * 16
}

/// Stores `v` (16 bytes) over `dst[..len]` (`len` bytes, `lane`-byte lanes, `len` a multiple of
/// `lane`): whole vectors, then one more ending at `len` (it overlaps the last one: the same
/// value), or lane by lane when `len` is under 16 bytes.
///
/// # Safety
/// `dst..dst + len` is writable.
#[inline(always)]
unsafe fn splat_run(dst: *mut u8, len: usize, v: v128, lane: usize) {
    if len >= 16 {
        let mut o = 0;
        while o + 16 <= len {
            v128_store(dst.add(o) as *mut v128, v);
            o += 16;
        }
        if o < len {
            v128_store(dst.add(len - 16) as *mut v128, v);
        }
    } else {
        let mut o = 0;
        if len - o >= 8 {
            v128_store64_lane::<0>(v, dst.add(o) as *mut u64);
            o += 8;
        }
        if len - o >= 4 {
            v128_store32_lane::<0>(v, dst.add(o) as *mut u32);
            o += 4;
        }
        if len - o >= 2 && lane <= 2 {
            v128_store16_lane::<0>(v, dst.add(o) as *mut u16);
            o += 2;
        }
        if len - o >= 1 && lane == 1 {
            v128_store8_lane::<0>(v, dst.add(o));
        }
    }
}

/// `write_run` of the frame: the same value over the pixels `from..to` of its four buffers,
/// with vector stores (the four `fill`s of the scalar code call `memory.fill` or loop, slow on
/// the short runs of a face's row).
pub fn write_run(
    material: &mut [u8],
    ink: &mut [u8],
    tone: &mut [f32],
    tags: &mut [u16],
    (from, to): (usize, usize),
    (m, k, t, tag): (u8, u8, f32, u16),
) {
    // The bounds checks the scalar `fill`s make.
    let (material, ink) = (&mut material[from..to], &mut ink[from..to]);
    let (tone, tags) = (&mut tone[from..to], &mut tags[from..to]);
    let n = to - from;
    // SAFETY: each slice holds `n` lanes.
    unsafe {
        splat_run(material.as_mut_ptr(), n, u8x16_splat(m), 1);
        splat_run(ink.as_mut_ptr(), n, u8x16_splat(k), 1);
        splat_run(tone.as_mut_ptr() as *mut u8, n * 4, f32x4_splat(t), 4);
        splat_run(tags.as_mut_ptr() as *mut u8, n * 2, u16x8_splat(tag), 2);
    }
}

/// Compares every SIMD kernel with the scalar code it replaces on generated cases (lengths
/// around the 16-pixel chunks, every material and slot, tones on, beside and between the
/// thresholds, NaN); returns the number of cases that differ.
pub fn self_test() -> u32 {
    use crate::paint::{paint_from, rgba_table};
    use crate::shade::{shade_from, Bayer};
    let mut seed = 0x2545_f491_4f6c_dd1du64;
    let mut next = move || {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        seed
    };
    let tones = [
        0.0f32,
        0.5,
        1.0,
        -0.0,
        0.03125,
        0.0625,
        0.09375,
        0.46875,
        0.53125,
        f32::NAN,
    ];
    let mut bad = 0;
    let bayers = [Bayer::new(2), Bayer::new(4), Bayer::new(8)];
    for case in 0..400usize {
        let len = case % 70;
        let m: Vec<u8> = (0..len).map(|_| (next() % 12) as u8).collect();
        let k: Vec<u8> = (0..len).map(|_| (next() % 9) as u8).collect();
        let t: Vec<f32> = (0..len)
            .map(|_| match next() % 3 {
                0 => tones[(next() % tones.len() as u64) as usize],
                _ => (next() % 1000) as f32 / 999.0,
            })
            .collect();
        for which in 0..4 {
            let th = (which > 0).then(|| bayers[which - 1].row(case));
            let mut want = vec![0xaa; len];
            shade_from(&m, &k, &t, &mut want, th, 0);
            let mut got = vec![0x55; len];
            let done = shade_row(&m, &k, &t, &mut got, th);
            shade_from(&m, &k, &t, &mut got, th, done);
            bad += u32::from(want != got || done != len / 16 * 16);
        }
        let palette: [u8; 21] = core::array::from_fn(|_| next() as u8);
        let table = rgba_table(&palette);
        let mut want = vec![0xaa; len * 4];
        paint_from(&k, &table, &mut want, 0);
        let mut got = vec![0x55; len * 4];
        let done = paint(&k, &table, &mut got);
        paint_from(&k, &table, &mut got, done);
        bad += u32::from(want != got || done != len / 16 * 16);
        let n = 80;
        let (from, to) = (case % 23, (case % 23 + len).min(n));
        let (mv, kv, tv, tag) = (
            next() as u8,
            next() as u8,
            t.first().copied(),
            next() as u16,
        );
        let tv = tv.unwrap_or(0.25);
        let mut a = (vec![1u8; n], vec![2u8; n], vec![3.0f32; n], vec![4u16; n]);
        let mut b = a.clone();
        a.0[from..to].fill(mv);
        a.1[from..to].fill(kv);
        a.2[from..to].fill(tv);
        a.3[from..to].fill(tag);
        write_run(
            &mut b.0,
            &mut b.1,
            &mut b.2,
            &mut b.3,
            (from, to),
            (mv, kv, tv, tag),
        );
        let same_tone =
            a.2.iter()
                .zip(&b.2)
                .all(|(x, y)| x.to_bits() == y.to_bits());
        bad += u32::from(a.0 != b.0 || a.1 != b.1 || !same_tone || a.3 != b.3);
    }
    bad
}
