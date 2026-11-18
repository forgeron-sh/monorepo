import { ditherImage, IMAGE_PALETTE, type RGB } from "@forgeron/blueprint";
import type { ShaderHandle } from "./surface";
import { readTone } from "./surface";

/**
 * The dithered image: any picture redrawn in the palette with the 4×4 Bayer matrix, five greys
 * for the structure and the ember for what glows (`ditherImage` of `@forgeron/blueprint`).
 * Whatever made the picture, it comes out in the system.
 */

export interface DitheredImageOptions {
  /** Side of one dithered pixel in CSS pixels (3 by default). */
  pixel?: number;
  /** Luminance gain before dithering (1.1 by default). */
  gain?: number;
}

const fallbackOf = (ref: (typeof IMAGE_PALETTE.greys)[number]) =>
  typeof ref === "string" ? ref : ref.fallback;
const nameOf = (ref: (typeof IMAGE_PALETTE.greys)[number]) =>
  typeof ref === "string" ? ref : ref.var;

/**
 * Loads `src`, crops it to cover the canvas, reduces it to one pixel per `pixel` CSS pixels and
 * dithers it; redraws on resize. The canvas hides itself when the picture fails to load.
 */
export function mountDitheredImage(
  canvas: HTMLCanvasElement,
  src: string,
  options: DitheredImageOptions = {},
): ShaderHandle | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const colors: { greys: RGB[]; ember: RGB } = {
    greys: IMAGE_PALETTE.greys.map((c) => readTone(canvas, nameOf(c), fallbackOf(c))),
    ember: readTone(canvas, nameOf(IMAGE_PALETTE.ember), fallbackOf(IMAGE_PALETTE.ember)),
  };
  const px = options.pixel ?? 3;
  const img = new Image();
  img.decoding = "async";
  img.onerror = () => {
    canvas.hidden = true;
  };
  const draw = () => {
    if (!img.naturalWidth) return;
    const w = Math.max(1, Math.floor(canvas.clientWidth / px));
    const h = Math.max(1, Math.floor(canvas.clientHeight / px));
    canvas.width = w;
    canvas.height = h;
    // Cover: the source cropped to the canvas ratio, centred.
    const ratio = w / h;
    let sw = img.naturalWidth;
    let sh = sw / ratio;
    if (sh > img.naturalHeight) {
      sh = img.naturalHeight;
      sw = sh * ratio;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      img,
      (img.naturalWidth - sw) / 2,
      (img.naturalHeight - sh) / 2,
      sw,
      sh,
      0,
      0,
      w,
      h,
    );
    const data = ctx.getImageData(0, 0, w, h);
    ditherImage(data.data, w, h, colors, options.gain);
    ctx.putImageData(data, 0, 0);
  };
  img.onload = draw;
  img.src = src;
  const sized = new ResizeObserver(draw);
  sized.observe(canvas);
  return {
    destroy() {
      sized.disconnect();
      img.onload = null;
    },
  };
}
