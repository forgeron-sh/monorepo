// Columns, core half: 2 to 4 columns of blocks side by side. In Markdown the columns follow one
// another, each after an HTML comment that no reader shows, so the content stays readable in any
// reader and this plugin reads the comments back into columns. The static view is a grid that
// folds to one column when the container is narrow (a container query, see `layout.css`).

import type { RichNode } from "../core/types";
import { definePlugin } from "../core/plugin";
import { el } from "../core/view";

/** What a columns block can hold: the schema accepts any count, the editor keeps to these. */
export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 4;

const START = /^\s*<!--\s*columns\s*-->\s*$/i;
const SPLIT = /^\s*<!--\s*column\s*-->\s*$/i;
const END = /^\s*<!--\s*\/columns\s*-->\s*$/i;

/** A `columns` node with `count` empty columns, what the slash entries insert. */
export function emptyColumns(count: number): RichNode {
  const n = Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, Math.round(count)));
  return {
    type: "columns",
    content: Array.from({ length: n }, () => ({
      type: "column",
      content: [{ type: "paragraph" }],
    })),
  };
}

const entry = (count: number) => ({
  id: `columns-${count}`,
  label: `${count} columns`,
  keywords: ["columns", "layout", "side by side", "grid", "split", `${count}`],
  icon: count === 2 ? "layout-2-column" : "layout-3-column",
  group: "insert" as const,
});

export const columns = definePlugin({
  id: "columns",
  name: "Columns",
  description:
    "Two to four columns of blocks side by side; they stack on a narrow container. Markdown: the columns one after the other, each after `<!-- column -->`.",
  nodes: {
    columns: {
      markdown: (node, w) => {
        const parts = (node.content ?? []).map((column) => w.blocks(column.content ?? []));
        const body = parts.map((part, i) => `${i ? "<!-- column -->\n\n" : ""}${part}`.trimEnd());
        return `<!-- columns -->\n\n${body.join("\n\n")}\n\n<!-- /columns -->`;
      },
      render: (node, w) => [
        el("div", { class: "fg-rt-columns", "data-type": "columns" }, [
          el("div", { class: "fg-rt-columns-grid" }, w.children(node)),
        ]),
      ],
    },
    column: {
      fillEmpty: true,
      render: (node, w) => [
        el("div", { class: "fg-rt-column", "data-type": "column" }, w.children(node)),
      ],
    },
  },
  blocks: [entry(2), entry(3), entry(4)],
  markdown: {
    blocks: [
      {
        id: "columns",
        priority: 80,
        interrupts: (line) => START.test(line),
        read: (lines, at, reader) => {
          if (!START.test(lines[at] as string)) return undefined;
          const parts: string[][] = [[]];
          let depth = 1;
          let i = at + 1;
          for (; i < lines.length; i++) {
            const line = lines[i] as string;
            if (START.test(line)) depth++;
            else if (END.test(line) && --depth === 0) break;
            else if (SPLIT.test(line) && depth === 1) {
              parts.push([]);
              continue;
            }
            (parts[parts.length - 1] as string[]).push(line);
          }
          // No closing comment: not a columns block, the comment lines stay as they are.
          if (depth !== 0) return undefined;
          return {
            nodes: [
              {
                type: "columns",
                content: parts.map((part) => {
                  const content = reader.blocks(part);
                  return {
                    type: "column",
                    content: content.length ? content : [{ type: "paragraph" }],
                  };
                }),
              },
            ],
            next: i + 1,
          };
        },
      },
    ],
  },
});
