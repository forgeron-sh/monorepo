import { ditherImage, IMAGE_PALETTE, type ImagePalette } from "../core/image";
import { resolveColor } from "./colors";

export interface ImageOptions {
  /** Side of one dithered pixel, in CSS pixels (3 by default). */
  pixel?: number;
  /** Luminance gain before dithering (1.1 by default). */
  gain?: number;
  palette?: ImagePalette;
}

export interface MountedImage {
  destroy(): void;
}

/**
 * Loads `src` and draws it on the canvas, cropped to cover it, reduced to one pixel per `pixel`
 * CSS pixels and dithered in the palette; redraws on resize. On a load error the canvas hides
 * itself.
 */
export function mountImage(
  canvas: HTMLCanvasElement,
  src: string,
  options: ImageOptions = {},
): MountedImage | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const palette = options.palette ?? IMAGE_PALETTE;
  const colors = {
    greys: palette.greys.map((c) => resolveColor(canvas, c)),
    ember: resolveColor(canvas, palette.ember),
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
    // Cover: crop the source to the canvas ratio, centred.
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
