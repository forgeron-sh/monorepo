// Images: a block with a source, an alt text and a title. The editor asks the app for the image
// (`requestImage`); the static view shows only safe sources.

import { destination, unescapeMd } from "../core/markdown-kit";
import { definePlugin } from "../core/plugin";
import { el, safeUrl, str } from "../core/view";

const IMAGE_LINE = /^!\[((?:\\.|[^\]])*)\]\((.*)\)\s*$/;

export const image = definePlugin({
  id: "image",
  name: "Image",
  description: 'A picture as a block: `![alt](src "title")`.',
  nodes: {
    image: {
      markdown: (node, w) => {
        const alt = String(node.attrs?.["alt"] ?? "").replace(/[[\]\\]/g, (c) => `\\${c}`);
        const src = w.escapeUrl(String(node.attrs?.["src"] ?? ""));
        const title = node.attrs?.["title"]
          ? ` "${String(node.attrs["title"]).replace(/["\\]/g, (c) => `\\${c}`)}"`
          : "";
        return `![${alt}](${src}${title})`;
      },
      text: (node) => String(node.attrs?.["alt"] ?? ""),
      render: (node) => {
        const src = safeUrl(node.attrs?.["src"], "image");
        if (!src) return [];
        const title = str(node.attrs?.["title"]);
        return [
          el("img", {
            src,
            alt: str(node.attrs?.["alt"]) ?? "",
            ...(title ? { title } : {}),
            loading: "lazy",
          }),
        ];
      },
    },
  },
  blocks: [
    {
      id: "image",
      label: "Image",
      keywords: ["picture", "photo", "img", "media"],
      icon: "image-03",
      group: "insert",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "image",
        priority: 40,
        read: (lines, at) => {
          const match = IMAGE_LINE.exec(lines[at] as string);
          if (!match) return undefined;
          const dest = destination(`(${match[2]})`, 0);
          if (!dest) return undefined;
          return {
            nodes: [
              {
                type: "image",
                attrs: {
                  src: dest.url,
                  alt: unescapeMd(match[1] as string),
                  ...(dest.title !== undefined ? { title: dest.title } : {}),
                },
              },
            ],
            next: at + 1,
          };
        },
      },
    ],
  },
});
