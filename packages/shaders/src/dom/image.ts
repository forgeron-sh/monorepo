import { ditherImage, IMAGE_PALETTE, type ImagePalette } from "../core/passes/image-dither";
import { resolveColor, type ShaderHandle } from "./surface";

export interface DitheredImageOptions {
  /** Side of one dithered pixel in CSS pixels (3 by default). */
  pixel?: number;
  /** Luminance gain before dithering (1.1 by default). */
  gain?: number;
  /** The greys and the ember (the site's tokens by default). */
  palette?: ImagePalette;
  /** Asks for a CPU-backed 2D context (true by default; Blueprint's `mountImage` asked without). */
  willReadFrequently?: boolean;
}

/**
 * The dithered image (`ditheredImagePreset`, on the CPU, through `ditherImage`): loads `src`, crops it to cover the
 * canvas, reduces it to one pixel per `pixel` CSS pixels and dithers it; redraws on resize. The
 * canvas hides itself when the picture fails to load.
 */
export function mountDitheredImage(
  canvas: HTMLCanvasElement,
  src: string,
  options: DitheredImageOptions = {},
): ShaderHandle | null {
  const ctx =
    options.willReadFrequently === false
      ? canvas.getContext("2d")
      : canvas.getContext("2d", { willReadFrequently: true });
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
