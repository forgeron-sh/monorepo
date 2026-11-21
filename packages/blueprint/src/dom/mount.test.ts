// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { box, pixelate, type SceneFn } from "../index";
import { mount } from "./mount";

/** A canvas whose 2D context records `putImageData`, at a given CSS size (jsdom lays nothing out). */
function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { value: width });
  Object.defineProperty(canvas, "clientHeight", { value: height });
  const puts: ImageData[] = [];
  const ctx = {
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
    putImageData: (img: ImageData) => puts.push(img),
  };
  canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
  return { canvas, puts };
}

const scene = { blocks: [box([0, 0, 0], [4, 4, 4], { accent: true })] };

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("style");
});

describe("mount", () => {
  it("sizes the canvas to the raster and draws a static scene once", () => {
    const { canvas, puts } = canvasOf(300, 150);
    const onDraw = vi.fn<() => void>();
    const m = mount(canvas, scene, { filters: [pixelate(3)], onDraw, reducedMotion: true });
    expect([canvas.width, canvas.height]).toEqual([100, 50]);
    expect(canvas.style.imageRendering).toBe("pixelated");
    expect(onDraw).toHaveBeenCalledTimes(1);
    expect([puts[0]?.width, puts[0]?.height]).toEqual([100, 50]);
    m.destroy();
  });

  it("reads the palette from CSS variables on the canvas", () => {
    document.documentElement.style.setProperty("--accent", "#00ff00");
    const { canvas, puts } = canvasOf(120, 120);
    document.body.append(canvas);
    mount(canvas, scene, { filters: [pixelate(2)], reducedMotion: true }).destroy();
    const data = puts[0]?.data ?? new Uint8ClampedArray();
    let green = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] === 0 && data[i + 1] === 255) green++;
    expect(green).toBeGreaterThan(0);
    canvas.remove();
  });

  it("draws a single frame at t = 0 under reduced motion, and reports the cycled index", () => {
    const { canvas } = canvasOf(200, 200);
    const seen: number[] = [];
    const animated: SceneFn = ({ t }) => {
      seen.push(t);
      return scene;
    };
    const onActive = vi.fn<(active: number) => void>();
    mount(canvas, animated, {
      reducedMotion: true,
      cycle: { every: 1, count: 5 },
      onActive,
    }).destroy();
    expect(seen.every((t) => t === 0)).toBe(true);
    expect(onActive).toHaveBeenCalledWith(0);
  });

  it("draws nothing until the canvas is on screen", () => {
    let callback: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { canvas, puts } = canvasOf(200, 200);
    const m = mount(canvas, scene, { reducedMotion: true });
    expect(puts).toHaveLength(0);
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(puts).toHaveLength(1);
    m.destroy();
  });

  it("redraws at once after a resize, even off screen, so a cleared canvas is never left blank", () => {
    let resized: ResizeObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          resized = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { canvas, puts } = canvasOf(200, 200);
    const m = mount(canvas, scene, { reducedMotion: true });
    expect(puts).toHaveLength(0);
    resized([], {} as ResizeObserver);
    expect(puts).toHaveLength(1);
    m.destroy();
  });

  it("upscales itself under a grid, leaving the gaps transparent", () => {
    const { canvas, puts } = canvasOf(100, 100);
    mount(canvas, scene, {
      filters: [pixelate(5), { type: "grid" }],
      reducedMotion: true,
    }).destroy();
    expect([canvas.width, canvas.height]).toEqual([100, 100]);
    const img = puts[0];
    expect(img?.width).toBe(100);
    // floor(5 × 0.84) = 4: in every painted cell, column and row 4 stay transparent.
    const data = img?.data ?? new Uint8ClampedArray();
    const alpha = (x: number, y: number) => data[(y * 100 + x) * 4 + 3];
    let painted = 0;
    for (let j = 0; j < 20; j++)
      for (let i = 0; i < 20; i++) {
        if (alpha(i * 5, j * 5) !== 255) continue;
        painted++;
        expect(alpha(i * 5 + 3, j * 5 + 3)).toBe(255);
        expect(alpha(i * 5 + 4, j * 5)).toBe(0);
        expect(alpha(i * 5, j * 5 + 4)).toBe(0);
      }
    expect(painted).toBeGreaterThan(10);
  });
});
