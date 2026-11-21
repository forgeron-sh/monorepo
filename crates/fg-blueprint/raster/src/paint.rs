//! RGBA of a shaded frame (`paint` of `core/palette.ts`): transparent where nothing was drawn.

/// `palette` holds the seven slots from `bg`, three bytes each.
pub fn paint(color: &[u8], palette: &[u8; 21], out: &mut Vec<u8>) {
    // Every byte is written below: no clear first.
    out.resize(color.len() * 4, 0);
    let table = rgba_table(palette);
    #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
    let done = crate::simd::paint(color, &table, out);
    #[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
    let done = 0;
    paint_from(color, &table, out, done);
}

/// Slot × RGBA: slot 0 (and every slot above 7) is transparent.
pub fn rgba_table(palette: &[u8; 21]) -> [u8; 32] {
    let mut table = [0u8; 32];
    for s in 1..8 {
        let k = (s - 1) * 3;
        table[s * 4..s * 4 + 3].copy_from_slice(&palette[k..k + 3]);
        table[s * 4 + 3] = 255;
    }
    table
}

/// The scalar paint of the pixels `from..`: the reference of the SIMD pass.
pub fn paint_from(color: &[u8], table: &[u8; 32], out: &mut [u8], from: usize) {
    for (&c, px) in color[from..]
        .iter()
        .zip(out[from * 4..].chunks_exact_mut(4))
    {
        let k = if c > 7 { 0 } else { c as usize * 4 };
        px.copy_from_slice(&table[k..k + 4]);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// `paint` of `core/palette.ts`, as the module did it before its table.
    fn reference(color: &[u8], palette: &[u8; 21]) -> Vec<u8> {
        let mut out = vec![0; color.len() * 4];
        for (i, &c) in color.iter().enumerate() {
            if c == 0 || c > 7 {
                continue;
            }
            let k = (c as usize - 1) * 3;
            out[i * 4..i * 4 + 3].copy_from_slice(&palette[k..k + 3]);
            out[i * 4 + 3] = 255;
        }
        out
    }

    #[test]
    fn every_slot_and_length() {
        let palette: [u8; 21] = core::array::from_fn(|i| (i * 11 + 3) as u8);
        let mut out = vec![9; 7];
        for len in [0usize, 1, 15, 16, 17, 33, 100, 257] {
            let color: Vec<u8> = (0..len).map(|i| (i * 7 % 13) as u8).collect();
            paint(&color, &palette, &mut out);
            assert_eq!(out, reference(&color, &palette), "{len} pixels");
        }
    }
}
