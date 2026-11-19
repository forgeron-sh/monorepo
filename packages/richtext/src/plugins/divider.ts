// A horizontal rule: `---` in Markdown, a divider in the slash menu.

import { definePlugin } from "../core/plugin";
import { el } from "../core/view";

const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;

export const horizontalRule = definePlugin({
  id: "horizontalRule",
  name: "Divider",
  description: "A horizontal rule between two blocks: `---`.",
  nodes: {
    horizontalRule: {
      markdown: () => "---",
      text: () => "",
      render: () => [el("hr")],
    },
  },
  blocks: [
    {
      id: "divider",
      label: "Divider",
      keywords: ["hr", "rule", "line", "separator"],
      icon: "minus",
      group: "insert",
      shortcut: "---",
    },
  ],
  markdown: {
    blocks: [
      {
        id: "horizontalRule",
        priority: 80,
        interrupts: (line) => RULE.test(line),
        read: (lines, at) =>
          RULE.test(lines[at] as string)
            ? { nodes: [{ type: "horizontalRule" }], next: at + 1 }
            : undefined,
      },
    ],
  },
});
