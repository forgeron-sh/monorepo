import type { Frame, Preset } from "../core/contract";
import { chainCellSize } from "../core/contract";
import { runCpu, toRgba } from "../core/cpu";
import { chainOf } from "../core/preset";
import { PIXEL_CONTEXT } from "./gl";
import type { GlPipeline } from "./pipeline-gl";
import { createGlPipeline } from "./pipeline-gl-ext";
import { animateCanvas, colorCache, prefersStill, type ShaderHandle } from "./surface";

/**
 * Any preset on a canvas (the gallery's pages, later the editor): it is validated, bound to every
 * definition (`chainOf`, so this mount bundles them all), and runs on the GPU when its source and
 * every pass have GLSL, on the CPU otherwise (Floyd–Steinberg, the heat), drawn at the canvas's
 * device resolution either way. The live mounts of the sites bind one side only instead.
 */

export interface PresetMountOptions {
  /** `"gpu"` or `"cpu"` forces a side (a CPU-only preset stays on the CPU). */
  side?: "gpu" | "cpu";
  /** Frames a second (60 on the GPU, 12 on the CPU by default). */
  fps?: number;
  /** Forces a still frame (`true`) or motion (`false`); the reader's preference otherwise. */
  still?: boolean;
  /** The driven values at the start. */
  inputs?: PresetInputs;
}

/** What a page drives while a preset runs; what reads it says so (`front` with `driven`). */
export interface PresetInputs {
  /** 0 to 1: the scroll, an upload's share, a step of a flow. */
  progress?: number;
}

export interface PresetHandle extends ShaderHandle {
  /** The side it runs on. */
  readonly side: "gpu" | "cpu";
  /** Sets the driven values and draws at once (a still preset stays still until it is set). */
  set(inputs: PresetInputs): void;
}

/** True when the preset's source and passes all have GLSL. */
export function runsOnGpu(preset: Preset | unknown): boolean {
  const chain = chainOf(preset);
  return chain.source.def.glsl !== null && chain.passes.every((s) => s.def.glsl !== null);
}

/** Throws a `PresetError` on an invalid preset; null where the side it needs is unavailable. */
export function mountPreset(
  canvas: HTMLCanvasElement,
  preset: Preset | unknown,
  options: PresetMountOptions = {},
): PresetHandle | null {
  const chain = chainOf(preset);
  const gpu = options.side !== "cpu" && runsOnGpu(preset);
  const win = canvas.ownerDocument.defaultView;
  const dpr = Math.min(win?.devicePixelRatio || 1, 2);
  const px = chainCellSize(chain) * dpr;
  const colors = colorCache(canvas);
  const still = prefersStill(canvas, options.still);
  const inputs: PresetInputs = { ...options.inputs };
  const size = () => {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    colors.reset();
  };

  if (gpu) {
    const gl = canvas.getContext("webgl2", PIXEL_CONTEXT);
    if (!gl) return null;
    let pipeline: GlPipeline;
    try {
      pipeline = createGlPipeline(gl, chain, { resolve: colors.resolve });
    } catch {
      return null;
    }
    const handle = animateCanvas(canvas, {
      still,
      fps: options.fps ?? 60,
      resize: size,
      draw: (t) =>
        pipeline.render({
          width: canvas.width,
          height: canvas.height,
          px,
          time: t,
          progress: inputs.progress ?? 0,
        }),
    });
    return {
      side: "gpu",
      set(next) {
        Object.assign(inputs, next);
        handle.redraw();
      },
      destroy() {
        handle.destroy();
        pipeline.dispose();
      },
    };
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let image: ImageData | null = null;
  let frame: Frame | undefined;
  const handle = animateCanvas(canvas, {
    still,
    fps: options.fps ?? 12,
    resize() {
      size();
      image = ctx.createImageData(canvas.width, canvas.height);
    },
    draw(t) {
      if (!image) return;
      frame = runCpu(
        chain,
        canvas.width,
        canvas.height,
        { px, time: t, progress: inputs.progress ?? 0, resolve: colors.resolve },
        frame,
      );
      // A chain without a present pass ends at cell resolution: draw it scaled up, cell by cell,
      // its rows counted from the bottom as on the GPU.
      if (frame.width === canvas.width && frame.height === canvas.height) {
        toRgba(frame, image.data);
        ctx.putImageData(image, 0, 0);
        return;
      }
      const cells = new ImageData(frame.width, frame.height);
      toRgba(frame, cells.data);
      const off = new OffscreenCanvas(frame.width, frame.height);
      off.getContext("2d")?.putImageData(cells, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const h = frame.height * px;
      ctx.drawImage(off, 0, canvas.height - h, frame.width * px, h);
    },
  });
  return {
    side: "cpu",
    set(next) {
      Object.assign(inputs, next);
      handle.redraw();
    },
    destroy: () => handle.destroy(),
  };
}
