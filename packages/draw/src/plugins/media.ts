// Images, core half: a picture on the board, kept in the page (an object URL or a data URL), never
// uploaded. It keeps its ratio when resized; the GPU draws it as a texture.

import type { Bounds, NewItem, Point } from "@forgeron/canvas";
import { definePlugin, type KindSpec } from "../core/plugin";
import { DrawFormatError, readCommon, str, type Raw } from "../core/parse";
import { n } from "../core/svg";
import type { DrawData, ImageData } from "../core/types";

export function imageItem(bounds: Bounds, src: string, name: string): NewItem<DrawData> {
  return { kind: "image", bounds, data: { type: "image", src, name } };
}

/** The bounds an image takes at a point: its natural size, no wider than `max`. */
export function imageBounds(at: Point, width: number, height: number, max = 480): Bounds {
  const scale = width > max ? max / width : 1;
  return {
    x: at.x,
    y: at.y,
    w: Math.max(16, Math.round(width * scale)),
    h: Math.max(16, Math.round(height * scale)),
  };
}

const imageKind: KindSpec = {
  type: "image",
  label: "Image",
  canvas: { resize: { keepAspect: true, minW: 16, minH: 16 } },
  parse(raw: Raw, at) {
    if (typeof raw.src !== "string") throw new DrawFormatError(`${at}.data.src is missing.`);
    return { type: "image", src: raw.src, name: str(raw.name, "Image"), ...readCommon(raw) };
  },
  paint(item) {
    const b = item.bounds;
    const d = item.data as ImageData;
    return [
      n("image", {
        href: d.src,
        x: b.x,
        y: b.y,
        width: b.w,
        height: b.h,
        preserveAspectRatio: "none",
      }),
    ];
  },
  // A texture on the GPU, uploaded once it has loaded.
  gpu(item, frame) {
    const d = item.data as ImageData;
    return [{ type: "image", ...item.bounds, src: d.src, ...(frame ? { clip: frame } : {}) }];
  },
  opaque: () => true,
  words: (item) => (item.data as ImageData).name,
};

export const image = definePlugin({
  id: "image",
  name: "Image",
  description: "Pictures from a file or a drop, kept in the page and never uploaded.",
  kinds: { image: imageKind },
});
