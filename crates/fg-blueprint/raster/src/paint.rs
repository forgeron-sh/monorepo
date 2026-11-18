//! RGBA of a shaded frame (`paint` of `core/palette.ts`): transparent where nothing was drawn.

/// `palette` holds the seven slots from `bg`, three bytes each.
pub fn paint(color: &[u8], palette: &[u8; 21], out: &mut Vec<u8>) {
    out.clear();
    out.resize(color.len() * 4, 0);
    for (i, &c) in color.iter().enumerate() {
        if c == 0 || c > 7 {
            continue;
        }
        let k = (c as usize - 1) * 3;
        let o = i * 4;
        out[o] = palette[k];
        out[o + 1] = palette[k + 1];
        out[o + 2] = palette[k + 2];
        out[o + 3] = 255;
    }
}
