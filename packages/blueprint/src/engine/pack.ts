/**
 * Immediate mode's input: a block list of today's model packed into the layout of
 * `layout.ts` (`blocksHeader`, then one `block` record per block, then the label texts).
 */
import type { Block } from "../core/types";
import { BLOCK_FLAGS as F, BLOCKS_MAGIC, CODES, offsets, sizeOf } from "./layout";

const H = offsets("blocksHeader");
const B = offsets("block");
const HEADER = sizeOf("blocksHeader");
const WORDS = sizeOf("block");

/** Packs blocks; absent fields take the renderer's defaults (ink, a 2-pixel dot, layer 0). */
export function packBlocks(blocks: readonly Block[]): Uint8Array {
  const encoder = new TextEncoder();
  const texts: Uint8Array[] = [];
  let textLength = 0;
  const words = new Float64Array(HEADER + blocks.length * WORDS);
  words[H.magic] = BLOCKS_MAGIC;
  words[H.count] = blocks.length;
  blocks.forEach((b, k) => {
    const r = HEADER + k * WORDS;
    let flags = b.decor ? F.decor : 0;
    words[r + B.kind] = CODES.block[b.kind];
    words[r + B.layer] = b.layer ?? 0;
    words[r + B.ink] = CODES.ink.ink;
    words[r + B.size] = 2;
    const a = b.kind === "line" ? b.a : b.at;
    words[r + B.ax] = a[0];
    words[r + B.ay] = a[1];
    words[r + B.az] = a[2];
    const setB = (v: readonly number[]) => {
      words[r + B.bx] = v[0]!;
      words[r + B.by] = v[1]!;
      words[r + B.bz] = v[2]!;
    };
    switch (b.kind) {
      case "box":
        setB(b.size);
        if (b.tone) {
          flags |= F.hasTone;
          words[r + B.toneTop] = b.tone[0];
          words[r + B.toneLeft] = b.tone[1];
          words[r + B.toneRight] = b.tone[2];
        }
        if (b.accent) flags |= F.accent;
        if (b.signal) flags |= F.signal;
        if (b.alert) flags |= F.alert;
        if (b.ghost) flags |= F.ghost;
        if (b.plate) flags |= F.plate;
        if (b.vents) flags |= F.vents;
        words[r + B.floors] = b.floors ?? 0;
        break;
      case "line":
        setB(b.b);
        words[r + B.ink] = CODES.ink[b.ink ?? "ink"];
        words[r + B.dash] = b.dash ?? 0;
        break;
      case "dot":
        words[r + B.ink] = CODES.ink[b.ink ?? "ink"];
        words[r + B.size] = b.size ?? 2;
        break;
      case "label": {
        if (b.to) {
          flags |= F.hasTo;
          setB(b.to);
        }
        if (b.active) flags |= F.active;
        if (b.plain) flags |= F.plain;
        if (b.fixed) flags |= F.fixed;
        words[r + B.ink] = CODES.ink[b.ink ?? "ink"];
        const bytes = encoder.encode(b.text);
        words[r + B.text] = textLength;
        words[r + B.textLength] = bytes.length;
        texts.push(bytes);
        textLength += bytes.length;
        break;
      }
    }
    words[r + B.flags] = flags;
  });
  words[H.bytes] = textLength;
  const out = new Uint8Array(words.length * 8 + textLength);
  const view = new DataView(out.buffer);
  for (let i = 0; i < words.length; i++) view.setFloat64(i * 8, words[i]!, true);
  let at = words.length * 8;
  for (const t of texts) {
    out.set(t, at);
    at += t.length;
  }
  return out;
}
