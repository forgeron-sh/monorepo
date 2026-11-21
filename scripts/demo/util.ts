// Small helpers of the demo documents: a seeded random generator and a PNG encoder for the
// generated images (data URLs). No dependency beyond `node:zlib`.
import { deflateSync } from "node:zlib";

/** mulberry32: the same seed always gives the same sequence. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** A float in [a, b). */
    range: (lo: number, hi: number) => lo + next() * (hi - lo),
    /** An integer in [a, b]. */
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T>(list: ReadonlyArray<T>): T => list[Math.floor(next() * list.length)]!,
    chance: (p: number) => next() < p,
    shuffle: <T>(list: ReadonlyArray<T>): T[] => {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
  };
}

export type Rand = ReturnType<typeof seeded>;

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** A small RGB raster painted with filled rectangles, written as a PNG data URL. */
export class Raster {
  readonly px: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
    background: number,
  ) {
    this.px = new Uint8Array(w * h * 3);
    this.rect(0, 0, w, h, background);
  }

  rect(x: number, y: number, w: number, h: number, color: number): this {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
        const k = (j * this.w + i) * 3;
        this.px[k] = r;
        this.px[k + 1] = g;
        this.px[k + 2] = b;
      }
    return this;
  }

  dataUrl(): string {
    const head = new Uint8Array(13);
    const view = new DataView(head.buffer);
    view.setUint32(0, this.w);
    view.setUint32(4, this.h);
    head.set([8, 2, 0, 0, 0], 8); // 8 bits, truecolour, deflate, no filter method, no interlace
    const raw = new Uint8Array(this.h * (1 + this.w * 3));
    for (let y = 0; y < this.h; y++)
      raw.set(this.px.subarray(y * this.w * 3, (y + 1) * this.w * 3), y * (1 + this.w * 3) + 1);
    const parts = [
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", head),
      chunk("IDAT", new Uint8Array(deflateSync(raw, { level: 9 }))),
      chunk("IEND", new Uint8Array()),
    ];
    const png = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
    let at = 0;
    for (const p of parts) {
      png.set(p, at);
      at += p.length;
    }
    return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
  }
}
