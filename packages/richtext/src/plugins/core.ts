// The core of the editor: the document's paragraphs, text and hard breaks. Always present; every
// other feature is a plugin.

import { definePlugin } from "../core/plugin";
import { el } from "../core/view";

export const core = definePlugin({
  id: "core",
  name: "Core",
  description: "Paragraphs, text and hard breaks: the document with nothing else.",
  nodes: {
    paragraph: {
      markdown: (node, w) => w.inline(node.content ?? []),
      render: (node, w) => [el("p", undefined, w.children(node))],
    },
    hardBreak: {
      inline: true,
      markdown: (_node, _w, inTable) => (inTable ? "<br>" : "\\\n"),
      text: () => "\n",
      render: () => [el("br")],
    },
  },
  blocks: [
    {
      id: "paragraph",
      label: "Text",
      keywords: ["paragraph", "plain", "p", "text"],
      icon: "type",
      group: "text",
    },
  ],
  markdown: {
    inline: [
      {
        chars: "<",
        read: (src, at) => {
          for (const tag of ["<br>", "<br/>", "<br />"]) {
            if (src.startsWith(tag, at)) {
              return { nodes: [{ type: "hardBreak" }], end: at + tag.length };
            }
          }
          return undefined;
        },
      },
    ],
  },
});
