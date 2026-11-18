//! Immediate mode: a packed block list (`layout::block`, written by `packBlocks` in TypeScript)
//! read into blocks, and blocks written back to that layout (for the contract tests).

use crate::block::{Block, BlockKind};
use crate::layout::{block as B, blocks_header as H, code, BLOCKS_MAGIC};

/// Little-endian float64 word `i` of `bytes`.
#[inline]
pub fn word(bytes: &[u8], i: usize) -> f64 {
    let o = i * 8;
    let mut b = [0u8; 8];
    b.copy_from_slice(&bytes[o..o + 8]);
    f64::from_le_bytes(b)
}

fn kind_of(code: f64) -> Result<BlockKind, String> {
    match code as i32 {
        code::block::BOX => Ok(BlockKind::Box),
        code::block::LINE => Ok(BlockKind::Line),
        code::block::DOT => Ok(BlockKind::Dot),
        code::block::LABEL => Ok(BlockKind::Label),
        other => Err(format!("unknown block kind {other}")),
    }
}

/// Reads a packed block list into `out` (cleared first).
pub fn read_blocks(bytes: &[u8], out: &mut Vec<Block>) -> Result<(), String> {
    out.clear();
    if bytes.len() < H::WORDS * 8 || word(bytes, H::MAGIC) as u32 != BLOCKS_MAGIC {
        return Err("not a packed block list".into());
    }
    let count = word(bytes, H::COUNT) as usize;
    let text_len = word(bytes, H::BYTES) as usize;
    let words = H::WORDS + count * B::WORDS;
    if bytes.len() < words * 8 + text_len {
        return Err("packed block list truncated".into());
    }
    let text = &bytes[words * 8..words * 8 + text_len];
    out.reserve(count);
    for k in 0..count {
        let r = H::WORDS + k * B::WORDS;
        let w = |f: usize| word(bytes, r + f);
        let mut b = Block::new(kind_of(w(B::KIND))?);
        b.layer = w(B::LAYER);
        b.flags = w(B::FLAGS) as u32;
        b.a = [w(B::AX), w(B::AY), w(B::AZ)];
        b.b = [w(B::BX), w(B::BY), w(B::BZ)];
        b.tone = [w(B::TONE_TOP), w(B::TONE_LEFT), w(B::TONE_RIGHT)];
        b.floors = w(B::FLOORS);
        b.ink = w(B::INK) as u8;
        b.dash = w(B::DASH);
        b.size = w(B::SIZE);
        b.tag = w(B::TAG) as u16;
        if b.kind == BlockKind::Label {
            let (o, n) = (w(B::TEXT) as usize, w(B::TEXT_LENGTH) as usize);
            let s = text.get(o..o + n).ok_or("label text out of range")?;
            b.text = std::str::from_utf8(s)
                .map_err(|_| "label text is not UTF-8")?
                .to_owned();
        }
        out.push(b);
    }
    Ok(())
}

/// Writes blocks in the packed layout.
pub fn write_blocks(blocks: &[Block]) -> Vec<u8> {
    let mut text: Vec<u8> = Vec::new();
    let mut words: Vec<f64> = vec![0.0; H::WORDS + blocks.len() * B::WORDS];
    words[H::MAGIC] = BLOCKS_MAGIC as f64;
    words[H::COUNT] = blocks.len() as f64;
    for (k, b) in blocks.iter().enumerate() {
        let r = H::WORDS + k * B::WORDS;
        let kind = match b.kind {
            BlockKind::Box => code::block::BOX,
            BlockKind::Line => code::block::LINE,
            BlockKind::Dot => code::block::DOT,
            BlockKind::Label => code::block::LABEL,
        };
        let rec = &mut words[r..r + B::WORDS];
        rec[B::KIND] = kind as f64;
        rec[B::LAYER] = b.layer;
        rec[B::FLAGS] = b.flags as f64;
        rec[B::AX..=B::AZ].copy_from_slice(&b.a);
        rec[B::BX..=B::BZ].copy_from_slice(&b.b);
        rec[B::TONE_TOP..=B::TONE_RIGHT].copy_from_slice(&b.tone);
        rec[B::FLOORS] = b.floors;
        rec[B::INK] = b.ink as f64;
        rec[B::DASH] = b.dash;
        rec[B::SIZE] = b.size;
        rec[B::TAG] = b.tag as f64;
        if b.kind == BlockKind::Label {
            rec[B::TEXT] = text.len() as f64;
            rec[B::TEXT_LENGTH] = b.text.len() as f64;
            text.extend_from_slice(b.text.as_bytes());
        }
    }
    words[H::BYTES] = text.len() as f64;
    let mut out = Vec::with_capacity(words.len() * 8 + text.len());
    for w in words {
        out.extend_from_slice(&w.to_le_bytes());
    }
    out.extend_from_slice(&text);
    out
}
