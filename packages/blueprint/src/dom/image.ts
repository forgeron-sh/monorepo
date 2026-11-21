import { mountDitheredImage } from "@forgeron/shaders/dom";
import type { ImagePalette } from "../core/image";

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
 * itself. `mountDitheredImage` of `@forgeron/shaders/dom`.
 */
export function mountImage(
  canvas: HTMLCanvasElement,
  src: string,
  options: ImageOptions = {},
): MountedImage | null {
  return mountDitheredImage(canvas, src, { ...options, willReadFrequently: false });
}
