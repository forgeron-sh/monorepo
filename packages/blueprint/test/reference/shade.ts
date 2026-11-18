import { bayer } from "./bayer";
import type { Plan } from "./filters";
import { type Frame, isLabel, isShaded, Slot } from "./frame";

/**
 * Resolves every pixel to a palette slot (`frame.color`). Faces and fields are the only pixels
 * whose tone is read: dithered (tone above the Bayer threshold → their ink, else bg) or flat
 * (tone ≥ 0.5). Edges, details, dots and labels keep their ink: a dither cannot reach them.
 */
export function shade(f: Frame, p: Pick<Plan, "dither" | "glow">): void {
  const { width, height, material, ink, tone, color } = f;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const m = material[i] ?? 0;
      if (m === 0) color[i] = Slot.None;
      else if (isShaded(m)) {
        const t = tone[i] ?? 0;
        const on = p.dither ? t > bayer(x, y, p.dither) : t >= 0.5;
        color[i] = on ? (ink[i] ?? Slot.Ink) : Slot.Bg;
      } else color[i] = ink[i] ?? Slot.Ink;
    }
  }
  if (p.glow) halo(f, p.glow.radius, p.glow.density);
}

/**
 * A dithered halo around accent and signal pixels: empty and bg pixels within `radius` light up
 * in the colour of their source, sparser further away. Labels are left alone. The halo stays
 * inside the palette, so the SVG and the canvas agree.
 */
function halo(f: Frame, radius: number, density: number): void {
  const { width, height, material, color } = f;
  const source = color.slice();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const c = color[i] ?? 0;
      if (c !== Slot.None && c !== Slot.Bg) continue;
      if (isLabel(material[i] ?? 0)) continue;
      let best = 0;
      let from: number = Slot.None;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width || (dx === 0 && dy === 0)) continue;
          const s = source[yy * width + xx];
          if (s !== Slot.Accent && s !== Slot.Signal && s !== Slot.Alert) continue;
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          const strength = density * (1 - (d - 1) / radius);
          if (strength > best) {
            best = strength;
            from = s;
          }
        }
      }
      if (best > 0 && best > bayer(x, y, 4)) color[i] = from;
    }
  }
}
