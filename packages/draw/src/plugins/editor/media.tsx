// Images, editor half: the image button of the dock (a file picker), dropping image files on the
// board, and inlining the images as data URLs before an export (an SVG drawn as an image loads
// nothing). Images stay in the DOM when the board is seen from far.

import { screenToWorld, type Point } from "@forgeron/canvas";
import { Image01Icon } from "@forgeron/icons";
import type { DrawItem } from "../../core/types";
import { defineEditorPlugin, type EditorContext } from "../../react/plugin";
import { image as imageCore, imageBounds, imageItem } from "../media";

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** The images of the items as data URLs, so the SVG holds them. */
export async function inlineImages(items: ReadonlyArray<DrawItem>): Promise<DrawItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.data.type !== "image" || item.data.src.startsWith("data:")) return item;
      try {
        const blob = await (await fetch(item.data.src)).blob();
        return { ...item, data: { ...item.data, src: await blobToDataUrl(blob) } };
      } catch {
        return item;
      }
    }),
  );
}

/** Adds an image file to the board, at a point or in the middle of the view, and selects it. */
export function addImage(ctx: EditorContext, file: File, at?: Point) {
  if (!file.type.startsWith("image/")) return;
  const store = ctx.store;
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const s = store.getState();
    const where =
      at ??
      screenToWorld(s.viewport, {
        x: s.size.w / 2 - Math.min(img.naturalWidth, 480) / 2,
        y: s.size.h / 2 - 120,
      });
    const [item] = store.add(
      imageItem(
        imageBounds(where, img.naturalWidth || 320, img.naturalHeight || 240),
        src,
        file.name,
      ),
      { label: "Add image" },
    );
    if (item) store.select([item.id]);
  };
  img.onerror = () => URL.revokeObjectURL(src);
  img.src = src;
}

export const image = defineEditorPlugin({
  core: imageCore,
  toolbar: [
    {
      id: "image",
      label: "Image",
      icon: Image01Icon,
      run(ctx) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.hidden = true;
        const done = () => input.remove();
        input.onchange = () => {
          const f = input.files?.[0];
          if (f) addImage(ctx, f);
          done();
        };
        input.addEventListener("cancel", done);
        (ctx.root() ?? document.body).append(input);
        input.click();
      },
    },
  ],
  drop: {
    accept: (file) => file.type.startsWith("image/"),
    add: addImage,
  },
  prepareExport: inlineImages,
});
