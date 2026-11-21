// Headings 1 to 3, with `#` shortcuts in Markdown and in the editor.

import { definePlugin } from "../core/plugin";
import { el } from "../core/view";
import type { BlockDef } from "../core/plugin";

const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;

const entry = (level: 1 | 2 | 3, keywords: string[]): BlockDef => ({
  id: `heading-${level}`,
  label: `Heading ${level}`,
  keywords,
  icon: `heading-0${level}`,
  group: "text",
  shortcut: "#".repeat(level),
});

const levelOf = (attrs: Record<string, unknown> | undefined) =>
  Math.min(3, Math.max(1, Number(attrs?.["level"]) || 1));

export const heading = definePlugin({
  id: "heading",
  name: "Headings",
  description: "Three levels of heading: `# Title`, `## Subtitle`, `### Section`.",
  nodes: {
    heading: {
      markdown: (node, w) =>
        `${"#".repeat(levelOf(node.attrs))} ${w.inline(node.content ?? []).replace(/\n/g, " ")}`,
      render: (node, w) => [el(`h${levelOf(node.attrs)}`, undefined, w.children(node))],
    },
  },
  blocks: [
    entry(1, ["h1", "title", "heading", "big"]),
    entry(2, ["h2", "subtitle", "heading", "medium"]),
    entry(3, ["h3", "heading", "small"]),
  ],
  markdown: {
    blocks: [
      {
        id: "heading",
        priority: 90,
        interrupts: (line) => HEADING.test(line),
        read: (lines, at, reader) => {
          const head = HEADING.exec(lines[at] as string);
          if (!head) return undefined;
          const level = Math.min(3, (head[1] as string).length);
          const content = reader.inline((head[2] as string).trim());
          return {
            nodes: [{ type: "heading", attrs: { level }, ...(content.length ? { content } : {}) }],
            next: at + 1,
          };
        },
      },
    ],
  },
});
