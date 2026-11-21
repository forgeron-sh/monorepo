/**
 * The pixel effects of the site's pages, loaded by `canvas.ts` when their canvas comes near the
 * screen (`whenNear`), so a page's start carries none of their code (docs/shaders/design.md, S2c
 * notes). Their options are the canvas's attributes, documented in `canvas.ts`.
 */
import { type ColorRef, type FieldMode, FIELD_MODES } from "@forgeron/blueprint";
import { mountField, mountImage } from "@forgeron/blueprint/dom";

const token = (name: string, fallback: string): ColorRef => ({ var: name, fallback });

const isField = (name: string | undefined): name is FieldMode =>
  name !== undefined && name in FIELD_MODES;

/** Mounts the effect a canvas names: a dithered picture (`data-dither-img`) or a field (`data-shader`). */
export function mountEffect(c: HTMLCanvasElement): void {
  if (c.dataset.ditherImg) {
    mountImage(c, c.dataset.ditherImg, {
      pixel: Number(c.dataset.px ?? 3),
      gain: Number(c.dataset.gain ?? 1.1),
    });
  }
  if (c.dataset.shader === undefined) return;
  const { shader, px, accent, bg, ink } = c.dataset;
  mountField(c, {
    mode: isField(shader) ? shader : "ember",
    pixel: Number(px ?? 4),
    accent: accent !== "off",
    colors: {
      ...(bg ? { bg: token(bg, "#0a0a0a") } : {}),
      ...(ink ? { ink: token(ink, "#ededed") } : {}),
    },
  });
}
