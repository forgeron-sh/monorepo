// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { box, pixelate } from "../index";
import { readBlueprint } from "../format/read";
import type { BlueprintFile } from "../format/types";
import { play } from "./play";

/** A canvas whose 2D context records `putImageData`, at a given CSS size (jsdom lays nothing out). */
function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  Object.defineProperty(canvas, "clientWidth", { value: width });
  Object.defineProperty(canvas, "clientHeight", { value: height });
  const puts: { data: ArrayLike<number> }[] = [];
  const ctx = {
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
    putImageData: (img: { data: ArrayLike<number> }) => puts.push(img),
  };
  canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
  return { canvas, puts };
}

const lit = (data: ArrayLike<number>) => {
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i]) n++;
  return n;
};

const file: BlueprintFile = {
  $schema: "https://blueprint.forgeron.sh/schema/v1.json",
  version: 1,
  id: "test/play",
  parts: {
    sign: {
      prims: [
        { kind: "box", at: [0, 0, 0], size: [4, 4, 4], look: "accent", tag: "sign" },
        { kind: "label", at: [2, 2, 6], text: "Sign" },
      ],
    },
  },
  scenes: {
    s: {
      title: "A sign",
      description: "One box and its label.",
      depth: "painter",
      camera: { view: 0, fit: {} },
      root: { instances: [{ use: "sign" }] },
      vars: { pointer: { type: "pointer" } },
    },
  },
};

describe("play", () => {
  it("plays a script scene through the 2D presenter, one engine call per frame", () => {
    const { canvas, puts } = canvasOf(80, 60);
    const p = play(canvas, () => ({ blocks: [box([0, 0, 0], [4, 4, 4], { accent: true })] }), {
      filters: [pixelate(2)],
      reducedMotion: true,
    });
    expect([canvas.width, canvas.height]).toEqual([40, 30]);
    expect(puts.length).toBe(1); // jsdom has no IntersectionObserver: drawn at once
    expect(lit(puts[0]!.data)).toBeGreaterThan(0);
    p.draw(0);
    expect(p.scene.frameCalls).toBe(2);
    p.destroy();
  });

  it("plays a data scene with its overlay, and gives it back on destroy", async () => {
    const lib = await readBlueprint(file, { location: "play.bp.json" });
    const { canvas, puts } = canvasOf(80, 60);
    const hovered: string[] = [];
    const p = play(canvas, { lib, scene: "s" }, { reducedMotion: true });
    p.on("hover", (_, tag) => hovered.push(tag));
    expect(canvas.getAttribute("role")).toBe("img");
    expect(canvas.getAttribute("aria-label")).toBe("A sign. One box and its label.");
    const list = document.getElementById(canvas.getAttribute("aria-describedby")!);
    expect(list?.textContent).toBe("Sign");
    expect(lit(puts[0]!.data)).toBeGreaterThan(0);
    // Hover is a lookup in the tag buffer of the last frame.
    const { width, height } = p.scene.size;
    const tags = p.scene.tags;
    let at = -1;
    for (let i = 0; i < tags.length; i++) if (tags[i]) at = i;
    expect(at).toBeGreaterThanOrEqual(0);
    p.scene.pointer(at % width, Math.floor(at / width));
    p.draw(0);
    expect(hovered).toEqual(["sign"]);
    p.scene.pointer(null);
    p.draw(0);
    expect(hovered).toEqual(["sign", ""]);
    expect(height).toBe(60); // no `pixelate`: one raster pixel per CSS pixel
    p.destroy();
    expect(canvas.hasAttribute("role")).toBe(false);
    expect(document.getElementById(list!.id)).toBeNull();
  });
});
