import type { PluginDoc } from "./types";

export const mediaDocs: ReadonlyArray<PluginDoc> = [
  {
    id: "image",
    family: "media",
    name: "Image",
    summary: "Pictures from a file or a drop, kept in the page and never uploaded.",
    core: "@forgeron/draw/plugins/media",
    editor: "@forgeron/draw/plugins/editor/media",
    json: `{
  "id": "i1",
  "kind": "image",
  "bounds": { "x": 600, "y": 140, "w": 240, "h": 160 },
  "z": 3,
  "data": { "type": "image", "src": "data:image/png;base64,...", "name": "photo.png" }
}`,
    notes: [
      "An object URL lives as long as the page: a board saved for later needs data URLs. Exports inline the images.",
      "The dock gets an Image button and the editor accepts dropped image files.",
    ],
    usage: `import { image } from "@forgeron/draw/plugins/editor/media";
const plugins = [rectangle, image];`,
  },
];
