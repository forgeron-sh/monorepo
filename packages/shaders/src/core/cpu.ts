import { type ColorRef, resolveRef, type RGB } from "./color";
import {
  chainCellSize,
  type CpuChain,
  type CpuContext,
  createFrame,
  type Frame,
  type Inputs,
} from "./contract";

/** What a CPU run reads besides the preset; every field has a default. */
export interface CpuInputs extends Partial<Omit<Inputs, "res">> {
  /** Colour references as RGB; literals and fallbacks only by default (no page to read). */
  resolve?: (ref: ColorRef) => RGB;
}

/**
 * Runs a chain on the CPU over `width × height` device pixels. Cells are `px` device pixels
 * (the chain's `pixelate` by default) and the frame is one value per cell, row 0 at the top,
 * until a `present` pass: it returns a frame of one value per device pixel (`perPixel`), as the
 * GPU's last stage. Pass `frame` to reuse its memory when the size is the same.
 */
export function runCpu(
  chain: CpuChain,
  width: number,
  height: number,
  inputs: CpuInputs = {},
  frame?: Frame,
): Frame {
  const px = inputs.px ?? chainCellSize(chain);
  const cols = Math.max(1, Math.ceil(width / px));
  const rows = Math.max(1, Math.ceil(height / px));
  const ctx: CpuContext = {
    time: inputs.time ?? 0,
    mouse: inputs.mouse ?? [0.5, 0.2],
    progress: inputs.progress ?? 0,
    res: [width, height],
    px,
    ...(inputs.data ? { data: inputs.data } : {}),
    resolve: inputs.resolve ?? ((ref) => resolveRef(ref)),
  };
  let f = frame && frame.width === cols && frame.height === rows ? frame : createFrame(cols, rows);
  chain.source.def.cpu(f, chain.source.params as never, ctx);
  for (const { def, params } of chain.passes) f = def.cpu(f, params as never, ctx) ?? f;
  return f;
}

/**
 * The frame at output resolution (`ctx.res`) for a `present` pass, as the GPU's last stage reads
 * its cells: pixel `(x, y)` takes the cell `floor((x + 0.5) / px)`, its row counted from the
 * bottom. A frame already at output resolution is returned as it is.
 */
export function perPixel(cells: Frame, ctx: CpuContext): Frame {
  const [width, height] = ctx.res;
  const { px } = ctx;
  if (cells.width === width && cells.height === height) return cells;
  const out = createFrame(width, height);
  const { width: cols, height: rows, data } = cells;
  for (let y = 0; y < height; y++) {
    const cy = rows - 1 - Math.floor((height - 1 - y + 0.5) / px);
    for (let x = 0; x < width; x++) {
      const cx = Math.floor((x + 0.5) / px);
      const i = (Math.min(rows - 1, Math.max(0, cy)) * cols + Math.min(cols - 1, cx)) * 4;
      const o = (y * width + x) * 4;
      out.data[o] = data[i] ?? 0;
      out.data[o + 1] = data[i + 1] ?? 0;
      out.data[o + 2] = data[i + 2] ?? 0;
      out.data[o + 3] = data[i + 3] ?? 0;
    }
  }
  return out;
}

/** RGBA bytes of a frame of colours (after a `palette`), row by row. */
export function toRgba(frame: Frame, out?: Uint8ClampedArray): Uint8ClampedArray {
  const data = out ?? new Uint8ClampedArray(frame.width * frame.height * 4);
  const src = frame.data;
  for (let i = 0; i < src.length; i++) data[i] = Math.round((src[i] ?? 0) * 255);
  return data;
}

/** Tone indices of a frame (`r`), row by row. */
export function toTones(frame: Frame, out?: Uint8Array): Uint8Array {
  const tones = out ?? new Uint8Array(frame.width * frame.height);
  for (let i = 0; i < tones.length; i++) tones[i] = frame.data[i * 4] ?? 0;
  return tones;
}

/** Which cells `toSvgPath` draws, and how large. */
export interface SvgPathOptions {
  /** Tone indices up to this one (all from `min` by default). */
  max?: number;
  /** Side of a cell in path units (1 by default: viewBox `0 0 width height`). */
  cell?: number;
}

/**
 * A static SVG path of the cells whose tone index is `min` or more, one unit each
 * (viewBox `0 0 width height`), row by row: no canvas, no JavaScript.
 */
export function toSvgPath(frame: Frame, min = 1, options: SvgPathOptions = {}): string {
  const { max = Infinity, cell = 1 } = options;
  const parts: string[] = [];
  for (let y = 0; y < frame.height; y++)
    for (let x = 0; x < frame.width; x++) {
      const tone = frame.data[(y * frame.width + x) * 4] ?? 0;
      if (tone >= min && tone <= max)
        parts.push(`M${x * cell} ${y * cell}h${cell}v${cell}h-${cell}z`);
    }
  return parts.join("");
}

/** The value at `(x, y)` of a frame, clamped to its edges (as `prevAt`). */
export const valueAt = (frame: Frame, x: number, y: number, channel = 0): number => {
  const cx = Math.min(frame.width - 1, Math.max(0, x));
  const cy = Math.min(frame.height - 1, Math.max(0, y));
  return frame.data[(cy * frame.width + cx) * 4 + channel] ?? 0;
};
