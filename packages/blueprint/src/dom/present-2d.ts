/**
 * The 2D-canvas presenter (docs/blueprint/engine.md §3, "Presenters"), the default for page
 * canvases: the engine paints RGBA inside its frame call (`palette` on the scene), this puts it
 * on the canvas with `putImageData`, from an `ImageData` over the module's memory (no copy, no
 * allocation per frame). With a grid gap it upscales by the pixel size into a reused buffer.
 */
import { gridCell } from "../core/svg";

/** What a presenter reads from a scene handle. */
export interface Presentable {
  readonly size: { width: number; height: number };
  readonly slots: Uint8Array;
  readonly rgba: Uint8ClampedArray | null;
}

export interface Presenter {
  readonly kind: "2d" | "webgl2";
  /** Sizes the canvas for a raster of `width` × `height` drawn at `pixel` CSS pixels, with a grid `gap`. */
  resize(width: number, height: number, pixel: number, gap: number): void;
  /** Puts the scene's last frame on the canvas. */
  present(scene: Presentable): void;
  dispose(): void;
}

export function present2d(canvas: HTMLCanvasElement): Presenter {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let pixel = 1;
  let gap = 0;
  let image: ImageData | null = null;
  let source: Uint8ClampedArray | null = null;
  let scaled: ImageData | null = null;

  return {
    kind: "2d",
    resize(w, h, px, g) {
      width = w;
      height = h;
      pixel = px;
      gap = g;
      const scale = gap > 0 ? pixel : 1;
      canvas.width = w * scale;
      canvas.height = h * scale;
      canvas.style.imageRendering = "pixelated";
      image = null;
      source = null;
      scaled = null;
    },
    present(scene) {
      const rgba = scene.rgba;
      if (!ctx || !rgba || width === 0 || height === 0) return;
      if (gap > 0) {
        const cell = gridCell(pixel, gap);
        const W = width * pixel;
        scaled ??= ctx.createImageData(W, height * pixel);
        const out = scaled.data;
        out.fill(0);
        for (let y = 0; y < height; y++)
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (!rgba[i + 3]) continue;
            for (let dy = 0; dy < cell; dy++)
              for (let dx = 0; dx < cell; dx++) {
                const o = ((y * pixel + dy) * W + x * pixel + dx) * 4;
                out[o] = rgba[i]!;
                out[o + 1] = rgba[i + 1]!;
                out[o + 2] = rgba[i + 2]!;
                out[o + 3] = 255;
              }
          }
        ctx.putImageData(scaled, 0, 0);
        return;
      }
      if (source !== rgba || !image) {
        source = rgba;
        // An ImageData over the module's memory where the browser allows it, else a copy.
        try {
          image = new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height);
        } catch {
          image = ctx.createImageData(width, height);
        }
      }
      if (image.data !== rgba) image.data.set(rgba);
      ctx.putImageData(image, 0, 0);
    },
    dispose() {
      image = null;
      source = null;
      scaled = null;
    },
  };
}
